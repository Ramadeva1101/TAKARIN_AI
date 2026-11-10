import { useId } from 'react';
import { Link } from 'react-router-dom';
import { WarningCircle } from '@phosphor-icons/react';

const VARIAN = {
  utama: 'tombol-merek text-white',
  polos: 'bg-biru text-white hover:bg-biru-tua',
  masuk: 'bingkai-merek text-tinta hover:text-biru',
  lembut: 'bg-biru-muda text-biru-tua hover:bg-[#dce8ff]',
  garis: 'border border-garis bg-kartu text-tinta hover:border-biru/40 hover:text-biru',
  hantu: 'text-biru hover:bg-biru-muda',
  bahaya: 'text-rugi hover:bg-rugi-muda',
};
const dasarTombol =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:shadow-none';

export function Tombol({ varian = 'utama', className = '', to, ...p }) {
  const cls = `${dasarTombol} ${VARIAN[varian]} ${className}`;
  if (to) return <Link to={to} className={cls} {...p} />;
  return <button type="button" className={cls} {...p} />;
}

export function Field({ label, hint, error, as = 'input', className = '', children, ...p }) {
  const id = useId();
  const Tag = as;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children ? (
        children(id)
      ) : (
        <Tag
          id={id}
          aria-invalid={error ? true : undefined}
          className="min-h-11 w-full rounded-xl border border-garis bg-kartu px-3 py-2 text-base outline-none focus:border-biru"
          {...p}
        />
      )}
      {hint && !error && <p className="mt-1 text-xs text-redup">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rugi">{error}</p>}
    </div>
  );
}

export const inputCls = 'min-h-11 w-full rounded-lg border border-garis bg-kartu px-2 py-1.5 text-sm outline-none focus:border-biru';

const STATUS = {
  aman: ['Sesuai target', 'bg-aman-muda text-aman'],
  waspada: ['Di bawah target', 'bg-waspada-muda text-waspada'],
  rugi: ['Rugi', 'bg-rugi-muda text-rugi'],
  belum_lengkap: ['Harga belum lengkap', 'bg-dasar text-redup border border-garis'],
  di_bawah_target: ['Di bawah target', 'bg-waspada-muda text-waspada'],
  wajar: ['Wajar', 'bg-aman-muda text-aman'],
  di_atas: ['Di atas pasar', 'bg-waspada-muda text-waspada'],
  jauh_di_atas: ['Jauh di atas pasar', 'bg-rugi-muda text-rugi'],
  di_bawah: ['Di bawah pasar', 'bg-biru-muda text-biru-tua'],
  tanpa_acuan: ['Tanpa acuan', 'bg-dasar text-redup border border-garis'],
};

export function Chip({ status, children }) {
  const [label, cls] = STATUS[status] || [status, 'bg-dasar text-redup'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${cls}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children || label}
    </span>
  );
}

// Nama produk sebagai teks: "takarin" gelap, ".ai" biru. Bukan logo gambar.
// Tanda empat bulatan dari palet Sicily. Pengganti sementara sampai ada file logo resmi dari tim UI.
export function TandaMerek({ ukuran = 22 }) {
  const warna = ['#1d59bb', '#76b9ff', '#fef3b3', '#febd19'];
  return (
    <span className="inline-flex shrink-0 items-center" aria-hidden>
      {warna.map((w, i) => (
        <span key={w} className="rounded-full ring-2 ring-white" style={{ width: ukuran, height: ukuran, background: w, marginLeft: i ? -ukuran * 0.38 : 0 }} />
      ))}
    </span>
  );
}

export function Merek({ className = '', tanda = true, terang = false }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${terang ? 'text-white' : 'text-tinta'} ${className}`}>
      {tanda && <TandaMerek ukuran={18} />}
      <span>
        takarin<span className={terang ? 'text-biru-terang' : 'text-biru'}>.ai</span>
      </span>
    </span>
  );
}

// Kotak ikon berwarna di kartu angka.
export function IkonKotak({ ikon: Ikon, warna = 'biru' }) {
  const cls = {
    biru: 'bg-gradient-to-br from-biru-terang to-biru text-white shadow-[0_6px_14px_rgb(29_89_187/0.3)]',
    kuning: 'bg-gradient-to-br from-[#ffd75e] to-kuning text-navy shadow-[0_6px_14px_rgb(254_189_25/0.35)]',
    rugi: 'bg-gradient-to-br from-[#ff8a7a] to-rugi text-white shadow-[0_6px_14px_rgb(192_38_26/0.25)]',
    aman: 'bg-gradient-to-br from-[#5fd08a] to-aman text-white shadow-[0_6px_14px_rgb(21_127_59/0.25)]',
  }[warna];
  return (
    <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${cls}`} aria-hidden>
      <Ikon size={24} weight="fill" />
    </span>
  );
}

export function Kartu({ className = '', children, ...p }) {
  return (
    <section className={`min-w-0 rounded-[20px] border border-garis bg-kartu p-4 shadow-kartu sm:p-5 ${className}`} {...p}>
      {children}
    </section>
  );
}

export function Judul({ judul, sub, aksi, kembali }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {kembali && (
          <Link to={kembali} className="mb-1 inline-flex min-h-11 items-center text-sm font-medium text-biru">
            Kembali
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{judul}</h1>
        {sub && <p className="mt-1 text-sm text-redup">{sub}</p>}
      </div>
      {aksi && <div className="flex flex-wrap gap-2">{aksi}</div>}
    </header>
  );
}

export function Muat({ penuh, teks = 'Memuat data' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 text-sm text-redup ${penuh ? 'min-h-dvh' : 'py-16'}`}>
      <span className="size-4 animate-spin rounded-full border-2 border-garis border-t-biru" aria-hidden />
      {teks}
    </div>
  );
}

export function Galat({ error, ulang }) {
  return (
    <Kartu className="flex flex-col items-start gap-3 border-rugi/30 bg-rugi-muda">
      <p className="flex items-center gap-2 font-semibold text-rugi">
        <WarningCircle size={20} weight="bold" aria-hidden />
        {error?.message || 'Terjadi kesalahan'}
      </p>
      {ulang && (
        <Tombol varian="garis" onClick={ulang}>
          Coba lagi
        </Tombol>
      )}
    </Kartu>
  );
}

export function Kosong({ judul, teks, aksi }) {
  return (
    <div className="tepi-nota flex flex-col items-start gap-2 py-8">
      <p className="font-semibold">{judul}</p>
      {teks && <p className="max-w-md text-sm text-redup">{teks}</p>}
      {aksi && <div className="mt-2">{aksi}</div>}
    </div>
  );
}

// Harga per satuan dasar (g/ml) ditampilkan per kg/liter.
export function hargaSatuan(harga, satuanDasar) {
  if (harga == null) return null;
  if (satuanDasar === 'g') return { harga: harga * 1000, satuan: 'kg' };
  if (satuanDasar === 'ml') return { harga: harga * 1000, satuan: 'liter' };
  return { harga, satuan: satuanDasar };
}
