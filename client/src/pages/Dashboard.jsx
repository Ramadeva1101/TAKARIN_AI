import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingCart, Camera, Microphone, TextT, PencilSimple, ArrowUpRight } from '@phosphor-icons/react';
import { useApi } from '../lib/hooks.js';
import { useAuth } from '../lib/auth.jsx';
import { api, persen, pesanGalat, rupiah, tanggal } from '../lib/api.js';
import { Galat, Kartu, Muat, Tombol } from '../components/ui.jsx';
import Garis from '../components/Garis.jsx';
import { Segmen } from '../components/Grafik.jsx';
import { Perubahan } from './Pasar.jsx';

const SUMBER = { foto: [Camera, 'Foto nota'], suara: [Microphone, 'Suara'], teks: [TextT, 'Ketik'], manual: [PencilSimple, 'Manual'] };

const WARNA_STATUS = {
  aman: ['Sesuai target', '#1d59bb'],
  waspada: ['Di bawah target', '#febd19'],
  rugi: ['Rugi', '#c0261a'],
  belum_lengkap: ['Belum lengkap', '#c9d3e3'],
};

// Satu kalimat dari AI tentang hal terpenting hari ini.
function TeksCatatan({ catatan, cadangan }) {
  if (!catatan.data) return <span className={catatan.loading ? 'opacity-70' : ''}>{cadangan}</span>;
  return (
    <>
      {catatan.data.teks}
      {catatan.data.sumber === 'ai' && <span className="ml-1.5 rounded-full bg-biru-muda px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-biru">Catatan AI</span>}
    </>
  );
}

// Kartu angka di baris atas. Kartu pertama berwarna penuh sebagai angka utama.
function Kpi({ label, nilai, ket, to, utama = false }) {
  const cls = utama ? 'bg-biru text-white shadow-[0_14px_30px_rgb(29_89_187/0.28)]' : 'border border-garis bg-kartu shadow-kartu hover:border-biru/40';
  const isi = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className={`text-sm font-medium ${utama ? 'text-white/85' : 'text-redup'}`}>{label}</span>
        {to && <ArrowUpRight size={16} weight="bold" className={utama ? 'text-white/70' : 'text-redup'} aria-hidden />}
      </span>
      <span className="font-judul angka mt-3 block truncate text-[26px] leading-none font-bold">{nilai}</span>
      <span className={`mt-2 block truncate text-xs ${utama ? 'text-white/80' : 'text-redup'}`}>{ket}</span>
    </>
  );
  return to ? (
    <Link to={to} className={`block min-w-0 rounded-[20px] p-4 transition ${cls}`}>
      {isi}
    </Link>
  ) : (
    <div className={`min-w-0 rounded-[20px] p-4 ${cls}`}>{isi}</div>
  );
}

// Grafik batang untung per menu dengan sumbu persen dan garis target. Batang terpilih berwarna biru.
function GrafikUntung({ produk, target }) {
  const lengkap = produk.filter((p) => p.lengkap);
  const [pilih, setPilih] = useState(() => [...lengkap].sort((a, b) => a.margin - b.margin)[0]?.id);
  const p = lengkap.find((x) => x.id === pilih) || lengkap[0];
  const skala = Math.ceil(Math.max(target * 1.25, ...lengkap.map((x) => x.margin)) * 5) / 5; // dibulatkan ke 20%
  const garis = [1, 0.75, 0.5, 0.25, 0].map((t) => t * skala);
  const posisi = (m) => `${(Math.max(0, m) / skala) * 100}%`;

  return (
    <Kartu className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Untung per menu</h2>
          <p className="text-sm text-redup">Pilih batang untuk melihat rinciannya</p>
        </div>
        {p && (
          <div className="text-right">
            <p className="font-judul angka text-[26px] leading-none font-bold">{persen(p.margin)}</p>
            <p className="mt-1 text-xs text-redup">
              {p.nama} · <span className={p.status === 'aman' ? 'text-aman' : 'text-waspada'}>{p.status === 'aman' ? 'sesuai target' : 'di bawah target'}</span>
            </p>
          </div>
        )}
      </div>

      {lengkap.length ? (
        <div className="mt-5 grid grid-cols-[2.5rem_1fr] gap-2">
          <div className="angka relative h-48 text-right text-[11px] text-redup" aria-hidden>
            {garis.map((g) => (
              <span key={g} className="absolute right-0 translate-y-1/2" style={{ bottom: posisi(g) }}>
                {Math.round(g * 100)}%
              </span>
            ))}
          </div>
          <div className="min-w-0">
            <div className="relative h-48">
              {garis.map((g) => (
                <span key={g} className="absolute inset-x-0 border-t border-garis" style={{ bottom: posisi(g) }} aria-hidden />
              ))}
              <span className="absolute inset-x-0 z-10 border-t-2 border-dashed border-kuning" style={{ bottom: posisi(target) }} aria-hidden />
              <div className="absolute inset-0 flex items-end justify-around gap-2">
                {lengkap.map((m) => {
                  const aktif = m.id === p?.id;
                  const warna = aktif ? 'bg-biru' : m.status === 'aman' ? 'bg-[#d6e0ee] group-hover:bg-[#c2d1e6]' : 'bg-kuning-muda ring-1 ring-inset ring-kuning group-hover:bg-[#fde98a]';
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={aktif}
                      aria-label={`${m.nama}, untung ${persen(m.margin)}`}
                      onClick={() => setPilih(m.id)}
                      className="group relative flex h-full w-full max-w-28 items-end justify-center outline-none focus-visible:ring-2 focus-visible:ring-biru"
                    >
                      <span className={`block w-full max-w-12 rounded-t-lg transition-colors ${warna}`} style={{ height: posisi(m.margin) }} />
                      {aktif && (
                        <span className="angka absolute z-20 mb-1.5 rounded-md bg-tinta px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ bottom: posisi(m.margin) }}>
                          {persen(m.margin)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex justify-around gap-2" aria-hidden>
              {lengkap.map((m) => (
                <span key={m.id} className={`w-full max-w-28 truncate text-center text-xs ${m.id === p?.id ? 'font-semibold text-tinta' : 'text-redup'}`}>
                  {m.nama}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-redup">Lengkapi harga bahan menu supaya untungnya bisa dihitung.</p>
      )}

      {p && (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-garis pt-3 text-sm">
          <span className="angka">
            <span className="text-redup">Harga jual </span>
            <b>{rupiah(p.harga_jual)}</b>
          </span>
          <span className="angka">
            <span className="text-redup">Modal/porsi </span>
            <b>{rupiah(p.hpp)}</b>
          </span>
          <span className="angka">
            <span className="text-redup">Untung/porsi </span>
            <b>{rupiah(p.harga_jual - p.hpp)}</b>
          </span>
          <span className="flex items-center gap-3 text-xs text-redup sm:ml-auto">
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-kuning" aria-hidden /> Target {persen(target, 0)}
            </span>
            <Link to={`/produk/${p.id}`} className="inline-flex min-h-11 items-center font-semibold text-biru hover:underline">
              Rincian
            </Link>
          </span>
        </div>
      )}
    </Kartu>
  );
}

// Lingkaran status semua menu.
function Donat({ jumlah }) {
  const total = Object.values(jumlah).reduce((a, b) => a + b, 0) || 1;
  const r = 42;
  const keliling = 2 * Math.PI * r;
  let jalan = 0;
  return (
    <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-dasar)" strokeWidth="12" />
      {Object.entries(jumlah)
        .filter(([, n]) => n)
        .map(([s, n]) => {
          const panjang = (n / total) * keliling;
          const el = <circle key={s} cx="50" cy="50" r={r} fill="none" stroke={WARNA_STATUS[s][1]} strokeWidth="12" strokeDasharray={`${Math.max(0, panjang - 2)} ${keliling}`} strokeDashoffset={-jalan} />;
          jalan += panjang;
          return el;
        })}
    </svg>
  );
}

// Kartu kanan: status menu, catatan AI, dan saran harga yang bisa langsung dipakai.
function StatusMenu({ kpi, perlu, catatan, sesudah }) {
  const [proses, setProses] = useState(null);
  const [galat, setGalat] = useState(null);
  const jumlah = { aman: kpi.aman, waspada: kpi.waspada, rugi: kpi.rugi, belum_lengkap: kpi.belum_lengkap };
  const terapkan = async (p) => {
    setProses(p.id);
    setGalat(null);
    try {
      await api(`/produk/${p.id}`, { method: 'PUT', body: { harga_jual: p.opsi_utama.harga_jual } });
      await Promise.all([sesudah(), catatan.muat()]);
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setProses(null);
    }
  };

  return (
    <Kartu className="flex flex-col">
      <h2 className="text-lg font-semibold">Status menu</h2>
      <div className="mt-3 flex items-center gap-5">
        <div className="relative">
          <Donat jumlah={jumlah} />
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-judul angka text-2xl leading-none font-bold">{kpi.jumlah_produk}</span>
            <span className="text-[11px] text-redup">menu</span>
          </span>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm">
          {Object.entries(jumlah)
            .filter(([s, n]) => n || s === 'aman')
            .map(([s, n]) => (
              <li key={s} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: WARNA_STATUS[s][1] }} aria-hidden />
                <span className="text-redup">{WARNA_STATUS[s][0]}</span>
                <b className="angka">{n}</b>
              </li>
            ))}
        </ul>
      </div>

      <p className="mt-4 rounded-2xl bg-dasar px-3 py-2.5 text-sm">
        <TeksCatatan catatan={catatan} cadangan={perlu.length ? 'Pilih harga baru di bawah untuk mengembalikan untung.' : 'Semua menu sesuai target hari ini.'} />
      </p>

      {perlu.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-garis">
          {perlu.slice(0, 3).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="min-w-0">
                <Link to={`/produk/${p.id}`} className="block truncate font-semibold hover:text-biru">
                  {p.nama}
                </Link>
                <span className="angka text-xs text-redup">
                  Untung {persen(p.margin)}
                  {p.opsi_utama?.jenis === 'naik_harga' && ` jadi ${persen(p.opsi_utama.margin)}`}
                </span>
              </span>
              {p.opsi_utama?.jenis === 'naik_harga' && (
                <button
                  type="button"
                  onClick={() => terapkan(p)}
                  disabled={proses === p.id}
                  className="angka min-h-11 rounded-full bg-kuning px-4 text-sm font-semibold text-tinta hover:bg-[#f2b000] disabled:opacity-60"
                >
                  {proses === p.id ? 'Menyimpan' : `Pakai ${rupiah(p.opsi_utama.harga_jual)}`}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {galat && <p className="mt-2 text-sm font-semibold text-rugi">{galat}</p>}
      <div className="mt-auto flex flex-wrap gap-2 border-t border-garis pt-3">
        <Tombol varian="lembut" to="/produk" className="flex-1">
          Semua menu
        </Tombol>
        <Tombol varian="garis" to="/promo" className="flex-1">
          Buat promo
        </Tombol>
      </div>
    </Kartu>
  );
}

function HargaPasar({ data }) {
  const [periode, setPeriode] = useState('minggu');
  const kunci = periode === 'minggu' ? 'perubahan_mingguan' : 'perubahan_harian';
  return (
    <Kartu>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Harga pasar bahan Anda</h2>
        <Segmen
          label="Periode perubahan harga"
          pilihan={[
            ['minggu', 'Seminggu'],
            ['hari', 'Data sebelumnya'],
          ]}
          nilai={periode}
          ubah={setPeriode}
        />
      </div>
      {data.length ? (
        <ul className="divide-y divide-garis">
          {data.map((d) => (
            <li key={d.komoditas}>
              <Link to="/pasar" state={{ komoditas: d.komoditas }} className="grid grid-cols-[1fr_auto] items-center gap-3 py-2.5 hover:text-biru sm:grid-cols-[1fr_6rem_auto]">
                <span className="min-w-0">
                  <span className="block truncate font-medium capitalize">{d.komoditas}</span>
                  <span className="block truncate text-xs text-redup">{d.menu.length ? `Dipakai di ${d.menu.map((m) => m.nama).join(', ')}` : d.wilayah}</span>
                </span>
                <span className="hidden sm:block">
                  <Garis data={d.riwayat} label={`Tren harga ${d.komoditas} di ${d.wilayah}`} />
                </span>
                <span className="angka text-right text-sm">
                  <span className="block font-semibold">{`${rupiah(d.harga)}/${d.satuan}`}</span>
                  <Perubahan nilai={d[kunci]} ket="" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-redup">Belum ada harga pasar untuk bahan Anda.</p>
      )}
      {data.length > 0 && <p className="mt-2 text-xs text-redup">PIHPS Bank Indonesia, {data[0].wilayah}.</p>}
    </Kartu>
  );
}

function BelanjaTerakhir({ daftar }) {
  return (
    <Kartu>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Belanja terakhir</h2>
        {daftar.length > 0 && (
          <Link to="/belanja" className="inline-flex min-h-11 items-center text-sm font-semibold text-biru">
            Semua belanja
          </Link>
        )}
      </div>
      {daftar.length ? (
        <ul className="divide-y divide-garis">
          {daftar.map((n) => {
            const [Ikon, cara] = SUMBER[n.sumber] || SUMBER.manual;
            return (
              <li key={n.id}>
                <Link to={`/belanja/${n.id}`} className="flex min-h-14 items-center gap-3 py-2 hover:text-biru">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-biru-muda text-biru" aria-hidden>
                    <Ikon size={16} weight="bold" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{n.nama_toko || 'Tanpa nama toko'}</span>
                    <span className="block text-xs text-redup">
                      {tanggal(n.tanggal)} · {cara}
                    </span>
                  </span>
                  <span className="angka shrink-0 text-right text-sm font-semibold">
                    {rupiah(n.total)}
                    {n.status === 'draf' && <span className="block text-xs font-semibold text-waspada">Belum dicek</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-garis px-4 py-8 text-center">
          <ShoppingCart size={40} weight="duotone" className="text-biru" aria-hidden />
          <p className="mt-2 font-semibold">Belum ada belanja</p>
          <p className="mt-1 max-w-sm text-sm text-redup">Catat belanja bahan supaya modal menu dihitung dari harga yang Anda bayar.</p>
          <Tombol to="/belanja/baru" className="mt-4">
            Catat belanja
          </Tombol>
        </div>
      )}
    </Kartu>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, muat } = useApi('/dashboard');
  const catatan = useApi('/dashboard/catatan');
  if (loading && !data) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;
  const { usaha, kpi, produk, perlu_tindakan, bahan_naik, pasar_ringkas, belanja_terakhir } = data;
  const terbaik = produk.filter((p) => p.lengkap).sort((a, b) => b.margin - a.margin)[0];
  const naik = bahan_naik[0];
  const diBawah = kpi.waspada + kpi.rugi;

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-[28px]">Halo, {user?.nama || 'Pebisnis'}</h1>
          <p className="mt-1 text-sm text-redup">
            {usaha.nama}
            {usaha.kota ? `, ${usaha.kota}` : ''} · {tanggal(new Date().toISOString())}
          </p>
        </div>
        <Tombol to="/belanja/baru">
          <Plus size={16} weight="bold" aria-hidden /> Catat belanja
        </Tombol>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi utama label="Rata-rata untung" nilai={persen(kpi.rata_margin)} ket={`Target ${persen(usaha.target_margin, 0)} · ${diBawah ? `${diBawah} menu di bawah target` : 'semua menu aman'}`} />
        <Kpi label="Menu paling untung" nilai={terbaik?.nama ?? '–'} ket={terbaik ? `Untung ${persen(terbaik.margin)}` : 'Belum ada hitungan lengkap'} to={terbaik ? `/produk/${terbaik.id}` : undefined} />
        <Kpi label="Bahan naik tertinggi" nilai={<span className="capitalize">{naik?.nama ?? '–'}</span>} ket={naik ? `Naik ${persen(naik.perubahan)} dari belanja sebelumnya` : 'Harga belanja stabil'} to={naik ? `/bahan/${naik.id}` : undefined} />
        <Kpi label="Belanja bulan ini" nilai={rupiah(kpi.belanja_bulan_ini)} ket={`${kpi.nota_bulan_ini} catatan belanja`} to="/belanja" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <GrafikUntung produk={produk} target={usaha.target_margin} />
        <StatusMenu kpi={kpi} perlu={perlu_tindakan} catatan={catatan} sesudah={muat} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <HargaPasar data={pasar_ringkas} />
        <BelanjaTerakhir daftar={belanja_terakhir} />
      </div>
    </>
  );
}
