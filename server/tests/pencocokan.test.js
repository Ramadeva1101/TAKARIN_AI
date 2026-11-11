import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { bandingNama } from '../src/domain/pencocokan.js';
import { cocokkanKomoditas } from '../src/domain/komoditas.js';

process.env.DB_PATH = ':memory:';
process.env.AI_MODE = 'fixture';
process.env.JWT_SECRET = 'rahasia-tes';

const { buatApp } = await import('../src/app.js');

describe('aturan pencocokan nama bahan', () => {
  it('ejaan beda dianggap sama, varian beda dianggap bahan lain', () => {
    expect(bandingNama('cabe rawit', 'cabai rawit')).toBe('persis');
    expect(bandingNama('Telor', 'telur')).toBe('persis');
    expect(bandingNama('ayam potong', 'ayam')).toBe('persis');
    expect(bandingNama('dada ayam', 'ayam')).toBe('mirip');
    expect(bandingNama('minyak', 'minyak goreng')).toBe('mirip');
    expect(bandingNama('gula merah', 'gula pasir')).toBeNull();
    expect(bandingNama('tepung beras', 'beras')).toBeNull();
    expect(bandingNama('telur puyuh', 'telur')).toBeNull();
    expect(bandingNama('ayam kampung', 'ayam')).toBeNull();
  });

  it('komoditas PIHPS tidak dipasang ke produk lain', () => {
    expect(cocokkanKomoditas('gula merah')).toBeNull();
    expect(cocokkanKomoditas('minyak wijen')).toBeNull();
    expect(cocokkanKomoditas('tepung beras')).toBeNull();
    expect(cocokkanKomoditas('kaldu ayam')).toBeNull();
    expect(cocokkanKomoditas('cabe rawit')).toBe('cabai rawit merah');
    expect(cocokkanKomoditas('gula')).toBe('gula pasir');
  });
});

describe('menu dan belanja bertemu di bahan yang sama', () => {
  let server;
  let base;
  let token;
  const api = async (method, path, body) => {
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const res = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    return { status: res.status, data: text ? JSON.parse(text) : null };
  };
  const bahanBernama = async (nama) => (await api('GET', '/bahan')).data.find((b) => b.nama === nama);

  beforeAll(async () => {
    server = buatApp().listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${server.address().port}/api`;
    token = (await api('POST', '/auth/daftar', { nama: 'Bu Tes', email: 'cocok@contoh.id', password: 'rahasia123' })).data.token;
    const r = await api('POST', '/usaha/setup', {
      usaha: { nama: 'Warung Tes', jenis: 'warung makan', kota: 'Denpasar', provinsi: 'Bali', target_margin: 0.4, porsi_per_hari: 50 },
      produk: [],
      biaya: [],
      harga_bahan: [
        { nama: 'cabai rawit', qty: 1, satuan: 'kg', harga: 70000 },
        { nama: 'ayam', qty: 1, satuan: 'kg', harga: 36000 },
        { nama: 'gula pasir', qty: 1, satuan: 'kg', harga: 17000 },
      ],
    });
    expect(r.status).toBe(201);
  });

  afterAll(() => server?.close());

  it('status nama di resep: terhubung, mirip, atau baru', async () => {
    const r = await api('POST', '/bahan/cocokkan', { nama: ['cabe rawit', 'dada ayam', 'gula merah', ''] });
    expect(r.status).toBe(200);
    const [cabe, dada, gula, kosong] = r.data;
    expect(cabe).toMatchObject({ status: 'terhubung', bahan: { nama: 'cabai rawit', harga: { harga: 70000, satuan: 'kg' }, sumber_harga: 'belanja' } });
    expect(dada).toMatchObject({ status: 'mirip', bahan: { nama: 'ayam' } });
    expect(gula.status).toBe('baru');
    expect(kosong.status).toBe('kosong');
  });

  it('menu memakai harga belanja lewat nama yang dirapikan dan pilihan pengguna', async () => {
    const ayam = await bahanBernama('ayam');
    const jumlahAwal = (await api('GET', '/bahan')).data.length;
    const p = await api('POST', '/produk', {
      nama: 'Ayam Sambal',
      harga_jual: 15000,
      porsi_per_batch: 1,
      bahan: [
        { nama: 'cabe rawit', qty: 20, satuan: 'g' },
        { nama: 'dada ayam', bahan_id: ayam.id, qty: 100, satuan: 'g' },
      ],
    });
    expect(p.status).toBe(201);
    expect(p.data.lengkap).toBe(true);
    expect(p.data.hpp).toBeCloseTo(20 * 70 + 100 * 36, 3);
    // Tidak ada bahan ganda yang dibuat.
    expect((await api('GET', '/bahan')).data.length).toBe(jumlahAwal);
    // Pilihan "dada ayam = ayam" diingat.
    const lagi = await api('POST', '/bahan/cocokkan', { nama: ['dada ayam'] });
    expect(lagi.data[0].status).toBe('terhubung');
  });

  it('nama mirip tidak dihubungkan otomatis saat menu disimpan tanpa pilihan', async () => {
    const p = await api('POST', '/produk', { nama: 'Es Gula Aren', harga_jual: 8000, porsi_per_batch: 1, bahan: [{ nama: 'gula merah', qty: 30, satuan: 'g' }] });
    expect(p.status).toBe(201);
    expect(p.data.lengkap).toBe(false);
    expect(await bahanBernama('gula merah')).toBeTruthy();
    const pasir = await bahanBernama('gula pasir');
    expect(pasir.harga_terakhir ?? pasir.harga).not.toBeNull();
  });

  it('belanja: varian beda jadi bahan baru, nama mirip ditandai untuk dicek', async () => {
    const r = await api('POST', '/pembelian/manual', {
      item: [
        { nama_bahan: 'ayam potong', qty: 1, satuan: 'kg', harga: 38000 },
        { nama_bahan: 'telur puyuh', qty: 1, satuan: 'kg', harga: 40000 },
        { nama_bahan: 'gula', qty: 1, satuan: 'kg', harga: 18000 },
      ],
    });
    expect(r.status).toBe(201);
    const [ayam, puyuh, gula] = r.data.item;
    expect(ayam.bahan_nama).toBe('ayam');
    expect(ayam.masalah.map((m) => m.kode)).not.toContain('bahan_mirip');
    expect(puyuh.bahan_id).toBeNull();
    expect(gula.bahan_nama).toBe('gula pasir');
    expect(gula.masalah.map((m) => m.kode)).toContain('bahan_mirip');
  });

  it('bahan ganda bisa digabung dan menu ikut memakai harga tujuan', async () => {
    const p = await api('POST', '/produk', { nama: 'Sambal Korek', harga_jual: 5000, porsi_per_batch: 1, bahan: [{ nama: 'cabe', qty: 10, satuan: 'g' }] });
    expect(p.data.lengkap).toBe(false);
    const cabai = await bahanBernama('cabe');
    const rawit = await bahanBernama('cabai rawit');
    expect(cabai).toBeTruthy();
    const g = await api('POST', `/bahan/${cabai.id}/gabung`, { ke_id: rawit.id });
    expect(g.status).toBe(200);
    expect(await bahanBernama('cabe')).toBeFalsy();
    const d = await api('GET', `/produk/${p.data.id}`);
    expect(d.data.lengkap).toBe(true);
    expect((await api('POST', '/bahan/cocokkan', { nama: ['cabe'] })).data[0]).toMatchObject({ status: 'terhubung', bahan: { nama: 'cabai rawit' } });
    expect((await api('POST', `/bahan/${rawit.id}/gabung`, { ke_id: rawit.id })).status).toBe(400);
  });

  it('ayam dibeli di dua toko: satu bahan, modal ikut rata-rata tertimbang', async () => {
    const beli = async (toko, tanggal, harga) => {
      const draf = await api('POST', '/pembelian/manual', { nama_toko: toko, tanggal, item: [{ nama_bahan: 'ayam', qty: 1, satuan: 'kg', harga }] });
      expect(draf.status).toBe(201);
      const s = await api('PUT', `/pembelian/${draf.data.id}`, {
        nama_toko: toko,
        tanggal,
        item: draf.data.item.map((i) => ({ teks_asli: i.teks_asli, nama_bahan: i.nama_bahan, bahan_id: i.bahan_id, qty: i.qty, satuan: i.satuan, harga: i.harga })),
      });
      expect(s.status).toBe(200);
    };
    const jumlahAwal = (await api('GET', '/bahan')).data.length;
    await beli('Pasar Badung', '2026-11-01', 40000);
    await beli('Toko Ayam Pak Wayan', '2026-11-02', 30000);
    expect((await api('GET', '/bahan')).data.length).toBe(jumlahAwal);
    const ayam = await bahanBernama('ayam');
    const detail = (await api('GET', `/bahan/${ayam.id}`)).data;
    expect(detail.riwayat.map((r) => r.nama_toko)).toEqual(expect.arrayContaining(['Pasar Badung', 'Toko Ayam Pak Wayan']));
    // Tiga harga terakhir (terbaru dulu): 36.000 saat daftar (hari ini), 30.000 (2 Nov), 40.000 (1 Nov), bobot 3:2:1.
    const harapan = (36000 * 3 + 30000 * 2 + 40000 * 1) / 6;
    const status = (await api('POST', '/bahan/cocokkan', { nama: ['ayam'] })).data[0];
    expect(status.bahan.harga.harga).toBe(Math.round(harapan));
  });
});
