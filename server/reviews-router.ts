import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createReview,
  getReviewsByAgent,
  getAgentById,
  updateAgent,
  getUserByWallet,
  updateAgentRating,
} from "./firestore-db";
import { getFirestoreDb, COLLECTIONS } from "./firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

import { verifyWalletSignature } from "./firebase-auth";

export const reviewsRouter = router({
  // Create a new review
  create: publicProcedure
    .input(z.object({
      agentId: z.string(),
      userWallet: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().min(10).max(1000),
      signature: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Verify signature
      const isValid = verifyWalletSignature(input.userWallet, input.signature, input.message);
      if (!isValid) {
        throw new Error('Invalid wallet signature. Please reject the transaction and try again.');
      }

      // Get user info
      const user = await getUserByWallet(input.userWallet);
      if (!user) {
        throw new Error('User not found. Please connect your wallet first.');
      }

      // Get agent info
      const agent = await getAgentById(input.agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // (Removed: Duplicate review check to allow multiple reviews)

      // Check if user has actually used the agent (retroactive check)
      // We check both AGENT_RUNS (execution) and PAYMENTS (purchase)
      const db = getFirestoreDb();
      const runsQuery = await db
        .collection(COLLECTIONS.AGENT_RUNS)
        .where('agentId', '==', input.agentId)
        .where('userWallet', '==', input.userWallet)
        .limit(1)
        .get();

      const paymentsQuery = await db
        .collection(COLLECTIONS.PAYMENTS)
        .where('agentId', '==', input.agentId)
        .where('fromWallet', '==', input.userWallet)
        .where('status', '==', 'completed')
        .limit(1)
        .get();

      const hasUsed = !runsQuery.empty || !paymentsQuery.empty;

      if (!hasUsed) {
        throw new Error('You need to use or rent this agent before you can review it.');
      }

      // Create review
      const review = await createReview({
        agentId: input.agentId,
        agentName: agent.name,
        userUid: user.uid,
        userWallet: input.userWallet,
        username: user.username,
        rating: input.rating,
        comment: input.comment,
        verified: true,
      });

      // Update agent average rating
      await updateAgentRating(input.agentId);

      return {
        success: true,
        review,
      };
    }),

  // Get reviews for an agent
  getByAgent: publicProcedure
    .input(z.object({
      agentId: z.string(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const reviews = await getReviewsByAgent(input.agentId);
      return reviews.slice(0, input.limit);
    }),

  // Get average rating for an agent
  getAverageRating: publicProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      const agent = await getAgentById(input.agentId);
      if (!agent) {
        return { average: 0, count: 0 };
      }

      return {
        average: agent.rating,
        count: agent.ratingCount,
      };
    }),

  // Update review helpfulness (not implemented in Firestore types yet)
  markHelpful: publicProcedure
    .input(z.object({
      reviewId: z.string(),
      helpful: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Add helpful/notHelpful fields to Firestore review schema
      const db = getFirestoreDb();
      const reviewRef = db.collection(COLLECTIONS.REVIEWS).doc(input.reviewId);

      const field = input.helpful ? 'helpful' : 'notHelpful';

      try {
        await reviewRef.update({
          [field]: FieldValue.increment(1),
        });
        return { success: true };
      } catch (error) {
        console.error('[Reviews] Failed to mark helpful:', error);
        return { success: false };
      }
    }),

  // Update a review
  update: publicProcedure
    .input(z.object({
      reviewId: z.string(),
      userWallet: z.string(),
      rating: z.number().min(1).max(5).optional(),
      comment: z.string().min(10).max(1000).optional(),
      signature: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Verify signature
      const isValid = verifyWalletSignature(input.userWallet, input.signature, input.message);
      if (!isValid) {
        throw new Error('Invalid wallet signature. Please reject the transaction and try again.');
      }

      const db = getFirestoreDb();
      const reviewRef = db.collection(COLLECTIONS.REVIEWS).doc(input.reviewId);

      // Get review to verify ownership
      const reviewDoc = await reviewRef.get();
      if (!reviewDoc.exists) {
        throw new Error('Review not found');
      }

      const reviewData = reviewDoc.data(); // Removed `as FirestoreReview` as type is not provided
      if (reviewData?.userWallet !== input.userWallet) {
        throw new Error('You are not the owner of this review');
      }

      // Update review
      const updateData: any = {
        updatedAt: Timestamp.now(),
      };
      if (input.rating !== undefined) updateData.rating = input.rating;
      if (input.comment !== undefined) updateData.comment = input.comment;

      await reviewRef.update(updateData);

      // Update agent average rating if rating changed
      if (input.rating !== undefined) {
        await updateAgentRating(reviewData.agentId);
      }

      return { success: true };
    }),

  // Delete a review
  delete: publicProcedure
    .input(z.object({
      reviewId: z.string(),
      userWallet: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getFirestoreDb();
      const reviewRef = db.collection(COLLECTIONS.REVIEWS).doc(input.reviewId);

      // Get review to verify ownership
      const reviewDoc = await reviewRef.get();
      if (!reviewDoc.exists) {
        throw new Error('Review not found');
      }

      const reviewData = reviewDoc.data();
      if (reviewData?.userWallet !== input.userWallet) {
        throw new Error('You are not the owner of this review');
      }

      const agentId = reviewData.agentId;

      // Delete review
      await reviewRef.delete();

      // Update agent average rating
      await updateAgentRating(agentId);

      return { success: true };
    }),

  // Get user's reviews
  getByUser: publicProcedure
    .input(z.object({ userWallet: z.string() }))
    .query(async ({ input }) => {
      const db = getFirestoreDb();
      const snapshot = await db
        .collection(COLLECTIONS.REVIEWS)
        .where('userWallet', '==', input.userWallet)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data());
    }),
});
