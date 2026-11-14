import { describe, it, expect } from 'vitest';
import { trenHarga, musimHarga } from '../src/domain/arah.js';

const deret = (fn, n = 20) =>
  Array.from({ length: n }, (_, i) => ({ tanggal: new Date(Date.UTC(2026, 9, 15 + i)).toISOString().slice(0, 10), harga: fn(i) }));

describe('arah harga', () => {
  it('membaca tren naik, turun, dan stabil', () => {
    expect(trenHarga(deret((i) => 40000 + i * 500)).arah).toBe('naik');
    expect(trenHarga(deret((i) => 40000 - i * 500)).arah).toBe('turun');
    expect(trenHarga(deret((i) => 40000 + (i % 2) * 100)).arah).toBe('stabil');
  });

  it('tidak menyimpulkan apa pun kalau data terlalu sedikit', () => {
    expect(trenHarga(deret((i) => 40000 + i * 500, 5))).toBeNull();
  });

  it('menandai harga yang naik turun tajam', () => {
    expect(trenHarga(deret((i) => (i % 2 ? 30000 : 50000))).bergejolak).toBe(true);
  });

  it('pola musiman hanya untuk bahan yang terpengaruh dan pada periodenya', () => {
    expect(musimHarga('cabai rawit merah', '2026-12-01')?.nama).toBe('Natal dan Tahun Baru');
    expect(musimHarga('beras', '2026-12-01')).toBeNull();
    expect(musimHarga('cabai rawit merah', '2026-08-01')).toBeNull();
    expect(musimHarga('telur ayam ras', '2027-02-20')?.nama).toBe('Ramadan dan Idulfitri');
  });
});
