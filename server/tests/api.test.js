import { describe, it, expect, beforeAll, afterAll } from 'vitest';

process.env.DB_PATH = ':memory:';
process.env.AI_MODE = 'fixture';
process.env.JWT_SECRET = 'rahasia-tes';

const { buatApp } = await import('../src/app.js');
const { imporCsv } = await import('../src/services/hargaPasar.js');

let server;
let base;
let token;
const hariIni = new Date().toISOString().slice(0, 10);

async function api(method, path, body, { form } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${base}${path}`, { method, headers, body: payload });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

beforeAll(async () => {
  server = buatApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
  imporCsv(
    [
      'komoditas,wilayah,level,harga,satuan,tanggal,sumber',
      `cabai rawit merah,Denpasar,kota,62000,kg,${hariIni},contoh`,
      `bawang merah,Denpasar,kota,38000,kg,${hariIni},contoh`,
      `telur ayam ras,Bali,provinsi,29000,kg,${hariIni},contoh`,
      `minyak goreng,Indonesia,nasional,18000,liter,${hariIni},contoh`,
      `daging ayam ras,Denpasar,kota,36000,kg,${hariIni},contoh`,
    ].join('\n'),
  );
});

afterAll(() => server?.close());

describe('alur utama end-to-end (AI fixture)', () => {
  let ayamId;
  let notaId;

  it('health dan proteksi login', async () => {
    expect((await api('GET', '/health')).data.ai_mode).toBe('fixture');
    expect((await api('GET', '/dashboard')).status).toBe(401);
  });

  it('daftar akun lalu dashboard minta onboarding', async () => {
    const r = await api('POST', '/auth/daftar', { nama: 'Bu Sari', email: 'sari@contoh.id', password: 'rahasia123' });
    expect(r.status).toBe(201);
    token = r.data.token;
    expect((await api('GET', '/dashboard')).status).toBe(409);
    expect((await api('POST', '/auth/daftar', { nama: 'X', email: 'sari@contoh.id', password: 'rahasia123' })).status).toBe(409);
  });

  it('cerita usaha menjadi draf resep', async () => {
    const r = await api('POST', '/usaha/cerita', { teks: 'Saya jualan ayam geprek dan es teh, sehari sekitar 80 porsi.' });
    expect(r.status).toBe(200);
    expect(r.data.produk).toHaveLength(2);
    expect(r.data.pertanyaan.length).toBeGreaterThan(0);
  });

  it('setup usaha menghitung HPP', async () => {
    const cerita = (await api('POST', '/usaha/cerita', { teks: 'Saya jualan ayam geprek dan es teh, sehari sekitar 80 porsi.' })).data;
    const produk = cerita.produk.map((p) => ({ ...p, harga_jual: p.harga_jual ?? 4000 }));
    const r = await api('POST', '/usaha/setup', {
      usaha: { nama: 'Warung Bu Sari', jenis: 'warung makan', kota: 'Denpasar', provinsi: 'Bali', target_margin: 0.35, porsi_per_hari: 80 },
      produk,
      biaya: cerita.biaya,
      harga_bahan: [
        { nama: 'ayam', qty: 1, satuan: 'kg', harga: 36000 },
        { nama: 'tepung bumbu', qty: 1, satuan: 'kg', harga: 12000 },
        { nama: 'cabai rawit', qty: 1, satuan: 'kg', harga: 70000 },
        { nama: 'bawang putih', qty: 1, satuan: 'kg', harga: 40000 },
        { nama: 'minyak goreng', qty: 1, satuan: 'liter', harga: 18000 },
        { nama: 'beras', qty: 1, satuan: 'kg', harga: 14000 },
        { nama: 'kertas nasi', qty: 100, satuan: 'pcs', harga: 15000 },
        { nama: 'teh celup', qty: 25, satuan: 'pcs', harga: 6250 },
        { nama: 'gula pasir', qty: 1, satuan: 'kg', harga: 17000 },
        { nama: 'es batu', qty: 1, satuan: 'kg', harga: 2000 },
        { nama: 'cup plastik', qty: 50, satuan: 'pcs', harga: 20000 },
      ],
    });
    expect(r.status).toBe(201);
    const ayam = r.data.produk.find((p) => p.nama === 'Ayam Geprek');
    ayamId = ayam.id;
    expect(ayam.lengkap).toBe(true);
    // bahan: ayam 125g x 36 + tepung 50 x 12 + cabai 20 x 70 + bawang 5 x 40 + minyak 15 x 18 + beras 100 x 14 + kertas 150
    const bahan = 4500 + 600 + 1400 + 200 + 270 + 1400 + 150;
    const lain = 11000 / 80 + 300000 / (80 * 30);
    expect(ayam.hpp).toBeCloseTo(bahan + lain, 3);
  });

  it('pindai nota membuat draf dengan tanda masalah', async () => {
    const form = new FormData();
    form.append('foto', new Blob([Buffer.from('foto-palsu')], { type: 'image/jpeg' }), 'nota.jpg');
    const r = await api('POST', '/pembelian/foto', undefined, { form });
    expect(r.status).toBe(201);
    notaId = r.data.id;
    expect(r.data.item).toHaveLength(5);
    const kertas = r.data.item.find((i) => i.nama_bahan === 'kertas nasi');
    expect(kertas.masalah.map((m) => m.kode)).toContain('konversi');
    expect(kertas.masalah.map((m) => m.kode)).toContain('yakin_rendah');
    const cabai = r.data.item.find((i) => i.nama_bahan === 'cabai rawit');
    expect(cabai.bahan_id).not.toBeNull();
    expect(cabai.harga_satuan.harga).toBe(95000);
    expect(cabai.acuan.harga).toBe(62000);
    expect(cabai.status_acuan).toBe('jauh_di_atas');
    expect(r.data.peringatan).toHaveLength(0);
  });

  it('menyimpan koreksi lalu HPP dan dampak berubah', async () => {
    const draf = (await api('GET', `/pembelian/${notaId}`)).data;
    const item = draf.item.map((i) => ({
      teks_asli: i.teks_asli,
      nama_bahan: i.nama_bahan,
      bahan_id: i.bahan_id,
      qty: i.qty,
      satuan: i.satuan,
      harga: i.harga,
      ...(i.nama_bahan === 'kertas nasi' ? { konversi_faktor: 100 } : {}),
    }));
    const r = await api('PUT', `/pembelian/${notaId}`, { nama_toko: draf.nama_toko, item });
    expect(r.status).toBe(200);
    const ayam = r.data.dampak.find((d) => d.nama === 'Ayam Geprek');
    expect(ayam.hpp_baru).toBeGreaterThan(ayam.hpp_lama);
    expect(ayam.margin_baru).toBeLessThan(ayam.margin_lama);
    expect(ayam.bahan_terkait).toContain('cabai rawit');

    const ulang = (await api('POST', '/pembelian/foto', undefined, { form: (() => { const f = new FormData(); f.append('foto', new Blob([Buffer.from('x')], { type: 'image/png' }), 'a.png'); return f; })() })).data;
    const kertas = ulang.item.find((i) => i.nama_bahan === 'kertas nasi');
    expect(kertas.masalah.map((m) => m.kode)).not.toContain('konversi');
    await api('DELETE', `/pembelian/${ulang.id}`);
  });

  it('rekomendasi memakai angka yang tervalidasi', async () => {
    const r = await api('GET', `/produk/${ayamId}/rekomendasi`);
    expect(r.status).toBe(200);
    expect(r.data.penjelasan).toContain('Ayam Geprek');
    expect(r.data.sumber_penjelasan).toBe('templat');
    if (r.data.status !== 'aman') expect(r.data.opsi.length).toBeGreaterThan(0);
  });

  it('simulasi tidak menyimpan perubahan', async () => {
    const sebelum = (await api('GET', `/produk/${ayamId}`)).data;
    const r = await api('POST', `/produk/${ayamId}/simulasi`, { harga_jual: 17000 });
    expect(r.data.simulasi.margin).toBeGreaterThan(sebelum.margin);
    expect((await api('GET', `/produk/${ayamId}`)).data.harga_jual).toBe(15000);
  });

  it('catat belanja lewat teks menandai harga kosong', async () => {
    const r = await api('POST', '/pembelian/teks', { teks: 'cabe rawit setengah kilo tiga lima ribu, gula dua kilo' });
    expect(r.status).toBe(201);
    expect(r.data.sumber).toBe('teks');
    const gula = r.data.item.find((i) => i.nama_bahan === 'gula pasir');
    expect(gula.masalah.map((m) => m.kode)).toContain('harga_kosong');
    const tolak = await api('PUT', `/pembelian/${r.data.id}`, { item: r.data.item.map((i) => ({ nama_bahan: i.nama_bahan, bahan_id: i.bahan_id, qty: i.qty, satuan: i.satuan, harga: i.harga })) });
    expect(tolak.status).toBe(400);
  });

  it('promo menghitung paket dan menolak harga rugi', async () => {
    const produkList = (await api('GET', '/produk')).data;
    const esTeh = produkList.find((p) => p.nama === 'Es Teh');
    const items = [{ menu_id: ayamId, qty: 1 }, { menu_id: esTeh.id, qty: 1 }];
    const h = await api('POST', '/promo/hitung', { items, harga_paket: 17000 });
    expect(h.status).toBe(200);
    expect(h.data.opsi).toHaveLength(3);
    expect(h.data.harga_normal).toBe(19000);
    const saran = await api('POST', '/promo/saran', { items, harga_paket: 17000 });
    expect(saran.data.nama).toBeTruthy();
    expect((await api('POST', '/promo', { nama: 'Rugi', items, harga_paket: 5000 })).status).toBe(400);
    expect((await api('POST', '/promo', { nama: 'Paket Hemat', items, harga_paket: 17000 })).status).toBe(201);
    expect((await api('GET', '/promo')).data).toHaveLength(1);
    // Caption dengan harga lain ditolak, harga paket dan harga normal boleh.
    const salah = await api('POST', '/promo', { nama: 'Salah', items, harga_paket: 17000, caption: 'Cuma 15rb saja!' });
    expect(salah.status).toBe(400);
    expect(salah.data.error ?? salah.data.pesan ?? JSON.stringify(salah.data)).toMatch(/15rb/);
    const idPaket = (await api('GET', '/promo')).data[0].id;
    const ubah = await api('PUT', `/promo/${idPaket}`, { nama: 'Paket Hemat Baru', items, harga_paket: 18000, caption: 'Sekarang Rp18.000 saja' });
    expect(ubah.status).toBe(200);
    const sesudah = (await api('GET', '/promo')).data;
    expect(sesudah).toHaveLength(1);
    expect(sesudah[0]).toMatchObject({ nama: 'Paket Hemat Baru', harga_paket: 18000 });
  });

  it('dashboard dan bahan baku', async () => {
    const d = (await api('GET', '/dashboard')).data;
    expect(d.kpi.jumlah_produk).toBe(2);
    expect(d.bahan_naik.some((b) => b.nama === 'cabai rawit')).toBe(true);
    expect(d.harga_pasar.length).toBeGreaterThan(0);
    const daftar = (await api('GET', '/bahan')).data;
    const cabai = daftar.find((b) => b.nama === 'cabai rawit');
    const detail = (await api('GET', `/bahan/${cabai.id}`)).data;
    expect(detail.riwayat.length).toBe(2);
    expect(detail.alias).toContain('cbe rwt 1/2');
  });

  it('validasi input menolak data buruk', async () => {
    expect((await api('POST', '/produk', { nama: '', harga_jual: -1, bahan: [] })).status).toBe(400);
    expect((await api('GET', '/produk/9999')).status).toBe(404);
  });
});

describe('onboarding tanpa menu dan jenis usaha lain', () => {
  it('jenis usaha lain diperiksa: kuliner diterima, non-kuliner ditolak', async () => {
    token = (await api('POST', '/auth/daftar', { nama: 'Pak Made', email: 'made@contoh.id', password: 'rahasia123' })).data.token;
    const ok = await api('POST', '/usaha/cek-jenis', { teks: 'angkringan' });
    expect(ok.status).toBe(200);
    expect(ok.data.valid).toBe(true);
    const tolak = await api('POST', '/usaha/cek-jenis', { teks: 'toko baju' });
    expect(tolak.data.valid).toBe(false);
    expect((await api('POST', '/usaha/cek-jenis', { teks: 'a' })).status).toBe(400);
  });

  it('setup boleh tanpa menu, menu ditambah setelah masuk', async () => {
    const r = await api('POST', '/usaha/setup', {
      usaha: { nama: 'Angkringan Pak Made', jenis: 'angkringan', kota: 'Denpasar', provinsi: 'Bali', target_margin: 0.4, porsi_per_hari: 50 },
      produk: [],
      biaya: [],
    });
    expect(r.status).toBe(201);
    expect(r.data.produk).toHaveLength(0);
    const d = await api('GET', '/dashboard');
    expect(d.status).toBe(200);
    expect(d.data.produk).toHaveLength(0);
  });
});

describe('harga perkiraan bahan', () => {
  it('bahan tanpa harga bisa diisi perkiraan sehingga modal menu lengkap', async () => {
    const p = await api('POST', '/produk', { nama: 'Seblak', harga_jual: 12000, porsi_per_batch: 1, bahan: [{ nama: 'kerupuk mentah', qty: 30, satuan: 'gram' }] });
    expect(p.status).toBe(201);
    expect(p.data.lengkap).toBe(false);
    const bahanId = p.data.kurang[0].bahan_id;
    const r = await api('POST', `/bahan/${bahanId}/harga`, { qty: 1, satuan: 'kg', harga: 30000 });
    expect(r.status).toBe(201);
    const d = await api('GET', `/produk/${p.data.id}`);
    expect(d.data.lengkap).toBe(true);
    expect(d.data.rincian[0].biaya).toBeCloseTo(900, 3);
    expect((await api('POST', `/bahan/${bahanId}/harga`, { qty: 0, satuan: 'kg', harga: 1 })).status).toBe(400);
  });

  it('harga perkiraan yang tidak wajar minta konfirmasi dulu', async () => {
    const p = await api('POST', '/produk', { nama: 'Cimol', harga_jual: 10000, porsi_per_batch: 1, bahan: [{ nama: 'tepung tapioka', qty: 50, satuan: 'gram' }] });
    const bahanId = p.data.kurang[0].bahan_id;
    // Salah satuan: Rp40 per kg, tanpa pembanding → di luar batas wajar.
    const salah = await api('POST', `/bahan/${bahanId}/harga`, { qty: 1, satuan: 'kg', harga: 40 });
    expect(salah.status).toBe(409);
    expect(salah.data.pesan).toMatch(/Rp40\/kg/);
    // Harga wajar tersimpan; setelah itu harga yang jauh dari belanja terakhir juga ditanya.
    expect((await api('POST', `/bahan/${bahanId}/harga`, { qty: 1, satuan: 'kg', harga: 14000 })).status).toBe(201);
    const jauh = await api('POST', `/bahan/${bahanId}/harga`, { qty: 1, satuan: 'kg', harga: 50000 });
    expect(jauh.status).toBe(409);
    expect(jauh.data.pesan).toMatch(/belanja terakhir \(Rp14\.000\/kg\)/);
    // Pengguna yakin: tetap tersimpan.
    expect((await api('POST', `/bahan/${bahanId}/harga`, { qty: 1, satuan: 'kg', harga: 50000, yakin: true })).status).toBe(201);
  });
});
