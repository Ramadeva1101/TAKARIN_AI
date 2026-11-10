import { useEffect, useState } from 'react';
import { useApi } from '../lib/hooks.js';
import { api, pesanGalat } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Field, Galat, Judul, Kartu, Muat, Tombol } from '../components/ui.jsx';
import BiayaRutin, { biayaValid } from '../components/BiayaRutin.jsx';
import { JENIS } from '../lib/jenis.js';

function Pesan({ p }) {
  if (!p) return null;
  return (
    <p role="status" className={`mt-3 text-sm ${p.ok ? 'text-aman' : 'text-rugi'}`}>
      {p.teks}
    </p>
  );
}

export default function Pengaturan() {
  const { data, loading, error, muat } = useApi('/usaha');
  const { user, segarkan, keluar } = useAuth();
  const [profil, setProfil] = useState(null);
  const [biaya, setBiaya] = useState([]);
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  const [wilayah, setWilayah] = useState({ provinsi: [], kota: [] });

  useEffect(() => {
    api('/pasar/provinsi')
      .then((provinsi) => setWilayah((w) => ({ ...w, provinsi })))
      .catch(() => {});
  }, []);

  // Daftar kota mengikuti provinsi, sama seperti saat pendaftaran.
  const provinsi = profil?.provinsi;
  useEffect(() => {
    if (!provinsi) return;
    let batal = false;
    api(`/pasar/kota?provinsi=${encodeURIComponent(provinsi)}`)
      .then((kota) => !batal && setWilayah((w) => ({ ...w, kota })))
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [provinsi]);

  useEffect(() => {
    if (!data) return;
    setProfil({ nama: data.nama, jenis: data.jenis || '', kota: data.kota || '', provinsi: data.provinsi || '', target_margin: Math.round(data.target_margin * 100), porsi_per_hari: data.porsi_per_hari, hari_buka: data.hari_buka ?? 30 });
    setBiaya(data.biaya.map(({ nama, nominal, periode }) => ({ nama, nominal, periode })));
  }, [data]);

  if (loading && !data) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;
  if (!profil) return <Muat />;

  const u = (k) => (e) => setProfil({ ...profil, [k]: e.target.value });
  const bersih = (s) => s.toLowerCase().replace(/^(kota administrasi|kota|kabupaten|kab\.?)\s+/, '').trim();
  const adaKota = wilayah.kota.some((k) => bersih(k) === bersih(profil.kota));
  const adaProv = wilayah.provinsi.some((k) => bersih(k) === bersih(profil.provinsi));

  const simpanProfil = async (e) => {
    e.preventDefault();
    try {
      await api('/usaha', { method: 'PUT', body: { ...profil, target_margin: Number(profil.target_margin) / 100, porsi_per_hari: Number(profil.porsi_per_hari), hari_buka: Number(profil.hari_buka) } });
      await segarkan();
      setP1({ ok: true, teks: 'Profil tersimpan. Status menu dihitung ulang.' });
    } catch (err) {
      setP1({ ok: false, teks: pesanGalat(err) });
    }
  };

  const simpanBiaya = async (e) => {
    e.preventDefault();
    try {
      await api('/usaha/biaya', { method: 'PUT', body: biayaValid(biaya) });
      setP2({ ok: true, teks: 'Biaya tersimpan.' });
      muat();
    } catch (err) {
      setP2({ ok: false, teks: pesanGalat(err) });
    }
  };

  return (
    <>
      <Judul judul="Pengaturan" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Kartu>
          <form onSubmit={simpanProfil}>
            <h2 className="mb-3 font-semibold">Profil usaha</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nama usaha" value={profil.nama} onChange={u('nama')} />
              <Field label="Jenis usaha" value={profil.jenis} onChange={u('jenis')} list="atur-jenis" />
              <datalist id="atur-jenis">
                {JENIS.map((j) => (
                  <option key={j.id} value={j.id} />
                ))}
              </datalist>
              <Field label="Provinsi" value={profil.provinsi} onChange={u('provinsi')} list="atur-provinsi" />
              <Field label="Kota atau kabupaten" value={profil.kota} onChange={u('kota')} list="atur-kota" />
              <datalist id="atur-provinsi">
                {wilayah.provinsi.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
              <datalist id="atur-kota">
                {wilayah.kota.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
              {profil.kota.trim() && wilayah.provinsi.length > 0 && (
                <p className={`rounded-xl px-3 py-2 text-xs sm:col-span-2 ${adaKota ? 'bg-aman-muda text-aman' : 'bg-waspada-muda text-waspada'}`}>
                  {adaKota ? `Harga pasar tingkat kota tersedia untuk ${profil.kota}.` : adaProv ? `Kota ${profil.kota} tidak ada di PIHPS, dipakai rata-rata provinsi ${profil.provinsi}.` : 'Provinsi belum dikenali. Pilih dari daftar, atau harga rata-rata nasional yang dipakai.'}
                </p>
              )}
              <Field label="Target untung (%)" type="number" min="5" max="90" value={profil.target_margin} onChange={u('target_margin')} />
              <Field label="Porsi terjual per hari buka" type="number" min="1" value={profil.porsi_per_hari} onChange={u('porsi_per_hari')} />
              <Field label="Hari buka sebulan" type="number" min="1" max="31" value={profil.hari_buka} onChange={u('hari_buka')} hint="Biaya bulanan dibagi ke hari buka." />
            </div>
            <Pesan p={p1} />
            <Tombol type="submit" className="mt-4">
              Simpan profil
            </Tombol>
          </form>
        </Kartu>

        <div className="flex flex-col gap-4">
          <Kartu>
            <form onSubmit={simpanBiaya}>
              <h2 className="font-semibold">Biaya rutin di luar bahan</h2>
              <p className="mb-3 text-sm text-redup">Dibagi ke setiap porsi berdasarkan porsi terjual per hari.</p>
              <BiayaRutin value={biaya} onChange={setBiaya} />
              <Pesan p={p2} />
              <div>
                <Tombol type="submit" className="mt-4">
                  Simpan biaya
                </Tombol>
              </div>
            </form>
          </Kartu>

          <Kartu>
            <h2 className="font-semibold">Akun</h2>
            <p className="mt-1 text-sm text-redup">
              {user?.nama} · {user?.email}
            </p>
            <Tombol varian="garis" className="mt-3" onClick={keluar}>
              Keluar
            </Tombol>
          </Kartu>
        </div>
      </div>
    </>
  );
}
