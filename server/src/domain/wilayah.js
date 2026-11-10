// Menyamakan penulisan nama wilayah: "Kota Denpasar", "Kab. Badung ", "denpasar" → "denpasar", "badung".
export function bersihWilayah(nama) {
  return String(nama || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^(kota administrasi|kota|kabupaten|kab\.?)\s+/, '')
    .trim();
}

// Nama untuk disimpan dan ditampilkan: tanpa awalan, huruf awal besar ("Kab. Badung " → "Badung").
export function namaWilayah(nama) {
  return bersihWilayah(nama).replace(/(^|\s)(\p{L})/gu, (_, sp, h) => sp + h.toUpperCase());
}

export const samaWilayah = (a, b) => bersihWilayah(a) === bersihWilayah(b);
