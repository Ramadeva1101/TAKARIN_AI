import { all, get } from '../lib/db.js';
import { hitungSemua } from './hpp.js';
import { daftarBahan } from './bahan.js';
import { opsiPerbaikan } from '../domain/rekomendasi.js';

export function ringkasan(usaha) {
  const produk = hitungSemua(usaha);
  const lengkap = produk.filter((p) => p.lengkap);
  const hitung = (s) => produk.filter((p) => p.status === s).length;

  const bahan = daftarBahan(usaha);
  const bahanNaik = bahan
    .filter((b) => b.perubahan != null && b.perubahan > 0.02)
    .sort((a, b) => b.perubahan - a.perubahan)
    .slice(0, 5);

  const bulanIni = get(
    `SELECT COALESCE(SUM(i.harga), 0) AS total, COUNT(DISTINCT n.id) AS jumlah FROM nota n
     JOIN nota_item i ON i.nota_id = n.id
     WHERE n.usaha_id = ? AND n.status = 'disimpan' AND strftime('%Y-%m', n.tanggal) = strftime('%Y-%m', 'now')`,
    usaha.id,
  );

  const perluTindakan = lengkap
    .filter((p) => p.status !== 'aman')
    .sort((a, b) => a.margin - b.margin)
    .map((p) => ({ id: p.id, nama: p.nama, margin: p.margin, harga_jual: p.harga_jual, hpp: p.hpp, harga_aman: p.harga_aman, status: p.status, opsi_utama: opsiPerbaikan(p, usaha.target_margin)[0] ?? null }));

  return {
    usaha: { id: usaha.id, nama: usaha.nama, kota: usaha.kota, target_margin: usaha.target_margin },
    kpi: {
      jumlah_produk: produk.length,
      rata_margin: lengkap.length ? lengkap.reduce((t, p) => t + p.margin, 0) / lengkap.length : null,
      aman: hitung('aman'),
      waspada: hitung('waspada'),
      rugi: hitung('rugi'),
      belum_lengkap: hitung('belum_lengkap'),
      belanja_bulan_ini: bulanIni.total,
      nota_bulan_ini: bulanIni.jumlah,
    },
    produk: produk.map(({ id, nama, harga_jual, hpp, margin, status, harga_aman, lengkap: l, kurang }) => ({ id, nama, harga_jual, hpp, margin, status, harga_aman, lengkap: l, kurang })),
    perlu_tindakan: perluTindakan,
    bahan_naik: bahanNaik.map(({ id, nama, satuan_dasar, perubahan, harga_terakhir }) => ({ id, nama, satuan_dasar, perubahan, harga_terakhir })),
    harga_pasar: bahan
      .filter((b) => b.acuan)
      .map(({ id, nama, satuan_dasar, acuan, harga_terakhir, selisih_acuan, status_acuan }) => ({ id, nama, satuan_dasar, acuan, harga_terakhir, selisih_acuan, status_acuan })),
    belanja_terakhir: all(
      `SELECT n.id, n.tanggal, n.nama_toko, n.sumber, n.status, COALESCE(SUM(i.harga), 0) AS total
       FROM nota n LEFT JOIN nota_item i ON i.nota_id = n.id WHERE n.usaha_id = ?
       GROUP BY n.id ORDER BY n.tanggal DESC, n.id DESC LIMIT 5`,
      usaha.id,
    ),
  };
}
