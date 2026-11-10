import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql');

let instance = null;

export function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(fs.readFileSync(schemaPath, 'utf8'));
  migrasi(db);
  return db;
}

// Kolom yang ditambahkan setelah versi awal. CREATE TABLE IF NOT EXISTS tidak menambah kolom ke tabel lama.
function migrasi(db) {
  const ada = (tabel, kolom) => db.prepare(`PRAGMA table_info(${tabel})`).all().some((k) => k.name === kolom);
  const tambah = (tabel, kolom, def) => !ada(tabel, kolom) && db.exec(`ALTER TABLE ${tabel} ADD COLUMN ${kolom} ${def}`);
  tambah('usaha', 'hari_buka', 'INTEGER NOT NULL DEFAULT 30');
}

export function getDb() {
  if (!instance) instance = openDb(process.env.DB_PATH || './data/app.db');
  return instance;
}

// Dipakai tes untuk mengganti database dengan versi in-memory.
export function setDb(db) {
  instance = db;
}

export const all = (sql, ...params) => getDb().prepare(sql).all(...params);
export const get = (sql, ...params) => getDb().prepare(sql).get(...params);
export const run = (sql, ...params) => getDb().prepare(sql).run(...params);

export function tx(fn) {
  const db = getDb();
  db.exec('BEGIN');
  try {
    const hasil = fn();
    db.exec('COMMIT');
    return hasil;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
