import { buatApp } from './app.js';
import { getDb } from './lib/db.js';
import { modeAi } from './ai/provider.js';
import { buatUlangAkunDemo } from './services/demo.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'ganti-dengan-string-acak') {
  console.warn('Peringatan: JWT_SECRET masih bawaan. Ganti di server/.env sebelum dipakai orang lain.');
}

getDb();

// Akun demo dipakai bersama oleh banyak pengunjung. Dengan DEMO_RESET=on, datanya dikembalikan ke awal
// setiap server dinyalakan dan setiap tengah malam, supaya angka yang dilihat juri selalu bersih.
async function resetDemo() {
  try {
    await buatUlangAkunDemo();
    console.log('Akun demo dikembalikan ke data awal');
  } catch (err) {
    console.error('Gagal mengembalikan akun demo:', err.message);
  }
}
if (process.env.DEMO_RESET === 'on') {
  await resetDemo();
  const jadwalkan = () => {
    const besok = new Date();
    besok.setHours(24, 0, 0, 0);
    setTimeout(async () => {
      await resetDemo();
      jadwalkan();
    }, besok - Date.now());
  };
  jadwalkan();
}
const port = Number(process.env.PORT) || 3001;
buatApp().listen(port, () => {
  console.log(`API jalan di http://localhost:${port}/api (AI: ${modeAi()})`);
});
