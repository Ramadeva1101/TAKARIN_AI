import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import Groq, { toFile } from 'groq-sdk';
import * as skema from './schemas.js';
import * as prompt from './prompts.js';

const dirFixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

export class AiError extends Error {
  constructor(pesan, detail = []) {
    super(pesan);
    this.status = 503;
    this.detail = detail;
  }
}

export const modeAi = () => (process.env.AI_MODE === 'live' ? 'live' : 'fixture');

const daftarModel = (utama, cadangan) =>
  [process.env[utama], ...(process.env[cadangan] || '').split(',')].map((s) => s?.trim()).filter(Boolean);

let klienTeks = null;
function kelontong() {
  if (!process.env.KELONTONG_API_KEY) throw new AiError('KELONTONG_API_KEY belum diisi di server/.env');
  klienTeks ??= new OpenAI({
    apiKey: process.env.KELONTONG_API_KEY,
    baseURL: process.env.KELONTONG_BASE_URL || 'https://api.kelontongai.id/v1',
    timeout: 60_000,
    maxRetries: 0,
  });
  return klienTeks;
}

let klienSuara = null;
function groq() {
  if (!process.env.GROQ_API_KEY) throw new AiError('Pengubah suara ke teks belum aktif di server ini. Ketik saja belanjaannya.');
  klienSuara ??= new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 60_000, maxRetries: 1 });
  return klienSuara;
}

function fixture(nama) {
  return JSON.parse(fs.readFileSync(path.join(dirFixture, `${nama}.json`), 'utf8'));
}

// Mengambil objek JSON dari jawaban model (kadang dibungkus ```json atau ada teks tambahan).
export function ambilJson(teks) {
  const tanpaPagar = String(teks).replace(/```(?:json)?/gi, '');
  const awal = tanpaPagar.indexOf('{');
  const akhir = tanpaPagar.lastIndexOf('}');
  if (awal < 0 || akhir <= awal) throw new Error('Jawaban AI bukan JSON');
  return JSON.parse(tanpaPagar.slice(awal, akhir + 1));
}

async function cobaModel(models, kerja) {
  if (!models.length) throw new AiError('Nama model AI belum diisi di server/.env');
  const gagal = [];
  for (const model of models) {
    try {
      return { ...(await kerja(model)), model };
    } catch (err) {
      gagal.push({ model, pesan: String(err?.message || err).slice(0, 200) });
    }
  }
  throw new AiError('Layanan AI sedang tidak bisa dipakai. Coba lagi atau isi manual.', gagal);
}

async function chatJson(models, messages, schema) {
  return cobaModel(models, async (model) => {
    const r = await kelontong().chat.completions.create({ model, messages, temperature: 0.1 });
    const isi = r.choices?.[0]?.message?.content ?? '';
    return { data: schema.parse(ambilJson(isi)) };
  });
}

const modelNota = () => daftarModel('MODEL_NOTA', 'MODEL_NOTA_FALLBACK');
const modelTeks = () => daftarModel('MODEL_TEKS', 'MODEL_TEKS_FALLBACK');

export async function bacaNota(buffer, mime) {
  if (modeAi() === 'fixture') return { data: skema.nota.parse(fixture('nota')), model: 'fixture' };
  return chatJson(
    modelNota(),
    [
      { role: 'system', content: prompt.NOTA },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Baca nota belanja ini.' },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${buffer.toString('base64')}` } },
        ],
      },
    ],
    skema.nota,
  );
}

export async function transkripsi(buffer, namaFile, mime) {
  if (modeAi() === 'fixture') return { teks: fixture('ucapan').transkrip, model: 'fixture' };
  try {
    const file = await toFile(buffer, namaFile || 'rekaman.webm', { type: mime });
    const r = await groq().audio.transcriptions.create({ file, model: 'whisper-large-v3-turbo', language: 'id' });
    return { teks: r.text, model: 'whisper-large-v3-turbo' };
  } catch (err) {
    if (err instanceof AiError) throw err;
    throw new AiError('Suara tidak bisa diubah jadi teks. Coba lagi atau ketik manual.', [{ pesan: String(err?.message || err) }]);
  }
}

export async function bacaUcapan(teks) {
  if (modeAi() === 'fixture') return { data: skema.ucapan.parse(fixture('ucapan').hasil), model: 'fixture' };
  return chatJson(modelTeks(), [{ role: 'system', content: prompt.UCAPAN }, { role: 'user', content: teks }], skema.ucapan);
}

export async function bacaCerita(teks, namaBahanAda = []) {
  if (modeAi() === 'fixture') return { data: skema.cerita.parse(fixture('cerita')), model: 'fixture' };
  // Daftar bahan yang sudah ada ditaruh di pesan pengguna. Kalau ditambahkan ke prompt sistem,
  // model cenderung menulis tabel HPP bebas dan bukan JSON.
  const isi = namaBahanAda.length
    ? `Cerita:
${teks}

Bahan yang sudah tercatat (pakai nama ini kalau bahannya sama, misal "cabe" = "cabai rawit"; jangan dipaksakan kalau berbeda): ${namaBahanAda.slice(0, 80).join(', ')}.

${prompt.ATURAN_JSON} Ikuti Bentuk di instruksi.`
    : teks;
  return chatJson(modelTeks(), [{ role: 'system', content: prompt.CERITA }, { role: 'user', content: isi }], skema.cerita);
}

// Mengembalikan teks, atau null kalau mode fixture / AI gagal (pemanggil memakai templat).
export const tulisPenjelasan = (fakta) => tulisTeks(prompt.PENJELASAN, fakta);
export const tulisCatatan = (fakta) => tulisTeks(prompt.CATATAN, fakta);

async function tulisTeks(sistem, fakta) {
  if (modeAi() === 'fixture') return null;
  try {
    const { data } = await cobaModel(modelTeks(), async (model) => {
      const r = await kelontong().chat.completions.create({
        model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: sistem },
          { role: 'user', content: JSON.stringify(fakta) },
        ],
      });
      const isi = r.choices?.[0]?.message?.content?.trim();
      if (!isi) throw new Error('Jawaban kosong');
      return { data: isi };
    });
    return data;
  } catch {
    return null;
  }
}

export async function saranPromo(data) {
  if (modeAi() === 'fixture') return { data: skema.promoSaran.parse(fixture('promo')), model: 'fixture' };
  return chatJson(modelTeks(), [{ role: 'system', content: prompt.PROMO }, { role: 'user', content: JSON.stringify(data) }], skema.promoSaran);
}

// Kata kunci untuk mode fixture: perkiraan sederhana tanpa AI.
const KUNCI_KULINER = /(makan|warung|kedai|kopi|teh|jus|minum|kue|roti|bakso|mie|mi |nasi|ayam|sate|seblak|angkringan|katering|catering|frozen|sambal|jamu|gorengan|martabak|donat|es |cafe|kafe|dapur|resto|bakery|snack|keripik|pempek|soto)/i;

export async function cekJenisUsaha(teks) {
  if (modeAi() === 'fixture') {
    const valid = KUNCI_KULINER.test(` ${teks} `);
    return {
      data: { valid, kelompok: valid ? 'kuliner lain' : null, nama_jenis: valid ? teks.trim().toLowerCase().slice(0, 40) : null, alasan: valid ? 'Terlihat seperti usaha yang mengolah makanan atau minuman.' : 'Tidak terlihat seperti usaha yang mengolah makanan atau minuman.' },
      model: 'fixture',
    };
  }
  return chatJson(modelTeks(), [{ role: 'system', content: prompt.JENIS_USAHA }, { role: 'user', content: teks }], skema.jenisUsaha);
}
