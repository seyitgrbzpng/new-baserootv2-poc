import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
} from "./firestore-db";
import { getFirestoreDb, COLLECTIONS } from "./firebase";
import { Timestamp } from "firebase-admin/firestore";

export const notificationsRouter = router({
  // Get user notifications
  getAll: publicProcedure
    .input(z.object({
      userId: z.string(),
      unreadOnly: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const db = getFirestoreDb();
      let query: any = db
        .collection(COLLECTIONS.NOTIFICATIONS)
        .where('userUid', '==', input.userId);
      
      if (input.unreadOnly) {
        query = query.where('read', '==', false);
      }
      
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      return snapshot.docs.map((doc: any) => doc.data());
    }),

  // Get unread count
  getUnreadCount: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const db = getFirestoreDb();
      const snapshot = await db
        .collection(COLLECTIONS.NOTIFICATIONS)
        .where('userUid', '==', input.userId)
        .where('read', '==', false)
        .get();
      
      return { count: snapshot.size };
    }),

  // Mark as read
  markAsRead: publicProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await markNotificationAsRead(input.notificationId);
      return { success };
    }),

  // Mark all as read
  markAllAsRead: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getFirestoreDb();
      const snapshot = await db
        .collection(COLLECTIONS.NOTIFICATIONS)
        .where('userUid', '==', input.userId)
        .where('read', '==', false)
        .get();
      
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: Timestamp.now(),
        });
      });
      
      await batch.commit();
      
      return { success: true, count: snapshot.size };
    }),

  // Delete notification
  delete: publicProcedure
    .input(z.object({
      notificationId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getFirestoreDb();
      const notifRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc(input.notificationId);
      
      // Verify ownership
      const doc = await notifRef.get();
      if (!doc.exists || doc.data()?.userUid !== input.userId) {
        return { success: false };
      }
      
      await notifRef.delete();
      return { success: true };
    }),

  // Delete all notifications
  deleteAll: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getFirestoreDb();
      const snapshot = await db
        .collection(COLLECTIONS.NOTIFICATIONS)
        .where('userUid', '==', input.userId)
        .get();
      
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      return { success: true, count: snapshot.size };
    }),
});

// Helper function to send notifications (used by other routers)
export async function sendNotification(params: {
  userId: string;
  type: 'payment' | 'agent_run' | 'review' | 'subscription' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await createNotification({
      userUid: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      agentId: params.data?.agentId as string | undefined,
      paymentId: params.data?.paymentId as string | undefined,
      reviewId: params.data?.reviewId as string | undefined,
      read: false,
    });
  } catch (error) {
    console.error('[Notifications] Failed to send notification:', error);
  }
}
