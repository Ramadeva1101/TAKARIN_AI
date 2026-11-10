import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { api, persen, pesanGalat, rupiah } from '../lib/api.js';
import { Chip, Galat, Judul, Kartu, Muat, Tombol } from '../components/ui.jsx';
import ResepEditor, { cekResep, rapikanResep } from '../components/ResepEditor.jsx';

const SUMBER = { belanja: 'dari belanja', pasar: 'harga pasar', acuan: 'harga pasar' };

function Rincian({ p }) {
  const total = p.hpp || 1;
  const baris = [...p.rincian].sort((a, b) => (b.biaya ?? 0) - (a.biaya ?? 0));
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[30rem] text-sm">
        <thead className="text-left text-redup">
          <tr>
            <th className="py-2 font-medium">Bahan</th>
            <th className="py-2 font-medium">Takaran</th>
            <th className="py-2 text-right font-medium">Biaya/porsi</th>
            <th className="w-24 py-2 pl-3 font-medium">Porsi modal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-garis">
          {baris.map((r) => (
            <tr key={r.bahan_id}>
              <td className="py-2">
                <Link to={`/bahan/${r.bahan_id}`} className="font-medium capitalize hover:text-biru">
                  {r.nama}
                </Link>
                <span className="block text-xs text-redup">{r.biaya == null ? 'harga belum ada' : SUMBER[r.sumber_harga] || r.sumber_harga}</span>
              </td>
              <td className="angka py-2">
                {r.qty} {r.satuan}
                {r.cara_konversi === 'urt' && <span className="block text-xs text-redup">{`≈ ${Math.round(r.qty_dasar_per_porsi)} ${r.satuan_dasar}`}</span>}
              </td>
              <td className="angka py-2 text-right font-semibold">{r.biaya == null ? '–' : rupiah(r.biaya)}</td>
              <td className="py-2 pl-3">
                <div className="h-2 rounded-full bg-dasar" aria-hidden>
                  <div className="h-2 rounded-full bg-biru" style={{ width: `${((r.biaya ?? 0) / total) * 100}%` }} />
                </div>
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-2 font-medium" colSpan={2}>
              Biaya rutin (listrik, sewa, dan lainnya)
            </td>
            <td className="angka py-2 text-right font-semibold">{rupiah(p.biaya_lain)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Simulasi({ p }) {
  const [harga, setHarga] = useState(p.harga_jual);
  const [faktor, setFaktor] = useState({});
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState(null);
  const bahanUtama = [...p.rincian].filter((r) => r.biaya).sort((a, b) => b.biaya - a.biaya).slice(0, 3);

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/produk/${p.id}/simulasi`, { method: 'POST', body: { harga_jual: Number(harga), faktor } })
        .then((r) => {
          setHasil(r.simulasi);
          setGalat(null);
        })
        .catch((e) => setGalat(pesanGalat(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [p.id, harga, faktor]);

  return (
    <Kartu>
      <h2 className="font-semibold">Coba-coba harga</h2>
      <p className="mb-4 text-sm text-redup">Geser untuk melihat untung kalau harga jual atau harga bahan berubah. Tidak disimpan.</p>
      <label className="block text-sm font-medium" htmlFor="sim-harga">
        Harga jual: <span className="angka">{rupiah(harga)}</span>
      </label>
      <input
        id="sim-harga"
        type="range"
        min={Math.max(500, Math.round((p.hpp || p.harga_jual) / 500) * 500)}
        max={Math.round((p.harga_jual * 1.6) / 500) * 500}
        step="500"
        value={harga}
        onChange={(e) => setHarga(Number(e.target.value))}
        className="mt-2 h-11 w-full accent-biru"
      />
      {bahanUtama.map((b) => {
        const f = faktor[b.bahan_id] ?? 1;
        return (
          <div key={b.bahan_id} className="mt-2">
            <label className="block text-sm font-medium capitalize" htmlFor={`sim-${b.bahan_id}`}>
              Harga {b.nama}: <span className="angka">{f === 1 ? 'tetap' : `${f > 1 ? 'naik' : 'turun'} ${Math.round(Math.abs(f - 1) * 100)}%`}</span>
            </label>
            <input
              id={`sim-${b.bahan_id}`}
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={f}
              onChange={(e) => setFaktor({ ...faktor, [b.bahan_id]: Number(e.target.value) })}
              className="h-11 w-full accent-biru"
            />
          </div>
        );
      })}
      <div className="tepi-nota mt-4 grid grid-cols-3 gap-2 pt-4 text-sm" aria-live="polite">
        <div>
          <p className="text-redup">Modal</p>
          <p className="angka text-lg font-bold">{rupiah(hasil?.hpp ?? p.hpp)}</p>
        </div>
        <div>
          <p className="text-redup">Untung</p>
          <p className="angka text-lg font-bold">{persen(hasil?.margin ?? p.margin)}</p>
        </div>
        <div>
          <p className="text-redup">Rp per porsi</p>
          <p className="angka text-lg font-bold">{rupiah(harga - (hasil?.hpp ?? p.hpp))}</p>
        </div>
      </div>
      {hasil && (
        <div className="mt-3">
          <Chip status={hasil.status} />
        </div>
      )}
      {galat && <p className="mt-2 text-sm text-rugi">{galat}</p>}
    </Kartu>
  );
}

function Rekomendasi({ id, onTerapkan }) {
  const { data, loading, error, muat } = useApi(`/produk/${id}/rekomendasi`);
  if (loading && !data) return <Muat teks="Menyusun penjelasan" />;
  if (error) return <Galat error={error} ulang={muat} />;
  return (
    <Kartu className="bg-kuning-muda">
      <h2 className="font-semibold">Penjelasan</h2>
      <p className="mt-2 text-sm leading-relaxed">{data.penjelasan}</p>
      {data.opsi?.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {data.opsi.map((o) => (
            <li key={o.judul} className="rounded-xl border border-garis bg-kartu p-3">
              <p className="text-sm font-semibold">{o.judul}</p>
              <p className="angka mt-1 text-xs text-redup">
                Modal {rupiah(o.hpp)}, jual {rupiah(o.harga_jual)}, untung {persen(o.margin)}
              </p>
              {o.jenis === 'naik_harga' && (
                <Tombol varian="garis" className="mt-2" onClick={() => onTerapkan(o.harga_jual)}>
                  Pakai harga {rupiah(o.harga_jual)}
                </Tombol>
              )}
            </li>
          ))}
        </ul>
      )}
    </Kartu>
  );
}

export default function ProdukDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: p, loading, error, muat } = useApi(`/produk/${id}`);
  const [edit, setEdit] = useState(null);
  const [galat, setGalat] = useState(null);
  const [versi, setVersi] = useState(0);

  if (loading && !p) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;

  const simpan = async (body) => {
    setGalat(null);
    try {
      await api(`/produk/${id}`, { method: 'PUT', body });
      setEdit(null);
      await muat();
      setVersi((v) => v + 1);
    } catch (err) {
      setGalat(pesanGalat(err));
    }
  };

  const hapus = async () => {
    if (!window.confirm(`Hapus menu ${p.nama}? Resepnya ikut terhapus.`)) return;
    try {
      await api(`/produk/${id}`, { method: 'DELETE' });
      nav('/produk', { replace: true });
    } catch (err) {
      setGalat(pesanGalat(err));
    }
  };

  return (
    <>
      <Judul
        judul={p.nama}
        kembali="/produk"
        aksi={
          !edit && (
            <>
              <Tombol varian="garis" onClick={() => setEdit({ nama: p.nama, harga_jual: p.harga_jual, porsi_per_batch: p.porsi_per_batch, bahan: p.resep.map((r) => ({ bahan_id: r.bahan_id, nama: r.nama, qty: r.qty, satuan: r.satuan })) })}>
                Ubah resep
              </Tombol>
              <Tombol varian="bahaya" onClick={hapus}>
                Hapus
              </Tombol>
            </>
          )
        }
      />
      {galat && (
        <p role="alert" className="mb-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
          {galat}
        </p>
      )}

      {edit ? (
        <Kartu>
          <ResepEditor value={edit} onChange={setEdit} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Tombol
              onClick={() => {
                const d = rapikanResep(edit);
                const m = cekResep(d);
                m ? setGalat(m) : simpan(d);
              }}
            >
              Simpan resep
            </Tombol>
            <Tombol varian="garis" onClick={() => setEdit(null)}>
              Batal
            </Tombol>
          </div>
        </Kartu>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-[20px] border border-garis bg-kartu shadow-kartu p-4">
              <p className="text-sm text-redup">Modal per porsi</p>
              <p className="angka mt-1 text-2xl font-bold">{rupiah(p.hpp)}</p>
            </div>
            <div className="rounded-[20px] border border-garis bg-kartu shadow-kartu p-4">
              <p className="text-sm text-redup">Harga jual</p>
              <p className="angka mt-1 text-2xl font-bold">{rupiah(p.harga_jual)}</p>
            </div>
            <div className="rounded-2xl border border-garis bg-kuning-muda p-4">
              <p className="text-sm text-redup">Untung</p>
              <p className="angka mt-1 text-2xl font-bold">{persen(p.margin)}</p>
              <p className="mt-1 text-xs text-redup">Target {persen(p.target_margin)}</p>
            </div>
            <div className="rounded-[20px] border border-garis bg-kartu shadow-kartu p-4">
              <p className="text-sm text-redup">Harga aman</p>
              <p className="angka mt-1 text-2xl font-bold">{rupiah(p.harga_aman)}</p>
              <div className="mt-1">
                <Chip status={p.status} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <Kartu className="lg:col-span-3">
              <h2 className="mb-1 font-semibold">Rincian modal per porsi</h2>
              {p.porsi_per_batch > 1 && <p className="mb-2 text-sm text-redup">Resep untuk {p.porsi_per_batch} porsi, dibagi rata.</p>}
              <Rincian p={p} />
            </Kartu>
            <div className="flex flex-col gap-4 lg:col-span-2">
              <Rekomendasi key={versi} id={id} onTerapkan={(harga) => simpan({ harga_jual: harga })} />
            </div>
          </div>
          <div className="mt-4">
            <Simulasi key={`${versi}-${p.harga_jual}`} p={p} />
          </div>
        </>
      )}
    </>
  );
}
