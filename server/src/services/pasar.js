import { all } from '../lib/db.js';
import { acuanTerbaru, riwayatAcuan } from './hargaPasar.js';
import { hitungSemua } from './hpp.js';
import { tulisCatatan } from '../ai/provider.js';
import { validasiAngka } from '../domain/validasiAngka.js';

const rupiah = (n) => `Rp${Math.round(n).toLocaleString('id-ID')}`;
const persenTeks = (x) => `${(Math.abs(x) * 100).toFixed(1).replace('.', ',')}%`;

// Wilayah yang punya data harga acuan, untuk pilihan saat setup.
export function wilayahTersedia() {
  return {
    kota: all("SELECT DISTINCT wilayah FROM harga_pasar WHERE level = 'kota' ORDER BY wilayah").map((r) => r.wilayah),
    provinsi: all("SELECT DISTINCT wilayah FROM harga_pasar WHERE level = 'provinsi' ORDER BY wilayah").map((r) => r.wilayah),
  };
}

function bahanPerKomoditas(usaha) {
  const baris = all(
    `SELECT b.id, b.nama, b.komoditas, m.id AS menu_id, m.nama AS menu_nama
     FROM bahan b LEFT JOIN resep_item r ON r.bahan_id = b.id LEFT JOIN menu m ON m.id = r.menu_id
     WHERE b.usaha_id = ? AND b.komoditas IS NOT NULL`,
    usaha.id,
  );
  const peta = new Map();
  for (const r of baris) {
    const k = peta.get(r.komoditas) || { bahan: new Map(), menu: new Map() };
    k.bahan.set(r.id, r.nama);
    if (r.menu_id) k.menu.set(r.menu_id, r.menu_nama);
    peta.set(r.komoditas, k);
  }
  return peta;
}

// Harga pasar semua komoditas untuk wilayah usaha (kota, lalu provinsi, lalu nasional).
export function hargaWilayah(usaha) {
  const terkait = bahanPerKomoditas(usaha);
  const komoditas = all('SELECT DISTINCT komoditas FROM harga_pasar ORDER BY komoditas').map((r) => r.komoditas);
  return komoditas
    .map((k) => {
      const akhir = acuanTerbaru(k, usaha);
      if (!akhir) return null;
      const riwayat = riwayatAcuan(k, usaha, 30);
      const sebelum = riwayat.length > 1 ? riwayat.at(-2) : null;
      const batasMinggu = new Date(new Date(akhir.tanggal).getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
      const minggu = [...riwayat].reverse().find((r) => r.tanggal <= batasMinggu) || null;
      const t = terkait.get(k);
      return {
        komoditas: k,
        wilayah: akhir.wilayah,
        level: akhir.level,
        harga: akhir.harga,
        satuan: akhir.satuan,
        tanggal: akhir.tanggal,
        sumber: akhir.sumber,
        kedaluwarsa: akhir.kedaluwarsa,
        harga_sebelumnya: sebelum?.harga ?? null,
        perubahan_harian: sebelum ? (akhir.harga - sebelum.harga) / sebelum.harga : null,
        perubahan_mingguan: minggu ? (akhir.harga - minggu.harga) / minggu.harga : null,
        riwayat: riwayat.slice(-14),
        bahan: t ? [...t.bahan].map(([id, nama]) => ({ id, nama })) : [],
        menu: t ? [...t.menu].map(([id, nama]) => ({ id, nama })) : [],
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.bahan.length - a.bahan.length || Math.abs(b.perubahan_harian ?? 0) - Math.abs(a.perubahan_harian ?? 0));
}

// Kabar harga yang relevan: komoditas yang dipakai usaha dan berubah cukup besar.
export function infoHarian(usaha, data = hargaWilayah(usaha)) {
  return data
    .filter((d) => d.bahan.length && ((d.perubahan_harian != null && Math.abs(d.perubahan_harian) >= 0.01) || (d.perubahan_mingguan != null && Math.abs(d.perubahan_mingguan) >= 0.05)))
    .map((d) => {
      const pakaiMinggu = d.perubahan_harian == null || Math.abs(d.perubahan_harian) < 0.01;
      const ubah = pakaiMinggu ? d.perubahan_mingguan : d.perubahan_harian;
      const kapan = pakaiMinggu ? 'dalam seminggu' : 'dari hari sebelumnya';
      return {
        komoditas: d.komoditas,
        arah: ubah > 0 ? 'naik' : 'turun',
        perubahan: ubah,
        periode: pakaiMinggu ? 'minggu' : 'hari',
        harga: d.harga,
        satuan: d.satuan,
        wilayah: d.wilayah,
        tanggal: d.tanggal,
        menu: d.menu,
        teks: `Harga ${d.komoditas} di ${d.wilayah} ${ubah > 0 ? 'naik' : 'turun'} ${persenTeks(ubah)} ${kapan}, sekarang ${rupiah(d.harga)}/${d.satuan}.`,
      };
    })
    .sort((a, b) => Math.abs(b.perubahan) - Math.abs(a.perubahan));
}

function catatanTemplat(info, perlu) {
  const kalimat = [];
  if (perlu.length) {
    const p = perlu[0];
    kalimat.push(`${p.nama} untungnya ${persenTeks(p.margin)}, di bawah target. Harga aman ${rupiah(p.harga_aman)}.`);
  }
  if (info.length) kalimat.push(info[0].teks + (info[0].menu.length ? ` Dipakai di ${info[0].menu.map((m) => m.nama).join(', ')}.` : ''));
  if (!kalimat.length) kalimat.push('Semua menu sesuai target dan harga bahan di pasar stabil.');
  return kalimat.join(' ');
}

// Catatan singkat untuk hari ini. AI hanya merangkai kalimat dari fakta; angka dicek ulang.
export async function catatanHarian(usaha) {
  const produk = hitungSemua(usaha);
  const perlu = produk.filter((p) => p.lengkap && p.status !== 'aman').sort((a, b) => a.margin - b.margin);
  const info = infoHarian(usaha).slice(0, 3);
  const fakta = {
    usaha: usaha.nama,
    target_untung_persen: Math.round(usaha.target_margin * 100),
    menu_di_bawah_target: perlu.slice(0, 3).map((p) => ({ nama: p.nama, untung_persen: Number((p.margin * 100).toFixed(1)), modal: Math.round(p.hpp), harga_jual: p.harga_jual, harga_aman: p.harga_aman })),
    kabar_harga: info.map((i) => ({ bahan: i.komoditas, arah: i.arah, perubahan_persen: Number((Math.abs(i.perubahan) * 100).toFixed(1)), periode: i.periode, harga: i.harga, satuan: i.satuan, wilayah: i.wilayah, dipakai_di: i.menu.map((m) => m.nama) })),
  };
  const angka = [
    ...fakta.menu_di_bawah_target.flatMap((m) => [m.modal, m.harga_jual, m.harga_aman]),
    ...fakta.kabar_harga.map((k) => k.harga),
  ];
  const persen = [fakta.target_untung_persen, ...fakta.menu_di_bawah_target.map((m) => m.untung_persen), ...fakta.kabar_harga.map((k) => k.perubahan_persen)];

  let teks = await tulisCatatan(fakta);
  let sumber = 'ai';
  if (!teks || !validasiAngka(teks, angka, persen).valid) {
    teks = catatanTemplat(info, perlu);
    sumber = 'templat';
  }
  return { teks, sumber, tanggal: new Date().toISOString().slice(0, 10) };
}
