import { all, get, run } from '../lib/db.js';
import { AppError, tidakDitemukan, tanggalHariIni } from '../lib/errors.js';
import { tebakSatuanDasar, normalisasiSatuan, SATUAN_DASAR, keSatuanDasar } from '../domain/satuan.js';
import { cocokkanKomoditas } from '../domain/komoditas.js';
import { bandingNama, rapikanNama } from '../domain/pencocokan.js';
import { hargaRataRata, selisihPersen, statusAcuan } from '../domain/harga.js';
import { acuanPerSatuanDasar, riwayatAcuan } from './hargaPasar.js';

const kunci = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');

// Bahan yang sama persis (setelah ejaan dirapikan) atau pernah dikonfirmasi lewat alias.
// Bahan yang hanya mirip TIDAK dipakai di sini: itu keputusan pengguna di halaman periksa.
function cariPersis(usahaId, nama) {
  const alias = get(
    'SELECT b.* FROM alias_bahan a JOIN bahan b ON b.id = a.bahan_id WHERE a.usaha_id = ? AND a.istilah = ?',
    usahaId,
    kunci(nama),
  );
  if (alias) return alias;
  return all('SELECT * FROM bahan WHERE usaha_id = ?', usahaId).find((b) => bandingNama(b.nama, nama) === 'persis') ?? null;
}

export function cariAtauBuatBahan(usahaId, nama, satuanContoh) {
  const n = kunci(nama);
  const ada = cariPersis(usahaId, n);
  if (ada) return ada;
  const satuanDasar = tebakSatuanDasar(n, satuanContoh);
  const { lastInsertRowid } = run(
    'INSERT INTO bahan (usaha_id, nama, satuan_dasar, komoditas) VALUES (?, ?, ?, ?)',
    usahaId,
    n,
    satuanDasar,
    cocokkanKomoditas(n),
  );
  return get('SELECT * FROM bahan WHERE id = ?', lastInsertRowid);
}

/**
 * Mencocokkan nama bahan (dari nota, ucapan, atau resep) ke bahan milik usaha.
 * Urutan: alias tersimpan → nama sama setelah dirapikan → nama mirip → komoditas PIHPS sama.
 * cara 'alias' dan 'nama' aman dihubungkan langsung; 'mirip' dan 'komoditas' hanya saran
 * yang harus dilihat pengguna (gula merah tidak boleh diam-diam masuk ke gula pasir).
 */
export function cocokkanBahan(usahaId, teksAsli, namaBahan) {
  for (const istilah of [teksAsli, namaBahan]) {
    if (!istilah) continue;
    const alias = get(
      'SELECT b.* FROM alias_bahan a JOIN bahan b ON b.id = a.bahan_id WHERE a.usaha_id = ? AND a.istilah = ?',
      usahaId,
      kunci(istilah),
    );
    if (alias) return { bahan: alias, cara: 'alias' };
  }

  const semua = all('SELECT * FROM bahan WHERE usaha_id = ?', usahaId);
  const persis = semua.find((b) => bandingNama(b.nama, namaBahan) === 'persis');
  if (persis) return { bahan: persis, cara: 'nama' };
  // Dari yang mirip, pilih nama terdekat panjangnya (dada ayam → ayam, bukan ayam goreng tepung).
  const mirip = semua
    .filter((b) => bandingNama(b.nama, namaBahan) === 'mirip')
    .sort((a, b) => Math.abs(a.nama.length - namaBahan.length) - Math.abs(b.nama.length - namaBahan.length))[0];
  if (mirip) return { bahan: mirip, cara: 'mirip' };
  const komoditas = cocokkanKomoditas(rapikanNama(namaBahan));
  const samaKomoditas = komoditas && semua.find((b) => b.komoditas === komoditas);
  if (samaKomoditas) return { bahan: samaKomoditas, cara: 'komoditas' };
  return { bahan: null, cara: null };
}

/**
 * Status tiap nama bahan di resep sebelum disimpan, untuk ditampilkan di halaman periksa menu.
 * terhubung: memakai bahan yang ada (beserta harganya); mirip: ada bahan serupa, pengguna memilih;
 * baru: akan dibuat sebagai bahan baru.
 */
export function statusNamaResep(usaha, daftarNama, petaHargaUsaha) {
  return daftarNama.map((nama) => {
    const n = String(nama || '').trim();
    if (!n) return { nama: n, status: 'kosong' };
    const { bahan, cara } = cocokkanBahan(usaha.id, n, n);
    if (!bahan) return { nama: n, status: 'baru', komoditas: cocokkanKomoditas(rapikanNama(n)) };
    const h = petaHargaUsaha.get(bahan.id);
    const info = {
      id: bahan.id,
      nama: bahan.nama,
      satuan_dasar: bahan.satuan_dasar,
      harga: h ? hargaTampilBahan(h.harga, bahan.satuan_dasar) : null,
      sumber_harga: h?.sumber ?? null,
    };
    return { nama: n, status: cara === 'alias' || cara === 'nama' ? 'terhubung' : 'mirip', bahan: info };
  });
}

function hargaTampilBahan(hargaPerDasar, satuanDasar) {
  if (satuanDasar === 'g') return { harga: Math.round(hargaPerDasar * 1000), satuan: 'kg' };
  if (satuanDasar === 'ml') return { harga: Math.round(hargaPerDasar * 1000), satuan: 'liter' };
  return { harga: Math.round(hargaPerDasar), satuan: satuanDasar };
}

/**
 * Gabungkan bahan ganda (misal "cabe" ke "cabai rawit"): riwayat harga, resep, baris nota,
 * alias, dan konversi pindah ke bahan tujuan; nama lama dicatat sebagai alias; bahan lama dihapus.
 */
export function gabungBahan(usaha, dariId, keId) {
  if (dariId === keId) throw new AppError(400, 'Pilih bahan lain sebagai tujuan');
  const dari = get('SELECT * FROM bahan WHERE id = ? AND usaha_id = ?', dariId, usaha.id);
  const ke = get('SELECT * FROM bahan WHERE id = ? AND usaha_id = ?', keId, usaha.id);
  if (!dari || !ke) throw tidakDitemukan('Bahan');
  if (dari.satuan_dasar !== ke.satuan_dasar) {
    throw new AppError(409, `${dari.nama} diukur per ${dari.satuan_dasar}, ${ke.nama} per ${ke.satuan_dasar}. Bahan dengan ukuran berbeda tidak bisa digabung.`);
  }
  run('UPDATE harga_bahan SET bahan_id = ? WHERE bahan_id = ?', ke.id, dari.id);
  run('UPDATE resep_item SET bahan_id = ? WHERE bahan_id = ?', ke.id, dari.id);
  run('UPDATE nota_item SET bahan_id = ? WHERE bahan_id = ?', ke.id, dari.id);
  run('UPDATE OR IGNORE alias_bahan SET bahan_id = ? WHERE bahan_id = ?', ke.id, dari.id);
  run('UPDATE OR IGNORE konversi_satuan SET bahan_id = ? WHERE bahan_id = ?', ke.id, dari.id);
  run('DELETE FROM bahan WHERE id = ?', dari.id);
  simpanAlias(usaha.id, dari.nama, ke.id);
  return get('SELECT * FROM bahan WHERE id = ?', ke.id);
}

export const daftarNamaBahan = (usahaId) => all('SELECT nama FROM bahan WHERE usaha_id = ? ORDER BY nama', usahaId).map((b) => b.nama);

export function simpanAlias(usahaId, teksAsli, bahanId) {
  const istilah = kunci(teksAsli);
  if (!istilah) return;
  run(
    `INSERT INTO alias_bahan (usaha_id, istilah, bahan_id) VALUES (?, ?, ?)
     ON CONFLICT (usaha_id, istilah) DO UPDATE SET bahan_id = excluded.bahan_id`,
    usahaId,
    istilah,
    bahanId,
  );
}

export function simpanKonversi(bahanId, satuan, faktor) {
  run(
    `INSERT INTO konversi_satuan (bahan_id, satuan, faktor) VALUES (?, ?, ?)
     ON CONFLICT (bahan_id, satuan) DO UPDATE SET faktor = excluded.faktor`,
    bahanId,
    normalisasiSatuan(satuan),
    faktor,
  );
}

export function konversiBahan(bahanId) {
  return Object.fromEntries(all('SELECT satuan, faktor FROM konversi_satuan WHERE bahan_id = ?', bahanId).map((k) => [k.satuan, k.faktor]));
}

function ringkasBahan(b, usaha) {
  const riwayat = all(
    'SELECT harga_per_satuan, tanggal, sumber, nama_toko FROM harga_bahan WHERE bahan_id = ? ORDER BY tanggal DESC, id DESC',
    b.id,
  );
  const terakhir = riwayat[0] ?? null;
  const sebelumnya = riwayat[1] ?? null;
  const acuan = acuanPerSatuanDasar(b, usaha);
  const selisih = terakhir && acuan ? selisihPersen(terakhir.harga_per_satuan, acuan.harga_per_satuan_dasar) : null;
  return {
    ...b,
    harga_terakhir: terakhir,
    harga_rata_rata: hargaRataRata(riwayat),
    perubahan: terakhir && sebelumnya ? selisihPersen(terakhir.harga_per_satuan, sebelumnya.harga_per_satuan) : null,
    acuan,
    selisih_acuan: selisih,
    status_acuan: statusAcuan(selisih),
    dipakai_di: all(
      'SELECT DISTINCT m.id, m.nama FROM resep_item r JOIN menu m ON m.id = r.menu_id WHERE r.bahan_id = ?',
      b.id,
    ),
    riwayat,
  };
}

export function daftarBahan(usaha) {
  return all('SELECT * FROM bahan WHERE usaha_id = ? ORDER BY nama', usaha.id).map((b) => {
    const { riwayat, ...ringkas } = ringkasBahan(b, usaha);
    return { ...ringkas, jumlah_pembelian: riwayat.length };
  });
}

export function detailBahan(usaha, bahanId) {
  const b = get('SELECT * FROM bahan WHERE id = ? AND usaha_id = ?', bahanId, usaha.id);
  if (!b) throw tidakDitemukan('Bahan');
  return {
    ...ringkasBahan(b, usaha),
    konversi: konversiBahan(b.id),
    alias: all('SELECT istilah FROM alias_bahan WHERE bahan_id = ?', b.id).map((a) => a.istilah),
    riwayat_acuan: riwayatAcuan(b.komoditas, usaha),
  };
}

export function ubahBahan(usaha, bahanId, data) {
  const b = get('SELECT * FROM bahan WHERE id = ? AND usaha_id = ?', bahanId, usaha.id);
  if (!b) throw tidakDitemukan('Bahan');
  if (data.satuan_dasar && !SATUAN_DASAR.includes(data.satuan_dasar)) throw new AppError(400, 'Satuan dasar tidak dikenal');
  run(
    'UPDATE bahan SET nama = ?, satuan_dasar = ?, komoditas = ?, susut_persen = ? WHERE id = ?',
    data.nama ? kunci(data.nama) : b.nama,
    data.satuan_dasar ?? b.satuan_dasar,
    data.komoditas === undefined ? b.komoditas : data.komoditas,
    data.susut_persen ?? b.susut_persen,
    b.id,
  );
  return detailBahan(usaha, b.id);
}

// Harga perkiraan yang diisi sendiri (untuk bahan yang belum pernah dicatat belanjanya dan tidak ada di data pasar).
export function isiHargaManual(usaha, bahanId, { qty, satuan, harga }) {
  const bahan = get('SELECT * FROM bahan WHERE id = ? AND usaha_id = ?', bahanId, usaha.id);
  if (!bahan) throw tidakDitemukan('Bahan');
  const konv = keSatuanDasar({ qty, satuan, satuanDasar: bahan.satuan_dasar, namaBahan: bahan.nama, konversiKhusus: konversiBahan(bahan.id) });
  if (!konv.ok || !konv.nilai) throw new AppError(400, konv.pesan ?? 'Jumlah tidak valid');
  run('INSERT INTO harga_bahan (bahan_id, harga_per_satuan, tanggal, sumber) VALUES (?, ?, ?, ?)', bahan.id, harga / konv.nilai, tanggalHariIni(), 'manual');
  return detailBahan(usaha, bahan.id);
}
