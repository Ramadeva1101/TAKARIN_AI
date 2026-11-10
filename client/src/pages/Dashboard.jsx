import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Warning, Lightbulb, Plus, ShoppingCart } from '@phosphor-icons/react';
import { useApi } from '../lib/hooks.js';
import { useAuth } from '../lib/auth.jsx';
import { api, persen, pesanGalat, rupiah, tanggal } from '../lib/api.js';
import { Chip, Galat, Kartu, Muat, Tombol } from '../components/ui.jsx';
import Garis from '../components/Garis.jsx';
import { Perubahan } from './Pasar.jsx';

function Kpi({ label, children }) {
  return (
    <Kartu>
      <p className="text-sm text-redup">{label}</p>
      <div className="mt-1.5">{children}</div>
    </Kartu>
  );
}

// Satu kalimat dari AI tentang hal terpenting hari ini. Dipakai di banner, atau baris tipis kalau semua aman.
function TeksCatatan({ catatan, cadangan }) {
  if (catatan.loading && !catatan.data) return <span className="text-redup">{cadangan}</span>;
  if (!catatan.data) return <span>{cadangan}</span>;
  return (
    <>
      {catatan.data.teks}
      {catatan.data.sumber === "ai" && <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-biru">Catatan AI</span>}
    </>
  );
}

function Saran({ daftar, sesudah }) {
  const [proses, setProses] = useState(null);
  const [galat, setGalat] = useState(null);
  const terapkan = async (p) => {
    setProses(p.id);
    setGalat(null);
    try {
      await api(`/produk/${p.id}`, { method: 'PUT', body: { harga_jual: p.opsi_utama.harga_jual } });
      await sesudah();
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setProses(null);
    }
  };
  return (
    <Kartu>
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <Lightbulb size={20} weight="fill" className="text-kuning" aria-hidden /> Saran harga
      </h2>
      {!daftar.length ? (
        <p className="text-sm text-redup">Semua menu sudah sesuai target untung.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {daftar.map((p) => (
            <li key={p.id} className="rounded-2xl border border-garis bg-dasar p-3">
              <span className="mb-1 inline-block rounded-full bg-kuning-muda px-2.5 py-0.5 text-xs font-semibold text-kuning-tua">Saran</span>
              <p className="text-sm">
                <Link to={`/produk/${p.id}`} className="font-semibold hover:text-biru">
                  {p.nama}
                </Link>{' '}
                <span className="angka text-redup">untung {persen(p.margin)}.</span>
              </p>
              {p.opsi_utama && (
                <>
                  <p className="angka mt-1 text-sm">
                    {p.opsi_utama.judul}, untung jadi {persen(p.opsi_utama.margin)}.
                  </p>
                  {p.opsi_utama.jenis === 'naik_harga' && (
                    <Tombol className="mt-2 !min-h-11 !px-4 text-xs" onClick={() => terapkan(p)} disabled={proses === p.id}>
                      {proses === p.id ? 'Menyimpan' : `Pakai ${rupiah(p.opsi_utama.harga_jual)}`}
                    </Tombol>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {galat && <p className="mt-2 text-sm text-rugi">{galat}</p>}
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
  const diBawah = kpi.waspada + kpi.rugi;
  const terbaik = produk.filter((p) => p.lengkap).sort((a, b) => b.margin - a.margin)[0];
  const naik = bahan_naik[0];

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

      {diBawah > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[20px] border border-kuning/50 bg-gradient-to-r from-kuning-muda via-[#fff8d6] to-white p-4 shadow-kartu">
          <Warning size={28} weight="fill" className="shrink-0 text-kuning" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {diBawah} dari {kpi.jumlah_produk} menu di bawah target untung.
            </p>
            <p className="text-sm text-kuning-tua">
              <TeksCatatan catatan={catatan} cadangan={`Target Anda ${persen(usaha.target_margin)}. Lihat saran harga di samping.`} />
            </p>
          </div>
          <Tombol varian="garis" to={`/produk/${perlu_tindakan[0]?.id ?? ''}`}>
            Lihat rincian
          </Tombol>
        </div>
      )}

      {diBawah === 0 && (
        <p className="mb-4 rounded-2xl border border-garis bg-white/80 px-4 py-3 text-sm shadow-kartu">
          <TeksCatatan catatan={catatan} cadangan="Semua menu sesuai target untung." />
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Rata-rata untung">
          <p className="angka text-2xl font-bold">{persen(kpi.rata_margin)}</p>
          <p className="text-xs text-redup">Target {persen(usaha.target_margin)}</p>
        </Kpi>
        <Kpi label="Menu paling untung">
          {terbaik ? (
            <>
              <Link to={`/produk/${terbaik.id}`} className="block truncate text-lg font-bold hover:text-biru">
                {terbaik.nama}
              </Link>
              <Chip status="aman">Untung {persen(terbaik.margin)}</Chip>
            </>
          ) : (
            <p className="text-sm text-redup">Belum ada hitungan lengkap</p>
          )}
        </Kpi>
        <Kpi label="Bahan naik tertinggi">
          {naik ? (
            <>
              <Link to={`/bahan/${naik.id}`} className="block truncate text-lg font-bold capitalize hover:text-biru">
                {naik.nama}
              </Link>
              <Chip status="rugi">Naik {persen(naik.perubahan)}</Chip>
            </>
          ) : (
            <p className="text-sm text-redup">Tidak ada yang naik dari belanja sebelumnya</p>
          )}
        </Kpi>
        <Kpi label="Belanja bulan ini">
          <p className="angka text-2xl font-bold">{rupiah(kpi.belanja_bulan_ini)}</p>
          <p className="text-xs text-redup">{kpi.nota_bulan_ini} catatan</p>
        </Kpi>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
          <Kartu>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Daftar menu</h2>
              <Tombol varian="garis" to="/produk/baru">
                <Plus size={16} weight="bold" aria-hidden /> Tambah menu
              </Tombol>
            </div>
            {!produk.length ? (
              <p className="text-sm text-redup">Belum ada menu.</p>
            ) : (
              <div className="relative -mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead>
                    <tr className="bg-dasar text-left text-redup">
                      <th className="rounded-l-xl px-3 py-2.5 font-medium">Menu</th>
                      <th className="px-3 py-2.5 text-right font-medium">Harga jual</th>
                      <th className="px-3 py-2.5 text-right font-medium">Modal/porsi</th>
                      <th className="px-3 py-2.5 text-right font-medium">Untung</th>
                      <th className="rounded-r-xl px-3 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-garis">
                    {produk.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-3">
                          <Link to={`/produk/${p.id}`} className="font-semibold hover:text-biru">
                            {p.nama}
                          </Link>
                        </td>
                        <td className="angka px-3 py-3 text-right">{rupiah(p.harga_jual)}</td>
                        <td className="angka px-3 py-3 text-right">{p.lengkap ? rupiah(p.hpp) : '–'}</td>
                        <td className="angka px-3 py-3 text-right font-semibold">{p.lengkap ? persen(p.margin) : '–'}</td>
                        <td className="px-3 py-3">
                          <Chip status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Kartu>

          <Kartu>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">Belanja terakhir</h2>
              {belanja_terakhir.length > 0 && (
                <Link to="/belanja" className="inline-flex min-h-11 items-center text-sm font-semibold text-biru">
                  Semua belanja
                </Link>
              )}
            </div>
            {belanja_terakhir.length ? (
              <ul className="divide-y divide-garis">
                {belanja_terakhir.map((n) => (
                  <li key={n.id}>
                    <Link to={`/belanja/${n.id}`} className="flex min-h-12 items-center justify-between gap-2 py-2 hover:text-biru">
                      <span>
                        {n.nama_toko || 'Tanpa nama toko'}
                        <span className="block text-xs text-redup">{tanggal(n.tanggal)}</span>
                      </span>
                      <span className="angka text-right text-sm font-semibold">
                        {rupiah(n.total)}
                        {n.status === 'draf' && <span className="block text-xs font-semibold text-waspada">Belum dicek</span>}
                      </span>
                    </Link>
                  </li>
                ))}
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
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Kartu>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">Harga pasar bahan</h2>
              <Link to="/pasar" className="inline-flex min-h-11 items-center text-sm font-semibold text-biru">
                Lihat semua
              </Link>
            </div>
            {pasar_ringkas.length ? (
              <ul className="divide-y divide-garis">
                {pasar_ringkas.map((d) => (
                  <li key={d.komoditas} className="grid grid-cols-[1fr_5rem] items-center gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium capitalize">{d.komoditas}</p>
                      <p className="angka text-sm">
                        {`${rupiah(d.harga)}/${d.satuan}`} <Perubahan nilai={d.perubahan_mingguan} ket="" />
                      </p>
                    </div>
                    <Garis data={d.riwayat} label={`Tren harga ${d.komoditas} di ${d.wilayah}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-redup">Belum ada harga pasar untuk bahan Anda.</p>
            )}
            {pasar_ringkas.length > 0 && <p className="mt-2 text-xs text-redup">Perubahan dalam seminggu, {pasar_ringkas[0].wilayah}.</p>}
          </Kartu>

          <Saran daftar={perlu_tindakan} sesudah={muat} />
        </div>
      </div>
    </>
  );
}
