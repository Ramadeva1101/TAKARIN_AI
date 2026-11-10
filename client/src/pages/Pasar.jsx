import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import { useApi } from '../lib/hooks.js';
import { api, persen, pesanGalat, rupiah, tanggal } from '../lib/api.js';
import { Galat, Judul, Kartu, Kosong, Muat, Tombol } from '../components/ui.jsx';
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
    <li className="min-w-0 rounded-[20px] border border-garis bg-kartu shadow-kartu p-4">
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
        <Perubahan nilai={d.perubahan_harian} ket={d.tanggal_sebelumnya ? `dari ${tanggal(d.tanggal_sebelumnya)}` : 'dari data sebelumnya'} />
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
              <Link to={`/produk/${m.id}`} className="font-medium text-biru hover:underline">
                {m.nama}
              </Link>
            </span>
          ))}
        </p>
      )}
      {d.bahan.length > 0 && (
        <Link to={`/bahan/${d.bahan[0].id}`} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-biru">
          Bandingkan dengan harga belanja Anda
        </Link>
      )}
    </li>
  );
}

export default function Pasar() {
  const { data, loading, error, muat } = useApi('/pasar');
  const [proses, setProses] = useState(false);
  const [galatPerbarui, setGalatPerbarui] = useState(null);
  const berjalan = data?.sinkron?.berjalan;

  // Server sedang menarik data: cek lagi sebentar lagi.
  useEffect(() => {
    if (!berjalan) return;
    const t = setTimeout(muat, 5000);
    return () => clearTimeout(t);
  }, [berjalan, data, muat]);

  const perbarui = async () => {
    setProses(true);
    setGalatPerbarui(null);
    try {
      await api('/pasar/perbarui', { method: 'POST' });
      await muat();
    } catch (err) {
      setGalatPerbarui(pesanGalat(err));
    } finally {
      setProses(false);
    }
  };

  if (loading && !data) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;

  const dipakai = data.harga.filter((d) => d.bahan.length);
  const lain = data.harga.filter((d) => !d.bahan.length);
  const terbaru = data.harga.reduce((t, d) => (d.tanggal > t ? d.tanggal : t), '');
  const sumber = [...new Set(data.harga.map((d) => d.sumber))].join(', ');
  const tempat = [data.wilayah.kota, data.wilayah.provinsi].filter(Boolean).join(', ');

  return (
    <>
      <Judul
        judul="Harga pasar"
        sub={`${tempat || 'Wilayah belum diisi'} · data per ${terbaru ? tanggal(terbaru) : 'belum ada'}`}
        aksi={
          data.sinkron.aktif && (
            <Tombol varian="garis" onClick={perbarui} disabled={proses || berjalan}>
              {proses || berjalan ? 'Mengambil data' : 'Perbarui sekarang'}
            </Tombol>
          )
        }
      />
      {(berjalan || galatPerbarui || data.sinkron.galat.length > 0) && (
        <div role="status" className={`mb-4 rounded-xl px-3 py-2 text-sm ${berjalan ? 'bg-biru-muda text-biru-tua' : 'bg-waspada-muda text-waspada'}`}>
          {berjalan ? (
            'Mengambil harga terbaru dari PIHPS Bank Indonesia. Bisa sampai setengah menit.'
          ) : (
            <>
              {galatPerbarui && <p>{galatPerbarui}</p>}
              {data.sinkron.galat.map((g) => (
                <p key={g}>{g}</p>
              ))}
              <p>Data yang tampil adalah data tersimpan terakhir.</p>
            </>
          )}
        </div>
      )}

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
            Sumber: {sumber}
            {sumber.includes('PIHPS') && (
              <>
                {' '}
                (<a className="underline" href="https://www.bi.go.id/hargapangan" target="_blank" rel="noreferrer">bi.go.id/hargapangan</a>), harga pasar tradisional.
              </>
            )}{' '}
            Harga diambil bertingkat: kota dulu, lalu provinsi, lalu nasional kalau data kota belum ada. Harga yang lebih dari 7 hari tidak dipakai untuk menilai harga belanja.
          </p>
        </>
      )}
    </>
  );
}
