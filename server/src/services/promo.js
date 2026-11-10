import { all, get, run, tx } from '../lib/db.js';
import { AppError, tidakDitemukan } from '../lib/errors.js';
import { hitungPromo } from '../domain/promo.js';
import { validasiAngka } from '../domain/validasiAngka.js';
import { konteksHitung, hitungMenu } from './hpp.js';
import { saranPromo } from '../ai/provider.js';

function itemDenganHpp(usaha, items) {
  const konteks = konteksHitung(usaha);
  return items.map((i) => {
    const menu = get('SELECT * FROM menu WHERE id = ? AND usaha_id = ?', i.menu_id, usaha.id);
    if (!menu) throw tidakDitemukan('Produk');
    const h = hitungMenu(menu, konteks);
    if (!h.lengkap) throw new AppError(409, `HPP ${menu.nama} belum lengkap, lengkapi dulu harga bahannya`);
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
  if (!validasiAngka(data.caption, [harga_paket], []).valid) {
    data.caption = `${isi.map((i) => i.nama).join(' + ')} dalam satu paket. Pesan hari ini.`;
  }
  return data;
}

export function simpan(usaha, data) {
  const hasil = hitung(usaha, data);
  if (hasil.usulan?.status === 'rugi') throw new AppError(400, 'Harga paket di bawah modal, tidak bisa disimpan');
  return tx(() => {
    const { lastInsertRowid } = run(
      'INSERT INTO promo (usaha_id, nama, harga_paket, biaya_kemasan, caption) VALUES (?, ?, ?, ?, ?)',
      usaha.id,
      data.nama,
      data.harga_paket,
      data.biaya_kemasan ?? 0,
      data.caption ?? null,
    );
    for (const i of data.items) run('INSERT INTO promo_item (promo_id, menu_id, qty) VALUES (?, ?, ?)', lastInsertRowid, i.menu_id, i.qty);
    return { id: lastInsertRowid };
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
