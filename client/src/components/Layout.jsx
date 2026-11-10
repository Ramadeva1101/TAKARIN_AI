import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Merek } from './ui.jsx';
import { ChartBar, ForkKnife, Receipt, Basket, Tag, Gear, Plus, SignOut, Storefront, DotsThree, X, Question } from '@phosphor-icons/react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';

const MENU = [
  { to: '/', label: 'Ringkasan', ikon: ChartBar, end: true },
  { to: '/produk', label: 'Menu', ikon: ForkKnife },
  { to: '/pasar', label: 'Harga pasar', pendek: 'Pasar', ikon: Storefront },
  { to: '/bahan', label: 'Bahan baku', ikon: Basket },
  { to: '/belanja', label: 'Belanja', ikon: Receipt },
  { to: '/promo', label: 'Promo', ikon: Tag },
  { to: '/pengaturan', label: 'Pengaturan', ikon: Gear },
];
// Di HP, menu selain empat utama ada di lembar "Lainnya", termasuk bantuan.
const LAINNYA = [...MENU.slice(3), { to: '/panduan', label: 'Bantuan', ikon: Question }];

function ModeAi() {
  const [mode, setMode] = useState(null);
  useEffect(() => {
    api('/health').then((r) => setMode(r.ai_mode)).catch(() => {});
  }, []);
  if (mode !== 'fixture') return null;
  return (
    <p className="bg-waspada-muda px-4 py-2 text-center text-xs text-waspada lg:mb-4 lg:rounded-2xl">
      Mode contoh: hasil baca nota, suara, dan cerita memakai data contoh, bukan hasil AI sungguhan.
    </p>
  );
}

const kelasNav = ({ isActive }) =>
  `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm ${isActive ? 'bg-biru-muda font-semibold text-biru-tua' : 'font-medium text-redup hover:bg-dasar hover:text-tinta'}`;

export default function Layout() {
  const { user, usaha, keluar } = useAuth();
  const [lainnya, setLainnya] = useState(false);
  const lokasi = useLocation();
  useEffect(() => {
    setLainnya(false);
  }, [lokasi.pathname]);
  useEffect(() => {
    if (!lainnya) return;
    const tutup = (e) => e.key === 'Escape' && setLainnya(false);
    window.addEventListener('keydown', tutup);
    return () => window.removeEventListener('keydown', tutup);
  }, [lainnya]);
  const lainnyaAktif = LAINNYA.some((m) => lokasi.pathname.startsWith(m.to));

  return (
    <div className="latar-merek min-h-dvh lg:flex lg:gap-6 lg:p-4">
      <aside className="hidden w-60 shrink-0 flex-col rounded-[24px] border border-garis bg-kartu p-4 shadow-kartu lg:sticky lg:top-4 lg:flex lg:h-[calc(100dvh-2rem)]">
        <Link to="/" className="mb-6 inline-flex min-h-11 items-center px-2">
          <Merek className="text-xl" />
        </Link>
        <NavLink to="/belanja/baru" className="mb-5 inline-flex min-h-11 items-center justify-center gap-2 tombol-merek rounded-full px-4 text-sm font-semibold text-white">
          <Plus size={18} weight="bold" aria-hidden /> Catat belanja
        </NavLink>
        <nav aria-label="Menu utama" className="flex flex-col gap-1">
          {MENU.map(({ to, label, ikon: Ikon, end }) => (
            <NavLink key={to} to={to} end={end} className={kelasNav}>
              <Ikon size={20} weight="duotone" aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-kuning/40 bg-gradient-to-br from-kuning-muda to-white p-4">
          <p className="text-sm font-semibold">Butuh bantuan?</p>
          <p className="mt-1 text-xs text-redup">Cara menghitung modal, takaran, dan harga pasar.</p>
          <Link to="/panduan" className="mt-2 inline-flex min-h-11 items-center rounded-full border border-garis bg-kartu px-4 text-xs font-semibold text-biru hover:border-biru/40">
            Pusat bantuan
          </Link>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 px-2">
          <p className="min-w-0 truncate text-sm font-medium">{user?.nama}</p>
          <button onClick={keluar} aria-label="Keluar" className="flex size-11 items-center justify-center rounded-xl text-redup hover:bg-dasar hover:text-tinta">
            <SignOut size={20} aria-hidden />
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <ModeAi />
        <div className="flex items-center justify-between gap-3 border-b border-garis bg-kartu px-4 py-2 lg:hidden">
          <Link to="/" className="inline-flex min-h-11 items-center">
            <Merek className="text-lg" />
          </Link>
          <p className="truncate rounded-full border border-garis px-3 py-1.5 text-xs font-medium">{usaha?.nama}</p>
        </div>
        <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:px-2 lg:pt-4 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {lainnya && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <button aria-label="Tutup menu" className="absolute inset-0 bg-tinta/30" onClick={() => setLainnya(false)} />
          <nav id="menu-lainnya" aria-label="Menu lainnya" className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-kartu p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Menu lainnya</p>
              <button aria-label="Tutup" onClick={() => setLainnya(false)} className="flex size-11 items-center justify-center rounded-xl text-redup hover:bg-dasar">
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {LAINNYA.map(({ to, label, ikon: Ikon }) => (
                <NavLink key={to} to={to} className={kelasNav}>
                  <Ikon size={20} aria-hidden /> {label}
                </NavLink>
              ))}
              <button onClick={keluar} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-redup hover:bg-dasar">
                <SignOut size={20} aria-hidden /> Keluar
              </button>
            </div>
          </nav>
        </div>
      )}

      <nav aria-label="Menu bawah" className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-garis bg-kartu pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[MENU[0], MENU[1]].map((m) => (
          <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-biru' : 'text-redup'}`}>
            <m.ikon size={22} aria-hidden /> {m.label}
          </NavLink>
        ))}
        <NavLink to="/belanja/baru" className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-biru">
          <span className="tombol-merek flex size-9 items-center justify-center rounded-full text-white">
            <Plus size={20} weight="bold" aria-hidden />
          </span>
          Belanja
        </NavLink>
        <NavLink to="/pasar" className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-biru' : 'text-redup'}`}>
          <Storefront size={22} aria-hidden /> Pasar
        </NavLink>
        <button
          aria-expanded={lainnya}
          aria-controls="menu-lainnya"
          onClick={() => setLainnya(true)}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${lainnyaAktif ? 'text-biru' : 'text-redup'}`}
        >
          <DotsThree size={22} weight="bold" aria-hidden /> Lainnya
        </button>
      </nav>
    </div>
  );
}
