import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { Camera, Microphone, TextAa, PencilSimple, Stop } from '@phosphor-icons/react';
import { api, pesanGalat } from '../lib/api.js';
import { Field, Judul, Kartu, Tombol, inputCls } from '../components/ui.jsx';

const CARA = [
  { id: 'foto', label: 'Foto nota', ikon: Camera },
  { id: 'suara', label: 'Ucapkan', ikon: Microphone },
  { id: 'teks', label: 'Ketik', ikon: TextAa },
  { id: 'manual', label: 'Isi tabel', ikon: PencilSimple },
];

function Foto({ kirim, proses }) {
  const [file, setFile] = useState(null);
  const [pratinjau, setPratinjau] = useState(null);
  useEffect(() => () => pratinjau && URL.revokeObjectURL(pratinjau), [pratinjau]);
  return (
    <>
      <p className="text-sm text-redup">Foto nota dari atas, terang, dan seluruh baris terlihat. Hasil bacaan bisa Anda periksa sebelum disimpan.</p>
      <label className="mt-4 flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-garis bg-dasar p-4 text-center hover:border-teal">
        {pratinjau ? <img src={pratinjau} alt="Pratinjau nota" className="max-h-72 rounded-lg object-contain" /> : <Camera size={32} className="text-redup" aria-hidden />}
        <span className="text-sm font-semibold text-teal">{file ? 'Ganti foto' : 'Ambil atau pilih foto nota'}</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setFile(f);
            setPratinjau(URL.createObjectURL(f));
          }}
        />
      </label>
      <Tombol
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
    </>
  );
}

function Putar({ blob }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url ? <audio controls src={url} className="h-11 max-w-full" /> : null;
}

function Suara({ kirim, proses }) {
  const [rekam, setRekam] = useState(false);
  const [blob, setBlob] = useState(null);
  const [galat, setGalat] = useState(null);
  const [detik, setDetik] = useState(0);
  const rec = useRef(null);

  useEffect(() => {
    if (!rekam) return;
    const t = setInterval(() => setDetik((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [rekam]);

  const mulai = async () => {
    setGalat(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const potong = [];
      r.ondataavailable = (e) => potong.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setBlob(new Blob(potong, { type: r.mimeType || 'audio/webm' }));
      };
      r.start();
      rec.current = r;
      setBlob(null);
      setDetik(0);
      setRekam(true);
    } catch {
      setGalat('Mikrofon tidak bisa dipakai. Izinkan akses mikrofon di browser, atau pakai cara Ketik.');
    }
  };

  const berhenti = () => {
    rec.current?.stop();
    setRekam(false);
  };

  return (
    <>
      <p className="text-sm text-redup">Sebutkan belanjaan seperti biasa, misalnya: cabe rawit setengah kilo tiga lima ribu, bawang putih seperempat sepuluh ribu.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {rekam ? (
          <Tombol varian="bahaya" className="border border-rugi" onClick={berhenti}>
            <Stop size={18} weight="fill" aria-hidden /> Berhenti ({detik} detik)
          </Tombol>
        ) : (
          <Tombol varian="garis" onClick={mulai}>
            <Microphone size={18} aria-hidden /> {blob ? 'Rekam ulang' : 'Mulai rekam'}
          </Tombol>
        )}
        {blob && !rekam && <Putar blob={blob} />}
      </div>
      {galat && (
        <p role="alert" className="mt-3 text-sm text-rugi">
          {galat}
        </p>
      )}
      <Tombol
        className="mt-4"
        disabled={!blob || proses}
        onClick={() => {
          const form = new FormData();
          form.append('suara', blob, `belanja.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);
          kirim('/pembelian/suara', { form });
        }}
      >
        {proses ? 'Mendengarkan' : 'Proses rekaman'}
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
        hint="Satu bahan per baris. Singkatan seperti rb, goceng, ceban dipahami."
      />
      <Tombol className="mt-4" disabled={teks.trim().length < 3 || proses} onClick={() => kirim('/pembelian/teks', { body: { teks } })}>
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
              <input aria-label={`Harga total ${i + 1}`} placeholder="Rp" type="number" min="0" className={`${inputCls} angka col-span-2 sm:col-span-1`} value={x.harga} onChange={(e) => set(i, 'harga', e.target.value)} />
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
  const [cara, setCara] = useState('foto');
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState(null);

  const kirim = async (path, opsi) => {
    setProses(true);
    setGalat(null);
    try {
      const draf = await api(path, { method: 'POST', ...opsi });
      nav(`/belanja/${draf.id}`);
    } catch (err) {
      setGalat({ pesan: pesanGalat(err), manual: err.data?.bisa_manual });
      setProses(false);
    }
  };

  const Isi = { foto: Foto, suara: Suara, teks: Teks, manual: Manual }[cara];

  return (
    <>
      <Judul judul="Catat belanja" sub="Pilih cara yang paling mudah. Anda akan memeriksa hasilnya sebelum disimpan." kembali="/belanja" />
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
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${cara === id ? 'border-lime bg-lime text-lime-tua' : 'border-garis bg-kartu text-redup hover:text-tinta'}`}
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
    </>
  );
}
