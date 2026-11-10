import { all, get, run, tx } from '../lib/db.js';
import { AppError, tanggalHariIni } from '../lib/errors.js';
import { keSatuanDasar } from '../domain/satuan.js';
import { cariAtauBuatBahan, konversiBahan } from './bahan.js';
import { hitungSemua } from './hpp.js';
import { bacaCerita } from '../ai/provider.js';

export function usahaMilik(userId) {
  return get('SELECT * FROM usaha WHERE user_id = ?', userId) ?? null;
}

export function ubahProfil(usaha, data) {
  run(
    `UPDATE usaha SET nama = ?, jenis = ?, kota = ?, provinsi = ?, target_margin = ?, porsi_per_hari = ?, hari_buka = ? WHERE id = ?`,
    data.nama ?? usaha.nama,
    data.jenis ?? usaha.jenis,
    data.kota ?? usaha.kota,
    data.provinsi ?? usaha.provinsi,
    data.target_margin ?? usaha.target_margin,
    data.porsi_per_hari ?? usaha.porsi_per_hari,
    data.hari_buka ?? usaha.hari_buka,
    usaha.id,
  );
  return get('SELECT * FROM usaha WHERE id = ?', usaha.id);
}

export function simpanResep(usahaId, menuId, bahanList) {
  run('DELETE FROM resep_item WHERE menu_id = ?', menuId);
  for (const item of bahanList) {
    if (item.qty == null) throw new AppError(400, `Takaran ${item.nama} belum diisi`);
    const bahan = item.bahan_id
      ? get('SELECT * FROM bahan WHERE id = ? AND usaha_id = ?', item.bahan_id, usahaId)
      : cariAtauBuatBahan(usahaId, item.nama, item.satuan);
    if (!bahan) throw new AppError(400, `Bahan ${item.nama} tidak ditemukan`);
    run(
      'INSERT INTO resep_item (menu_id, bahan_id, qty, satuan) VALUES (?, ?, ?, ?)',
      menuId,
      bahan.id,
      item.qty,
      item.satuan || bahan.satuan_dasar,
    );
  }
}

/**
 * Setup lengkap dari onboarding. Menimpa menu dan biaya; bahan dan riwayat harga tetap.
 * harga_bahan: [{nama, qty, satuan, harga}] harga total untuk qty tersebut.
 */
export function simpanSetup(userId, data) {
  return tx(() => {
    let usaha = usahaMilik(userId);
    const u = data.usaha;
    if (!usaha) {
      const { lastInsertRowid } = run(
        `INSERT INTO usaha (user_id, nama, jenis, kota, provinsi, target_margin, porsi_per_hari, hari_buka) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        userId,
        u.nama,
        u.jenis ?? null,
        u.kota ?? null,
        u.provinsi ?? null,
        u.target_margin,
        u.porsi_per_hari,
        u.hari_buka ?? 30,
      );
      usaha = get('SELECT * FROM usaha WHERE id = ?', lastInsertRowid);
    } else {
      usaha = ubahProfil(usaha, u);
    }

    run('DELETE FROM menu WHERE usaha_id = ?', usaha.id);
    for (const p of data.produk) {
      const { lastInsertRowid } = run(
        'INSERT INTO menu (usaha_id, nama, harga_jual, porsi_per_batch) VALUES (?, ?, ?, ?)',
        usaha.id,
        p.nama.trim(),
        p.harga_jual,
        p.porsi_per_batch ?? 1,
      );
      simpanResep(usaha.id, lastInsertRowid, p.bahan);
    }

    run('DELETE FROM biaya_lain WHERE usaha_id = ?', usaha.id);
    for (const b of data.biaya ?? []) {
      run('INSERT INTO biaya_lain (usaha_id, nama, nominal, periode) VALUES (?, ?, ?, ?)', usaha.id, b.nama, b.nominal, b.periode);
    }

    for (const h of data.harga_bahan ?? []) {
      const bahan = cariAtauBuatBahan(usaha.id, h.nama, h.satuan);
      const konv = keSatuanDasar({ qty: h.qty, satuan: h.satuan, satuanDasar: bahan.satuan_dasar, namaBahan: bahan.nama, konversiKhusus: konversiBahan(bahan.id) });
      if (!konv.ok || !konv.nilai) throw new AppError(400, `Harga ${h.nama}: ${konv.pesan ?? 'jumlah tidak valid'}`);
      run(
        'INSERT INTO harga_bahan (bahan_id, harga_per_satuan, tanggal, sumber) VALUES (?, ?, ?, ?)',
        bahan.id,
        h.harga / konv.nilai,
        h.tanggal ?? tanggalHariIni(),
        'manual',
      );
    }

    run('UPDATE usaha SET setup_selesai = 1 WHERE id = ?', usaha.id);
    return { usaha: get('SELECT * FROM usaha WHERE id = ?', usaha.id), produk: hitungSemua(get('SELECT * FROM usaha WHERE id = ?', usaha.id)) };
  });
}

export async function draftDariCerita(teks) {
  const { data, model } = await bacaCerita(teks);
  return { ...data, model };
}

export function daftarBiaya(usahaId) {
  return all('SELECT id, nama, nominal, periode FROM biaya_lain WHERE usaha_id = ? ORDER BY id', usahaId);
}

export function gantiBiaya(usahaId, biaya) {
  return tx(() => {
    run('DELETE FROM biaya_lain WHERE usaha_id = ?', usahaId);
    for (const b of biaya) run('INSERT INTO biaya_lain (usaha_id, nama, nominal, periode) VALUES (?, ?, ?, ?)', usahaId, b.nama, b.nominal, b.periode);
    return daftarBiaya(usahaId);
  });
}
