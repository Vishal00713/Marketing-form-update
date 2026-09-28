import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  type User 
} from 'firebase/auth';
import { auth } from './firebase';

export { auth };

export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

// Clean Google sign-in provider for basic Gmail authentication
const baseProvider = new GoogleAuthProvider();
baseProvider.setCustomParameters({
  prompt: 'select_account'
});

// Provider with extra Google Sheets and Drive permissions when explicitly needed
const sheetsProvider = new GoogleAuthProvider();
GOOGLE_SHEETS_SCOPES.forEach(scope => sheetsProvider.addScope(scope));
sheetsProvider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory (DO NOT store in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User exists in Firebase session but access token is lost on page reload
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google.
 * @param requestSheetsScopes Whether to request Google Drive/Sheets permissions immediately
 */
export const googleSignIn = async (requestSheetsScopes: boolean = false): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    const providerToUse = requestSheetsScopes ? sheetsProvider : baseProvider;
    const result = await signInWithPopup(auth, providerToUse);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    // Store access token if returned (optional for basic auth, required for direct Sheets API)
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    // Transform known Firebase Auth error codes into human-readable messages
    if (error.code === 'auth/unauthorized-domain') {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
      const friendlyErr = new Error(
        `Domain not authorized: "${hostname}" must be added to Firebase Console -> Authentication -> Settings -> Authorized Domains. In the meantime, you can access the admin cPanel directly using the Admin PIN (admin123).`
      );
      (friendlyErr as any).code = error.code;
      throw friendlyErr;
    }

    if (error.code === 'auth/popup-blocked') {
      const friendlyErr = new Error(
        'The sign-in popup was blocked by your browser. Please allow popups for this site, or log in with the Admin PIN.'
      );
      (friendlyErr as any).code = error.code;
      throw friendlyErr;
    }

    if (error.code === 'auth/popup-closed-by-user') {
      const friendlyErr = new Error('Sign-in popup was closed before completion. Please try again.');
      (friendlyErr as any).code = error.code;
      throw friendlyErr;
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
  }
};

// Convenient aliases
export const googleSignOut = logout;
export const getStoredAccessToken = () => cachedAccessToken;
export const initFirebaseAuthListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};
