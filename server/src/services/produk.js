import { get, run, tx } from '../lib/db.js';
import { AppError, tidakDitemukan } from '../lib/errors.js';
import { rupiah, persen } from '../lib/format.js';
import { hitungHppMenu } from '../domain/hpp.js';
import { opsiPerbaikan } from '../domain/rekomendasi.js';
import { validasiAngka } from '../domain/validasiAngka.js';
import { konteksHitung, hitungMenu, hitungSemua } from './hpp.js';
import { simpanResep } from './usaha.js';
import { tulisPenjelasan } from '../ai/provider.js';

function ambilMenu(usaha, menuId) {
  const menu = get('SELECT * FROM menu WHERE id = ? AND usaha_id = ?', menuId, usaha.id);
  if (!menu) throw tidakDitemukan('Produk');
  return menu;
}

export const daftar = (usaha) => hitungSemua(usaha);

export function detail(usaha, menuId) {
  const hasil = hitungMenu(ambilMenu(usaha, menuId), konteksHitung(usaha));
  return { ...hasil, target_margin: usaha.target_margin, opsi: hasil.lengkap ? opsiPerbaikan(hasil, usaha.target_margin) : [] };
}

export function buat(usaha, data) {
  return tx(() => {
    const { lastInsertRowid } = run(
      'INSERT INTO menu (usaha_id, nama, harga_jual, porsi_per_batch) VALUES (?, ?, ?, ?)',
      usaha.id,
      data.nama.trim(),
      data.harga_jual,
      data.porsi_per_batch ?? 1,
    );
    simpanResep(usaha.id, lastInsertRowid, data.bahan);
    return detail(usaha, lastInsertRowid);
  });
}

export function ubah(usaha, menuId, data) {
  const menu = ambilMenu(usaha, menuId);
  return tx(() => {
    run(
      'UPDATE menu SET nama = ?, harga_jual = ?, porsi_per_batch = ? WHERE id = ?',
      data.nama?.trim() ?? menu.nama,
      data.harga_jual ?? menu.harga_jual,
      data.porsi_per_batch ?? menu.porsi_per_batch,
      menu.id,
    );
    if (data.bahan) simpanResep(usaha.id, menu.id, data.bahan);
    return detail(usaha, menu.id);
  });
}

export function hapus(usaha, menuId) {
  run('DELETE FROM menu WHERE id = ?', ambilMenu(usaha, menuId).id);
}

/**
 * Simulasi tanpa menyimpan: harga jual baru dan/atau faktor takaran per bahan (0.9 = dikurangi 10%).
 */
export function simulasi(usaha, menuId, { harga_jual, faktor = {} }) {
  const menu = ambilMenu(usaha, menuId);
  const konteks = konteksHitung(usaha);
  const asli = hitungMenu(menu, konteks);
  const resep = asli.resep.map((r) => ({ ...r, qty: r.qty * (faktor[r.bahan_id] ?? 1) }));
  const hasil = hitungHppMenu({ menu: { ...menu, harga_jual: harga_jual ?? menu.harga_jual }, resep, ...konteks });
  return { asli: { hpp: asli.hpp, margin: asli.margin, harga_jual: asli.harga_jual }, simulasi: hasil };
}

function penjelasanTemplat(hasil, opsi, target) {
  const kalimat = [
    `Modal ${hasil.nama} sekarang ${rupiah(hasil.hpp)} per porsi, dijual ${rupiah(hasil.harga_jual)}, jadi untungnya ${persen(hasil.margin)}.`,
  ];
  if (!opsi.length) {
    kalimat.push(`Ini sudah sesuai target untung ${persen(target)}.`);
  } else {
    const termahal = hasil.rincian.find((r) => r.biaya);
    if (termahal) kalimat.push(`Biaya terbesar dari ${termahal.nama}, sekitar ${rupiah(termahal.biaya)} per porsi.`);
    kalimat.push(`Supaya kembali ke target ${persen(target)}, harga jual minimal ${rupiah(hasil.harga_aman)}.`);
  }
  return kalimat.join(' ');
}

export async function rekomendasi(usaha, menuId) {
  const d = detail(usaha, menuId);
  if (!d.lengkap) throw new AppError(409, `HPP ${d.nama} belum lengkap: ${d.kurang.map((k) => k.nama).join(', ')}`);

  const fakta = {
    produk: d.nama,
    hpp: Math.round(d.hpp),
    harga_jual: d.harga_jual,
    margin_persen: Math.round(d.margin * 100),
    target_persen: Math.round(usaha.target_margin * 100),
    harga_aman: d.harga_aman,
    bahan_termahal: d.rincian.filter((r) => r.biaya).slice(0, 3).map((r) => ({ nama: r.nama, biaya_per_porsi: Math.round(r.biaya) })),
    pilihan: d.opsi.map((o) => ({ judul: o.judul, harga_jual: o.harga_jual, margin_persen: Math.round(o.margin * 100) })),
  };

  const angkaBoleh = [fakta.hpp, fakta.harga_jual, fakta.harga_aman, ...fakta.bahan_termahal.map((b) => b.biaya_per_porsi), ...d.opsi.map((o) => o.harga_jual), ...d.opsi.map((o) => Math.round(o.hpp))];
  const persenBoleh = [fakta.margin_persen, fakta.target_persen, ...fakta.pilihan.map((p) => p.margin_persen), ...d.opsi.filter((o) => o.persen).map((o) => o.persen)];

  let teks = await tulisPenjelasan(fakta);
  let sumber = 'ai';
  if (!teks || !validasiAngka(teks, angkaBoleh, persenBoleh).valid) {
    teks = penjelasanTemplat(d, d.opsi, usaha.target_margin);
    sumber = 'templat';
  }
  return { ...d, penjelasan: teks, sumber_penjelasan: sumber };
}
