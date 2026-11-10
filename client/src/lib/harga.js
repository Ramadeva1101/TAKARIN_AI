// Salinan dari server/src/domain/validasiAngka.js agar form bisa memberi peringatan sebelum disimpan.
// Server tetap memeriksa ulang saat menyimpan.
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
