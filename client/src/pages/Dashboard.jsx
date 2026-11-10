import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { persen, rupiah, tanggal } from '../lib/api.js';
import { Chip, Galat, Judul, Kartu, Kosong, Muat, Tombol, hargaSatuan } from '../components/ui.jsx';

function Kpi({ label, nilai, ket, warna = 'bg-kartu' }) {
  return (
    <div className={`rounded-2xl border border-garis p-4 ${warna}`}>
      <p className="text-sm text-redup">{label}</p>
      <p className="angka mt-1 text-2xl font-bold">{nilai}</p>
      {ket && <p className="mt-1 text-xs text-redup">{ket}</p>}
    </div>
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
  const { usaha, kpi, produk, perlu_tindakan, bahan_naik, harga_pasar } = data;
  const diBawah = kpi.waspada + kpi.rugi;

  return (
    <>
      <Judul
        judul="Ringkasan"
        sub={`${usaha.nama}${usaha.kota ? `, ${usaha.kota}` : ''}`}
        aksi={
          <Tombol to="/belanja/baru" className="lg:hidden">
            Catat belanja
          </Tombol>
        }
      />

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

        <Kartu className="bg-teal text-white lg:col-span-2">
          <h2 className="font-semibold">Harga bahan naik</h2>
          <p className="mb-3 text-sm text-white/75">Dibanding belanja sebelumnya</p>
          {bahan_naik.length ? (
            <ul className="flex flex-col divide-y divide-white/15">
              {bahan_naik.map((b) => {
                const h = hargaSatuan(b.harga_terakhir?.harga_per_satuan, b.satuan_dasar);
                return (
                  <li key={b.id}>
                    <Link to={`/bahan/${b.id}`} className="flex min-h-11 items-center justify-between gap-2 py-2 hover:underline">
                      <span className="capitalize">{b.nama}</span>
                      <span className="angka text-right text-sm">
                        <span className="font-semibold">naik {persen(b.perubahan, 1)}</span>
                        {h && <span className="block text-white/75">{`${rupiah(h.harga)}/${h.satuan}`}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-white/85">Tidak ada bahan yang naik dari belanja terakhir.</p>
          )}
        </Kartu>
      </div>

      <Kartu className="mt-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Harga beli dibanding pasar daerah</h2>
          <Link to="/bahan" className="inline-flex min-h-11 items-center text-sm font-semibold text-teal">
            Semua bahan
          </Link>
        </div>
        {harga_pasar.length ? (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="text-left text-redup">
                <tr>
                  <th className="py-2 font-medium">Bahan</th>
                  <th className="py-2 text-right font-medium">Harga beli</th>
                  <th className="py-2 text-right font-medium">Acuan pasar</th>
                  <th className="py-2 pl-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-garis">
                {harga_pasar.map((b) => {
                  const beli = hargaSatuan(b.harga_terakhir?.harga_per_satuan, b.satuan_dasar);
                  return (
                    <tr key={b.id}>
                      <td className="py-2">
                        <Link to={`/bahan/${b.id}`} className="font-medium capitalize hover:text-teal">
                          {b.nama}
                        </Link>
                      </td>
                      <td className="angka py-2 text-right">{beli ? `${rupiah(beli.harga)}/${beli.satuan}` : '–'}</td>
                      <td className="angka py-2 text-right">
                        {b.acuan ? `${rupiah(b.acuan.harga)}/${b.acuan.satuan}` : '–'}
                        {b.acuan && <span className="block text-xs text-redup">{`${b.acuan.wilayah}, ${tanggal(b.acuan.tanggal)}`}</span>}
                      </td>
                      <td className="py-2 pl-3">
                        {b.harga_terakhir ? <Chip status={b.status_acuan} /> : <Chip status="tanpa_acuan">Belum dibeli</Chip>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Kosong judul="Belum ada acuan" teks="Harga acuan muncul untuk bahan yang cocok dengan komoditas pasar, misalnya cabai, bawang, ayam." />
        )}
      </Kartu>
    </>
  );
}
