import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { api, persen, pesanGalat, rupiah } from '../lib/api.js';
import { Chip, Galat, Judul, Kartu, Muat, Pemutar, Tombol } from '../components/ui.jsx';
import ResepEditor, { cekResep, rapikanResep, umurHari } from '../components/ResepEditor.jsx';
import IsiSatuan, { isiKeServer } from '../components/IsiSatuan.jsx';

const SUMBER = { belanja: 'dari belanja', pasar: 'harga pasar', acuan: 'harga pasar', perkiraan: 'perkiraan Anda' };

// Harga perkiraan yang sudah lama ditandai supaya pemilik ingat mencatat belanja.
const teksSumber = (r) => {
  const t = SUMBER[r.sumber_harga] || r.sumber_harga;
  return r.sumber_harga === 'perkiraan' && umurHari(r.tanggal_harga) > 30 ? `${t}, ${umurHari(r.tanggal_harga)} hari lalu: catat belanja` : t;
};

// Rincian modal: daftar bertumpuk, satu baris per bahan, tanpa geser ke samping di HP.
function Rincian({ p }) {
  const total = p.hpp || 1;
  const baris = [...p.rincian].sort((a, b) => (b.biaya ?? 0) - (a.biaya ?? 0));
  return (
    <div>
      <div className="hidden grid-cols-[minmax(0,1fr)_8rem_6rem_6rem] gap-3 py-2 text-sm text-redup sm:grid">
        <span>Bahan</span>
        <span>Takaran</span>
        <span className="text-right">Biaya/porsi</span>
        <span>Bagian dari modal</span>
      </div>
      <ul className="flex flex-col">
        {baris.map((r) => (
          <li key={r.bahan_id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t border-garis py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_8rem_6rem_6rem]">
            <span className="min-w-0">
              <Link to={`/bahan/${r.bahan_id}`} className="font-medium capitalize hover:text-biru">
                {r.nama}
              </Link>
              <span className="block text-xs text-redup">
                <span className="angka sm:hidden">
                  {r.qty} {r.satuan} ·{' '}
                </span>
                {r.biaya == null ? (r.masalah && r.masalah !== 'Harga belum ada' ? 'isi satuan belum diketahui' : 'harga belum ada') : teksSumber(r)}
              </span>
            </span>
            <span className="angka hidden sm:block">
              {r.qty} {r.satuan}
              {r.cara_konversi === 'urt' && <span className="block text-xs text-redup">{`≈ ${Math.round(r.qty_dasar_per_porsi)} ${r.satuan_dasar}`}</span>}
            </span>
            <span className="angka text-right font-semibold">{r.biaya == null ? '–' : rupiah(r.biaya)}</span>
            <span className="col-span-2 sm:col-span-1">
              <span className="block h-2 rounded-full bg-dasar" aria-hidden>
                <span className="block h-2 rounded-full bg-biru" style={{ width: `${((r.biaya ?? 0) / total) * 100}%` }} />
              </span>
            </span>
          </li>
        ))}
        <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-garis py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_8rem_6rem_6rem]">
          <span className="font-medium sm:col-span-2">Biaya rutin (listrik, sewa, dan lainnya)</span>
          <span className="angka text-right font-semibold">{rupiah(p.biaya_lain)}</span>
        </li>
      </ul>
    </div>
  );
}

function Simulasi({ p }) {
  const [harga, setHarga] = useState(p.harga_jual);
  // Rentang geser: dari sekitar modal sampai 1,6x harga jual (minimal 1,5x modal). Langkah mengikuti besar harga.
  const langkahHarga = p.harga_jual < 5000 ? 100 : p.harga_jual < 20000 ? 250 : 500;
  const bulat = (n) => Math.round(n / langkahHarga) * langkahHarga;
  const batas = {
    min: Math.max(langkahHarga, bulat(Math.min(p.hpp || p.harga_jual, p.harga_jual) * 0.9)),
    max: bulat(Math.max(p.harga_jual * 1.6, (p.hpp || 0) * 1.5)),
    langkah: langkahHarga,
  };
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
        min={batas.min}
        max={batas.max}
        step={batas.langkah}
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
          <p className="angka text-lg font-bold">{p.lengkap ? rupiah(hasil?.hpp ?? p.hpp) : '–'}</p>
        </div>
        <div>
          <p className="text-redup">Untung</p>
          <p className="angka text-lg font-bold">{persen(hasil?.margin ?? p.margin)}</p>
        </div>
        <div>
          <p className="text-redup">Untung per porsi</p>
          {/* Selama ada bahan tanpa harga, untung belum bisa dihitung: jangan tampilkan angka yang terlalu bagus. */}
          <p className="angka text-lg font-bold">{p.lengkap ? rupiah(harga - (hasil?.hpp ?? p.hpp)) : '–'}</p>
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

// Bahan tanpa harga: isi perkiraan harga belinya di sini supaya modal bisa dihitung.
const SATUAN_BELI = { g: ['kg', 'ons', 'gram'], ml: ['liter', 'ml'], butir: ['butir'], pcs: ['pcs'] };

function BarisHarga({ k, satuanDasar, satuanResep, sesudah }) {
  // Bahan per buah dibeli dengan satuan yang sama seperti di resep (potong, bungkus).
  const pilihan = satuanDasar === 'pcs' ? [...new Set([satuanResep, 'buah'].filter(Boolean))] : SATUAN_BELI[satuanDasar] || ['buah'];
  const [f, setF] = useState({ qty: 1, satuan: pilihan[0], harga: '' });
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState(null);
  // Harga yang tidak wajar (misal salah satuan) ditolak server dengan 409 sampai pengguna yakin.
  const [tanya, setTanya] = useState(null);
  const [isi, setIsi] = useState({ jumlah: '', ke: '' });
  const simpanIsi = async () => {
    setProses(true);
    setGalat(null);
    try {
      await api(`/bahan/${k.bahan_id}/isi`, { method: 'POST', body: isiKeServer({ satuan: k.satuan, pilihan: k.pilihan, sisi: 'resep', nilai: isi }) });
      await sesudah();
    } catch (err) {
      setGalat(pesanGalat(err));
      setProses(false);
    }
  };
  const ubahF = (perubahan) => {
    setF({ ...f, ...perubahan });
    setTanya(null);
  };
  const simpan = async (yakin = false) => {
    setProses(true);
    setGalat(null);
    setTanya(null);
    try {
      await api(`/bahan/${k.bahan_id}/harga`, { method: 'POST', body: { qty: Number(f.qty), satuan: f.satuan, harga: Number(f.harga), yakin } });
      await sesudah();
    } catch (err) {
      if (err.status === 409) setTanya(pesanGalat(err));
      else setGalat(pesanGalat(err));
      setProses(false);
    }
  };
  return (
    <li className="rounded-xl bg-kartu p-3">
      <p className="font-semibold capitalize">{k.nama}</p>
      {k.alasan === 'konversi' && k.pilihan?.length ? (
        <div className="mt-2">
          <IsiSatuan nama={k.nama} satuan={k.satuan} pilihan={k.pilihan} sisi="resep" nilai={isi} ubah={setIsi} />
          <Tombol memuat={proses} varian="polos" className="mt-2 w-full" disabled={proses || !(Number(isi.jumlah) > 0)} onClick={simpanIsi}>
            {proses ? 'Menyimpan' : 'Simpan'}
          </Tombol>
          {galat && <p className="mt-1 text-sm text-rugi">{galat}</p>}
        </div>
      ) : k.alasan === 'konversi' ? (
        <p className="mt-1 text-sm text-redup">
          {k.pesan}{' '}
          <Link to={`/bahan/${k.bahan_id}`} className="font-semibold text-biru">
            Atur takarannya
          </Link>
        </p>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-[4.5rem_6rem_minmax(0,1fr)] gap-2">
            <input aria-label={`Jumlah ${k.nama}`} type="number" min="0" step="any" className="angka min-h-11 rounded-lg border border-garis px-2 text-sm" value={f.qty} onChange={(e) => ubahF({ qty: e.target.value })} />
            <select aria-label={`Satuan ${k.nama}`} className="min-h-11 rounded-lg border border-garis px-2 text-sm" value={f.satuan} onChange={(e) => ubahF({ satuan: e.target.value })}>
              {pilihan.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input aria-label={`Harga ${k.nama} (Rp)`} type="number" min="0" inputMode="numeric" placeholder="Harga Rp" className="angka min-h-11 rounded-lg border border-garis px-2 text-sm" value={f.harga} onChange={(e) => ubahF({ harga: e.target.value })} />
            <Tombol memuat={proses} varian="polos" className="col-span-3" disabled={proses || !(Number(f.harga) > 0) || !(Number(f.qty) > 0)} onClick={() => simpan()}>
              {proses ? 'Menyimpan' : 'Simpan'}
            </Tombol>
          </div>
          {tanya && (
            <div role="alert" className="mt-2 rounded-xl bg-kuning-muda px-3 py-2 text-sm">
              <p>{tanya}</p>
              <button type="button" onClick={() => simpan(true)} disabled={proses} aria-busy={proses || undefined} className="mt-1.5 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-garis bg-kartu px-3 text-sm font-semibold sm:min-h-9">
                {proses && <Pemutar size={14} />} Ya, harga ini benar
              </button>
            </div>
          )}
          {galat && <p className="mt-1 text-sm text-rugi">{galat}</p>}
        </>
      )}
    </li>
  );
}

function LengkapiHarga({ p, sesudah }) {
  return (
    <Kartu className="bg-kuning-muda">
      <h2 className="font-semibold">Lengkapi harga bahan</h2>
      <p className="mt-1 text-sm">
        Modal {p.nama} belum bisa dihitung. Lengkapi {p.kurang.length} bahan di bawah: isi harga beli terakhir atau isi satuannya, atau{' '}
        <Link to="/belanja/baru" className="font-semibold text-biru">
          catat belanja
        </Link>{' '}
        untuk harga sebenarnya.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {p.kurang.map((k) => (
          <BarisHarga
            key={`${k.bahan_id}-${k.alasan}`}
            k={k}
            satuanDasar={p.rincian.find((r) => r.bahan_id === k.bahan_id)?.satuan_dasar}
            satuanResep={p.rincian.find((r) => r.bahan_id === k.bahan_id)?.satuan}
            sesudah={sesudah}
          />
        ))}
      </ul>
    </Kartu>
  );
}

function Rekomendasi({ id, onTerapkan, proses }) {
  const [dipilih, setDipilih] = useState(null);
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
                <Tombol
                  varian="garis"
                  className="mt-2"
                  memuat={proses && dipilih === o.harga_jual}
                  disabled={proses}
                  onClick={() => {
                    setDipilih(o.harga_jual);
                    onTerapkan(o.harga_jual);
                  }}
                >
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
  const [proses, setProses] = useState(false);
  const [menghapus, setMenghapus] = useState(false);

  if (loading && !p) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;

  const simpan = async (body) => {
    setGalat(null);
    setProses(true);
    try {
      await api(`/produk/${id}`, { method: 'PUT', body });
      setEdit(null);
      await muat();
      setVersi((v) => v + 1);
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setProses(false);
    }
  };

  // Simpan resep hasil ubah. Pesan masalah tampil tepat di atas tombol, bukan di atas halaman.
  const simpanResep = () => {
    const d = rapikanResep(edit);
    const m = cekResep(d, edit);
    if (m) return setGalat(m);
    simpan(d);
  };

  const tutupEdit = () => {
    setEdit(null);
    setGalat(null);
  };

  const hapus = async () => {
    if (!window.confirm(`Hapus menu ${p.nama}? Resepnya ikut terhapus.`)) return;
    setMenghapus(true);
    try {
      await api(`/produk/${id}`, { method: 'DELETE' });
      nav('/produk', { replace: true });
    } catch (err) {
      setGalat(pesanGalat(err));
      setMenghapus(false);
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
              <Tombol varian="bahaya" onClick={hapus} memuat={menghapus}>
                Hapus
              </Tombol>
            </>
          )
        }
      />
      {galat && !edit && (
        <p role="alert" className="mb-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
          {galat}
        </p>
      )}

      {edit ? (
        <Kartu>
          <ResepEditor value={edit} onChange={setEdit} />
          {galat && (
            <p role="alert" className="mt-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
              {galat}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Tombol memuat={proses} onClick={simpanResep} disabled={proses}>
              {proses ? 'Menyimpan' : 'Simpan resep'}
            </Tombol>
            <Tombol varian="garis" onClick={tutupEdit}>
              Batal
            </Tombol>
          </div>
        </Kartu>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-[20px] border border-garis bg-kartu shadow-kartu p-4">
              <p className="text-sm text-redup">Modal per porsi</p>
              <p className="angka mt-1 text-2xl font-bold">{p.lengkap ? rupiah(p.hpp) : 'Belum lengkap'}</p>
              {!p.lengkap && <p className="angka mt-1 text-xs text-kuning-tua">Sementara {rupiah(p.hpp)}, tanpa {p.kurang.map((k) => k.nama).join(', ')}</p>}
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
              <p className="text-sm text-redup">Harga minimal</p>
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
              {p.lengkap ? (
                <Rekomendasi key={versi} id={id} proses={proses} onTerapkan={(harga) => simpan({ harga_jual: harga })} />
              ) : (
                <LengkapiHarga
                  p={p}
                  sesudah={async () => {
                    await muat();
                    setVersi((v) => v + 1);
                  }}
                />
              )}
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
