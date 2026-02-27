import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createAgentVersion,
  getAgentVersions,
  getAgentById,
} from "./firestore-db";
import { getFirestoreDb, COLLECTIONS } from "./firebase";
import { sendNotification } from "./notifications-router";

export const versioningRouter = router({
  // Create new version
  create: publicProcedure
    .input(z.object({
      agentId: z.string(),
      version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g., 1.0.0)'),
      changelog: z.string().min(10),
      endpointUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const version = await createAgentVersion({
        agentId: input.agentId,
        version: input.version,
        changelog: input.changelog,
        endpointUrl: input.endpointUrl,
        deprecated: false,
      });

      // Notify agent creator
      const agent = await getAgentById(input.agentId);
      if (agent) {
        await sendNotification({
          userId: agent.creatorUid,
          type: 'agent_run',
          title: 'New Agent Version',
          message: `Version ${input.version} of ${agent.name} has been created`,
          data: { agentId: input.agentId, version: input.version },
        });
      }

      return { success: !!version, version };
    }),

  // Get all versions
  getAll: publicProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      return getAgentVersions(input.agentId);
    }),

  // Get latest version
  getLatest: publicProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      const versions = await getAgentVersions(input.agentId);
      return versions.length > 0 ? versions[0] : null;
    }),

  // Deprecate version
  deprecate: publicProcedure
    .input(z.object({
      versionId: z.string(),
      agentId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getFirestoreDb();
      const versionRef = db.collection(COLLECTIONS.AGENT_VERSIONS).doc(input.versionId);
      
      // Verify it belongs to the agent
      const doc = await versionRef.get();
      if (!doc.exists || doc.data()?.agentId !== input.agentId) {
        return { success: false };
      }

      await versionRef.update({ deprecated: true });
      return { success: true };
    }),

  // Get version by number
  getByVersion: publicProcedure
    .input(z.object({
      agentId: z.string(),
      version: z.string(),
    }))
    .query(async ({ input }) => {
      const db = getFirestoreDb();
      const snapshot = await db
        .collection(COLLECTIONS.AGENT_VERSIONS)
        .where('agentId', '==', input.agentId)
        .where('version', '==', input.version)
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      return snapshot.docs[0].data();
    }),
});
