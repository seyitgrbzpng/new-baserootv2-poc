import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createSubscription,
  getUserSubscriptions,
  updateSubscription,
  getUserByWallet,
} from "./firestore-db";
import { getFirestoreDb, COLLECTIONS } from "./firebase";
import { sendNotification } from "./notifications-router";
import { Timestamp } from "firebase-admin/firestore";

export const subscriptionsRouter = router({
  // Create subscription
  create: publicProcedure
    .input(z.object({
      userWallet: z.string(),
      agentId: z.string(),
      plan: z.enum(['basic', 'pro', 'enterprise']),
      pricePerMonth: z.number(),
      currency: z.string().default('SOL'),
      durationMonths: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      // Get user UID
      const user = await getUserByWallet(input.userWallet);
      if (!user) {
        throw new Error('User not found. Please connect your wallet first.');
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + input.durationMonths);

      const subscription = await createSubscription(
        user.uid,
        input.agentId,
        input.plan,
        input.pricePerMonth
      );

      // Send notification
      await sendNotification({
        userId: user.uid,
        type: 'subscription',
        title: 'Subscription Activated',
        message: `Your ${input.plan} subscription is now active`,
        data: { subscriptionId: subscription?.id, agentId: input.agentId },
      });

      return { success: !!subscription, subscription };
    }),

  // Get user subscriptions
  getAll: publicProcedure
    .input(z.object({ userWallet: z.string() }))
    .query(async ({ input }) => {
      // Get user UID
      const user = await getUserByWallet(input.userWallet);
      if (!user) {
        return [];
      }

      return await getUserSubscriptions(user.uid);
    }),

  // Cancel subscription
  cancel: publicProcedure
    .input(z.object({
      subscriptionId: z.string(),
      userWallet: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getFirestoreDb();
      const subRef = db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(input.subscriptionId);

      // Verify ownership
      const doc = await subRef.get();
      if (!doc.exists || doc.data()?.userWallet !== input.userWallet) {
        return { success: false };
      }

      await updateSubscription(input.subscriptionId, {
        status: 'cancelled',
      });

      return { success: true };
    }),

  // Check if subscription is active
  isActive: publicProcedure
    .input(z.object({
      userWallet: z.string(),
      agentId: z.string(),
    }))
    .query(async ({ input }) => {
      // Get user UID
      const user = await getUserByWallet(input.userWallet);
      if (!user) {
        return { isActive: false };
      }

      const db = getFirestoreDb();
      const now = Timestamp.now();

      const snapshot = await db
        .collection(COLLECTIONS.SUBSCRIPTIONS)
        .where('userUid', '==', user.uid)
        .where('agentId', '==', input.agentId)
        .where('status', '==', 'active')
        .where('endDate', '>', now)
        .limit(1)
        .get();

      return { isActive: !snapshot.empty };
    }),
});
