// Memastikan angka yang ditulis AI ada di data hasil hitungan kode.

function keAngka(teks) {
  // "15.000" → 15000, "31,1" → 31.1
  const bersih = teks.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  return Number(bersih);
}

export function ambilAngka(teks) {
  const hasil = [];
  const pola = /(?:rp\s?)?(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)(\s?%)?/gi;
  for (const m of String(teks).matchAll(pola)) {
    hasil.push({ nilai: keAngka(m[1]), persen: Boolean(m[2]), teks: m[0] });
  }
  return hasil;
}

/**
 * @param {string} teks
 * @param {number[]} diizinkan angka rupiah/jumlah yang valid
 * @param {number[]} persenDiizinkan nilai persen yang valid (0-100)
 */
// Harga rupiah yang disebut dalam teks promo: "Rp27.500", "27.500", "27rb", "27 ribu", "27k".
// Angka kecil (jumlah porsi, "2 Es Teh") dan angka di bawah 500 tidak dianggap harga.
export function hargaDiTeks(teks) {
  const hasil = [];
  const pola = /(?:rp\.?\s?)?(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s?(rb|ribu|k)?(?![a-z])/gi;
  for (const m of String(teks || '').matchAll(pola)) {
    const ribuan = Boolean(m[2]);
    const angka = ribuan ? Number(m[1].replace(',', '.')) * 1000 : Number(m[1].replace(/[.,](?=\d{3}(\D|$))/g, ''));
    if (Number.isFinite(angka) && angka >= 500) hasil.push({ nilai: Math.round(angka), teks: m[0].trim() });
  }
  return hasil;
}

/** Harga di teks yang tidak cocok dengan harga yang boleh disebut (toleransi Rp1). */
export function hargaAsing(teks, diizinkan) {
  return hargaDiTeks(teks).filter(({ nilai }) => !diizinkan.some((d) => Math.abs(d - nilai) <= 1));
}

export function validasiAngka(teks, diizinkan = [], persenDiizinkan = []) {
  const asing = ambilAngka(teks).filter(({ nilai, persen }) => {
    if (!persen && nilai <= 10) return false; // hitungan kecil (1 butir, 2 pilihan)
    const daftar = persen ? persenDiizinkan : diizinkan;
    const toleransi = persen ? 0.6 : Math.max(1, Math.abs(nilai) * 0.005);
    return !daftar.some((d) => Math.abs(d - nilai) <= toleransi);
  });
  return { valid: asing.length === 0, asing };
}
