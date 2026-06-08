import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

// Firebase configuration - these should be set in environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if it hasn't been initialized yet
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let authInstance: Auth;
let queryCount = 0;

export async function trackQuery<T>(
  label: string,
  queryFn: () => Promise<T>,
): Promise<T> {
  queryCount++;
  console.log(
    `[Firebase Query] #${queryCount} | ${label} | Idő: ${new Date().toLocaleTimeString()}`,
  );

  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    console.error(`[Firebase Error] #${queryCount} | ${label}:`, error);
    throw error;
  }
}

export const resetQueryCount = () => {
  queryCount = 0;
};

function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  storage = getStorage(app);
  authInstance = getAuth(app);
  return { app, db, storage, authInstance };
}

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

// Export initialized instances
const firebase = initializeFirebase();
export const firebaseApp = firebase.app;
export const firestore = firebase.db;
export const firebaseStorage = firebase.storage;
export const auth = firebase.authInstance;

export default firebase;
