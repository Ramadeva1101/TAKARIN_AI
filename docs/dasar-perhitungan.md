# Dasar perhitungan Takarin AI

Dokumen ini menjelaskan dari mana setiap rumus di Takarin AI berasal, bagian kode yang memakainya, dan batasannya.

## 1. Masalah yang diselesaikan

Beberapa penelitian tentang UMKM kuliner di Indonesia menemukan pola yang sama:

- Harga jual ditetapkan dengan perkiraan pemilik karena biaya produksi tidak dicatat secara sistematis. Ini ditemukan di Luxie Cafe Sidoarjo ([Umsida](https://archive.umsida.ac.id/index.php/archive/preprint/download/11685/84415/93943)) dan di Bakso Citata Kediri ([UNP Kediri](https://proceeding.unpkediri.ac.id/index.php/simanis/article/download/10055/6918/39239)).
- Banyak pelaku usaha hanya menghitung bahan baku. Gas, listrik, tenaga kerja, dan penyusutan alat terlewat, dan sebagian pelaku kuliner ternyata menjual di bawah HPP tanpa sadar ([pendampingan UMKM Maros, Unhas](https://journal.unhas.ac.id/index.php/jdp/article/download/49820/14811/178996)).
- Setelah dihitung ulang dengan full costing, harga jual yang seharusnya bisa jauh lebih tinggi. Contohnya Ayam Geprek Sofi Medan: dijual Rp15.000, padahal seharusnya Rp19.000 untuk margin 50% ([UMSU](https://jurnal.umsu.ac.id/index.php/JAKK/article/download/22941/pdf)).
- Masalah ini makin berat karena harga bahan bergerak cepat. Contohnya cabai rawit merah di Denpasar naik 10,6% dalam seminggu ([PIHPS Bank Indonesia](https://www.bi.go.id/hargapangan), 10 November 2026).

Catatan: penelitian di atas umumnya studi kasus satu usaha, jadi hasilnya tidak bisa digeneralisasi ke semua UMKM. Yang konsisten adalah polanya: harga ditebak, biaya selain bahan terlewat, dan harga jarang dihitung ulang.

## 2. Rumus dan sumbernya

| Langkah | Rumus di Takarin | Dasar | Kode |
|---|---|---|---|
| Biaya bahan per porsi | takaran (satuan dasar) ÷ porsi per resep × harga per satuan dasar | Standardized recipe costing: biaya tiap bahan dijumlah, lalu dibagi jumlah porsi ([Penn State, Recipe and Menu Costing](https://psu.pb.unizin.org/hmd329/chapter/ch7/); [LibreTexts](https://workforce.libretexts.org/Bookshelves/Food_Production_Service_and_Culinary_Arts/Introduction_to_Food_Production_and_Service_(Egan)/02%3A_Menus_and_Recipes/2.04%3A_Recipe_and_Menu_Costing)) | `server/src/domain/hpp.js` |
| Susut (kulit, tulang, batang) | jumlah dibeli = jumlah dipakai ÷ (1 − susut%) | Yield test: biaya bagian yang bisa dimakan = biaya beli ÷ yield% ([BC Open Textbook, Yield Testing](https://workforce.libretexts.org/Bookshelves/Food_Production_Service_and_Culinary_Arts/Basic_Kitchen_and_Food_Service_Management_(BC_Campus)/03%3A_Food_Costing/3.02%3A_Yield_Testing); [CIA, Kitchen Calculations](https://ciachef.edu/wp-content/uploads/2024/07/kitchen-calculations.pdf)) | `hpp.js` |
| Biaya rutin per porsi | biaya bulanan ÷ (porsi per hari × hari buka); biaya harian ÷ porsi per hari | Full costing: HPP memuat bahan, tenaga kerja, dan overhead ([IPB, Soto Mie Bogor](https://repository.ipb.ac.id/jspui/handle/123456789/165343); [UMSU](https://jurnal.umsu.ac.id/index.php/JAKK/article/download/22941/pdf)) | `biayaLainPerPorsi` di `hpp.js` |
| Harga bahan | rata-rata tertimbang 3 belanja terakhir, bobot 3 : 2 : 1 (terbaru terbesar) | PSAK 14 mengizinkan metode rata-rata tertimbang untuk biaya persediaan ([ringkasan jurnal.id](https://www.jurnal.id/id/blog/perbedaan-metode-persediaan-fifo-lifo-dan-average/)). Untuk penetapan harga, biaya harus memakai harga beli terkini ([Restaurant365](https://www.restaurant365.com/blog/menu-cost-calculator-a-restaurant-owners-guide/); [MarketMan](https://www.marketman.com/blog/how-to-calculate-restaurant-food-cost)) | `hargaRataRata` di `harga.js` |
| Harga bila belum pernah belanja | harga pasar kota, lalu provinsi, lalu nasional | Data resmi PIHPS Bank Indonesia ([bi.go.id/hargapangan](https://www.bi.go.id/hargapangan)) | `services/hargaPasar.js` |
| Harga jual minimal | modal ÷ (1 − target untung), dibulatkan ke atas ke kelipatan Rp500 | Harga = biaya per porsi ÷ target food cost% ([Restaurant365](https://www.restaurant365.com/blog/menu-cost-calculator-a-restaurant-owners-guide/); [Toast](https://pos.toasttab.com/blog/on-the-line/restaurant-menu-pricing)) | `hargaAman` di `harga.js` |
| Untung | (harga jual − modal) ÷ harga jual | Margin dari harga jual, kebalikan food cost% ([7shifts](https://www.7shifts.com/blog/restaurant-food-cost/)) | `margin` di `harga.js` |
| Takaran rumah tangga | sdm, sdt, gelas, siung, dan lain-lain ke gram dengan angka perkiraan per jenis bahan | Daftar Ukuran Rumah Tangga (URT) pendamping DKBM ([Jurnal Gizi dan Pangan, IPB](https://journal.ipb.ac.id/index.php/jgizipangan/article/download/4447/2988)) | `URT` di `domain/satuan.js` |

### Catatan tentang rumusnya

- **Margin, bukan markup.** Banyak penelitian UMKM memakai cost plus pricing: harga = HPP + markup% × HPP ([Umsida, Luxie Cafe](https://archive.umsida.ac.id/index.php/archive/preprint/download/11685/84415/93943)). Takarin memakai target untung dari harga jual, karena pemilik usaha lebih mudah membaca "dari Rp15.000, untungnya 40%". Keduanya setara: markup = margin ÷ (1 − margin), sehingga untung 40% sama dengan markup 66,7%. API juga mengembalikan nilai markup.
- **Target bawaan 40%.** Di restoran, biaya bahan saja umumnya 28–35% dari harga jual ([Wisk](https://www.wisk.ai/blog/how-to-calculate-food-costs-for-restaurants)). Modal di Takarin sudah termasuk biaya rutin (gas, listrik, gaji, sewa), sehingga target untung 40% (modal 60%) masih wajar untuk warung. Target bisa diubah di Pengaturan.
- **Bobot terbaru, bukan bobot jumlah.** Rata-rata tertimbang di PSAK 14 menimbang jumlah barang untuk menilai persediaan. Takarin menimbang waktu belanja, karena tujuannya menetapkan harga jual, bukan menilai stok di laporan keuangan. Harga terbaru diberi bobot terbesar, tetapi satu belanja yang kebetulan mahal tidak langsung mengubah modal sepenuhnya.
- **Angka URT tidak seragam.** Penelitian di Aceh Besar menemukan berat satu URT berbeda-beda antarbahan dan antardaerah ([Poltekkes Aceh](https://ejournal.poltekkesaceh.ac.id/index.php/gikes/article/view/305)). Karena itu angka bawaan Takarin hanya perkiraan dan ditandai "≈" di rincian modal. Pemilik usaha bisa menggantinya per bahan.

## 3. Cara sistem serupa menangani satuan beli dan satuan resep

| Sistem | Cara | Sumber |
|---|---|---|
| majoo (Indonesia) | Resep dan stok boleh beda satuan (resep gram, stok kilogram). Stok bisa diubah bentuk, misalnya 1 ayam utuh menjadi 10 potong. | [majoo, aplikasi inventori](https://majoo.id/aplikasi-inventori) |
| meez | Satuan kemasan seperti "case" wajib diisi isinya, misalnya 24 buah per case, lalu disimpan untuk faktur berikutnya. | [meez, pack size](https://intercom.help/getmeez/en/articles/16111154-adding-a-pack-size-to-a-purchase-item) |
| reciProfity | Memisahkan "produk yang dibeli" dari "bahan yang dipakai di resep". | [CostGuard docs](https://costguard.zendesk.com/hc/en-us/articles/13285388024596-Using-Converted-Ingredients-in-Recipes) |

Polanya sama: satuan beli dan satuan pakai disimpan terpisah, lalu dihubungkan oleh satu angka isi yang ditanyakan sekali per bahan. Takarin sudah punya tempat menyimpan angka itu (`konversi_satuan`), tetapi saat ini menanyakannya dalam gram. Perbaikannya ada di bagian 5.

## 4. Kesesuaian alur dengan masalah

| Masalah di lapangan | Jawaban di Takarin |
|---|---|
| Harga ditebak | Modal dihitung per bahan dari resep, lalu harga minimal dihitung dari target untung. |
| Biaya selain bahan terlewat | Biaya rutin (gas, listrik, gaji, sewa, kemasan) diisi saat onboarding dan dibagi ke setiap porsi. |
| Harga jarang dihitung ulang | Setiap catatan belanja menghitung ulang modal semua menu yang memakai bahan itu. |
| Nota tidak pernah diolah | Nota dibaca dari foto, suara, atau teks, lalu diperiksa pemilik sebelum disimpan. |
| Tidak tahu harga wajar | Harga belanja dibandingkan dengan harga pasar PIHPS di kota yang sama. |
| Takaran pakai sendok, bukan gram | URT diubah otomatis ke gram dengan perkiraan umum. |

## 5. Batasan yang diketahui dan rencana perbaikan

Pengujian internal dengan 24 bahan dari 12 jenis makanan (seblak, es kopi susu, martabak, bakso, jus alpukat, nasi uduk, pisang goreng, tahu isi, pecel lele, mie goreng, tempe goreng, ayam geprek) menghasilkan:

- 11 dari 24 takaran resep belum bisa dihitung otomatis, misalnya 1 genggam, 1 batang, 1 ruas, dan 1 ekor.
- 18 dari 24 satuan beli belum bisa dihitung otomatis, misalnya 1 papan, 1 ikat, 1 kaleng, 1 sisir, dan 1 renceng.

Dalam kasus tersebut aplikasi tidak menebak. Menu ditandai belum lengkap, dan pemilik diminta mengisi isinya.

Perbaikan yang sudah diterapkan:

1. Bahan yang pertama ditulis per kemasan atau per hitungan (bungkus, sachet, kaleng, papan, potong, batang, genggam, ekor) dihitung per buah, dengan satuan itu sebagai 1 buah. Pengecualian: bahan yang punya berat umum, misalnya 1 potong ayam (125 g), tetap dihitung per gram. Kemasan tanpa isi tidak pernah ditebak sebagai 1 buah, karena 1 pak kertas nasi bukan 1 lembar.
2. Isi kemasan ditanyakan dalam satuan pemilik, langsung di halaman menu dan halaman periksa belanja, mengikuti pola majoo dan meez di bagian 3. Contohnya "1 papan tempe = 10 potong" atau "1 kaleng susu kental manis = 18 sdm". Jawaban disimpan sekali per bahan (`POST /bahan/:id/isi`, `domain/satuan.js` → `hitungIsi`).
3. Harga beli terakhir bisa diisi langsung di form menu ("Rp5.000 untuk 10 potong"), untuk bahan yang belum punya harga dan tidak ada di data pasar.
4. Harga yang diisi sendiri (tanpa nota) ditandai "perkiraan Anda". Harga ini tidak dipakai lagi begitu ada belanja yang tercatat, dan diberi pengingat bila lebih dari 30 hari (`hargaDariRiwayat` di `domain/harga.js`).
5. Pilihan biaya rutin ditambah "Penyusutan alat", karena biaya ini paling sering terlewat ([UNP Kediri](https://proceeding.unpkediri.ac.id/index.php/simanis/article/download/10055/6918/39239)).

Hasil pengujian ulang dengan 24 bahan yang sama:

- 24 dari 24 takaran resep langsung terhitung.
- 4 dari 24 satuan beli langsung terhitung. 20 lainnya ditanya sekali dengan pilihan satuan yang sudah dikenal ("1 ikat serai = ... batang"), dan tidak ada yang buntu.
