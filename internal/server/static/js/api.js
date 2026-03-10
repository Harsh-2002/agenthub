import { getAuth, clearAuth } from './auth.js';

async function request(method, path, body, customToken) {
  const headers = {};
  const token = customToken || getAuth()?.api_key;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(path, opts);

  if (res.status === 401 && !customToken) {
    clearAuth();
    window.location.hash = '#/';
    window.location.reload();
    throw new Error('Unauthorized');
  }

  const ct = res.headers.get('Content-Type') || '';
  let data;
  if (ct.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const msg = typeof data === 'object' ? data.error : data;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  get:   (path, token) => request('GET', path, undefined, token),
  post:  (path, body, token) => request('POST', path, body, token),
  patch: (path, body, token) => request('PATCH', path, body, token),
  del:   (path, token) => request('DELETE', path, undefined, token),
};
