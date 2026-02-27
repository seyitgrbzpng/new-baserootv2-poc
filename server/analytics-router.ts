import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createAnalyticsEvent,
  getAgentById,
  getAgents,
  getPaymentsByWallet,
} from "./firestore-db";
import { getFirestoreDb, COLLECTIONS } from "./firebase";

export const analyticsRouter = router({
  // Track an event
  track: publicProcedure
    .input(z.object({
      agentId: z.string(),
      eventType: z.enum(['view', 'click', 'use', 'error', 'payment']),
      userWallet: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      await createAnalyticsEvent({
        agentId: input.agentId,
        eventType: input.eventType,
        userWallet: input.userWallet,
        metadata: input.metadata,
      });
      return { success: true };
    }),

  // Get agent analytics
  getAgentStats: publicProcedure
    .input(z.object({
      agentId: z.string(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const agent = await getAgentById(input.agentId);

      if (!agent) {
        return {
          totalViews: 0,
          totalClicks: 0,
          totalUses: 0,
          totalErrors: 0,
          successRate: 0,
          rating: 0,
        };
      }

      // Get analytics events from Firestore
      const db = getFirestoreDb();
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);

      const snapshot = await db
        .collection(COLLECTIONS.ANALYTICS_EVENTS)
        .where('agentId', '==', input.agentId)
        .where('createdAt', '>=', daysAgo)
        .get();

      const events = snapshot.docs.map((doc: any) => doc.data());

      return {
        totalViews: events.filter(e => e.eventType === 'view').length,
        totalClicks: events.filter(e => e.eventType === 'click').length,
        totalUses: agent.totalUses || 0,
        totalErrors: events.filter(e => e.eventType === 'error').length,
        successRate: agent.successRate || 0,
        rating: agent.rating || 0,
      };
    }),

  // Get creator analytics
  getCreatorStats: publicProcedure
    .input(z.object({
      walletAddress: z.string(),
    }))
    .query(async ({ input }) => {
      const agents = await getAgents({ creatorWallet: input.walletAddress });
      const payments = await getPaymentsByWallet(input.walletAddress);

      const totalRevenue = payments
        .filter(p => p.toWallet === input.walletAddress)
        .reduce((sum, p) => sum + (p.creatorAmount || 0), 0);

      const totalUses = agents.reduce((sum, a) => sum + (a.totalUses || 0), 0);

      return {
        totalAgents: agents.length,
        totalUses,
        totalRevenue,
        averageRating: agents.length > 0
          ? agents.reduce((sum, a) => sum + (a.rating || 0), 0) / agents.length
          : 0,
      };
    }),

  // Get platform analytics (admin only)
  getPlatformStats: publicProcedure
    .query(async () => {
      const agents = await getAgents({});
      const db = getFirestoreDb();

      // Get total payments
      const paymentsSnapshot = await db.collection(COLLECTIONS.PAYMENTS).get();
      const payments = paymentsSnapshot.docs.map((doc: any) => doc.data());

      const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const platformRevenue = payments.reduce((sum, p) => sum + (p.platformFee || 0), 0);

      // Get total users
      const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();

      return {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'active').length,
        totalUsers: usersSnapshot.size,
        totalPayments: payments.length,
        totalRevenue,
        platformRevenue,
      };
    }),
});
