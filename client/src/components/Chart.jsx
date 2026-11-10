import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { persen, rupiah, tanggal } from '../lib/api.js';

const SUMBU = { fontSize: 12, fill: '#5b6782', fontFamily: 'inherit' };

function KotakTooltip({ children }) {
  return <div className="rounded-xl border border-garis bg-kartu px-3 py-2 text-sm shadow-[0_10px_30px_rgb(13_27_62/0.12)]">{children}</div>;
}

// Batang untung per menu. Gaya datar: warna solid, tanpa animasi; batang terpilih biru dengan label di atasnya.
function LabelTerpilih({ x, y, width, value, index, pilihIndex }) {
  if (index !== pilihIndex) return null;
  const teks = persen(value);
  const w = teks.length * 7 + 14;
  return (
    <g>
      <rect x={x + width / 2 - w / 2} y={y - 30} width={w} height={22} rx={6} fill="#0d1b3e" />
      <text x={x + width / 2} y={y - 15} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={600}>
        {teks}
      </text>
    </g>
  );
}

export function BatangUntung({ data, target, pilih, ubah, tinggi = 240 }) {
  const maks = Math.ceil(Math.max(target * 1.25, ...data.map((d) => d.margin)) * 10) / 10;
  const pilihIndex = data.findIndex((d) => d.id === pilih);
  return (
    <div style={{ height: tinggi }} role="img" aria-label={`Grafik untung per menu. ${data.map((d) => `${d.nama} ${persen(d.margin)}`).join(', ')}. Target ${persen(target, 0)}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 34, right: 8, left: -12, bottom: 0 }} barCategoryGap="34%">
          <CartesianGrid vertical={false} stroke="#e8edf5" />
          <XAxis dataKey="nama" tick={SUMBU} tickLine={false} axisLine={{ stroke: '#e2e9f4' }} interval={0} tickMargin={10} />
          <YAxis domain={[0, maks]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={SUMBU} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            cursor={false}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-lg bg-tinta px-3 py-2 text-xs text-white shadow-lg">
                  <p className="font-semibold">{payload[0].payload.nama}</p>
                  <p className="angka text-white/75">
                    Untung {persen(payload[0].payload.margin)}
                    {payload[0].payload.hpp != null && ` · modal ${rupiah(payload[0].payload.hpp)}`}
                  </p>
                </div>
              ) : null
            }
          />
          <ReferenceLine y={target} stroke="#e0a800" strokeWidth={1.5} strokeDasharray="5 4" label={{ value: `Target ${persen(target, 0)}`, position: 'insideBottomRight', fill: '#8a5a00', fontSize: 11, fontWeight: 600 }} />
          <Bar
            dataKey="margin"
            radius={[8, 8, 8, 8]}
            maxBarSize={34}
            onClick={(d) => ubah?.(d.payload?.id ?? d.id)}
            className={ubah ? 'cursor-pointer' : ''}
            isAnimationActive={false}
            label={(p) => <LabelTerpilih {...p} pilihIndex={pilihIndex} />}
          >
            {data.map((d) => (
              <Cell key={d.id} fill={d.id === pilih ? '#1d59bb' : d.status === 'aman' ? '#dfe7f3' : '#fbe3a0'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Grafik area riwayat harga dengan tooltip per tanggal.
export function AreaHarga({ data, satuan, label, tinggi = 220 }) {
  if (!data || data.length < 2) return <p className="py-10 text-center text-sm text-redup">Riwayat harga belum cukup untuk digambar.</p>;
  const nilai = data.map((d) => d.harga);
  const min = Math.min(...nilai);
  const maks = Math.max(...nilai);
  const jarak = Math.max((maks - min) * 0.25, maks * 0.02);
  const naik = nilai.at(-1) > nilai[0];
  const warna = naik ? '#c0261a' : '#1d59bb';
  const id = `area-${naik ? 'naik' : 'turun'}`;
  return (
    <div style={{ height: tinggi }} role="img" aria-label={`${label}. Dari ${rupiah(nilai[0])} pada ${tanggal(data[0].tanggal)} menjadi ${rupiah(nilai.at(-1))} pada ${tanggal(data.at(-1).tanggal)}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={warna} stopOpacity={0.22} />
              <stop offset="1" stopColor={warna} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e9f4" strokeDasharray="4 6" />
          <XAxis dataKey="tanggal" tickFormatter={(t) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} tick={SUMBU} tickLine={false} axisLine={false} minTickGap={28} tickMargin={8} />
          <YAxis domain={[Math.max(0, min - jarak), maks + jarak]} tickFormatter={(v) => `${(v / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}rb`} tickCount={4} tick={SUMBU} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            cursor={{ stroke: '#febd19', strokeWidth: 2 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <KotakTooltip>
                  <p className="text-xs text-redup">{tanggal(payload[0].payload.tanggal)}</p>
                  <p className="angka font-semibold">
                    {rupiah(payload[0].payload.harga)}/{satuan}
                  </p>
                </KotakTooltip>
              ) : null
            }
          />
          <Area type="monotone" dataKey="harga" stroke={warna} strokeWidth={2.5} fill={`url(#${id})`} activeDot={{ r: 6, fill: '#febd19', stroke: '#fff', strokeWidth: 3 }} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Batang mendatar: bagian tiap bahan dari modal satu porsi menu.
export function BatangKomposisi({ data, menu }) {
  const tinggi = Math.max(160, data.length * 44 + 20);
  return (
    <div style={{ height: tinggi }} role="img" aria-label={`Komposisi modal ${menu}: ${data.map((d) => `${d.nama} ${rupiah(d.biaya)} (${persen(d.bagian)})`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barCategoryGap="30%">
          <defs>
            <linearGradient id="batang-mendatar" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#1d59bb" />
              <stop offset="1" stopColor="#76b9ff" />
            </linearGradient>
          </defs>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="nama" tick={{ ...SUMBU, textTransform: 'capitalize' }} tickLine={false} axisLine={false} width={104} />
          <Tooltip
            cursor={{ fill: 'rgb(29 89 187 / 0.06)' }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <KotakTooltip>
                  <p className="font-semibold capitalize">{payload[0].payload.nama}</p>
                  <p className="angka text-redup">
                    {rupiah(payload[0].payload.biaya)} per porsi · {persen(payload[0].payload.bagian)} dari modal
                  </p>
                </KotakTooltip>
              ) : null
            }
          />
          <Bar
            dataKey="biaya"
            radius={[6, 6, 6, 6]}
            maxBarSize={14}
            fill="#1d59bb"
            background={{ fill: '#eef2f8', radius: 6 }}
            isAnimationActive={false}
            label={{ position: 'right', formatter: (v) => rupiah(v), fontSize: 12, fill: '#0d1b3e', fontWeight: 600 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Garis kecil di daftar, versi area halus.
export function Mini({ data, label }) {
  if (!data || data.length < 2) return null;
  const naik = data.at(-1).harga > data[0].harga;
  const turun = data.at(-1).harga < data[0].harga;
  const warna = naik ? '#c0261a' : turun ? '#157f3b' : '#8894aa';
  const id = `mini-${naik ? 'n' : turun ? 't' : 's'}`;
  return (
    <div className="h-10 w-full" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={warna} stopOpacity={0.25} />
              <stop offset="1" stopColor={warna} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Area type="monotone" dataKey="harga" stroke={warna} strokeWidth={2} fill={`url(#${id})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
