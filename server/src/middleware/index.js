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
  if (err instanceof AiError) return res.status(503).json({ pesan: err.message, detail: err.detail, bisa_manual: true });
  if (err instanceof AppError) return res.status(err.status).json({ pesan: err.message });
  console.error(err);
  return res.status(500).json({ pesan: 'Terjadi kesalahan di server' });
}
