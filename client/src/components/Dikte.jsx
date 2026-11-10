import { useEffect, useRef, useState } from 'react';
import { Microphone, Stop } from '@phosphor-icons/react';
import { api, pesanGalat } from '../lib/api.js';

const Pengenal = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// Ucapkan lalu jadi teks. Pakai pengenal suara bawaan browser (gratis, tanpa unggah rekaman).
// Kalau browser tidak punya, rekaman dikirim ke server untuk diubah jadi teks.
export default function Dikte({ onTeks, label = 'Ucapkan', contoh }) {
  const [aktif, setAktif] = useState(false);
  const [sementara, setSementara] = useState('');
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState(null);
  const [detik, setDetik] = useState(0);
  const ref = useRef(null);
  const hasil = useRef('');

  useEffect(() => {
    if (!aktif) return;
    const t = setInterval(() => setDetik((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [aktif]);

  useEffect(() => () => ref.current?.stop?.(), []);

  const mulaiBawaan = () => {
    const r = new Pengenal();
    r.lang = 'id-ID';
    r.continuous = true;
    r.interimResults = true;
    hasil.current = '';
    r.onresult = (e) => {
      let tetap = '';
      let antara = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) tetap += `${t} `;
        else antara += t;
      }
      hasil.current = tetap;
      setSementara(`${tetap}${antara}`);
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed') setGalat('Mikrofon tidak diizinkan. Izinkan akses mikrofon di browser, atau ketik saja.');
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setGalat('Suara tidak tertangkap. Coba lagi di tempat yang lebih tenang.');
    };
    r.onend = () => {
      setAktif(false);
      const teks = hasil.current.trim();
      if (teks) onTeks(teks);
      setSementara('');
    };
    r.start();
    ref.current = r;
  };

  const mulaiRekam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const r = new MediaRecorder(stream);
    const potong = [];
    r.ondataavailable = (e) => potong.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setAktif(false);
      const blob = new Blob(potong, { type: r.mimeType || 'audio/webm' });
      const form = new FormData();
      form.append('suara', blob, `rekaman.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);
      setProses(true);
      try {
        const { teks } = await api('/suara/teks', { method: 'POST', form });
        onTeks(teks);
      } catch (err) {
        setGalat(`${pesanGalat(err)}. Silakan ketik saja.`);
      } finally {
        setProses(false);
      }
    };
    r.start();
    ref.current = r;
  };

  const mulai = async () => {
    setGalat(null);
    setDetik(0);
    try {
      if (Pengenal) mulaiBawaan();
      else await mulaiRekam();
      setAktif(true);
    } catch {
      setGalat('Mikrofon tidak bisa dipakai. Izinkan akses mikrofon di browser, atau ketik saja.');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {aktif ? (
          <button type="button" onClick={() => ref.current?.stop()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-rugi px-5 text-sm font-semibold text-white hover:bg-[#a51f15]">
            <Stop size={18} weight="fill" aria-hidden /> Selesai bicara ({detik} detik)
          </button>
        ) : (
          <button type="button" onClick={mulai} disabled={proses} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-biru/40 bg-biru-muda px-5 text-sm font-semibold text-biru-tua hover:bg-[#dce8ff] disabled:opacity-60">
            <Microphone size={18} weight="fill" aria-hidden /> {proses ? 'Mengubah suara jadi teks' : label}
          </button>
        )}
        {aktif && (
          <span className="flex items-center gap-2 text-sm text-redup">
            <span className="size-2.5 animate-pulse rounded-full bg-rugi" aria-hidden /> Mendengarkan
          </span>
        )}
      </div>
      {aktif && sementara && (
        <p aria-live="polite" className="mt-3 rounded-xl bg-dasar px-3 py-2 text-sm">
          {sementara}
        </p>
      )}
      {!aktif && contoh && <p className="mt-2 text-xs text-redup">{contoh}</p>}
      {galat && (
        <p role="alert" className="mt-2 text-sm text-rugi">
          {galat}
        </p>
      )}
    </div>
  );
}
