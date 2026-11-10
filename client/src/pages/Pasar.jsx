import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import { useApi } from '../lib/hooks.js';
import { api, persen, pesanGalat, rupiah, tanggal } from '../lib/api.js';
import { Chip, Galat, Judul, Kartu, Kosong, Muat, Tombol, hargaSatuan } from '../components/ui.jsx';
import { Segmen } from '../components/Grafik.jsx';
import { AreaHarga, Mini } from '../components/Chart.jsx';

const LEVEL = { kota: 'kota', provinsi: 'rata-rata provinsi', nasional: 'rata-rata nasional' };

export function Perubahan({ nilai, ket }) {
  if (nilai == null) return <span className="text-redup">–</span>;
  if (Math.abs(nilai) < 0.0005) return <span className="text-redup">tetap {ket}</span>;
  const naik = nilai > 0;
  const Ikon = naik ? ArrowUp : ArrowDown;
  return (
    <span className={`angka inline-flex items-center gap-0.5 font-semibold ${naik ? 'text-rugi' : 'text-aman'}`}>
      <Ikon size={14} weight="bold" aria-hidden />
      <span className="sr-only">{naik ? 'naik' : 'turun'}</span>
      {persen(Math.abs(nilai))} <span className="font-normal text-redup">{ket}</span>
    </span>
  );
}

// Panel rincian satu komoditas: harga, perubahan, grafik yang bisa disentuh, dan menu yang memakainya.
function Rincian({ d, belanja }) {
  const punya = belanja.filter((b) => b.harga_terakhir && d.bahan.some((x) => x.id === b.id));
  return (
    <Kartu className="lg:sticky lg:top-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl leading-relaxed font-bold capitalize">{d.komoditas}</h2>
          <p className="text-sm text-redup">
            {d.wilayah}, {LEVEL[d.level]} · {tanggal(d.tanggal)}
          </p>
        </div>
        <p className="angka text-right text-2xl font-extrabold">
          {rupiah(d.harga)}
          <span className="text-sm font-normal text-redup">/{d.satuan}</span>
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-dasar px-3 py-2">
          <p className="text-xs text-redup">{d.tanggal_sebelumnya ? `Dibanding ${tanggal(d.tanggal_sebelumnya)}` : 'Dibanding data sebelumnya'}</p>
          <Perubahan nilai={d.perubahan_harian} ket="" />
        </div>
        <div className="rounded-xl bg-dasar px-3 py-2">
          <p className="text-xs text-redup">Dalam seminggu</p>
          <Perubahan nilai={d.perubahan_mingguan} ket="" />
        </div>
      </div>
      <div className="mt-4">
        <AreaHarga data={d.riwayat} satuan={d.satuan} label={`Harga ${d.komoditas} di ${d.wilayah}, ${d.riwayat.length} data terakhir`} />
      </div>
      {punya.length > 0 && (
        <div className="mt-4 rounded-2xl bg-kuning-muda/70 p-3.5 ring-1 ring-kuning/40">
          <p className="text-sm font-semibold">Harga belanja Anda</p>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {punya.map((b) => {
              const h = hargaSatuan(b.harga_terakhir.harga_per_satuan, b.satuan_dasar);
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <Link to={`/bahan/${b.id}`} className="font-medium capitalize hover:text-biru">
                    {b.nama} <span className="angka text-redup">{h && `${rupiah(h.harga)}/${h.satuan}`}</span>
                  </Link>
                  <Chip status={b.status_acuan}>
                    {b.selisih_acuan == null ? 'Tanpa acuan' : Math.abs(b.selisih_acuan) < 0.005 ? 'Sama dengan pasar' : `${persen(Math.abs(b.selisih_acuan))} ${b.selisih_acuan > 0 ? 'di atas' : 'di bawah'} pasar`}
                  </Chip>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {d.menu.length > 0 ? (
        <div className="mt-4 border-t border-garis pt-3">
          <p className="text-sm text-redup">Dipakai di menu</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {d.menu.map((m) => (
              <Link key={m.id} to={`/produk/${m.id}`} className="inline-flex min-h-11 items-center rounded-full bg-biru-muda px-4 text-sm font-semibold text-biru-tua hover:bg-[#dce8ff]">
                {m.nama}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-garis pt-3 text-sm text-redup">Belum dipakai di resep Anda. Ditampilkan sebagai gambaran harga di daerah Anda.</p>
      )}
    </Kartu>
  );
}

function BarisKomoditas({ d, aktif, pilih }) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={aktif}
        onClick={pilih}
        className={`grid w-full grid-cols-[1fr_4.5rem_auto] items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${aktif ? 'bg-biru-muda ring-1 ring-biru/30' : 'hover:bg-dasar'}`}
      >
        <span className="min-w-0">
          <span className={`block truncate font-semibold capitalize ${aktif ? 'text-biru-tua' : ''}`}>{d.komoditas}</span>
          <span className="angka block text-xs text-redup">{`${rupiah(d.harga)}/${d.satuan}`}</span>
        </span>
        <Mini data={d.riwayat} label={`Tren ${d.komoditas}`} />
        <span className="w-16 text-right text-sm">
          <Perubahan nilai={d.perubahan_mingguan} ket="" />
        </span>
      </button>
    </li>
  );
}

export default function Pasar() {
  const { data, loading, error, muat } = useApi('/pasar');
  const bahan = useApi('/bahan');
  const [proses, setProses] = useState(false);
  const [galatPerbarui, setGalatPerbarui] = useState(null);
  const { state } = useLocation();
  const [pilih, setPilih] = useState(state?.komoditas ?? null);
  const [tampil, setTampil] = useState('saya');
  const [urut, setUrut] = useState('pakai');
  const rincianRef = useRef(null);
  const berjalan = data?.sinkron?.berjalan;

  // Server sedang menarik data: cek lagi sebentar lagi.
  useEffect(() => {
    if (!berjalan) return;
    const t = setTimeout(muat, 5000);
    return () => clearTimeout(t);
  }, [berjalan, data, muat]);

  const perbarui = async () => {
    setProses(true);
    setGalatPerbarui(null);
    try {
      await api('/pasar/perbarui', { method: 'POST' });
      await muat();
    } catch (err) {
      setGalatPerbarui(pesanGalat(err));
    } finally {
      setProses(false);
    }
  };

  if (loading && !data) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;

  const dipakai = data.harga.filter((d) => d.bahan.length);
  const naikMinggu = data.harga.filter((d) => d.perubahan_mingguan > 0.0005).sort((a, b) => b.perubahan_mingguan - a.perubahan_mingguan);
  const turunMinggu = data.harga.filter((d) => d.perubahan_mingguan < -0.0005).length;
  const daftar = [...(tampil === 'saya' && dipakai.length ? dipakai : data.harga)].sort(
    urut === 'naik' ? (a, b) => (b.perubahan_mingguan ?? -9) - (a.perubahan_mingguan ?? -9) : urut === 'nama' ? (a, b) => a.komoditas.localeCompare(b.komoditas, 'id') : () => 0,
  );
  const terpilih = data.harga.find((d) => d.komoditas === pilih) || daftar[0];
  const pilihKomoditas = (k) => {
    setPilih(k);
    // Di HP panel rincian ada di atas daftar: gulir ke sana supaya hasil ketukan terlihat.
    if (window.matchMedia('(max-width: 1023px)').matches) rincianRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const terbaru = data.harga.reduce((t, d) => (d.tanggal > t ? d.tanggal : t), '');
  const sumber = [...new Set(data.harga.map((d) => d.sumber))].join(', ');
  const tempat = [data.wilayah.kota, data.wilayah.provinsi].filter(Boolean).join(', ');

  return (
    <>
      <Judul
        judul="Harga pasar"
        sub={`${tempat || 'Wilayah belum diisi'} · data per ${terbaru ? tanggal(terbaru) : 'belum ada'}`}
        aksi={
          data.sinkron.aktif && (
            <Tombol varian="garis" onClick={perbarui} disabled={proses || berjalan}>
              {proses || berjalan ? 'Mengambil data' : 'Perbarui sekarang'}
            </Tombol>
          )
        }
      />
      {(berjalan || galatPerbarui || data.sinkron.galat.length > 0) && (
        <div role="status" className={`mb-4 rounded-xl px-3 py-2 text-sm ${berjalan ? 'bg-biru-muda text-biru-tua' : 'bg-waspada-muda text-waspada'}`}>
          {berjalan ? (
            'Mengambil harga terbaru dari PIHPS Bank Indonesia. Bisa sampai setengah menit.'
          ) : (
            <>
              <p className="font-semibold">Server PIHPS Bank Indonesia belum bisa dihubungi.</p>
              <p>Harga di bawah adalah data tersimpan terakhir. Coba perbarui lagi beberapa saat lagi.</p>
              <details className="mt-1 text-xs opacity-80">
                <summary className="inline-flex min-h-11 sm:min-h-9 items-center">Rincian teknis</summary>
                {galatPerbarui && <p>{galatPerbarui}</p>}
                {data.sinkron.galat.map((g) => (
                  <p key={g}>{g}</p>
                ))}
              </details>
            </>
          )}
        </div>
      )}

      {!data.harga.length ? (
        <Kartu>
          <Kosong judul="Belum ada data harga pasar" teks="Harga pasar untuk daerah Anda belum tersedia. Coba tekan Perbarui sekarang, atau kembali beberapa saat lagi." />
        </Kartu>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => setUrut('naik')} className="rounded-[20px] border border-garis bg-kartu p-4 text-left transition-colors hover:border-biru/40">
              <p className="text-sm text-redup">Naik dalam seminggu</p>
              <p className="angka mt-1 text-2xl font-extrabold text-rugi">{naikMinggu.length} <span className="text-sm font-semibold">komoditas</span></p>
              <p className="truncate text-xs text-redup">{naikMinggu.length ? `Tertinggi: ${naikMinggu[0].komoditas} ${persen(naikMinggu[0].perubahan_mingguan)}` : 'Tidak ada'}</p>
            </button>
            <div className="rounded-[20px] border border-garis bg-kartu p-4">
              <p className="text-sm text-redup">Turun dalam seminggu</p>
              <p className="angka mt-1 text-2xl font-extrabold text-aman">{turunMinggu} <span className="text-sm font-semibold">komoditas</span></p>
              <p className="text-xs text-redup">Dari {data.harga.length} komoditas terpantau</p>
            </div>
            <div className="rounded-[20px] border border-garis bg-kartu p-4">
              <p className="text-sm text-redup">Dipakai di resep Anda</p>
              <p className="angka mt-1 text-2xl font-extrabold text-biru">{dipakai.length} <span className="text-sm font-semibold">komoditas</span></p>
              <p className="text-xs text-redup">Harga belanja dibandingkan otomatis</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-start">
            <div ref={rincianRef} className="scroll-mt-20 lg:order-last">
              {terpilih && <Rincian d={terpilih} belanja={bahan.data || []} />}
            </div>
            <Kartu>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Segmen
                  label="Komoditas yang ditampilkan"
                  pilihan={[
                    ['saya', `Bahan saya (${dipakai.length})`],
                    ['semua', `Semua (${data.harga.length})`],
                  ]}
                  nilai={tampil}
                  ubah={setTampil}
                />
                <label className="flex items-center gap-2 text-sm text-redup">
                  Urutkan
                  <select value={urut} onChange={(e) => setUrut(e.target.value)} className="min-h-11 rounded-full border border-garis bg-kartu px-3 text-sm text-tinta">
                    <option value="pakai">Paling sering dipakai</option>
                    <option value="naik">Naik paling tinggi</option>
                    <option value="nama">Nama</option>
                  </select>
                </label>
              </div>
              {daftar.length ? (
                <ul className="flex flex-col gap-1">
                  {daftar.map((d) => (
                    <BarisKomoditas key={d.komoditas} d={d} aktif={d.komoditas === terpilih?.komoditas} pilih={() => pilihKomoditas(d.komoditas)} />
                  ))}
                </ul>
              ) : (
                <Kosong judul="Belum ada bahan yang cocok" teks="Isi kolom komoditas pasar di halaman bahan baku supaya harganya terpantau di sini." />
              )}
            </Kartu>
          </div>

          <p className="mt-6 max-w-2xl text-xs text-redup">
            Sumber: {sumber}
            {sumber.includes('PIHPS') && (
              <>
                {' '}
                (<a className="underline" href="https://www.bi.go.id/hargapangan" target="_blank" rel="noreferrer">bi.go.id/hargapangan</a>), harga pasar tradisional.
              </>
            )}{' '}
            Harga diambil bertingkat: kota dulu, lalu provinsi, lalu nasional kalau data kota belum ada. Harga yang lebih dari 7 hari tidak dipakai untuk menilai harga belanja.
          </p>
        </>
      )}
    </>
  );
}
