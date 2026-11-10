import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { router } from './routes/index.js';
import { penangananGalat } from './middleware/index.js';

const distClient = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

export function buatApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', router);
  app.use('/api', (_req, res) => res.status(404).json({ pesan: 'Endpoint tidak ditemukan' }));

  // Mode produksi: Express menyajikan hasil build frontend di port yang sama.
  if (fs.existsSync(distClient)) {
    app.use(express.static(distClient));
    app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(distClient, 'index.html')));
  }

  app.use(penangananGalat);
  return app;
}
