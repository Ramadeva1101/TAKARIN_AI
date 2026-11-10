import { buatApp } from './app.js';
import { getDb } from './lib/db.js';
import { modeAi } from './ai/provider.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'ganti-dengan-string-acak') {
  console.warn('Peringatan: JWT_SECRET masih bawaan. Ganti di server/.env sebelum dipakai orang lain.');
}

getDb();
const port = Number(process.env.PORT) || 3001;
buatApp().listen(port, () => {
  console.log(`API jalan di http://localhost:${port}/api (AI: ${modeAi()})`);
});
