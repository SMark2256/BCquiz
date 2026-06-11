import { initializeApp, getApps, FirebaseApp } from "firebase/app";
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

// App Check + Analytics are the heaviest part of the Firebase bundle
// (reCAPTCHA alone adds 8+ long tasks on the main thread). They are NOT
// required for the first paint, so we load them lazily once the browser is
// idle. This keeps them out of the critical path and the initial JS bundle.
let deferredServicesStarted = false;

function startDeferredFirebaseServices(firebaseApp: FirebaseApp) {
  if (deferredServicesStarted || typeof window === "undefined") return;
  deferredServicesStarted = true;

  const run = async () => {
    try {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (siteKey) {
        const { initializeAppCheck, ReCaptchaV3Provider } = await import(
          "firebase/app-check"
        );
        initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      }

      if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
        const { getAnalytics, isSupported } = await import(
          "firebase/analytics"
        );
        if (await isSupported()) {
          getAnalytics(firebaseApp);
        }
      }
    } catch (error) {
      console.error("[Firebase] Deferred services failed to start:", error);
    }
  };

  const ric = (
    window as Window &
      typeof globalThis & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }
  ).requestIdleCallback;

  if (typeof ric === "function") {
    ric(run, { timeout: 3000 });
  } else {
    setTimeout(run, 1500);
  }
}

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

function initializeFirebase() {
  // Bail out cleanly when env vars are missing (e.g. build-time prerender
  // without secrets) instead of throwing and breaking the whole build.
  if (!isFirebaseConfigured()) {
    return {
      app: undefined as unknown as FirebaseApp,
      db: undefined as unknown as Firestore,
      storage: undefined as unknown as FirebaseStorage,
      authInstance: undefined as unknown as Auth,
    };
  }

  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

  db = getFirestore(app);
  storage = getStorage(app);
  authInstance = getAuth(app);

  // Kick off heavy, non-critical services after the page is interactive.
  startDeferredFirebaseServices(app);

  return { app, db, storage, authInstance };
}

// Export initialized instances
const firebase = initializeFirebase();
export const firebaseApp = firebase.app;
export const firestore = firebase.db;
export const firebaseStorage = firebase.storage;
export const auth = firebase.authInstance;

export default firebase;
