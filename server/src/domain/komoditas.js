// Mencocokkan nama bahan sehari-hari ke nama komoditas di data harga pangan pemerintah.
// Urutan penting: pola yang lebih spesifik di atas.
const POLA = [
  [/cab[ae]i?\s*(rawit|setan|rwt)\s*(hijau|ijo)|cengek\s*(hijau|ijo)/i, 'cabai rawit hijau'],
  [/cab[ae]i?\s*(rawit|setan|rwt)|cengek/i, 'cabai rawit merah'],
  [/cab[ae]i?\s*(keriting|krtg)/i, 'cabai merah keriting'],
  [/cab[ae]i?\s*(besar|merah)/i, 'cabai merah besar'],
  [/bawang\s*merah|bwg\s*mrh|bawang\s*mrh/i, 'bawang merah'],
  [/bawang\s*putih|bwg\s*pth|bawang\s*pth/i, 'bawang putih'],
  [/telur|telor/i, 'telur ayam ras'],
  [/(minyak\s*(goreng\s*)?|migor\s*)curah/i, 'minyak goreng curah'],
  [/minyak\s*(goreng)?|migor/i, 'minyak goreng'],
  [/gula\s*(pasir)?/i, 'gula pasir'],
  [/beras/i, 'beras medium'],
  [/(daging\s*)?ayam/i, 'daging ayam ras'],
  [/daging\s*sapi|sapi/i, 'daging sapi'],
  [/tepung\s*terigu|terigu/i, 'tepung terigu'],
];

export function cocokkanKomoditas(namaBahan) {
  const nama = String(namaBahan || '');
  for (const [pola, komoditas] of POLA) if (pola.test(nama)) return komoditas;
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
