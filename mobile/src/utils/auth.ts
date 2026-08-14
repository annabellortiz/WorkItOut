import * as SecureStore from 'expo-secure-store';
import { FIREBASE_API_KEY, FIREBASE_REST_SIGNIN, FIREBASE_REST_TOKEN_REFRESH } from '../config/firebase';

const ID_TOKEN_KEY = 'firebase:idToken';
const REFRESH_TOKEN_KEY = 'firebase:refreshToken';
const EXPIRES_AT_KEY = 'firebase:expiresAt'; // ms since epoch
const EXPIRY_BUFFER_MS = 60 * 1000; // 1 minute buffer

type SignInResponse = {
  idToken: string;
  refreshToken?: string;
  expiresIn?: string; // seconds
  [k: string]: any;
};

export async function saveTokens(data: SignInResponse) {
  if (!data?.idToken) return;
  await SecureStore.setItemAsync(ID_TOKEN_KEY, data.idToken);
  if (data.refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
  if (data.expiresIn) {
    const expiresAt = Date.now() + parseInt(String(data.expiresIn), 10) * 1000;
    await SecureStore.setItemAsync(EXPIRES_AT_KEY, String(expiresAt));
  }
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ID_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(EXPIRES_AT_KEY);
}

export async function signIn(email: string, password: string): Promise<SignInResponse> {
  const url = FIREBASE_REST_SIGNIN(FIREBASE_API_KEY);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || 'Authentication failed';
    throw new Error(msg);
  }
  await saveTokens(data);
  return data;
}

export async function refreshIdToken(): Promise<string> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('No refresh token available');

  const url = FIREBASE_REST_TOKEN_REFRESH(FIREBASE_API_KEY);
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || 'Refresh failed';
    throw new Error(msg);
  }
  // Response fields: access_token (id token), expires_in, refresh_token, user_id, project_id, token_type
  const idToken = data?.access_token || data?.id_token;
  const refresh_token = data?.refresh_token;
  const expiresIn = data?.expires_in;
  await saveTokens({ idToken, refreshToken: refresh_token, expiresIn });
  return idToken;
}

export async function getValidIdToken(): Promise<string | null> {
  const idToken = await SecureStore.getItemAsync(ID_TOKEN_KEY);
  const expiresAtStr = await SecureStore.getItemAsync(EXPIRES_AT_KEY);
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
  const now = Date.now();

  if (idToken && expiresAt && expiresAt - EXPIRY_BUFFER_MS > now) {
    return idToken;
  }

  // Try refresh if possible
  try {
    const newToken = await refreshIdToken();
    return newToken;
  } catch (e) {
    // Clear tokens if refresh failed
    await clearTokens();
    return null;
  }
}
