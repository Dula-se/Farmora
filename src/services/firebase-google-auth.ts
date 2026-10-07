import { Platform } from 'react-native';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { auth } from '@/config/firebase';
import { googleAuthApi, ApiUser } from './api';

import Constants, { ExecutionEnvironment } from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Web Client ID from google-services.json (client_type: 3)
export const GOOGLE_WEB_CLIENT_ID = '833570480620-5f7si8699iefh1svlrpb5q7lnl7s376g.apps.googleusercontent.com';

// Initialize GoogleSignin lazily on native platforms (ONLY in standalone/dev builds, never Expo Go)
let isGoogleSigninConfigured = false;

function ensureGoogleSigninConfigured() {
  if (Platform.OS === 'web' || isExpoGo || isGoogleSigninConfigured) return;
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });
    isGoogleSigninConfigured = true;
  } catch (e) {
    console.warn('[Google Auth] Native GoogleSignin not available in this environment:', e);
  }
}

/**
 * Perform real Google Sign-In with Firebase Authentication
 * - On Native (Android / iOS): Uses official Google Play Services dialog (requires no redirect URIs!)
 * - On Web: Uses Firebase's official signInWithPopup
 * - In Expo Go: Provides friendly redirect to real Gmail entry
 * - Synchronizes authenticated user with Famora MongoDB backend
 */
export async function signInWithRealGoogleAccount(options: {
  accountType?: 'farmer' | 'buyer';
  buyerType?: string;
}): Promise<{ user: ApiUser; firebaseUser: any }> {
  // 1. Web Platform: Use Firebase Google Popup
  if (Platform.OS === 'web') {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    const { signInWithPopup } = await import('firebase/auth');
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;

    const backendRes = await googleAuthApi({
      email: firebaseUser.email || '',
      fullName: firebaseUser.displayName || 'Google User',
      avatarUrl: firebaseUser.photoURL || undefined,
      googleId: firebaseUser.uid,
      accountType: options.accountType || 'buyer',
      buyerType: options.buyerType,
    });

    return { user: backendRes.user, firebaseUser };
  }

  // 2. In Expo Go: Use secure WebBrowser OAuth session with Google
  if (isExpoGo) {
    const redirectUri = AuthSession.makeRedirectUri({
      preferLocalhost: false,
    });
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_WEB_CLIENT_ID)}` +
      `&response_type=token%20id_token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('openid profile email')}` +
      `&nonce=${encodeURIComponent(nonce)}` +
      `&prompt=select_account`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      // Parse parameters from redirect URL fragment or query
      const urlPart = result.url.includes('#') ? result.url.split('#')[1] : result.url.split('?')[1];
      const params = new URLSearchParams(urlPart || '');
      const idToken = params.get('id_token');
      const accessToken = params.get('access_token');

      let firebaseUser: any = null;
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken, accessToken || undefined);
        const userCredential = await signInWithCredential(auth, credential);
        firebaseUser = userCredential.user;
      } else if (accessToken) {
        const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const googleProfile = await userInfoRes.json();
        firebaseUser = {
          email: googleProfile.email,
          displayName: googleProfile.name,
          photoURL: googleProfile.picture,
          uid: googleProfile.id,
        };
      }

      if (!firebaseUser) {
        throw new Error('Google did not return user credentials.');
      }

      const backendRes = await googleAuthApi({
        email: firebaseUser.email || '',
        fullName: firebaseUser.displayName || 'Google User',
        avatarUrl: firebaseUser.photoURL || undefined,
        googleId: firebaseUser.uid,
        accountType: options.accountType || 'buyer',
        buyerType: options.buyerType,
      });

      return { user: backendRes.user, firebaseUser };
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Google Sign-In was cancelled.');
    } else {
      throw new Error(`Google Sign-In was not completed (${result.type}).`);
    }
  }

  // 3. Standalone / Development Build on Android or iOS (Native Google Play Services):
  ensureGoogleSigninConfigured();
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Open native Google account picker sheet
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken || (response as any).idToken;

    if (!idToken) {
      throw new Error('Google Sign-In succeeded but did not return an ID token.');
    }

    // Authenticate with Firebase using Google ID Token
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;

    // Persist verified profile to MongoDB backend
    const backendRes = await googleAuthApi({
      email: firebaseUser.email || '',
      fullName: firebaseUser.displayName || 'Google User',
      avatarUrl: firebaseUser.photoURL || undefined,
      googleId: firebaseUser.uid,
      accountType: options.accountType || 'buyer',
      buyerType: options.buyerType,
    });

    return { user: backendRes.user, firebaseUser };
  } catch (nativeErr: any) {
    console.warn('[Google Auth] Native sign-in error:', nativeErr);

    // If running in Expo Go without native build, provide clear explanation
    if (nativeErr.message?.includes('RNGoogleSignin') || nativeErr.message?.includes('null') || nativeErr.code === '12500') {
      throw new Error(
        'Google Play Services returned error (12500). Please ensure your SHA-1 is added in Firebase and you use a development build, or use direct Gmail sign-in below.'
      );
    }

    if (nativeErr.code === 'SIGN_IN_CANCELLED' || nativeErr.message?.includes('cancelled')) {
      throw new Error('Google sign-in was cancelled.');
    }

    throw nativeErr;
  }
}

/**
 * Direct real Gmail account sign-in via Firebase Auth
 * Supports signing in with any real Gmail credentials or creating a Firebase user for it
 */
export async function authenticateRealGmailWithFirebase(options: {
  email: string;
  password?: string;
  fullName?: string;
  accountType?: 'farmer' | 'buyer';
  buyerType?: string;
}): Promise<{ user: ApiUser; firebaseUser: any }> {
  const { email, password, fullName, accountType, buyerType } = options;

  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid Gmail address.');
  }

  let firebaseUser: any = null;

  // If password provided, authenticate through real Firebase Auth
  if (password) {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      firebaseUser = res.user;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // Create new user in Firebase Auth
        const newRes = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = newRes.user;
        if (fullName) {
          await updateProfile(firebaseUser, { displayName: fullName });
        }
      } else {
        throw err;
      }
    }
  }

  // Synchronize with Famora MongoDB backend
  const backendRes = await googleAuthApi({
    email,
    fullName: fullName || firebaseUser?.displayName || email.split('@')[0],
    avatarUrl: firebaseUser?.photoURL || undefined,
    googleId: firebaseUser?.uid || `google_${Date.now()}`,
    accountType: accountType || 'buyer',
    buyerType,
  });

  return { user: backendRes.user, firebaseUser };
}
