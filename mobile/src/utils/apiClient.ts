import { getValidIdToken } from './auth';

const DEFAULT_BASE = 'http://localhost:3000';
export const API_BASE = process.env.API_BASE || DEFAULT_BASE;

async function authFetch(path: string, opts: RequestInit = {}) {
  const token = await getValidIdToken();
  if (!token) throw new Error('No id token available');
  console.log('authFetch:', opts.method, path, 'token:', token.substring(0, 30) + '...');
  const headers = Object.assign({}, opts.headers || {}, { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
  const res = await fetch(`${API_BASE.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`, { ...opts, headers });
  const text = await res.text();
  console.log('authFetch response:', res.status, text.substring(0, 100));
  let data: any;
  try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.error || data?.message || JSON.stringify(data));
  return data;
}

export async function listWorkouts() {
  return authFetch('/user/me/workouts', { method: 'GET' });
}

export async function createWorkout(payload: any) {
  return authFetch('/user/me/workouts', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateWorkout(id: string, payload: any) {
  return authFetch(`/user/me/workouts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteWorkout(id: string) {
  return authFetch(`/user/me/workouts/${id}`, { method: 'DELETE' });
}
