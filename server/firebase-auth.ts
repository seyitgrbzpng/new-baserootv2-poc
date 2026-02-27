import { getFirebaseAuth } from './firebase';
import { createOrUpdateUser, getUserByWallet } from './firestore-db';
import { verifyMessage } from 'viem';

/**
 * Firebase Auth Integration for Wallet-Based Authentication
 * Replaces MySQL/Drizzle user management
 */

export interface WalletAuthResult {
  uid: string;
  walletAddress: string;
  customToken: string;
  isNewUser: boolean;
}

export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const valid = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    return valid;
  } catch (error) {
    console.error('[Firebase Auth] Signature verification failed:', error);
    return false;
  }
}

/**
 * Authenticate user with EVM wallet
 * Creates Firebase custom token for wallet-based auth
 */
export async function authenticateWithWallet(
  walletAddress: string,
  signature: string,
  message: string
): Promise<WalletAuthResult | null> {
  // Verify signature
  const isValid = await verifyWalletSignature(walletAddress, signature, message);
  if (!isValid) {
    console.error('[Firebase Auth] Invalid wallet signature');
    return null;
  }

  const auth = getFirebaseAuth();

  try {
    // Check if user exists in Firestore
    let user = await getUserByWallet(walletAddress);
    let isNewUser = false;

    if (!user) {
      // Create new user in Firestore
      const uid = `wallet_${walletAddress}`;
      user = await createOrUpdateUser(uid, {
        walletAddress,
        loginMethod: 'wallet',
        role: 'user',
        lastSignedIn: undefined, // Will be set by createOrUpdateUser
      } as any);
      isNewUser = true;

      console.log('[Firebase Auth] Created new wallet user:', walletAddress);
    } else {
      // Update last signed in
      await createOrUpdateUser(user.uid, {
        lastSignedIn: undefined, // Will be set by createOrUpdateUser
      } as any);
    }

    // Create custom token for Firebase Auth
    const customToken = await auth.createCustomToken(user.uid, {
      walletAddress,
      loginMethod: 'wallet',
    });

    return {
      uid: user.uid,
      walletAddress,
      customToken,
      isNewUser,
    };
  } catch (error) {
    console.error('[Firebase Auth] Wallet authentication failed:', error);
    return null;
  }
}

/**
 * Authenticate user with OAuth (email, Google, GitHub)
 * For users who don't have a wallet
 */
export async function authenticateWithOAuth(
  email: string,
  name?: string,
  provider?: string
): Promise<WalletAuthResult | null> {
  const auth = getFirebaseAuth();

  try {
    // Check if user exists by email
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
    } catch (error) {
      // User doesn't exist, create new one
      firebaseUser = await auth.createUser({
        email,
        displayName: name,
        emailVerified: true,
      });

      console.log('[Firebase Auth] Created new OAuth user:', email);
    }

    // Create or update user in Firestore
    await createOrUpdateUser(firebaseUser.uid, {
      email,
      username: name,
      loginMethod: (provider as any) || 'email',
      role: 'user',
      lastSignedIn: undefined,
    } as any);

    // Create custom token
    const customToken = await auth.createCustomToken(firebaseUser.uid, {
      email,
      loginMethod: provider || 'email',
    });

    return {
      uid: firebaseUser.uid,
      walletAddress: '', // No wallet for OAuth users
      customToken,
      isNewUser: false,
    };
  } catch (error) {
    console.error('[Firebase Auth] OAuth authentication failed:', error);
    return null;
  }
}

/**
 * Verify Firebase ID token
 * Used to authenticate requests
 */
export async function verifyIdToken(idToken: string): Promise<any> {
  const auth = getFirebaseAuth();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('[Firebase Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Get user by UID
 */
export async function getFirebaseUser(uid: string) {
  const auth = getFirebaseAuth();

  try {
    return await auth.getUser(uid);
  } catch (error) {
    console.error('[Firebase Auth] Failed to get user:', error);
    return null;
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  uid: string,
  role: 'user' | 'creator' | 'admin'
): Promise<boolean> {
  try {
    await createOrUpdateUser(uid, { role } as any);

    // Set custom claims for role-based access
    const auth = getFirebaseAuth();
    await auth.setCustomUserClaims(uid, { role });

    return true;
  } catch (error) {
    console.error('[Firebase Auth] Failed to update user role:', error);
    return false;
  }
}

/**
 * Link wallet to existing OAuth user
 */
export async function linkWalletToUser(
  uid: string,
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  // Verify signature
  const isValid = await verifyWalletSignature(walletAddress, signature, message);
  if (!isValid) {
    console.error('[Firebase Auth] Invalid wallet signature for linking');
    return false;
  }

  try {
    // Check if wallet is already linked to another user
    const existingUser = await getUserByWallet(walletAddress);
    if (existingUser && existingUser.uid !== uid) {
      console.error('[Firebase Auth] Wallet already linked to another user');
      return false;
    }

    // Update user with wallet address
    await createOrUpdateUser(uid, {
      walletAddress,
    } as any);

    console.log('[Firebase Auth] Wallet linked to user:', uid);
    return true;
  } catch (error) {
    console.error('[Firebase Auth] Failed to link wallet:', error);
    return false;
  }
}

/**
 * Generate authentication message for wallet signing
 */
export function generateAuthMessage(walletAddress: string): string {
  const timestamp = Date.now();
  return `Sign this message to authenticate with Baseroot.io\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
}

/**
 * Validate authentication message timestamp
 * Prevents replay attacks
 */
export function validateAuthMessageTimestamp(message: string): boolean {
  try {
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (!timestampMatch) return false;

    const timestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Message must be signed within last 5 minutes
    return now - timestamp < fiveMinutes;
  } catch (error) {
    return false;
  }
}
