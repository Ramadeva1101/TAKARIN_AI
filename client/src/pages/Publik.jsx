import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Camera, Microphone, ChatText } from '@phosphor-icons/react';
import { Tombol } from '../components/ui.jsx';

export function PublikLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const kelas = ({ isActive }) => `inline-flex min-h-11 items-center px-2 text-sm font-medium ${isActive ? 'text-teal' : 'text-redup hover:text-tinta'}`;
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-garis bg-kartu">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <Link to="/" className="inline-flex min-h-11 items-center text-lg font-bold text-teal">
            Dapur Untung
          </Link>
          <nav aria-label="Menu situs" className="flex flex-wrap items-center gap-1">
            <NavLink to="/bantuan" className={kelas}>
              Bantuan
            </NavLink>
            <NavLink to="/tentang" className={kelas}>
              Tentang
            </NavLink>
            <NavLink to="/masuk" className={kelas}>
              Masuk
            </NavLink>
            <Tombol to="/daftar" className="ml-1">
              Daftar
            </Tombol>
          </nav>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-garis bg-kartu">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-redup sm:px-6">
          <p>Dapur Untung, proyek LOGICODIX 2026</p>
          <nav aria-label="Tautan hukum" className="flex gap-1">
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

// Contoh hitungan nyata dari data demo, ditandai sebagai contoh.
function ContohNota() {
  const baris = [
    ['cbe rwt 1/2', 'Rp47.500'],
    ['bwg pth 1/4', 'Rp10.000'],
    ['ayam 5 kg', 'Rp180.000'],
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-label="Contoh: nota belanja diubah menjadi modal per porsi">
      <div className="rotate-[-2deg] rounded-xl border border-garis bg-kartu p-4 font-mono text-sm shadow-sm">
        <p className="text-center text-xs text-redup">NOTA BELANJA (contoh)</p>
        <ul className="tepi-nota mt-2 pt-2">
          {baris.map(([a, b]) => (
            <li key={a} className="flex justify-between py-0.5">
              <span>{a}</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative -mt-3 ml-8 rounded-2xl border border-garis bg-kartu p-4 shadow-md">
        <p className="text-sm text-redup">Ayam Geprek, per porsi</p>
        <div className="angka mt-1 grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-redup">Modal</p>
            <p className="text-lg font-bold">Rp9.046</p>
          </div>
          <div>
            <p className="text-redup">Jual</p>
            <p className="text-lg font-bold">Rp15.000</p>
          </div>
          <div>
            <p className="text-redup">Untung</p>
            <p className="text-lg font-bold text-waspada">39,7%</p>
          </div>
        </div>
        <p className="mt-2 rounded-lg bg-waspada-muda px-2 py-1 text-xs text-waspada">Cabai naik. Di bawah target 40%, harga aman Rp15.500.</p>
      </div>
    </div>
  );
}

const CARA_CATAT = [
  { ikon: Camera, judul: 'Foto nota', teks: 'Tulisan tangan dan singkatan seperti "cbe rwt" dibaca, lalu Anda periksa.' },
  { ikon: Microphone, judul: 'Ucapkan', teks: '"Cabe setengah kilo tiga lima ribu" langsung jadi baris belanja.' },
  { ikon: ChatText, judul: 'Ketik', teks: 'Satu bahan per baris, boleh pakai rb, goceng, ceban.' },
];

export function Beranda() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <h1 className="text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">Harga cabai naik. Masih untungkah ayam geprek Anda?</h1>
          <p className="mt-4 max-w-xl text-lg text-redup">
            Dapur Untung menghitung modal setiap porsi dari nota belanja yang biasa Anda simpan, lalu memberi tahu menu mana yang untungnya menipis dan berapa harga yang aman.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Tombol to="/daftar" className="px-6">
              Hitung modal menu saya
            </Tombol>
            <Tombol to="/masuk" varian="garis">
              Sudah punya akun
            </Tombol>
          </div>
        </div>
        <ContohNota />
      </section>

      <section className="border-y border-garis bg-kartu">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold">Catat belanja dengan cara yang paling mudah</h2>
          <p className="mt-2 max-w-2xl text-redup">Tidak perlu mengetik tabel. Setiap hasil bacaan bisa diperiksa dan dibetulkan sebelum disimpan.</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {CARA_CATAT.map(({ ikon: Ikon, judul, teks }) => (
              <li key={judul} className="rounded-2xl bg-dasar p-5">
                <Ikon size={28} className="text-teal" aria-hidden />
                <p className="mt-3 font-semibold">{judul}</p>
                <p className="mt-1 text-sm text-redup">{teks}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold">Hitungannya terbuka</h2>
          <p className="mt-2 text-redup">Anda bisa melihat dari mana setiap rupiah modal berasal.</p>
        </div>
        <dl className="grid gap-4 lg:col-span-3">
          <div className="rounded-2xl border border-garis bg-kartu p-5">
            <dt className="font-semibold">Modal per porsi</dt>
            <dd className="mt-1 text-sm text-redup">Takaran tiap bahan dikali harga belanja terakhir Anda, ditambah bagian gas, listrik, dan kemasan. Takaran seperti 2 sdm atau 1 siung diubah ke gram.</dd>
          </div>
          <div className="rounded-2xl border border-garis bg-kartu p-5">
            <dt className="font-semibold">Harga aman</dt>
            <dd className="mt-1 text-sm text-redup">Harga jual terendah yang masih memenuhi target untung Anda, dibulatkan ke Rp500.</dd>
          </div>
          <div className="rounded-2xl border border-garis bg-kartu p-5">
            <dt className="font-semibold">Dibanding pasar daerah</dt>
            <dd className="mt-1 text-sm text-redup">Harga belanja Anda dibandingkan dengan harga pasar di kota Anda, supaya salah baca atau harga terlalu mahal ketahuan.</dd>
          </div>
        </dl>
      </section>

      <section className="bg-teal text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2">
          <h2 className="text-2xl font-bold">AI membaca, kode yang menghitung</h2>
          <p className="text-white/90">
            AI dipakai untuk membaca nota, memahami ucapan, menyusun resep dari cerita, dan merangkai penjelasan. Semua angka modal, untung, dan harga dihitung dengan rumus tetap. Kalimat AI yang memuat angka di luar hasil hitungan dibuang dan diganti penjelasan baku.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold">Mulai dari menu yang paling sering terjual</h2>
        <p className="mt-2 max-w-xl text-redup">Daftar, jawab beberapa pertanyaan tentang usaha, lalu ceritakan satu menu. Modalnya langsung terlihat.</p>
        <Tombol to="/daftar" className="mt-5 px-6">
          Daftar
        </Tombol>
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
    <Halaman judul="Tentang Dapur Untung">
      <p>Banyak warung menentukan harga jual dengan perkiraan, lalu tidak sadar untungnya menipis ketika harga bahan naik. Dapur Untung dibuat untuk menjawab satu pertanyaan: berapa modal satu porsi hari ini, dan apakah harga jual masih aman.</p>
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
        <li>Data resep dan belanja hanya terlihat oleh akun Anda. Dapur Untung tidak memakainya untuk melatih model.</li>
        <li>Harga pasar berasal dari data publik PIHPS Bank Indonesia, diambil secukupnya (satu wilayah paling sering sekali dalam beberapa jam) dan selalu disebut sumbernya. Aplikasi tidak mengambil data toko, marketplace, atau aplikasi pesan antar tanpa izin.</li>
        <li>Semua hasil AI bisa diperiksa dan diubah sebelum dipakai.</li>
      </ul>
    </Halaman>
  );
}

export function Privasi() {
  return (
    <Halaman judul="Kebijakan privasi">
      <p>Halaman ini menjelaskan data yang disimpan Dapur Untung dan cara memakainya.</p>
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
      <p>Dapur Untung adalah alat bantu menghitung. Keputusan harga jual tetap di tangan pemilik usaha.</p>
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
