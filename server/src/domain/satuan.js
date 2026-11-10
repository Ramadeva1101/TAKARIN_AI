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
  buah: 'pcs', bh: 'pcs', pc: 'pcs', lembar: 'pcs', lbr: 'pcs', kantong: 'pcs', kantung: 'pcs',
  cangkir: 'gelas', gls: 'gelas', cup: 'gelas',
};

const MASSA = { kg: 1000, ons: 100, g: 1, mg: 0.001 };
const VOLUME = { l: 1000, ml: 1 };

// Ukuran rumah tangga (URT): gram atau ml per satuan, dicocokkan dari kata kunci nama bahan.
// Angka perkiraan umum; pemilik bisa menimpa lewat konversi khusus.
const URT = {
  sdm: { gula: 12.5, tepung: 8, garam: 15, minyak: 15, kecap: 15, saus: 15, santan: 15, merica: 6, ketumbar: 6, kopi: 7, teh: 3, susu: 7, mentega: 14, margarin: 14, air: 15, _: 15 },
  sdt: { gula: 4, tepung: 2.7, garam: 5, minyak: 5, kecap: 5, merica: 2, ketumbar: 2, kopi: 2.5, _: 5 },
  gelas: { beras: 180, gula: 200, tepung: 120, _: 240 },
  siung: { 'bawang putih': 5, 'bawang merah': 7, _: 5 },
  butir: { telur: 60, _: 1 },
  potong: { ayam: 125, _: 1 },
  ekor: { ayam: 1000, _: 1 },
};

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
 * Mengubah qty dalam satuan apa pun ke satuan dasar bahan.
 * @returns {{ ok: boolean, nilai?: number, cara?: string, pesan?: string }}
 */
export function keSatuanDasar({ qty, satuan, satuanDasar, namaBahan, konversiKhusus = {} }) {
  if (qty == null || Number.isNaN(Number(qty))) return { ok: false, pesan: 'Jumlah belum diisi' };
  const n = Number(qty);
  const s = normalisasiSatuan(satuan) || satuanDasar;
  const dasar = normalisasiSatuan(satuanDasar);

  if (konversiKhusus[s] != null) return { ok: true, nilai: n * konversiKhusus[s], cara: 'khusus' };
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
      if (!khusus) return { ok: false, pesan: `1 ${s} ${namaBahan} berapa ${dasar}?` };
    }
    return { ok: true, nilai: n * nilai, cara: khusus ? 'urt' : 'urt-umum' };
  }

  return { ok: false, pesan: `1 ${s} ${namaBahan} berapa ${dasar}?` };
}

export const SATUAN_DASAR = ['g', 'ml', 'butir', 'pcs'];
