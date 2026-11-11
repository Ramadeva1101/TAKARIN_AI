// Mencocokkan nama bahan sehari-hari ke nama komoditas di data harga pangan pemerintah.
// Urutan penting: pola yang lebih spesifik di atas.

// Kata yang menandakan produk lain walau namanya memuat nama komoditas
// (gula merah bukan gula pasir, minyak wijen bukan minyak goreng, tepung beras bukan beras).
const BUKAN = /\b(merah|aren|jawa|semut|batu|wijen|zaitun|samin|kelapa|tepung|ketan|puyuh|bebek|asin|kampung|bubuk|kaldu|saus|sambal)\b/i;
const BUKAN_CABAI = /\b(bubuk|saus|sambal|kering)\b/i;
const BUKAN_BAWANG = /\b(goreng|bubuk)\b/i;

const POLA = [
  [/cab[ae]i?\s*(rawit|setan|rwt)\s*(hijau|ijo)|cengek\s*(hijau|ijo)/i, 'cabai rawit hijau', BUKAN_CABAI],
  [/cab[ae]i?\s*(rawit|setan|rwt)|cengek/i, 'cabai rawit merah', BUKAN_CABAI],
  [/cab[ae]i?\s*(keriting|krtg)/i, 'cabai merah keriting', BUKAN_CABAI],
  [/cab[ae]i?\s*(besar|merah)/i, 'cabai merah besar', BUKAN_CABAI],
  [/bawang\s*merah|bwg\s*mrh|bawang\s*mrh/i, 'bawang merah', BUKAN_BAWANG],
  [/bawang\s*putih|bwg\s*pth|bawang\s*pth/i, 'bawang putih', BUKAN_BAWANG],
  [/telur|telor/i, 'telur ayam ras', BUKAN],
  [/(minyak\s*(goreng\s*)?|migor\s*)curah/i, 'minyak goreng curah', BUKAN],
  [/minyak\s*(goreng)?|migor/i, 'minyak goreng', BUKAN],
  [/gula\s*(pasir)?/i, 'gula pasir', BUKAN],
  [/beras/i, 'beras medium', BUKAN],
  [/(daging\s*)?ayam/i, 'daging ayam ras', BUKAN],
  [/daging\s*sapi|sapi/i, 'daging sapi', BUKAN],
];

export function cocokkanKomoditas(namaBahan) {
  const nama = String(namaBahan || '');
  for (const [pola, komoditas, kecuali] of POLA) if (pola.test(nama) && !kecuali?.test(nama)) return komoditas;
  return null;
}

// Satuan harga acuan per komoditas → faktor ke satuan dasar bahan.
export function acuanKeSatuanDasar(hargaAcuan, satuanAcuan, satuanDasar) {
  if (satuanAcuan === 'kg' && satuanDasar === 'g') return hargaAcuan / 1000;
  if (satuanAcuan === 'liter' && satuanDasar === 'ml') return hargaAcuan / 1000;
  // Minyak goreng dilaporkan per kg; 1 liter minyak goreng sekitar 0,92 kg.
  if (satuanAcuan === 'kg' && satuanDasar === 'ml') return (hargaAcuan * 0.92) / 1000;
  if (satuanAcuan === 'kg' && satuanDasar === 'butir') return hargaAcuan / 16;
  if (satuanAcuan === satuanDasar) return hargaAcuan;
  return null;
}
