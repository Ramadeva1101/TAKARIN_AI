import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { rupiah, tanggal } from '../lib/api.js';
import { Galat, Judul, Kartu, Kosong, Muat, Tombol } from '../components/ui.jsx';

const SUMBER = { foto: 'Foto nota', suara: 'Suara', teks: 'Ketik', manual: 'Manual' };

export default function Belanja() {
  const { data, loading, error, muat } = useApi('/pembelian');
  return (
    <>
      <Judul judul="Belanja bahan" sub="Setiap belanja memperbarui harga bahan dan modal menu" aksi={<Tombol to="/belanja/baru">Catat belanja</Tombol>} />
      {loading && !data ? (
        <Muat />
      ) : error ? (
        <Galat error={error} ulang={muat} />
      ) : (
        <Kartu>
          {!data.length ? (
            <Kosong judul="Belum ada belanja" teks="Foto nota, ucapkan, atau ketik belanjaan pertama Anda." aksi={<Tombol to="/belanja/baru">Catat belanja</Tombol>} />
          ) : (
            <ul className="divide-y divide-garis">
              {data.map((n) => (
                <li key={n.id}>
                  <Link to={`/belanja/${n.id}`} className="flex min-h-14 items-center justify-between gap-3 py-3 hover:text-teal">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{n.nama_toko || 'Tanpa nama toko'}</p>
                      <p className="text-sm text-redup">
                        {tanggal(n.tanggal)} · {SUMBER[n.sumber] || n.sumber} · {n.jumlah_item} bahan
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="angka font-semibold">{rupiah(n.total)}</p>
                      {n.status === 'draf' && <p className="text-xs font-semibold text-waspada">Belum dicek</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      )}
    </>
  );
}
