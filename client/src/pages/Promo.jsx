import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Minus, PencilSimple, Plus, Sparkle, Trash, WhatsappLogo } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { api, persen, pesanGalat, rupiah } from '../lib/api.js';
import { Field, Galat, Judul, Kartu, Kosong, Muat, Pemutar, Tombol } from '../components/ui.jsx';
import { Segmen } from '../components/Grafik.jsx';
import { hargaAsing } from '../lib/harga.js';

const NAMA_OPSI = { aman: 'Sesuai target', seimbang: 'Diskon sedang', agresif: 'Diskon besar' };

const teksBagikan = (p) => `${p.nama}: ${rupiah(p.harga_paket)}${p.caption ? `\n${p.caption}` : ''}`;
const teksIsi = (items) => items.map((i) => `${i.qty}× ${i.nama ?? `menu ${i.menu_id}`}`).join(', ');

// Judul langkah: nomor bulat biru, lalu judul dan keterangan singkat.
function Langkah({ no, judul, sub, children }) {
  return (
    <Kartu>
      <div className="mb-4 flex items-start gap-3">
        <span className="angka flex size-8 shrink-0 items-center justify-center rounded-full bg-biru text-sm font-bold text-white">{no}</span>
        <div className="min-w-0">
          <h2 className="font-semibold">{judul}</h2>
          {sub && <p className="text-sm text-redup">{sub}</p>}
        </div>
      </div>
      {children}
    </Kartu>
  );
}

function Stepper({ nama, q, ubah }) {
  const tombol = 'flex size-11 items-center justify-center rounded-full border border-garis bg-kartu text-tinta hover:border-biru hover:text-biru disabled:opacity-30 sm:size-9';
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label={`Kurangi ${nama}`} disabled={!q} onClick={() => ubah(q - 1)} className={tombol}>
        <Minus size={14} weight="bold" aria-hidden />
      </button>
      <span className="angka w-8 text-center font-semibold" aria-live="polite">
        {q}
      </span>
      <button type="button" aria-label={`Tambah ${nama}`} onClick={() => ubah(q + 1)} className={tombol}>
        <Plus size={14} weight="bold" aria-hidden />
      </button>
    </div>
  );
}

// Pratinjau: wujud paket seperti yang dilihat pembeli, lalu rincian untung untuk pemilik usaha.
function Pratinjau({ isi, hasil, nama, caption, hargaN, margin }) {
  if (!hasil)
    return (
      <Kartu>
        <p className="font-semibold">Pratinjau paket</p>
        <p className="mt-1 text-sm text-redup">Tambahkan menu di langkah 1. Harga, modal, dan untung paket muncul di sini.</p>
      </Kartu>
    );
  const modal = hasil.hpp_paket;
  const untung = hargaN > 0 ? hargaN - modal : null;
  const hemat = hargaN > 0 ? hasil.harga_normal - hargaN : null;
  const baris = [
    ['Harga normal', rupiah(hasil.harga_normal)],
    ['Modal paket', rupiah(modal)],
    ['Untung per paket', untung == null ? '–' : `${rupiah(untung)} (${persen(margin)})`],
  ];
  return (
    <Kartu>
      <p className="text-sm font-medium text-redup">Pratinjau paket</p>
      <div className="mt-3 rounded-2xl bg-biru p-5 text-white">
        <p className="text-lg font-bold">{nama.trim() || 'Nama paket'}</p>
        <p className="mt-1 text-sm text-white/80">{teksIsi(isi)}</p>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="angka text-3xl font-extrabold">{hargaN > 0 ? rupiah(hargaN) : '–'}</span>
          {hemat > 0 && <span className="angka text-sm text-white/70 line-through">{rupiah(hasil.harga_normal)}</span>}
        </div>
        {hemat > 0 && <span className="angka mt-3 inline-block rounded-full bg-kuning px-3 py-1 text-xs font-bold text-tinta">Hemat {rupiah(hemat)}</span>}
        {caption.trim() && <p className="mt-4 border-t border-white/20 pt-3 text-sm whitespace-pre-line text-white/90">{caption}</p>}
      </div>
      <dl className="mt-4 divide-y divide-garis text-sm">
        {baris.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 py-2">
            <dt className="text-redup">{k}</dt>
            <dd className="angka font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </Kartu>
  );
}

function KartuTersimpan({ p, baru, muat, ubah }) {
  const [info, setInfo] = useState(null);
  const salin = async () => {
    try {
      await navigator.clipboard.writeText(teksBagikan(p));
      setInfo('Teks promo disalin.');
    } catch {
      setInfo('Tidak bisa menyalin otomatis. Tekan lama teks caption untuk menyalin.');
    }
  };
  const [menghapus, setMenghapus] = useState(false);
  const hapus = async () => {
    if (!window.confirm(`Hapus paket ${p.nama}?`)) return;
    setMenghapus(true);
    try {
      await api(`/promo/${p.id}`, { method: 'DELETE' });
      await muat();
    } catch (e) {
      setInfo(pesanGalat(e));
      setMenghapus(false);
    }
  };
  const margin = p.hpp_paket != null ? (p.harga_paket - p.hpp_paket) / p.harga_paket : null;
  const hemat = p.harga_normal != null ? p.harga_normal - p.harga_paket : null;
  const tombol = 'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-garis bg-kartu px-3.5 text-sm font-semibold hover:border-biru hover:text-biru sm:min-h-10';
  return (
    <li className={`flex min-w-0 flex-col rounded-[20px] border bg-kartu p-4 ${baru ? 'border-biru ring-1 ring-biru' : 'border-garis'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {baru && <p className="mb-1 text-xs font-semibold text-biru">{baru}</p>}
          <p className="truncate font-semibold">{p.nama}</p>
          {p.items && <p className="truncate text-xs text-redup">{teksIsi(p.items)}</p>}
        </div>
        <button type="button" aria-label={`Hapus paket ${p.nama}`} onClick={hapus} disabled={menghapus} aria-busy={menghapus || undefined} className="flex size-11 shrink-0 items-center justify-center rounded-full text-redup hover:bg-dasar hover:text-rugi sm:size-9">
          {menghapus ? <Pemutar size={18} /> : <Trash size={18} aria-hidden />}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span className="angka text-2xl font-extrabold">{rupiah(p.harga_paket)}</span>
        {hemat > 0 && <span className="angka text-sm text-redup line-through">{rupiah(p.harga_normal)}</span>}
      </div>
      <p className="angka mt-1 text-xs text-redup">
        {margin != null ? `Untung ${persen(margin)} per paket` : 'Untung belum bisa dihitung'}
        {hemat > 0 && ` · pembeli hemat ${rupiah(hemat)}`}
      </p>
      {p.galat && <p className="mt-1 text-xs text-rugi">{p.galat}</p>}
      {p.caption && <p className="mt-3 rounded-xl bg-dasar px-3 py-2 text-sm whitespace-pre-line">{p.caption}</p>}
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <button type="button" onClick={salin} className={tombol}>
          <Copy size={16} aria-hidden /> Salin teks
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(teksBagikan(p))}`} target="_blank" rel="noreferrer" className={tombol}>
          <WhatsappLogo size={16} aria-hidden /> WhatsApp
        </a>
        {!p.galat && (
          <button type="button" onClick={() => ubah(p)} className={tombol}>
            <PencilSimple size={16} aria-hidden /> Ubah
          </button>
        )}
      </div>
      {info && (
        <p role="status" className="mt-2 text-xs text-redup">
          {info}
        </p>
      )}
    </li>
  );
}

function DaftarTersimpan({ promo, baru, keBuat, ubah }) {
  if (promo.loading && !promo.data) return <Muat />;
  if (promo.error) return <Galat error={promo.error} ulang={promo.muat} />;
  if (!promo.data.length)
    return (
      <Kartu>
        <Kosong judul="Belum ada paket tersimpan" teks="Paket yang disimpan bisa disalin atau dibagikan ke WhatsApp dari sini." aksi={<Tombol onClick={keBuat}>Buat paket</Tombol>} />
      </Kartu>
    );
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {promo.data.map((p) => (
        <KartuTersimpan key={p.id} p={p} baru={p.id === baru?.id ? baru.teks : null} muat={promo.muat} ubah={ubah} />
      ))}
    </ul>
  );
}

export default function Promo() {
  const produk = useApi('/produk');
  const promo = useApi('/promo');
  const [tab, setTab] = useState('buat');
  const [pilih, setPilih] = useState({});
  const [kemasan, setKemasan] = useState('');
  const [hasil, setHasil] = useState(null);
  const [opsi, setOpsi] = useState(null);
  const [harga, setHarga] = useState('');
  const [nama, setNama] = useState('');
  const [caption, setCaption] = useState('');
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(null);
  const [baru, setBaru] = useState(null);
  // Paket yang sedang diubah, dan harganya: dipakai sekali setelah hitungan ulang selesai
  // supaya harga tersimpan tidak tertimpa pilihan bawaan "Diskon sedang".
  const [editP, setEditP] = useState(null);
  const hargaMuat = useRef(null);

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
          if (hargaMuat.current != null) {
            const h = hargaMuat.current;
            hargaMuat.current = null;
            setOpsi(r.opsi.find((o) => o.harga === h)?.jenis ?? null);
            setHarga(h);
            return;
          }
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

  const kosongkan = () => {
    setEditP(null);
    hargaMuat.current = null;
    setPilih({});
    setKemasan('');
    setNama('');
    setCaption('');
    setGalat(null);
  };

  const mulaiUbah = (p) => {
    kosongkan();
    hargaMuat.current = p.harga_paket;
    setEditP(p);
    setPilih(Object.fromEntries(p.items.map((i) => [i.menu_id, i.qty])));
    setKemasan(p.biaya_kemasan ? String(p.biaya_kemasan) : '');
    setNama(p.nama);
    setCaption(p.caption || '');
    setTab('buat');
    window.scrollTo({ top: 0 });
  };

  const simpan = async () => {
    setProses('simpan');
    setGalat(null);
    try {
      const body = { items, nama, caption: caption || null, harga_paket: Number(harga), biaya_kemasan: Number(kemasan) || 0 };
      const r = editP ? await api(`/promo/${editP.id}`, { method: 'PUT', body }) : await api('/promo', { method: 'POST', body });
      setBaru({ id: r?.id ?? editP?.id, teks: editP ? 'Baru diubah' : 'Baru disimpan' });
      setEditP(null);
      setPilih({});
      setKemasan('');
      setNama('');
      setCaption('');
      await promo.muat();
      setTab('tersimpan');
    } catch (e) {
      setGalat(pesanGalat(e));
    } finally {
      setProses(null);
    }
  };

  const hargaN = Number(harga);
  const margin = hasil && hargaN > 0 ? (hargaN - hasil.hpp_paket) / hargaN : null;
  const rugi = margin != null && margin < 0;
  // Harga yang boleh disebut di caption: harga paket, harga normal, dan selisih hematnya.
  const captionAsing = hasil && hargaN > 0 ? hargaAsing(caption, [hargaN, hasil.harga_normal, hasil.harga_normal - hargaN]) : [];
  const siap = nama.trim() && hargaN > 0 && !rugi && !captionAsing.length;
  const lengkap = produk.data.filter((p) => p.lengkap);
  const belum = produk.data.filter((p) => !p.lengkap);
  const isi = items.map((i) => ({ ...i, nama: produk.data.find((p) => p.id === i.menu_id)?.nama }));
  const jumlahTersimpan = promo.data?.length ?? 0;

  return (
    <>
      <Judul judul="Promo paket" sub="Gabungkan menu jadi paket, lalu pilih harga yang tetap untung" />
      <div className="mb-4">
        <Segmen
          label="Bagian promo"
          nilai={tab}
          ubah={setTab}
          pilihan={[
            ['buat', 'Buat paket'],
            ['tersimpan', `Paket tersimpan${jumlahTersimpan ? ` (${jumlahTersimpan})` : ''}`],
          ]}
        />
      </div>

      {tab === 'tersimpan' ? (
        <DaftarTersimpan promo={promo} baru={baru} keBuat={() => setTab('buat')} ubah={mulaiUbah} />
      ) : !produk.data.length ? (
        <Kartu>
          <Kosong judul="Belum ada menu" teks="Paket disusun dari menu yang sudah punya resep." aksi={<Tombol to="/produk/baru">Tambah menu</Tombol>} />
        </Kartu>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            {editP && (
              <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-biru/30 bg-biru-muda px-4 py-2.5 text-sm">
                <span>
                  Mengubah paket <span className="font-semibold">{editP.nama}</span>
                </span>
                <button type="button" onClick={kosongkan} className="inline-flex min-h-11 items-center font-semibold text-biru sm:min-h-9">
                  Batal ubah
                </button>
              </div>
            )}
            <Langkah no="1" judul="Pilih isi paket" sub="Tentukan jumlah tiap menu dalam satu paket.">
              <ul className="divide-y divide-garis">
                {lengkap.map((p) => {
                  const q = pilih[p.id] || 0;
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className={`font-medium ${q ? 'text-biru' : ''}`}>{p.nama}</p>
                        <p className="angka text-xs text-redup">
                          Jual {rupiah(p.harga_jual)} · modal {rupiah(p.hpp)}
                        </p>
                      </div>
                      <Stepper nama={p.nama} q={q} ubah={(v) => setPilih({ ...pilih, [p.id]: v })} />
                    </li>
                  );
                })}
              </ul>
              {belum.length > 0 && (
                <details className="mt-2 rounded-xl bg-dasar px-3 text-sm">
                  <summary className="flex min-h-11 items-center text-redup">{belum.length} menu belum bisa dipakai karena harga bahannya belum lengkap</summary>
                  <ul className="pb-2">
                    {belum.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-1">
                        <span className="min-w-0 truncate">{p.nama}</span>
                        <Link to={`/produk/${p.id}`} className="inline-flex min-h-11 shrink-0 items-center font-semibold text-biru">
                          Lengkapi
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <Field className="mt-4 max-w-xs" label="Biaya kemasan paket (Rp)" type="number" min="0" inputMode="numeric" value={kemasan} onChange={(e) => setKemasan(e.target.value)} hint="Kotak atau kantong khusus paket, kalau ada." />
            </Langkah>

            {hasil && (
              <Langkah no="2" judul="Pilih harga paket" sub={`Modal paket ${rupiah(hasil.hpp_paket)}. Dibeli terpisah ${rupiah(hasil.harga_normal)}.`}>
                <div role="radiogroup" aria-label="Pilihan harga" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {hasil.opsi.map((o) => {
                    const aktif = opsi === o.jenis;
                    return (
                      <button
                        key={o.jenis}
                        type="button"
                        role="radio"
                        aria-checked={aktif}
                        onClick={() => {
                          setOpsi(o.jenis);
                          setHarga(o.harga);
                        }}
                        className={`relative rounded-2xl border p-4 text-left transition-colors ${aktif ? 'border-biru bg-biru-muda ring-1 ring-biru' : 'border-garis bg-kartu hover:border-biru/50'}`}
                      >
                        {aktif && (
                          <span className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-biru text-white" aria-hidden>
                            <Check size={14} weight="bold" />
                          </span>
                        )}
                        <p className="text-sm font-semibold">{NAMA_OPSI[o.jenis]}</p>
                        <p className="angka mt-2 text-2xl font-extrabold">{rupiah(o.harga)}</p>
                        <p className="angka mt-2 text-xs text-redup">Untung {persen(o.margin)} · hemat {rupiah(o.hemat_pelanggan)}</p>
                        <p className={`angka mt-1 text-xs font-medium ${o.status === 'aman' ? 'text-biru' : o.status === 'rugi' ? 'text-rugi' : 'text-kuning-tua'}`}>
                          {o.kenaikan_volume == null ? 'Rugi, tidak disarankan' : o.kenaikan_volume > 0 ? `Perlu terjual ${persen(o.kenaikan_volume)} lebih banyak` : 'Untung total tidak turun'}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <Field
                  className="mt-4 max-w-xs"
                  label="Atau tentukan sendiri (Rp)"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={harga}
                  onChange={(e) => {
                    setHarga(e.target.value);
                    setOpsi(null);
                  }}
                  hint={margin != null ? `Untung ${persen(margin)}${rugi ? ', di bawah modal' : ''}` : undefined}
                />
              </Langkah>
            )}

            {hasil && (
              <Langkah no="3" judul="Nama dan caption" sub="Isi sendiri, atau minta usulan dari AI lalu ubah seperlunya.">
                <Tombol memuat={proses === 'saran'} varian="lembut" onClick={saran} disabled={proses === 'saran' || !(hargaN > 0)}>
                  {proses !== 'saran' && <Sparkle size={16} aria-hidden />} {proses === 'saran' ? 'Menyusun usulan' : 'Usulkan nama dan caption'}
                </Tombol>
                <Field className="mt-4" label="Nama paket" value={nama} onChange={(e) => setNama(e.target.value)} />
                <Field
                  className="mt-3"
                  label="Caption untuk WhatsApp atau Instagram"
                  as="textarea"
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  error={captionAsing.length ? `Caption menyebut ${captionAsing[0].teks}, padahal harga paket ${rupiah(hargaN)}. Ubah angkanya atau hapus dari caption.` : undefined}
                  hint="Harga yang boleh disebut: harga paket, harga normal, dan besar hematnya."
                />
              </Langkah>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6">
            <Pratinjau isi={isi} hasil={hasil} nama={nama} caption={caption} hargaN={hargaN} margin={margin} />
            {hasil && (
              <>
                <Tombol memuat={proses === 'simpan'} className="w-full !min-h-12" onClick={simpan} disabled={proses === 'simpan' || !siap}>
                  {proses === 'simpan' ? 'Menyimpan' : editP ? 'Simpan perubahan' : 'Simpan paket'}
                </Tombol>
                {!nama.trim() && !rugi && <p className="text-center text-xs text-redup">Isi nama paket di langkah 3 untuk menyimpan.</p>}
                {captionAsing.length > 0 && !rugi && <p className="text-center text-xs text-kuning-tua">Harga di caption belum sesuai harga paket.</p>}
                {rugi && (
                  <p role="alert" className="rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
                    Harga di bawah modal. Paket rugi tidak bisa disimpan.
                  </p>
                )}
              </>
            )}
            {galat && (
              <p role="alert" className="rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
                {galat}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
