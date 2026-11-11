import { all, get, run, tx } from '../lib/db.js';
import { AppError, tidakDitemukan, tanggalHariIni } from '../lib/errors.js';
import { rupiah, hargaTampil } from '../lib/format.js';
import { keSatuanDasar, tebakSatuanDasar, SATUAN_DASAR } from '../domain/satuan.js';
import { hargaMencurigakan, selisihPersen, statusAcuan } from '../domain/harga.js';
import { cocokkanKomoditas } from '../domain/komoditas.js';
import { cocokkanBahan, cariAtauBuatBahan, simpanAlias, simpanKonversi, konversiBahan } from './bahan.js';
import { acuanPerSatuanDasar } from './hargaPasar.js';
import { hitungSemua } from './hpp.js';
import { bacaNota, bacaUcapan, transkripsi } from '../ai/provider.js';

const BATAS_YAKIN = 0.7;

function ambilNota(usaha, notaId) {
  const nota = get('SELECT * FROM nota WHERE id = ? AND usaha_id = ?', notaId, usaha.id);
  if (!nota) throw tidakDitemukan('Catatan belanja');
  return nota;
}

function analisisItem(usaha, item) {
  const bahan = item.bahan_id ? get('SELECT * FROM bahan WHERE id = ?', item.bahan_id) : null;
  const satuanDasar = bahan?.satuan_dasar ?? tebakSatuanDasar(item.nama_bahan, item.satuan);
  const masalah = [];

  if (!bahan) masalah.push({ kode: 'bahan_baru', pesan: `"${item.nama_bahan}" belum ada di daftar bahan. Akan disimpan sebagai bahan baru.` });
  else if (item.cara_cocok === 'mirip' || item.cara_cocok === 'komoditas') {
    masalah.push({ kode: 'bahan_mirip', pesan: `Dicocokkan ke "${bahan.nama}" karena namanya mirip. Kalau berbeda, ganti nama bahannya.` });
  }

  const konv = keSatuanDasar({
    qty: item.qty,
    satuan: item.satuan,
    satuanDasar,
    namaBahan: item.nama_bahan,
    konversiKhusus: bahan ? konversiBahan(bahan.id) : {},
  });
  if (!konv.ok) masalah.push({ kode: 'konversi', pesan: konv.pesan });
  if (item.harga == null) masalah.push({ kode: 'harga_kosong', pesan: 'Harga belum terbaca. Isi harga totalnya.' });

  const hargaPerDasar = konv.ok && konv.nilai > 0 && item.harga != null ? item.harga / konv.nilai : null;

  const terakhir = bahan
    ? get('SELECT harga_per_satuan, tanggal FROM harga_bahan WHERE bahan_id = ? ORDER BY tanggal DESC, id DESC LIMIT 1', bahan.id)
    : null;
  const acuan = acuanPerSatuanDasar(
    bahan ?? { komoditas: cocokkanKomoditas(item.nama_bahan), satuan_dasar: satuanDasar },
    usaha,
  );

  const pembanding = terakhir?.harga_per_satuan ?? acuan?.harga_per_satuan_dasar;
  if (hargaMencurigakan(hargaPerDasar, pembanding)) {
    const t = hargaTampil(pembanding, satuanDasar);
    masalah.push({ kode: 'harga_aneh', pesan: `Harga jauh berbeda dari biasanya (sekitar ${rupiah(t.harga)}/${t.satuan}). Cek lagi angkanya.` });
  }
  if (item.yakin != null && item.yakin < BATAS_YAKIN) masalah.push({ kode: 'yakin_rendah', pesan: 'AI kurang yakin membaca baris ini.' });

  const selisih = acuan && hargaPerDasar ? selisihPersen(hargaPerDasar, acuan.harga_per_satuan_dasar) : null;
  return {
    ...item,
    bahan_nama: bahan?.nama ?? null,
    satuan_dasar: satuanDasar,
    qty_dasar: konv.ok ? konv.nilai : null,
    harga_satuan: hargaTampil(hargaPerDasar, satuanDasar),
    harga_terakhir: terakhir ? { ...hargaTampil(terakhir.harga_per_satuan, satuanDasar), tanggal: terakhir.tanggal } : null,
    acuan: acuan
      ? { ...hargaTampil(acuan.harga_per_satuan_dasar, satuanDasar), wilayah: acuan.wilayah, level: acuan.level, tanggal: acuan.tanggal, sumber: acuan.sumber, kedaluwarsa: acuan.kedaluwarsa }
      : null,
    selisih_acuan: selisih,
    status_acuan: statusAcuan(selisih),
    masalah,
  };
}

export function lihat(usaha, notaId) {
  const nota = ambilNota(usaha, notaId);
  const item = all('SELECT * FROM nota_item WHERE nota_id = ? ORDER BY id', nota.id).map((i) => analisisItem(usaha, i));
  const jumlah = item.reduce((t, i) => t + (i.harga ?? 0), 0);
  const peringatan = [];
  if (nota.total_tertulis != null && Math.abs(nota.total_tertulis - jumlah) > 100) {
    peringatan.push(`Jumlah per baris (${rupiah(jumlah)}) tidak sama dengan total di nota (${rupiah(nota.total_tertulis)}). Ada baris yang salah baca atau terlewat.`);
  }
  return { ...nota, item, jumlah, peringatan, perlu_dicek: item.filter((i) => i.masalah.length).length };
}

export function buatDraf(usaha, { sumber, nama_toko = null, tanggal = null, total_tertulis = null, transkrip = null, item }) {
  if (!item?.length) throw new AppError(422, 'Tidak ada barang belanja yang terbaca. Coba lagi atau isi manual.');
  const id = tx(() => {
    const { lastInsertRowid } = run(
      'INSERT INTO nota (usaha_id, tanggal, sumber, nama_toko, total_tertulis, transkrip) VALUES (?, ?, ?, ?, ?, ?)',
      usaha.id,
      /^\d{4}-\d{2}-\d{2}$/.test(tanggal ?? '') ? tanggal : tanggalHariIni(),
      sumber,
      nama_toko,
      total_tertulis,
      transkrip,
    );
    for (const i of item) {
      const { bahan, cara } = cocokkanBahan(usaha.id, i.teks_asli || i.nama_bahan, i.nama_bahan);
      run(
        'INSERT INTO nota_item (nota_id, teks_asli, nama_bahan, bahan_id, qty, satuan, harga, yakin, cara_cocok) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        lastInsertRowid,
        i.teks_asli ?? '',
        i.nama_bahan,
        bahan?.id ?? null,
        i.qty ?? null,
        i.satuan ?? null,
        i.harga ?? null,
        i.yakin ?? null,
        cara,
      );
    }
    return lastInsertRowid;
  });
  return lihat(usaha, id);
}

export async function dariFoto(usaha, file) {
  const { data, model } = await bacaNota(file.buffer, file.mimetype);
  return { ...buatDraf(usaha, { sumber: 'foto', ...data }), model };
}

export async function dariTeks(usaha, teks, sumber = 'teks') {
  const { data, model } = await bacaUcapan(teks);
  return { ...buatDraf(usaha, { sumber, transkrip: teks, ...data }), model };
}

export async function dariSuara(usaha, file) {
  const { teks } = await transkripsi(file.buffer, file.originalname, file.mimetype);
  if (!teks?.trim()) throw new AppError(422, 'Suara tidak terdengar jelas. Coba rekam lagi.');
  return dariTeks(usaha, teks, 'suara');
}

function bandingkan(sebelum, sesudah, bahanIds) {
  const lama = new Map(sebelum.map((m) => [m.id, m]));
  return sesudah
    .map((m) => {
      const l = lama.get(m.id);
      const terkait = m.resep.filter((r) => bahanIds.has(r.bahan_id)).map((r) => r.nama);
      if (!terkait.length) return null;
      return {
        id: m.id,
        nama: m.nama,
        harga_jual: m.harga_jual,
        hpp_lama: l?.hpp ?? null,
        hpp_baru: m.hpp,
        margin_lama: l?.margin ?? null,
        margin_baru: m.margin,
        status_lama: l?.status ?? null,
        status_baru: m.status,
        harga_aman: m.harga_aman,
        bahan_terkait: terkait,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.margin_baru ?? 1) - (b.margin_baru ?? 1));
}

export function simpan(usaha, notaId, data) {
  const nota = ambilNota(usaha, notaId);
  if (!data.item?.length) throw new AppError(400, 'Minimal satu barang belanja');

  return tx(() => {
    const sebelum = hitungSemua(usaha);
    const tanggal = data.tanggal ?? nota.tanggal;
    const bahanIds = new Set();

    run('DELETE FROM harga_bahan WHERE nota_id = ?', nota.id);
    run('DELETE FROM nota_item WHERE nota_id = ?', nota.id);

    for (const i of data.item) {
      let bahan = i.bahan_id ? get('SELECT * FROM bahan WHERE id = ? AND usaha_id = ?', i.bahan_id, usaha.id) : null;
      if (!bahan) {
        bahan = cariAtauBuatBahan(usaha.id, i.nama_bahan, i.satuan);
        if (i.satuan_dasar && SATUAN_DASAR.includes(i.satuan_dasar) && i.satuan_dasar !== bahan.satuan_dasar) {
          run('UPDATE bahan SET satuan_dasar = ? WHERE id = ?', i.satuan_dasar, bahan.id);
          bahan = get('SELECT * FROM bahan WHERE id = ?', bahan.id);
        }
      }
      if (i.konversi_faktor) simpanKonversi(bahan.id, i.satuan, i.konversi_faktor);

      const konv = keSatuanDasar({ qty: i.qty, satuan: i.satuan, satuanDasar: bahan.satuan_dasar, namaBahan: bahan.nama, konversiKhusus: konversiBahan(bahan.id) });
      if (!konv.ok || !konv.nilai) throw new AppError(400, `${bahan.nama}: ${konv.pesan ?? 'jumlah tidak valid'}`);
      if (i.harga == null || i.harga <= 0) throw new AppError(400, `${bahan.nama}: harga belum diisi`);

      run(
        'INSERT INTO harga_bahan (bahan_id, harga_per_satuan, tanggal, sumber, nama_toko, nota_id) VALUES (?, ?, ?, ?, ?, ?)',
        bahan.id,
        i.harga / konv.nilai,
        tanggal,
        nota.sumber,
        data.nama_toko ?? nota.nama_toko,
        nota.id,
      );
      run(
        'INSERT INTO nota_item (nota_id, teks_asli, nama_bahan, bahan_id, qty, satuan, harga, yakin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        nota.id,
        i.teks_asli ?? '',
        bahan.nama,
        bahan.id,
        i.qty,
        i.satuan,
        i.harga,
        1,
      );
      if (i.teks_asli) simpanAlias(usaha.id, i.teks_asli, bahan.id);
      bahanIds.add(bahan.id);
    }

    run("UPDATE nota SET status = 'disimpan', tanggal = ?, nama_toko = ? WHERE id = ?", tanggal, data.nama_toko ?? nota.nama_toko, nota.id);

    const dampak = bandingkan(sebelum, hitungSemua(usaha), bahanIds);
    return {
      nota_id: nota.id,
      dampak,
      ringkasan: {
        jumlah_item: data.item.length,
        total: data.item.reduce((t, i) => t + i.harga, 0),
        menu_terdampak: dampak.length,
        di_bawah_target: dampak.filter((d) => d.status_baru !== 'aman').length,
      },
    };
  });
}

export function daftar(usaha) {
  return all(
    `SELECT n.id, n.tanggal, n.sumber, n.nama_toko, n.status, n.created_at,
            COUNT(i.id) AS jumlah_item, COALESCE(SUM(i.harga), 0) AS total
     FROM nota n LEFT JOIN nota_item i ON i.nota_id = n.id
     WHERE n.usaha_id = ? GROUP BY n.id ORDER BY n.tanggal DESC, n.id DESC`,
    usaha.id,
  );
}

export function hapus(usaha, notaId) {
  const nota = ambilNota(usaha, notaId);
  tx(() => {
    run('DELETE FROM harga_bahan WHERE nota_id = ?', nota.id);
    run('DELETE FROM nota WHERE id = ?', nota.id);
  });
}
