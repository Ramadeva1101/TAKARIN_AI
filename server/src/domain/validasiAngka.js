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
export function validasiAngka(teks, diizinkan = [], persenDiizinkan = []) {
  const asing = ambilAngka(teks).filter(({ nilai, persen }) => {
    if (!persen && nilai <= 10) return false; // hitungan kecil (1 butir, 2 pilihan)
    const daftar = persen ? persenDiizinkan : diizinkan;
    const toleransi = persen ? 0.6 : Math.max(1, Math.abs(nilai) * 0.005);
    return !daftar.some((d) => Math.abs(d - nilai) <= toleransi);
  });
  return { valid: asing.length === 0, asing };
}
