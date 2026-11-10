import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Field, Tombol } from '../components/ui.jsx';

export default function Masuk({ mode }) {
  const { masuk } = useAuth();
  const daftar = mode === 'daftar';
  const [form, setForm] = useState({ nama: '', email: '', password: '' });
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
      setGalat(err.data?.detail?.[0]?.pesan || err.message);
      // detail[0] berisi pesan zod paling spesifik, mis. "Password minimal 8 karakter"
      setKirim(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden flex-col justify-end bg-teal p-12 text-white lg:flex">
        <p className="max-w-md text-3xl font-bold leading-tight">Tahu modal tiap porsi, dari nota belanja yang biasa Anda simpan.</p>
        <p className="mt-4 max-w-md text-white/80">Foto nota atau ucapkan belanjaan. Modal dan untung setiap menu ikut diperbarui.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-10">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <p className="mb-6 text-lg font-bold text-teal">Dapur Untung</p>
          <h1 className="text-2xl font-bold">{daftar ? 'Buat akun' : 'Masuk'}</h1>
          <p className="mt-1 mb-6 text-sm text-redup">{daftar ? 'Satu akun untuk satu usaha.' : 'Lanjutkan hitungan usaha Anda.'}</p>
          <div className="flex flex-col gap-4">
            {daftar && <Field label="Nama Anda" value={form.nama} onChange={ubah('nama')} autoComplete="name" required />}
            <Field label="Email" type="email" value={form.email} onChange={ubah('email')} autoComplete="email" required />
            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={ubah('password')}
              autoComplete={daftar ? 'new-password' : 'current-password'}
              hint={daftar ? 'Minimal 8 karakter' : undefined}
              required
            />
          </div>
          {galat && (
            <p role="alert" className="mt-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
              {galat}
            </p>
          )}
          <Tombol type="submit" className="mt-6 w-full" disabled={kirim}>
            {kirim ? 'Memproses' : daftar ? 'Buat akun' : 'Masuk'}
          </Tombol>
          <p className="mt-6 text-sm text-redup">
            {daftar ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <Link className="inline-block py-2 font-semibold text-teal" to={daftar ? '/masuk' : '/daftar'}>
              {daftar ? 'Masuk' : 'Daftar'}
            </Link>
          </p>
          {!daftar && <p className="text-xs text-redup">Akun demo: demo@dapur.id / demo12345 (setelah npm run seed)</p>}
        </form>
      </div>
    </div>
  );
}
