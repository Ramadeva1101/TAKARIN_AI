export class AppError extends Error {
  constructor(status, pesan) {
    super(pesan);
    this.status = status;
  }
}

export const tidakDitemukan = (apa) => new AppError(404, `${apa} tidak ditemukan`);
export const tanggalHariIni = () => new Date().toISOString().slice(0, 10);
