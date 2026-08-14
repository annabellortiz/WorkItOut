// Replace with your Firebase Web API key from project settings
export const FIREBASE_API_KEY = 'REPLACE_WITH_FIREBASE_API_KEY';

// Firebase Auth REST endpoints
export const FIREBASE_REST_SIGNIN = (apiKey: string) =>
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

export const FIREBASE_REST_TOKEN_REFRESH = (apiKey: string) =>
  `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
