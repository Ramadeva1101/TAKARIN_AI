import { margin } from './harga.js';

const naik500 = (x) => Math.ceil(x / 500) * 500;

function analisisHarga(harga, hppPaket, hargaNormal, labaNormal, targetMargin) {
  const laba = harga - hppPaket;
  const m = margin(harga, hppPaket);
  return {
    harga,
    margin: m,
    laba,
    hemat_pelanggan: hargaNormal - harga,
    // Berapa persen penjualan paket harus naik agar total laba sama dengan menjual satuan.
    kenaikan_volume: laba > 0 ? labaNormal / laba - 1 : null,
    status: laba <= 0 ? 'rugi' : m + 1e-9 < targetMargin ? 'di_bawah_target' : 'aman',
  };
}

/**
 * @param {object} p
 * @param {Array<{nama:string, hpp:number, harga_jual:number, qty:number}>} p.items
 * @param {number} [p.hargaPaket] harga yang diusulkan pemilik
 * @param {number} [p.biayaKemasan] biaya kemasan tambahan per paket
 */
export function hitungPromo({ items, hargaPaket, biayaKemasan = 0, targetMargin }) {
  const hppPaket = items.reduce((t, i) => t + i.hpp * i.qty, 0) + biayaKemasan;
  const hargaNormal = items.reduce((t, i) => t + i.harga_jual * i.qty, 0);
  const labaNormal = hargaNormal - hppPaket;

  const level = [
    { jenis: 'aman', target: targetMargin },
    { jenis: 'seimbang', target: Math.max(targetMargin - 0.05, 0.05) },
    { jenis: 'agresif', target: Math.max(targetMargin - 0.1, 0.05) },
  ];
  const opsi = level.map(({ jenis, target }) => {
    const harga = naik500(hppPaket / (1 - target));
    const layak = harga < hargaNormal;
    return { jenis, ...analisisHarga(harga, hppPaket, hargaNormal, labaNormal, targetMargin), layak };
  });

  return {
    hpp_paket: hppPaket,
    harga_normal: hargaNormal,
    laba_normal: labaNormal,
    margin_normal: margin(hargaNormal, hppPaket),
    opsi,
    usulan: hargaPaket ? analisisHarga(hargaPaket, hppPaket, hargaNormal, labaNormal, targetMargin) : null,
  };
}
