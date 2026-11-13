import { inputCls } from './ui.jsx';

const kecil = inputCls.replace('w-full', 'shrink-0');

/**
 * Pertanyaan isi satuan dalam bahasa pemilik usaha: "1 papan tempe = 10 potong".
 * satuan: satuan yang belum diketahui isinya. pilihan: satuan yang sudah diketahui, dari server.
 * Untuk takaran resep yang lebih kecil dari satuan beli (potong dari papan), kalimatnya dibalik:
 * "1 papan = 10 potong" lebih mudah dijawab daripada "1 potong = 0,1 papan".
 * nilai {jumlah, ke} dikirim ke server sebagai "1 dari = jumlah ke" lewat isiKeServer().
 */
export default function IsiSatuan({ nama, satuan, pilihan, sisi = 'beli', nilai, ubah }) {
  const ke = nilai.ke || pilihan[0]?.satuan || '';
  const jenis = pilihan.find((p) => p.satuan === ke)?.jenis;
  const balik = sisi === 'resep' && jenis === 'buah';
  const angka = (
    <input
      aria-label={`Isi ${satuan} ${nama}`}
      type="number"
      inputMode="decimal"
      min="0"
      step="any"
      placeholder="10"
      className={`${kecil} angka w-20`}
      value={nilai.jumlah ?? ''}
      onChange={(e) => ubah({ ...nilai, ke, jumlah: e.target.value })}
    />
  );
  const pilih = (
    <select aria-label={`Satuan pembanding ${nama}`} className={`${kecil} w-28`} value={ke} onChange={(e) => ubah({ ...nilai, ke: e.target.value })}>
      {pilihan.map((p) => (
        <option key={p.satuan}>{p.satuan}</option>
      ))}
    </select>
  );
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {balik ? (
        <>
          <span>1</span>
          {pilih}
          <span>{nama} =</span>
          {angka}
          <span>{satuan}</span>
        </>
      ) : (
        <>
          <span>
            1 {satuan} {nama} =
          </span>
          {angka}
          {pilih}
        </>
      )}
    </div>
  );
}

// Bentuk kiriman ke POST /bahan/:id/isi: "1 dari = jumlah ke".
export function isiKeServer({ satuan, pilihan, sisi, nilai }) {
  const ke = nilai.ke || pilihan[0]?.satuan;
  const balik = sisi === 'resep' && pilihan.find((p) => p.satuan === ke)?.jenis === 'buah';
  return balik ? { dari: ke, jumlah: Number(nilai.jumlah), ke: satuan } : { dari: satuan, jumlah: Number(nilai.jumlah), ke };
}
