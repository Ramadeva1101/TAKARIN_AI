import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, pesanGalat } from '../lib/api.js';
import { Judul, Kartu, Tombol } from '../components/ui.jsx';
import ResepEditor, { cekResep, rapikanResep, resepKosong } from '../components/ResepEditor.jsx';

export default function ProdukBaru() {
  const nav = useNavigate();
  const [resep, setResep] = useState(resepKosong());
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);

  const simpan = async (e) => {
    e.preventDefault();
    const data = rapikanResep(resep);
    const masalah = cekResep(data);
    if (masalah) return setGalat(masalah);
    setProses(true);
    try {
      const p = await api('/produk', { method: 'POST', body: data });
      nav(`/produk/${p.id}`, { replace: true });
    } catch (err) {
      setGalat(pesanGalat(err));
      setProses(false);
    }
  };

  return (
    <form onSubmit={simpan} noValidate>
      <Judul judul="Tambah menu" sub="Modal per porsi dihitung dari harga belanja terakhir atau harga pasar daerah." kembali="/produk" />
      <Kartu>
        <ResepEditor value={resep} onChange={setResep} />
      </Kartu>
      {galat && (
        <p role="alert" className="mt-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
          {galat}
        </p>
      )}
      <Tombol type="submit" className="mt-4" disabled={proses}>
        {proses ? 'Menyimpan' : 'Simpan menu'}
      </Tombol>
    </form>
  );
}
