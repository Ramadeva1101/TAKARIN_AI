// Impor harga acuan dari CSV.
// Format kolom: komoditas,wilayah,level,harga,satuan,tanggal,sumber
// level: kota | provinsi | nasional; satuan: kg | liter | butir; tanggal: YYYY-MM-DD
// Jalankan: node --env-file=.env scripts/impor-harga-pasar.js data/harga.csv
import fs from 'node:fs';
import { imporCsv } from '../src/services/hargaPasar.js';

const file = process.argv[2];
if (!file) {
  console.error('Pakai: node --env-file=.env scripts/impor-harga-pasar.js <file.csv>');
  process.exit(1);
}
console.log(`Diimpor: ${imporCsv(fs.readFileSync(file, 'utf8'))} baris`);
