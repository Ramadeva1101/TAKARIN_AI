import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trash, WarningCircle } from '@phosphor-icons/react';
import { useApi } from '../lib/hooks.js';
import { api, persen, pesanGalat, rupiah, tanggal } from '../lib/api.js';
import { Chip, Field, Galat, Judul, Kartu, Muat, Tombol, inputCls } from '../components/ui.jsx';
import { bandingNama } from '../lib/cocok.js';
import IsiSatuan from '../components/IsiSatuan.jsx';

// Satuan yang sudah dikenal untuk menjawab isi kemasan, dari analisis server.
const pilihanIsi = (x) => (x.masalah || []).find((m) => m.kode === 'konversi')?.pilihan ?? [];

// Pilihan cara mengukur bahan baru. "Dihitung per ikat" lebih jelas daripada "pcs" untuk sayur per ikat.
const SATUAN_STANDAR = ['g', 'gram', 'gr', 'kg', 'kilo', 'ons', 'ml', 'liter', 'l', 'ltr'];
const SATUAN_DASAR = (satuan) => {
  const s = (satuan || '').trim().toLowerCase();
  const hitung = s && !SATUAN_STANDAR.includes(s) && !['butir', 'pcs', 'buah'].includes(s) ? `dihitung per ${s}` : 'dihitung per buah';
  return [
    ['g', 'ditimbang (gram)'],
    ['ml', 'ditakar (ml, untuk cairan)'],
    ['butir', 'per butir'],
    ['pcs', hitung],
  ];
};
const perluIsiGram = (x) => ['g', 'ml'].includes(x.satuan_dasar) && !SATUAN_STANDAR.includes((x.satuan || '').trim().toLowerCase());

function Acuan({ it }) {
  if (!it.acuan && !it.harga_terakhir) return null;
  return (
    <div className="angka mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-redup">
      {it.harga_satuan && <span>{`Terbaca ${rupiah(it.harga_satuan.harga)}/${it.harga_satuan.satuan}`}</span>}
      {it.harga_terakhir && <span>{`Beli terakhir ${rupiah(it.harga_terakhir.harga)}/${it.harga_terakhir.satuan}`}</span>}
      {it.acuan && (
        <span>
          {`Pasar ${it.acuan.wilayah} ${rupiah(it.acuan.harga)}/${it.acuan.satuan}`}
          {it.selisih_acuan != null && ` (${it.selisih_acuan > 0 ? '+' : ''}${persen(it.selisih_acuan)})`}
        </span>
      )}
      {it.status_acuan && it.status_acuan !== 'tanpa_acuan' && <Chip status={it.status_acuan} />}
    </div>
  );
}

function Dampak({ hasil }) {
  const { dampak, ringkasan } = hasil;
  return (
    <Kartu className="border-biru/40">
      <h2 className="text-lg font-bold">Belanja tersimpan</h2>
      <p className="mt-1 text-sm text-redup">
        {ringkasan.jumlah_item} bahan, total <span className="angka font-semibold text-tinta">{rupiah(ringkasan.total)}</span>.{' '}
        {ringkasan.menu_terdampak ? `${ringkasan.menu_terdampak} menu ikut berubah modalnya.` : 'Tidak ada menu yang modalnya berubah.'}
      </p>
      {dampak.length > 0 && (
        <ul className="mt-4 divide-y divide-garis">
          {dampak.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <Link to={`/produk/${d.id}`} className="font-semibold hover:text-biru">
                  {d.nama}
                </Link>
                <p className="angka text-sm text-redup">
                  Modal {rupiah(d.hpp_lama)} menjadi <span className="font-semibold text-tinta">{rupiah(d.hpp_baru)}</span>, untung {persen(d.margin_lama)} menjadi{' '}
                  <span className="font-semibold text-tinta">{persen(d.margin_baru)}</span>
                </p>
                <p className="text-xs text-redup">Karena: {d.bahan_terkait.join(', ')}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Chip status={d.status_baru} />
                {d.status_baru !== 'aman' && d.harga_aman && <span className="angka text-xs">Harga minimal {rupiah(d.harga_aman)}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Tombol to="/">Ke ringkasan</Tombol>
        <Tombol varian="garis" to="/belanja/baru">
          Catat belanja lain
        </Tombol>
      </div>
    </Kartu>
  );
}

function Tersimpan({ n, hapus, galat, menghapus }) {
  return (
    <Kartu>
      <ul className="divide-y divide-garis">
        {n.item.map((it) => (
          <li key={it.id} className="py-3">
            <div className="flex justify-between gap-3">
              <span className="font-medium capitalize">{it.bahan_nama || it.nama_bahan}</span>
              <span className="angka font-semibold">{rupiah(it.harga)}</span>
            </div>
            <p className="angka text-sm text-redup">
              {it.qty} {it.satuan}
            </p>
            <Acuan it={it} />
          </li>
        ))}
      </ul>
      <div className="tepi-nota mt-2 flex flex-wrap items-center justify-between gap-3 pt-4">
        <p className="text-sm text-redup">Salah catat? Hapus belanja ini, lalu catat ulang. Modal menu dihitung ulang tanpa belanja ini.</p>
        <Tombol varian="bahaya" className="border border-rugi/30" onClick={hapus} memuat={menghapus}>
          Hapus belanja
        </Tombol>
      </div>
      {galat && <p role="alert" className="mt-2 text-sm text-rugi">{galat}</p>}
    </Kartu>
  );
}

export default function BelanjaCek() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: n, loading, error, muat } = useApi(`/pembelian/${id}`);
  const daftarBahan = useApi('/bahan');
  const [item, setItem] = useState([]);
  const [toko, setToko] = useState('');
  const [tgl, setTgl] = useState('');
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState(null);
  const [proses, setProses] = useState(false);
  const [menghapus, setMenghapus] = useState(false);

  useEffect(() => {
    if (!n) return;
    setToko(n.nama_toko || '');
    setTgl(n.tanggal);
    setItem(n.item.map((it) => ({ ...it, satuan_dasar: it.satuan_dasar || '', qty: it.qty ?? '', harga: it.harga ?? '', satuan: it.satuan || '' })));
  }, [n]);

  if (loading && !n) return <Muat />;
  if (error) return <Galat error={error} ulang={muat} />;
  if (hasil) return <Dampak hasil={hasil} />;

  const sumber = { foto: 'foto nota', suara: 'ucapan', teks: 'ketikan', manual: 'isian tabel' }[n.sumber];
  const hapus = async () => {
    if (!window.confirm(n.status === 'disimpan' ? 'Hapus belanja ini? Harga dari belanja ini tidak dipakai lagi untuk menghitung modal.' : 'Buang catatan belanja ini?')) return;
    setGalat(null);
    setMenghapus(true);
    try {
      await api(`/pembelian/${id}`, { method: 'DELETE' });
      nav('/belanja', { replace: true });
    } catch (err) {
      setGalat(pesanGalat(err));
      setMenghapus(false);
    }
  };

  if (n.status === 'disimpan') {
    return (
      <>
        <Judul judul={n.nama_toko || 'Belanja'} sub={`${tanggal(n.tanggal)} · dari ${sumber}`} kembali="/belanja" />
        <Tersimpan n={n} hapus={hapus} galat={galat} menghapus={menghapus} />
      </>
    );
  }

  const semuaBahan = daftarBahan.data || [];
  // Baris yang sudah diubah pengguna dianggap sudah dicek: peringatan baca/harga hilang.
  // Nama bahan dicocokkan ulang ke daftar bahan supaya harga tidak masuk ke bahan yang salah.
  const set = (i, k, v) =>
    setItem(
      item.map((x, j) => {
        if (j !== i) return x;
        // Peringatan bahan (baru, mirip, konversi) tetap ada sampai namanya diputuskan.
        // Satuan diganti: pertanyaan isi lama tidak berlaku lagi (server memeriksa ulang saat disimpan).
        const tetap = k === 'satuan' ? ['bahan_baru', 'bahan_mirip'] : ['bahan_baru', 'bahan_mirip', 'konversi'];
        const baru = { ...x, [k]: v, masalah: (x.masalah || []).filter((m) => tetap.includes(m.kode)) };
        if (k === 'nama_bahan') {
          // Aturan yang sama dengan server: "cabe rawit" = "cabai rawit", tetapi "gula merah" bukan "gula pasir".
          const cocok = semuaBahan.find((b) => bandingNama(b.nama, v) === 'persis');
          const mirip = !cocok && semuaBahan.find((b) => bandingNama(b.nama, v) === 'mirip');
          baru.bahan_id = cocok?.id ?? null;
          baru.bahan_nama = cocok?.nama ?? null;
          baru.masalah = baru.masalah.filter((m) => m.kode !== 'bahan_baru' && m.kode !== 'bahan_mirip');
          if (!cocok && v.trim()) {
            baru.masalah.push({
              kode: 'bahan_baru',
              pesan: mirip
                ? `"${v.trim()}" belum ada. Mirip "${mirip.nama}": ketik "${mirip.nama}" kalau sama, atau biarkan untuk disimpan sebagai bahan baru.`
                : `"${v.trim()}" belum ada di daftar bahan. Pilih dari saran kalau sebenarnya sama, atau biarkan untuk disimpan sebagai bahan baru.`,
            });
          }
        }
        return baru;
      }),
    );
  const total = item.reduce((s, x) => s + (Number(x.harga) || 0), 0);
  const perluCek = item.filter((x) => (x.masalah || []).some((m) => m.kode !== 'bahan_baru')).length;

  const simpan = async () => {
    setGalat(null);
    const kurang = item.find((x) => !x.nama_bahan.trim() || !(Number(x.qty) > 0) || !x.satuan.trim() || !(Number(x.harga) > 0));
    if (kurang) return setGalat(`Lengkapi jumlah, satuan, dan harga untuk "${kurang.nama_bahan || kurang.teks_asli || 'baris kosong'}"`);
    // Bahan yang hanya mirip namanya harus dipastikan dulu, supaya harga ceker tidak masuk ke dada ayam.
    const mirip = item.find((x) => (x.masalah || []).some((m) => m.kode === 'bahan_mirip'));
    if (mirip) return setGalat(`Pastikan "${mirip.nama_bahan}" memang sama dengan ${mirip.bahan_nama}, atau ganti nama bahannya.`);
    const tanpaIsi = item.find((x) => ((x.masalah || []).some((m) => m.kode === 'konversi') || ((x.masalah || []).some((m) => m.kode === 'bahan_baru') && perluIsiGram(x))) && !(Number(x.konversi_isi?.jumlah) > 0) && !(Number(x.konversi_faktor) > 0));
    if (tanpaIsi) return setGalat(`Isi satuan ${tanpaIsi.satuan} untuk "${tanpaIsi.nama_bahan}" belum diisi.`);
    setProses(true);
    try {
      const r = await api(`/pembelian/${id}`, {
        method: 'PUT',
        body: {
          nama_toko: toko || null,
          tanggal: tgl,
          item: item.map((x) => ({
            teks_asli: x.teks_asli,
            nama_bahan: x.nama_bahan.trim(),
            bahan_id: x.bahan_id || null,
            satuan_dasar: x.bahan_id ? null : x.satuan_dasar || null,
            qty: Number(x.qty),
            satuan: x.satuan.trim(),
            harga: Number(x.harga),
            konversi_faktor: Number(x.konversi_faktor) || null,
            konversi_isi: Number(x.konversi_isi?.jumlah) > 0 ? { jumlah: Number(x.konversi_isi.jumlah), ke: x.konversi_isi.ke || pilihanIsi(x)[0]?.satuan } : null,
          })),
        },
      });
      setHasil(r);
      window.scrollTo(0, 0);
    } catch (err) {
      setGalat(pesanGalat(err));
      setProses(false);
    }
  };

  return (
    <>
      <Judul judul="Periksa belanja" sub={`Hasil baca dari ${sumber}. Baris kuning perlu Anda lihat.`} kembali="/belanja" />

      {n.transkrip && n.sumber === 'suara' && (
        <Kartu className="mb-4 bg-dasar">
          <p className="text-sm text-redup">Yang terdengar:</p>
          <p className="mt-1 italic">{n.transkrip}</p>
        </Kartu>
      )}

      <Kartu>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama toko" value={toko} onChange={(e) => setToko(e.target.value)} />
          <Field label="Tanggal belanja" type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} />
        </div>

        {n.total_tertulis != null && Math.abs(n.total_tertulis - total) > 1 && (
          <p className="mt-4 rounded-xl bg-waspada-muda px-3 py-2 text-sm text-waspada">
            Total di nota <span className="angka font-semibold">{rupiah(n.total_tertulis)}</span>, jumlah baris <span className="angka font-semibold">{rupiah(total)}</span>. Mungkin ada baris yang salah baca.
          </p>
        )}

        <datalist id="daftar-bahan">
          {semuaBahan.map((b) => (
            <option key={b.id} value={b.nama} />
          ))}
        </datalist>
        <ul className="tepi-nota mt-4 flex flex-col gap-3 pt-4">
          {item.map((x, i) => {
            const masalah = x.masalah || [];
            const kuning = masalah.some((m) => m.kode !== 'bahan_baru');
            return (
              <li key={x.id ?? i} className={`rounded-xl p-3 ${kuning ? 'bg-waspada-muda' : 'bg-dasar'}`}>
                {x.teks_asli && <p className="mb-2 font-mono text-xs text-redup">Tertulis: {x.teks_asli}</p>}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_5rem_5rem_8rem_2.75rem]">
                  <input aria-label={`Nama bahan ${i + 1}`} list="daftar-bahan" className={`${inputCls} col-span-2 sm:col-span-1`} value={x.nama_bahan} onChange={(e) => set(i, 'nama_bahan', e.target.value)} />
                  <input aria-label={`Jumlah ${i + 1}`} type="number" min="0" step="any" className={`${inputCls} angka`} value={x.qty} onChange={(e) => set(i, 'qty', e.target.value)} />
                  <input aria-label={`Satuan ${i + 1}`} className={inputCls} value={x.satuan} onChange={(e) => set(i, 'satuan', e.target.value)} />
                  <input aria-label={`Harga total ${i + 1}`} type="number" min="0" placeholder="Rp" className={`${inputCls} angka`} value={x.harga} onChange={(e) => set(i, 'harga', e.target.value)} />
                  <button
                    type="button"
                    aria-label={`Hapus baris ${x.nama_bahan || i + 1}`}
                    disabled={item.length === 1}
                    onClick={() => setItem(item.filter((_, j) => j !== i))}
                    className="flex size-11 items-center justify-center rounded-lg text-redup hover:bg-rugi-muda hover:text-rugi disabled:opacity-30"
                  >
                    <Trash size={18} aria-hidden />
                  </button>
                </div>
                {masalah.map((m) => (
                  <p key={m.kode} className={`mt-2 flex items-start gap-1.5 text-sm ${m.kode === 'bahan_baru' ? 'text-redup' : 'text-waspada'}`}>
                    <WarningCircle size={18} className="mt-0.5 shrink-0" aria-hidden /> {m.pesan}
                  </p>
                ))}
                {masalah.some((m) => m.kode === 'bahan_mirip') && (
                  <button
                    type="button"
                    onClick={() => setItem(item.map((y, j) => (j === i ? { ...y, masalah: y.masalah.filter((m) => m.kode !== 'bahan_mirip') } : y)))}
                    className="mt-2 inline-flex min-h-11 items-center rounded-full bg-biru px-4 text-sm font-semibold text-white sm:min-h-9"
                  >
                    Benar, sama dengan {x.bahan_nama}
                  </button>
                )}
                {masalah.some((m) => m.kode === 'bahan_baru') && (
                  <label className="mt-2 block text-sm">
                    <span className="font-medium">Bahan baru ini diukur dengan</span>
                    <select className={`${inputCls} mt-1`} value={x.satuan_dasar} onChange={(e) => set(i, 'satuan_dasar', e.target.value)}>
                      <option value="">Tebak otomatis</option>
                      {SATUAN_DASAR(x.satuan).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {masalah.some((m) => m.kode === 'bahan_baru') && !masalah.some((m) => m.kode === 'konversi') && perluIsiGram(x) && (
                  <label className="mt-2 block text-sm">
                    <span className="font-medium">{`1 ${x.satuan} ${x.nama_bahan} kira-kira berapa ${x.satuan_dasar === 'ml' ? 'ml' : 'gram'}?`}</span>
                    <input type="number" min="0" step="any" className={`${inputCls} angka mt-1`} value={x.konversi_faktor || ''} onChange={(e) => set(i, 'konversi_faktor', e.target.value)} />
                  </label>
                )}
                {masalah.some((m) => m.kode === 'konversi') &&
                  (pilihanIsi(x).length ? (
                    <div className="mt-2">
                      <p className="mb-1 text-sm font-medium">Isi satuan ini supaya harganya bisa dibagi ke resep:</p>
                      <IsiSatuan nama={x.nama_bahan} satuan={x.satuan} pilihan={pilihanIsi(x)} sisi="beli" nilai={x.konversi_isi ?? {}} ubah={(v) => set(i, 'konversi_isi', v)} />
                    </div>
                  ) : (
                    <label className="mt-2 block text-sm">
                      <span className="font-medium">{`1 ${x.satuan || 'satuan'} berapa ${x.satuan_dasar || 'gram'}?`}</span>
                      <input type="number" min="0" step="any" className={`${inputCls} angka mt-1`} value={x.konversi_faktor || ''} onChange={(e) => set(i, 'konversi_faktor', e.target.value)} />
                    </label>
                  ))}
                <Acuan it={x} />
              </li>
            );
          })}
        </ul>

        <div className="tepi-nota mt-4 flex items-center justify-between pt-4">
          <span className="font-semibold">Total</span>
          <span className="angka text-lg font-bold">{rupiah(total)}</span>
        </div>
        {perluCek > 0 && <p className="mt-1 text-sm text-waspada">{perluCek} baris perlu dicek sebelum disimpan.</p>}

        {galat && (
          <p role="alert" className="mt-4 rounded-xl bg-rugi-muda px-3 py-2 text-sm text-rugi">
            {galat}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Tombol memuat={proses} onClick={simpan} disabled={proses}>
            {proses ? 'Menyimpan' : 'Simpan dan hitung ulang modal'}
          </Tombol>
          <Tombol varian="bahaya" onClick={hapus} memuat={menghapus}>
            Buang
          </Tombol>
        </div>
      </Kartu>
    </>
  );
}
