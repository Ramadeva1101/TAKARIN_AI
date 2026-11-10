import { describe, it, expect } from 'vitest';
import { biayaLainPerPorsi } from '../src/domain/hpp.js';

describe('biaya bulanan dibagi hari buka', () => {
  it('libur tiap Minggu (26 hari) membuat biaya per porsi lebih besar dari 30 hari', () => {
    const biaya = [{ nominal: 260000, periode: 'bulan' }];
    expect(biayaLainPerPorsi(biaya, 100, 26)).toBeCloseTo(100, 5);
    expect(biayaLainPerPorsi(biaya, 100)).toBeCloseTo(260000 / 3000, 5);
  });
  it('nilai hari buka di luar 1..31 dibatasi', () => {
    const biaya = [{ nominal: 31000, periode: 'bulan' }];
    expect(biayaLainPerPorsi(biaya, 1, 99)).toBeCloseTo(1000, 5);
  });
});
