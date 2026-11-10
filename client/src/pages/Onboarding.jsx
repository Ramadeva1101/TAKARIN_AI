import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash } from '@phosphor-icons/react';
import { api, pesanGalat } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Field, Kartu, Tombol, inputCls } from '../components/ui.jsx';
import ResepEditor, { cekResep, rapikanResep, resepKosong } from '../components/ResepEditor.jsx';

const CONTOH =
  'Saya jualan ayam geprek 15 ribu. Satu porsi pakai 1 potong ayam, tepung bumbu 50 gram, cabai rawit 20 gram, bawang putih 1 siung, minyak 1 sdm, nasi 100 gram, kertas nasi. Gas habis 11 ribu sehari, listrik 300 ribu sebulan. Sehari laku sekitar 80 porsi.';

export default function Onboarding() {
  const { user, segarkan, keluar } = useAuth();
  const nav = useNavigate();
  const [tahap, setTahap] = useState('cerita');
  const [cerita, setCerita] = useState('');
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState(null);
  const [pertanyaan, setPertanyaan] = useState([]);
  const [usaha, setUsaha] = useState({ nama: '', jenis: 'warung makan', kota: '', provinsi: '', target_margin: 40, porsi_per_hari: 50 });
  const [produk, setProduk] = useState([resepKosong()]);
  const [biaya, setBiaya] = useState([{ nama: 'gas', nominal: '', periode: 'hari' }]);

  const susun = async () => {
    setProses(true);
    setGalat(null);
    try {
      const d = await api('/usaha/cerita', { method: 'POST', body: { teks: cerita } });
      if (d.porsi_per_hari) setUsaha((u) => ({ ...u, porsi_per_hari: d.porsi_per_hari }));
      if (d.produk?.length) setProduk(d.produk.map((p) => ({ ...p, harga_jual: p.harga_jual ?? '', bahan: p.bahan.length ? p.bahan : resepKosong().bahan })));
      if (d.biaya?.length) setBiaya(d.biaya);
      setPertanyaan(d.pertanyaan || []);
      setTahap('cek');
    } catch (err) {
      setGalat(`${pesanGalat(err)}. Anda tetap bisa mengisi manual.`);
    } finally {
      setProses(false);
    }
  };

  const simpan = async (e) => {
    e.preventDefault();
    const daftarProduk = produk.map(rapikanResep);
    const masalah = !usaha.nama.trim() ? 'Nama usaha belum diisi' : daftarProduk.map(cekResep).find(Boolean);
    if (masalah) return setGalat(masalah);
    setProses(true);
    setGalat(null);
    try {
      await api('/usaha/setup', {
        method: 'POST',
        body: {
          usaha: { ...usaha, target_margin: Number(usaha.target_margin) / 100, porsi_per_hari: Number(usaha.porsi_per_hari) },
          produk: daftarProduk,
          biaya: biaya.filter((b) => b.nama.trim() && Number(b.nominal) > 0).map((b) => ({ ...b, nominal: Number(b.nominal) })),
        },
      });
      await segarkan();
      nav('/', { replace: true });
    } catch (err) {
      setGalat(pesanGalat(err));
      setProses(false);
    }
  };

  const u = (k) => (e) => setUsaha({ ...usaha, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-8 flex items-center justify-between gap-3">
        <p className="font-bold text-teal">Dapur Untung</p>
        <Tombol varian="hantu" onClick={keluar}>
          Keluar
        </Tombol>
      </div>

      {tahap === 'cerita' ? (
        <>
          <h1 className="text-2xl font-bold">Halo {user?.nama}, ceritakan usaha Anda</h1>
          <p className="mt-2 text-redup">
            Tulis seperti bercerita: menu apa saja, harga jualnya, bahan dan takaran per porsi, biaya gas atau listrik. Takaran rumah tangga seperti sdm atau siung boleh.
          </p>
          <Kartu className="mt-6">
            <Field label="Cerita usaha" as="textarea" rows={7} value={cerita} onChange={(e) => setCerita(e.target.value)} placeholder={CONTOH} />
            {galat && (
              <p role="alert" className="mt-3 text-sm text-rugi">
                {galat}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Tombol onClick={susun} disabled={proses || cerita.trim().length < 10}>
                {proses ? 'Menyusun resep' : 'Susun dari cerita'}
              </Tombol>
              <Tombol varian="garis" onClick={() => setCerita(CONTOH)}>
                Pakai contoh
              </Tombol>
              <Tombol varian="hantu" onClick={() => setTahap('cek')}>
                Isi manual saja
              </Tombol>
            </div>
          </Kartu>
        </>
      ) : (
        <form onSubmit={simpan} noValidate>
          <h1 className="text-2xl font-bold">Periksa data usaha</h1>
          <p className="mt-2 text-redup">Ubah yang kurang tepat. Semua bisa diganti lagi nanti.</p>

          {pertanyaan.length > 0 && (
            <div className="mt-5 rounded-2xl bg-waspada-muda p-4 text-sm text-waspada">
              <p className="font-semibold">Yang belum jelas dari cerita:</p>
              <ul className="mt-1 list-disc pl-5">
                {pertanyaan.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          <Kartu className="mt-5">
            <h2 className="mb-3 font-semibold">Usaha</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nama usaha" value={usaha.nama} onChange={u('nama')} />
              <Field label="Jenis" value={usaha.jenis} onChange={u('jenis')} />
              <Field label="Kota" value={usaha.kota} onChange={u('kota')} hint="Untuk harga acuan pasar daerah" />
              <Field label="Provinsi" value={usaha.provinsi} onChange={u('provinsi')} />
              <Field label="Target untung (%)" type="number" min="5" max="90" value={usaha.target_margin} onChange={u('target_margin')} hint="Persen dari harga jual" />
              <Field label="Porsi terjual per hari" type="number" min="1" value={usaha.porsi_per_hari} onChange={u('porsi_per_hari')} hint="Untuk membagi biaya gas dan listrik" />
            </div>
          </Kartu>

          {produk.map((p, i) => (
            <Kartu key={i} className="mt-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Menu {i + 1}</h2>
                {produk.length > 1 && (
                  <Tombol varian="bahaya" onClick={() => setProduk(produk.filter((_, j) => j !== i))}>
                    Hapus menu
                  </Tombol>
                )}
              </div>
              <ResepEditor judul={`m${i}`} value={p} onChange={(v) => setProduk(produk.map((x, j) => (j === i ? v : x)))} />
            </Kartu>
          ))}
          <Tombol varian="garis" className="mt-3" onClick={() => setProduk([...produk, resepKosong()])}>
            <Plus size={16} weight="bold" aria-hidden /> Tambah menu
          </Tombol>

          <Kartu className="mt-4">
            <h2 className="font-semibold">Biaya lain</h2>
            <p className="mb-3 text-sm text-redup">Gas, listrik, sewa. Dibagi rata ke setiap porsi.</p>
            <div className="flex flex-col gap-2">
              {biaya.map((b, i) => (
                <BarisBiaya key={i} b={b} i={i} ubah={(v) => setBiaya(biaya.map((x, j) => (j === i ? v : x)))} hapus={() => setBiaya(biaya.filter((_, j) => j !== i))} />
              ))}
            </div>
            <Tombol varian="hantu" className="mt-2" onClick={() => setBiaya([...biaya, { nama: '', nominal: '', periode: 'bulan' }])}>
              <Plus size={16} weight="bold" aria-hidden /> Tambah biaya
            </Tombol>
          </Kartu>

          {galat && (
            <p role="alert" className="mt-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
              {galat}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Tombol type="submit" disabled={proses}>
              {proses ? 'Menyimpan' : 'Simpan dan hitung modal'}
            </Tombol>
            <Tombol varian="garis" onClick={() => setTahap('cerita')}>
              Kembali ke cerita
            </Tombol>
          </div>
        </form>
      )}
    </div>
  );
}

export function BarisBiaya({ b, i, ubah, hapus }) {
  return (
    <div className="grid grid-cols-[1fr_6.5rem_6rem_2.75rem] items-center gap-2">
      <input aria-label={`Nama biaya ${i + 1}`} placeholder="listrik" className={inputCls} value={b.nama} onChange={(e) => ubah({ ...b, nama: e.target.value })} />
      <input aria-label={`Nominal biaya ${i + 1}`} placeholder="Rp" type="number" min="0" inputMode="numeric" className={`${inputCls} angka`} value={b.nominal} onChange={(e) => ubah({ ...b, nominal: e.target.value })} />
      <select aria-label={`Periode biaya ${i + 1}`} className={inputCls} value={b.periode} onChange={(e) => ubah({ ...b, periode: e.target.value })}>
        <option value="porsi">/porsi</option>
        <option value="hari">/hari</option>
        <option value="bulan">/bulan</option>
      </select>
      <button type="button" aria-label={`Hapus biaya ${b.nama || i + 1}`} onClick={hapus} className="flex size-11 items-center justify-center rounded-lg text-redup hover:bg-rugi-muda hover:text-rugi">
        <Trash size={18} aria-hidden />
      </button>
    </div>
  );
}
