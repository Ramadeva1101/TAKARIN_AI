import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from '@phosphor-icons/react';
import { api, pesanGalat } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { contohCerita } from '../lib/jenis.js';
import { Field, Judul, Kartu, Tombol } from '../components/ui.jsx';
import { Segmen } from '../components/Grafik.jsx';
import ResepEditor, { cekResep, rapikanResep, resepKosong } from '../components/ResepEditor.jsx';
import Dikte from '../components/Dikte.jsx';

export default function ProdukBaru() {
  const nav = useNavigate();
  const [cari] = useSearchParams();
  const awal = cari.get('awal') === '1';
  const { usaha } = useAuth();
  const [cara, setCara] = useState('cerita');
  const [cerita, setCerita] = useState('');
  const [daftar, setDaftar] = useState(null); // hasil susunan AI, bisa lebih dari satu menu
  const [pertanyaan, setPertanyaan] = useState([]);
  const [resep, setResep] = useState(resepKosong());
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);
  const contoh = contohCerita(usaha?.jenis);

  const susun = async () => {
    setProses(true);
    setGalat(null);
    try {
      const d = await api('/usaha/cerita', { method: 'POST', body: { teks: cerita } });
      if (!d.produk?.length) throw new Error('Tidak ada menu yang terbaca dari cerita. Sebutkan nama menu dan bahannya');
      setDaftar(d.produk.map((p) => ({ ...p, harga_jual: p.harga_jual ?? '', bahan: p.bahan.length ? p.bahan.map((b) => ({ ...b, qty: b.qty ?? '' })) : resepKosong().bahan })));
      setPertanyaan(d.pertanyaan || []);
    } catch (err) {
      setGalat(`${pesanGalat(err)}. Anda tetap bisa mengisi manual.`);
    } finally {
      setProses(false);
    }
  };

  const simpan = async (e) => {
    e.preventDefault();
    if (cara === 'cerita' && !daftar) return;
    const mentah = cara === 'cerita' && daftar ? daftar : [resep];
    const semua = mentah.map(rapikanResep);
    const masalah = semua.map((r, i) => cekResep(r, mentah[i])).find(Boolean);
    if (masalah) return setGalat(masalah);
    setProses(true);
    setGalat(null);
    try {
      const tersimpan = [];
      try {
        for (const data of semua) tersimpan.push(await api('/produk', { method: 'POST', body: data }));
      } catch (err) {
        // Menu yang sudah tersimpan dikeluarkan dari daftar supaya tidak tersimpan dua kali saat dicoba lagi.
        if (tersimpan.length && daftar) setDaftar(daftar.slice(tersimpan.length));
        throw new Error(`${tersimpan.length ? `${tersimpan.length} menu sudah tersimpan. ` : ''}${pesanGalat(err)}`);
      }
      nav(tersimpan.length === 1 ? `/produk/${tersimpan[0].id}` : '/', { replace: true });
    } catch (err) {
      setGalat(err.message);
      setProses(false);
    }
  };

  const tombolSimpan = (
    <Tombol memuat={proses} type="submit" className="mt-4" disabled={proses}>
      {proses ? 'Menyimpan' : daftar && cara === 'cerita' && daftar.length > 1 ? `Simpan ${daftar.length} menu` : 'Simpan menu'}
    </Tombol>
  );

  return (
    <form onSubmit={simpan} noValidate>
      <Judul
        judul={awal ? 'Tambahkan menu pertama' : 'Tambah menu'}
        sub={awal ? `Profil ${usaha?.nama ?? 'usaha'} sudah tersimpan. Sekarang ceritakan satu atau beberapa menu, modal per porsinya langsung dihitung.` : 'Modal per porsi dihitung dari harga belanja terakhir atau harga pasar daerah.'}
        kembali={awal ? undefined : '/produk'}
      />
      <Segmen
        label="Cara menambah menu"
        pilihan={[
          ['cerita', 'Ceritakan atau ucapkan'],
          ['manual', 'Isi manual'],
        ]}
        nilai={cara}
        ubah={(c) => {
          setCara(c);
          setGalat(null);
        }}
      />

      {cara === 'cerita' && !daftar && (
        <Kartu className="mt-4">
          <Dikte
            label="Ucapkan menu"
            onTeks={(t) => setCerita((c) => (c.trim() ? `${c.trim()} ${t}` : t))}
          />
          <div className="my-4 flex items-center gap-3 text-xs text-redup" aria-hidden>
            <span className="h-px flex-1 bg-garis" /> atau ketik <span className="h-px flex-1 bg-garis" />
          </div>
          <Field
            label="Cerita menu"
            as="textarea"
            rows={6}
            value={cerita}
            onChange={(e) => setCerita(e.target.value)}
            placeholder={contoh}
            hint="Sebutkan nama menu, harga jual per porsi, serta bahan dan takarannya. Takaran sdm, siung, atau potong bisa dipakai."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Tombol memuat={proses} onClick={susun} disabled={proses || cerita.trim().length < 10}>
              {proses ? 'Menyusun resep' : 'Susun resep'}
            </Tombol>
            <Tombol varian="garis" onClick={() => setCerita(contoh)}>
              Pakai contoh
            </Tombol>
          </div>
        </Kartu>
      )}

      {cara === 'cerita' && daftar && (
        <>
          <p className="mt-4 text-sm text-redup">AI menyusun {daftar.length} menu dari cerita Anda. Periksa takaran dan harga jualnya sebelum disimpan.</p>
          {pertanyaan.length > 0 && (
            <div className="mt-3 rounded-2xl bg-waspada-muda p-4 text-sm text-waspada">
              <p className="font-semibold">Belum disebut di cerita:</p>
              <ul className="mt-1 list-disc pl-5">
                {pertanyaan.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {daftar.map((p, i) => (
            <Kartu key={i} className="mt-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Menu {i + 1}</h2>
                {daftar.length > 1 && (
                  <Tombol varian="bahaya" onClick={() => setDaftar((d) => d.filter((_, j) => j !== i))}>
                    Hapus menu
                  </Tombol>
                )}
              </div>
              <ResepEditor judul={`m${i}`} value={p} onChange={(v) => setDaftar((d) => d.map((x, j) => (j === i ? v : x)))} />
            </Kartu>
          ))}
          <div className="mt-3 flex flex-wrap gap-2">
            <Tombol varian="garis" onClick={() => setDaftar([...daftar, resepKosong()])}>
              <Plus size={16} weight="bold" aria-hidden /> Tambah menu lain
            </Tombol>
            <Tombol varian="hantu" onClick={() => setDaftar(null)}>
              Ubah cerita
            </Tombol>
          </div>
        </>
      )}

      {cara === 'manual' && (
        <Kartu className="mt-4">
          <ResepEditor value={resep} onChange={setResep} />
        </Kartu>
      )}

      {galat && (
        <p role="alert" className="mt-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
          {galat}
        </p>
      )}
      {(cara === 'manual' || daftar) && tombolSimpan}
      {awal && (
        <p className="mt-6 text-sm text-redup">
          Belum siap?{' '}
          <button type="button" onClick={() => nav('/', { replace: true })} className="min-h-11 font-semibold text-biru">
            Lihat ringkasan dulu
          </button>
        </p>
      )}
    </form>
  );
}
