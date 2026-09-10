import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const env = (import.meta as any).env || {};

export const firebaseConfig: FirebaseClientConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// Check if valid Firebase credentials are provided
export const isFirebaseConfigured = (): boolean => {
  const apiKey = firebaseConfig.apiKey;
  const projectId = firebaseConfig.projectId;
  return Boolean(
    apiKey &&
    projectId &&
    apiKey !== 'YOUR_FIREBASE_API_KEY' &&
    !apiKey.includes('YOUR_') &&
    projectId !== 'YOUR_PROJECT_ID' &&
    !projectId.includes('YOUR_')
  );
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('Firebase initialization warning:', error);
  }
} else {
  console.info('Running in Local Storage / Preview Mode. Add your Firebase keys in .env to connect to live Firebase.');
}

export { app, db, auth, storage };
