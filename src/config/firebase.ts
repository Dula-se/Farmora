import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-expect-error - Metro bundler resolves the React Native entry point which exports getReactNativePersistence
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config derived from google-services.json
// project_id: farmora-86c19
// mobilesdk_app_id: 1:833570480620:android:8d2d778dfa9afe8b3be0c9
const firebaseConfig = {
  apiKey: 'AIzaSyDxQ3lY36eCwOmrLYHV02xq8V9alBWUkXI',
  authDomain: 'farmora-86c19.firebaseapp.com',
  projectId: 'farmora-86c19',
  storageBucket: 'farmora-86c19.firebasestorage.app',
  messagingSenderId: '833570480620',
  appId: '1:833570480620:android:8d2d778dfa9afe8b3be0c9',
};

// Avoid re-initializing on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence to avoid React Native warning
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // If already initialized on hot reload, fall back to getAuth
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
