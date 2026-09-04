// Firebase Authentication with Google Workspace Scopes
// Complies with SKILL.md guidelines for Google Workspace (Sheets, Drive)
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut
} from 'firebase/auth';

// Read config from root or environment
const firebaseConfig = {
  projectId: "gen-lang-client-0521376377",
  appId: "1:164244231099:web:ef5f56eb5f608a08a06a9e",
  apiKey: "AIzaSyC5vHDZ5Oe8AnkUrvkekQrLKWu3dWQ7s-w",
  authDomain: "gen-lang-client-0521376377.firebaseapp.com",
  storageBucket: "gen-lang-client-0521376377.firebasestorage.app",
  messagingSenderId: "164244231099"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the access token in memory (mandated by SKILL.md)
let cachedAccessToken: string | null = null;
let cachedFirebaseUser: FirebaseUser | null = null;
let isSigningIn = false;

// Auth state listener
export const initAuth = (
  onSuccess?: (user: FirebaseUser, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    cachedFirebaseUser = user;
    if (user && cachedAccessToken) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        if (onFailure) onFailure();
      }
    }
  });
};

/**
 * Sign in using Firebase Google Auth with popup
 */
export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    cachedFirebaseUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    // Provide user-friendly error messages
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completing authorization. Please try again.');
    } else if (error?.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled. Please try again.');
    } else if (error?.code === 'auth/popup-blocked') {
      throw new Error('The Google login popup was blocked by your browser. Please allow popups for this site or open in a new tab.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string> => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  // If not cached, trigger Google sign in
  const authResult = await googleSignIn();
  return authResult.accessToken;
};

export const getCachedGoogleUser = (): FirebaseUser | null => {
  return cachedFirebaseUser;
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedFirebaseUser = null;
};
