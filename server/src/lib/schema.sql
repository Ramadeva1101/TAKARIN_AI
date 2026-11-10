PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nama TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usaha (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  jenis TEXT,
  kota TEXT,
  provinsi TEXT,
  target_margin REAL NOT NULL DEFAULT 0.35,
  porsi_per_hari REAL NOT NULL DEFAULT 50,
  setup_selesai INTEGER NOT NULL DEFAULT 0
);

-- satuan_dasar: g | ml | butir | pcs
CREATE TABLE IF NOT EXISTS bahan (
  id INTEGER PRIMARY KEY,
  usaha_id INTEGER NOT NULL REFERENCES usaha(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  satuan_dasar TEXT NOT NULL,
  komoditas TEXT,
  susut_persen REAL NOT NULL DEFAULT 0,
  UNIQUE (usaha_id, nama)
);

CREATE TABLE IF NOT EXISTS alias_bahan (
  id INTEGER PRIMARY KEY,
  usaha_id INTEGER NOT NULL REFERENCES usaha(id) ON DELETE CASCADE,
  istilah TEXT NOT NULL,
  bahan_id INTEGER NOT NULL REFERENCES bahan(id) ON DELETE CASCADE,
  UNIQUE (usaha_id, istilah)
);

-- faktor: berapa satuan_dasar dalam 1 satuan ini (contoh: 1 ikat kangkung = 250 g)
CREATE TABLE IF NOT EXISTS konversi_satuan (
  id INTEGER PRIMARY KEY,
  bahan_id INTEGER NOT NULL REFERENCES bahan(id) ON DELETE CASCADE,
  satuan TEXT NOT NULL,
  faktor REAL NOT NULL,
  UNIQUE (bahan_id, satuan)
);

CREATE TABLE IF NOT EXISTS nota (
  id INTEGER PRIMARY KEY,
  usaha_id INTEGER NOT NULL REFERENCES usaha(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  sumber TEXT NOT NULL CHECK (sumber IN ('foto', 'suara', 'teks', 'manual')),
  nama_toko TEXT,
  total_tertulis REAL,
  transkrip TEXT,
  status TEXT NOT NULL DEFAULT 'draf' CHECK (status IN ('draf', 'disimpan')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- harga = total harga baris (qty x harga satuan) sesuai yang tertulis/diucapkan
CREATE TABLE IF NOT EXISTS nota_item (
  id INTEGER PRIMARY KEY,
  nota_id INTEGER NOT NULL REFERENCES nota(id) ON DELETE CASCADE,
  teks_asli TEXT,
  nama_bahan TEXT,
  bahan_id INTEGER REFERENCES bahan(id) ON DELETE SET NULL,
  qty REAL,
  satuan TEXT,
  harga REAL,
  yakin REAL
);

-- harga_per_satuan: rupiah per 1 satuan_dasar bahan
CREATE TABLE IF NOT EXISTS harga_bahan (
  id INTEGER PRIMARY KEY,
  bahan_id INTEGER NOT NULL REFERENCES bahan(id) ON DELETE CASCADE,
  harga_per_satuan REAL NOT NULL,
  tanggal TEXT NOT NULL,
  sumber TEXT NOT NULL,
  nama_toko TEXT,
  nota_id INTEGER REFERENCES nota(id) ON DELETE SET NULL
);

-- harga acuan daerah; harga dalam rupiah per satuan (kg | liter | butir)
CREATE TABLE IF NOT EXISTS harga_pasar (
  id INTEGER PRIMARY KEY,
  komoditas TEXT NOT NULL,
  wilayah TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('kota', 'provinsi', 'nasional')),
  harga REAL NOT NULL,
  satuan TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  sumber TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_harga_pasar ON harga_pasar (komoditas, wilayah, tanggal);

CREATE TABLE IF NOT EXISTS menu (
  id INTEGER PRIMARY KEY,
  usaha_id INTEGER NOT NULL REFERENCES usaha(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  harga_jual REAL NOT NULL,
  porsi_per_batch REAL NOT NULL DEFAULT 1
);

-- qty dalam satuan apa pun (sdm, siung, kg, ...); dikonversi saat dihitung
CREATE TABLE IF NOT EXISTS resep_item (
  id INTEGER PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
  bahan_id INTEGER NOT NULL REFERENCES bahan(id) ON DELETE CASCADE,
  qty REAL NOT NULL,
  satuan TEXT NOT NULL
);

-- biaya operasional yang dibagi ke semua porsi
CREATE TABLE IF NOT EXISTS biaya_lain (
  id INTEGER PRIMARY KEY,
  usaha_id INTEGER NOT NULL REFERENCES usaha(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  nominal REAL NOT NULL,
  periode TEXT NOT NULL CHECK (periode IN ('porsi', 'hari', 'bulan'))
);

CREATE TABLE IF NOT EXISTS promo (
  id INTEGER PRIMARY KEY,
  usaha_id INTEGER NOT NULL REFERENCES usaha(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  harga_paket REAL NOT NULL,
  biaya_kemasan REAL NOT NULL DEFAULT 0,
  caption TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promo_item (
  id INTEGER PRIMARY KEY,
  promo_id INTEGER NOT NULL REFERENCES promo(id) ON DELETE CASCADE,
  menu_id INTEGER NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
  qty REAL NOT NULL
);
