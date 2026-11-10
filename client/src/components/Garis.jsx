// Grafik garis kecil untuk riwayat harga. Warna ikut arah: naik = merah (modal naik), turun = hijau.
export default function Garis({ data, label, tinggi = 40 }) {
  if (!data || data.length < 2) return null;
  const nilai = data.map((d) => d.harga);
  const min = Math.min(...nilai);
  const maks = Math.max(...nilai);
  const rentang = maks - min || 1;
  const lebar = 120;
  const titik = nilai.map((v, i) => `${(i / (nilai.length - 1)) * lebar},${tinggi - 4 - ((v - min) / rentang) * (tinggi - 8)}`).join(' ');
  const naik = nilai.at(-1) > nilai[0];
  const turun = nilai.at(-1) < nilai[0];
  const warna = naik ? 'var(--color-rugi)' : turun ? 'var(--color-aman)' : 'var(--color-redup)';
  return (
    <svg viewBox={`0 0 ${lebar} ${tinggi}`} className="h-10 w-full" preserveAspectRatio="none" role="img" aria-label={label}>
      <polyline points={titik} fill="none" stroke={warna} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
