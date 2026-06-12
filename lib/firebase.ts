import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth, signInAnonymously } from "firebase/auth";

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
let appCheckPromise: Promise<void> | null = null;

export const initAppCheck = async () => {
  if (typeof window !== "undefined" && !appCheckPromise) {
    appCheckPromise = (async () => {
      const { initializeAppCheck, ReCaptchaV3Provider } =
        await import("firebase/app-check");
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
        ),
        isTokenAutoRefreshEnabled: true,
      });
    })();
  }
  return appCheckPromise;
};

export async function trackQuery<T>(
  label: string,
  queryFn: () => Promise<T>,
): Promise<T> {
  queryCount++;
  // console.log(
  //   `[Firebase Query] #${queryCount} | ${label} | Idő: ${new Date().toLocaleTimeString()}`,
  // );

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

export async function ensureAnonymousUser() {
  const authInstance = getAuth();
  if (!authInstance.currentUser) {
    const userCredential = await signInAnonymously(authInstance);
    return userCredential.user;
  }
  return authInstance.currentUser;
}

function initializeFirebase() {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

  let analytics;
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }

  db = getFirestore(app);
  storage = getStorage(app);
  authInstance = getAuth(app);
  return { app, db, storage, authInstance, analytics };
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
