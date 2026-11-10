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
  ['/bantuan', 'FAQ'],
];

export function PublikLayout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  const aktif = (to) => (to.includes('#') ? `/${hash}` === to : pathname === to && !hash);
  return (
    <div className="latar-merek flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link to="/" className="inline-flex min-h-11 items-center">
            <Merek className="text-xl" />
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
          <div className="flex items-center gap-2">
            <Tombol varian="masuk" to="/masuk">
              Masuk <ArrowRight size={16} weight="bold" className="text-kuning" aria-hidden />
            </Tombol>
            <Tombol to="/daftar" className="hidden sm:inline-flex">
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
            <Merek /> · proyek LOGICODIX 2026
          </p>
          <nav aria-label="Tautan situs" className="flex flex-wrap gap-1">
            <Link to="/tentang" className="inline-flex min-h-11 items-center px-2 hover:text-tinta">
              Tentang
            </Link>
            <Link to="/bantuan" className="inline-flex min-h-11 items-center px-2 hover:text-tinta md:hidden">
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

// Kartu miring di kiri dan kanan pratinjau (desktop saja). Isinya fitur yang memang ada.
function KartuMelayang({ posisi, ikon, warna, judul, teks }) {
  return (
    <div className={`absolute z-10 hidden w-56 items-center gap-3 rounded-2xl border border-white bg-white/90 p-4 text-left shadow-[0_18px_40px_rgb(13_27_62/0.12)] backdrop-blur xl:flex ${posisi}`} aria-hidden>
      <IkonKotak ikon={ikon} warna={warna} />
      <div>
        <p className="font-bold">{judul}</p>
        <p className="text-sm text-redup">{teks}</p>
      </div>
    </div>
  );
}

// Grafik area kecil untuk pratinjau (data demo modal ayam geprek 8 belanja terakhir).
function Area() {
  const nilai = [8350, 8420, 8380, 8510, 8470, 8590, 8640, 8708];
  const min = 8300;
  const maks = 8750;
  const titik = nilai.map((v, i) => [(i / (nilai.length - 1)) * 200, 60 - ((v - min) / (maks - min)) * 50]);
  const garis = titik.map((p) => p.join(',')).join(' ');
  return (
    <svg viewBox="0 0 200 64" className="h-16 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="isi-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#76b9ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#76b9ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,64 ${garis} 200,64`} fill="url(#isi-area)" />
      <polyline points={garis} fill="none" stroke="#3d86ea" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function KpiMini({ label, nilai }) {
  return (
    <div className="rounded-2xl border border-garis bg-white p-3 shadow-kartu">
      <p className="text-xs text-redup">{label}</p>
      <p className="angka mt-0.5 truncate font-bold">{nilai}</p>
    </div>
  );
}

// Pratinjau tampilan aplikasi. Angkanya dari akun demo, ditandai di bawahnya.
function Pratinjau() {
  return (
    <figure className="mx-auto max-w-[720px]">
      <div className="rounded-[26px] border border-white bg-white/60 p-2 shadow-[0_30px_70px_rgb(29_89_187/0.15)] backdrop-blur">
        <div className="flex overflow-hidden rounded-[20px] border border-garis bg-white text-left">
          <div className="hidden w-40 shrink-0 flex-col gap-1 bg-gradient-to-b from-navy to-[#2a3f66] p-3 text-[13px] text-white/75 sm:flex" aria-hidden>
            <Merek terang className="mb-3 text-sm" />
            {[
              [House, 'Ringkasan', true],
              [ForkKnife, 'Produk'],
              [Storefront, 'Harga pasar'],
              [Basket, 'Bahan baku'],
            ].map(([Ikon, l, a]) => (
              <span key={l} className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 ${a ? 'bg-biru-muda font-semibold text-biru' : ''}`}>
                <Ikon size={15} weight={a ? 'fill' : 'regular'} /> {l}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">Halo, Bu Sari!</p>
                <p className="text-xs text-redup">Ringkasan modal Warung Bu Sari hari ini.</p>
              </div>
              <span className="hidden items-center gap-1.5 rounded-xl border border-garis px-2.5 py-1 text-xs font-medium sm:inline-flex">
                <CalendarBlank size={14} /> Hari ini <CaretDown size={12} />
              </span>
            </div>
            <div className="mt-3 grid grid-cols-[auto_1fr] items-end gap-4 rounded-2xl bg-gradient-to-br from-biru-muda to-white p-3.5">
              <div>
                <p className="text-xs font-medium">Modal per porsi, Ayam Geprek</p>
                <p className="angka mt-1 flex flex-wrap items-baseline gap-2 text-2xl font-extrabold">
                  Rp8.708 <Chip status="aman">Untung 41,9%</Chip>
                </p>
              </div>
              <Area />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <KpiMini label="Menu dihitung" nilai="4 menu" />
              <KpiMini label="Belanja bulan ini" nilai="Rp628.750" />
              <KpiMini label="Rata-rata untung" nilai="48,4%" />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-center text-xs text-redup">Contoh tampilan dengan data akun demo.</figcaption>
    </figure>
  );
}

const FAKTA = [
  [Scales, 'Takaran sdm, siung, potong'],
  [MapPin, 'Harga kota, provinsi, nasional'],
  [Storefront, '11 komoditas pangan PIHPS'],
  [Microphone, 'Foto, suara, atau ketik'],
];

const MASALAH = [
  {
    judul: 'Takaran memakai sendok, bukan gram',
    teks: 'Dua sendok gula atau tiga siung bawang sulit diubah menjadi rupiah tanpa alat bantu.',
  },
  {
    judul: 'Nota disimpan, tidak dihitung',
    teks: 'Nota belanja jarang dipakai untuk memeriksa apakah setiap porsi masih untung.',
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
    <div className="rounded-[24px] border border-garis bg-kartu p-5 shadow-[0_24px_60px_rgb(29_89_187/0.12)] sm:p-6">
      <p className="font-bold">Coba hitung untung yang hilang</p>
      <p className="text-sm text-redup">Modal per porsi naik, harga jual tetap.</p>
      <div className="mt-4 grid gap-1">
        {geser('Kenaikan modal per porsi', naik, setNaik, 100, 2000, 50, rp(naik))}
        {geser('Porsi terjual per hari', porsi, setPorsi, 10, 200, 5, `${porsi} porsi`)}
        {geser('Harga jual per porsi', harga, setHarga, 5000, 50000, 500, rp(harga))}
      </div>
      <div className="mt-4 rounded-2xl bg-navy p-4 text-white" aria-live="polite">
        <p className="text-sm text-white/75">Untung yang hilang dalam 30 hari</p>
        <p className="angka mt-1 text-3xl font-extrabold text-kuning">{rp(bulan)}</p>
        <p className="angka mt-1 text-sm text-white/80">Sama dengan memberikan {setara} porsi gratis setiap bulan.</p>
      </div>
      <p className="mt-3 text-xs text-redup">Takarin AI menghitung kenaikan modal ini dari nota belanja Anda, per menu, setiap kali belanja dicatat.</p>
    </div>
  );
}

const LANGKAH = [
  {
    no: '01',
    judul: 'Ceritakan menu',
    teks: 'Tulis menu, harga jual, dan takaran dengan bahasa sehari-hari. AI menyusunnya menjadi resep yang bisa Anda periksa.',
    isi: (
      <div className="rounded-xl border border-garis bg-dasar p-3 text-sm text-redup">"Ayam geprek 15 ribu, ayam 1 potong, cabai rawit 20 gram, minyak 1 sdm, nasi 100 gram..."</div>
    ),
  },
  {
    no: '02',
    judul: 'Catat belanja',
    teks: 'Foto nota, ucapkan, atau ketik. Baris yang meragukan dan harga yang jauh dari pasar ditandai sebelum disimpan.',
    isi: (
      <ul className="tepi-nota rounded-xl border border-garis bg-dasar p-3 font-mono text-xs">
        {[
          ['cbe rwt 1/2', '31.500'],
          ['ayam 5 kg', '180.000'],
          ['minyak 2 ltr', '46.000'],
        ].map(([a, b]) => (
          <li key={a} className="flex justify-between py-0.5">
            <span>{a}</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    no: '03',
    judul: 'Lihat modal dan harga aman',
    teks: 'Modal per porsi dihitung ulang setiap kali belanja disimpan. Menu yang untungnya di bawah target langsung ditandai.',
    isi: (
      <div className="rounded-xl border border-garis bg-dasar p-3">
        <p className="text-xs text-redup">Modal per porsi</p>
        <p className="angka text-xl font-bold">Rp8.708</p>
        <div className="mt-1 flex flex-wrap gap-x-4 text-xs">
          <span className="angka">Harga aman Rp15.000</span>
          <span className="angka font-semibold text-aman">Untung 41,9%</span>
        </div>
      </div>
    ),
  },
];

const FITUR = [
  { ikon: Camera, warna: 'biru', judul: 'Baca nota, suara, dan tulisan', teks: 'Singkatan nota seperti "cbe rwt" dan bahasa lisan seperti goceng, ceban, atau "eh salah" diubah menjadi baris belanja.' },
  { ikon: Storefront, warna: 'kuning', judul: 'Harga pasar daerah', teks: 'Harga pasar tradisional tingkat kota, provinsi, dan nasional dari PIHPS Bank Indonesia sebagai pembanding harga belanja.' },
  { ikon: Calculator, warna: 'aman', judul: 'Saran harga dan simulasi', teks: 'Geser harga jual atau harga bahan dan lihat untungnya berubah. Saran harga bisa diterapkan langsung dari ringkasan.' },
  { ikon: Tag, warna: 'rugi', judul: 'Promo paket yang tetap untung', teks: 'Tiga pilihan harga paket beserta tambahan penjualan yang dibutuhkan agar laba tidak turun. Paket rugi tidak bisa disimpan.' },
];

const PRINSIP = [
  [ShieldCheck, 'Angka dihitung oleh kode', 'Modal, untung, dan harga aman memakai rumus tetap. Teks AI yang memuat angka di luar hasil hitungan dibuang dan diganti penjelasan baku.'],
  [UserCheck, 'Pemilik usaha tetap memutuskan', 'Setiap hasil AI masuk ke halaman periksa terlebih dahulu. Tidak ada data yang dipakai sebelum disetujui.'],
  [Leaf, 'Hemat sumber daya', 'Foto dikompres di ponsel, AI dipanggil hanya saat membaca atau menulis, dan harga pasar diambil paling sering sekali dalam enam jam.'],
  [Database, 'Data publik yang jelas sumbernya', 'Harga pasar berasal dari PIHPS Bank Indonesia dengan tanggal yang selalu ditampilkan. Tidak ada pengambilan data dari toko atau marketplace.'],
];

export function Beranda() {
  return (
    <main>
      <section className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 text-center sm:px-6 lg:pt-12 lg:pb-20">
        <h1 className="mx-auto max-w-4xl text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl lg:text-[56px]">
          Hitung HPP Usahamu
          <br />
          dari <span className="teks-biru">Nota</span> <span className="teks-emas">Belanja</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-redup sm:text-lg">
          Untuk warung, kedai, kue, dan katering. Takarin AI membaca nota belanja, menghitung modal setiap porsi, dan menunjukkan harga jual yang masih memenuhi target untung.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Tombol to="/daftar" className="!min-h-12 px-7 text-base">
            Hitung HPP gratis <ArrowRight size={18} weight="bold" aria-hidden />
          </Tombol>
          <Tombol varian="garis" to="/#cara-kerja" className="!min-h-12 px-6 text-base">
            <PlayCircle size={22} weight="fill" className="text-navy" aria-hidden /> Lihat cara kerja
          </Tombol>
        </div>

        <div className="relative mt-8">
          <KartuMelayang posisi="left-0 top-12 -rotate-6" ikon={Camera} warna="biru" judul="Nota jadi data" teks="Foto, suara, atau ketik" />
          <KartuMelayang posisi="right-0 top-20 rotate-6" ikon={ChartBar} warna="kuning" judul="Harga pasar kotamu" teks="Data PIHPS Bank Indonesia" />
          <Pratinjau />
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-biru-terang/60" />
            <p className="text-base font-semibold">Dirancang mengikuti cara warung bekerja</p>
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
            <span className="inline-block rounded-full bg-rugi-muda px-4 py-1.5 text-sm font-semibold tracking-wide text-rugi">MASALAH</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Untung tergerus <span className="teks-emas">tanpa terasa</span>
            </h2>
            <p className="mt-3 max-w-lg text-redup">
              Harga jual ditentukan sekali di awal, lalu jarang dihitung ulang ketika harga bahan naik. Selisih beberapa ratus rupiah per porsi tidak terasa di kasir, tetapi terasa di akhir bulan.
            </p>
            <figure className="mt-6 flex items-center gap-4 border-l-4 border-kuning pl-4">
              <p className="angka text-5xl font-extrabold tracking-tight text-kuning-tua">10,6%</p>
              <figcaption className="text-sm">
                <span className="font-semibold">Kenaikan cabai rawit merah di Denpasar dalam seminggu.</span>
                <span className="block text-redup">PIHPS Bank Indonesia, 10 November 2026</span>
              </figcaption>
            </figure>
            <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
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
            <span className="inline-block rounded-full bg-biru-muda px-4 py-1.5 text-sm font-semibold tracking-wide text-biru">CARA KERJA</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Hitung HPP dalam <span className="teks-biru">3 Langkah</span> <span className="teks-emas">Mudah</span>
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-redup">Setelah menu tersimpan, pekerjaan rutin Anda hanya mencatat belanja. Sisanya dihitung otomatis.</p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {LANGKAH.map((l) => (
              <li key={l.no} className="flex flex-col gap-4 rounded-[20px] border border-garis bg-kartu p-5 shadow-kartu">
                <div className="flex items-start gap-3">
                  <span className="angka flex size-11 shrink-0 items-center justify-center rounded-xl bg-biru-muda text-base font-extrabold text-biru">{l.no}</span>
                  <div>
                    <h3 className="font-semibold">{l.judul}</h3>
                    <p className="mt-1 text-sm text-redup">{l.teks}</p>
                  </div>
                </div>
                <div className="mt-auto">{l.isi}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-24">
        <div className="text-center">
          <span className="inline-block rounded-full bg-kuning-muda px-4 py-1.5 text-sm font-semibold tracking-wide text-kuning-tua">FITUR</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
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

      <section className="border-y border-garis bg-gradient-to-br from-biru-muda via-white to-kuning-muda/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <span className="inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold tracking-wide text-biru shadow-kartu">PRINSIP</span>
          <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">AI membaca, kode yang menghitung</h2>
          <p className="mt-3 max-w-2xl text-redup">AI dipakai di bagian yang memang sulit bagi manusia: membaca tulisan tangan, memahami ucapan, dan menyusun resep dari cerita. Angka yang menentukan harga tidak diserahkan kepada AI.</p>
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

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight">Mulai dari menu yang paling sering terjual</h2>
        <p className="mx-auto mt-2 max-w-xl text-redup">Daftar, jawab enam pertanyaan tentang usaha Anda, lalu ceritakan satu menu. Modal per porsinya langsung terlihat.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Tombol to="/daftar" className="!min-h-12 px-7 text-base">
            Hitung HPP gratis <ArrowRight size={18} weight="bold" aria-hidden />
          </Tombol>
          <Tombol varian="garis" to="/bantuan" className="!min-h-12 px-7 text-base">
            Pertanyaan umum
          </Tombol>
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
  ['Apa itu modal per porsi (HPP)?', 'Biaya untuk membuat satu porsi menu: bahan sesuai takaran, kemasan, dan bagian dari biaya gas, listrik, atau sewa.'],
  ['Takaran saya pakai sendok dan siung, bisa?', 'Bisa. sdm, sdt, gelas, siung, butir, potong, dan ekor diubah ke gram atau ml dengan perkiraan umum. Untuk satuan khusus seperti ikat atau bungkus, isi beratnya sekali di halaman bahan baku.'],
  ['Kalau hasil baca nota salah?', 'Setiap hasil baca masuk ke halaman periksa dulu. Baris yang ragu ditandai kuning, dan harga yang jauh dari harga pasar diberi peringatan. Data baru dipakai setelah Anda simpan.'],
  ['Harga pasar diambil dari mana?', 'Dari PIHPS Nasional milik Bank Indonesia (bi.go.id/hargapangan), harga pasar tradisional per kota dan provinsi. Server mengambilnya secara berkala, dan tanggal serta sumbernya selalu ditampilkan. Kalau kota Anda tidak ada di PIHPS, dipakai harga provinsi, lalu nasional.'],
  ['Kenapa harga bahan saya beda dengan harga pasar?', 'Harga yang dipakai untuk menghitung modal adalah harga belanja Anda sendiri (rata-rata tiga belanja terakhir). Harga pasar hanya pembanding.'],
  ['Apakah promo paket bisa membuat rugi?', 'Paket dengan harga di bawah modal tidak bisa disimpan. Setiap pilihan harga menunjukkan untung per paket dan berapa banyak lagi paket harus terjual supaya labanya sama.'],
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
      <p>Banyak warung menentukan harga jual dengan perkiraan, lalu tidak sadar untungnya menipis ketika harga bahan naik. Takarin AI dibuat untuk menjawab satu pertanyaan: berapa modal satu porsi hari ini, dan apakah harga jual masih aman.</p>
      <h2>Cara kerja AI</h2>
      <ul>
        <li>Membaca foto nota dan tulisan tangan menjadi baris belanja.</li>
        <li>Mengubah ucapan belanja menjadi data, termasuk bahasa sehari-hari seperti goceng dan ceban.</li>
        <li>Menyusun resep dan takaran dari cerita pemilik usaha.</li>
        <li>Merangkai penjelasan, catatan harian, serta nama dan caption promo.</li>
      </ul>
      <p>Perhitungan modal, untung, harga aman, dan promo memakai rumus tetap di server, bukan AI. Teks AI yang memuat angka di luar hasil hitungan dibuang.</p>
      <h2>Hemat sumber daya</h2>
      <ul>
        <li>Foto nota dikompres di ponsel sebelum diunggah, sehingga hemat kuota dan daya server.</li>
        <li>AI hanya dipanggil saat membaca nota, suara, cerita, dan menulis teks. Hitungan dan grafik tidak memakai AI.</li>
        <li>Memakai model berukuran kecil, dengan model cadangan kalau layanan utama sedang penuh.</li>
      </ul>
      <h2>Etika data</h2>
      <ul>
        <li>Data resep dan belanja hanya terlihat oleh akun Anda. Takarin AI tidak memakainya untuk melatih model.</li>
        <li>Harga pasar berasal dari data publik PIHPS Bank Indonesia, diambil secukupnya (satu wilayah paling sering sekali dalam beberapa jam) dan selalu disebut sumbernya. Aplikasi tidak mengambil data toko, marketplace, atau aplikasi pesan antar tanpa izin.</li>
        <li>Semua hasil AI bisa diperiksa dan diubah sebelum dipakai.</li>
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
