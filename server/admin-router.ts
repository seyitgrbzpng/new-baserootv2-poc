import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createOrUpdateUser, getUserByUid, createAdminAuditEvent } from "./firestore-db";
import { getFirebaseAuth } from "./firebase";
import { rateLimitByIP, checkRateLimit } from "./rateLimit";

/**
 * Admin / role management router.
 *
 * Authorization:
 * - Preferred: caller is authenticated and has role=admin in Firestore user doc.
 * - Bootstrap: allow using x-admin-secret header matching ADMIN_BOOTSTRAP_SECRET to set the first admin.
 *
 * Notes:
 * - Firestore rules prevent clients from editing role directly; roles must be set via server.
 * - We also set Firebase custom claims for convenience (optional, but useful for future).
 */
export const adminRouter = router({
  setUserRole: publicProcedure
    .input(z.object({
      uid: z.string().min(1),
      role: z.enum(["user", "creator", "admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Rate limit privileged actions
      const ip = (ctx.req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
      if (ctx.user?.uid) {
        checkRateLimit(ctx.user.uid, 'admin');
      } else {
        rateLimitByIP(ip, 'admin');
      }

      const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
      const providedSecret = (ctx.req.headers["x-admin-secret"] as string | undefined) ?? undefined;

      const isBootstrap = Boolean(bootstrapSecret && providedSecret && providedSecret === bootstrapSecret);
      const isAdminCaller = Boolean(ctx.user && ctx.user.role === "admin");

      if (!isBootstrap && !isAdminCaller) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bu işlem için admin yetkisi gerekir.",
        });
      }

      // Ensure target user exists (or create minimal doc if needed)
      const existing = await getUserByUid(input.uid);
      if (!existing) {
        await createOrUpdateUser(input.uid, { role: input.role } as any);
      } else {
        await createOrUpdateUser(input.uid, { role: input.role } as any);
      }

      // Set Firebase custom claims (optional but recommended)
      const auth = getFirebaseAuth();
      const claims: Record<string, boolean> = {
        admin: input.role === "admin",
        creator: input.role === "creator" || input.role === "admin",
      };

      try {
        await auth.setCustomUserClaims(input.uid, claims);
      } catch (e) {
        // If emulator or permissions issues, don't block role write to Firestore.
        console.warn("[Admin] setCustomUserClaims failed:", e);
      }

      // Audit log
      await createAdminAuditEvent({
        action: 'set_user_role',
        actorUid: ctx.user?.uid,
        actorRole: ctx.user?.role,
        targetUid: input.uid,
        metadata: { role: input.role, isBootstrap },
        ip,
        userAgent: ctx.req.headers['user-agent'] as string | undefined,
      });

      return { success: true, uid: input.uid, role: input.role, claims } as const;
    }),
});
