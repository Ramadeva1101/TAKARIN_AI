import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { persen, rupiah } from '../lib/api.js';
import { Chip, Galat, Judul, Kartu, Kosong, Muat, Tombol, hargaSatuan, inputCls } from '../components/ui.jsx';

export default function Bahan() {
  const { data, loading, error, muat } = useApi('/bahan');
  const [cari, setCari] = useState('');
  const daftar = (data || []).filter((b) => b.nama.toLowerCase().includes(cari.toLowerCase()));

  return (
    <>
      <Judul judul="Bahan baku" sub="Harga rata-rata dari tiga belanja terakhir, dibanding harga pasar daerah" />
      {loading && !data ? (
        <Muat />
      ) : error ? (
        <Galat error={error} ulang={muat} />
      ) : !data.length ? (
        <Kartu>
          <Kosong judul="Belum ada bahan" teks="Bahan muncul dari resep menu dan catatan belanja." aksi={<Tombol to="/belanja/baru">Catat belanja</Tombol>} />
        </Kartu>
      ) : (
        <Kartu>
          <label className="sr-only" htmlFor="cari-bahan">
            Cari bahan
          </label>
          <input id="cari-bahan" type="search" placeholder="Cari bahan" className={`${inputCls} mb-3 max-w-xs`} value={cari} onChange={(e) => setCari(e.target.value)} />
          {!daftar.length ? (
            <p className="py-6 text-sm text-redup">Tidak ada bahan bernama "{cari}".</p>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="text-left text-redup">
                  <tr>
                    <th className="py-2 font-medium">Bahan</th>
                    <th className="py-2 text-right font-medium">Harga dipakai</th>
                    <th className="py-2 text-right font-medium">Perubahan</th>
                    <th className="py-2 text-right font-medium">Pasar</th>
                    <th className="py-2 pl-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-garis">
                  {daftar.map((b) => {
                    const h = hargaSatuan(b.harga_rata_rata, b.satuan_dasar);
                    return (
                      <tr key={b.id}>
                        <td className="py-2">
                          <Link to={`/bahan/${b.id}`} className="inline-block min-h-11 py-2 font-medium capitalize hover:text-teal">
                            {b.nama}
                          </Link>
                          <span className="block text-xs text-redup">{b.dipakai_di.map((m) => m.nama).join(', ') || 'Belum dipakai di menu'}</span>
                        </td>
                        <td className="angka py-2 text-right">{h ? `${rupiah(h.harga)}/${h.satuan}` : <span className="text-redup">belum ada</span>}</td>
                        <td className={`angka py-2 text-right ${b.perubahan > 0 ? 'text-rugi' : b.perubahan < 0 ? 'text-aman' : ''}`}>
                          {b.perubahan ? `${b.perubahan > 0 ? '+' : ''}${persen(b.perubahan, 1)}` : '–'}
                        </td>
                        <td className="angka py-2 text-right">{b.acuan ? `${rupiah(b.acuan.harga)}/${b.acuan.satuan}` : '–'}</td>
                        <td className="py-2 pl-3">
                          <Chip status={b.status_acuan} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Kartu>
      )}
    </>
  );
}
