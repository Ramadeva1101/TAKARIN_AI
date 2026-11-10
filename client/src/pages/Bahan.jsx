import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { persen, rupiah } from '../lib/api.js';
import { Chip, Galat, Judul, Kartu, Kosong, Muat, Tombol, hargaSatuan, inputCls } from '../components/ui.jsx';

// Alasan sebuah bahan perlu dilihat. Urutan = urutan pentingnya.
function alasan(b) {
  const a = [];
  if (b.harga_rata_rata == null && !b.acuan) a.push({ status: 'belum_lengkap', teks: 'Harga belum ada' });
  if (b.perubahan > 0.02) a.push({ status: 'rugi', teks: `Naik ${persen(b.perubahan)} dari belanja sebelumnya` });
  if (b.harga_terakhir && (b.status_acuan === 'di_atas' || b.status_acuan === 'jauh_di_atas')) a.push({ status: b.status_acuan, teks: `${persen(b.selisih_acuan)} di atas harga pasar` });
  return a;
}

function Baris({ b }) {
  const h = hargaSatuan(b.harga_rata_rata ?? b.acuan?.harga_per_satuan_dasar, b.satuan_dasar);
  const utama = b.kontribusi[0];
  const masalah = alasan(b);
  return (
    <li>
      <Link to={`/bahan/${b.id}`} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3 hover:text-teal">
        <div className="min-w-0 flex-1">
          <p className="font-semibold capitalize">{b.nama}</p>
          {utama ? (
            <p className="angka text-sm text-redup">
              {rupiah(utama.biaya)} per porsi {utama.nama}, {persen(utama.bagian)} dari modalnya
              {b.kontribusi.length > 1 && `, juga di ${b.kontribusi.length - 1} menu lain`}
            </p>
          ) : (
            <p className="text-sm text-redup">Belum dipakai di menu</p>
          )}
          {masalah.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {masalah.map((m) => (
                <Chip key={m.teks} status={m.status}>
                  {m.teks}
                </Chip>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="angka font-semibold">{h ? `${rupiah(h.harga)}/${h.satuan}` : '–'}</p>
          <p className="text-xs text-redup">{b.harga_rata_rata != null ? `dari ${b.jumlah_pembelian} belanja` : b.acuan ? 'harga pasar' : ''}</p>
        </div>
      </Link>
    </li>
  );
}

export default function Bahan() {
  const { data, loading, error, muat } = useApi('/bahan');
  const [cari, setCari] = useState('');

  if (loading && !data) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;

  const cocok = data.filter((b) => b.nama.toLowerCase().includes(cari.toLowerCase())).sort((a, b) => b.bagian_terbesar - a.bagian_terbesar);
  const perlu = cocok.filter((b) => alasan(b).length);
  const aman = cocok.filter((b) => !alasan(b).length);

  return (
    <>
      <Judul judul="Bahan baku" sub="Diurutkan dari yang paling besar pengaruhnya ke modal menu" aksi={<Tombol varian="garis" to="/belanja">Riwayat belanja</Tombol>} />
      {!data.length ? (
        <Kartu>
          <Kosong judul="Belum ada bahan" teks="Bahan muncul dari resep menu dan catatan belanja." aksi={<Tombol to="/belanja/baru">Catat belanja</Tombol>} />
        </Kartu>
      ) : (
        <>
          <label className="sr-only" htmlFor="cari-bahan">
            Cari bahan
          </label>
          <input id="cari-bahan" type="search" placeholder="Cari bahan" className={`${inputCls} mb-4 max-w-xs bg-kartu`} value={cari} onChange={(e) => setCari(e.target.value)} />
          {!cocok.length && <p className="py-6 text-sm text-redup">Tidak ada bahan bernama "{cari}".</p>}
          {perlu.length > 0 && (
            <Kartu className="mb-4 border-waspada/40">
              <h2 className="font-semibold">Perlu dilihat ({perlu.length})</h2>
              <ul className="divide-y divide-garis">
                {perlu.map((b) => (
                  <Baris key={b.id} b={b} />
                ))}
              </ul>
            </Kartu>
          )}
          {aman.length > 0 && (
            <Kartu>
              <h2 className="font-semibold">Harga wajar ({aman.length})</h2>
              <ul className="divide-y divide-garis">
                {aman.map((b) => (
                  <Baris key={b.id} b={b} />
                ))}
              </ul>
            </Kartu>
          )}
        </>
      )}
    </>
  );
}
