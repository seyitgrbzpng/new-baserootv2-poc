import { getFirestoreDb, COLLECTIONS } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';

// Payment Credit - Kullanıcının ödeme yaptığı ancak henüz kullanmadığı agent kullanım hakkı
export interface PaymentCredit {
  id?: string;
  userId: string; // Wallet address or Firebase UID
  agentId: string;
  agentName: string;
  paymentId: string; // İlgili payment kaydı
  txSignature: string;
  amountPaid: number;
  currency: string;
  status: 'available' | 'used' | 'expired' | 'refunded';
  usedAt?: Timestamp;
  expiresAt?: Timestamp; // Opsiyonel: Kredinin son kullanma tarihi
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection name
const PAYMENT_CREDITS_COLLECTION = 'avax_payment_credits';

// Create payment credit after successful payment
export async function createPaymentCredit(credit: Omit<PaymentCredit, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentCredit | null> {
  try {
    const db = getFirestoreDb();
    const now = Timestamp.now();

    const newCredit: Omit<PaymentCredit, 'id'> = {
      ...credit,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(PAYMENT_CREDITS_COLLECTION).add(newCredit);
    return { ...newCredit, id: docRef.id };
  } catch (error) {
    console.error('[PaymentCredits] Error creating credit:', error);
    return null;
  }
}

// Get available credits for a user and agent
export async function getAvailableCredits(userId: string, agentId?: string): Promise<PaymentCredit[]> {
  try {
    const db = getFirestoreDb();
    let query: any = db
      .collection(PAYMENT_CREDITS_COLLECTION)
      .where('userId', '==', userId)
      .where('status', '==', 'available');

    if (agentId) {
      query = query.where('agentId', '==', agentId);
    }

    const snapshot = await query.orderBy('createdAt', 'asc').get();

    const now = Timestamp.now();
    const credits: PaymentCredit[] = [];

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      // Süresi dolmamış kredileri filtrele
      if (!data.expiresAt || data.expiresAt.toMillis() > now.toMillis()) {
        credits.push({ ...data, id: doc.id });
      }
    });

    return credits;
  } catch (error) {
    console.error('[PaymentCredits] Error getting available credits:', error);
    return [];
  }
}

// Use a payment credit
export async function usePaymentCredit(creditId: string): Promise<boolean> {
  try {
    const db = getFirestoreDb();
    const docRef = db.collection(PAYMENT_CREDITS_COLLECTION).doc(creditId);

    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.status !== 'available') {
      return false;
    }

    await docRef.update({
      status: 'used',
      usedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error('[PaymentCredits] Error using credit:', error);
    return false;
  }
}

// Get all credits for a user (for dashboard)
export async function getUserCredits(userId: string): Promise<PaymentCredit[]> {
  try {
    const db = getFirestoreDb();
    const snapshot = await db
      .collection(PAYMENT_CREDITS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error('[PaymentCredits] Error getting user credits:', error);
    return [];
  }
}

// Get credit statistics for a user
export async function getUserCreditStats(userId: string): Promise<{
  available: number;
  used: number;
  expired: number;
  totalValue: number;
}> {
  try {
    const credits = await getUserCredits(userId);

    const stats = {
      available: credits.filter(c => c.status === 'available').length,
      used: credits.filter(c => c.status === 'used').length,
      expired: credits.filter(c => c.status === 'expired').length,
      totalValue: credits
        .filter(c => c.status === 'available')
        .reduce((sum, c) => sum + c.amountPaid, 0),
    };

    return stats;
  } catch (error) {
    console.error('[PaymentCredits] Error getting credit stats:', error);
    return { available: 0, used: 0, expired: 0, totalValue: 0 };
  }
}

// Expire old credits (can be run as a cron job)
export async function expireOldCredits(): Promise<number> {
  try {
    const db = getFirestoreDb();
    const now = Timestamp.now();

    const snapshot = await db
      .collection(PAYMENT_CREDITS_COLLECTION)
      .where('status', '==', 'available')
      .where('expiresAt', '<', now)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: now,
      });
    });

    await batch.commit();

    if (snapshot.size > 0) {
      console.log(`[PaymentCredits] Expired ${snapshot.size} old credits`);
    }

    return snapshot.size;
  } catch (error) {
    console.error('[PaymentCredits] Error expiring old credits:', error);
    return 0;
  }
}
