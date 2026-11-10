import { all, get } from '../lib/db.js';
import { hitungHppMenu, biayaLainPerPorsi } from '../domain/hpp.js';
import { hargaRataRata } from '../domain/harga.js';
import { acuanPerSatuanDasar } from './hargaPasar.js';

export function getUsahaById(usahaId) {
  return get('SELECT * FROM usaha WHERE id = ?', usahaId);
}

// Harga per satuan dasar untuk setiap bahan: rata-rata pembelian sendiri, atau acuan pasar kalau belum pernah beli.
export function petaHarga(usaha) {
  const bahan = all('SELECT * FROM bahan WHERE usaha_id = ?', usaha.id);
  const riwayat = all(
    `SELECT hb.bahan_id, hb.harga_per_satuan, hb.tanggal FROM harga_bahan hb
     JOIN bahan b ON b.id = hb.bahan_id WHERE b.usaha_id = ? ORDER BY hb.tanggal DESC, hb.id DESC`,
    usaha.id,
  );
  const perBahan = new Map();
  for (const r of riwayat) {
    if (!perBahan.has(r.bahan_id)) perBahan.set(r.bahan_id, []);
    perBahan.get(r.bahan_id).push(r);
  }
  const peta = new Map();
  for (const b of bahan) {
    const rata = hargaRataRata(perBahan.get(b.id) ?? []);
    if (rata != null) {
      peta.set(b.id, { harga: rata, sumber: 'belanja' });
      continue;
    }
    const acuan = acuanPerSatuanDasar(b, usaha);
    if (acuan) peta.set(b.id, { harga: acuan.harga_per_satuan_dasar, sumber: 'pasar' });
  }
  return peta;
}

export function petaKonversi(usahaId) {
  const peta = new Map();
  for (const k of all(
    'SELECT k.* FROM konversi_satuan k JOIN bahan b ON b.id = k.bahan_id WHERE b.usaha_id = ?',
    usahaId,
  )) {
    if (!peta.has(k.bahan_id)) peta.set(k.bahan_id, {});
    peta.get(k.bahan_id)[k.satuan] = k.faktor;
  }
  return peta;
}

export function konteksHitung(usaha) {
  const biaya = all('SELECT * FROM biaya_lain WHERE usaha_id = ?', usaha.id);
  return {
    hargaBahan: petaHarga(usaha),
    konversi: petaKonversi(usaha.id),
    biayaLainPorsi: biayaLainPerPorsi(biaya, usaha.porsi_per_hari),
    targetMargin: usaha.target_margin,
  };
}

function resepMenu(menuId) {
  return all(
    `SELECT r.id, r.bahan_id, r.qty, r.satuan, b.nama, b.satuan_dasar, b.susut_persen
     FROM resep_item r JOIN bahan b ON b.id = r.bahan_id WHERE r.menu_id = ? ORDER BY r.id`,
    menuId,
  );
}

export function hitungMenu(menu, konteks) {
  const resep = resepMenu(menu.id);
  return { id: menu.id, nama: menu.nama, porsi_per_batch: menu.porsi_per_batch, resep, ...hitungHppMenu({ menu, resep, ...konteks }) };
}

export function hitungSemua(usaha, konteks = konteksHitung(usaha)) {
  return all('SELECT * FROM menu WHERE usaha_id = ? ORDER BY nama', usaha.id).map((m) => hitungMenu(m, konteks));
}
