// Mengisi database dengan akun demo dan riwayat belanja contoh.
// Jalankan: npm run seed       (menghapus database lama di DB_PATH)
//           npm run seed:demo  (hanya membuat ulang akun demo; akun lain tidak disentuh)
import fs from 'node:fs';

const hanyaDemo = process.argv.includes('--demo');
const dbPath = process.env.DB_PATH || './data/app.db';
if (!hanyaDemo) for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) fs.rmSync(f, { force: true });

await import('../src/lib/db.js');
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
if (!adaHargaAsli && !hanyaDemo) console.log(`PIHPS tidak terjangkau, memakai harga contoh: ${imporCsv(baris.join('\n'))} baris`);

const { buatUlangAkunDemo } = await import('../src/services/demo.js');
await buatUlangAkunDemo();

console.log('Seed selesai. Masuk dengan demo@dapur.id / demo12345');
