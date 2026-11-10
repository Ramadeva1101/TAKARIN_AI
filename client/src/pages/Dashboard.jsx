import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingCart, Camera, Microphone, TextT, PencilSimple, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { useApi } from '../lib/hooks.js';
import { useAuth } from '../lib/auth.jsx';
import { api, persen, pesanGalat, rupiah, tanggal } from '../lib/api.js';
import { Chip, Galat, Kartu, Muat, Tombol } from '../components/ui.jsx';
import Garis from '../components/Garis.jsx';
import { BatangMenu, Segmen } from '../components/Grafik.jsx';
import { Perubahan } from './Pasar.jsx';

const SUMBER = { foto: [Camera, 'Foto nota'], suara: [Microphone, 'Suara'], teks: [TextT, 'Ketik'], manual: [PencilSimple, 'Manual'] };

// Satu kalimat dari AI tentang hal terpenting hari ini.
function TeksCatatan({ catatan, cadangan }) {
  if (!catatan.data) return <span className={catatan.loading ? 'opacity-70' : ''}>{cadangan}</span>;
  return (
    <>
      {catatan.data.teks}
      {catatan.data.sumber === 'ai' && <span className="ml-2 rounded-full bg-tinta/10 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap">Catatan AI</span>}
    </>
  );
}

// Kartu biru: untung tiap menu sebagai batang. Pilih batang untuk melihat rincian menu itu.
function KartuUntung({ produk, usaha, rata }) {
  const lengkap = produk.filter((p) => p.lengkap);
  const awal = [...lengkap].sort((a, b) => a.margin - b.margin)[0];
  const [pilih, setPilih] = useState(awal?.id);
  const p = lengkap.find((x) => x.id === pilih) || awal;
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[24px] bg-gradient-to-br from-biru to-biru-tua p-5 text-white shadow-[0_20px_45px_rgb(29_89_187/0.3)] sm:p-6">
      <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-biru-terang/25" aria-hidden />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-white/80">Rata-rata untung semua menu</h2>
          <p className="angka mt-1 text-4xl font-extrabold tracking-tight">{persen(rata)}</p>
          <p className="mt-1 text-sm text-white/80">
            Target Anda {persen(usaha.target_margin, 0)} · {lengkap.length} menu dihitung
          </p>
        </div>
        {p && (
          <div className="w-full rounded-2xl bg-white/12 p-3.5 ring-1 ring-white/20 backdrop-blur-sm sm:w-64">
            <p className="truncate font-bold">{p.nama}</p>
            <dl className="angka mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <dt className="text-white/75">Harga jual</dt>
              <dd className="text-right font-semibold">{rupiah(p.harga_jual)}</dd>
              <dt className="text-white/75">Modal/porsi</dt>
              <dd className="text-right font-semibold">{rupiah(p.hpp)}</dd>
              <dt className="text-white/75">Untung/porsi</dt>
              <dd className="text-right font-semibold">{rupiah(p.harga_jual - p.hpp)}</dd>
            </dl>
            <Link to={`/produk/${p.id}`} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-kuning hover:underline">
              Rincian dan simulasi <ArrowRight size={14} weight="bold" aria-hidden />
            </Link>
          </div>
        )}
      </div>
      {lengkap.length ? (
        <div className="relative mt-6">
          <BatangMenu produk={lengkap} target={usaha.target_margin} pilih={p?.id} ubah={setPilih} />
          <p className="mt-3 text-xs text-white/70">Pilih batang untuk melihat rincian menu. Garis kuning putus-putus adalah target {persen(usaha.target_margin, 0)}; batang transparan berarti di bawah target.</p>
        </div>
      ) : (
        <p className="relative mt-6 text-sm text-white/80">Lengkapi harga bahan menu supaya untungnya bisa dihitung.</p>
      )}
    </section>
  );
}

// Kartu kuning: hal yang perlu dikerjakan hari ini, dengan tombol langsung terapkan harga.
function KartuTindakan({ perlu, catatan, sesudah }) {
  const [proses, setProses] = useState(null);
  const [galat, setGalat] = useState(null);
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

  if (!perlu.length)
    return (
      <section className="flex min-w-0 flex-col rounded-[24px] bg-kuning-muda p-5 ring-1 ring-kuning/40 sm:p-6">
        <CheckCircle size={32} weight="fill" className="text-aman" aria-hidden />
        <h2 className="mt-3 text-xl font-bold">Semua menu sesuai target</h2>
        <p className="mt-2 text-sm">
          <TeksCatatan catatan={catatan} cadangan="Tidak ada harga yang perlu diubah hari ini." />
        </p>
        <Tombol varian="garis" to="/promo" className="mt-auto self-start">
          Buat paket promo
        </Tombol>
      </section>
    );

  return (
    <section className="flex min-w-0 flex-col rounded-[24px] bg-kuning p-5 sm:p-6">
      <p className="text-sm font-semibold">Perlu tindakan</p>
      <h2 className="mt-1 text-xl leading-snug font-bold">{perlu.length} menu di bawah target untung</h2>
      <p className="mt-2 text-sm">
        <TeksCatatan catatan={catatan} cadangan="Pilih harga baru di bawah, atau buka rincian untuk mencoba pilihan lain." />
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {perlu.slice(0, 3).map((p) => (
          <li key={p.id} className="rounded-2xl bg-white/85 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <Link to={`/produk/${p.id}`} className="truncate font-semibold hover:text-biru">
                {p.nama}
              </Link>
              <span className="angka shrink-0 text-sm font-semibold text-rugi">{persen(p.margin)}</span>
            </div>
            {p.opsi_utama?.jenis === 'naik_harga' ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="angka text-xs text-redup">
                  {rupiah(p.harga_jual)} jadi {rupiah(p.opsi_utama.harga_jual)}, untung {persen(p.opsi_utama.margin)}
                </p>
                <button
                  type="button"
                  onClick={() => terapkan(p)}
                  disabled={proses === p.id}
                  className="angka min-h-11 rounded-full bg-navy px-4 text-xs font-semibold text-white hover:bg-tinta disabled:opacity-60"
                >
                  {proses === p.id ? 'Menyimpan' : `Pakai ${rupiah(p.opsi_utama.harga_jual)}`}
                </button>
              </div>
            ) : (
              p.opsi_utama && <p className="mt-1 text-xs text-redup">{p.opsi_utama.judul}</p>
            )}
          </li>
        ))}
      </ul>
      {galat && <p className="mt-2 text-sm font-semibold text-rugi">{galat}</p>}
    </section>
  );
}

function Ubin({ label, children, to }) {
  const isi = (
    <>
      <p className="text-sm text-redup">{label}</p>
      <div className="mt-1">{children}</div>
    </>
  );
  return to ? (
    <Link to={to} className="block min-w-0 rounded-[20px] border border-garis bg-kartu p-4 shadow-kartu transition hover:-translate-y-0.5 hover:border-biru/40">
      {isi}
    </Link>
  ) : (
    <div className="min-w-0 rounded-[20px] border border-garis bg-kartu p-4 shadow-kartu">{isi}</div>
  );
}

function HargaPasar({ data }) {
  const [periode, setPeriode] = useState('minggu');
  const kunci = periode === 'minggu' ? 'perubahan_mingguan' : 'perubahan_harian';
  return (
    <Kartu>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Harga pasar bahan Anda</h2>
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
        <h2 className="font-semibold">Belanja terakhir</h2>
        {daftar.length > 0 && (
          <Link to="/belanja" className="inline-flex min-h-11 items-center text-sm font-semibold text-biru">
            Semua belanja
          </Link>
        )}
      </div>
      {daftar.length ? (
        <ol className="relative ml-4 border-l-2 border-dashed border-garis">
          {daftar.map((n) => {
            const [Ikon, cara] = SUMBER[n.sumber] || SUMBER.manual;
            return (
              <li key={n.id} className="relative pl-6">
                <span className="absolute top-3.5 -left-[17px] flex size-8 items-center justify-center rounded-full border-2 border-white bg-biru-muda text-biru" aria-hidden>
                  <Ikon size={15} weight="bold" />
                </span>
                <Link to={`/belanja/${n.id}`} className="flex min-h-14 items-center justify-between gap-2 py-2 hover:text-biru">
                  <span className="min-w-0">
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
        </ol>
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
  const belumLengkap = produk.filter((p) => !p.lengkap);

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Halo, {user?.nama || 'Pebisnis'}</h1>
          <p className="mt-1 text-sm text-redup">
            {usaha.nama}
            {usaha.kota ? `, ${usaha.kota}` : ''} · {tanggal(new Date().toISOString())}
          </p>
        </div>
        <Tombol to="/belanja/baru">
          <Plus size={16} weight="bold" aria-hidden /> Catat belanja
        </Tombol>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <KartuUntung produk={produk} usaha={usaha} rata={kpi.rata_margin} />
        <KartuTindakan perlu={perlu_tindakan} catatan={catatan} sesudah={muat} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Ubin label="Menu paling untung" to={terbaik ? `/produk/${terbaik.id}` : undefined}>
          {terbaik ? (
            <p className="flex flex-wrap items-center gap-2">
              <span className="truncate text-lg font-bold">{terbaik.nama}</span>
              <Chip status="aman">{persen(terbaik.margin)}</Chip>
            </p>
          ) : (
            <p className="text-sm text-redup">Belum ada hitungan lengkap</p>
          )}
        </Ubin>
        <Ubin label="Bahan naik tertinggi" to={naik ? `/bahan/${naik.id}` : undefined}>
          {naik ? (
            <p className="flex flex-wrap items-center gap-2">
              <span className="truncate text-lg font-bold capitalize">{naik.nama}</span>
              <Chip status="rugi">Naik {persen(naik.perubahan)}</Chip>
            </p>
          ) : (
            <p className="text-sm text-redup">Tidak ada yang naik dari belanja sebelumnya</p>
          )}
        </Ubin>
        <Ubin label="Belanja bulan ini" to="/belanja">
          <p className="angka text-lg font-bold">
            {rupiah(kpi.belanja_bulan_ini)} <span className="text-sm font-normal text-redup">dari {kpi.nota_bulan_ini} catatan</span>
          </p>
        </Ubin>
      </div>

      {belumLengkap.length > 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-garis bg-kartu px-4 py-3 text-sm">
          {belumLengkap.length} menu belum bisa dihitung karena harga bahannya kosong:{' '}
          {belumLengkap.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ', '}
              <Link to={`/produk/${p.id}`} className="font-semibold text-biru hover:underline">
                {p.nama}
              </Link>
            </span>
          ))}
          .
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <HargaPasar data={pasar_ringkas} />
        <BelanjaTerakhir daftar={belanja_terakhir} />
      </div>
    </>
  );
}
