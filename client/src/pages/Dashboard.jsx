import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { persen, rupiah, tanggal } from '../lib/api.js';
import { Chip, Galat, Judul, Kartu, Kosong, Muat, Tombol, hargaSatuan } from '../components/ui.jsx';
import { Perubahan } from './Pasar.jsx';

function Kpi({ label, nilai, ket, warna = 'bg-kartu' }) {
  return (
    <div className={`rounded-2xl border border-garis p-4 ${warna}`}>
      <p className="text-sm text-redup">{label}</p>
      <p className="angka mt-1 text-2xl font-bold">{nilai}</p>
      {ket && <p className="mt-1 text-xs text-redup">{ket}</p>}
    </div>
  );
}

function Catatan() {
  const { data, loading, error, muat } = useApi('/dashboard/catatan');
  return (
    <Kartu className="mb-4 bg-teal text-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Catatan hari ini</h2>
        {data && <span className="text-xs text-white/75">{data.sumber === 'ai' ? 'Dirangkum AI dari angka hitungan' : 'Ringkasan otomatis'}</span>}
      </div>
      {loading && !data ? (
        <p role="status" className="mt-2 text-sm text-white/80">
          Merangkum kondisi usaha hari ini
        </p>
      ) : error ? (
        <p className="mt-2 text-sm">
          Catatan belum bisa dibuat.{' '}
          <button className="min-h-11 font-semibold underline" onClick={muat}>
            Coba lagi
          </button>
        </p>
      ) : (
        <p className="mt-2 max-w-3xl leading-relaxed">{data.teks}</p>
      )}
    </Kartu>
  );
}

// Batang untung per menu dengan garis target.
function GrafikMargin({ produk, target }) {
  const maks = Math.max(0.8, ...produk.map((p) => p.margin ?? 0));
  const warna = { aman: 'bg-teal', waspada: 'bg-waspada', rugi: 'bg-rugi', belum_lengkap: 'bg-garis' };
  return (
    <div>
      <ul className="flex flex-col gap-3">
        {produk.map((p) => (
          <li key={p.id}>
            <div className="mb-1 flex justify-between gap-2 text-sm">
              <Link to={`/produk/${p.id}`} className="truncate font-medium hover:text-teal">
                {p.nama}
              </Link>
              <span className="angka font-semibold">{persen(p.margin)}</span>
            </div>
            <div className="relative h-3 rounded-full bg-dasar" role="img" aria-label={`Untung ${p.nama} ${persen(p.margin)}, target ${persen(target)}`}>
              <div className={`h-3 rounded-full ${warna[p.status] || 'bg-garis'}`} style={{ width: `${Math.max(0, (p.margin ?? 0) / maks) * 100}%` }} />
              <div className="absolute -top-1 h-5 w-0.5 bg-tinta" style={{ left: `${(target / maks) * 100}%` }} aria-hidden />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-redup">Garis hitam: target untung {persen(target)}.</p>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, muat } = useApi('/dashboard');
  if (loading && !data) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;
  const { usaha, kpi, produk, perlu_tindakan, bahan_naik, info_pasar, belanja_terakhir } = data;
  const diBawah = kpi.waspada + kpi.rugi;

  return (
    <>
      <Judul
        judul="Ringkasan"
        sub={`${usaha.nama}${usaha.kota ? `, ${usaha.kota}` : ''} · ${tanggal(new Date().toISOString())}`}
        aksi={
          <Tombol to="/belanja/baru" className="lg:hidden">
            Catat belanja
          </Tombol>
        }
      />

      <Catatan />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Rata-rata untung" nilai={persen(kpi.rata_margin)} ket={`Target ${persen(usaha.target_margin)}`} warna="bg-lime/40" />
        <Kpi label="Menu sesuai target" nilai={`${kpi.aman}/${kpi.jumlah_produk}`} ket={kpi.belum_lengkap ? `${kpi.belum_lengkap} harga belum lengkap` : undefined} />
        <Kpi label="Menu di bawah target" nilai={diBawah} ket={kpi.rugi ? `${kpi.rugi} rugi` : undefined} warna={diBawah ? 'bg-waspada-muda' : 'bg-kartu'} />
        <Kpi label="Belanja bulan ini" nilai={rupiah(kpi.belanja_bulan_ini)} ket={`${kpi.nota_bulan_ini} catatan`} />
      </div>

      {perlu_tindakan.length > 0 && (
        <section className="mt-6" aria-labelledby="perlu">
          <h2 id="perlu" className="mb-3 font-semibold">
            Perlu ditindak
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {perlu_tindakan.map((p) => (
              <Kartu key={p.id} className="border-waspada/30">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{p.nama}</p>
                  <Chip status={p.status} />
                </div>
                <p className="angka mt-2 text-sm text-redup">
                  Modal {rupiah(p.hpp)}, dijual {rupiah(p.harga_jual)}, untung {persen(p.margin)}
                </p>
                {p.opsi_utama && <p className="mt-2 text-sm font-medium">{p.opsi_utama.judul}</p>}
                <Tombol varian="garis" to={`/produk/${p.id}`} className="mt-3">
                  Lihat pilihan
                </Tombol>
              </Kartu>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Kartu className="lg:col-span-3">
          <h2 className="mb-4 font-semibold">Untung per menu</h2>
          {produk.length ? <GrafikMargin produk={produk} target={usaha.target_margin} /> : <Kosong judul="Belum ada menu" aksi={<Tombol to="/produk/baru">Tambah menu</Tombol>} />}
        </Kartu>

        <Kartu className="lg:col-span-2">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="font-semibold">Kabar harga pasar</h2>
            <Link to="/pasar" className="inline-flex min-h-11 items-center text-sm font-semibold text-teal">
              Harga pasar
            </Link>
          </div>
          {info_pasar.length ? (
            <ul className="divide-y divide-garis">
              {info_pasar.map((i) => (
                <li key={i.komoditas} className="py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium capitalize">{i.komoditas}</span>
                    <span className="angka text-sm">{`${rupiah(i.harga)}/${i.satuan}`}</span>
                  </div>
                  <div className="text-sm">
                    <Perubahan nilai={i.perubahan} ket={i.periode === 'hari' ? 'dari data sebelumnya' : 'seminggu'} />
                  </div>
                  {i.menu.length > 0 && <p className="text-xs text-redup">Dipakai di {i.menu.map((m) => m.nama).join(', ')}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-redup">Harga bahan yang Anda pakai stabil di pasar daerah.</p>
          )}
        </Kartu>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Kartu>
          <h2 className="mb-2 font-semibold">Naik dari belanja sebelumnya</h2>
          {bahan_naik.length ? (
            <ul className="divide-y divide-garis">
              {bahan_naik.map((b) => {
                const h = hargaSatuan(b.harga_terakhir?.harga_per_satuan, b.satuan_dasar);
                return (
                  <li key={b.id}>
                    <Link to={`/bahan/${b.id}`} className="flex min-h-11 items-center justify-between gap-2 py-2 hover:text-teal">
                      <span className="capitalize">{b.nama}</span>
                      <span className="angka text-right text-sm">
                        <span className="font-semibold text-rugi">naik {persen(b.perubahan)}</span>
                        {h && <span className="block text-redup">{`${rupiah(h.harga)}/${h.satuan}`}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-redup">Tidak ada bahan yang naik dari belanja terakhir.</p>
          )}
        </Kartu>

        <Kartu>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="font-semibold">Belanja terakhir</h2>
            <Link to="/belanja" className="inline-flex min-h-11 items-center text-sm font-semibold text-teal">
              Semua
            </Link>
          </div>
          {belanja_terakhir.length ? (
            <ul className="divide-y divide-garis">
              {belanja_terakhir.map((n) => (
                <li key={n.id}>
                  <Link to={`/belanja/${n.id}`} className="flex min-h-11 items-center justify-between gap-2 py-2 hover:text-teal">
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
            <Kosong judul="Belum ada belanja" aksi={<Tombol to="/belanja/baru">Catat belanja</Tombol>} />
          )}
        </Kartu>
      </div>
    </>
  );
}
