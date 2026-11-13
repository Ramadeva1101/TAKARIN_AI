import { Plus, Trash } from '@phosphor-icons/react';
import { InputRupiah } from './ui.jsx';

// Pilihan cepat biaya di luar bahan. Usaha memilih yang dipakai saja; semuanya bisa diganti nama.
export const PILIHAN_BIAYA = [
  { nama: 'Gas LPG', periode: 'hari', ket: 'Harga tabung dibagi berapa hari habis' },
  { nama: 'Listrik', periode: 'bulan', ket: 'Termasuk kompor listrik, kulkas, blender' },
  { nama: 'Kayu bakar atau arang', periode: 'hari' },
  { nama: 'Air', periode: 'bulan' },
  { nama: 'Sewa tempat', periode: 'bulan' },
  { nama: 'Gaji karyawan', periode: 'bulan' },
  { nama: 'Kemasan umum', periode: 'hari', ket: 'Plastik atau kantong yang tidak masuk resep' },
  { nama: 'Penyusutan alat', periode: 'bulan', ket: 'Harga alat dibagi lama pakainya, misalnya kompor Rp600.000 untuk 24 bulan = Rp25.000' },
  { nama: 'Ongkos antar', periode: 'hari' },
];

const kunci = (s) => s.trim().toLowerCase();

export function BarisBiaya({ b, i, ubah, hapus }) {
  const ket = PILIHAN_BIAYA.find((p) => kunci(p.nama) === kunci(b.nama))?.ket;
  return (
    <div className="rounded-xl border border-garis bg-kartu p-2.5 sm:border-0 sm:bg-transparent sm:p-0">
      {/* HP: nama dan tombol hapus sebaris, nominal dan periode di bawahnya. Layar lebar: satu baris. */}
      <div className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_2.75rem]">
        <input aria-label={`Nama biaya ${i + 1}`} placeholder="Nama biaya" className="min-h-11 rounded-lg border border-garis bg-kartu px-3 text-sm outline-none focus:border-biru" value={b.nama} onChange={(e) => ubah({ ...b, nama: e.target.value })} />
        <button type="button" aria-label={`Hapus biaya ${b.nama || i + 1}`} onClick={hapus} className="flex size-11 items-center justify-center rounded-lg text-redup hover:bg-rugi-muda hover:text-rugi sm:order-last">
          <Trash size={18} aria-hidden />
        </button>
        <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_7rem] gap-2 sm:contents">
          <InputRupiah aria-label={`Nominal biaya ${i + 1}`} placeholder="Rp" className="angka min-h-11 min-w-0 rounded-lg border border-garis bg-kartu px-3 text-sm outline-none focus:border-biru" value={b.nominal ?? ''} onChange={(e) => ubah({ ...b, nominal: e.target.value })} />
          <select aria-label={`Periode biaya ${i + 1}`} className="min-h-11 rounded-lg border border-garis bg-kartu px-2 text-sm outline-none focus:border-biru" value={b.periode} onChange={(e) => ubah({ ...b, periode: e.target.value })}>
            <option value="hari">per hari</option>
            <option value="bulan">per bulan</option>
            <option value="porsi">per porsi</option>
          </select>
        </div>
      </div>
      {ket && <p className="mt-1 px-1 text-xs text-redup">{ket}</p>}
    </div>
  );
}

// Daftar biaya rutin: pilih dari tombol cepat atau tambah sendiri.
export default function BiayaRutin({ value, onChange }) {
  const belum = PILIHAN_BIAYA.filter((p) => !value.some((b) => kunci(b.nama) === kunci(p.nama)));
  return (
    <div>
      <p className="text-sm font-medium">Pilih yang Anda bayar</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {belum.map((p) => (
          <button
            key={p.nama}
            type="button"
            onClick={() => onChange([...value, { nama: p.nama, nominal: '', periode: p.periode }])}
            className="inline-flex min-h-11 sm:min-h-10 items-center gap-1.5 rounded-full border border-garis bg-kartu px-3.5 text-sm font-medium hover:border-biru hover:text-biru"
          >
            <Plus size={14} weight="bold" aria-hidden /> {p.nama}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, { nama: '', nominal: '', periode: 'bulan' }])}
          className="inline-flex min-h-11 sm:min-h-10 items-center gap-1.5 rounded-full border border-dashed border-biru/50 px-3.5 text-sm font-semibold text-biru hover:bg-biru-muda"
        >
          <Plus size={14} weight="bold" aria-hidden /> Biaya lain
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {value.map((b, i) => (
            <BarisBiaya key={i} b={b} i={i} ubah={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} hapus={() => onChange(value.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}
    </div>
  );
}

export const biayaValid = (daftar) => daftar.filter((b) => b.nama.trim() && Number(b.nominal) > 0).map((b) => ({ nama: b.nama.trim(), nominal: Number(b.nominal), periode: b.periode }));
