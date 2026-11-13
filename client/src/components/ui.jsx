import { useId } from 'react';
import { Link } from 'react-router-dom';
import { CircleNotch, WarningCircle } from '@phosphor-icons/react';

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
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:shadow-none aria-busy:cursor-wait aria-busy:opacity-85';

// Lingkaran berputar untuk tombol yang sedang menunggu server. Ukuran ikut teks tombol.
export function Pemutar({ size = 16, className = '' }) {
  return <CircleNotch size={size} weight="bold" className={`shrink-0 animate-spin ${className}`} aria-hidden />;
}

/**
 * Tombol standar. memuat = true: tampil lingkaran berputar di depan teks, tombol terkunci,
 * dan pembaca layar diberi tahu sedang memproses (aria-busy).
 */
export function Tombol({ varian = 'utama', className = '', to, memuat = false, disabled, children, ...p }) {
  const cls = `${dasarTombol} ${VARIAN[varian]} ${className}`;
  if (to) return <Link to={to} className={cls} {...p}>{children}</Link>;
  return (
    <button type="button" className={cls} disabled={disabled || memuat} aria-busy={memuat || undefined} {...p}>
      {memuat && <Pemutar />}
      {children}
    </button>
  );
}

/**
 * Isian rupiah dengan titik ribuan ("500.000") supaya tidak salah ketik jumlah nol.
 * Nilai yang dikirim ke onChange tetap angka polos tanpa titik ("500000"), jadi pemanggil
 * cukup memakai e.target.value seperti input biasa.
 */
export function InputRupiah({ value, onChange, ...p }) {
  const angka = typeof value === 'number' ? String(Math.round(value)) : String(value ?? '').replace(/\D/g, '');
  const tampil = angka ? Number(angka).toLocaleString('id-ID') : '';
  return (
    <input
      {...p}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={tampil}
      onChange={(e) => onChange?.({ target: { value: e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '') } })}
    />
  );
}

export function Field({ label, hint, error, as = 'input', rupiah = false, className = '', children, ...p }) {
  const id = useId();
  const Tag = rupiah ? InputRupiah : as;
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
// Logo resmi dari tim UI (client/public). Ukuran mengikuti kelas teks yang dikirim pemanggil.
const TINGGI_LOGO = { "text-2xl": 36, "text-xl": 32, "text-lg": 28, "text-base": 24, "text-sm": 20 };

export function TandaMerek({ ukuran = 28, className = "" }) {
  return <img src="/logo-tanda.webp" alt="" width={ukuran} height={ukuran} className={`shrink-0 ${className}`} />;
}

// terang = di atas latar gelap: simbol + teks putih, karena huruf logo berwarna navy.
export function Merek({ className = "", terang = false }) {
  const kelas = className.split(" ").find((k) => TINGGI_LOGO[k]);
  const tinggi = TINGGI_LOGO[kelas] ?? 24;
  if (terang)
    return (
      <span className={`inline-flex items-center gap-2 font-bold tracking-tight text-white ${className}`}>
        <TandaMerek ukuran={tinggi} />
        <span>
          Takarin <span className="text-biru-terang">AI</span>
        </span>
      </span>
    );
  return <img src="/logo-takarin.webp" alt="Takarin AI" height={tinggi} style={{ height: tinggi, width: "auto" }} className="inline-block shrink-0" />;
}

export function IkonKotak({ ikon: Ikon, warna = "biru" }) {
  const cls = { biru: "text-biru", kuning: "text-[#c98a00]", rugi: "text-rugi", aman: "text-aman" }[warna];
  return <Ikon size={28} weight="duotone" className={`mt-0.5 shrink-0 ${cls}`} aria-hidden />;
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
