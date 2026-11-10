import { describe, it, expect } from 'vitest';
import { keSatuanDasar, normalisasiSatuan } from '../src/domain/satuan.js';
import { margin, hargaAman, statusMargin, hargaRataRata, statusAcuan, hargaMencurigakan } from '../src/domain/harga.js';
import { hitungHppMenu, biayaLainPerPorsi } from '../src/domain/hpp.js';
import { opsiPerbaikan } from '../src/domain/rekomendasi.js';
import { hitungPromo } from '../src/domain/promo.js';
import { validasiAngka } from '../src/domain/validasiAngka.js';
import { cocokkanKomoditas, acuanKeSatuanDasar } from '../src/domain/komoditas.js';

describe('satuan', () => {
  it('menormalkan sinonim', () => {
    expect(normalisasiSatuan('Sendok Makan')).toBe('sdm');
    expect(normalisasiSatuan('kilo')).toBe('kg');
  });
  it('mengubah satuan standar', () => {
    expect(keSatuanDasar({ qty: 0.5, satuan: 'kg', satuanDasar: 'g', namaBahan: 'cabai' }).nilai).toBe(500);
    expect(keSatuanDasar({ qty: 2, satuan: 'liter', satuanDasar: 'ml', namaBahan: 'minyak' }).nilai).toBe(2000);
  });
  it('memakai URT per bahan', () => {
    expect(keSatuanDasar({ qty: 2, satuan: 'sdm', satuanDasar: 'g', namaBahan: 'gula pasir' }).nilai).toBe(25);
    expect(keSatuanDasar({ qty: 3, satuan: 'siung', satuanDasar: 'g', namaBahan: 'bawang merah' }).nilai).toBe(21);
  });
  it('telur per kg ke butir', () => {
    expect(keSatuanDasar({ qty: 1, satuan: 'kg', satuanDasar: 'butir', namaBahan: 'telur ayam' }).nilai).toBe(16);
  });
  it('minta konversi untuk satuan yang tidak dikenal', () => {
    const r = keSatuanDasar({ qty: 1, satuan: 'ikat', satuanDasar: 'g', namaBahan: 'kangkung' });
    expect(r.ok).toBe(false);
    expect(keSatuanDasar({ qty: 1, satuan: 'ikat', satuanDasar: 'g', namaBahan: 'kangkung', konversiKhusus: { ikat: 250 } }).nilai).toBe(250);
  });
});

describe('harga', () => {
  it('margin dan harga aman', () => {
    expect(margin(15000, 10300)).toBeCloseTo(0.3133, 3);
    expect(hargaAman(12400, 0.3)).toBe(18000);
    expect(statusMargin(0.31, 0.35)).toBe('waspada');
    expect(statusMargin(-0.1, 0.35)).toBe('rugi');
    expect(statusMargin(0.4, 0.35)).toBe('aman');
  });
  it('rata-rata tertimbang 3 pembelian terakhir', () => {
    const r = hargaRataRata([
      { harga_per_satuan: 70, tanggal: '2026-10-20' },
      { harga_per_satuan: 72, tanggal: '2026-10-27' },
      { harga_per_satuan: 95, tanggal: '2026-11-10' },
      { harga_per_satuan: 10, tanggal: '2026-01-01' },
    ]);
    expect(r).toBeCloseTo((95 * 3 + 72 * 2 + 70) / 6, 6);
  });
  it('status acuan dan harga mencurigakan', () => {
    expect(statusAcuan(0.13)).toBe('di_atas');
    expect(statusAcuan(0.05)).toBe('wajar');
    expect(hargaMencurigakan(3.5, 35)).toBe(true);
    expect(hargaMencurigakan(36, 35)).toBe(false);
  });
});

describe('hpp', () => {
  const resep = [
    { bahan_id: 1, nama: 'cabai rawit', qty: 20, satuan: 'g', satuan_dasar: 'g', susut_persen: 0 },
    { bahan_id: 2, nama: 'gula pasir', qty: 2, satuan: 'sdm', satuan_dasar: 'g', susut_persen: 0 },
  ];
  const harga = new Map([[1, { harga: 70, sumber: 'nota' }], [2, { harga: 17, sumber: 'nota' }]]);

  it('menghitung HPP, margin, harga aman', () => {
    const h = hitungHppMenu({ menu: { harga_jual: 5000, porsi_per_batch: 1 }, resep, hargaBahan: harga, biayaLainPorsi: 100, targetMargin: 0.35 });
    expect(h.biaya_bahan).toBeCloseTo(20 * 70 + 25 * 17, 6);
    expect(h.hpp).toBeCloseTo(1825 + 100, 6);
    expect(h.lengkap).toBe(true);
    expect(h.harga_aman).toBe(3000);
    expect(h.status).toBe('aman');
  });
  it('membagi per batch dan memperhitungkan susut', () => {
    const h = hitungHppMenu({
      menu: { harga_jual: 10000, porsi_per_batch: 10 },
      resep: [{ bahan_id: 1, nama: 'ayam', qty: 1, satuan: 'kg', satuan_dasar: 'g', susut_persen: 20 }],
      hargaBahan: new Map([[1, { harga: 40, sumber: 'nota' }]]),
      targetMargin: 0.35,
    });
    expect(h.hpp).toBeCloseTo((1000 / 10 / 0.8) * 40, 6);
  });
  it('menandai bahan tanpa harga', () => {
    const h = hitungHppMenu({ menu: { harga_jual: 5000 }, resep, hargaBahan: new Map([[1, { harga: 70 }]]), targetMargin: 0.35 });
    expect(h.lengkap).toBe(false);
    expect(h.kurang[0].nama).toBe('gula pasir');
    expect(h.margin).toBeNull();
  });
  it('biaya lain per porsi', () => {
    const b = biayaLainPerPorsi([
      { nominal: 11000, periode: 'hari' },
      { nominal: 300000, periode: 'bulan' },
      { nominal: 200, periode: 'porsi' },
    ], 100);
    expect(b).toBeCloseTo(110 + 100 + 200, 6);
  });
});

describe('rekomendasi', () => {
  it('memberi opsi saat margin di bawah target', () => {
    const opsi = opsiPerbaikan({ harga_jual: 15000, hpp: 10000, rincian: [{ nama: 'ayam', biaya: 5000 }] }, 0.35);
    expect(opsi[0].jenis).toBe('naik_harga');
    expect(opsi[0].harga_jual).toBe(15500);
    expect(opsi[1].jenis).toBe('kurangi_takaran');
    expect(opsi[1].margin).toBeGreaterThanOrEqual(0.35);
  });
  it('tidak memberi opsi saat margin aman', () => {
    expect(opsiPerbaikan({ harga_jual: 20000, hpp: 10000, rincian: [] }, 0.35)).toEqual([]);
  });
});

describe('promo', () => {
  it('sesuai contoh perhitungan bundling', () => {
    const p = hitungPromo({
      items: [
        { nama: 'ayam geprek', hpp: 10300, harga_jual: 15000, qty: 1 },
        { nama: 'es teh', hpp: 2100, harga_jual: 5000, qty: 1 },
      ],
      targetMargin: 0.3,
    });
    expect(p.hpp_paket).toBe(12400);
    expect(p.harga_normal).toBe(20000);
    const [aman, seimbang, agresif] = p.opsi;
    expect(aman.harga).toBe(18000);
    expect(aman.kenaikan_volume).toBeCloseTo(7600 / 5600 - 1, 6);
    expect(seimbang.harga).toBe(17000);
    expect(agresif.harga).toBe(15500);
    expect(agresif.hemat_pelanggan).toBe(4500);
  });
  it('menandai harga paket rugi', () => {
    const p = hitungPromo({ items: [{ nama: 'a', hpp: 10000, harga_jual: 12000, qty: 1 }], hargaPaket: 9000, targetMargin: 0.3 });
    expect(p.usulan.status).toBe('rugi');
  });
});

describe('validasi angka', () => {
  it('menerima angka yang ada di data', () => {
    expect(validasiAngka('Naikkan ke Rp16.000, margin jadi 40%', [16000], [40]).valid).toBe(true);
  });
  it('menolak angka karangan', () => {
    const v = validasiAngka('Untung naik jadi Rp25.000 atau 55%', [16000], [40]);
    expect(v.valid).toBe(false);
    expect(v.asing).toHaveLength(2);
  });
});

describe('komoditas', () => {
  it('mencocokkan nama sehari-hari', () => {
    expect(cocokkanKomoditas('cabe setan')).toBe('cabai rawit merah');
    expect(cocokkanKomoditas('telor')).toBe('telur ayam ras');
    expect(cocokkanKomoditas('kecap manis')).toBeNull();
  });
  it('mengubah harga acuan ke satuan dasar', () => {
    expect(acuanKeSatuanDasar(62000, 'kg', 'g')).toBe(62);
    expect(acuanKeSatuanDasar(32000, 'kg', 'butir')).toBe(2000);
  });
});
