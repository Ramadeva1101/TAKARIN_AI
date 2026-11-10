import { z } from 'zod';

const uang = z.coerce.number().nonnegative();
const qty = z.coerce.number().positive();
const periode = z.enum(['porsi', 'hari', 'bulan']);

export const daftar = z.object({
  nama: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password minimal 8 karakter').max(100),
});

export const masuk = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const profilUsaha = z.object({
  nama: z.string().trim().min(1).max(80),
  jenis: z.string().trim().max(60).nullish(),
  kota: z.string().trim().max(60).nullish(),
  provinsi: z.string().trim().max(60).nullish(),
  target_margin: z.coerce.number().min(0.05).max(0.9),
  porsi_per_hari: z.coerce.number().positive().max(100000),
  hari_buka: z.coerce.number().int().min(1).max(31).default(30),
});

const bahanResep = z.object({
  bahan_id: z.coerce.number().int().positive().nullish(),
  nama: z.string().trim().min(1).max(60),
  qty,
  satuan: z.string().trim().max(20).nullish(),
});

export const produk = z.object({
  nama: z.string().trim().min(1).max(80),
  harga_jual: z.coerce.number().positive(),
  porsi_per_batch: z.coerce.number().positive().default(1),
  bahan: z.array(bahanResep).min(1, 'Minimal satu bahan'),
});

export const produkUbah = produk.partial();

export const biaya = z.object({ nama: z.string().trim().min(1).max(60), nominal: uang, periode });

export const setup = z.object({
  usaha: profilUsaha,
  produk: z.array(produk).default([]),
  biaya: z.array(biaya).default([]),
  harga_bahan: z
    .array(z.object({ nama: z.string().trim().min(1), qty, satuan: z.string().trim().min(1), harga: z.coerce.number().positive(), tanggal: z.string().optional() }))
    .default([]),
});

export const cerita = z.object({ teks: z.string().trim().min(10, 'Ceritakan lebih lengkap').max(4000) });
export const teksBelanja = z.object({ teks: z.string().trim().min(3).max(2000), sumber: z.enum(['teks', 'suara']).default('teks') });

const itemBelanja = z.object({
  teks_asli: z.string().max(200).nullish(),
  nama_bahan: z.string().trim().min(1).max(60),
  qty: z.coerce.number().positive().nullish(),
  satuan: z.string().trim().max(20).nullish(),
  harga: z.coerce.number().nonnegative().nullish(),
});

export const belanjaManual = z.object({
  nama_toko: z.string().trim().max(80).nullish(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  item: z.array(itemBelanja).min(1),
});

export const simpanBelanja = z.object({
  nama_toko: z.string().trim().max(80).nullish(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  item: z
    .array(
      itemBelanja.extend({
        bahan_id: z.coerce.number().int().positive().nullish(),
        satuan_dasar: z.enum(['g', 'ml', 'butir', 'pcs']).nullish(),
        qty,
        satuan: z.string().trim().min(1).max(20),
        harga: z.coerce.number().positive(),
        konversi_faktor: z.coerce.number().positive().nullish(),
      }),
    )
    .min(1),
});

export const hargaManual = z.object({ qty: z.coerce.number().positive('Jumlah harus lebih dari 0'), satuan: z.string().trim().min(1, 'Satuan wajib diisi'), harga: z.coerce.number().positive('Harga harus lebih dari 0') });

export const ubahBahan = z.object({
  nama: z.string().trim().min(1).max(60).optional(),
  satuan_dasar: z.enum(['g', 'ml', 'butir', 'pcs']).optional(),
  komoditas: z.string().trim().max(60).nullable().optional(),
  susut_persen: z.coerce.number().min(0).max(90).optional(),
});

export const konversi = z.object({ satuan: z.string().trim().min(1).max(20), faktor: z.coerce.number().positive() });

export const simulasi = z.object({
  harga_jual: z.coerce.number().positive().optional(),
  faktor: z.record(z.string(), z.coerce.number().min(0).max(3)).default({}),
});

const itemPromo = z.object({ menu_id: z.coerce.number().int().positive(), qty: z.coerce.number().positive().default(1) });

export const promoHitung = z.object({
  items: z.array(itemPromo).min(1),
  harga_paket: z.coerce.number().positive().optional(),
  biaya_kemasan: uang.default(0),
});

export const promoSimpan = promoHitung.extend({
  nama: z.string().trim().min(1).max(60),
  harga_paket: z.coerce.number().positive(),
  caption: z.string().trim().max(400).nullish(),
});

export const cekJenis = z.object({ teks: z.string().trim().min(3, 'Tulis jenis usaha minimal 3 huruf').max(60) });
