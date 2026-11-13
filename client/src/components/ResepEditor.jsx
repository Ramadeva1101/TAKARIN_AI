import { useEffect, useId, useRef } from 'react';
import { Plus, Trash } from '@phosphor-icons/react';
import { Field, InputRupiah, Tombol, inputCls } from './ui.jsx';

const kecil = inputCls.replace('w-full', 'shrink-0');
import { api, rupiah } from '../lib/api.js';
import { useApi } from '../lib/hooks.js';

export const resepKosong = () => ({ nama: '', harga_jual: '', porsi_per_batch: 1, bahan: [{ nama: '', qty: '', satuan: '' }] });

const SATUAN = ['g', 'kg', 'ons', 'ml', 'liter', 'sdm', 'sdt', 'gelas', 'siung', 'butir', 'potong', 'ekor', 'pcs', 'buah', 'lembar', 'ikat', 'bungkus', 'sachet'];
const SUMBER = { belanja: 'dari belanja', pasar: 'harga pasar', perkiraan: 'perkiraan Anda' };

export const umurHari = (tanggal) => (tanggal ? Math.floor((Date.now() - new Date(tanggal).getTime()) / 86_400_000) : 0);

const teksHarga = (b) => {
  if (!b?.harga) return null;
  const lama = b.sumber_harga === 'perkiraan' && umurHari(b.tanggal_harga) > 30 ? `, ${umurHari(b.tanggal_harga)} hari lalu` : '';
  return `${rupiah(b.harga.harga)}/${b.harga.satuan} ${SUMBER[b.sumber_harga] ?? ''}${lama}`.trim();
};

// Bahan yang belum punya harga: isi harga beli terakhir supaya modal langsung terhitung,
// tanpa harus catat belanja dulu (misalnya bahannya masih ada di dapur).
function HargaBeli({ b, ubah }) {
  const hb = b.harga_beli ?? { harga: '', qty: 1, satuan: b.satuan?.trim() || 'kg' };
  const set = (p) => ubah({ harga_beli: { ...hb, ...p } });
  const pilihan = [...new Set([b.satuan?.trim(), 'kg', 'gram', 'ons', 'liter', 'ml', 'buah'].filter(Boolean))];
  return (
    <div className="col-span-full -mt-1 rounded-xl bg-kuning-muda px-3 py-2 text-xs">
      <p>Harga beli terakhir {b.nama.trim()} (boleh kira-kira, nanti diganti otomatis saat Anda catat belanja):</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <span>Rp</span>
        <InputRupiah aria-label={`Harga beli ${b.nama}`} placeholder="5.000" className={`${kecil} angka w-28`} value={hb.harga} onChange={(e) => set({ harga: e.target.value })} />
        <span>untuk</span>
        <input aria-label={`Jumlah beli ${b.nama}`} type="number" inputMode="decimal" min="0" step="any" className={`${kecil} angka w-20`} value={hb.qty} onChange={(e) => set({ qty: e.target.value })} />
        <select aria-label={`Satuan beli ${b.nama}`} className={`${kecil} w-28`} value={hb.satuan} onChange={(e) => set({ satuan: e.target.value })}>
          {pilihan.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Keterangan di bawah tiap bahan: bahan ini akan memakai harga dari mana.
// Ini yang menghubungkan resep menu dengan catatan belanja.
function StatusBahan({ b, ubah }) {
  const c = b.cocok;
  if (!b.nama.trim() || !c || c.nama !== b.nama.trim()) return null;
  if (b.bahan_id && c.bahan?.id === b.bahan_id && c.status === 'mirip') {
    return (
      <p className="col-span-full -mt-1 text-xs text-biru">
        Memakai <span className="font-semibold">{c.bahan.nama}</span>
        {teksHarga(c.bahan) ? `, ${teksHarga(c.bahan)}` : ', harga belum ada'}.{' '}
        <button type="button" onClick={() => ubah({ bahan_id: null, baru: false })} className="min-h-9 font-semibold underline">
          Batalkan
        </button>
      </p>
    );
  }
  if (c.status === 'terhubung') {
    const harga = teksHarga(c.bahan);
    return (
      <p className={`col-span-full -mt-1 text-xs ${harga ? 'text-redup' : 'text-kuning-tua'}`}>
        Terhubung ke bahan <span className="font-semibold">{c.bahan.nama}</span>
        {harga ? `, ${harga}` : '.'}
      </p>
    );
  }
  if (c.status === 'mirip' && !b.baru) {
    return (
      <div className="col-span-full -mt-1 rounded-xl bg-kuning-muda px-3 py-2 text-xs">
        <p>
          Mirip bahan <span className="font-semibold">{c.bahan.nama}</span>
          {teksHarga(c.bahan) ? ` (${teksHarga(c.bahan)})` : ''}. Apakah sama?
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <button type="button" onClick={() => ubah({ bahan_id: c.bahan.id, baru: false })} className="min-h-11 rounded-full bg-biru px-3 font-semibold text-white sm:min-h-8">
            Ya, pakai {c.bahan.nama}
          </button>
          <button type="button" onClick={() => ubah({ bahan_id: null, baru: true })} className="min-h-11 rounded-full border border-garis bg-kartu px-3 font-semibold sm:min-h-8">
            Bukan, bahan baru
          </button>
        </div>
      </div>
    );
  }
  return (
    <p className="col-span-full -mt-1 text-xs text-kuning-tua">
      {c.komoditas ? 'Bahan baru. Harga diambil dari harga pasar di kota Anda sampai Anda catat belanjanya.' : 'Bahan baru.'}
      {c.status === 'mirip' && (
        <>
          {' '}
          <button type="button" onClick={() => ubah({ baru: false })} className="min-h-9 font-semibold underline">
            Bandingkan lagi dengan {c.bahan.nama}
          </button>
        </>
      )}
    </p>
  );
}

// Ditanya harga beli kalau bahan belum punya harga dan tidak ada di data pasar.
function perluHargaBeli(b) {
  const c = b.cocok;
  if (!b.nama.trim() || !c || c.nama !== b.nama.trim()) return false;
  if (c.status === 'terhubung' || (c.status === 'mirip' && b.bahan_id === c.bahan?.id)) return !c.bahan?.harga;
  if (c.status === 'baru' || (c.status === 'mirip' && b.baru)) return !c.komoditas;
  return false;
}

// Formulir satu menu: nama, harga, porsi per resep, dan daftar bahan dengan takaran bebas.
export default function ResepEditor({ value, onChange }) {
  const id = useId();
  const daftarBahan = useApi('/bahan');
  const set = (k, v) => onChange({ ...value, [k]: v });
  const setBaris = (i, perubahan) => onChange({ ...value, bahan: value.bahan.map((b, j) => (j === i ? { ...b, ...perubahan } : b)) });
  // Mengganti nama memutus pilihan sebelumnya, supaya harga tidak tertinggal di bahan lama.
  const gantiNama = (i, nama) => setBaris(i, { nama, bahan_id: null, baru: false, harga_beli: null });

  // Periksa nama bahan ke server (dijeda 400 ms) untuk tahu bahan mana yang sudah punya harga.
  const nilaiTerakhir = useRef(value);
  nilaiTerakhir.current = value;
  const kunciNama = value.bahan.map((b) => b.nama.trim()).join('|');
  useEffect(() => {
    const nama = value.bahan.map((b) => b.nama.trim());
    if (!nama.some(Boolean)) return;
    const t = setTimeout(() => {
      api('/bahan/cocokkan', { method: 'POST', body: { nama } })
        .then((hasil) => {
          const kini = nilaiTerakhir.current;
          if (kini.bahan.map((b) => b.nama.trim()).join('|') !== nama.join('|')) return;
          // Baris dari resep yang sudah tersimpan (bahan_id cocok dengan nama) dianggap terhubung.
          onChange({ ...kini, bahan: kini.bahan.map((b, i) => ({ ...b, cocok: hasil[i] })) });
        })
        .catch(() => {});
    }, 400);
    return () => clearTimeout(t);
    // Hanya nama yang memicu pemeriksaan ulang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunciNama]);

  const listSatuan = `${id}-satuan`;
  const listBahan = `${id}-bahan`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nama menu" value={value.nama} onChange={(e) => set('nama', e.target.value)} className="sm:col-span-1" />
        <Field label="Harga jual (Rp)" rupiah value={value.harga_jual ?? ''} onChange={(e) => set('harga_jual', e.target.value)} />
        <Field
          label="Resep ini jadi berapa porsi"
          type="number"
          inputMode="numeric"
          min="1"
          value={value.porsi_per_batch ?? 1}
          onChange={(e) => set('porsi_per_batch', e.target.value)}
          hint="Isi 1 kalau takaran di bawah untuk satu porsi"
        />
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Bahan dan takaran</legend>
        <p className="mb-2 text-xs text-redup">Pilih dari saran nama supaya memakai harga dari catatan belanja Anda.</p>
        <datalist id={listSatuan}>
          {SATUAN.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <datalist id={listBahan}>
          {(daftarBahan.data || []).map((b) => (
            <option key={b.id} value={b.nama} />
          ))}
        </datalist>
        <div className="flex flex-col gap-3">
          {value.bahan.map((b, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_5.5rem_2.75rem] items-center gap-2">
              <input aria-label={`Nama bahan ${i + 1}`} placeholder="cabai rawit" list={listBahan} autoComplete="off" className={inputCls} value={b.nama} onChange={(e) => gantiNama(i, e.target.value)} />
              <input aria-label={`Jumlah bahan ${i + 1}`} placeholder="20" type="number" inputMode="decimal" min="0" step="any" className={`${inputCls} angka`} value={b.qty} onChange={(e) => setBaris(i, { qty: e.target.value })} />
              <input aria-label={`Satuan bahan ${i + 1}`} placeholder="g / sdm" list={listSatuan} className={inputCls} value={b.satuan || ''} onChange={(e) => setBaris(i, { satuan: e.target.value })} />
              <button
                type="button"
                aria-label={`Hapus bahan ${b.nama || i + 1}`}
                disabled={value.bahan.length === 1}
                onClick={() => set('bahan', value.bahan.filter((_, j) => j !== i))}
                className="flex size-11 items-center justify-center rounded-lg text-redup hover:bg-rugi-muda hover:text-rugi disabled:opacity-30"
              >
                <Trash size={18} aria-hidden />
              </button>
              <StatusBahan b={b} ubah={(p) => setBaris(i, p)} />
              {perluHargaBeli(b) && <HargaBeli b={b} ubah={(p) => setBaris(i, p)} />}
            </div>
          ))}
        </div>
        <Tombol varian="hantu" className="mt-2" onClick={() => set('bahan', [...value.bahan, { nama: '', qty: '', satuan: '' }])}>
          <Plus size={16} weight="bold" aria-hidden /> Tambah bahan
        </Tombol>
      </fieldset>
    </div>
  );
}

// Bersihkan baris kosong dan ubah angka sebelum dikirim. Baris yang punya nama tetap ikut,
// supaya takaran yang lupa diisi ketahuan (bukan diam-diam dibuang).
export function rapikanResep(r) {
  return {
    nama: r.nama.trim(),
    harga_jual: Number(r.harga_jual),
    porsi_per_batch: Number(r.porsi_per_batch) || 1,
    bahan: r.bahan
      .filter((b) => b.nama.trim() || String(b.qty ?? '').trim())
      .map((b) => ({
        ...(b.bahan_id ? { bahan_id: b.bahan_id } : {}),
        nama: b.nama.trim(),
        qty: Number(b.qty),
        satuan: b.satuan?.trim() || null,
        ...(perluHargaBeli(b) && Number(b.harga_beli?.harga) > 0 && Number(b.harga_beli?.qty) > 0
          ? { harga_beli: { harga: Number(b.harga_beli.harga), qty: Number(b.harga_beli.qty), satuan: b.harga_beli.satuan } }
          : {}),
      })),
  };
}

/**
 * Pesan masalah pertama sebelum menu disimpan, atau null.
 * @param r hasil rapikanResep
 * @param mentah isi formulir (untuk tahu bahan mirip yang belum dipilih)
 */
export function cekResep(r, mentah) {
  const label = r.nama || 'menu ini';
  if (!r.nama) return 'Nama menu belum diisi';
  if (!(r.harga_jual > 0)) return `Harga jual ${label} belum diisi`;
  if (!r.bahan.length) return `Bahan ${label} belum diisi`;
  const tanpaNama = r.bahan.find((b) => !b.nama);
  if (tanpaNama) return `${label}: ada takaran tanpa nama bahan`;
  const tanpaTakaran = r.bahan.find((b) => !(b.qty > 0));
  if (tanpaTakaran) return `${label}: takaran ${tanpaTakaran.nama} belum diisi`;
  const belumDipilih = mentah?.bahan.find((b) => b.cocok?.status === 'mirip' && b.cocok.nama === b.nama.trim() && !b.bahan_id && !b.baru);
  if (belumDipilih) return `${label}: pilih apakah "${belumDipilih.nama}" sama dengan ${belumDipilih.cocok.bahan.nama} atau bahan baru`;
  return null;
}
