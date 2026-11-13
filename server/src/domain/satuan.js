// Konversi takaran apa pun (kg, sdm, siung, ...) ke satuan dasar bahan (g | ml | butir | pcs).

const SINONIM = {
  kilo: 'kg', kilogram: 'kg', kgs: 'kg',
  gram: 'g', gr: 'g', grm: 'g',
  ons: 'ons', on: 'ons',
  liter: 'l', ltr: 'l', lt: 'l',
  mililiter: 'ml', cc: 'ml',
  'sendok makan': 'sdm', 'sendok mkn': 'sdm', sendok: 'sdm', sm: 'sdm', tbsp: 'sdm',
  'sendok teh': 'sdt', st: 'sdt', tsp: 'sdt',
  biji: 'butir', btr: 'butir', bji: 'butir',
  buah: 'pcs', bh: 'pcs', pc: 'pcs', lembar: 'pcs', lbr: 'pcs',
  bks: 'bungkus', saset: 'sachet', sachets: 'sachet', btl: 'botol', klg: 'kaleng', pack: 'pak', kantung: 'kantong',
  ptg: 'potong', btg: 'batang', ekr: 'ekor', ppn: 'papan', pp: 'papan', ikt: 'ikat',
  cangkir: 'gelas', gls: 'gelas', cup: 'gelas',
};

const MASSA = { kg: 1000, ons: 100, g: 1, mg: 0.001 };
const VOLUME = { l: 1000, ml: 1 };

// Ukuran rumah tangga (URT): gram atau ml per satuan, dicocokkan dari kata kunci nama bahan.
// Angka perkiraan umum; pemilik bisa menimpa lewat konversi khusus.
const URT = {
  sdm: { 'kental manis': 20, gula: 12.5, tepung: 8, garam: 15, minyak: 15, kecap: 15, saus: 15, santan: 15, merica: 6, ketumbar: 6, kopi: 7, teh: 3, susu: 7, mentega: 14, margarin: 14, air: 15, _: 15 },
  sdt: { gula: 4, tepung: 2.7, garam: 5, minyak: 5, kecap: 5, merica: 2, ketumbar: 2, kopi: 2.5, _: 5 },
  gelas: { beras: 180, gula: 200, tepung: 120, _: 240 },
  siung: { 'bawang putih': 5, 'bawang merah': 7, _: 5 },
  butir: { telur: 60, _: 1 },
  potong: { ayam: 125, _: 1 },
  ekor: { ayam: 1000, _: 1 },
};

// Satuan kemasan (isi bisa beda tiap merek) dan satuan hitungan (satu benda).
// Bahan yang pertama kali dicatat dengan satuan ini dihitung per buah: 1 bungkus, 1 potong, 1 batang.
export const KEMASAN = new Set(['bungkus', 'sachet', 'botol', 'kaleng', 'pak', 'kantong', 'tabung', 'kotak', 'dus', 'renceng', 'papan', 'ikat', 'sisir', 'karung', 'toples']);
export const HITUNGAN = new Set(['potong', 'batang', 'ruas', 'genggam', 'ekor', 'tangkai', 'iris', 'porsi', 'kepal', 'helai']);
const SATUAN_TAKARAN = { g: ['gram', 'kg', 'ons'], ml: ['ml', 'liter'], butir: ['butir'], pcs: [] };

// Untuk bahan bersatuan dasar butir yang dijual per kg.
const BUTIR_PER_KG = { telur: 16 };

export function normalisasiSatuan(satuan) {
  if (!satuan) return '';
  const s = String(satuan).toLowerCase().trim().replace(/\s+/g, ' ').replace(/\.$/, '');
  return SINONIM[s] ?? s;
}

function cariUrt(tabel, namaBahan) {
  const nama = String(namaBahan || '').toLowerCase();
  const kunci = Object.keys(tabel)
    .filter((k) => k !== '_' && nama.includes(k))
    .sort((a, b) => b.length - a.length)[0];
  return kunci ? { nilai: tabel[kunci], khusus: true } : { nilai: tabel._, khusus: false };
}

/**
 * Satuan yang isinya sudah pasti untuk satuan dasar ini (gram dan kg untuk bahan per gram, ml dan liter
 * untuk bahan per ml). Isi khusus tidak boleh menimpanya, supaya "1 gram = 1000" tidak merusak modal.
 */
export function satuanPasti(satuan, satuanDasar) {
  const s = normalisasiSatuan(satuan);
  const dasar = normalisasiSatuan(satuanDasar);
  return s === dasar || (dasar === 'g' && MASSA[s] != null) || (dasar === 'ml' && VOLUME[s] != null);
}

/**
 * Mengubah qty dalam satuan apa pun ke satuan dasar bahan.
 * @returns {{ ok: boolean, nilai?: number, cara?: string, pesan?: string }}
 */
export function keSatuanDasar({ qty, satuan, satuanDasar, namaBahan, konversiKhusus = {} }) {
  if (qty == null || Number.isNaN(Number(qty))) return { ok: false, pesan: 'Jumlah belum diisi' };
  const n = Number(qty);
  const s = normalisasiSatuan(satuan) || satuanDasar;
  const dasar = normalisasiSatuan(satuanDasar);
  const tanya = { ok: false, satuan: s, pesan: `1 ${s} ${namaBahan} isinya berapa?` };

  if (konversiKhusus[s] != null && !satuanPasti(s, dasar)) return { ok: true, nilai: n * konversiKhusus[s], cara: 'khusus' };
  if (s === dasar) return { ok: true, nilai: n, cara: 'sama' };

  if (dasar === 'g' && MASSA[s]) return { ok: true, nilai: n * MASSA[s], cara: 'standar' };
  if (dasar === 'ml' && VOLUME[s]) return { ok: true, nilai: n * VOLUME[s], cara: 'standar' };
  if (dasar === 'g' && VOLUME[s]) return { ok: true, nilai: n * VOLUME[s], cara: 'perkiraan' };
  if (dasar === 'ml' && MASSA[s]) return { ok: true, nilai: n * MASSA[s], cara: 'perkiraan' };

  if (dasar === 'butir' && (MASSA[s] || s === 'pcs')) {
    if (s === 'pcs') return { ok: true, nilai: n, cara: 'sama' };
    const per = cariUrt({ ...BUTIR_PER_KG, _: null }, namaBahan);
    if (per.nilai) return { ok: true, nilai: (n * MASSA[s] * per.nilai) / 1000, cara: 'perkiraan' };
  }
  if (dasar === 'pcs' && s === 'butir') return { ok: true, nilai: n, cara: 'sama' };

  if (URT[s] && (dasar === 'g' || dasar === 'ml')) {
    const { nilai, khusus } = cariUrt(URT[s], namaBahan);
    if (s === 'butir' || s === 'potong' || s === 'ekor') {
      if (!khusus) return tanya;
    }
    return { ok: true, nilai: n * nilai, cara: khusus ? 'urt' : 'urt-umum' };
  }

  return tanya;
}

// Singkatan kemasan di nota ("ppn", "bks", "btl") ditulis lengkap supaya mudah dibaca pemilik.
export function rapikanSatuan(satuan) {
  const s = normalisasiSatuan(satuan);
  return KEMASAN.has(s) || HITUNGAN.has(s) ? s : satuan;
}

// Isi bawaan bahan yang belum ada: bahan per buah memakai satuan pertamanya sebagai 1 buah.
export function konversiAwal(satuanDasar, satuan) {
  const s = normalisasiSatuan(satuan);
  return satuanDasar === 'pcs' && (KEMASAN.has(s) || HITUNGAN.has(s)) ? { [s]: 1 } : {};
}

// Nama satuan dasar yang dibaca pemilik: bahan per buah memakai satuan pertamanya (potong, bungkus).
export function namaSatuanDasar(satuanDasar, konversiKhusus = {}) {
  if (satuanDasar === 'g') return 'gram';
  if (satuanDasar !== 'pcs') return satuanDasar;
  return Object.entries(konversiKhusus).find(([, f]) => f === 1)?.[0] ?? 'buah';
}

/**
 * Satuan yang sudah diketahui isinya untuk bahan ini, untuk menjawab "1 papan = berapa ...".
 * jenis 'buah' = satuan hitungan/kemasan (1 papan = 10 potong), 'takaran' = gram/ml (1 kaleng = 370 gram).
 */
export function pilihanIsi(satuanDasar, konversiKhusus = {}, kecuali) {
  const hasil = [];
  const tambah = (satuan, jenis) => {
    if (satuan !== kecuali && !hasil.some((h) => h.satuan === satuan)) hasil.push({ satuan, jenis });
  };
  if (satuanDasar === 'pcs') tambah(namaSatuanDasar(satuanDasar, konversiKhusus), 'buah');
  for (const k of Object.keys(konversiKhusus)) tambah(k, KEMASAN.has(k) || HITUNGAN.has(k) || satuanDasar === 'pcs' ? 'buah' : 'takaran');
  for (const t of SATUAN_TAKARAN[satuanDasar] ?? []) tambah(t, 'takaran');
  return hasil;
}

/**
 * Isi satu satuan dalam satuan dasar dari jawaban "1 dari = jumlah ke".
 * Salah satu satuan harus sudah diketahui. Mengembalikan { satuan, faktor } untuk disimpan sebagai konversi khusus.
 */
export function hitungIsi({ dari, jumlah, ke, satuanDasar, namaBahan, konversiKhusus = {} }) {
  const j = Number(jumlah);
  if (!(j > 0)) return { ok: false, pesan: 'Isi jumlahnya lebih dari 0' };
  const a = normalisasiSatuan(dari);
  const b = normalisasiSatuan(ke);
  if (!a || !b || a === b) return { ok: false, pesan: 'Pilih dua satuan yang berbeda' };
  const nilai = (x) => keSatuanDasar({ qty: 1, satuan: x, satuanDasar, namaBahan, konversiKhusus });
  const vb = nilai(b);
  const va = nilai(a);
  if (vb.ok && va.ok) return { ok: false, sudahDiketahui: true, pesan: `Isi ${a} dan ${b} sudah diketahui, tidak perlu diisi lagi.` };
  if (vb.ok) return { ok: true, simpan: [{ satuan: a, faktor: j * vb.nilai }] };
  if (va.ok) return { ok: true, simpan: [{ satuan: b, faktor: va.nilai / j }] };
  return { ok: false, pesan: `Isi ${a} dan ${b} sama-sama belum diketahui. Pilih satuan lain.` };
}

export const SATUAN_DASAR = ['g', 'ml', 'butir', 'pcs'];

const CAIRAN = /minyak|kecap|santan|air|saus|sirup|cuka|susu cair|madu/i;

// Menebak satuan dasar bahan baru dari nama dan satuan yang dipakai.
export function tebakSatuanDasar(namaBahan, satuan) {
  const s = normalisasiSatuan(satuan);
  if (/telur|telor/i.test(namaBahan || '')) return 'butir';
  if (s === 'pcs') return 'pcs';
  if (CAIRAN.test(namaBahan || '')) return 'ml';
  if (KEMASAN.has(s) || HITUNGAN.has(s)) {
    // "1 potong ayam" punya berat umum (125 g), jadi tetap dihitung per gram.
    if (URT[s] && cariUrt(URT[s], namaBahan).khusus) return 'g';
    return 'pcs';
  }
  if (s === 'butir') return 'butir';
  if (VOLUME[s] || CAIRAN.test(namaBahan || '')) return 'ml';
  return 'g';
}
