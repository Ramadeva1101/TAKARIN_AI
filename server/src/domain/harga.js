export const bulat = (x) => Math.round(x);
export const bulat1 = (x) => Math.round(x * 10) / 10;

export function margin(hargaJual, hpp) {
  if (!hargaJual) return null;
  return (hargaJual - hpp) / hargaJual;
}

export function markup(hargaJual, hpp) {
  if (!hpp) return null;
  return (hargaJual - hpp) / hpp;
}

// Harga jual minimal agar margin = target, dibulatkan ke atas ke kelipatan Rp500.
export function hargaAman(hpp, targetMargin, kelipatan = 500) {
  if (targetMargin >= 1) throw new Error('targetMargin harus < 1');
  return Math.ceil(hpp / (1 - targetMargin) / kelipatan) * kelipatan;
}

export function statusMargin(nilaiMargin, targetMargin) {
  if (nilaiMargin == null) return 'belum_lengkap';
  if (nilaiMargin < 0) return 'rugi';
  if (nilaiMargin + 1e-9 < targetMargin) return 'waspada';
  return 'aman';
}

/**
 * Rata-rata tertimbang beberapa pembelian terakhir (bobot terbaru paling besar: 3, 2, 1).
 * @param {Array<{harga_per_satuan:number, tanggal:string}>} riwayat
 */
export function hargaRataRata(riwayat, n = 3) {
  const urut = [...riwayat].sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0)).slice(0, n);
  if (!urut.length) return null;
  let total = 0;
  let bobotTotal = 0;
  urut.forEach((r, i) => {
    const bobot = urut.length - i;
    total += r.harga_per_satuan * bobot;
    bobotTotal += bobot;
  });
  return total / bobotTotal;
}

/**
 * Harga bahan dari riwayatnya. Belanja yang tercatat (punya nota) selalu didahulukan; harga yang
 * diisi sendiri tanpa nota hanya dipakai selama belum ada belanja, dan ditandai sebagai perkiraan.
 * @returns {{harga:number, sumber:'belanja'|'perkiraan', tanggal:string} | null}
 */
export function hargaDariRiwayat(riwayat) {
  const belanja = riwayat.filter((r) => r.nota_id != null);
  if (belanja.length) return { harga: hargaRataRata(belanja), sumber: 'belanja', tanggal: terbaru(belanja).tanggal };
  if (!riwayat.length) return null;
  const t = terbaru(riwayat);
  return { harga: t.harga_per_satuan, sumber: 'perkiraan', tanggal: t.tanggal };
}

const terbaru = (riwayat) => [...riwayat].sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0))[0];

export function selisihPersen(nilai, acuan) {
  if (!acuan) return null;
  return (nilai - acuan) / acuan;
}

// Status harga beli dibanding acuan daerah.
export function statusAcuan(selisih) {
  if (selisih == null) return 'tanpa_acuan';
  if (selisih > 0.25) return 'jauh_di_atas';
  if (selisih > 0.1) return 'di_atas';
  if (selisih < -0.1) return 'di_bawah';
  return 'wajar';
}

// Harga baru dianggap mencurigakan (kemungkinan salah baca/ucap) kalau < 50% atau > 200% pembanding.
export function hargaMencurigakan(hargaBaru, pembanding) {
  if (!hargaBaru || !pembanding) return false;
  const rasio = hargaBaru / pembanding;
  return rasio < 0.5 || rasio > 2;
}
