// Akun demo untuk juri dan calon pengguna: Warung Bu Sari di Denpasar dengan 4 menu dan 3 catatan belanja.
// Dipakai oleh `npm run seed` dan oleh reset otomatis di server (DEMO_RESET=on), supaya data demo
// yang diubah pengunjung kembali bersih.
import bcrypt from 'bcrypt';
import { run, get } from '../lib/db.js';
import { simpanSetup } from './usaha.js';
import * as pembelian from './pembelian.js';

export const EMAIL_DEMO = 'demo@dapur.id';
const tgl = (mundurHari) => new Date(Date.now() - mundurHari * 86_400_000).toISOString().slice(0, 10);

export async function buatUlangAkunDemo() {
  // Semua data usaha ikut terhapus lewat ON DELETE CASCADE.
  run('DELETE FROM users WHERE email = ?', EMAIL_DEMO);
  const hash = await bcrypt.hash('demo12345', 10);
  const { lastInsertRowid: userId } = run('INSERT INTO users (email, password_hash, nama) VALUES (?, ?, ?)', EMAIL_DEMO, hash, 'Bu Sari');

  simpanSetup(userId, {
    usaha: { nama: 'Warung Bu Sari', jenis: 'warung makan', kota: 'Denpasar', provinsi: 'Bali', target_margin: 0.4, porsi_per_hari: 80 },
    produk: [
      {
        nama: 'Ayam Geprek',
        harga_jual: 15000,
        bahan: [
          { nama: 'ayam', qty: 1, satuan: 'potong' },
          { nama: 'tepung bumbu', qty: 50, satuan: 'g' },
          { nama: 'cabai rawit', qty: 20, satuan: 'g' },
          { nama: 'bawang putih', qty: 1, satuan: 'siung' },
          { nama: 'minyak goreng', qty: 1, satuan: 'sdm' },
          { nama: 'beras', qty: 100, satuan: 'g' },
          { nama: 'kertas nasi', qty: 1, satuan: 'pcs' },
        ],
      },
      {
        nama: 'Nasi Goreng',
        harga_jual: 13000,
        bahan: [
          { nama: 'beras', qty: 120, satuan: 'g' },
          { nama: 'telur', qty: 1, satuan: 'butir' },
          { nama: 'kecap manis', qty: 1, satuan: 'sdm' },
          { nama: 'minyak goreng', qty: 1, satuan: 'sdm' },
          { nama: 'bawang merah', qty: 3, satuan: 'siung' },
          { nama: 'cabai rawit', qty: 10, satuan: 'g' },
          { nama: 'kertas nasi', qty: 1, satuan: 'pcs' },
        ],
      },
      {
        nama: 'Es Teh',
        harga_jual: 4000,
        bahan: [
          { nama: 'teh celup', qty: 1, satuan: 'pcs' },
          { nama: 'gula pasir', qty: 2, satuan: 'sdm' },
          { nama: 'es batu', qty: 150, satuan: 'g' },
          { nama: 'cup plastik', qty: 1, satuan: 'pcs' },
        ],
      },
      {
        nama: 'Es Jeruk',
        harga_jual: 6000,
        bahan: [
          { nama: 'jeruk peras', qty: 150, satuan: 'g' },
          { nama: 'gula pasir', qty: 2, satuan: 'sdm' },
          { nama: 'es batu', qty: 150, satuan: 'g' },
          { nama: 'cup plastik', qty: 1, satuan: 'pcs' },
        ],
      },
    ],
    biaya: [
      { nama: 'gas', nominal: 11000, periode: 'hari' },
      { nama: 'listrik', nominal: 300000, periode: 'bulan' },
    ],
  });

  const usaha = get('SELECT * FROM usaha WHERE user_id = ?', userId);

  const BELANJA = [
    { hari: 21, toko: 'Pasar Kreneng', cabai: 29000 },
    { hari: 14, toko: 'Toko Sumber Rejeki', cabai: 30500 },
    { hari: 7, toko: 'Pasar Kreneng', cabai: 31500 },
  ];
  for (const b of BELANJA) {
    const item = [
      { teks_asli: 'cabe rawit 1/2 kg', nama_bahan: 'cabai rawit', qty: 0.5, satuan: 'kg', harga: b.cabai },
      { teks_asli: 'ayam 5 kg', nama_bahan: 'ayam', qty: 5, satuan: 'kg', harga: 180000 },
      { teks_asli: 'tepung bumbu 1 kg', nama_bahan: 'tepung bumbu', qty: 1, satuan: 'kg', harga: 12000 },
      { teks_asli: 'bawang putih 1/4', nama_bahan: 'bawang putih', qty: 0.25, satuan: 'kg', harga: 8000 },
      { teks_asli: 'bawang merah 1/2', nama_bahan: 'bawang merah', qty: 0.5, satuan: 'kg', harga: 14000 },
      { teks_asli: 'minyak 2 liter', nama_bahan: 'minyak goreng', qty: 2, satuan: 'liter', harga: 46000 },
      { teks_asli: 'beras 5 kg', nama_bahan: 'beras', qty: 5, satuan: 'kg', harga: 73000 },
      { teks_asli: 'telur 1 kg', nama_bahan: 'telur', qty: 1, satuan: 'kg', harga: 27000 },
      { teks_asli: 'kecap 600 ml', nama_bahan: 'kecap manis', qty: 600, satuan: 'ml', harga: 18000 },
      { teks_asli: 'gula 1 kg', nama_bahan: 'gula pasir', qty: 1, satuan: 'kg', harga: 18000 },
      { teks_asli: 'teh celup 25', nama_bahan: 'teh celup', qty: 25, satuan: 'pcs', harga: 6250 },
      { teks_asli: 'es batu 5 kg', nama_bahan: 'es batu', qty: 5, satuan: 'kg', harga: 10000 },
      { teks_asli: 'jeruk peras 2 kg', nama_bahan: 'jeruk peras', qty: 2, satuan: 'kg', harga: 30000 },
      { teks_asli: 'cup 50', nama_bahan: 'cup plastik', qty: 50, satuan: 'pcs', harga: 20000 },
      { teks_asli: 'kertas nasi 100', nama_bahan: 'kertas nasi', qty: 100, satuan: 'pcs', harga: 15000 },
    ];
    const draf = pembelian.buatDraf(usaha, { sumber: 'manual', tanggal: tgl(b.hari), nama_toko: b.toko, item });
    pembelian.simpan(usaha, draf.id, {
      tanggal: tgl(b.hari),
      nama_toko: b.toko,
      item: draf.item.map((i) => ({ teks_asli: i.teks_asli, nama_bahan: i.nama_bahan, bahan_id: i.bahan_id, qty: i.qty, satuan: i.satuan, harga: i.harga })),
    });
  }
}
