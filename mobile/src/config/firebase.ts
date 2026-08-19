import Constants from 'expo-constants';

// Resolve the API key from several places and log what's found to help debugging.
const envKey = process.env.FIREBASE_API_KEY || (Constants?.expoConfig?.extra?.FIREBASE_API_KEY as string) || (Constants?.manifest?.extra?.FIREBASE_API_KEY as string) || '';
console.log('FIREBASE_API_KEY resolved length:', envKey ? envKey.length : 0);

export const FIREBASE_API_KEY = envKey || 'REPLACE_WITH_FIREBASE_API_KEY';

// Firebase Auth REST endpoints
export const FIREBASE_REST_SIGNIN = (apiKey: string) =>
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

export const FIREBASE_REST_SIGNUP = (apiKey: string) =>
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

export const FIREBASE_REST_TOKEN_REFRESH = (apiKey: string) =>
  `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;

// Delete account (requires idToken)
export const FIREBASE_REST_DELETE = (apiKey: string) =>
  `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`;
