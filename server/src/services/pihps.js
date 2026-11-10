// Pengambil harga pasar dari PIHPS Nasional (Bank Indonesia): https://www.bi.go.id/hargapangan
// Memakai endpoint JSON yang dipakai halaman "Tabel Harga Berdasarkan Daerah" mereka.
// Etika: sekali per wilayah dalam beberapa jam, hanya komoditas yang dipakai, hasil disimpan di database,
// dan sumbernya selalu ditampilkan sebagai "PIHPS Bank Indonesia".
import { get } from '../lib/db.js';
import { bersihWilayah, namaWilayah } from '../domain/wilayah.js';
import { simpanHarga } from './hargaPasar.js';

const BASE = 'https://www.bi.go.id/hargapangan/WebSite/TabelHarga';
export const SUMBER = 'PIHPS Bank Indonesia';
const UA = 'takarin.ai/1.0 (proyek hackathon, pengambilan harian terbatas)';
const JEDA_ULANG_MS = 6 * 3_600_000;
const HARI_RIWAYAT = 30;

// Nama komoditas PIHPS → nama komoditas di aplikasi (lihat domain/komoditas.js).
const PETA = {
  'Cabai Rawit Merah': 'cabai rawit merah',
  'Cabai Merah Keriting': 'cabai merah keriting',
  'Cabai Merah Besar': 'cabai merah besar',
  'Bawang Merah Ukuran Sedang': 'bawang merah',
  'Bawang Putih Ukuran Sedang': 'bawang putih',
  'Telur Ayam Ras Segar': 'telur ayam ras',
  'Daging Ayam Ras Segar': 'daging ayam ras',
  'Daging Sapi Kualitas 1': 'daging sapi',
  'Gula Pasir Lokal': 'gula pasir',
  'Beras Kualitas Medium I': 'beras medium',
  'Minyak Goreng Kemasan Bermerk 1': 'minyak goreng',
};
const ID_KOMODITAS = ['com_16', 'com_14', 'com_13', 'com_11', 'com_12', 'com_10', 'com_7', 'com_8', 'com_21', 'com_3', 'com_18'];

export const hargaLiveAktif = () => process.env.HARGA_LIVE === 'on';

async function ambilJson(jalur, params = {}, batasMs = 30_000) {
  const url = new URL(`${BASE}/${jalur}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(batasMs) });
  if (!res.ok) throw new Error(`PIHPS membalas ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json?.data)) throw new Error('Format jawaban PIHPS tidak dikenali');
  return json.data;
}

// Daftar acuan jarang berubah: simpan 24 jam di memori.
const cache = new Map();
async function acuan(kunci, ambil) {
  const ada = cache.get(kunci);
  if (ada && Date.now() - ada.waktu < 86_400_000) return ada.data;
  const data = await ambil();
  cache.set(kunci, { waktu: Date.now(), data });
  return data;
}

export const daftarProvinsi = () => acuan('provinsi', () => ambilJson('GetRefProvince'));
export const daftarKota = (provId) => acuan(`kota-${provId}`, () => ambilJson('GetRefRegency', { price_type_id: 1, ref_prov_id: provId }));

async function cariProvinsi(nama) {
  const target = bersihWilayah(nama);
  if (!target) return null;
  const semua = await daftarProvinsi();
  return semua.find((p) => bersihWilayah(p.name) === target) || semua.find((p) => bersihWilayah(p.name).includes(target) || target.includes(bersihWilayah(p.name))) || null;
}

async function cariKota(provId, nama) {
  const target = bersihWilayah(nama);
  if (!target || !provId) return null;
  const semua = await daftarKota(provId);
  return semua.find((k) => bersihWilayah(k.name) === target) || null;
}

const tanggalIso = (d) => d.toISOString().slice(0, 10);
const keIso = (dmy) => dmy.split('/').reverse().join('-');

// Satu permintaan: semua komoditas di satu wilayah selama 30 hari terakhir.
async function ambilTabel({ provId = '', kotaId = '' }) {
  const akhir = new Date();
  const awal = new Date(Date.now() - HARI_RIWAYAT * 86_400_000);
  const baris = await ambilJson(
    'GetGridDataDaerah',
    {
      price_type_id: 1,
      comcat_id: ID_KOMODITAS.join(','),
      province_id: provId,
      regency_id: kotaId,
      market_id: '',
      tipe_laporan: 1,
      start_date: tanggalIso(awal),
      end_date: tanggalIso(akhir),
    },
    45_000,
  );
  const hasil = [];
  for (const b of baris) {
    const komoditas = PETA[String(b.name).trim()];
    if (!komoditas || b.level !== 2) continue;
    for (const [kolom, nilai] of Object.entries(b)) {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(kolom)) continue;
      const harga = Number(String(nilai).replace(/,/g, ''));
      if (Number.isFinite(harga) && harga > 0) hasil.push({ komoditas, tanggal: keIso(kolom), harga, satuan: 'kg' });
    }
  }
  return hasil;
}

/**
 * Ambil dan simpan harga untuk satu usaha: tingkat kota, provinsi, dan nasional.
 * Setiap tingkat berdiri sendiri; satu yang gagal tidak membatalkan yang lain.
 */
export async function segarkanWilayah({ kota, provinsi }) {
  const hasil = { kota: 0, provinsi: 0, nasional: 0, galat: [] };
  const tingkat = [];
  let prov = null;
  try {
    prov = await cariProvinsi(provinsi);
  } catch (err) {
    hasil.galat.push(`Daftar provinsi: ${err.message}`);
  }
  let kotaRef = null;
  if (prov) {
    try {
      kotaRef = await cariKota(prov.id, kota);
    } catch (err) {
      hasil.galat.push(`Daftar kota: ${err.message}`);
    }
    if (kotaRef) tingkat.push(['kota', namaWilayah(kotaRef.name), { provId: prov.id, kotaId: kotaRef.id }]);
    else if (kota) hasil.galat.push(`Kota "${kota}" tidak ada di data PIHPS provinsi ${prov.name}`);
    tingkat.push(['provinsi', namaWilayah(prov.name), { provId: prov.id }]);
  } else if (provinsi) hasil.galat.push(`Provinsi "${provinsi}" tidak ditemukan di data PIHPS`);
  tingkat.push(['nasional', 'Indonesia', {}]);

  for (const [level, wilayah, param] of tingkat) {
    try {
      const baris = (await ambilTabel(param)).map((b) => ({ ...b, wilayah, level, sumber: SUMBER }));
      if (baris.length) hasil[level] = simpanHarga(baris);
      else hasil.galat.push(`Tidak ada data harga ${level} ${wilayah}`);
    } catch (err) {
      hasil.galat.push(`Harga ${level} ${wilayah}: ${err.name === 'TimeoutError' ? 'waktu habis' : err.message}`);
    }
  }
  return hasil;
}

// ---- Penjadwalan: tiap wilayah paling sering sekali per beberapa jam, tanpa menahan permintaan pengguna ----
const status = new Map();
const kunciWilayah = (u) => `${bersihWilayah(u.provinsi)}|${bersihWilayah(u.kota)}`;

export function statusSinkron(usaha) {
  const s = status.get(kunciWilayah(usaha));
  const terakhir = get("SELECT MAX(tanggal) AS t FROM harga_pasar WHERE sumber = ?", SUMBER)?.t ?? null;
  return {
    aktif: hargaLiveAktif(),
    sumber: SUMBER,
    berjalan: Boolean(s?.proses),
    selesai_pada: s?.selesai ? new Date(s.selesai).toISOString() : null,
    galat: s?.hasil?.galat ?? [],
    data_terakhir: terakhir,
  };
}

export function perbarui(usaha, { paksa = false } = {}) {
  if (!hargaLiveAktif() || !(usaha.kota || usaha.provinsi)) return null;
  const kunci = kunciWilayah(usaha);
  const s = status.get(kunci);
  if (s?.proses) return s.proses;
  // Gagal sebagian: coba lagi setelah 10 menit saja, supaya situs sumber tidak dibanjiri.
  const jeda = s?.hasil?.galat?.length ? 600_000 : JEDA_ULANG_MS;
  if (!paksa && s?.selesai && Date.now() - s.selesai < jeda) return null;
  const baru = { proses: null, selesai: s?.selesai ?? null, hasil: s?.hasil ?? { galat: [] } };
  baru.proses = segarkanWilayah({ kota: usaha.kota, provinsi: usaha.provinsi })
    .then((hasil) => {
      baru.hasil = hasil;
      baru.selesai = Date.now();
      return hasil;
    })
    .catch((err) => {
      baru.hasil = { galat: [err.message] };
      return baru.hasil;
    })
    .finally(() => {
      baru.proses = null;
    });
  status.set(kunci, baru);
  return baru.proses;
}

// Dipanggil saat halaman dibuka: tidak menunggu hasil.
export function pastikanSegar(usaha) {
  perbarui(usaha)?.catch(() => {});
}
