import { all, get, run, tx } from '../lib/db.js';
import { acuanKeSatuanDasar } from '../domain/komoditas.js';

// Harga acuan terbaru: kota → provinsi → nasional.
export function acuanTerbaru(komoditas, usaha) {
  if (!komoditas) return null;
  const urutan = [
    ['kota', usaha.kota],
    ['provinsi', usaha.provinsi],
    ['nasional', 'Indonesia'],
  ];
  for (const [level, wilayah] of urutan) {
    if (!wilayah) continue;
    const baris = get(
      `SELECT komoditas, wilayah, level, harga, satuan, tanggal, sumber FROM harga_pasar
       WHERE komoditas = ? AND level = ? AND lower(wilayah) = lower(?) ORDER BY tanggal DESC LIMIT 1`,
      komoditas,
      level,
      wilayah,
    );
    if (baris) {
      const umurHari = Math.floor((Date.now() - new Date(baris.tanggal).getTime()) / 86_400_000);
      return { ...baris, umur_hari: umurHari, kedaluwarsa: umurHari > 7 };
    }
  }
  return null;
}

// Harga acuan dalam rupiah per satuan dasar bahan (g, ml, butir).
export function acuanPerSatuanDasar(bahan, usaha) {
  const acuan = acuanTerbaru(bahan.komoditas, usaha);
  if (!acuan) return null;
  const harga = acuanKeSatuanDasar(acuan.harga, acuan.satuan, bahan.satuan_dasar);
  return harga == null ? null : { ...acuan, harga_per_satuan_dasar: harga };
}

export function riwayatAcuan(komoditas, usaha, hari = 30) {
  const acuan = acuanTerbaru(komoditas, usaha);
  if (!acuan) return [];
  return all(
    `SELECT tanggal, harga FROM harga_pasar WHERE komoditas = ? AND level = ? AND wilayah = ?
     AND tanggal >= date('now', ?) ORDER BY tanggal`,
    komoditas,
    acuan.level,
    acuan.wilayah,
    `-${hari} days`,
  );
}

// CSV: komoditas,wilayah,level,harga,satuan,tanggal,sumber
export function imporCsv(teks) {
  const baris = teks.trim().split(/\r?\n/).slice(1).filter(Boolean);
  return tx(() => {
    let jumlah = 0;
    for (const b of baris) {
      const [komoditas, wilayah, level, harga, satuan, tanggal, sumber] = b.split(',').map((s) => s.trim());
      run('DELETE FROM harga_pasar WHERE komoditas = ? AND wilayah = ? AND tanggal = ?', komoditas, wilayah, tanggal);
      run(
        'INSERT INTO harga_pasar (komoditas, wilayah, level, harga, satuan, tanggal, sumber) VALUES (?, ?, ?, ?, ?, ?, ?)',
        komoditas,
        wilayah,
        level,
        Number(harga),
        satuan,
        tanggal,
        sumber,
      );
      jumlah += 1;
    }
    return jumlah;
  });
}
