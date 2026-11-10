import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { get, run } from '../lib/db.js';
import { AppError } from '../lib/errors.js';
import { modeAi, cekJenisUsaha, transkripsi } from '../ai/provider.js';
import { wajibLogin, wajibUsaha, unggahFoto, unggahSuara, validasi, rahasiaJwt } from '../middleware/index.js';
import * as S from './skema.js';
import * as usaha from '../services/usaha.js';
import * as produk from '../services/produk.js';
import * as pembelian from '../services/pembelian.js';
import * as bahan from '../services/bahan.js';
import * as dashboard from '../services/dashboard.js';
import * as promo from '../services/promo.js';
import * as pasar from '../services/pasar.js';
import * as pihps from '../services/pihps.js';
import { simpanKonversi } from '../services/bahan.js';

export const router = Router();
const id = (req) => Number(req.params.id);

router.get('/health', (_req, res) => res.json({ ok: true, ai_mode: modeAi() }));

// ---- Akun ----
const buatToken = (userId) => jwt.sign({ sub: String(userId) }, rahasiaJwt(), { expiresIn: '7d' });

router.post('/auth/daftar', validasi(S.daftar), async (req, res) => {
  const { nama, email, password } = req.body;
  if (get('SELECT id FROM users WHERE email = ?', email)) throw new AppError(409, 'Email sudah terdaftar');
  const hash = await bcrypt.hash(password, 10);
  const { lastInsertRowid } = run('INSERT INTO users (email, password_hash, nama) VALUES (?, ?, ?)', email, hash, nama);
  res.status(201).json({ token: buatToken(Number(lastInsertRowid)), user: { id: Number(lastInsertRowid), nama, email }, punya_usaha: false });
});

router.post('/auth/masuk', validasi(S.masuk), async (req, res) => {
  const user = get('SELECT * FROM users WHERE email = ?', req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) throw new AppError(401, 'Email atau password salah');
  res.json({ token: buatToken(user.id), user: { id: user.id, nama: user.nama, email: user.email }, punya_usaha: Boolean(usaha.usahaMilik(user.id)) });
});

router.use(wajibLogin);

router.get('/auth/saya', (req, res) => {
  const user = get('SELECT id, nama, email FROM users WHERE id = ?', req.user.id);
  if (!user) throw new AppError(401, 'Akun tidak ditemukan');
  res.json({ user, usaha: usaha.usahaMilik(req.user.id) });
});

router.get('/pasar/provinsi', async (_req, res) => res.json(await pasar.daftarProvinsiPilihan()));
router.get('/pasar/kota', async (req, res) => res.json(await pasar.daftarKotaPilihan(String(req.query.provinsi || ''))));

// ---- Onboarding ----
// Rekaman suara menjadi teks (cadangan untuk browser tanpa pengenal suara bawaan).
router.post('/suara/teks', unggahSuara, async (req, res) => {
  if (!req.file) throw new AppError(400, 'Rekaman suara belum ada');
  const { teks } = await transkripsi(req.file.buffer, req.file.originalname, req.file.mimetype);
  if (!teks?.trim()) throw new AppError(422, 'Suara tidak terdengar jelas. Coba rekam lagi.');
  res.json({ teks: teks.trim() });
});
router.post('/usaha/cek-jenis', validasi(S.cekJenis), async (req, res) => res.json((await cekJenisUsaha(req.body.teks)).data));
router.post('/usaha/cerita', validasi(S.cerita), async (req, res) => res.json(await usaha.draftDariCerita(req.body.teks)));
router.post('/usaha/setup', validasi(S.setup), (req, res) => {
  const hasil = usaha.simpanSetup(req.user.id, req.body);
  pihps.pastikanSegar(usaha.usahaMilik(req.user.id));
  res.status(201).json(hasil);
});

router.use(wajibUsaha);

router.get('/usaha', (req, res) => res.json({ ...req.usaha, biaya: usaha.daftarBiaya(req.usaha.id) }));
router.put('/usaha', validasi(S.profilUsaha), (req, res) => {
  const hasil = usaha.ubahProfil(req.usaha, req.body);
  pihps.pastikanSegar(usaha.usahaMilik(req.user.id));
  res.json(hasil);
});
router.put('/usaha/biaya', validasi(S.biaya.array()), (req, res) => res.json(usaha.gantiBiaya(req.usaha.id, req.body)));

router.get('/dashboard', (req, res) => {
  pihps.pastikanSegar(req.usaha);
  res.json(dashboard.ringkasan(req.usaha));
});
router.get('/dashboard/catatan', async (req, res) => res.json(await pasar.catatanHarian(req.usaha)));
router.get('/pasar', (req, res) => {
  pihps.pastikanSegar(req.usaha);
  res.json({ wilayah: { kota: req.usaha.kota, provinsi: req.usaha.provinsi }, sinkron: pihps.statusSinkron(req.usaha), harga: pasar.hargaWilayah(req.usaha) });
});
// Tarik harga terbaru sekarang dan tunggu hasilnya.
router.post('/pasar/perbarui', async (req, res) => {
  if (!pihps.hargaLiveAktif()) throw new AppError(409, 'Pengambilan harga pasar otomatis sedang tidak aktif. Harga yang tampil adalah data tersimpan terakhir.');
  const hasil = await pihps.perbarui(req.usaha, { paksa: true });
  res.json({ hasil, sinkron: pihps.statusSinkron(req.usaha), harga: pasar.hargaWilayah(req.usaha) });
});

// ---- Produk ----
router.get('/produk', (req, res) => res.json(produk.daftar(req.usaha)));
router.post('/produk', validasi(S.produk), (req, res) => res.status(201).json(produk.buat(req.usaha, req.body)));
router.get('/produk/:id', (req, res) => res.json(produk.detail(req.usaha, id(req))));
router.put('/produk/:id', validasi(S.produkUbah), (req, res) => res.json(produk.ubah(req.usaha, id(req), req.body)));
router.delete('/produk/:id', (req, res) => {
  produk.hapus(req.usaha, id(req));
  res.status(204).end();
});
router.post('/produk/:id/simulasi', validasi(S.simulasi), (req, res) => res.json(produk.simulasi(req.usaha, id(req), req.body)));
router.get('/produk/:id/rekomendasi', async (req, res) => res.json(await produk.rekomendasi(req.usaha, id(req))));

// ---- Pembelian bahan ----
router.get('/pembelian', (req, res) => res.json(pembelian.daftar(req.usaha)));
router.post('/pembelian/foto', unggahFoto, async (req, res) => {
  if (!req.file) throw new AppError(400, 'Foto nota belum dipilih');
  res.status(201).json(await pembelian.dariFoto(req.usaha, req.file));
});
router.post('/pembelian/suara', unggahSuara, async (req, res) => {
  if (!req.file) throw new AppError(400, 'Rekaman suara belum ada');
  res.status(201).json(await pembelian.dariSuara(req.usaha, req.file));
});
router.post('/pembelian/teks', validasi(S.teksBelanja), async (req, res) => res.status(201).json(await pembelian.dariTeks(req.usaha, req.body.teks, req.body.sumber)));
router.post('/pembelian/manual', validasi(S.belanjaManual), (req, res) =>
  res.status(201).json(pembelian.buatDraf(req.usaha, { sumber: 'manual', ...req.body, item: req.body.item.map((i) => ({ ...i, yakin: 1 })) })),
);
router.get('/pembelian/:id', (req, res) => res.json(pembelian.lihat(req.usaha, id(req))));
router.put('/pembelian/:id', validasi(S.simpanBelanja), (req, res) => res.json(pembelian.simpan(req.usaha, id(req), req.body)));
router.delete('/pembelian/:id', (req, res) => {
  pembelian.hapus(req.usaha, id(req));
  res.status(204).end();
});

// ---- Bahan baku ----
router.get('/bahan', (req, res) => res.json(dashboard.bahanDenganKontribusi(req.usaha)));
router.get('/bahan/:id', (req, res) => res.json(bahan.detailBahan(req.usaha, id(req))));
router.put('/bahan/:id', validasi(S.ubahBahan), (req, res) => res.json(bahan.ubahBahan(req.usaha, id(req), req.body)));
router.post('/bahan/:id/harga', validasi(S.hargaManual), (req, res) => res.status(201).json(bahan.isiHargaManual(req.usaha, id(req), req.body)));
router.post('/bahan/:id/konversi', validasi(S.konversi), (req, res) => {
  bahan.detailBahan(req.usaha, id(req));
  simpanKonversi(id(req), req.body.satuan, req.body.faktor);
  res.json(bahan.detailBahan(req.usaha, id(req)));
});

// ---- Promo ----
router.post('/promo/hitung', validasi(S.promoHitung), (req, res) => res.json(promo.hitung(req.usaha, req.body)));
router.post('/promo/saran', validasi(S.promoHitung), async (req, res) => res.json(await promo.saran(req.usaha, req.body)));
router.get('/promo', (req, res) => res.json(promo.daftar(req.usaha)));
router.post('/promo', validasi(S.promoSimpan), (req, res) => res.status(201).json(promo.simpan(req.usaha, req.body)));
router.delete('/promo/:id', (req, res) => {
  promo.hapus(req.usaha, id(req));
  res.status(204).end();
});
