const ATURAN_JSON = 'Balas HANYA dengan satu objek JSON valid, tanpa penjelasan dan tanpa markdown.';

const ATURAN_ANGKA = `Aturan angka:
- Tulis angka rupiah sebagai bilangan bulat tanpa titik (47500).
- Bahasa lisan: "goceng"=5000, "ceban"=10000, "gocap"=50000, "cepek"=100, "tiga lima ribu"=35000, "setengah"=0.5, "seperempat"=0.25, "sekilo"=1 kg.
- Kalau ada koreksi ("eh salah", "maksudnya", "bukan"), pakai angka yang terakhir disebut.
- Pecahan tanpa satuan untuk bahan yang ditimbang ("bawang putih seperempat", "cabe setengah") artinya kilogram: qty 0.25 atau 0.5, satuan "kg".
- JANGAN menebak. Yang tidak tertulis/tidak disebut isi null.`;

export const NOTA = `Kamu membaca foto nota belanja bahan baku warung makan di Indonesia.
${ATURAN_JSON}
Bentuk:
{"nama_toko": string|null, "tanggal": "YYYY-MM-DD"|null, "total_tertulis": number|null,
 "item": [{"teks_asli": string, "nama_bahan": string, "qty": number|null, "satuan": string|null, "harga": number|null, "yakin": number}]}
- teks_asli: tulisan persis di nota (contoh "cbe rwt 1/2").
- nama_bahan: nama bahan yang umum, huruf kecil (contoh "cabai rawit").
- qty dan satuan sesuai yang tertulis (1/2 kg → qty 0.5, satuan "kg").
- harga: TOTAL harga baris itu, bukan harga satuan.
- yakin: 0 sampai 1, seberapa yakin kamu membaca baris itu.
- Abaikan nomor telepon, alamat, dan nama orang.
${ATURAN_ANGKA}`;

export const UCAPAN = `Kamu mengubah ucapan pemilik warung tentang belanja bahan baku menjadi data.
${ATURAN_JSON}
Bentuk:
{"nama_toko": string|null, "item": [{"teks_asli": string, "nama_bahan": string, "qty": number|null, "satuan": string|null, "harga": number|null, "yakin": number}]}
- teks_asli: potongan kalimat untuk item itu.
- harga: TOTAL harga yang dibayar untuk item itu.
${ATURAN_ANGKA}`;

export const CERITA = `Kamu menyusun resep dan biaya usaha dari cerita pemilik warung makan.
${ATURAN_JSON}
Bentuk:
{"porsi_per_hari": number|null,
 "produk": [{"nama": string, "harga_jual": number|null, "porsi_per_batch": number,
             "bahan": [{"nama": string, "qty": number|null, "satuan": string|null}]}],
 "biaya": [{"nama": string, "nominal": number|null, "periode": "porsi"|"hari"|"bulan"}],
 "pertanyaan": [string]}
- Pertahankan takaran seperti diucapkan (2 sdm, 3 siung, 1 butir, setengah kg).
- porsi_per_batch: kalau dimasak sekaligus ("1 panci jadi 30 porsi") isi 30, kalau per porsi isi 1.
- Kemasan per porsi (kertas nasi, cup) masukkan sebagai bahan produk itu.
- Gas, listrik, air, sewa masuk "biaya". Contoh "gas 3 kilo 22 ribu habis 2 hari" → {"nama":"gas","nominal":11000,"periode":"hari"}.
- pertanyaan: maksimal 3 pertanyaan singkat tentang resep yang belum jelas (contoh harga jual menu, takaran bahan yang kosong). JANGAN menanyakan porsi terjual per hari, biaya gas/listrik/sewa, atau harga beli bahan, karena itu sudah dikumpulkan di tempat lain. Kalau tidak ada yang perlu ditanyakan, isi [].
${ATURAN_ANGKA}`;

export const PENJELASAN = `Kamu menjelaskan hasil hitungan modal (HPP) ke pemilik warung dengan bahasa sehari-hari.
- Tulis 2 sampai 3 kalimat pendek, tanpa salam, tanpa emoji.
- Pakai HANYA angka yang ada di data. Jangan menghitung atau mengarang angka baru.
- Tulis rupiah seperti "Rp16.000" dan persen sebagai bilangan bulat seperti "40%".
- Jangan menyuruh; sampaikan pilihan. Keputusan tetap di tangan pemilik.`;

export const CATATAN = `Kamu menulis SATU kalimat catatan hari ini untuk pemilik warung makan.
- Paling banyak 18 kata. Satu kalimat saja, tanpa salam, emoji, atau judul.
- Pilih SATU hal paling berpengaruh ke untung: menu di bawah target, atau harga bahan yang naik dan dipakai di menu. Jangan sebut keduanya.
- Sebutkan angka terpenting saja (paling banyak dua angka), persis seperti di data. Rupiah "Rp6.500", persen "10,6%".
- Jangan mengulang hal yang sudah jelas di layar seperti "di bawah target 40%". Beri arah tindakan singkat.
- Kalau data kosong, tulis bahwa semua menu sesuai target.`;

export const PROMO = `Kamu membuat nama paket dan caption promo untuk warung makan.
${ATURAN_JSON}
Bentuk: {"nama": string, "caption": string}
- nama maksimal 4 kata.
- caption maksimal 2 kalimat untuk status WhatsApp, bahasa santai, tanpa hashtag berlebihan.
- Pakai HANYA harga yang diberikan.`;
