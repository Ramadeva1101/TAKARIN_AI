import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import BiayaRutin, { biayaValid } from '../components/BiayaRutin.jsx';
import { api, pesanGalat } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Field, Kartu, Merek, Tombol, inputCls } from '../components/ui.jsx';
import { JENIS } from '../lib/jenis.js';

const TARGET = [
  { nilai: 30, ket: 'Harga bersaing, untung tipis per porsi' },
  { nilai: 40, ket: 'Umum untuk warung makan' },
  { nilai: 50, ket: 'Untuk menu andalan atau minuman' },
];

const LANGKAH = ['Jenis usaha', 'Lokasi', 'Penjualan', 'Biaya rutin'];

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
  const [usaha, setUsaha] = useState({ nama: '', jenis: '', kota: '', provinsi: '', target_margin: 40, porsi_per_hari: '', hari_buka: 30 });
  const [rutin, setRutin] = useState([]);
  // Jenis usaha di luar daftar: diisi sendiri lalu diperiksa AI.
  const [lain, setLain] = useState({ aktif: false, teks: '', hasil: null, cek: false, galat: null });
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

  const u = (k) => (e) => setUsaha({ ...usaha, [k]: e.target.value });
  const adaKota = wilayah.kota.some((k) => bersih(k) === bersih(usaha.kota.trim()));
  const adaProv = wilayah.provinsi.some((k) => bersih(k) === bersih(usaha.provinsi.trim()));

  const bisaLanjut = [
    usaha.nama.trim() && (lain.aktif ? lain.hasil?.valid && lain.hasil.teks === lain.teks.trim() : usaha.jenis),
    usaha.kota.trim() && usaha.provinsi.trim(),
    Number(usaha.porsi_per_hari) > 0 && Number(usaha.target_margin) >= 5 && Number(usaha.hari_buka) >= 1 && Number(usaha.hari_buka) <= 31,
    true,
  ][langkah];

  const biayaSurvei = () => biayaValid(rutin);

  const periksaJenis = async () => {
    const teks = lain.teks.trim();
    setLain((l) => ({ ...l, cek: true, galat: null, hasil: null }));
    try {
      const h = await api('/usaha/cek-jenis', { method: 'POST', body: { teks } });
      setLain((l) => ({ ...l, cek: false, hasil: { ...h, teks } }));
      if (h.valid) setUsaha((x) => ({ ...x, jenis: h.nama_jenis || teks.toLowerCase() }));
    } catch (err) {
      setLain((l) => ({ ...l, cek: false, galat: pesanGalat(err) }));
    }
  };

  const simpan = async () => {
    setProses(true);
    setGalat(null);
    try {
      await api('/usaha/setup', {
        method: 'POST',
        body: {
          usaha: { ...usaha, target_margin: Number(usaha.target_margin) / 100, porsi_per_hari: Number(usaha.porsi_per_hari), hari_buka: Number(usaha.hari_buka) },
          produk: [],
          biaya: biayaSurvei(),
        },
      });
      await segarkan();
      // Menu dibuat setelah masuk, di halaman tambah menu.
      nav('/produk/baru?awal=1', { replace: true });
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
              <Pilihan
                key={j.id}
                aktif={!lain.aktif && usaha.jenis === j.id}
                onClick={() => {
                  setLain((l) => ({ ...l, aktif: false }));
                  setUsaha({ ...usaha, jenis: j.id });
                }}
                judul={j.label}
                ket={j.ket}
              />
            ))}
            <Pilihan
              aktif={lain.aktif}
              onClick={() => {
                setLain((l) => ({ ...l, aktif: true }));
                setUsaha({ ...usaha, jenis: lain.hasil?.valid ? lain.hasil.nama_jenis || lain.teks.trim().toLowerCase() : '' });
              }}
              judul="Jenis lain"
              ket="Angkringan, frozen food, sambal kemasan, dan lainnya"
            />
          </div>
          {lain.aktif && (
            <Kartu className="mt-3">
              <label htmlFor="jenis-lain" className="mb-1 block text-sm font-medium">
                Tulis jenis usaha Anda
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="jenis-lain"
                  value={lain.teks}
                  onChange={(e) => setLain({ ...lain, teks: e.target.value, hasil: null })}
                  onKeyDown={(e) => e.key === 'Enter' && lain.teks.trim().length >= 3 && periksaJenis()}
                  placeholder="Contoh: dimsum beku rumahan"
                  maxLength={60}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-garis bg-kartu px-3 text-base outline-none focus:border-biru"
                />
                <Tombol memuat={lain.cek} varian="polos" onClick={periksaJenis} disabled={lain.cek || lain.teks.trim().length < 3}>
                  {lain.cek ? 'Memeriksa' : 'Periksa'}
                </Tombol>
              </div>
              <p className="mt-1 text-xs text-redup">AI memeriksa apakah usaha ini mengolah bahan menjadi makanan atau minuman, karena modal per porsi hanya bisa dihitung untuk usaha seperti itu.</p>
              {lain.hasil && (
                <p role="status" className={`mt-3 flex gap-2 rounded-xl px-3 py-2 text-sm ${lain.hasil.valid ? 'bg-aman-muda text-aman' : 'bg-waspada-muda text-waspada'}`}>
                  {lain.hasil.valid ? <CheckCircle size={20} weight="fill" className="shrink-0" aria-hidden /> : <WarningCircle size={20} weight="fill" className="shrink-0" aria-hidden />}
                  <span>
                    <b>{lain.hasil.valid ? `Bisa dihitung: ${lain.hasil.nama_jenis || lain.teks}` : 'Belum bisa dihitung'}</b>
                    <span className="block">{lain.hasil.alasan}</span>
                  </span>
                </p>
              )}
              {lain.galat && <p className="mt-3 text-sm text-rugi">{lain.galat}. Coba lagi, atau pilih jenis terdekat di atas.</p>}
            </Kartu>
          )}
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
                ? `Harga pasar tingkat kota tersedia untuk ${usaha.kota}, dari data Bank Indonesia.`
                : adaProv
                  ? `Kota ${usaha.kota} belum ada di data Bank Indonesia. Dipakai harga rata-rata provinsi ${usaha.provinsi}.`
                  : 'Provinsi belum dikenali. Pilih dari daftar, atau harga rata-rata nasional yang dipakai.'}
            </p>
          )}
        </section>
      )}

      {langkah === 2 && (
        <section>
          <h1 className="mt-1 text-2xl font-bold">Berapa porsi terjual dan berapa untung yang Anda inginkan?</h1>
          <div className="mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
            <Field
              label="Rata-rata porsi terjual per hari buka"
              type="number"
              min="1"
              inputMode="numeric"
              value={usaha.porsi_per_hari}
              onChange={u('porsi_per_hari')}
              hint="Semua menu digabung, termasuk potong, gelas, atau kotak."
            />
            <Field
              label="Buka berapa hari dalam sebulan"
              type="number"
              min="1"
              max="31"
              inputMode="numeric"
              value={usaha.hari_buka}
              onChange={u('hari_buka')}
              hint="Contoh: libur tiap Minggu = 26 hari. Biaya bulanan dibagi ke hari buka saja."
            />
          </div>
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
          <p className="mt-2 text-redup">Biaya selain bahan resep, misalnya bahan bakar memasak, listrik, sewa, atau gaji. Biaya ini dibagi ke setiap porsi. Pilih yang Anda bayar saja; kalau tidak ada, langsung lanjut.</p>
          <Kartu className="mt-5">
            <BiayaRutin value={rutin} onChange={setRutin} />
          </Kartu>
          <p className="mt-3 text-sm text-redup">Semua biaya bisa diubah nanti di Pengaturan.</p>
        </section>
      )}

      {galat && (
        <p role="alert" className="mt-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
          {galat}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {langkah > 0 && (
          <Tombol varian="garis" onClick={() => setLangkah(langkah - 1)}>
            Sebelumnya
          </Tombol>
        )}
        {langkah < LANGKAH.length - 1 && (
          <Tombol onClick={() => setLangkah(langkah + 1)} disabled={!bisaLanjut}>
            Lanjut
          </Tombol>
        )}
        {langkah === LANGKAH.length - 1 && (
          <Tombol memuat={proses} onClick={simpan} disabled={proses}>
            {proses ? 'Menyimpan' : 'Simpan dan tambah menu'}
          </Tombol>
        )}
      </div>
    </div>
  );
}
