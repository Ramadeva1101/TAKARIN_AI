import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ChartBar, ForkKnife, Receipt, Basket, Tag, Gear, Plus, SignOut } from '@phosphor-icons/react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';

const MENU = [
  { to: '/', label: 'Ringkasan', ikon: ChartBar, end: true },
  { to: '/produk', label: 'Produk', ikon: ForkKnife },
  { to: '/belanja', label: 'Belanja', ikon: Receipt },
  { to: '/bahan', label: 'Bahan baku', ikon: Basket },
  { to: '/promo', label: 'Promo', ikon: Tag },
  { to: '/pengaturan', label: 'Pengaturan', ikon: Gear },
];

const HP = [MENU[0], MENU[1], null, MENU[3], MENU[4]];

function ModeAi() {
  const [mode, setMode] = useState(null);
  useEffect(() => {
    api('/health').then((r) => setMode(r.ai_mode)).catch(() => {});
  }, []);
  if (mode !== 'fixture') return null;
  return (
    <p className="bg-waspada-muda px-4 py-2 text-center text-xs text-waspada">
      Mode contoh: hasil baca nota dan suara memakai data contoh, bukan AI sungguhan. Isi kunci API di server/.env lalu set AI_MODE=live.
    </p>
  );
}

export default function Layout() {
  const { user, usaha, keluar } = useAuth();
  return (
    <div className="min-h-dvh lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-garis bg-kartu p-4 lg:flex lg:sticky lg:top-0 lg:h-dvh">
        <div className="mb-6 px-2">
          <p className="text-lg font-bold">Dapur Untung</p>
          <p className="truncate text-sm text-redup">{usaha?.nama}</p>
        </div>
        <NavLink
          to="/belanja/baru"
          className="mb-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal px-4 text-sm font-semibold text-white hover:bg-teal-tua"
        >
          <Plus size={18} weight="bold" aria-hidden /> Catat belanja
        </NavLink>
        <nav aria-label="Menu utama" className="flex flex-col gap-1">
          {MENU.map(({ to, label, ikon: Ikon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${isActive ? 'bg-lime text-lime-tua' : 'text-redup hover:bg-dasar hover:text-tinta'}`
              }
            >
              <Ikon size={20} aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-garis pt-4">
          <p className="truncate px-2 text-sm font-medium">{user?.nama}</p>
          <button onClick={keluar} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-sm text-redup hover:bg-dasar">
            <SignOut size={20} aria-hidden /> Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <ModeAi />
        <div className="flex items-center justify-between border-b border-garis bg-kartu px-4 py-2 lg:hidden">
          <div className="min-w-0">
            <p className="font-bold">Dapur Untung</p>
            <p className="truncate text-xs text-redup">{usaha?.nama}</p>
          </div>
          <NavLink to="/pengaturan" aria-label="Pengaturan" className="flex size-11 items-center justify-center rounded-xl text-redup hover:bg-dasar">
            <Gear size={22} aria-hidden />
          </NavLink>
        </div>
        <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Menu bawah"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-garis bg-kartu pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {HP.map((m) =>
          m ? (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-teal' : 'text-redup'}`}
            >
              <m.ikon size={22} aria-hidden /> {m.label === 'Bahan baku' ? 'Bahan' : m.label}
            </NavLink>
          ) : (
            <NavLink key="baru" to="/belanja/baru" className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-teal">
              <span className="flex size-9 items-center justify-center rounded-full bg-teal text-white">
                <Plus size={20} weight="bold" aria-hidden />
              </span>
              Belanja
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}
