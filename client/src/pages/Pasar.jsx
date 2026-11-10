import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import { useApi } from '../lib/hooks.js';
import { persen, rupiah, tanggal } from '../lib/api.js';
import { Galat, Judul, Kartu, Kosong, Muat } from '../components/ui.jsx';
import Garis from '../components/Garis.jsx';

const LEVEL = { kota: 'kota', provinsi: 'rata-rata provinsi', nasional: 'rata-rata nasional' };

export function Perubahan({ nilai, ket }) {
  if (nilai == null) return <span className="text-redup">–</span>;
  if (Math.abs(nilai) < 0.0005) return <span className="text-redup">tetap {ket}</span>;
  const naik = nilai > 0;
  const Ikon = naik ? ArrowUp : ArrowDown;
  return (
    <span className={`angka inline-flex items-center gap-0.5 font-semibold ${naik ? 'text-rugi' : 'text-aman'}`}>
      <Ikon size={14} weight="bold" aria-hidden />
      <span className="sr-only">{naik ? 'naik' : 'turun'}</span>
      {persen(Math.abs(nilai))} <span className="font-normal text-redup">{ket}</span>
    </span>
  );
}

function KartuKomoditas({ d }) {
  return (
    <li className="min-w-0 rounded-2xl border border-garis bg-kartu p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold capitalize">{d.komoditas}</p>
          <p className="text-xs text-redup">
            {d.wilayah}, {LEVEL[d.level]}
          </p>
        </div>
        <p className="angka text-right text-lg font-bold">
          {rupiah(d.harga)}
          <span className="text-sm font-normal text-redup">/{d.satuan}</span>
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Perubahan nilai={d.perubahan_harian} ket="dari kemarin" />
        <Perubahan nilai={d.perubahan_mingguan} ket="seminggu" />
      </div>
      <div className="mt-2">
        <Garis data={d.riwayat} label={`Harga ${d.komoditas} ${d.riwayat.length} hari terakhir`} />
      </div>
      {d.menu.length > 0 && (
        <p className="mt-2 text-sm">
          <span className="text-redup">Dipakai di </span>
          {d.menu.map((m, i) => (
            <span key={m.id}>
              {i > 0 && ', '}
              <Link to={`/produk/${m.id}`} className="font-medium text-teal hover:underline">
                {m.nama}
              </Link>
            </span>
          ))}
        </p>
      )}
      {d.bahan.length > 0 && (
        <Link to={`/bahan/${d.bahan[0].id}`} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-teal">
          Bandingkan dengan harga belanja Anda
        </Link>
      )}
    </li>
  );
}

export default function Pasar() {
  const { data, loading, error, muat } = useApi('/pasar');
  if (loading && !data) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;

  const dipakai = data.harga.filter((d) => d.bahan.length);
  const lain = data.harga.filter((d) => !d.bahan.length);
  const terbaru = data.harga.reduce((t, d) => (d.tanggal > t ? d.tanggal : t), '');
  const sumber = [...new Set(data.harga.map((d) => d.sumber))].join(', ');
  const tempat = [data.wilayah.kota, data.wilayah.provinsi].filter(Boolean).join(', ');

  return (
    <>
      <Judul judul="Harga pasar" sub={`${tempat || 'Wilayah belum diisi'} · diperbarui ${tanggal(terbaru)}`} />

      {!data.harga.length ? (
        <Kartu>
          <Kosong judul="Belum ada data harga pasar" teks="Data harga diimpor dari berkas CSV harian. Lihat README server untuk cara impor." />
        </Kartu>
      ) : (
        <>
          <section aria-labelledby="dipakai">
            <h2 id="dipakai" className="mb-3 font-semibold">
              Bahan yang Anda pakai
            </h2>
            {dipakai.length ? (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {dipakai.map((d) => (
                  <KartuKomoditas key={d.komoditas} d={d} />
                ))}
              </ul>
            ) : (
              <Kartu>
                <Kosong judul="Belum ada bahan yang cocok" teks="Isi kolom komoditas pasar di halaman bahan baku supaya harganya terpantau di sini." />
              </Kartu>
            )}
          </section>

          {lain.length > 0 && (
            <Kartu className="mt-6">
              <h2 className="mb-3 font-semibold">Komoditas lain di daerah Anda</h2>
              <div className="relative -mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-[32rem] text-sm">
                  <thead className="text-left text-redup">
                    <tr>
                      <th className="py-2 font-medium">Komoditas</th>
                      <th className="py-2 text-right font-medium">Harga</th>
                      <th className="py-2 pl-4 font-medium">Hari ini</th>
                      <th className="py-2 pl-4 font-medium">Seminggu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-garis">
                    {lain.map((d) => (
                      <tr key={d.komoditas}>
                        <td className="py-2 capitalize">
                          {d.komoditas}
                          <span className="block text-xs text-redup">{`${d.wilayah}, ${LEVEL[d.level]}`}</span>
                        </td>
                        <td className="angka py-2 text-right">{`${rupiah(d.harga)}/${d.satuan}`}</td>
                        <td className="py-2 pl-4">
                          <Perubahan nilai={d.perubahan_harian} ket="" />
                        </td>
                        <td className="py-2 pl-4">
                          <Perubahan nilai={d.perubahan_mingguan} ket="" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Kartu>
          )}

          <p className="mt-6 max-w-2xl text-xs text-redup">
            Sumber: {sumber}. Harga diambil bertingkat: kota dulu, lalu provinsi, lalu nasional kalau data kota belum ada. Harga yang lebih dari 7 hari tidak dipakai untuk menilai harga belanja.
          </p>
        </>
      )}
    </>
  );
}
