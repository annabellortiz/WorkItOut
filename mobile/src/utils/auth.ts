import * as SecureStore from 'expo-secure-store';
import { FIREBASE_API_KEY, FIREBASE_REST_SIGNIN, FIREBASE_REST_TOKEN_REFRESH, FIREBASE_REST_SIGNUP } from '../config/firebase';

const ID_TOKEN_KEY = 'firebaseidtoken';
const REFRESH_TOKEN_KEY = 'firebaserefreshtoken';
const EXPIRES_AT_KEY = 'firebaseexpiresat'; // ms since epoch
const EXPIRY_BUFFER_MS = 60 * 1000; // 1 minute buffer

type SignInResponse = {
  idToken: string;
  refreshToken?: string;
  expiresIn?: string; // seconds
  [k: string]: any;
};

export async function saveTokens(data: SignInResponse) {
  if (!data?.idToken) return;
  console.log('Saving tokens with keys', ID_TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRES_AT_KEY);
  try {
    await SecureStore.setItemAsync(ID_TOKEN_KEY, data.idToken);
  } catch (e: any) {
    throw new Error('Failed to save idToken to SecureStore: ' + (e?.message || String(e)));
  }

  if (data.refreshToken) {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
    } catch (e: any) {
      // clean up idToken to avoid partial state
      await SecureStore.deleteItemAsync(ID_TOKEN_KEY).catch(() => {});
      throw new Error('Failed to save refreshToken to SecureStore: ' + (e?.message || String(e)));
    }
  }

  if (data.expiresIn) {
    const expiresAt = Date.now() + parseInt(String(data.expiresIn), 10) * 1000;
    try {
      await SecureStore.setItemAsync(EXPIRES_AT_KEY, String(expiresAt));
    } catch (e: any) {
      await SecureStore.deleteItemAsync(ID_TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
      throw new Error('Failed to save expiresAt to SecureStore: ' + (e?.message || String(e)));
    }
  }
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ID_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(EXPIRES_AT_KEY);
}

// Convenience wrapper for signing out from the app (client-only)
export async function signOut(): Promise<void> {
  try {
    await clearTokens();
  } catch (e) {
    console.error('signOut error', e);
    throw e;
  }
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

export async function signUp(email: string, password: string): Promise<SignInResponse> {
  const url = FIREBASE_REST_SIGNUP(FIREBASE_API_KEY);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { raw: text };
  }
  console.log('signUp response', res.status, data);
  if (!res.ok) {
    const msg = data?.error?.message || data?.raw || 'Sign up failed';
    throw new Error(msg);
  }

  // Save tokens locally; if this fails, attempt to delete the newly created user to avoid orphaned accounts
  try {
    await saveTokens(data);
  } catch (saveErr: any) {
    console.error('Failed to save tokens locally after signUp:', saveErr);
    // Attempt to delete the created user using the idToken from the response
    try {
      const deleteUrl = FIREBASE_REST_DELETE(FIREBASE_API_KEY);
      const idTokenForDelete = data?.idToken || data?.access_token;
      if (idTokenForDelete) {
        const delRes = await fetch(deleteUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: idTokenForDelete }),
        });
        const delText = await delRes.text();
        console.log('delete account response', delRes.status, delText);
      } else {
        console.warn('No idToken available to delete newly created user');
      }
    } catch (delErr) {
      console.error('Failed to delete user after token save failure:', delErr);
    }

    throw new Error('Failed to save session on device: ' + (saveErr?.message || String(saveErr)));
  }

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
