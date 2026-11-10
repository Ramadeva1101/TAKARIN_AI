import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { persen, rupiah } from '../lib/api.js';
import { Chip, Galat, Judul, Kartu, Kosong, Muat, Tombol } from '../components/ui.jsx';

export default function Produk() {
  const { data, loading, error, muat } = useApi('/produk');
  return (
    <>
      <Judul judul="Produk" sub="Modal per porsi dan untung setiap menu" aksi={<Tombol to="/produk/baru">Tambah menu</Tombol>} />
      {loading && !data ? (
        <Muat />
      ) : error ? (
        <Galat error={error} ulang={muat} />
      ) : !data.length ? (
        <Kartu>
          <Kosong judul="Belum ada menu" teks="Tambahkan menu beserta bahan dan takarannya." aksi={<Tombol to="/produk/baru">Tambah menu</Tombol>} />
        </Kartu>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <li key={p.id}>
              <Link to={`/produk/${p.id}`} className="block h-full rounded-2xl border border-garis bg-kartu p-4 hover:border-teal">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{p.nama}</p>
                  <Chip status={p.status} />
                </div>
                <dl className="angka mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-redup">Modal</dt>
                    <dd className="font-semibold">{rupiah(p.hpp)}</dd>
                  </div>
                  <div>
                    <dt className="text-redup">Jual</dt>
                    <dd className="font-semibold">{rupiah(p.harga_jual)}</dd>
                  </div>
                  <div>
                    <dt className="text-redup">Untung</dt>
                    <dd className="font-semibold">{persen(p.margin)}</dd>
                  </div>
                </dl>
                {!p.lengkap && <p className="mt-3 text-xs text-redup">Harga belum ada: {p.kurang.map((k) => k.nama ?? k).join(', ')}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
