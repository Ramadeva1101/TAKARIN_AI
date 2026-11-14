import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  Microphone,
  ChatText,
  Storefront,
  Calculator,
  Tag,
  ChartBar,
  ForkKnife,
  Basket,
  PlayCircle,
  House,
  CalendarBlank,
  CaretDown,
  ShoppingCart,
  ChartLineUp,
  Scales,
  MapPin,
  ShieldCheck,
  UserCheck,
  Leaf,
  Database,
} from '@phosphor-icons/react';
import { Chip, IkonKotak, Merek, Tombol } from '../components/ui.jsx';
import Garis from '../components/Garis.jsx';

const MENU_SITUS = [
  ['/', 'Beranda'],
  ['/#cara-kerja', 'Cara Kerja'],
  ['/#fitur', 'Fitur'],
  ['/#faq', 'FAQ'],
];

export function PublikLayout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  // Garis menu mengikuti section yang sedang terlihat di beranda.
  const [bagian, setBagian] = useState('');
  useEffect(() => {
    if (pathname !== '/') return setBagian('');
    const cek = () => {
      const ada = ['cara-kerja', 'fitur', 'faq'].filter((id) => {
        const el = document.getElementById(id);
        return el && el.getBoundingClientRect().top <= 140;
      });
      setBagian(ada.at(-1) || '');
    };
    cek();
    window.addEventListener('scroll', cek, { passive: true });
    return () => window.removeEventListener('scroll', cek);
  }, [pathname]);
  const aktif = (to) => (to.includes('#') ? to === `/#${bagian}` : pathname === to && !bagian);
  return (
    <div className="latar-merek flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link to="/" className="inline-flex min-h-11 items-center">
            <Merek className="text-lg sm:text-xl" />
          </Link>
          <nav aria-label="Menu situs" className="hidden items-center gap-2 md:flex">
            {MENU_SITUS.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                aria-current={aktif(to) ? 'page' : undefined}
                className={`relative inline-flex min-h-11 items-center px-3 text-[15px] font-medium ${aktif(to) ? 'text-tinta after:absolute after:inset-x-3 after:bottom-1 after:h-[3px] after:rounded-full after:bg-biru' : 'text-redup hover:text-tinta'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          {/* Di HP tombol dibuat ringkas (tanpa panah, padding kecil) agar tidak berdesakan dengan logo. */}
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-2">
            <Tombol varian="masuk" to="/masuk" className="!px-4 sm:!px-5">
              Masuk <ArrowRight size={16} weight="bold" className="hidden text-kuning sm:block" aria-hidden />
            </Tombol>
            <Tombol to="/daftar" className="!px-4 sm:!px-5">
              Daftar
            </Tombol>
          </div>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-garis bg-kartu">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-redup sm:px-6">
          <p className="flex items-center gap-2">
            <Merek />
          </p>
          <nav aria-label="Tautan situs" className="flex flex-wrap gap-1">
            <Link to="/tentang" className="inline-flex min-h-11 items-center px-2 hover:text-tinta">
              Tentang
            </Link>
            <Link to="/#faq" className="inline-flex min-h-11 items-center px-2 hover:text-tinta md:hidden">
              FAQ
            </Link>
            <Link to="/privasi" className="inline-flex min-h-11 items-center px-2 hover:text-tinta">
              Kebijakan privasi
            </Link>
            <Link to="/syarat" className="inline-flex min-h-11 items-center px-2 hover:text-tinta">
              Syarat dan ketentuan
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

// Kartu miring di kiri dan kanan pratinjau (desktop saja).
function KartuMelayang({ posisi, ikon, warna, judul, teks }) {
  return (
    <div className={`absolute z-10 hidden w-[17.5rem] items-center gap-3 rounded-2xl border border-[#d3deee] bg-white p-4 text-left shadow-[0_1px_2px_rgb(13_27_62/0.08),0_24px_48px_-12px_rgb(13_27_62/0.35)] xl:flex ${posisi}`} aria-hidden>
      <IkonKotak ikon={ikon} warna={warna} />
      <div>
        <p className="font-bold">{judul}</p>
        <p className="text-sm text-redup">{teks}</p>
      </div>
    </div>
  );
}

// Pratinjau: tangkapan layar asli halaman Ringkasan dengan akun demo.
// Tangkapan layar berhenti di tengah halaman; bagian bawahnya dipudarkan agar terbaca sebagai halaman yang berlanjut.
function Pratinjau() {
  return (
    <figure className="mx-auto max-w-[620px] [mask-image:linear-gradient(to_bottom,black_72%,transparent)]">
      <div className="rounded-[22px] border border-white bg-white/70 p-1.5 shadow-[0_30px_70px_rgb(29_89_187/0.18)] backdrop-blur">
        <img
          src="/tangkapan-ringkasan.webp"
          width="1530"
          height="740"
          alt="Halaman Ringkasan Takarin AI: rata-rata untung 48,6%, daftar untung per menu terhadap target 40%, dan saran menaikkan harga Es Jeruk ke Rp6.500."
          className="block aspect-[1530/660] h-auto w-full rounded-[16px] border border-garis object-cover object-top"
          fetchPriority="high"
        />
      </div>
    </figure>
  );
}

const FAKTA = [
  [Scales, 'Takaran pakai sendok, siung, atau potong'],
  [MapPin, 'Harga pasar di kota Anda'],
  [Storefront, 'Data harga dari Bank Indonesia'],
  [Microphone, 'Catat dengan foto, suara, atau ketik'],
];

const MASALAH = [
  {
    judul: 'Takaran pakai sendok, bukan gram',
    teks: 'Susah tahu berapa rupiah dua sendok gula atau tiga siung bawang.',
  },
  {
    judul: 'Nota disimpan, tidak dihitung',
    teks: 'Nota belanja menumpuk, padahal isinya bisa menunjukkan menu mana yang masih untung.',
  },
  {
    judul: 'Dihitung sekali, lalu ditinggal',
    teks: 'Hitungan modal bulan lalu sudah tidak berlaku. Kalau harus diperbarui manual, lama-lama tidak dikerjakan.',
  },
];

// Kalkulator kecil: berapa untung yang hilang sebulan kalau modal naik tetapi harga jual tetap.
// Murni hitungan dari angka yang digeser pengunjung, bukan data pengguna.
function Kebocoran() {
  const [naik, setNaik] = useState(400);
  const [porsi, setPorsi] = useState(50);
  const [harga, setHarga] = useState(15000);
  const bulan = naik * porsi * 30;
  const setara = Math.round(bulan / harga);
  const rp = (n) => `Rp${Math.round(n).toLocaleString('id-ID')}`;
  const geser = (label, nilai, ubah, min, maks, langkah, tampil) => (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-redup">{label}</span>
        <span className="angka font-bold">{tampil}</span>
      </span>
      <input type="range" min={min} max={maks} step={langkah} value={nilai} onChange={(e) => ubah(Number(e.target.value))} className="mt-2 h-11 w-full cursor-pointer accent-biru" />
    </label>
  );
  return (
    <div className="rounded-[24px] border border-garis bg-kartu p-5 sm:p-6">
      <p className="font-bold">Coba hitung untung yang hilang</p>
      <p className="text-sm text-redup">Modal per porsi naik, harga jual tetap.</p>
      <div className="mt-4 grid gap-1">
        {geser('Kenaikan modal per porsi', naik, setNaik, 100, 10000, 100, rp(naik))}
        {geser('Porsi terjual per hari', porsi, setPorsi, 10, 200, 5, `${porsi} porsi`)}
        {geser('Harga jual per porsi', harga, setHarga, 5000, 50000, 500, rp(harga))}
      </div>
      <div className="tepi-nota mt-4 pt-4" aria-live="polite">
        <p className="text-sm text-redup">Untung yang hilang dalam 30 hari</p>
        <p className="angka mt-1 text-3xl font-extrabold text-rugi">{rp(bulan)}</p>
        <p className="angka mt-1 text-sm">Setara {setara} porsi gratis setiap bulan.</p>
      </div>
      <p className="mt-3 text-xs text-redup">Takarin AI menghitung ini otomatis untuk setiap menu Anda, setiap kali Anda mencatat belanja.</p>
    </div>
  );
}

const LANGKAH = [
  {
    judul: 'Ceritakan menu',
    teks: 'Ketik atau ucapkan menu Anda seperti bercerita: harga jualnya, bahannya, dan takarannya. Takarin AI mengubahnya menjadi resep yang bisa Anda periksa.',
    gambar: '/langkah-menu.webp',
    alt: 'Halaman Tambah menu: resep ayam geprek hasil susunan AI, setiap bahan terhubung ke harga dari catatan belanja.',
  },
  {
    judul: 'Catat belanja',
    teks: 'Foto nota, ucapkan, atau ketik belanjaan. Yang meragukan diberi warna kuning supaya Anda cek dulu sebelum disimpan.',
    gambar: '/langkah-belanja.webp',
    alt: 'Halaman Periksa belanja: hasil baca ucapan menjadi baris bawang, daun bawang, dan daging ayam, dengan baris yang perlu dicek berwarna kuning.',
  },
  {
    judul: 'Lihat modal dan untung',
    teks: 'Modal tiap porsi dihitung dari harga yang Anda bayar. Kalau bahannya belum pernah Anda beli, dipakai harga pasar di kota Anda. Menu yang untungnya kurang langsung ditandai.',
    gambar: '/langkah-modal.webp',
    alt: 'Halaman menu Ayam Geprek: modal per porsi Rp7.721, harga jual Rp15.000, untung 48,5%, dan rincian biaya tiap bahan.',
  },
];

// Tiga langkah dengan tangkapan layar asli aplikasi (akun demo). Pilih langkah untuk melihat halamannya.
function CaraKerja() {
  const [pilih, setPilih] = useState(0);
  const l = LANGKAH[pilih];
  const pindah = (e) => {
    const arah = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!arah) return;
    e.preventDefault();
    const baru = (pilih + arah + LANGKAH.length) % LANGKAH.length;
    setPilih(baru);
    document.getElementById(`langkah-${baru}`)?.focus();
  };
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)] lg:items-start">
      <div role="tablist" aria-label="Langkah" aria-orientation="vertical" className="flex flex-col gap-2" onKeyDown={pindah}>
        {LANGKAH.map((x, i) => {
          const on = i === pilih;
          return (
            <button
              key={x.judul}
              id={`langkah-${i}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="panel-langkah"
              tabIndex={on ? 0 : -1}
              onClick={() => setPilih(i)}
              className={`flex gap-3 rounded-2xl border p-4 text-left transition-colors ${on ? 'border-biru/40 bg-biru-muda' : 'border-garis bg-kartu hover:border-biru/30'}`}
            >
              <span className={`angka flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${on ? 'bg-biru text-white' : 'bg-dasar text-biru'}`}>{i + 1}</span>
              <span>
                <span className="block font-semibold">{x.judul}</span>
                <span className={`mt-1 text-sm text-redup ${on ? 'block' : 'hidden lg:block'}`}>{x.teks}</span>
              </span>
            </button>
          );
        })}
      </div>
      <figure id="panel-langkah" role="tabpanel" aria-labelledby={`langkah-${pilih}`}>
        <div className="overflow-hidden rounded-[20px] border border-garis bg-dasar">
          <div className="flex items-center gap-1.5 border-b border-garis bg-kartu px-4 py-2.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-garis" />
            <span className="size-2.5 rounded-full bg-garis" />
            <span className="size-2.5 rounded-full bg-garis" />
          </div>
          <img key={l.gambar} src={l.gambar} width="1930" height="1222" alt={l.alt} loading="lazy" className="block aspect-[1930/1222] h-auto w-full object-cover object-top" />
        </div>
        <figcaption className="mt-2 text-xs text-redup">Tangkapan layar aplikasi dengan akun demo.</figcaption>
      </figure>
    </div>
  );
}

const FITUR = [
  { ikon: Camera, warna: 'biru', judul: 'Nota tulisan tangan tetap terbaca', teks: 'Singkatan seperti "cbe rwt" tetap dikenali. Bicara biasa juga bisa, misalnya "ayam goceng, eh salah, ceban".' },
  { ikon: Storefront, warna: 'kuning', judul: 'Harga pasar di kota Anda', teks: 'Lihat harga cabai, bawang, ayam, dan bahan lain di pasar kota Anda, supaya tahu belanjaan Anda kemahalan atau tidak.' },
  { ikon: Calculator, warna: 'aman', judul: 'Saran harga jual', teks: 'Geser harga jual dan lihat untungnya langsung berubah. Kalau ada menu yang kurang untung, Takarin AI menyarankan harga baru yang bisa dipakai dengan satu ketukan.' },
  { ikon: Tag, warna: 'rugi', judul: 'Promo paket yang tetap untung', teks: 'Gabungkan beberapa menu jadi satu paket. Takarin AI memberi pilihan harga yang tidak rugi dan membuatkan teks promo untuk status WhatsApp.' },
];

const PRINSIP = [
  [ShieldCheck, 'Angka modal tidak ditebak', 'Modal dan untung selalu dihitung dengan cara yang sama. AI hanya membantu membaca nota dan ucapan Anda.'],
  [UserCheck, 'Anda yang memutuskan', 'Hasil baca nota atau ucapan ditunjukkan dulu. Anda bisa membetulkannya sebelum disimpan.'],
  [Leaf, 'Hemat kuota', 'Foto nota diperkecil di HP sebelum dikirim, jadi tidak boros kuota internet.'],
  [Database, 'Harga pasar dari sumber resmi', 'Harga pasar diambil dari Bank Indonesia, lengkap dengan tanggalnya.'],
];

export function Beranda() {
  return (
    <main>
      <section className="relative mx-auto max-w-6xl px-4 pt-8 pb-20 text-center sm:px-6 lg:pt-6 lg:pb-24">
        <h1 className="mx-auto max-w-4xl text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl lg:text-[48px]">
          Hitung Modal <br className="sm:hidden" />
          Tiap Porsi
          <br />
          dari <span className="teks-biru">Nota</span> <span className="teks-emas">Belanja</span>
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-base text-redup sm:text-lg">
          Harga bahan naik tiap minggu, harga jual Anda tetap. Foto nota belanja, dan Takarin AI menghitung ulang modal semua menu, termasuk takaran sendok dan siung.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Tombol to="/daftar" className="!min-h-12 px-7 text-base">
            Coba gratis <ArrowRight size={18} weight="bold" aria-hidden />
          </Tombol>
          <Tombol varian="garis" to="/#cara-kerja" className="!min-h-12 px-6 text-base">
            <PlayCircle size={22} weight="fill" className="text-navy" aria-hidden /> Lihat cara kerja
          </Tombol>
        </div>

        <div className="relative mt-6">
          <KartuMelayang posisi="-left-2 top-1/2 -rotate-6" ikon={Camera} warna="biru" judul="Nota terbaca otomatis" teks="Dari foto, suara, atau teks" />
          <KartuMelayang posisi="-right-2 top-1/3 rotate-6" ikon={ChartBar} warna="kuning" judul="Harga pasar di kota Anda" teks="Data dari Bank Indonesia" />
          <Pratinjau />
        </div>

        <div className="mt-10 lg:mt-6">
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-biru-terang/60" />
            <p className="text-base font-semibold">Dibuat untuk cara kerja warung</p>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-kuning/70" />
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {FAKTA.map(([Ikon, teks]) => (
              <li key={teks} className="flex items-center justify-center gap-2 text-sm font-semibold text-redup">
                <Ikon size={24} weight="duotone" className="shrink-0 text-biru" aria-hidden /> {teks}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Untung tergerus <span className="teks-emas">tanpa terasa</span>
            </h2>
            <p className="mt-3 max-w-lg text-redup">
              Harga jual ditentukan sekali di awal, lalu jarang dihitung ulang ketika harga bahan naik. Cabai naik 10,6% berarti sekitar Rp170 lebih mahal per porsi ayam geprek. Dengan 50 porsi sehari, itu sekitar Rp255.000 sebulan dari satu bahan saja.
            </p>
            <figure className="mt-6 flex items-center gap-4 border-l-4 border-kuning pl-4">
              <p className="angka text-5xl font-extrabold tracking-tight text-biru">10,6%</p>
              <figcaption className="text-sm">
                <span className="font-semibold">Kenaikan cabai rawit merah di Denpasar dalam seminggu.</span>
                <span className="block text-redup">Data Bank Indonesia, 10 November 2026</span>
              </figcaption>
            </figure>
            <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
              {MASALAH.map(({ judul, teks }, i) => (
                <li key={judul} className="border-t-2 border-garis pt-3">
                  <span className="angka text-xs font-bold text-biru">0{i + 1}</span>
                  <p className="font-semibold">{judul}</p>
                  <p className="mt-0.5 text-redup">{teks}</p>
                </li>
              ))}
            </ol>
          </div>
          <Kebocoran />
        </div>
      </section>

      <section id="cara-kerja" className="scroll-mt-20 border-y border-garis bg-kartu">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Cukup <span className="teks-biru">3 Langkah</span> <span className="teks-emas">Mudah</span>
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-redup">Isi menu sekali. Setelah itu Anda cukup mencatat belanja, sisanya dihitung otomatis.</p>
          </div>
          <CaraKerja />
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Semua Hitungan <span className="teks-biru">dalam</span> <span className="teks-emas">Satu Tempat</span>
          </h2>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {FITUR.map((f) => (
            <li key={f.judul} className="flex gap-4 rounded-[20px] border border-garis bg-kartu p-5 shadow-kartu">
              <IkonKotak ikon={f.ikon} warna={f.warna} />
              <div>
                <h3 className="font-semibold">{f.judul}</h3>
                <p className="mt-1 text-sm text-redup">{f.teks}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-24">
        <div className="grid gap-4 border-t border-garis pt-10 lg:grid-cols-[1fr_1.4fr] lg:gap-10">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Tanpa isi tabel</h2>
          <p className="text-redup sm:text-lg">
            Kalkulator HPP dan template Excel meminta semua bahan dalam gram dan harga diketik ulang setiap kali berubah. Di Takarin cukup foto nota atau ceritakan resepnya, lalu modal semua menu ikut diperbarui.
          </p>
        </div>
      </section>

      <section className="border-y border-garis bg-gradient-to-br from-biru-muda via-white to-kuning-muda/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Hitungannya bisa dipercaya</h2>
          <p className="mt-3 max-w-2xl text-redup">AI hanya membaca nota, ucapan, dan cerita Anda. Semua angka modal dan untung dihitung dengan rumus HPP standar dari buku dan jurnal costing, lalu Anda periksa sebelum disimpan.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {PRINSIP.map(([Ikon, judul, teks]) => (
              <li key={judul} className="flex gap-4 rounded-[20px] border border-white bg-white/80 p-5 shadow-kartu">
                <IkonKotak ikon={Ikon} warna="biru" />
                <div>
                  <h3 className="font-semibold">{judul}</h3>
                  <p className="mt-1 text-sm text-redup">{teks}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-20 gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] lg:py-24">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Pertanyaan umum</h2>
          <p className="mt-3 text-redup">Hal yang paling sering ditanyakan pemilik usaha.</p>
        </div>
        <div className="flex flex-col gap-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-garis bg-kartu px-5">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <CaretDown size={18} weight="bold" className="shrink-0 text-redup transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-5 text-redup">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-garis">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight">Mulai dari menu yang paling sering terjual</h2>
        <p className="mx-auto mt-2 max-w-xl text-redup">Daftar gratis, jawab beberapa pertanyaan singkat tentang usaha Anda, lalu ceritakan satu menu. Modal per porsinya langsung kelihatan.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Tombol to="/daftar" className="!min-h-12 px-7 text-base">
            Coba gratis <ArrowRight size={18} weight="bold" aria-hidden />
          </Tombol>
          <Tombol varian="garis" to="/masuk" className="!min-h-12 px-7 text-base">
            Coba akun demo
          </Tombol>
        </div>
        </div>
      </section>
    </main>
  );
}

function Halaman({ judul, children }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">{judul}</h1>
      <div className="mt-6 flex flex-col gap-4 leading-relaxed [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </main>
  );
}

const FAQ = [
  ['Apa itu modal per porsi (HPP)?', 'Biaya untuk membuat satu porsi menu: bahan-bahannya, bungkusnya, ditambah sebagian kecil biaya rutin seperti gas, listrik, atau sewa tempat.'],
  ['Takaran saya pakai sendok dan siung, bisa?', 'Bisa. Sendok, gelas, siung, butir, potong, dan ekor diubah otomatis ke gram dengan perkiraan umum. Untuk satuan seperti ikat atau bungkus, isi beratnya sekali saja di halaman Bahan baku.'],
  ['Kalau hasil baca nota salah?', 'Hasil baca selalu ditunjukkan dulu sebelum disimpan. Baris yang meragukan berwarna kuning, dan harga yang jauh dari biasanya diberi peringatan. Anda bisa membetulkannya langsung.'],
  ['Harga pasar diambil dari mana?', 'Dari situs harga pangan Bank Indonesia (PIHPS), yaitu harga di pasar tradisional. Kalau kota Anda tidak ada, dipakai harga provinsi atau harga nasional. Tanggal datanya selalu ditampilkan.'],
  ['Kenapa harga bahan saya beda dengan harga pasar?', 'Modal dihitung dari harga yang Anda bayar sendiri, yaitu rata-rata tiga belanja terakhir. Harga pasar hanya untuk pembanding.'],
  ['Apakah promo paket bisa membuat rugi?', 'Tidak. Paket yang harganya di bawah modal tidak bisa disimpan. Takarin AI juga menunjukkan berapa paket yang perlu terjual supaya untung Anda tidak turun.'],
  ['Bisa dipakai di HP?', 'Bisa. Takarin AI dibuka lewat browser di HP atau laptop, tanpa perlu memasang aplikasi.'],
  ['Apakah data usaha saya aman?', 'Resep dan catatan belanja hanya bisa dilihat dari akun Anda, dan tidak dipakai untuk melatih AI.'],
];

export function Bantuan() {
  return (
    <Halaman judul="Pusat bantuan">
      <div className="flex flex-col gap-2">
        {FAQ.map(([q, a]) => (
          <details key={q} className="rounded-xl border border-garis bg-kartu px-4">
            <summary className="flex min-h-12 items-center font-semibold">{q}</summary>
            <p className="pb-4 text-redup">{a}</p>
          </details>
        ))}
      </div>
    </Halaman>
  );
}

export function Tentang() {
  return (
    <Halaman judul="Tentang Takarin AI">
      <p>Banyak warung menentukan harga jual dengan kira-kira, lalu tidak sadar untungnya menipis ketika harga bahan naik. Takarin AI dibuat untuk menjawab satu pertanyaan: berapa modal satu porsi hari ini, dan apakah harga jual masih untung.</p>
      <h2>Yang dibantu AI</h2>
      <ul>
        <li>Membaca foto nota, termasuk tulisan tangan dan singkatan.</li>
        <li>Memahami ucapan belanja, termasuk bahasa sehari-hari seperti goceng dan ceban.</li>
        <li>Menyusun resep dan takaran dari cerita Anda.</li>
        <li>Menulis catatan harian, serta nama dan teks promo.</li>
      </ul>
      <p>Modal, untung, harga minimal, dan harga promo tidak ditebak AI. Semuanya dihitung dengan cara yang sama setiap kali.</p>
      <h2>Hemat kuota</h2>
      <ul>
        <li>Foto nota diperkecil di HP sebelum dikirim.</li>
        <li>AI hanya dipakai saat membaca nota, ucapan, dan cerita, atau saat menulis teks. Hitungan dan grafik tidak memakai AI.</li>
      </ul>
      <h2>Data Anda</h2>
      <ul>
        <li>Resep dan catatan belanja hanya bisa dilihat dari akun Anda, dan tidak dipakai untuk melatih AI.</li>
        <li>Harga pasar diambil dari situs harga pangan Bank Indonesia, secukupnya, dan sumbernya selalu ditulis. Takarin AI tidak mengambil data dari toko online atau aplikasi pesan antar.</li>
        <li>Semua hasil AI bisa Anda periksa dan ubah sebelum dipakai.</li>
      </ul>
    </Halaman>
  );
}

export function Privasi() {
  return (
    <Halaman judul="Kebijakan privasi">
      <p>Halaman ini menjelaskan data yang disimpan Takarin AI dan cara memakainya.</p>
      <h2>Data yang disimpan</h2>
      <ul>
        <li>Nama, email, dan password untuk masuk. Password disimpan dalam bentuk hash, bukan teks asli.</li>
        <li>Profil usaha: nama, jenis, kota, target untung, porsi per hari, dan biaya rutin.</li>
        <li>Resep menu, catatan belanja, dan paket promo yang Anda buat.</li>
      </ul>
      <h2>Foto dan rekaman suara</h2>
      <p>Foto nota dan rekaman suara dikirim ke layanan AI hanya untuk dibaca, lalu tidak disimpan di server. Yang disimpan adalah hasil bacaan yang sudah Anda periksa.</p>
      <h2>Layanan pihak ketiga</h2>
      <p>Pembacaan teks dan gambar memakai layanan AI melalui API. Data yang dikirim hanya isi nota, ucapan, atau cerita yang Anda masukkan.</p>
      <h2>Menghapus data</h2>
      <p>Menu, belanja, dan promo bisa dihapus dari aplikasi kapan saja.</p>
    </Halaman>
  );
}

export function Syarat() {
  return (
    <Halaman judul="Syarat dan ketentuan">
      <p>Takarin AI adalah alat bantu menghitung. Keputusan harga jual tetap di tangan pemilik usaha.</p>
      <h2>Ketepatan angka</h2>
      <p>Modal dihitung dari takaran dan harga yang Anda masukkan atau setujui. Konversi takaran rumah tangga memakai perkiraan umum, sehingga hasilnya bisa berbeda dengan timbangan sebenarnya.</p>
      <h2>Hasil AI</h2>
      <p>Hasil baca nota, suara, dan cerita bisa keliru. Periksa setiap hasil sebelum disimpan.</p>
      <h2>Harga pasar</h2>
      <p>Harga pasar adalah pembanding dan bisa berbeda dengan harga di toko langganan Anda. Tanggal data selalu ditampilkan.</p>
      <h2>Akun</h2>
      <p>Satu akun untuk satu usaha. Jaga kerahasiaan password Anda.</p>
    </Halaman>
  );
}
