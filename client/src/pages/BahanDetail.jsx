import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { api, pesanGalat, rupiah, tanggal } from '../lib/api.js';
import { Chip, Field, Galat, Judul, Kartu, Kosong, Muat, Tombol, hargaSatuan } from '../components/ui.jsx';

function GrafikAcuan({ riwayat, satuan }) {
  if (riwayat.length < 2) return null;
  const nilai = riwayat.map((r) => r.harga);
  const min = Math.min(...nilai) * 0.97;
  const maks = Math.max(...nilai);
  const akhir = riwayat.at(-1);
  return (
    <div>
      <div className="flex h-28 items-end gap-1" role="img" aria-label={`Harga pasar ${riwayat.length} hari terakhir, terakhir ${rupiah(akhir.harga)} per ${satuan}`}>
        {riwayat.map((r) => (
          <div key={r.tanggal} title={`${tanggal(r.tanggal)}: ${rupiah(r.harga)}`} className="flex-1 rounded-t bg-biru/70" style={{ height: `${((r.harga - min) / (maks - min || 1)) * 100}%`, minHeight: 4 }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-redup">
        <span>{tanggal(riwayat[0].tanggal)}</span>
        <span>{tanggal(akhir.tanggal)}</span>
      </div>
    </div>
  );
}

export default function BahanDetail() {
  const { id } = useParams();
  const { data: b, loading, error, muat } = useApi(`/bahan/${id}`);
  const [form, setForm] = useState(null);
  const [konv, setKonv] = useState({ satuan: '', faktor: '' });
  const [pesan, setPesan] = useState(null);
  const semuaBahan = useApi('/bahan');
  const [gabungKe, setGabungKe] = useState('');
  const [galatGabung, setGalatGabung] = useState(null);
  const [proses, setProses] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (b) setForm({ nama: b.nama, satuan_dasar: b.satuan_dasar, komoditas: b.komoditas || '', susut_persen: b.susut_persen });
  }, [b]);

  if (loading && !b) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;
  if (!form) return <Muat />;

  const simpan = async (e) => {
    e.preventDefault();
    setProses('simpan');
    try {
      await api(`/bahan/${id}`, { method: 'PUT', body: { ...form, komoditas: form.komoditas || null, susut_persen: Number(form.susut_persen) } });
      setPesan({ ok: true, teks: 'Tersimpan. Modal menu ikut dihitung ulang.' });
      muat();
    } catch (err) {
      setPesan({ ok: false, teks: pesanGalat(err) });
    } finally {
      setProses(null);
    }
  };

  const tambahKonversi = async (e) => {
    e.preventDefault();
    setProses('konversi');
    try {
      await api(`/bahan/${id}/konversi`, { method: 'POST', body: { satuan: konv.satuan, faktor: Number(konv.faktor) } });
      setKonv({ satuan: '', faktor: '' });
      await muat();
    } catch (err) {
      setPesan({ ok: false, teks: pesanGalat(err) });
    } finally {
      setProses(null);
    }
  };

  // Bahan ganda (misal "cabe" dan "cabai rawit"): pindahkan semua ke satu bahan.
  const kandidatGabung = (semuaBahan.data || []).filter((x) => x.id !== b.id && x.satuan_dasar === b.satuan_dasar);
  const gabung = async () => {
    const ke = kandidatGabung.find((x) => String(x.id) === gabungKe);
    if (!ke) return;
    if (!window.confirm(`Gabungkan "${b.nama}" ke "${ke.nama}"? Riwayat belanja dan resep pindah ke ${ke.nama}, lalu "${b.nama}" dihapus.`)) return;
    setGalatGabung(null);
    setProses('gabung');
    try {
      await api(`/bahan/${b.id}/gabung`, { method: 'POST', body: { ke_id: ke.id } });
      setProses(null);
      nav(`/bahan/${ke.id}`, { replace: true });
    } catch (err) {
      setGalatGabung(pesanGalat(err));
      setProses(null);
    }
  };

  const h = hargaSatuan(b.harga_rata_rata, b.satuan_dasar);
  const sd = { g: 'gram', ml: 'ml', butir: 'butir', pcs: 'pcs' }[b.satuan_dasar];

  return (
    <>
      <Judul judul={<span className="capitalize">{b.nama}</span>} sub={`Dipakai di: ${b.dipakai_di.map((m) => m.nama).join(', ') || 'belum ada menu'}`} kembali="/bahan" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Kartu>
          <h2 className="font-semibold">Harga</h2>
          <p className="angka mt-2 text-2xl font-bold">{h ? `${rupiah(h.harga)}/${h.satuan}` : 'Belum ada'}</p>
          <p className="text-sm text-redup">
            {b.sumber_harga === 'perkiraan'
              ? 'Perkiraan Anda. Diganti otomatis begitu belanja bahan ini dicatat.'
              : 'Rata-rata tertimbang tiga belanja terakhir'}
          </p>
          {b.acuan ? (
            <div className="tepi-nota mt-4 pt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  Pasar {b.acuan.wilayah} ({b.acuan.level}): <span className="angka font-semibold">{`${rupiah(b.acuan.harga)}/${b.acuan.satuan}`}</span>
                </p>
                <Chip status={b.status_acuan} />
              </div>
              <GrafikAcuan riwayat={b.riwayat_acuan || []} satuan={b.acuan.satuan} />
              <p className="mt-2 text-xs text-redup">
                Sumber: {b.acuan.sumber}, {tanggal(b.acuan.tanggal)}
                {b.acuan.kedaluwarsa && ' (lebih dari 7 hari)'}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-redup">Belum ada harga pasar. Isi kolom "Nama di harga pasar" supaya bisa dibandingkan.</p>
          )}
        </Kartu>

        <Kartu>
          <h2 className="mb-3 font-semibold">Riwayat belanja</h2>
          {b.riwayat.length ? (
            <ul className="divide-y divide-garis text-sm">
              {b.riwayat.map((r, i) => {
                const x = hargaSatuan(r.harga_per_satuan, b.satuan_dasar);
                return (
                  <li key={i} className="flex justify-between gap-3 py-2">
                    <span>
                      {tanggal(r.tanggal)}
                      <span className="block text-xs text-redup">{r.nota_id ? r.nama_toko || r.sumber : 'perkiraan Anda'}</span>
                    </span>
                    <span className="angka font-semibold">{`${rupiah(x.harga)}/${x.satuan}`}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Kosong judul="Belum pernah dibeli" teks="Harga diambil dari pasar daerah sampai ada catatan belanja." />
          )}
        </Kartu>

        <Kartu>
          <form onSubmit={simpan}>
            <h2 className="mb-3 font-semibold">Pengaturan bahan</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
              <Field label="Diukur dengan">
                {(fid) => (
                  <select id={fid} className="min-h-11 w-full rounded-xl border border-garis bg-kartu px-3" value={form.satuan_dasar} onChange={(e) => setForm({ ...form, satuan_dasar: e.target.value })}>
                    <option value="g">gram</option>
                    <option value="ml">ml</option>
                    <option value="butir">butir</option>
                    <option value="pcs">dihitung per buah</option>
                  </select>
                )}
              </Field>
              <Field label="Nama di harga pasar" value={form.komoditas} onChange={(e) => setForm({ ...form, komoditas: e.target.value })} hint="Contoh: cabai rawit merah, daging ayam ras" />
              <Field label="Susut (%)" type="number" min="0" max="90" value={form.susut_persen} onChange={(e) => setForm({ ...form, susut_persen: e.target.value })} hint="Bagian yang terbuang, misalnya kulit, tulang, atau batang" />
            </div>
            {pesan && (
              <p role="status" className={`mt-3 text-sm ${pesan.ok ? 'text-aman' : 'text-rugi'}`}>
                {pesan.teks}
              </p>
            )}
            <Tombol type="submit" className="mt-4" memuat={proses === 'simpan'}>
              Simpan
            </Tombol>
          </form>
        </Kartu>

        <Kartu>
          <h2 className="font-semibold">Takaran khusus</h2>
          <p className="mb-3 text-sm text-redup">Untuk satuan seperti ikat, bungkus, atau potong yang beratnya beda tiap warung.</p>
          {Object.keys(b.konversi || {}).length > 0 && (
            <ul className="mb-3 text-sm">
              {Object.entries(b.konversi).map(([s, f]) => (
                <li key={s} className="angka py-1">{`1 ${s} = ${f} ${sd}`}</li>
              ))}
            </ul>
          )}
          <form onSubmit={tambahKonversi} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <Field label="Satuan" value={konv.satuan} onChange={(e) => setKonv({ ...konv, satuan: e.target.value })} placeholder="ikat" />
            <Field label={`Isi (${sd})`} type="number" min="0" step="any" value={konv.faktor} onChange={(e) => setKonv({ ...konv, faktor: e.target.value })} />
            <Tombol type="submit" varian="garis" memuat={proses === 'konversi'} disabled={!konv.satuan || !(Number(konv.faktor) > 0)}>
              Tambah
            </Tombol>
          </form>
          {b.dipakai_di.length > 0 && (
            <p className="mt-4 text-sm">
              Lihat menu:{' '}
              {b.dipakai_di.map((m, i) => (
                <span key={m.id}>
                  {i > 0 && ', '}
                  <Link to={`/produk/${m.id}`} className="inline-block py-2 font-semibold text-biru">
                    {m.nama}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </Kartu>

        {kandidatGabung.length > 0 && (
          <Kartu className="lg:col-span-2">
            <h2 className="font-semibold">Bahan ini tercatat dua kali?</h2>
            <p className="mb-3 text-sm text-redup">Misalnya "cabe" dan "cabai rawit". Gabungkan supaya resep dan belanja memakai satu harga yang sama.</p>
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Gabungkan ke" className="min-w-56 flex-1 sm:max-w-sm">
                {(fid) => (
                  <select id={fid} className="min-h-11 w-full rounded-xl border border-garis bg-kartu px-3 capitalize" value={gabungKe} onChange={(e) => setGabungKe(e.target.value)}>
                    <option value="">Pilih bahan</option>
                    {kandidatGabung.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nama}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Tombol varian="garis" onClick={gabung} memuat={proses === 'gabung'} disabled={!gabungKe}>
                Gabungkan
              </Tombol>
            </div>
            {galatGabung && (
              <p role="alert" className="mt-2 text-sm text-rugi">
                {galatGabung}
              </p>
            )}
          </Kartu>
        )}
      </div>
    </>
  );
}
