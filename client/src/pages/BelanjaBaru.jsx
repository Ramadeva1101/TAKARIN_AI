import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { Camera, Images, Microphone, TextAa, PencilSimple } from '@phosphor-icons/react';
import { api, pesanGalat } from '../lib/api.js';
import { Field, InputRupiah, Judul, Kartu, Tombol, inputCls } from '../components/ui.jsx';
import Dikte from '../components/Dikte.jsx';

const CARA = [
  { id: 'foto', label: 'Foto nota', ikon: Camera },
  { id: 'suara', label: 'Ucapkan', ikon: Microphone },
  { id: 'teks', label: 'Ketik', ikon: TextAa },
  { id: 'manual', label: 'Isi tabel', ikon: PencilSimple },
];

function Foto({ kirim, proses }) {
  const [file, setFile] = useState(null);
  const [pratinjau, setPratinjau] = useState(null);
  const [seret, setSeret] = useState(false);
  const [salah, setSalah] = useState(null);
  useEffect(() => () => pratinjau && URL.revokeObjectURL(pratinjau), [pratinjau]);
  const pakai = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setSalah('Berkas ini bukan gambar. Pilih foto nota berformat JPG, PNG, atau WEBP.');
      return;
    }
    setSalah(null);
    setFile(f);
    setPratinjau(URL.createObjectURL(f));
  };
  const pilih = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    pakai(f);
  };
  // Di laptop, foto nota bisa diseret langsung ke kotak pilihan.
  const lepas = (e) => {
    e.preventDefault();
    setSeret(false);
    pakai(e.dataTransfer.files?.[0]);
  };
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setSeret(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setSeret(false)}
      onDrop={lepas}
    >
      <p className="text-sm text-redup">Foto nota dari atas, terang, dan seluruh baris terlihat. Hasil bacaan bisa Anda periksa sebelum disimpan.</p>
      {pratinjau && <img src={pratinjau} alt="Pratinjau nota" className="mt-4 max-h-72 rounded-lg border border-garis object-contain" />}
      {/* Dua pilihan: "capture" langsung membuka kamera di HP, tanpanya HP menawarkan galeri dan berkas. */}
      <div className={`mt-4 grid gap-2 rounded-2xl sm:grid-cols-2 ${seret ? 'outline-2 outline-offset-4 outline-biru outline-dashed' : ''}`}>
        {[
          { label: file ? 'Foto ulang' : 'Ambil foto', ikon: Camera, kamera: true },
          { label: file ? 'Pilih foto lain' : 'Pilih dari galeri', ikon: Images, kamera: false },
        ].map(({ label, ikon: Ikon, kamera }) => (
          <label key={label} className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-garis bg-dasar p-3 text-center hover:border-biru focus-within:border-biru">
            <Ikon size={28} className="text-biru" aria-hidden />
            <span className="text-sm font-semibold text-biru">{seret ? 'Lepaskan foto di sini' : label}</span>
            <input type="file" accept="image/*" {...(kamera ? { capture: 'environment' } : {})} className="sr-only" onChange={pilih} />
          </label>
        ))}
      </div>
      <p className="mt-2 hidden text-xs text-redup sm:block">Foto nota juga bisa diseret ke kotak di atas.</p>
      {salah && (
        <p role="alert" className="mt-2 text-sm text-rugi">
          {salah}
        </p>
      )}
      <Tombol memuat={proses}
        className="mt-4"
        disabled={!file || proses}
        onClick={async () => {
          // Kompres di HP supaya unggah cepat dan hemat kuota.
          const kecil = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true }).catch(() => file);
          const form = new FormData();
          form.append('foto', kecil, file.name || 'nota.jpg');
          kirim('/pembelian/foto', { form });
        }}
      >
        {proses ? 'Membaca nota' : 'Baca nota'}
      </Tombol>
    </div>
  );
}

// Ucapkan belanjaan: suara jadi teks dulu, bisa dikoreksi, lalu dibaca AI.
function Suara({ kirim, proses }) {
  const [teks, setTeks] = useState('');
  return (
    <>
      <p className="text-sm text-redup">Sebutkan belanjaan seperti biasa, misalnya: cabe rawit setengah kilo tiga lima ribu, bawang putih seperempat sepuluh ribu.</p>
      <div className="mt-4">
        <Dikte label="Mulai bicara" onTeks={(t) => setTeks((x) => (x.trim() ? `${x.trim()} ${t}` : t))} />
      </div>
      {teks && (
        <Field className="mt-4" label="Yang terdengar (bisa diperbaiki)" as="textarea" rows={3} value={teks} onChange={(e) => setTeks(e.target.value)} />
      )}
      <Tombol memuat={proses} className="mt-4" disabled={teks.trim().length < 3 || proses} onClick={() => kirim('/pembelian/teks', { body: { teks, sumber: 'suara' } })}>
        {proses ? 'Membaca' : 'Proses ucapan'}
      </Tombol>
    </>
  );
}

function Teks({ kirim, proses }) {
  const [teks, setTeks] = useState('');
  return (
    <>
      <Field
        label="Tulis belanjaan"
        as="textarea"
        rows={5}
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        placeholder={'cabe rawit 1/2 kg 35rb\nbawang putih 1/4 10rb\ngula 2 kilo'}
        hint="Satu bahan per baris. Singkatan seperti rb, goceng, dan ceban bisa dibaca."
      />
      <Tombol memuat={proses} className="mt-4" disabled={teks.trim().length < 3 || proses} onClick={() => kirim('/pembelian/teks', { body: { teks } })}>
        {proses ? 'Membaca' : 'Baca tulisan'}
      </Tombol>
    </>
  );
}

const baris = () => ({ nama_bahan: '', qty: '', satuan: 'kg', harga: '' });

function Manual({ kirim, proses }) {
  const [toko, setToko] = useState('');
  const [item, setItem] = useState([baris()]);
  const set = (i, k, v) => setItem(item.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const isi = item.filter((x) => x.nama_bahan.trim());
  return (
    <>
      <Field label="Nama toko (boleh kosong)" value={toko} onChange={(e) => setToko(e.target.value)} />
      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium">Bahan yang dibeli (harga total per baris)</legend>
        <div className="flex flex-col gap-2">
          {item.map((x, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_5rem_5rem_8rem]">
              <input aria-label={`Bahan ${i + 1}`} placeholder="bawang merah" className={`${inputCls} col-span-2 sm:col-span-1`} value={x.nama_bahan} onChange={(e) => set(i, 'nama_bahan', e.target.value)} />
              <input aria-label={`Jumlah ${i + 1}`} placeholder="1" type="number" min="0" step="any" className={`${inputCls} angka`} value={x.qty} onChange={(e) => set(i, 'qty', e.target.value)} />
              <input aria-label={`Satuan ${i + 1}`} placeholder="kg" className={inputCls} value={x.satuan} onChange={(e) => set(i, 'satuan', e.target.value)} />
              <InputRupiah aria-label={`Harga total ${i + 1}`} placeholder="Rp" className={`${inputCls} angka col-span-2 sm:col-span-1`} value={x.harga} onChange={(e) => set(i, 'harga', e.target.value)} />
            </div>
          ))}
        </div>
        <Tombol varian="hantu" className="mt-2" onClick={() => setItem([...item, baris()])}>
          Tambah baris
        </Tombol>
      </fieldset>
      <Tombol
        className="mt-4"
        disabled={!isi.length || proses}
        onClick={() =>
          kirim('/pembelian/manual', {
            body: {
              nama_toko: toko || null,
              item: isi.map((x) => ({ nama_bahan: x.nama_bahan.trim(), qty: Number(x.qty) || null, satuan: x.satuan || null, harga: Number(x.harga) || null })),
            },
          })
        }
      >
        Lanjut periksa
      </Tombol>
    </>
  );
}

export default function BelanjaBaru() {
  const nav = useNavigate();
  const awal = useSearchParams()[0].get('awal') === '1';
  const [cara, setCara] = useState('foto');
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState(null);

  const kirim = async (path, opsi) => {
    setProses(true);
    setGalat(null);
    try {
      const draf = await api(path, { method: 'POST', ...opsi });
      nav(`/belanja/${draf.id}${awal ? '?awal=1' : ''}`);
    } catch (err) {
      setGalat({ pesan: pesanGalat(err), manual: err.data?.bisa_manual });
      setProses(false);
    }
  };

  const Isi = { foto: Foto, suara: Suara, teks: Teks, manual: Manual }[cara];

  return (
    <>
      <Judul
        judul={awal ? 'Catat belanja terakhir Anda' : 'Catat belanja'}
        sub={awal ? 'Profil usaha sudah tersimpan. Catat belanja bahan terakhir supaya modal menu memakai harga yang Anda bayar.' : 'Pilih cara yang paling mudah. Anda akan memeriksa hasilnya sebelum disimpan.'}
        kembali={awal ? undefined : '/belanja'}
      />
      <div role="tablist" aria-label="Cara mencatat" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CARA.map(({ id, label, ikon: Ikon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={cara === id}
            onClick={() => {
              setCara(id);
              setGalat(null);
            }}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${cara === id ? 'border-biru bg-biru-muda text-biru-tua' : 'border-garis bg-kartu text-redup hover:text-tinta'}`}
          >
            <Ikon size={20} aria-hidden /> {label}
          </button>
        ))}
      </div>
      <Kartu role="tabpanel">
        <Isi kirim={kirim} proses={proses} />
        {galat && (
          <div role="alert" className="mt-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
            <p>{galat.pesan}</p>
            {galat.manual && (
              <button className="mt-1 min-h-11 font-semibold underline" onClick={() => setCara('manual')}>
                Isi tabel manual saja
              </button>
            )}
          </div>
        )}
      </Kartu>
      {awal && (
        <p className="mt-6 text-sm text-redup">
          Nota belanja tidak ada?{' '}
          <Link to="/produk/baru?awal=1" replace className="inline-flex min-h-11 items-center font-semibold text-biru">
            Langsung tambah menu
          </Link>
        </p>
      )}
    </>
  );
}
