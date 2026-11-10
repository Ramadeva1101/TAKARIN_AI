import { margin, hargaAman } from './harga.js';

const BATAS_KURANGI_TAKARAN = 0.2;

/**
 * Pilihan perbaikan untuk menu yang margin-nya di bawah target. Semua angka dihitung di sini.
 * @param {{nama:string, harga_jual:number, hpp:number, rincian:Array<{nama:string, biaya:number|null}>}} hasil
 */
export function opsiPerbaikan(hasil, targetMargin) {
  const { harga_jual: hj, hpp } = hasil;
  if (margin(hj, hpp) >= targetMargin) return [];

  const opsi = [];
  const hargaBaru = hargaAman(hpp, targetMargin);
  opsi.push({
    jenis: 'naik_harga',
    judul: `Naikkan harga ke Rp${hargaBaru.toLocaleString('id-ID')}`,
    harga_jual: hargaBaru,
    hpp,
    margin: margin(hargaBaru, hpp),
  });

  const termahal = hasil.rincian.find((r) => r.biaya != null && r.biaya > 0);
  if (termahal) {
    const biayaMaks = hj * (1 - targetMargin);
    const perluTurun = hpp - biayaMaks;
    let fraksi = Math.ceil((perluTurun / termahal.biaya) * 100) / 100;
    const cukup = fraksi <= BATAS_KURANGI_TAKARAN;
    if (!cukup) fraksi = 0.15;
    const hppBaru = hpp - termahal.biaya * fraksi;
    opsi.push({
      jenis: 'kurangi_takaran',
      judul: `Kurangi takaran ${termahal.nama} ${Math.round(fraksi * 100)}%`,
      bahan: termahal.nama,
      persen: Math.round(fraksi * 100),
      harga_jual: hj,
      hpp: hppBaru,
      margin: margin(hj, hppBaru),
      cukup_capai_target: cukup,
    });

    const hargaKombinasi = Math.ceil((hj + 1) / 500) * 500;
    const hppKombinasi = hpp - termahal.biaya * 0.1;
    if (hargaKombinasi < hargaBaru) {
      opsi.push({
        jenis: 'kombinasi',
        judul: `Naik Rp${(hargaKombinasi - hj).toLocaleString('id-ID')} dan kurangi ${termahal.nama} 10%`,
        bahan: termahal.nama,
        persen: 10,
        harga_jual: hargaKombinasi,
        hpp: hppKombinasi,
        margin: margin(hargaKombinasi, hppKombinasi),
      });
    }
  }
  return opsi;
}
