import { useEffect } from 'react';
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

function KpiMini({ ikon: Ikon, warna, label, nilai }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-garis bg-white p-3 shadow-kartu">
      <span className={`flex size-9 items-center justify-center rounded-xl ${warna}`}>
        <Ikon size={20} weight="fill" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-redup">{label}</p>
        <p className="angka truncate font-bold">{nilai}</p>
      </div>
    </div>
  );
}

// Pratinjau tampilan aplikasi. Angkanya dari akun demo, ditandai di bawahnya.
function Pratinjau() {
  return (
    <figure className="mx-auto max-w-3xl">
      <div className="rounded-[28px] border border-white bg-white/60 p-2 shadow-[0_30px_70px_rgb(29_89_187/0.15)] backdrop-blur">
        <div className="flex overflow-hidden rounded-[22px] border border-garis bg-white text-left">
          <div className="hidden w-44 shrink-0 flex-col gap-1 bg-gradient-to-b from-navy to-[#2a3f66] p-4 text-sm text-white/75 sm:flex" aria-hidden>
            <Merek terang className="mb-4 text-base" />
            {[
              [House, 'Ringkasan', true],
              [ForkKnife, 'Produk'],
              [Storefront, 'Harga pasar'],
              [Basket, 'Bahan baku'],
            ].map(([Ikon, l, a]) => (
              <span key={l} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${a ? 'bg-biru-muda font-semibold text-biru' : ''}`}>
                <Ikon size={16} weight={a ? 'fill' : 'regular'} /> {l}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold">Halo, Bu Sari!</p>
                <p className="text-xs text-redup">Ringkasan modal Warung Bu Sari hari ini.</p>
              </div>
              <span className="hidden items-center gap-1.5 rounded-xl border border-garis px-3 py-1.5 text-xs font-medium sm:inline-flex">
                <CalendarBlank size={14} /> Hari ini <CaretDown size={12} />
              </span>
            </div>
            <div className="mt-4 grid grid-cols-[auto_1fr] items-end gap-4 rounded-2xl bg-gradient-to-br from-biru-muda to-white p-4">
              <div>
                <p className="text-sm font-medium">Modal per porsi, Ayam Geprek</p>
                <p className="angka mt-1 flex items-baseline gap-2 text-2xl font-extrabold sm:text-3xl">
                  Rp8.708 <Chip status="aman">Untung 41,9%</Chip>
                </p>
              </div>
              <Area />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <KpiMini ikon={ForkKnife} warna="bg-biru-muda text-biru" label="Menu dihitung" nilai="4 menu" />
              <KpiMini ikon={ShoppingCart} warna="bg-kuning-muda text-kuning-tua" label="Belanja bulan ini" nilai="Rp628.750" />
              <KpiMini ikon={ChartLineUp} warna="bg-biru-muda text-biru" label="Rata-rata untung" nilai="48,4%" />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-redup">Contoh tampilan dengan data akun demo.</figcaption>
    </figure>
  );
}

const FAKTA = [
  [Scales, 'Takaran sdm, siung, potong'],
  [MapPin, 'Harga kota, provinsi, nasional'],
  [Storefront, '11 komoditas pangan PIHPS'],
  [Microphone, 'Foto, suara, atau ketik'],
];

const LANGKAH = [
  {
    no: '01',
    judul: 'Ceritakan menu',
    teks: 'Tulis menu, harga jual, dan takaran seperti biasa. Sendok, siung, dan potong boleh.',
    isi: (
      <div className="rounded-xl border border-garis bg-dasar p-3 text-sm text-redup">"Ayam geprek 15 ribu, ayam 1 potong, cabai rawit 20 gram, minyak 1 sdm, nasi 100 gram..."</div>
    ),
  },
  {
    no: '02',
    judul: 'Catat belanja',
    teks: 'Foto nota, ucapkan, atau ketik. Hasil bacaan diperiksa dulu sebelum disimpan.',
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
    teks: 'Modal per porsi dihitung ulang setiap belanja. Menu yang untungnya menipis langsung ditandai.',
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
  { ikon: Camera, warna: 'biru', judul: 'Baca nota dan suara', teks: 'Singkatan seperti "cbe rwt" dan bahasa lisan seperti goceng atau ceban diubah jadi baris belanja.' },
  { ikon: Storefront, warna: 'kuning', judul: 'Harga pasar daerah', teks: 'Harga pasar tradisional di kota Anda dari PIHPS Bank Indonesia, untuk membandingkan harga belanja.' },
  { ikon: Calculator, warna: 'aman', judul: 'Saran harga dan simulasi', teks: 'Geser harga jual atau harga bahan, lihat untungnya berubah. Pilih saran harga dengan satu ketukan.' },
  { ikon: Tag, warna: 'rugi', judul: 'Promo paket yang tetap untung', teks: 'Gabungkan menu jadi paket. Tiga pilihan harga lengkap dengan berapa banyak lagi harus terjual.' },
];

export function Beranda() {
  return (
    <main>
      <section className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 text-center sm:px-6 lg:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-garis bg-white/80 px-4 py-1.5 text-sm font-medium shadow-kartu">
          <ForkKnife size={16} weight="fill" className="text-kuning" aria-hidden /> Untuk warung makan, kedai, kue, dan katering
        </span>
        <h1 className="mx-auto mt-5 max-w-4xl text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl lg:text-[64px]">
          Hitung HPP Usahamu
          <br />
          dari <span className="teks-biru">Nota</span> <span className="teks-emas">Belanja</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-redup">
          Foto nota, ucapkan, atau ketik belanjaan. takarin.ai menghitung modal tiap porsi, membandingkan dengan harga pasar di kotamu, dan memberi tahu harga jual yang aman.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Tombol to="/daftar" className="!min-h-12 px-7 text-base">
            Mulai Sekarang <ArrowRight size={18} weight="bold" aria-hidden />
          </Tombol>
          <Tombol varian="garis" to="/#cara-kerja" className="!min-h-12 px-6 text-base">
            <PlayCircle size={22} weight="fill" className="text-navy" aria-hidden /> Pelajari Cara Kerja
          </Tombol>
        </div>

        <div className="relative mt-14">
          <KartuMelayang posisi="-left-8 top-10 -rotate-6" ikon={Camera} warna="biru" judul="Nota jadi data" teks="Foto, suara, atau ketik" />
          <KartuMelayang posisi="-right-8 top-24 rotate-6" ikon={ChartBar} warna="kuning" judul="Harga pasar kotamu" teks="Dari PIHPS Bank Indonesia" />
          <Pratinjau />
        </div>

        <div className="mt-14">
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-biru-terang/60" />
            <p className="text-base font-semibold sm:text-lg">Yang sudah bisa dihitung</p>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-kuning/70" />
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-4 text-left sm:grid-cols-4">
            {FAKTA.map(([Ikon, teks]) => (
              <li key={teks} className="flex items-center justify-center gap-2 text-sm font-semibold text-redup">
                <Ikon size={26} weight="duotone" className="shrink-0 text-biru" aria-hidden /> {teks}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="cara-kerja" className="scroll-mt-20 border-y border-garis bg-kartu">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <span className="inline-block rounded-full bg-biru-muda px-4 py-1.5 text-sm font-semibold tracking-wide text-biru">CARA KERJA</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Hitung HPP dalam <span className="teks-biru">3 Langkah</span> <span className="teks-emas">Mudah</span></h2>
            <p className="mx-auto mt-2 max-w-2xl text-redup">Tiga langkah. Setelah menu tersimpan, Anda cukup mencatat belanja.</p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {LANGKAH.map((l) => (
              <li key={l.no} className="flex flex-col gap-4 rounded-[20px] border border-garis bg-kartu p-5 shadow-kartu">
                <div className="flex items-start gap-3">
                  <span className="angka flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-biru-terang to-biru text-base font-extrabold text-white shadow-[0_6px_14px_rgb(29_89_187/0.3)]">{l.no}</span>
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

      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <span className="inline-block rounded-full bg-kuning-muda px-4 py-1.5 text-sm font-semibold tracking-wide text-kuning-tua">FITUR</span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Semua Hitungan <span className="teks-biru">dalam</span> <span className="teks-emas">Satu Tempat</span></h2>
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

        <div className="mt-10 grid gap-6 rounded-[24px] border border-biru/15 bg-gradient-to-br from-biru-muda to-white p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI membaca, kode yang menghitung</h2>
            <p className="mt-3 text-redup">
              AI membaca nota, memahami ucapan, menyusun resep dari cerita, dan merangkai penjelasan. Modal, untung, dan harga dihitung dengan rumus tetap. Kalimat AI yang memuat angka di luar hasil hitungan dibuang.
            </p>
          </div>
          <ul className="flex flex-col gap-3 text-sm">
            {[
              [Camera, 'Foto nota dikompres di ponsel sebelum dikirim'],
              [Microphone, 'Suara diubah jadi teks, lalu jadi baris belanja'],
              [ChatText, 'Setiap hasil AI bisa diperiksa dan diubah'],
            ].map(([Ikon, t]) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl bg-kartu p-3">
                <Ikon size={22} weight="duotone" className="shrink-0 text-biru" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight">Mulai dari menu yang paling sering terjual</h2>
        <p className="mx-auto mt-2 max-w-xl text-redup">Daftar, jawab beberapa pertanyaan tentang usaha, lalu ceritakan satu menu.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Tombol to="/daftar" className="!min-h-12 px-7 text-base">
            Daftar
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
    <Halaman judul="Tentang takarin.ai">
      <p>Banyak warung menentukan harga jual dengan perkiraan, lalu tidak sadar untungnya menipis ketika harga bahan naik. takarin.ai dibuat untuk menjawab satu pertanyaan: berapa modal satu porsi hari ini, dan apakah harga jual masih aman.</p>
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
        <li>Data resep dan belanja hanya terlihat oleh akun Anda. takarin.ai tidak memakainya untuk melatih model.</li>
        <li>Harga pasar berasal dari data publik PIHPS Bank Indonesia, diambil secukupnya (satu wilayah paling sering sekali dalam beberapa jam) dan selalu disebut sumbernya. Aplikasi tidak mengambil data toko, marketplace, atau aplikasi pesan antar tanpa izin.</li>
        <li>Semua hasil AI bisa diperiksa dan diubah sebelum dipakai.</li>
      </ul>
    </Halaman>
  );
}

export function Privasi() {
  return (
    <Halaman judul="Kebijakan privasi">
      <p>Halaman ini menjelaskan data yang disimpan takarin.ai dan cara memakainya.</p>
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
      <p>takarin.ai adalah alat bantu menghitung. Keputusan harga jual tetap di tangan pemilik usaha.</p>
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
