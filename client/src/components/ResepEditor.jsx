import { Plus, Trash } from '@phosphor-icons/react';
import { Field, Tombol, inputCls } from './ui.jsx';

export const resepKosong = () => ({ nama: '', harga_jual: '', porsi_per_batch: 1, bahan: [{ nama: '', qty: '', satuan: '' }] });

const SATUAN = ['g', 'kg', 'ml', 'liter', 'sdm', 'sdt', 'gelas', 'siung', 'butir', 'potong', 'ekor', 'pcs'];

// Formulir satu produk: nama, harga, porsi per resep, dan daftar bahan dengan takaran bebas.
export default function ResepEditor({ value, onChange, judul }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const setBahan = (i, k, v) => set('bahan', value.bahan.map((b, j) => (j === i ? { ...b, [k]: v } : b)));
  const listId = `satuan-${judul || 'resep'}`.replace(/\s/g, '');

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nama menu" value={value.nama} onChange={(e) => set('nama', e.target.value)} className="sm:col-span-1" />
        <Field label="Harga jual (Rp)" type="number" inputMode="numeric" min="0" value={value.harga_jual ?? ''} onChange={(e) => set('harga_jual', e.target.value)} />
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
        <legend className="mb-2 text-sm font-medium">Bahan dan takaran</legend>
        <datalist id={listId}>
          {SATUAN.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="flex flex-col gap-2">
          {value.bahan.map((b, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_5.5rem_2.75rem] items-center gap-2">
              <input aria-label={`Nama bahan ${i + 1}`} placeholder="cabai rawit" className={inputCls} value={b.nama} onChange={(e) => setBahan(i, 'nama', e.target.value)} />
              <input aria-label={`Jumlah bahan ${i + 1}`} placeholder="20" type="number" inputMode="decimal" min="0" step="any" className={`${inputCls} angka`} value={b.qty} onChange={(e) => setBahan(i, 'qty', e.target.value)} />
              <input aria-label={`Satuan bahan ${i + 1}`} placeholder="g / sdm" list={listId} className={inputCls} value={b.satuan || ''} onChange={(e) => setBahan(i, 'satuan', e.target.value)} />
              <button
                type="button"
                aria-label={`Hapus bahan ${b.nama || i + 1}`}
                disabled={value.bahan.length === 1}
                onClick={() => set('bahan', value.bahan.filter((_, j) => j !== i))}
                className="flex size-11 items-center justify-center rounded-lg text-redup hover:bg-rugi-muda hover:text-rugi disabled:opacity-30"
              >
                <Trash size={18} aria-hidden />
              </button>
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

// Bersihkan baris kosong dan ubah angka sebelum dikirim.
export function rapikanResep(r) {
  return {
    nama: r.nama.trim(),
    harga_jual: Number(r.harga_jual),
    porsi_per_batch: Number(r.porsi_per_batch) || 1,
    bahan: r.bahan
      .filter((b) => b.nama.trim() && Number(b.qty) > 0)
      .map((b) => ({ ...(b.bahan_id ? { bahan_id: b.bahan_id } : {}), nama: b.nama.trim(), qty: Number(b.qty), satuan: b.satuan?.trim() || null })),
  };
}

export function cekResep(r) {
  if (!r.nama) return 'Nama menu belum diisi';
  if (!(r.harga_jual > 0)) return `Harga jual ${r.nama} belum diisi`;
  if (!r.bahan.length) return `Bahan ${r.nama} belum diisi`;
  return null;
}
