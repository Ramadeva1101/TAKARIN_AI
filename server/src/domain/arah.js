// Arah harga dari riwayat harga pasar 30 hari. Ini bukan ramalan: hanya membaca kemiringan
// garis tren (regresi linear) dan seberapa besar harga naik turun dalam periode itu.

const BATAS_STABIL = 0.03; // perubahan tren di bawah 3% sebulan dianggap stabil
const BATAS_GEJOLAK = 0.08; // simpangan baku di atas 8% dari rata-rata dianggap bergejolak
const MIN_DATA = 8;

const hari = (t) => new Date(`${t}T00:00:00Z`).getTime() / 86_400_000;

export function trenHarga(riwayat) {
  const data = (riwayat || []).filter((r) => r.harga > 0);
  if (data.length < MIN_DATA) return null;
  const x = data.map((r) => hari(r.tanggal));
  const y = data.map((r) => r.harga);
  const n = data.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  if (!sxx) return null;
  const perBulan = ((sxy / sxx) * 30) / my;
  const simpangan = Math.sqrt(y.reduce((a, v) => a + (v - my) ** 2, 0) / n) / my;
  return {
    arah: Math.abs(perBulan) < BATAS_STABIL ? 'stabil' : perBulan > 0 ? 'naik' : 'turun',
    perubahan_per_bulan: perBulan,
    bergejolak: simpangan > BATAS_GEJOLAK,
    jumlah_data: n,
    dari: data[0].tanggal,
    sampai: data.at(-1).tanggal,
  };
}

// Periode hari besar keagamaan nasional, saat permintaan pangan biasanya naik.
// Tanggal Ramadan dan Idulfitri mengikuti perkiraan kalender hijriah dan perlu diperbarui tiap tahun.
const MUSIM = [
  { nama: 'Natal dan Tahun Baru', mulai: '11-01', akhir: '12-31' },
  { nama: 'Ramadan dan Idulfitri', mulaiTanggal: '2027-01-25', akhirTanggal: '2027-03-12' },
];
const KOMODITAS_MUSIMAN = /cabai|bawang|telur|ayam|sapi|gula|minyak/i;

export function musimHarga(komoditas, tanggal = new Date().toISOString().slice(0, 10)) {
  if (!KOMODITAS_MUSIMAN.test(komoditas)) return null;
  const md = tanggal.slice(5);
  for (const m of MUSIM) {
    const masuk = m.mulai ? md >= m.mulai && md <= m.akhir : tanggal >= m.mulaiTanggal && tanggal <= m.akhirTanggal;
    if (masuk) return { nama: m.nama, teks: `Menjelang ${m.nama}, permintaan bahan pangan biasanya naik, sehingga harganya cenderung ikut naik.` };
  }
  return null;
}
