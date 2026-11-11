// Aturan mencocokkan nama bahan dari resep menu dan dari catatan belanja. Satu aturan untuk keduanya,
// supaya bahan yang ditulis di resep dan di nota bertemu di bahan yang sama.
//
// Hasil:
//   'persis' : nama sama setelah dirapikan (cabe rawit = cabai rawit). Langsung dihubungkan.
//   'mirip'  : satu nama memuat nama lain tanpa kata pembeda (dada ayam ~ ayam). Hanya saran,
//              pengguna yang memutuskan di halaman periksa.
//   null     : bahan berbeda (gula merah vs gula pasir, tepung beras vs beras).

// Ejaan dan singkatan yang sering muncul di nota atau ucapan.
const EJAAN = [
  [/\bcabe\b|\bcabé\b|\bcabay\b/g, 'cabai'],
  [/\btelor\b/g, 'telur'],
  [/\bbwg\b|\bbawng\b/g, 'bawang'],
  [/\bmigor\b/g, 'minyak goreng'],
  [/\bmrh\b/g, 'merah'],
  [/\bpth\b/g, 'putih'],
  [/\brwt\b/g, 'rawit'],
  [/\bsosis\b/g, 'sosis'],
];

// Kata yang tidak mengubah bahan (cara potong atau keterangan beli).
const ABAIKAN = new Set(['segar', 'fresh', 'potong', 'utuh', 'iris', 'cincang', 'giling', 'kupas', 'baru', 'super', 'premium', 'lokal', 'curah']);

// Kata yang membuat bahan berbeda harga dan sifatnya. Kalau salah satu nama punya kata ini dan
// nama lain tidak, keduanya dianggap bahan berbeda, bukan mirip.
const PEMBEDA = new Set([
  'wijen', 'zaitun', 'samin', 'puyuh', 'bebek', 'asin', 'ketan', 'tepung', 'aren', 'jawa', 'semut', 'batu',
  'bombay', 'kampung', 'bubuk', 'kental', 'instan', 'kaleng', 'beku', 'kering', 'hijau', 'merah', 'putih',
  'manis', 'tawar', 'cair', 'kelapa', 'jagung', 'terigu', 'maizena', 'sagu', 'tapioka', 'basmati', 'merica',
]);

export function rapikanNama(nama) {
  let s = String(nama || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  for (const [pola, ganti] of EJAAN) s = s.replace(pola, ganti);
  return s.replace(/\s+/g, ' ').trim();
}

const token = (s) => rapikanNama(s).split(' ').filter((t) => t && !ABAIKAN.has(t));

export function bandingNama(a, b) {
  const ta = token(a);
  const tb = token(b);
  if (!ta.length || !tb.length) return null;
  const sa = new Set(ta);
  const sb = new Set(tb);
  if (ta.join(' ') === tb.join(' ') || (sa.size === sb.size && [...sa].every((t) => sb.has(t)))) return 'persis';
  const [kecil, besar] = sa.size <= sb.size ? [sa, sb] : [sb, sa];
  if (![...kecil].every((t) => besar.has(t))) return null;
  const lebih = [...besar].filter((t) => !kecil.has(t));
  if (lebih.some((t) => PEMBEDA.has(t))) return null;
  return 'mirip';
}
