import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { FirestoreUser } from "../firestore-types";
import { getFirebaseAuth } from "../firebase";
import { getUserByUid } from "../firestore-db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  auth: { uid: string; claims: Record<string, unknown> } | null;
  user: FirestoreUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: FirestoreUser | null = null;
  let authInfo: { uid: string; claims: Record<string, unknown> } | null = null;

  try {
    // Get auth token from header
    const authHeader = opts.req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const auth = getFirebaseAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      if (decodedToken) {
        authInfo = { uid: decodedToken.uid, claims: (decodedToken as any) };
        user = await getUserByUid(decodedToken.uid);
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.warn('[Context] Auth failed:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    auth: authInfo,
    user,
  };
}
