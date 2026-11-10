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

// Batang untung per menu di kartu biru. Tiap batang adalah tombol; batang terpilih berwarna kuning.
export function BatangMenu({ produk, target, pilih, ubah }) {
  const skala = Math.max(0.7, target * 1.4, ...produk.map((p) => p.margin ?? 0));
  const tinggi = (m) => `${Math.max(4, (Math.max(0, m) / skala) * 100)}%`;
  return (
    <div className="relative">
      <div className="relative flex h-40 items-end gap-2 overflow-x-auto pb-px sm:gap-3">
        <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-kuning" style={{ bottom: `${(target / skala) * 100}%` }} aria-hidden />
        {produk.map((p) => {
          const aktif = p.id === pilih;
          const kurang = p.status !== 'aman';
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={aktif}
              aria-label={`${p.nama}, untung ${persen(p.margin)}`}
              onClick={() => ubah(p.id)}
              className="group relative flex h-full min-w-10 flex-1 basis-0 items-end justify-center rounded-t-xl outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span
                className={`block w-full max-w-14 rounded-t-xl transition-all ${aktif ? 'bg-kuning' : kurang ? 'bg-white/25 ring-1 ring-inset ring-white/40 group-hover:bg-white/40' : 'bg-white/60 group-hover:bg-white/80'}`}
                style={{ height: tinggi(p.margin) }}
              />
              {aktif && <span className="angka absolute -translate-y-full rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-biru-tua shadow" style={{ bottom: tinggi(p.margin) }}>{persen(p.margin)}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3" aria-hidden>
        {produk.map((p) => (
          <span key={p.id} className={`min-w-10 flex-1 basis-0 truncate text-center text-[11px] ${p.id === pilih ? 'font-bold text-white' : 'text-white/70'}`}>
            {p.nama}
          </span>
        ))}
      </div>
    </div>
  );
}
