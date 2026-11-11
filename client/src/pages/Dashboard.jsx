import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingCart, Camera, Microphone, TextT, PencilSimple } from '@phosphor-icons/react';
import { useApi } from '../lib/hooks.js';
import { useAuth } from '../lib/auth.jsx';
import { api, persen, pesanGalat, rupiah, tanggal } from '../lib/api.js';
import { Galat, Kartu, Muat, Pemutar, Tombol } from '../components/ui.jsx';
import { Segmen } from '../components/Grafik.jsx';
import { Mini } from '../components/Chart.jsx';
import { Perubahan } from './Pasar.jsx';

const SUMBER = { foto: [Camera, 'Foto nota'], suara: [Microphone, 'Ucapan'], teks: [TextT, 'Ketik'], manual: [PencilSimple, 'Isi tabel'] };

const WARNA_STATUS = {
  aman: ['Sesuai target', '#1d59bb'],
  waspada: ['Di bawah target', '#febd19'],
  rugi: ['Rugi', '#b83f2b'],
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

// Kartu angka di baris atas. Kartu untung memakai bilah yang sama dengan tabel di bawahnya: isi = untung, tanda tegak = target.
function Kpi({ label, nilai, ket, sudut, meter, to }) {
  const isi = (
    <>
      <span className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm text-redup">{label}</span>
        {sudut && <span className={`angka shrink-0 text-xs font-semibold ${sudut.nada === 'kuning' ? 'text-kuning-tua' : 'text-biru'}`}>{sudut.teks}</span>}
      </span>
      <span className="font-judul angka mt-2 block truncate pb-1 text-[28px] leading-snug font-bold">{nilai}</span>
      {meter && (
        <span className="relative mt-1 block h-1.5 rounded-full bg-dasar" aria-hidden>
          <span className={`absolute inset-y-0 left-0 rounded-full ${meter.nilai < meter.target ? 'bg-kuning' : 'bg-biru'}`} style={{ width: `${Math.min(1, Math.max(0, meter.nilai) / meter.skala) * 100}%` }} />
          <span className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-tinta/70" style={{ left: `${(meter.target / meter.skala) * 100}%` }} />
        </span>
      )}
      <span className="mt-auto block truncate pt-2 text-xs text-redup">{ket}</span>
    </>
  );
  const cls = 'flex min-w-0 flex-col rounded-[20px] border border-garis bg-kartu p-4';
  return to ? (
    <Link to={to} className={`${cls} transition-colors hover:border-biru/40`}>
      {isi}
    </Link>
  ) : (
    <div className={cls}>{isi}</div>
  );
}

// Untung tiap menu sebagai daftar. Bilah menunjukkan untung; tanda tegak menunjukkan target.
function TabelUntung({ produk, target }) {
  const [urut, setUrut] = useState('rendah');
  const lengkap = produk.filter((p) => p.lengkap).sort((a, b) => (urut === 'rendah' ? a.margin - b.margin : b.margin - a.margin));
  const belum = produk.filter((p) => !p.lengkap);
  const skala = Math.max(target * 1.5, ...lengkap.map((p) => p.margin), 0.01);
  const kolom = 'sm:grid-cols-[minmax(0,1.3fr)_5.5rem_5.5rem_5.5rem_minmax(9rem,1.2fr)]';

  return (
    <Kartu className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Untung per menu</h2>
          <p className="text-sm text-redup">Target untung {persen(target, 0)} dari harga jual</p>
        </div>
        <Segmen
          label="Urutkan menu"
          pilihan={[
            ['rendah', 'Untung terendah'],
            ['tinggi', 'Tertinggi'],
          ]}
          nilai={urut}
          ubah={setUrut}
        />
      </div>

      <div className={`mt-4 hidden gap-3 px-3 text-xs font-medium text-redup sm:grid ${kolom}`}>
        <span>Menu</span>
        <span className="text-right">Harga jual</span>
        <span className="text-right">Modal</span>
        <span className="text-right">Untung</span>
        <span>Untung dari harga jual</span>
      </div>
      <ul className="mt-1 flex flex-col">
        {lengkap.map((p) => {
          const kurang = p.status !== 'aman';
          return (
            <li key={p.id}>
              <Link to={`/produk/${p.id}`} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl px-3 py-3 transition-colors hover:bg-dasar ${kolom}`}>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{p.nama}</span>
                  <span className="angka block text-xs text-redup sm:hidden">
                    {rupiah(p.harga_jual)} · modal {rupiah(p.hpp)}
                  </span>
                </span>
                <span className="angka hidden text-right text-sm sm:block">{rupiah(p.harga_jual)}</span>
                <span className="angka hidden text-right text-sm sm:block">{rupiah(p.hpp)}</span>
                <span className="angka hidden text-right text-sm font-semibold sm:block">{rupiah(p.harga_jual - p.hpp)}</span>
                <span className="col-span-2 flex items-center gap-3 sm:col-span-1">
                  <span className="relative h-2 flex-1 rounded-full bg-dasar" aria-hidden>
                    <span className={`absolute inset-y-0 left-0 rounded-full ${kurang ? 'bg-kuning' : 'bg-biru'}`} style={{ width: `${(Math.max(0, p.margin) / skala) * 100}%` }} />
                    <span className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-tinta/70" style={{ left: `${(target / skala) * 100}%` }} />
                  </span>
                  <span className={`angka w-14 text-right text-sm font-semibold ${kurang ? 'text-waspada' : ''}`}>{persen(p.margin)}</span>
                </span>
              </Link>
            </li>
          );
        })}
        {belum.map((p) => (
          <li key={p.id}>
            <Link to={`/produk/${p.id}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-dasar">
              <span className="truncate font-semibold">{p.nama}</span>
              <span className="text-xs text-redup">Harga bahan belum lengkap</span>
            </Link>
          </li>
        ))}
      </ul>
      {!produk.length && <p className="mt-4 text-sm text-redup">Belum ada menu. Tambahkan menu pertama di halaman Produk.</p>}
      <p className="mt-2 flex items-center gap-2 px-3 text-xs text-redup">
        <span className="h-3 w-0.5 rounded-full bg-tinta/70" aria-hidden /> Tanda tegak = target {persen(target, 0)}. Bilah kuning berarti di bawah target.
      </p>
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
        <TeksCatatan catatan={catatan} cadangan={perlu.length ? 'Pilih harga baru di bawah untuk mengembalikan untung.' : kpi.belum_lengkap === kpi.jumlah_produk ? 'Lengkapi harga bahan dulu supaya untung menu bisa dinilai.' : 'Semua menu yang sudah dihitung sesuai target.'} />
      </p>

      {perlu.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {perlu.slice(0, 3).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-dasar px-3 py-2">
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
                  aria-busy={proses === p.id || undefined}
                  className="angka inline-flex min-h-11 items-center gap-1.5 rounded-full bg-kuning px-4 text-sm font-semibold text-tinta hover:bg-[#f2b000] disabled:opacity-60"
                >
                  {proses === p.id && <Pemutar size={14} />}
                  {proses === p.id ? 'Menyimpan' : `Pakai ${rupiah(p.opsi_utama.harga_jual)}`}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {galat && <p className="mt-2 text-sm font-semibold text-rugi">{galat}</p>}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
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
            ['hari', 'Dibanding data terakhir'],
          ]}
          nilai={periode}
          ubah={setPeriode}
        />
      </div>
      {data.length ? (
        <ul className="flex flex-col">
          {data.map((d) => (
            <li key={d.komoditas}>
              <Link to="/pasar" state={{ komoditas: d.komoditas }} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-dasar sm:grid-cols-[1fr_6rem_auto]">
                <span className="min-w-0">
                  <span className="block truncate font-medium capitalize">{d.komoditas}</span>
                  <span className="block truncate text-xs text-redup">{d.menu.length ? `Dipakai di ${d.menu.map((m) => m.nama).join(', ')}` : d.wilayah}</span>
                </span>
                <span className="hidden sm:block">
                  <Mini data={d.riwayat} label={`Tren harga ${d.komoditas} di ${d.wilayah}`} />
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
        <ul className="flex flex-col">
          {daftar.map((n) => {
            const [Ikon, cara] = SUMBER[n.sumber] || SUMBER.manual;
            return (
              <li key={n.id}>
                <Link to={`/belanja/${n.id}`} className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 hover:bg-dasar">
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

  // Akun baru tanpa menu: arahkan ke langkah pertama, bukan kartu angka kosong.
  if (!produk.length)
    return (
      <>
        <header className="mb-5">
          <h1 className="text-2xl font-bold sm:text-[28px]">Halo, {user?.nama || 'Pebisnis'}</h1>
          <p className="mt-1 text-sm text-redup">
            {usaha.nama}
            {usaha.kota ? `, ${usaha.kota}` : ''}
          </p>
        </header>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-garis bg-kartu p-6 sm:p-8">
            <h2 className="text-2xl font-bold">Tambahkan menu pertama</h2>
            <p className="mt-2 max-w-lg text-redup">Ceritakan menu dengan bahasa sehari-hari: nama, harga jual, dan bahan per porsi. AI menyusunnya menjadi resep, lalu modal per porsi langsung dihitung.</p>
            <Tombol to="/produk/baru" className="mt-6">
              <Plus size={16} weight="bold" aria-hidden /> Tambah menu
            </Tombol>
          </div>
          <Kartu>
            <h2 className="text-lg font-semibold">Setelah menu tersimpan</h2>
            <ol className="mt-3 flex flex-col gap-3 text-sm">
              {['Modal dan untung tiap porsi dihitung dari harga pasar daerah Anda.', 'Catat belanja dari foto nota, suara, atau ketik supaya modal memakai harga yang Anda bayar.', 'Menu yang untungnya di bawah target diberi saran harga.'].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="angka flex size-7 shrink-0 items-center justify-center rounded-full bg-biru-muda text-xs font-bold text-biru">{i + 1}</span>
                  <span className="pt-1">{t}</span>
                </li>
              ))}
            </ol>
          </Kartu>
        </section>
      </>
    );

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
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Rata-rata untung"
          nilai={persen(kpi.rata_margin)}
          sudut={diBawah ? { teks: `${diBawah} di bawah target`, nada: 'kuning' } : { teks: 'Semua sesuai target' }}
          meter={{ nilai: kpi.rata_margin, target: usaha.target_margin, skala: Math.max(usaha.target_margin * 1.5, kpi.rata_margin) }}
          ket={`Target ${persen(usaha.target_margin, 0)} dari harga jual`}
        />
        <Kpi
          label="Menu paling untung"
          nilai={terbaik?.nama ?? '–'}
          sudut={terbaik ? { teks: persen(terbaik.margin) } : undefined}
          meter={terbaik ? { nilai: terbaik.margin, target: usaha.target_margin, skala: Math.max(usaha.target_margin * 1.5, terbaik.margin) } : undefined}
          ket={terbaik ? 'Untung dari harga jual' : 'Belum ada hitungan lengkap'}
          to={terbaik ? `/produk/${terbaik.id}` : undefined}
        />
        <Kpi
          label="Bahan naik tertinggi"
          nilai={<span className="capitalize">{naik?.nama ?? '–'}</span>}
          sudut={naik ? { teks: `+${persen(naik.perubahan)}`, nada: 'kuning' } : undefined}
          ket={naik ? 'Dibanding belanja sebelumnya' : belanja_terakhir.length > 1 ? 'Tidak ada yang naik lebih dari 2%' : 'Butuh minimal 2 belanja untuk dibandingkan'}
          to={naik ? `/bahan/${naik.id}` : undefined}
        />
        <Kpi label="Belanja bulan ini" nilai={rupiah(kpi.belanja_bulan_ini)} sudut={{ teks: `${kpi.nota_bulan_ini} catatan` }} ket="Total semua catatan belanja" to="/belanja" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <TabelUntung produk={produk} target={usaha.target_margin} />
          <HargaPasar data={pasar_ringkas} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <StatusMenu kpi={kpi} perlu={perlu_tindakan} catatan={catatan} sesudah={muat} />
          <BelanjaTerakhir daftar={belanja_terakhir} />
        </div>
      </div>
    </>
  );
}
