import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeSlash, Receipt, TrendUp } from '@phosphor-icons/react';
import { useAuth } from '../lib/auth.jsx';
import { Field, Merek, Tombol } from '../components/ui.jsx';

function Panel() {
  return (
    <div className="relative hidden flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-biru to-biru-tua p-10 text-white lg:flex">
      <div className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-biru-terang/25" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-kuning/15" aria-hidden />
      <Merek terang className="relative text-lg" />

      <div className="relative mx-auto mt-14 w-full max-w-xl flex-1" aria-hidden>
        <img
          src="/tangkapan-ringkasan.webp"
          width="1490"
          height="716"
          alt=""
          className="block h-auto w-full rounded-[16px] border-4 border-white/90 shadow-[0_30px_60px_rgb(0_0_0/0.28)]"
        />
        <div className="absolute -top-6 -left-8 flex w-56 items-center gap-3 rounded-2xl bg-white p-3 text-tinta shadow-[0_18px_40px_rgb(0_0_0/0.2)]">
          <Receipt size={26} weight="duotone" className="shrink-0 text-biru" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Nota terbaca</p>
            <p className="truncate text-xs text-redup">6 baris dari foto, 1 perlu dicek</p>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 flex w-60 items-center gap-3 rounded-2xl bg-white p-3 text-tinta shadow-[0_18px_40px_rgb(0_0_0/0.2)]">
          <TrendUp size={26} weight="duotone" className="shrink-0 text-rugi" />
          <div className="min-w-0">
            <p className="angka text-sm font-semibold">Cabai rawit naik 10,6%</p>
            <p className="truncate text-xs text-redup">PIHPS Bank Indonesia, Denpasar</p>
          </div>
        </div>
      </div>

      <div className="relative mt-16">
        <p className="max-w-md text-[28px] leading-tight font-bold">Modal tiap porsi, dihitung dari nota belanja Anda.</p>
        <p className="mt-3 max-w-md text-white/80">Foto nota, ucapkan, atau ketik belanjaan. Untung setiap menu diperbarui dan dibandingkan dengan harga pasar di kota Anda.</p>
        <p className="mt-4 text-xs text-white/60">Tangkapan layar halaman Ringkasan dengan akun demo.</p>
      </div>
    </div>
  );
}

export default function Masuk({ mode }) {
  const { masuk } = useAuth();
  const daftar = mode === 'daftar';
  const [form, setForm] = useState({ nama: '', email: '', password: '' });
  const [lihat, setLihat] = useState(false);
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState(null);
  const ubah = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setKirim(true);
    setGalat(null);
    try {
      await masuk(daftar ? '/auth/daftar' : '/auth/masuk', daftar ? form : { email: form.email, password: form.password });
    } catch (err) {
      // detail[0] berisi pesan zod paling spesifik, mis. "Password minimal 8 karakter"
      setGalat(err.data?.detail?.[0]?.pesan || err.message);
      setKirim(false);
    }
  };

  const tab = (to, teks, aktif) => (
    <Link to={to} aria-current={aktif ? 'page' : undefined} className={`flex min-h-10 flex-1 items-center justify-center rounded-full text-sm font-semibold transition-colors ${aktif ? 'bg-kartu text-tinta shadow-kartu' : 'text-redup hover:text-tinta'}`}>
      {teks}
    </Link>
  );

  return (
    <div className="grid min-h-dvh bg-kartu lg:grid-cols-[1.05fr_1fr] lg:p-4">
      <Panel />
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link to="/" className="inline-flex min-h-11 items-center self-start lg:hidden">
          <Merek className="text-xl" />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
          <h1 className="text-[28px] font-bold">{daftar ? 'Buat akun usaha' : 'Selamat datang kembali'}</h1>
          <p className="mt-1 text-sm text-redup">{daftar ? 'Satu akun untuk satu usaha. Setelah daftar, ada enam pertanyaan singkat tentang usaha Anda.' : 'Masuk untuk melihat modal dan untung menu hari ini.'}</p>

          <nav aria-label="Pilih masuk atau daftar" className="mt-6 flex rounded-full bg-dasar p-1 ring-1 ring-garis">
            {tab('/masuk', 'Masuk', !daftar)}
            {tab('/daftar', 'Daftar', daftar)}
          </nav>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
            {daftar && <Field label="Nama Anda" value={form.nama} onChange={ubah('nama')} autoComplete="name" placeholder="Contoh: Bu Sari" required />}
            <Field label="Email" type="email" value={form.email} onChange={ubah('email')} autoComplete="email" placeholder="nama@email.com" required />
            <Field label="Password" hint={daftar ? 'Minimal 8 karakter' : undefined}>
              {(id) => (
                <div className="relative">
                  <input
                    id={id}
                    type={lihat ? 'text' : 'password'}
                    value={form.password}
                    onChange={ubah('password')}
                    autoComplete={daftar ? 'new-password' : 'current-password'}
                    required
                    className="min-h-11 w-full rounded-xl border border-garis bg-kartu py-2 pr-12 pl-3 text-base outline-none focus:border-biru"
                  />
                  <button
                    type="button"
                    onClick={() => setLihat(!lihat)}
                    aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-redup hover:text-tinta"
                  >
                    {lihat ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              )}
            </Field>
            {galat && (
              <p role="alert" className="rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
                {galat}
              </p>
            )}
            <Tombol type="submit" varian="polos" className="mt-1 !min-h-12 w-full text-base" disabled={kirim}>
              {kirim ? 'Memproses' : daftar ? 'Buat akun' : 'Masuk'}
            </Tombol>
          </form>

          {!daftar && (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-kuning bg-kuning-muda/60 px-4 py-3 text-sm">
              <span>
                <b>Coba akun demo</b>
                <span className="block text-xs text-redup">Warung Bu Sari, Denpasar, dengan 4 menu</span>
              </span>
              <button
                type="button"
                onClick={() => setForm({ ...form, email: 'demo@dapur.id', password: 'demo12345' })}
                className="min-h-11 shrink-0 rounded-full bg-kuning px-4 font-semibold text-tinta hover:bg-[#f2b000]"
              >
                Isi otomatis
              </button>
            </div>
          )}
        </div>
        <footer className="mx-auto flex w-full max-w-sm flex-wrap items-center justify-between gap-2 text-xs text-redup">
          <span>© 2026 Takarin AI</span>
          <span className="flex gap-1">
            <Link to="/privasi" className="inline-flex min-h-11 items-center px-1 hover:text-tinta">
              Privasi
            </Link>
            <Link to="/syarat" className="inline-flex min-h-11 items-center px-1 hover:text-tinta">
              Syarat
            </Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
