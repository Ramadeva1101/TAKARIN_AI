export const rupiah = (n) => `Rp${Math.round(n).toLocaleString('id-ID')}`;
export const persen = (x) => `${Math.round(x * 100)}%`;

// Harga per satuan dasar → harga per satuan yang biasa dibaca orang (kg, liter, butir, pcs).
export function hargaTampil(hargaPerDasar, satuanDasar) {
  if (hargaPerDasar == null) return null;
  if (satuanDasar === 'g') return { harga: hargaPerDasar * 1000, satuan: 'kg' };
  if (satuanDasar === 'ml') return { harga: hargaPerDasar * 1000, satuan: 'liter' };
  return { harga: hargaPerDasar, satuan: satuanDasar };
}
