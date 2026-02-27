import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  isFavorite,
} from "./firestore-db";
import { getAgentById, getUserByWallet } from "./firestore-db";

export const favoritesRouter = router({
  // Add favorite
  add: publicProcedure
    .input(z.object({
      userWallet: z.string(),
      agentId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Get user UID
      const user = await getUserByWallet(input.userWallet);
      if (!user) {
        throw new Error('User not found. Please connect your wallet first.');
      }

      const favorite = await addFavorite(user.uid, input.agentId);
      return { success: !!favorite, favorite };
    }),

  // Remove favorite
  remove: publicProcedure
    .input(z.object({
      userWallet: z.string(),
      agentId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Get user UID
      const user = await getUserByWallet(input.userWallet);
      if (!user) {
        throw new Error('User not found');
      }

      const success = await removeFavorite(user.uid, input.agentId);
      return { success };
    }),

  // Get user favorites
  getAll: publicProcedure
    .input(z.object({ userWallet: z.string() }))
    .query(async ({ input }) => {
      // Get user UID
      const user = await getUserByWallet(input.userWallet);
      if (!user) {
        return [];
      }

      const favorites = await getUserFavorites(user.uid);
      
      // Fetch agent details (denormalized data might be outdated)
      const favoritesWithAgents = await Promise.all(
        favorites.map(async (fav) => {
          const agent = await getAgentById(fav.agentId);
          return {
            ...fav,
            agent,
          };
        })
      );

      return favoritesWithAgents.filter(f => f.agent !== null);
    }),

  // Check if favorited
  isFavorited: publicProcedure
    .input(z.object({
      userWallet: z.string(),
      agentId: z.string(),
    }))
    .query(async ({ input }) => {
      // Get user UID
      const user = await getUserByWallet(input.userWallet);
      if (!user) {
        return { isFavorited: false };
      }

      const favorited = await isFavorite(user.uid, input.agentId);
      return { isFavorited: favorited };
    }),

  // Toggle favorite
  toggle: publicProcedure
    .input(z.object({
      userWallet: z.string(),
      agentId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Get user UID
      const user = await getUserByWallet(input.userWallet);
      if (!user) {
        throw new Error('User not found. Please connect your wallet first.');
      }

      const favorited = await isFavorite(user.uid, input.agentId);

      if (favorited) {
        await removeFavorite(user.uid, input.agentId);
        return { success: true, isFavorited: false };
      } else {
        await addFavorite(user.uid, input.agentId);
        return { success: true, isFavorited: true };
      }
    }),
});
