import { useEffect, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useApi } from '../lib/hooks.js';
import { api, pesanGalat } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Field, Galat, Judul, Kartu, Muat, Tombol } from '../components/ui.jsx';
import { BarisBiaya } from './Onboarding.jsx';

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

  useEffect(() => {
    if (!data) return;
    setProfil({ nama: data.nama, jenis: data.jenis || '', kota: data.kota || '', provinsi: data.provinsi || '', target_margin: Math.round(data.target_margin * 100), porsi_per_hari: data.porsi_per_hari });
    setBiaya(data.biaya.map(({ nama, nominal, periode }) => ({ nama, nominal, periode })));
  }, [data]);

  if (loading && !data) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;
  if (!profil) return <Muat />;

  const u = (k) => (e) => setProfil({ ...profil, [k]: e.target.value });

  const simpanProfil = async (e) => {
    e.preventDefault();
    try {
      await api('/usaha', { method: 'PUT', body: { ...profil, target_margin: Number(profil.target_margin) / 100, porsi_per_hari: Number(profil.porsi_per_hari) } });
      await segarkan();
      setP1({ ok: true, teks: 'Profil tersimpan. Status menu dihitung ulang.' });
    } catch (err) {
      setP1({ ok: false, teks: pesanGalat(err) });
    }
  };

  const simpanBiaya = async (e) => {
    e.preventDefault();
    try {
      await api('/usaha/biaya', { method: 'PUT', body: biaya.filter((b) => b.nama.trim() && Number(b.nominal) > 0).map((b) => ({ ...b, nominal: Number(b.nominal) })) });
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
              <Field label="Jenis" value={profil.jenis} onChange={u('jenis')} />
              <Field label="Kota" value={profil.kota} onChange={u('kota')} />
              <Field label="Provinsi" value={profil.provinsi} onChange={u('provinsi')} />
              <Field label="Target untung (%)" type="number" min="5" max="90" value={profil.target_margin} onChange={u('target_margin')} />
              <Field label="Porsi terjual per hari" type="number" min="1" value={profil.porsi_per_hari} onChange={u('porsi_per_hari')} />
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
              <h2 className="font-semibold">Biaya lain</h2>
              <p className="mb-3 text-sm text-redup">Dibagi ke setiap porsi berdasarkan porsi terjual per hari.</p>
              <div className="flex flex-col gap-2">
                {biaya.map((b, i) => (
                  <BarisBiaya key={i} b={b} i={i} ubah={(v) => setBiaya(biaya.map((x, j) => (j === i ? v : x)))} hapus={() => setBiaya(biaya.filter((_, j) => j !== i))} />
                ))}
              </div>
              <Tombol varian="hantu" className="mt-2" onClick={() => setBiaya([...biaya, { nama: '', nominal: '', periode: 'bulan' }])}>
                <Plus size={16} weight="bold" aria-hidden /> Tambah biaya
              </Tombol>
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
