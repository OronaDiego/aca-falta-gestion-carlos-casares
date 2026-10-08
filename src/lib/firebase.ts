import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * Sin credenciales de Firebase la app arranca en "modo demo": usa datos de ejemplo
 * guardados en el navegador. Sirve para desarrollar el diseño sin tocar la base real.
 */
export const isDemoMode = !firebaseConfig.projectId || !firebaseConfig.apiKey;

let db: Firestore | null = null;

export function getDb(): Firestore {
  if (isDemoMode) throw new Error('Firebase no está configurado (modo demo).');
  if (db) return db;
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    // Caché persistente: la app sigue mostrando reclamos aunque se corte la señal.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    db = getFirestore(app);
  }
  return db;
}
