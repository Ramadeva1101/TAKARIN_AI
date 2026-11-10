import { all, get, run, tx } from '../lib/db.js';
import { AppError, tidakDitemukan } from '../lib/errors.js';
import { hitungPromo } from '../domain/promo.js';
import { validasiAngka, hargaAsing } from '../domain/validasiAngka.js';
import { konteksHitung, hitungMenu } from './hpp.js';
import { saranPromo } from '../ai/provider.js';

function itemDenganHpp(usaha, items) {
  const konteks = konteksHitung(usaha);
  return items.map((i) => {
    const menu = get('SELECT * FROM menu WHERE id = ? AND usaha_id = ?', i.menu_id, usaha.id);
    if (!menu) throw tidakDitemukan('Produk');
    const h = hitungMenu(menu, konteks);
    if (!h.lengkap) throw new AppError(409, `Modal ${menu.nama} belum bisa dihitung, lengkapi dulu harga bahannya`);
    return { menu_id: menu.id, nama: menu.nama, hpp: h.hpp, harga_jual: menu.harga_jual, qty: i.qty };
  });
}

export function hitung(usaha, { items, harga_paket, biaya_kemasan = 0 }) {
  const isi = itemDenganHpp(usaha, items);
  return { items: isi, ...hitungPromo({ items: isi, hargaPaket: harga_paket, biayaKemasan: biaya_kemasan, targetMargin: usaha.target_margin }) };
}

export async function saran(usaha, { items, harga_paket }) {
  const isi = itemDenganHpp(usaha, items);
  const { data } = await saranPromo({ isi: isi.map((i) => `${i.qty} ${i.nama}`), harga_paket });
  // Caption tidak boleh menyebut harga selain harga paket.
  if (!validasiAngka(data.caption, [harga_paket], []).valid || hargaAsing(data.caption, [harga_paket]).length) {
    data.caption = `${isi.map((i) => i.nama).join(' + ')} dalam satu paket. Pesan hari ini.`;
  }
  return data;
}

const rp = (n) => `Rp${Math.round(n).toLocaleString('id-ID')}`;

// Periksa paket sebelum disimpan: tidak rugi, dan caption tidak menyebut harga yang berbeda dari paket.
// Harga yang boleh disebut: harga paket, harga normal (dibeli terpisah), dan selisih hematnya.
function periksa(usaha, data) {
  const hasil = hitung(usaha, data);
  if (hasil.usulan?.status === 'rugi') throw new AppError(400, 'Harga paket di bawah modal, tidak bisa disimpan');
  const asing = hargaAsing(data.caption, [data.harga_paket, hasil.harga_normal, hasil.harga_normal - data.harga_paket]);
  if (asing.length) {
    throw new AppError(400, `Caption menyebut ${asing[0].teks}, padahal harga paket ${rp(data.harga_paket)}. Sesuaikan caption atau harga paket.`);
  }
  return hasil;
}

function tulisItem(promoId, items) {
  run('DELETE FROM promo_item WHERE promo_id = ?', promoId);
  for (const i of items) run('INSERT INTO promo_item (promo_id, menu_id, qty) VALUES (?, ?, ?)', promoId, i.menu_id, i.qty);
}

export function simpan(usaha, data) {
  periksa(usaha, data);
  return tx(() => {
    const { lastInsertRowid } = run(
      'INSERT INTO promo (usaha_id, nama, harga_paket, biaya_kemasan, caption) VALUES (?, ?, ?, ?, ?)',
      usaha.id,
      data.nama,
      data.harga_paket,
      data.biaya_kemasan ?? 0,
      data.caption ?? null,
    );
    tulisItem(lastInsertRowid, data.items);
    return { id: lastInsertRowid };
  });
}

export function ubah(usaha, id, data) {
  const p = get('SELECT id FROM promo WHERE id = ? AND usaha_id = ?', id, usaha.id);
  if (!p) throw tidakDitemukan('Promo');
  periksa(usaha, data);
  return tx(() => {
    run('UPDATE promo SET nama = ?, harga_paket = ?, biaya_kemasan = ?, caption = ? WHERE id = ?', data.nama, data.harga_paket, data.biaya_kemasan ?? 0, data.caption ?? null, p.id);
    tulisItem(p.id, data.items);
    return { id: p.id };
  });
}

export function daftar(usaha) {
  return all('SELECT * FROM promo WHERE usaha_id = ? ORDER BY id DESC', usaha.id).map((p) => {
    const items = all('SELECT menu_id, qty FROM promo_item WHERE promo_id = ?', p.id);
    try {
      const h = hitung(usaha, { items, harga_paket: p.harga_paket, biaya_kemasan: p.biaya_kemasan });
      return { ...p, items: h.items, hpp_paket: h.hpp_paket, harga_normal: h.harga_normal, analisis: h.usulan };
    } catch (err) {
      return { ...p, items, galat: err.message };
    }
  });
}

export function hapus(usaha, id) {
  const p = get('SELECT id FROM promo WHERE id = ? AND usaha_id = ?', id, usaha.id);
  if (!p) throw tidakDitemukan('Promo');
  run('DELETE FROM promo WHERE id = ?', p.id);
}
