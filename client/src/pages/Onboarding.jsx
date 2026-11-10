import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash } from '@phosphor-icons/react';
import { api, pesanGalat } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Field, Kartu, Merek, Tombol, inputCls } from '../components/ui.jsx';
import ResepEditor, { cekResep, rapikanResep, resepKosong } from '../components/ResepEditor.jsx';

const JENIS = [
  {
    id: 'warung makan',
    label: 'Warung makan',
    ket: 'Nasi, lauk, mi, gorengan',
    contoh:
      'Saya jualan ayam geprek 15 ribu. Satu porsi pakai 1 potong ayam, tepung bumbu 50 gram, cabai rawit 20 gram, bawang putih 1 siung, minyak 1 sdm, nasi 100 gram, kertas nasi. Es teh 4 ribu: 1 teh celup, gula 2 sdm, es batu 150 gram, cup plastik.',
  },
  {
    id: 'kedai minuman',
    label: 'Kedai minuman',
    ket: 'Es teh, kopi, jus',
    contoh:
      'Es kopi susu 12 ribu: kopi bubuk 15 gram, susu kental manis 2 sdm, susu cair 100 ml, es batu 150 gram, cup plastik dan sedotan. Es jeruk 6 ribu: jeruk peras 150 gram, gula 2 sdm, es batu, cup.',
  },
  {
    id: 'kue dan jajanan',
    label: 'Kue dan jajanan',
    ket: 'Dibuat per adonan',
    contoh:
      'Bolu pandan dijual 3 ribu per potong. Satu loyang jadi 20 potong: tepung terigu 250 gram, telur 4 butir, gula pasir 200 gram, margarin 100 gram, santan 200 ml, pasta pandan 1 sdt. Plastik mika 1 per potong.',
  },
  {
    id: 'katering',
    label: 'Katering',
    ket: 'Nasi kotak, pesanan',
    contoh:
      'Nasi kotak ayam bakar 25 ribu. Per kotak: nasi 150 gram, ayam 1 potong, tempe 1 potong, sambal 1 sdm, lalapan, kerupuk 1, kotak nasi 1. Bumbu ayam bakar per 10 potong: bawang merah 8 siung, bawang putih 5 siung, kecap 5 sdm.',
  },
];

const TARGET = [
  { nilai: 30, ket: 'Harga bersaing, untung tipis per porsi' },
  { nilai: 40, ket: 'Umum untuk warung makan' },
  { nilai: 50, ket: 'Untuk menu andalan atau minuman' },
];

const LANGKAH = ['Jenis usaha', 'Lokasi', 'Penjualan', 'Biaya rutin', 'Menu', 'Periksa'];

function Pilihan({ aktif, onClick, judul, ket }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={aktif}
      onClick={onClick}
      className={`min-h-16 rounded-xl border p-3 text-left ${aktif ? 'border-biru bg-biru-muda' : 'border-garis bg-kartu hover:border-biru'}`}
    >
      <span className="block font-semibold">{judul}</span>
      {ket && <span className="block text-sm text-redup">{ket}</span>}
    </button>
  );
}

export default function Onboarding() {
  const { user, segarkan, keluar } = useAuth();
  const nav = useNavigate();
  const [langkah, setLangkah] = useState(0);
  const [wilayah, setWilayah] = useState({ kota: [], provinsi: [] });
  const bersih = (s) => s.toLowerCase().replace(/^(kota administrasi|kota|kabupaten|kab\.?)\s+/, '').trim();
  const [usaha, setUsaha] = useState({ nama: '', jenis: '', kota: '', provinsi: '', target_margin: 40, porsi_per_hari: '' });
  const [rutin, setRutin] = useState({ gas: '', listrik: '', sewa: '' });
  const [cerita, setCerita] = useState('');
  const [produk, setProduk] = useState([resepKosong()]);
  const [biayaAi, setBiayaAi] = useState([]);
  const [pertanyaan, setPertanyaan] = useState([]);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState(null);

  useEffect(() => {
    api('/pasar/provinsi')
      .then((provinsi) => setWilayah((w) => ({ ...w, provinsi })))
      .catch(() => {});
  }, []);

  // Daftar kota mengikuti provinsi yang dipilih.
  useEffect(() => {
    if (!wilayah.provinsi.some((p) => bersih(p) === bersih(usaha.provinsi))) return setWilayah((w) => (w.kota.length ? { ...w, kota: [] } : w));
    let batal = false;
    api(`/pasar/kota?provinsi=${encodeURIComponent(usaha.provinsi)}`)
      .then((kota) => !batal && setWilayah((w) => ({ ...w, kota })))
      .catch(() => {});
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usaha.provinsi, wilayah.provinsi]);

  const jenis = JENIS.find((j) => j.id === usaha.jenis);
  const u = (k) => (e) => setUsaha({ ...usaha, [k]: e.target.value });
  const adaKota = wilayah.kota.some((k) => bersih(k) === bersih(usaha.kota.trim()));
  const adaProv = wilayah.provinsi.some((k) => bersih(k) === bersih(usaha.provinsi.trim()));

  const bisaLanjut = [
    usaha.nama.trim() && usaha.jenis,
    usaha.kota.trim() && usaha.provinsi.trim(),
    Number(usaha.porsi_per_hari) > 0 && Number(usaha.target_margin) >= 5,
    true,
  ][langkah];

  const biayaSurvei = () =>
    [
      ['gas', rutin.gas, 'hari'],
      ['listrik', rutin.listrik, 'bulan'],
      ['sewa tempat', rutin.sewa, 'bulan'],
    ]
      .filter(([, n]) => Number(n) > 0)
      .map(([nama, nominal, periode]) => ({ nama, nominal: Number(nominal), periode }));

  const susun = async () => {
    setProses(true);
    setGalat(null);
    try {
      const d = await api('/usaha/cerita', { method: 'POST', body: { teks: cerita } });
      if (d.produk?.length) setProduk(d.produk.map((p) => ({ ...p, harga_jual: p.harga_jual ?? '', bahan: p.bahan.length ? p.bahan.map((b) => ({ ...b, qty: b.qty ?? '' })) : resepKosong().bahan })));
      const sudah = biayaSurvei().map((b) => b.nama);
      setBiayaAi((d.biaya || []).filter((b) => b.nominal && !sudah.some((s) => b.nama.toLowerCase().includes(s.split(' ')[0]))));
      setPertanyaan(d.pertanyaan || []);
      setLangkah(5);
    } catch (err) {
      setGalat(`${pesanGalat(err)}. Anda tetap bisa mengisi menu manual.`);
    } finally {
      setProses(false);
    }
  };

  const simpan = async () => {
    const daftarProduk = produk.map(rapikanResep);
    const masalah = daftarProduk.map(cekResep).find(Boolean);
    if (masalah) return setGalat(masalah);
    setProses(true);
    setGalat(null);
    try {
      await api('/usaha/setup', {
        method: 'POST',
        body: {
          usaha: { ...usaha, target_margin: Number(usaha.target_margin) / 100, porsi_per_hari: Number(usaha.porsi_per_hari) },
          produk: daftarProduk,
          biaya: [...biayaSurvei(), ...biayaAi.filter((b) => b.nama.trim() && Number(b.nominal) > 0).map((b) => ({ ...b, nominal: Number(b.nominal) }))],
        },
      });
      await segarkan();
      nav('/', { replace: true });
    } catch (err) {
      setGalat(pesanGalat(err));
      setProses(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Merek className="text-lg" />
        <Tombol varian="hantu" onClick={keluar}>
          Keluar
        </Tombol>
      </div>

      <ol className="mb-6 flex gap-1" aria-label={`Langkah ${langkah + 1} dari ${LANGKAH.length}: ${LANGKAH[langkah]}`}>
        {LANGKAH.map((l, i) => (
          <li key={l} className={`h-1.5 flex-1 rounded-full ${i <= langkah ? 'bg-biru' : 'bg-garis'}`} title={l} />
        ))}
      </ol>
      <p className="text-sm text-redup">
        Langkah {langkah + 1} dari {LANGKAH.length}
      </p>

      {langkah === 0 && (
        <section>
          <h1 className="mt-1 text-2xl font-bold">Halo {user?.nama}, usaha apa yang Anda jalankan?</h1>
          <p className="mt-2 text-redup">Jawaban ini menentukan contoh resep dan cara modal dihitung.</p>
          <Field className="mt-5" label="Nama usaha" value={usaha.nama} onChange={u('nama')} placeholder="Warung Bu Sari" />
          <div role="radiogroup" aria-label="Jenis usaha" className="mt-4 grid gap-2 sm:grid-cols-2">
            {JENIS.map((j) => (
              <Pilihan key={j.id} aktif={usaha.jenis === j.id} onClick={() => setUsaha({ ...usaha, jenis: j.id })} judul={j.label} ket={j.ket} />
            ))}
          </div>
        </section>
      )}

      {langkah === 1 && (
        <section>
          <h1 className="mt-1 text-2xl font-bold">Di mana Anda biasa belanja bahan?</h1>
          <p className="mt-2 text-redup">Dipakai untuk membandingkan harga belanja Anda dengan harga pasar daerah.</p>
          <datalist id="daftar-kota">
            {wilayah.kota.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
          <datalist id="daftar-provinsi">
            {wilayah.provinsi.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Provinsi" value={usaha.provinsi} onChange={u('provinsi')} list="daftar-provinsi" placeholder="Bali" />
            <Field label="Kota atau kabupaten" value={usaha.kota} onChange={u('kota')} list="daftar-kota" placeholder="Denpasar" />
          </div>
          {usaha.kota.trim() && usaha.provinsi.trim() && (
            <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${adaKota ? 'bg-aman-muda text-aman' : 'bg-waspada-muda text-waspada'}`}>
              {adaKota
                ? `Harga pasar tingkat kota tersedia untuk ${usaha.kota}, dari PIHPS Bank Indonesia.`
                : adaProv
                  ? `Data kota ${usaha.kota} tidak ada di PIHPS. Dipakai harga rata-rata provinsi ${usaha.provinsi}.`
                  : 'Provinsi belum dikenali. Pilih dari daftar, atau harga rata-rata nasional yang dipakai.'}
            </p>
          )}
        </section>
      )}

      {langkah === 2 && (
        <section>
          <h1 className="mt-1 text-2xl font-bold">Berapa porsi terjual dan berapa untung yang Anda inginkan?</h1>
          <Field
            className="mt-5 max-w-xs"
            label="Rata-rata porsi terjual per hari"
            type="number"
            min="1"
            inputMode="numeric"
            value={usaha.porsi_per_hari}
            onChange={u('porsi_per_hari')}
            hint="Semua menu digabung. Untuk membagi biaya gas dan listrik ke tiap porsi."
          />
          <p className="mt-5 mb-2 text-sm font-medium">Target untung dari harga jual</p>
          <div role="radiogroup" aria-label="Target untung" className="grid gap-2 sm:grid-cols-3">
            {TARGET.map((t) => (
              <Pilihan key={t.nilai} aktif={Number(usaha.target_margin) === t.nilai} onClick={() => setUsaha({ ...usaha, target_margin: t.nilai })} judul={`${t.nilai}%`} ket={t.ket} />
            ))}
          </div>
          <Field className="mt-3 max-w-xs" label="Atau isi sendiri (%)" type="number" min="5" max="90" value={usaha.target_margin} onChange={u('target_margin')} />
          <p className="mt-3 text-sm text-redup">
            Contoh: target 40% berarti dari harga Rp10.000, modal paling banyak Rp6.000.
          </p>
        </section>
      )}

      {langkah === 3 && (
        <section>
          <h1 className="mt-1 text-2xl font-bold">Biaya rutin di luar bahan</h1>
          <p className="mt-2 text-redup">Biaya ini ikut dibagi ke setiap porsi. Kosongkan yang tidak ada.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Field label="Gas per hari (Rp)" type="number" min="0" inputMode="numeric" value={rutin.gas} onChange={(e) => setRutin({ ...rutin, gas: e.target.value })} hint="Contoh: tabung 3 kg Rp22.000 habis 2 hari = 11000" />
            <Field label="Listrik per bulan (Rp)" type="number" min="0" inputMode="numeric" value={rutin.listrik} onChange={(e) => setRutin({ ...rutin, listrik: e.target.value })} />
            <Field label="Sewa tempat per bulan (Rp)" type="number" min="0" inputMode="numeric" value={rutin.sewa} onChange={(e) => setRutin({ ...rutin, sewa: e.target.value })} />
          </div>
        </section>
      )}

      {langkah === 4 && (
        <section>
          <h1 className="mt-1 text-2xl font-bold">Ceritakan menu Anda</h1>
          <p className="mt-2 text-redup">
            Tulis seperti bercerita: nama menu, harga jual, bahan dan takaran per porsi. Takaran rumah tangga seperti sdm atau siung boleh. AI menyusunnya jadi resep, Anda periksa di langkah berikutnya.
          </p>
          <Kartu className="mt-5">
            <Field label="Cerita menu" as="textarea" rows={7} value={cerita} onChange={(e) => setCerita(e.target.value)} placeholder={jenis?.contoh} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Tombol onClick={susun} disabled={proses || cerita.trim().length < 10}>
                {proses ? 'Menyusun resep' : 'Susun resep'}
              </Tombol>
              {jenis && (
                <Tombol varian="garis" onClick={() => setCerita(jenis.contoh)}>
                  Pakai contoh {jenis.label.toLowerCase()}
                </Tombol>
              )}
              <Tombol varian="hantu" onClick={() => setLangkah(5)}>
                Isi manual
              </Tombol>
            </div>
          </Kartu>
        </section>
      )}

      {langkah === 5 && (
        <section>
          <h1 className="mt-1 text-2xl font-bold">Periksa resep</h1>
          <p className="mt-2 text-redup">Ubah yang kurang tepat. Semua bisa diganti lagi nanti.</p>
          {pertanyaan.length > 0 && (
            <div className="mt-5 rounded-2xl bg-waspada-muda p-4 text-sm text-waspada">
              <p className="font-semibold">Belum disebut di cerita:</p>
              <ul className="mt-1 list-disc pl-5">
                {pertanyaan.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
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
          {biayaAi.length > 0 && (
            <Kartu className="mt-4">
              <h2 className="font-semibold">Biaya lain dari cerita</h2>
              <div className="mt-3 flex flex-col gap-2">
                {biayaAi.map((b, i) => (
                  <BarisBiaya key={i} b={b} i={i} ubah={(v) => setBiayaAi(biayaAi.map((x, j) => (j === i ? v : x)))} hapus={() => setBiayaAi(biayaAi.filter((_, j) => j !== i))} />
                ))}
              </div>
            </Kartu>
          )}
        </section>
      )}

      {galat && (
        <p role="alert" className="mt-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
          {galat}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {langkah > 0 && (
          <Tombol varian="garis" onClick={() => setLangkah(langkah === 5 ? 4 : langkah - 1)}>
            Sebelumnya
          </Tombol>
        )}
        {langkah < 4 && (
          <Tombol onClick={() => setLangkah(langkah + 1)} disabled={!bisaLanjut}>
            Lanjut
          </Tombol>
        )}
        {langkah === 5 && (
          <Tombol onClick={simpan} disabled={proses}>
            {proses ? 'Menyimpan' : 'Simpan dan hitung modal'}
          </Tombol>
        )}
      </div>
    </div>
  );
}

export function BarisBiaya({ b, i, ubah, hapus }) {
  return (
    <div className="grid grid-cols-[1fr_6.5rem_6rem_2.75rem] items-center gap-2">
      <input aria-label={`Nama biaya ${i + 1}`} placeholder="listrik" className={inputCls} value={b.nama} onChange={(e) => ubah({ ...b, nama: e.target.value })} />
      <input aria-label={`Nominal biaya ${i + 1}`} placeholder="Rp" type="number" min="0" inputMode="numeric" className={`${inputCls} angka`} value={b.nominal ?? ''} onChange={(e) => ubah({ ...b, nominal: e.target.value })} />
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
