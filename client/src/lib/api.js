const KUNCI = 'dapur-untung-token';

export const token = {
  get: () => localStorage.getItem(KUNCI),
  set: (t) => localStorage.setItem(KUNCI, t),
  hapus: () => localStorage.removeItem(KUNCI),
};

export class ApiError extends Error {
  constructor(status, data) {
    super(data?.pesan || 'Terjadi kesalahan');
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const t = token.get();
  if (t) headers.Authorization = `Bearer ${t}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, { pesan: 'Tidak bisa terhubung ke server. Pastikan server jalan.' });
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 401) token.hapus();
    throw new ApiError(res.status, data);
  }
  return data;
}

export const pesanGalat = (err) => {
  const d = err?.data?.detail;
  if (Array.isArray(d) && d.length) return `${err.message}: ${d.map((x) => `${x.field} ${x.pesan}`).join('; ')}`;
  return err?.message || 'Terjadi kesalahan';
};

export const rupiah = (n) => (n == null ? '–' : `Rp${Math.round(n).toLocaleString('id-ID')}`);
export const persen = (x, d = 1) => (x == null ? '–' : `${(x * 100).toFixed(d).replace('.', ',')}%`);
export const tanggal = (s) => (s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–');
