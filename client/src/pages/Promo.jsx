import { useEffect, useState } from 'react';
import { Copy, Trash, WhatsappLogo } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { api, persen, pesanGalat, rupiah } from '../lib/api.js';
import { Chip, Field, Galat, Judul, Kartu, Kosong, Muat, Tombol, inputCls } from '../components/ui.jsx';

const NAMA_OPSI = { aman: 'Sesuai target', seimbang: 'Diskon sedang', agresif: 'Diskon besar' };

const teksBagikan = (p) => `${p.nama}: ${rupiah(p.harga_paket)}${p.caption ? `\n${p.caption}` : ''}`;

function Tersimpan({ daftar, muat }) {
  const [info, setInfo] = useState(null);
  if (!daftar.length) return <Kosong judul="Belum ada paket tersimpan" teks="Paket yang disimpan bisa disalin atau dibagikan ke WhatsApp dari sini." />;
  const salin = async (p) => {
    try {
      await navigator.clipboard.writeText(teksBagikan(p));
      setInfo({ id: p.id, teks: 'Teks promo disalin.' });
    } catch {
      setInfo({ id: p.id, teks: 'Tidak bisa menyalin otomatis. Tekan lama teks caption untuk menyalin.' });
    }
  };
  const hapus = async (p) => {
    if (!window.confirm(`Hapus paket ${p.nama}?`)) return;
    try {
      await api(`/promo/${p.id}`, { method: 'DELETE' });
      muat();
    } catch (e) {
      setInfo({ id: p.id, teks: pesanGalat(e) });
    }
  };
  return (
    <ul className="divide-y divide-garis">
      {daftar.map((p) => (
        <li key={p.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="font-semibold">{p.nama}</p>
            <p className="angka text-sm text-redup">
              {rupiah(p.harga_paket)}
              {p.hpp_paket != null && `, modal ${rupiah(p.hpp_paket)}, untung ${persen((p.harga_paket - p.hpp_paket) / p.harga_paket)}`}
            </p>
            {p.items && <p className="text-xs text-redup">{p.items.map((i) => `${i.qty}× ${i.nama ?? `menu ${i.menu_id}`}`).join(', ')}</p>}
            {p.caption && <p className="mt-1 text-sm">{p.caption}</p>}
            {p.galat && <p className="mt-1 text-xs text-rugi">{p.galat}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => salin(p)} className="inline-flex min-h-11 sm:min-h-10 items-center gap-1.5 rounded-full border border-garis px-3 text-sm font-semibold hover:border-biru hover:text-biru">
                <Copy size={16} aria-hidden /> Salin
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(teksBagikan(p))}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 sm:min-h-10 items-center gap-1.5 rounded-full border border-garis px-3 text-sm font-semibold hover:border-aman hover:text-aman"
              >
                <WhatsappLogo size={16} aria-hidden /> Bagikan ke WhatsApp
              </a>
            </div>
            {info?.id === p.id && <p role="status" className="mt-1 text-xs text-redup">{info.teks}</p>}
          </div>
          <button
            aria-label={`Hapus paket ${p.nama}`}
            onClick={() => hapus(p)}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-redup hover:bg-rugi-muda hover:text-rugi"
          >
            <Trash size={18} aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function Promo() {
  const produk = useApi('/produk');
  const promo = useApi('/promo');
  const [pilih, setPilih] = useState({});
  const [kemasan, setKemasan] = useState('');
  const [hasil, setHasil] = useState(null);
  const [opsi, setOpsi] = useState(null);
  const [harga, setHarga] = useState('');
  const [nama, setNama] = useState('');
  const [caption, setCaption] = useState('');
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(null);
  const [tersimpan, setTersimpan] = useState(null);

  const items = Object.entries(pilih)
    .filter(([, q]) => q > 0)
    .map(([menu_id, qty]) => ({ menu_id: Number(menu_id), qty }));

  useEffect(() => {
    setHasil(null);
    setOpsi(null);
    if (!items.length) return;
    const t = setTimeout(() => {
      api('/promo/hitung', { method: 'POST', body: { items, biaya_kemasan: Number(kemasan) || 0 } })
        .then((r) => {
          setHasil(r);
          setGalat(null);
          const awal = r.opsi.find((o) => o.jenis === 'seimbang') || r.opsi[0];
          setOpsi(awal?.jenis);
          setHarga(awal?.harga ?? '');
        })
        .catch((e) => setGalat(pesanGalat(e)));
    }, 250);
    return () => clearTimeout(t);
    // items diturunkan dari pilih
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pilih), kemasan]);

  if (produk.loading && !produk.data) return <Muat />;
  if (produk.error) return <Galat error={produk.error} ulang={produk.muat} />;

  const saran = async () => {
    setProses('saran');
    setGalat(null);
    try {
      const r = await api('/promo/saran', { method: 'POST', body: { items, harga_paket: Number(harga), biaya_kemasan: Number(kemasan) || 0 } });
      setNama(r.nama || '');
      setCaption(r.caption || '');
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setProses(null);
    }
  };

  const simpan = async () => {
    setProses('simpan');
    setGalat(null);
    setTersimpan(null);
    try {
      await api('/promo', { method: 'POST', body: { items, nama, caption: caption || null, harga_paket: Number(harga), biaya_kemasan: Number(kemasan) || 0 } });
      setTersimpan(`Paket ${nama.trim()} tersimpan. Salin atau bagikan dari daftar Paket tersimpan.`);
      setPilih({});
      setNama('');
      setCaption('');
      promo.muat();
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setProses(null);
    }
  };

  const hargaN = Number(harga);
  const marginManual = hasil && hargaN > 0 ? (hargaN - hasil.hpp_paket) / hargaN : null;

  return (
    <>
      <Judul judul="Promo paket" sub="Gabungkan menu jadi paket, lalu pilih harga yang tetap untung" />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <Kartu>
            <h2 className="mb-3 font-semibold">1. Pilih isi paket</h2>
            {!produk.data.length ? (
              <Kosong judul="Belum ada menu" aksi={<Tombol to="/produk/baru">Tambah menu</Tombol>} />
            ) : (
              <ul className="divide-y divide-garis">
                {produk.data.map((p) => {
                  const q = pilih[p.id] || 0;
                  if (!p.lengkap)
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-2 opacity-70">
                        <div className="min-w-0">
                          <p className="font-medium">{p.nama}</p>
                          <p className="text-xs text-redup">Modal belum bisa dihitung, harga bahan belum lengkap.</p>
                        </div>
                        <Link to={`/produk/${p.id}`} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-biru">
                          Lengkapi
                        </Link>
                      </li>
                    );
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="font-medium">{p.nama}</p>
                        <p className="angka text-xs text-redup">
                          Jual {rupiah(p.harga_jual)}, modal {rupiah(p.hpp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button aria-label={`Kurangi ${p.nama}`} disabled={!q} onClick={() => setPilih({ ...pilih, [p.id]: q - 1 })} className="size-11 rounded-lg border border-garis text-lg disabled:opacity-30">
                          −
                        </button>
                        <span className="angka w-8 text-center font-semibold" aria-live="polite">
                          {q}
                        </span>
                        <button aria-label={`Tambah ${p.nama}`} onClick={() => setPilih({ ...pilih, [p.id]: q + 1 })} className="size-11 rounded-lg border border-garis text-lg">
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <Field className="mt-3 max-w-xs" label="Biaya kemasan paket (Rp)" type="number" min="0" value={kemasan} onChange={(e) => setKemasan(e.target.value)} />
          </Kartu>

          {hasil && (
            <Kartu>
              <h2 className="font-semibold">2. Pilih harga paket</h2>
              <p className="angka mb-3 text-sm text-redup">
                Modal paket {rupiah(hasil.hpp_paket)}. Kalau dibeli terpisah {rupiah(hasil.harga_normal)}, untung {persen(hasil.margin_normal)}.
              </p>
              <div role="radiogroup" aria-label="Pilihan harga" className="grid gap-2 sm:grid-cols-3">
                {hasil.opsi.map((o) => (
                  <button
                    key={o.jenis}
                    role="radio"
                    aria-checked={opsi === o.jenis}
                    onClick={() => {
                      setOpsi(o.jenis);
                      setHarga(o.harga);
                    }}
                    className={`rounded-xl border p-3 text-left ${opsi === o.jenis ? 'border-biru bg-biru-muda' : 'border-garis bg-kartu hover:border-biru'}`}
                  >
                    <p className="text-sm font-semibold">{NAMA_OPSI[o.jenis]}</p>
                    <p className="angka text-xl font-bold">{rupiah(o.harga)}</p>
                    <p className="angka text-xs text-redup">
                      Untung {persen(o.margin)} ({rupiah(o.laba)}), pembeli hemat {rupiah(o.hemat_pelanggan)}
                    </p>
                    <p className="angka mt-1 text-xs">Perlu terjual {persen(o.kenaikan_volume)} lebih banyak supaya total untung sama</p>
                    <div className="mt-2">
                      <Chip status={o.status} />
                    </div>
                  </button>
                ))}
              </div>
              <Field
                className="mt-4 max-w-xs"
                label="Atau tentukan sendiri (Rp)"
                type="number"
                min="0"
                value={harga}
                onChange={(e) => {
                  setHarga(e.target.value);
                  setOpsi(null);
                }}
                hint={marginManual != null ? `Untung ${persen(marginManual)}${marginManual < 0 ? ', rugi' : ''}` : undefined}
              />
            </Kartu>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {hasil && (
            <Kartu className="bg-kuning-muda">
              <h2 className="font-semibold">3. Nama dan caption</h2>
              <p className="mb-3 text-sm text-redup">Bisa diisi sendiri atau minta usulan.</p>
              <Tombol varian="garis" onClick={saran} disabled={proses === 'saran' || !(hargaN > 0)}>
                {proses === 'saran' ? 'Menyusun' : 'Usulkan nama dan caption'}
              </Tombol>
              <Field className="mt-3" label="Nama paket" value={nama} onChange={(e) => setNama(e.target.value)} />
              <Field className="mt-3" label="Caption untuk WhatsApp atau Instagram" as="textarea" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} />
              <Tombol className="mt-4" onClick={simpan} disabled={proses === 'simpan' || !nama.trim() || !(hargaN > 0) || (marginManual ?? 0) < 0}>
                Simpan paket
              </Tombol>
              {(marginManual ?? 0) < 0 && <p className="mt-2 text-sm text-rugi">Harga di bawah modal. Paket rugi tidak bisa disimpan.</p>}
            </Kartu>
          )}
          {tersimpan && (
            <p role="status" className="rounded-xl bg-aman-muda px-3 py-2 text-sm text-aman">
              {tersimpan}
            </p>
          )}
          {galat && (
            <p role="alert" className="rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
              {galat}
            </p>
          )}
          <Kartu>
            <h2 className="mb-2 font-semibold">Paket tersimpan</h2>
            {promo.loading && !promo.data ? <Muat /> : promo.error ? <Galat error={promo.error} ulang={promo.muat} /> : <Tersimpan daftar={promo.data} muat={promo.muat} />}
          </Kartu>
        </div>
      </div>
    </>
  );
}
