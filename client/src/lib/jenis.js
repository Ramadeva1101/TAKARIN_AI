// Jenis usaha bawaan beserta contoh cerita menu. Jenis lain diisi sendiri dan diperiksa AI.
export const JENIS = [
  {
    id: 'warung makan',
    label: 'Warung makan',
    ket: 'Nasi, lauk, mi, gorengan',
    contoh:
      'Saya jualan ayam geprek 15 ribu. Satu porsi pakai 1 potong ayam, tepung bumbu 50 gram, cabai rawit 20 gram, bawang putih 1 siung, minyak 1 sdm, nasi 100 gram, kertas nasi. Es teh 4 ribu: 1 teh celup, gula 2 sdm, es batu 150 gram, cup plastik.',
  },
  {
    id: 'kedai minuman',
    label: 'Kedai minuman',
    ket: 'Es teh, kopi, jus',
    contoh:
      'Es kopi susu 12 ribu: kopi bubuk 15 gram, susu kental manis 2 sdm, susu cair 100 ml, es batu 150 gram, cup plastik dan sedotan. Es jeruk 6 ribu: jeruk peras 150 gram, gula 2 sdm, es batu, cup.',
  },
  {
    id: 'kue dan jajanan',
    label: 'Kue dan jajanan',
    ket: 'Dibuat per adonan',
    contoh:
      'Bolu pandan dijual 3 ribu per potong. Satu loyang jadi 20 potong: tepung terigu 250 gram, telur 4 butir, gula pasir 200 gram, margarin 100 gram, santan 200 ml, pasta pandan 1 sdt. Plastik mika 1 per potong.',
  },
  {
    id: 'katering',
    label: 'Katering',
    ket: 'Nasi kotak, pesanan',
    contoh:
      'Nasi kotak ayam bakar 25 ribu. Per kotak: nasi 150 gram, ayam 1 potong, tempe 1 potong, sambal 1 sdm, lalapan, kerupuk 1, kotak nasi 1. Bumbu ayam bakar per 10 potong: bawang merah 8 siung, bawang putih 5 siung, kecap 5 sdm.',
  },
];

const CONTOH_UMUM =
  'Seblak original saya jual 12 ribu. Satu porsi pakai kerupuk 30 gram, telur 1 butir, cabai rawit 10 gram, bawang putih 2 siung, kencur 5 gram, minyak 1 sdm, dan 1 mangkuk plastik.';

export const contohCerita = (jenis) => JENIS.find((j) => j.id === jenis)?.contoh ?? CONTOH_UMUM;
