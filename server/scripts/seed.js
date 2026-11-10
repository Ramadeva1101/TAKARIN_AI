// Mengisi database dengan akun demo dan riwayat belanja contoh.
// Jalankan: npm run seed  (menghapus database lama di DB_PATH)
import fs from 'node:fs';
import bcrypt from 'bcrypt';

const dbPath = process.env.DB_PATH || './data/app.db';
for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) fs.rmSync(f, { force: true });

const { run, get } = await import('../src/lib/db.js');
const { simpanSetup } = await import('../src/services/usaha.js');
const pembelian = await import('../src/services/pembelian.js');
const { imporCsv } = await import('../src/services/hargaPasar.js');

const tgl = (mundurHari) => new Date(Date.now() - mundurHari * 86_400_000).toISOString().slice(0, 10);

// Cadangan bila PIHPS tidak bisa dijangkau: harga contoh 14 hari terakhir. BUKAN data resmi, diberi label "data contoh".
// h = hari ke belakang (0 = hari ini). Pola dibuat bergerak supaya kabar harga harian bisa diuji.
const DASAR_KOTA = [
  ['cabai rawit merah', 'kg', (h) => 60000 + (13 - h) * 900],
  ['cabai merah keriting', 'kg', (h) => 42000 + (h % 4) * 600],
  ['bawang merah', 'kg', (h) => 36000 + Math.max(0, 6 - h) * 400],
  ['bawang putih', 'kg', () => 40000],
  ['daging ayam ras', 'kg', (h) => 35500 + (h % 3) * 250],
  ['daging sapi', 'kg', () => 135000],
  ['tomat', 'kg', (h) => 14000 - Math.max(0, 5 - h) * 300],
];
const KOTA = [
  ['Denpasar', 'Bali', 1],
  ['Surabaya', 'Jawa Timur', 0.93],
  ['Yogyakarta', 'DI Yogyakarta', 0.9],
  ['Jakarta Pusat', 'DKI Jakarta', 1.05],
];
const DASAR_PROVINSI = [
  ['telur ayam ras', 'kg', () => 29000],
  ['gula pasir', 'kg', () => 17500],
  ['beras medium', 'kg', () => 13500],
];
const bulat = (n) => Math.round(n / 50) * 50;
const ACUAN = [
  ...KOTA.flatMap(([kota, , f]) => DASAR_KOTA.map(([k, s, harga]) => [k, kota, 'kota', s, (h) => bulat(harga(h) * f)])),
  ...KOTA.flatMap(([, prov, f]) => DASAR_PROVINSI.map(([k, s, harga]) => [k, prov, 'provinsi', s, (h) => bulat(harga(h) * f)])),
  ['tepung terigu', 'Indonesia', 'nasional', 'kg', () => 12000],
  ['minyak goreng', 'Indonesia', 'nasional', 'liter', () => 18000],
];
const baris = ['komoditas,wilayah,level,harga,satuan,tanggal,sumber'];
for (let h = 13; h >= 0; h -= 1) {
  for (const [komoditas, wilayah, level, satuan, harga] of ACUAN) {
    baris.push([komoditas, wilayah, level, harga(h), satuan, tgl(h), 'data contoh'].join(','));
  }
}
const { segarkanWilayah } = await import('../src/services/pihps.js');
let adaHargaAsli = false;
if (process.env.HARGA_LIVE === 'on') {
  const h = await segarkanWilayah({ kota: 'Denpasar', provinsi: 'Bali' });
  adaHargaAsli = h.kota > 0;
  console.log('Harga PIHPS Bank Indonesia:', JSON.stringify(h));
}
if (!adaHargaAsli) console.log(`PIHPS tidak terjangkau, memakai harga contoh: ${imporCsv(baris.join('\n'))} baris`);

const hash = await bcrypt.hash('demo12345', 10);
const { lastInsertRowid: userId } = run('INSERT INTO users (email, password_hash, nama) VALUES (?, ?, ?)', 'demo@dapur.id', hash, 'Bu Sari');

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

console.log('Seed selesai. Masuk dengan demo@dapur.id / demo12345');
