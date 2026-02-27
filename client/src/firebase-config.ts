// Firebase client-side configuration
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

/**
 * Client Firebase config must come from Vite env vars.
 * Define these in .env (local) and in Vercel project env vars:
 *  - VITE_FIREBASE_API_KEY
 *  - VITE_FIREBASE_AUTH_DOMAIN
 *  - VITE_FIREBASE_PROJECT_ID
 *  - VITE_FIREBASE_STORAGE_BUCKET
 *  - VITE_FIREBASE_MESSAGING_SENDER_ID
 *  - VITE_FIREBASE_APP_ID
 *  - VITE_FIREBASE_MEASUREMENT_ID (optional)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Basic runtime validation (helps avoid silent misconfig in deploys)
const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
] as const;

for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    // eslint-disable-next-line no-console
    console.error(`[Firebase] Missing Vite env: VITE_FIREBASE_${key.toUpperCase()}`);
  }
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in browser and only if supported)
export const analytics = (async () => {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.measurementId) return null;
  const supported = await isAnalyticsSupported().catch(() => false);
  return supported ? getAnalytics(app) : null;
})();

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  // eslint-disable-next-line no-console
  console.log("[Firebase] Connecting to emulators...");
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}

