import { all, get, run } from '../lib/db.js';
import { AppError, tidakDitemukan, tanggalHariIni } from '../lib/errors.js';
import { tebakSatuanDasar, normalisasiSatuan, SATUAN_DASAR, keSatuanDasar } from '../domain/satuan.js';
import { cocokkanKomoditas } from '../domain/komoditas.js';
import { hargaRataRata, selisihPersen, statusAcuan } from '../domain/harga.js';
import { acuanPerSatuanDasar, riwayatAcuan } from './hargaPasar.js';

const kunci = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');

export function cariAtauBuatBahan(usahaId, nama, satuanContoh) {
  const n = kunci(nama);
  const ada = get('SELECT * FROM bahan WHERE usaha_id = ? AND lower(nama) = ?', usahaId, n);
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
 * Mencocokkan tulisan di nota/ucapan ke bahan milik usaha.
 * Urutan: alias tersimpan → nama persis → nama saling memuat → komoditas sama.
 */
export function cocokkanBahan(usahaId, teksAsli, namaBahan) {
  const alias = get(
    'SELECT b.* FROM alias_bahan a JOIN bahan b ON b.id = a.bahan_id WHERE a.usaha_id = ? AND a.istilah = ?',
    usahaId,
    kunci(teksAsli),
  );
  if (alias) return { bahan: alias, cara: 'alias' };

  const n = kunci(namaBahan);
  const semua = all('SELECT * FROM bahan WHERE usaha_id = ?', usahaId);
  const persis = semua.find((b) => b.nama === n);
  if (persis) return { bahan: persis, cara: 'nama' };
  const memuat = semua.filter((b) => n.includes(b.nama) || b.nama.includes(n)).sort((a, b) => b.nama.length - a.nama.length)[0];
  if (memuat) return { bahan: memuat, cara: 'mirip' };
  const komoditas = cocokkanKomoditas(n);
  const samaKomoditas = komoditas && semua.find((b) => b.komoditas === komoditas);
  if (samaKomoditas) return { bahan: samaKomoditas, cara: 'komoditas' };
  return { bahan: null, cara: null };
}

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
