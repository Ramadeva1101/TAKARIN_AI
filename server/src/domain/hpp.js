import { keSatuanDasar } from './satuan.js';
import { margin, markup, hargaAman, statusMargin } from './harga.js';

/**
 * Biaya operasional per porsi.
 * periode: 'porsi' (sudah per porsi), 'hari' (dibagi porsi per hari), 'bulan' (dibagi porsi per hari x hari buka sebulan).
 */
export function biayaLainPerPorsi(biayaLain, porsiPerHari, hariBuka = 30) {
  const porsi = Math.max(Number(porsiPerHari) || 1, 1);
  const hari = Math.min(Math.max(Number(hariBuka) || 30, 1), 31);
  return biayaLain.reduce((total, b) => {
    if (b.periode === 'porsi') return total + b.nominal;
    if (b.periode === 'hari') return total + b.nominal / porsi;
    if (b.periode === 'bulan') return total + b.nominal / (porsi * hari);
    return total;
  }, 0);
}

/**
 * HPP satu menu.
 * @param {object} p
 * @param {{harga_jual:number, porsi_per_batch:number}} p.menu
 * @param {Array<{bahan_id:number, nama:string, qty:number, satuan:string, satuan_dasar:string, susut_persen:number}>} p.resep
 * @param {Map<number, {harga:number, sumber:string}>} p.hargaBahan harga per satuan dasar
 * @param {Map<number, Record<string, number>>} [p.konversi] konversi khusus per bahan
 * @param {number} p.biayaLainPorsi
 * @param {number} p.targetMargin
 */
export function hitungHppMenu({ menu, resep, hargaBahan, konversi = new Map(), biayaLainPorsi = 0, targetMargin }) {
  const porsiPerBatch = Math.max(Number(menu.porsi_per_batch) || 1, 1);
  const kurang = [];
  let totalBahan = 0;

  const rincian = resep.map((r) => {
    const konv = keSatuanDasar({
      qty: r.qty,
      satuan: r.satuan,
      satuanDasar: r.satuan_dasar,
      namaBahan: r.nama,
      konversiKhusus: konversi.get(r.bahan_id) ?? {},
    });
    const item = { bahan_id: r.bahan_id, nama: r.nama, qty: r.qty, satuan: r.satuan, satuan_dasar: r.satuan_dasar };
    if (!konv.ok) {
      kurang.push({ bahan_id: r.bahan_id, nama: r.nama, alasan: 'konversi', pesan: konv.pesan });
      return { ...item, biaya: null, masalah: konv.pesan };
    }
    const susut = Math.min(Math.max(Number(r.susut_persen) || 0, 0), 90) / 100;
    const qtyPerPorsi = konv.nilai / porsiPerBatch / (1 - susut);
    const harga = hargaBahan.get(r.bahan_id);
    if (!harga) {
      kurang.push({ bahan_id: r.bahan_id, nama: r.nama, alasan: 'harga', pesan: `Harga ${r.nama} belum ada` });
      return { ...item, qty_dasar_per_porsi: qtyPerPorsi, biaya: null, masalah: 'Harga belum ada' };
    }
    const biaya = qtyPerPorsi * harga.harga;
    totalBahan += biaya;
    return {
      ...item,
      qty_dasar_per_porsi: qtyPerPorsi,
      cara_konversi: konv.cara,
      harga_per_satuan: harga.harga,
      sumber_harga: harga.sumber,
      biaya,
    };
  });

  const lengkap = kurang.length === 0;
  const hpp = totalBahan + biayaLainPorsi;
  const m = lengkap ? margin(menu.harga_jual, hpp) : null;

  return {
    hpp,
    biaya_bahan: totalBahan,
    biaya_lain: biayaLainPorsi,
    rincian: rincian.sort((a, b) => (b.biaya ?? 0) - (a.biaya ?? 0)),
    lengkap,
    kurang,
    harga_jual: menu.harga_jual,
    margin: m,
    markup: lengkap ? markup(menu.harga_jual, hpp) : null,
    harga_aman: lengkap ? hargaAman(hpp, targetMargin) : null,
    status: statusMargin(m, targetMargin),
  };
}
