import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks.js';
import { persen, rupiah } from '../lib/api.js';
import { Chip, Galat, Judul, Kartu, Kosong, Muat, Tombol, hargaSatuan, inputCls } from '../components/ui.jsx';
import { Segmen } from '../components/Grafik.jsx';
import { BatangKomposisi } from '../components/Chart.jsx';

// Alasan sebuah bahan perlu dilihat. Urutan = urutan pentingnya.
function alasan(b) {
  const a = [];
  if (b.harga_rata_rata == null && !b.acuan) a.push({ status: 'belum_lengkap', teks: 'Harga belum ada' });
  if (b.perubahan > 0.02) a.push({ status: 'rugi', teks: `Naik ${persen(b.perubahan)} dari belanja sebelumnya` });
  if (b.harga_terakhir && (b.status_acuan === 'di_atas' || b.status_acuan === 'jauh_di_atas')) a.push({ status: b.status_acuan, teks: `${persen(b.selisih_acuan)} di atas harga pasar` });
  return a;
}

function Baris({ b, skala }) {
  const h = hargaSatuan(b.harga_rata_rata ?? b.acuan?.harga_per_satuan_dasar, b.satuan_dasar);
  const utama = b.kontribusi[0];
  const masalah = alasan(b);
  return (
    <li>
      <Link to={`/bahan/${b.id}`} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 rounded-2xl px-3 py-3 transition-colors hover:bg-dasar">
        <div className="min-w-0 flex-1">
          <p className="font-semibold capitalize">{b.nama}</p>
          {utama && (
            <div className="my-1.5 h-2 max-w-sm overflow-hidden rounded-full bg-dasar ring-1 ring-garis" aria-hidden>
              <div className={`h-full rounded-full ${masalah.length ? 'bg-kuning' : 'bg-biru-terang'}`} style={{ width: `${Math.max(3, (b.bagian_terbesar / skala) * 100)}%` }} />
            </div>
          )}
          {utama ? (
            <p className="angka text-sm text-redup">
              {rupiah(utama.biaya)} per porsi {utama.nama}, {persen(utama.bagian)} dari modalnya
              {b.kontribusi.length > 1 && `, juga di ${b.kontribusi.length - 1} menu lain`}
            </p>
          ) : (
            <p className="text-sm text-redup">Belum dipakai di menu</p>
          )}
          {masalah.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {masalah.map((m) => (
                <Chip key={m.teks} status={m.status}>
                  {m.teks}
                </Chip>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="angka font-semibold">{h ? `${rupiah(h.harga)}/${h.satuan}` : '–'}</p>
          <p className="text-xs text-redup">{b.harga_rata_rata != null ? `dari ${b.jumlah_pembelian} belanja` : b.acuan ? 'harga pasar' : ''}</p>
        </div>
      </Link>
    </li>
  );
}

export default function Bahan() {
  const { data, loading, error, muat } = useApi('/bahan');
  const [cari, setCari] = useState('');
  const [tab, setTab] = useState('semua');
  const [menuPilih, setMenuPilih] = useState(null);

  if (loading && !data) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;

  const urut = [...data].sort((a, b) => b.bagian_terbesar - a.bagian_terbesar);
  const teratas = urut.find((b) => b.kontribusi.length);
  const jmlNaik = data.filter((b) => b.perubahan > 0.02).length;
  const jmlAtasPasar = data.filter((b) => b.harga_terakhir && (b.status_acuan === 'di_atas' || b.status_acuan === 'jauh_di_atas')).length;
  const skala = teratas?.bagian_terbesar || 1;
  const FILTER = {
    semua: () => true,
    perlu: (b) => alasan(b).length > 0,
    wajar: (b) => !alasan(b).length,
    naik: (b) => b.perubahan > 0.02,
    pasar: (b) => b.harga_terakhir && (b.status_acuan === 'di_atas' || b.status_acuan === 'jauh_di_atas'),
  };
  const cocok = urut.filter((b) => b.nama.toLowerCase().includes(cari.toLowerCase()) && FILTER[tab](b));
  const jmlPerlu = data.filter(FILTER.perlu).length;
  // Komposisi modal per menu, disusun dari kontribusi setiap bahan.
  const perMenu = new Map();
  for (const b of data)
    for (const k of b.kontribusi) {
      const m = perMenu.get(k.menu_id) || { id: k.menu_id, nama: k.nama, bahan: [] };
      m.bahan.push({ nama: b.nama, biaya: k.biaya, bagian: k.bagian });
      perMenu.set(k.menu_id, m);
    }
  const daftarMenu = [...perMenu.values()].sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  const menuAktif = perMenu.get(menuPilih) || daftarMenu[0];
  const komposisi = menuAktif ? [...menuAktif.bahan].sort((a, b) => b.biaya - a.biaya).slice(0, 7) : [];
  const totalModal = menuAktif ? menuAktif.bahan.reduce((t, x) => t + x.biaya, 0) : 0;
  const ubin = (kunci, warna, label, isi, ket) => (
    <button
      type="button"
      aria-pressed={tab === kunci}
      onClick={() => setTab(tab === kunci ? 'semua' : kunci)}
      className={`min-w-0 rounded-[20px] border bg-kartu p-4 text-left transition-colors ${warna} ${tab === kunci ? 'border-biru ring-1 ring-biru' : 'border-garis hover:border-biru/40'}`}
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 truncate text-2xl font-extrabold">{isi}</p>
      <p className="truncate text-xs text-redup">{ket}</p>
    </button>
  );

  return (
    <>
      <Judul judul="Bahan baku" sub="Diurutkan dari yang paling besar pengaruhnya ke modal menu" aksi={<Tombol varian="garis" to="/belanja">Riwayat belanja</Tombol>} />
      {!data.length ? (
        <Kartu>
          <Kosong judul="Belum ada bahan" teks="Bahan muncul dari resep menu dan catatan belanja." aksi={<Tombol to="/belanja/baru">Catat belanja</Tombol>} />
        </Kartu>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              to={teratas ? `/bahan/${teratas.id}` : '/produk'}
              className="min-w-0 rounded-[20px] border border-garis bg-kartu p-4 transition-colors hover:border-biru/40"
            >
              <p className="text-sm font-medium">Paling berpengaruh ke modal</p>
              <p className="mt-1 truncate text-2xl font-extrabold text-biru capitalize">{teratas ? teratas.nama : '–'}</p>
              <p className="truncate text-xs text-redup">{teratas ? `${persen(teratas.bagian_terbesar)} dari modal ${teratas.kontribusi[0].nama}` : 'Belum ada resep'}</p>
            </Link>
            {ubin('naik', 'text-tinta', 'Naik dari belanja sebelumnya', `${jmlNaik} bahan`, jmlNaik ? 'Ketuk untuk melihat' : 'Belum ada kenaikan dari belanja yang tercatat')}
            {ubin('pasar', 'text-tinta', 'Dibeli di atas harga pasar', `${jmlAtasPasar} bahan`, 'Dibanding harga pasar Bank Indonesia')}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:items-start">
          <Kartu className="lg:order-last lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">Komposisi modal per porsi</h2>
            <p className="text-sm text-redup">Bahan mana yang paling banyak memakan modal satu menu.</p>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Pilih menu">
              {daftarMenu.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={m.id === menuAktif?.id}
                  onClick={() => setMenuPilih(m.id)}
                  className={`min-h-11 sm:min-h-9 rounded-full px-3 text-xs font-semibold transition-colors ${m.id === menuAktif?.id ? 'bg-biru text-white' : 'bg-dasar text-redup ring-1 ring-garis hover:text-tinta'}`}
                >
                  {m.nama}
                </button>
              ))}
            </div>
            {menuAktif ? (
              <>
                <p className="angka mt-4 text-sm text-redup">
                  Total bahan <b className="text-tinta">{rupiah(totalModal)}</b> per porsi {menuAktif.nama}
                </p>
                <div className="mt-2">
                  <BatangKomposisi data={komposisi} menu={menuAktif.nama} />
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-redup">Belum ada menu dengan harga bahan lengkap.</p>
            )}
          </Kartu>
          <Kartu>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Segmen
                label="Saring bahan"
                pilihan={[
                  ['semua', `Semua (${data.length})`],
                  ['perlu', `Perlu dilihat (${jmlPerlu})`],
                  ['wajar', `Harga wajar (${data.length - jmlPerlu})`],
                ]}
                nilai={['naik', 'pasar'].includes(tab) ? null : tab}
                ubah={setTab}
              />
              <label className="sr-only" htmlFor="cari-bahan">
                Cari bahan
              </label>
              <input id="cari-bahan" type="search" placeholder="Cari bahan" className={`${inputCls} max-w-56 rounded-full px-4`} value={cari} onChange={(e) => setCari(e.target.value)} />
            </div>
            {['naik', 'pasar'].includes(tab) && (
              <p className="mb-1 text-sm">
                Menampilkan bahan yang {tab === 'naik' ? 'naik dari belanja sebelumnya' : 'dibeli di atas harga pasar'}.{' '}
                <button type="button" className="min-h-11 font-semibold text-biru" onClick={() => setTab('semua')}>
                  Tampilkan semua
                </button>
              </p>
            )}
            <p className="px-3 pb-1 text-xs text-redup">Panjang batang = bagian bahan itu dari modal satu porsi menu yang paling banyak memakainya.</p>
            {cocok.length ? (
              <ul className="divide-y divide-garis">
                {cocok.map((b) => (
                  <Baris key={b.id} b={b} skala={skala} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-redup">{cari ? `Tidak ada bahan bernama "${cari}".` : 'Tidak ada bahan di kelompok ini.'}</p>
            )}
          </Kartu>
          </div>
        </>
      )}
    </>
  );
}
