import { z } from 'zod';

// Angka dari AI bisa berupa "47.500", "Rp 47.500", 47500, atau null.
const angka = z.preprocess((v) => {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/rp/i, '').replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}, z.number().nullable());

const teksOpsional = z.preprocess((v) => (v === undefined || v === '' ? null : v), z.string().nullable());

export const itemBelanja = z.object({
  teks_asli: z.preprocess((v) => v ?? '', z.string()),
  nama_bahan: z.string().min(1),
  qty: angka,
  satuan: teksOpsional,
  harga: angka,
  yakin: z.preprocess((v) => (v == null ? 0.8 : Number(v)), z.number().min(0).max(1)),
});

export const nota = z.object({
  nama_toko: teksOpsional,
  tanggal: teksOpsional,
  total_tertulis: angka,
  item: z.array(itemBelanja),
});

export const ucapan = z.object({
  nama_toko: teksOpsional,
  item: z.array(itemBelanja),
});

export const cerita = z.object({
  porsi_per_hari: angka,
  produk: z.array(
    z.object({
      nama: z.string().min(1),
      harga_jual: angka,
      porsi_per_batch: z.preprocess((v) => (v == null ? 1 : Number(v)), z.number().positive()),
      bahan: z.array(z.object({ nama: z.string().min(1), qty: angka, satuan: teksOpsional })),
    }),
  ),
  biaya: z
    .array(
      z.object({
        nama: z.string().min(1),
        nominal: angka,
        periode: z.preprocess((v) => (['porsi', 'hari', 'bulan'].includes(v) ? v : 'bulan'), z.enum(['porsi', 'hari', 'bulan'])),
      }),
    )
    .default([]),
  pertanyaan: z.array(z.string()).default([]),
});

export const promoSaran = z.object({
  nama: z.string().min(1).max(60),
  caption: z.string().min(1).max(400),
});
