import jwt from 'jsonwebtoken';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { AiError } from '../ai/provider.js';
import { usahaMilik } from '../services/usaha.js';

export const rahasiaJwt = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET belum diisi di server/.env');
  return s;
};

export function wajibLogin(req, _res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) throw new AppError(401, 'Silakan masuk dulu');
  try {
    req.user = { id: Number(jwt.verify(token, rahasiaJwt()).sub) };
  } catch {
    throw new AppError(401, 'Sesi berakhir, silakan masuk lagi');
  }
  next();
}

// ---- Batas percobaan (di memori, cukup untuk satu server) ----
// Melindungi login dari tebak password dan menjaga kuota AI tidak dihabiskan satu orang.
const catatanBatas = new Map();
setInterval(() => {
  const kini = Date.now();
  for (const [k, v] of catatanBatas) if (!v.some((t) => kini - t < 86_400_000)) catatanBatas.delete(k);
}, 600_000).unref();

// Lewat tunnel Cloudflare semua permintaan datang dari localhost; alamat asli ada di header ini.
export const alamatKlien = (req) => req.get('cf-connecting-ip') || req.ip;

export function batasi({ nama, jendelaMenit, maks, kunci, pesan }) {
  const jendela = jendelaMenit * 60_000;
  return (req, _res, next) => {
    const k = `${nama}:${kunci(req)}`;
    const kini = Date.now();
    const daftar = (catatanBatas.get(k) ?? []).filter((t) => kini - t < jendela);
    if (daftar.length >= maks) {
      const menit = Math.max(1, Math.ceil((jendela - (kini - daftar[0])) / 60_000));
      throw new AppError(429, `${pesan} Coba lagi dalam ${menit} menit.`);
    }
    daftar.push(kini);
    catatanBatas.set(k, daftar);
    next();
  };
}

const pesanAi = 'Terlalu banyak permintaan ke AI dalam waktu singkat.';
const kunciAi = (req) => `${req.user.id}:${alamatKlien(req)}`;
export const batasMasuk = [
  batasi({ nama: 'masuk', jendelaMenit: 15, maks: 10, kunci: (req) => `${alamatKlien(req)}:${String(req.body?.email ?? '').toLowerCase()}`, pesan: 'Terlalu banyak percobaan masuk.' }),
  batasi({ nama: 'masuk-email', jendelaMenit: 15, maks: 50, kunci: (req) => String(req.body?.email ?? '').toLowerCase(), pesan: 'Terlalu banyak percobaan masuk untuk akun ini.' }),
];
export const batasDaftar = batasi({ nama: 'daftar', jendelaMenit: 60, maks: 20, kunci: alamatKlien, pesan: 'Terlalu banyak pendaftaran dari perangkat ini.' });
export const batasAi = [
  batasi({ nama: 'ai', jendelaMenit: 10, maks: 30, kunci: kunciAi, pesan: pesanAi }),
  batasi({ nama: 'ai-hari', jendelaMenit: 1440, maks: 300, kunci: kunciAi, pesan: 'Batas pemakaian AI hari ini sudah tercapai.' }),
];
export const batasPenjelasan = batasi({ nama: 'penjelasan', jendelaMenit: 10, maks: 60, kunci: kunciAi, pesan: pesanAi });

export function wajibUsaha(req, _res, next) {
  const usaha = usahaMilik(req.user.id);
  if (!usaha) throw new AppError(409, 'Usaha belum diatur. Selesaikan onboarding dulu.');
  req.usaha = usaha;
  next();
}

const TIPE_FOTO = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export const unggahFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(TIPE_FOTO.includes(file.mimetype) ? null : new AppError(400, 'File harus foto JPG, PNG, atau WEBP'), true),
}).single('foto');

export const unggahSuara = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm' ? null : new AppError(400, 'File harus rekaman suara'), true),
}).single('suara');

// Validasi body dengan skema zod; hasil bersih di req.body.
export const validasi = (skema) => (req, _res, next) => {
  req.body = skema.parse(req.body);
  next();
};

export function penangananGalat(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ pesan: 'Data belum lengkap atau tidak valid', detail: err.issues.map((i) => ({ field: i.path.join('.'), pesan: i.message })) });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ pesan: err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran file terlalu besar' : err.message });
  }
  if (err instanceof AiError) {
    // Pesan mentah dari penyedia AI hanya untuk log server, tidak dikirim ke pengguna.
    if (err.detail?.length) console.error('AI gagal:', JSON.stringify(err.detail));
    return res.status(503).json({ pesan: err.message, bisa_manual: true });
  }
  if (err instanceof AppError) return res.status(err.status).json({ pesan: err.message });
  console.error(err);
  return res.status(500).json({ pesan: 'Terjadi kesalahan di server' });
}
