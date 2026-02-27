import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createPaymentCredit,
  getAvailableCredits,
  usePaymentCredit,
  getUserCredits,
  getUserCreditStats,
  expireOldCredits,
} from "./payment-credits";

// Firestore indexes are managed via firestore.indexes.json

export const paymentCreditsRouter = router({
  // Get available credits for current user
  getAvailable: publicProcedure
    .input(z.object({
      walletAddress: z.string(),
      agentId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await getAvailableCredits(input.walletAddress, input.agentId);
    }),

  // Get all credits for user (dashboard)
  getAll: publicProcedure
    .input(z.object({
      walletAddress: z.string(),
    }))
    .query(async ({ input }) => {
      return await getUserCredits(input.walletAddress);
    }),

  // Get credit statistics
  getStats: publicProcedure
    .input(z.object({
      walletAddress: z.string(),
    }))
    .query(async ({ input }) => {
      return await getUserCreditStats(input.walletAddress);
    }),

  // Use a credit (called when user actually uses the agent)
  use: publicProcedure
    .input(z.object({
      creditId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const success = await usePaymentCredit(input.creditId);
      
      if (!success) {
        throw new Error('Failed to use credit. Credit may have already been used or does not exist.');
      }

      return {
        success: true,
        message: 'Credit used successfully',
      };
    }),

  // Check if user has available credit for an agent
  hasCredit: publicProcedure
    .input(z.object({
      walletAddress: z.string(),
      agentId: z.string(),
    }))
    .query(async ({ input }) => {
      const credits = await getAvailableCredits(input.walletAddress, input.agentId);
      return {
        hasCredit: credits.length > 0,
        creditCount: credits.length,
        credits: credits.slice(0, 1), // Return first available credit
      };
    }),

  // Admin: Expire old credits
  expireOld: publicProcedure
    .mutation(async () => {
      const count = await expireOldCredits();
      return {
        success: true,
        expiredCount: count,
      };
    }),
});
