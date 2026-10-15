const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiUrl = API_URL;
export const TOKEN_KEY = 'motionlux_token';

export async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.');
  }

  const body = await res.json().catch(() => ({}));

  // Sesi habis / token tidak valid -> kembalikan user ke halaman login
  if (res.status === 401 && token && path !== '/auth/login') {
    window.dispatchEvent(new Event('motionlux:unauthorized'));
  }
  if (!res.ok) throw new Error(body.message || 'Request failed');
  return body.data;
}
