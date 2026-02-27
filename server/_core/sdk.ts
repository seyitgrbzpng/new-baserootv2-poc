/**
 * Firebase Migration Note:
 * This SDK was previously used for Manus OAuth.
 * Authentication is now handled via Firebase Auth in context.ts.
 * This file is kept for backward compatibility but is mostly deprecated.
 */

import type { Request } from "express";
import type { FirestoreUser } from "../firestore-types";
import { getFirebaseAuth } from "../firebase";
import { getUserByUid } from "../firestore-db";

class SDKServer {
  /**
   * Authenticate request using Firebase Auth
   */
  async authenticateRequest(req: Request): Promise<FirestoreUser | null> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const auth = getFirebaseAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      if (!decodedToken) return null;

      return await getUserByUid(decodedToken.uid);
    } catch (error) {
      console.error("[SDK] Auth failed:", error);
      return null;
    }
  }
}

export const sdk = new SDKServer();
