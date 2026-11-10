import { useId, useState } from 'react';
import { persen, rupiah, tanggal } from '../lib/api.js';

// Pilihan bertab kecil (misalnya "Seminggu | Sebelumnya"). Satu tombol per pilihan.
export function Segmen({ pilihan, nilai, ubah, label, gelap = false }) {
  return (
    <div role="group" aria-label={label} className={`inline-flex rounded-full p-1 text-sm ${gelap ? 'bg-white/15' : 'bg-dasar ring-1 ring-garis'}`}>
      {pilihan.map(([kunci, teks]) => {
        const aktif = kunci === nilai;
        const cls = aktif ? (gelap ? 'bg-white text-biru-tua' : 'bg-kartu text-tinta shadow-kartu') : gelap ? 'text-white/80 hover:text-white' : 'text-redup hover:text-tinta';
        return (
          <button key={kunci} type="button" aria-pressed={aktif} onClick={() => ubah(kunci)} className={`min-h-9 rounded-full px-3.5 font-semibold whitespace-nowrap transition-colors ${cls}`}>
            {teks}
          </button>
        );
      })}
    </div>
  );
}

// Grafik harga yang bisa disentuh: arahkan kursor, ketuk, atau pakai panah kiri/kanan untuk melihat harga tiap tanggal.
export function GrafikHarga({ data, satuan, label }) {
  const id = useId();
  const [pilih, setPilih] = useState(null);
  if (!data || data.length < 2) return <p className="py-8 text-center text-sm text-redup">Riwayat harga belum cukup untuk digambar.</p>;
  const i = pilih ?? data.length - 1;
  const L = 600;
  const T = 180;
  const atas = 14;
  const bawah = 22;
  const nilai = data.map((d) => d.harga);
  const min = Math.min(...nilai);
  const maks = Math.max(...nilai);
  const rentang = maks - min || 1;
  const x = (k) => (k / (data.length - 1)) * L;
  const y = (v) => atas + (1 - (v - min) / rentang) * (T - atas - bawah);
  const titik = data.map((d, k) => `${x(k)},${y(d.harga)}`).join(' ');
  const d = data[i];
  const awal = data[0].harga;

  const kunci = (e) => {
    if (e.key === 'ArrowLeft') setPilih(Math.max(0, i - 1));
    else if (e.key === 'ArrowRight') setPilih(Math.min(data.length - 1, i + 1));
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2" aria-live="polite">
        <p className="angka text-sm">
          <span className="text-redup">{tanggal(d.tanggal)} · </span>
          <span className="font-bold">
            {rupiah(d.harga)}/{satuan}
          </span>
        </p>
        <p className="angka text-xs text-redup">
          {d.harga === awal ? 'sama dengan' : d.harga > awal ? `naik ${persen((d.harga - awal) / awal)} dari` : `turun ${persen((awal - d.harga) / awal)} dari`} {tanggal(data[0].tanggal)}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${L} ${T}`}
        className="h-44 w-full touch-none overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-biru"
        preserveAspectRatio="none"
        role="img"
        tabIndex={0}
        aria-label={`${label}. Gunakan panah kiri dan kanan untuk melihat harga tiap tanggal.`}
        onKeyDown={kunci}
        onPointerLeave={() => setPilih(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPilih(Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)));
        }}
      >
        <defs>
          <linearGradient id={`isi-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#76b9ff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#76b9ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1="0" x2={L} y1={atas + t * (T - atas - bawah)} y2={atas + t * (T - atas - bawah)} stroke="var(--color-garis)" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
        ))}
        <polygon points={`0,${T - bawah} ${titik} ${L},${T - bawah}`} fill={`url(#isi-${id})`} />
        <polyline points={titik} fill="none" stroke="var(--color-biru)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <line x1={x(i)} x2={x(i)} y1={atas} y2={T - bawah} stroke="var(--color-kuning)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* Titik terpilih digambar di luar SVG supaya tetap bulat walau grafiknya melar. */}
      <div className="pointer-events-none relative -mt-44 h-44" aria-hidden>
        <span
          className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-kuning shadow"
          style={{ left: `${(i / (data.length - 1)) * 100}%`, top: `${(y(d.harga) / T) * 100}%` }}
        />
      </div>
      <div className="angka mt-1 flex justify-between text-xs text-redup" aria-hidden>
        <span>{tanggal(data[0].tanggal)}</span>
        <span>
          {rupiah(min)} sampai {rupiah(maks)}
        </span>
        <span>{tanggal(data.at(-1).tanggal)}</span>
      </div>
    </div>
  );
}
