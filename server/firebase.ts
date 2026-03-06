import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
export function initializeFirebase(): App {
  if (app) return app;

  try {
    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      return app;
    }

    // Initialize with service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      // Fix potential newline issues in private_key when loaded from .env
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Direct environment variables (Ideal for Render/Vercel)
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    } else {
      // For local development with emulator
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'baserootio',
      });
    }

    console.log('[Firebase] Successfully initialized');
    return app;
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    throw error;
  }
}

/**
 * Get Firestore instance
 */
export function getFirestoreDb(): Firestore {
  if (!db) {
    initializeFirebase();
    db = getFirestore();

    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

    // Use emulator if configured
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      console.log('[Firestore] Using emulator:', process.env.FIRESTORE_EMULATOR_HOST);
    }
  }
  return db;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase();
    auth = getAuth();

    // Use emulator if configured
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      console.log('[Firebase Auth] Using emulator:', process.env.FIREBASE_AUTH_EMULATOR_HOST);
    }
  }
  return auth;
}

// Collection references
export const COLLECTIONS = {
  USERS: 'avax_users',
  AGENTS: 'avax_agents',
  PAYMENTS: 'avax_payments',
  AGENT_RUNS: 'avax_agent_runs',
  REVIEWS: 'avax_reviews',
  NOTIFICATIONS: 'avax_notifications',
  FAVORITES: 'avax_favorites',
  SUBSCRIPTIONS: 'avax_subscriptions',
  AGENT_VERSIONS: 'avax_agent_versions',
  ANALYTICS_EVENTS: 'avax_analytics_events',
  SEARCH_FILTERS: 'avax_search_filters',
  MULTICHAIN_WALLETS: 'avax_multichain_wallets',
  ADMIN_AUDIT: 'avax_admin_audit',
  DATASETS: 'avax_datasets', // V2 NEW
  INFERENCES: 'avax_inferences', // ChainGPT PoC
  LEDGER_ENTRIES: 'avax_ledger_entries', // ChainGPT PoC
  EVENTS: 'avax_events', // Webhook dedup
  DAO_POLICIES: 'avax_dao_policies', // Per-DAO split policies
} as const;

// Helper to get collection reference
export function getCollection(collectionName: string) {
  return getFirestoreDb().collection(collectionName);
}
