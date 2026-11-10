import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, Camera, Microphone, ChatText, Storefront, Calculator, Tag, ChartBar, ForkKnife, Basket } from '@phosphor-icons/react';
import { Chip, IkonKotak, Merek, Tombol } from '../components/ui.jsx';
import Garis from '../components/Garis.jsx';

export function PublikLayout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  const kelas = 'inline-flex min-h-11 items-center px-3 text-sm font-medium text-redup hover:text-tinta';
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-[#eef4ff] via-white to-dasar">
      <header className="sticky top-0 z-10 border-b border-garis/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <Link to="/" className="inline-flex min-h-11 items-center">
            <Merek className="text-xl" />
          </Link>
          <nav aria-label="Menu situs" className="hidden items-center md:flex">
            <Link to="/#cara-kerja" className={kelas}>
              Cara kerja
            </Link>
            <Link to="/#fitur" className={kelas}>
              Fitur
            </Link>
            <NavLink to="/bantuan" className={({ isActive }) => `${kelas} ${isActive ? '!text-biru' : ''}`}>
              Bantuan
            </NavLink>
            <NavLink to="/tentang" className={({ isActive }) => `${kelas} ${isActive ? '!text-biru' : ''}`}>
              Tentang
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <Tombol varian="garis" to="/masuk">
              Masuk
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
          <p>
            <Merek /> · proyek LOGICODIX 2026
          </p>
          <nav aria-label="Tautan situs" className="flex flex-wrap gap-1">
            <Link to="/bantuan" className="inline-flex min-h-11 items-center px-2 hover:text-tinta md:hidden">
              Bantuan
            </Link>
            <Link to="/tentang" className="inline-flex min-h-11 items-center px-2 hover:text-tinta md:hidden">
              Tentang
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

// Pratinjau tampilan aplikasi. Angkanya contoh dari akun demo, ditandai di bawahnya.
const TREN_CABAI = [58750, 58750, 58750, 58750, 60000, 61250, 65000, 65000].map((harga) => ({ harga }));

function Pratinjau() {
  return (
    <figure className="mx-auto mt-12 max-w-4xl">
      <div className="overflow-hidden rounded-[24px] border border-garis bg-kartu text-left shadow-[0_24px_60px_rgb(15_31_61/0.10)]">
        <div className="flex">
          <div className="hidden w-44 shrink-0 flex-col gap-1 bg-[#13254a] p-4 text-sm text-white/75 sm:flex" aria-hidden>
            <Merek className="mb-3 text-base !text-white" />
            {[
              [ChartBar, 'Ringkasan', true],
              [ForkKnife, 'Produk'],
              [Storefront, 'Harga pasar'],
              [Basket, 'Bahan baku'],
            ].map(([Ikon, l, aktif]) => (
              <span key={l} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${aktif ? 'bg-white/15 font-semibold text-white' : ''}`}>
                <Ikon size={16} /> {l}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1 p-4 sm:p-6">
            <p className="text-lg font-bold">Halo, Bu Sari</p>
            <p className="text-xs text-redup">Warung Bu Sari, Denpasar</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl bg-biru-muda/70 p-4">
                <p className="text-sm text-redup">Ayam Geprek, modal per porsi</p>
                <p className="angka mt-1 text-2xl font-bold">Rp8.708</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="angka">Jual Rp15.000</span>
                  <Chip status="aman">Untung 41,9%</Chip>
                </div>
              </div>
              <div className="rounded-2xl border border-garis p-4">
                <p className="text-sm text-redup">Cabai rawit merah, Denpasar</p>
                <p className="angka mt-1 text-lg font-bold">Rp65.000/kg</p>
                <Garis data={TREN_CABAI} label="Tren harga cabai rawit merah naik" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-kuning-muda px-4 py-3 text-sm">
              <span>
                <b>Es Jeruk</b> untung 39,0%, di bawah target 40%.
              </span>
              <span className="angka font-semibold text-kuning-tua">Harga aman Rp6.500</span>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-redup">Contoh tampilan dengan data akun demo. Harga cabai dari PIHPS Bank Indonesia.</figcaption>
    </figure>
  );
}

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
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-center sm:px-6 lg:pt-20">
        <h1 className="mx-auto max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Hitung modal tiap porsi <span className="teks-merek">dari nota belanja</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-redup">
          takarin.ai menghitung HPP setiap menu dari takaran resep dan harga belanja Anda, lalu memberi tahu menu mana yang untungnya menipis dan berapa harga yang aman.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Tombol to="/daftar" className="!min-h-12 px-7 text-base">
            Mulai hitung <ArrowRight size={18} weight="bold" aria-hidden />
          </Tombol>
          <Tombol varian="garis" to="/#cara-kerja" className="!min-h-12 px-7 text-base">
            Lihat cara kerja
          </Tombol>
        </div>
        <Pratinjau />
      </section>

      <section id="cara-kerja" className="scroll-mt-20 border-y border-garis bg-kartu">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Dari cerita sampai harga aman</h2>
            <p className="mx-auto mt-2 max-w-2xl text-redup">Tiga langkah. Setelah menu tersimpan, Anda cukup mencatat belanja.</p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {LANGKAH.map((l) => (
              <li key={l.no} className="flex flex-col gap-4 rounded-[20px] border border-garis bg-kartu p-5 shadow-kartu">
                <div className="flex items-start gap-3">
                  <span className="angka flex size-11 shrink-0 items-center justify-center rounded-xl bg-biru text-sm font-bold text-white">{l.no}</span>
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
        <h2 className="text-3xl font-bold tracking-tight">Yang dikerjakan untuk Anda</h2>
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
