import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getFirestoreDb, COLLECTIONS } from './firebase';
import {
  FirestoreUser,
  FirestoreAgent,
  FirestorePayment,
  FirestoreAgentRun,
  FirestoreReview,
  FirestoreNotification,
  FirestoreFavorite,
  FirestoreSubscription,
  FirestoreDataset,
  CreateFirestoreAgent,
  CreateFirestoreDataset,
  CreateFirestorePayment,
  CreateFirestoreAgentRun,
  CreateFirestoreReview,
  CreateFirestoreNotification,
} from './firestore-types';

/**
 * Firestore Database Operations
 * Replaces MongoDB operations with Firebase-native queries
 */

// ============================================================================
// User Operations
// ============================================================================

export async function createOrUpdateUser(
  uid: string,
  data: Partial<FirestoreUser>
): Promise<FirestoreUser> {
  const db = getFirestoreDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(uid);

  const now = Timestamp.now();
  const userData: Partial<FirestoreUser> = {
    ...data,
    uid,
    updatedAt: now,
  };


  // Convention: callers may pass `lastSignedIn: undefined` to indicate 'set to now'
  if (Object.prototype.hasOwnProperty.call(data, 'lastSignedIn')) {
    userData.lastSignedIn = now;
  }

  const existingUser = await userRef.get();

  if (!existingUser.exists) {
    userData.createdAt = now;
    userData.totalSpent = 0;
    userData.totalEarned = 0;
    userData.role = data.role || 'user';
  }

  await userRef.set(userData, { merge: true });

  const updated = await userRef.get();
  return updated.data() as FirestoreUser;
}

export async function getUserByUid(uid: string): Promise<FirestoreUser | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  return doc.exists ? (doc.data() as FirestoreUser) : null;
}

export async function getUserByWallet(walletAddress: string): Promise<FirestoreUser | null> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.USERS)
    .where('walletAddress', '==', walletAddress)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as FirestoreUser;
}

export async function updateUserStats(
  uid: string,
  spent?: number,
  earned?: number
): Promise<void> {
  const db = getFirestoreDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(uid);

  const updates: any = {
    updatedAt: Timestamp.now(),
  };

  if (spent !== undefined) {
    updates.totalSpent = FieldValue.increment(spent);
  }

  if (earned !== undefined) {
    updates.totalEarned = FieldValue.increment(earned);
  }

  await userRef.update(updates);
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generates an array of keywords for searching.
 * Limited to first 10 keywords to stay within Firestore limits or reasonable size.
 */
function generateSearchKeywords(name: string, tags: string[] = []): string[] {
  const keywords = new Set<string>();

  // Normalize and split name
  const nameParts = name.toLowerCase().split(/[\s_-]+/).filter(p => p.length > 1);
  nameParts.forEach(p => keywords.add(p));

  // Add tags
  tags.forEach(t => keywords.add(t.toLowerCase()));

  return Array.from(keywords).slice(0, 20);
}

// ============================================================================
// Agent Operations
// ============================================================================

export async function createAgent(
  data: CreateFirestoreAgent
): Promise<FirestoreAgent> {
  const db = getFirestoreDb();
  const agentRef = data.id
    ? db.collection(COLLECTIONS.AGENTS).doc(data.id)
    : db.collection(COLLECTIONS.AGENTS).doc();

  const now = Timestamp.now();
  const agent: FirestoreAgent = {
    ...data,
    id: agentRef.id,
    totalUses: data.totalUses || 0,
    successRate: data.successRate || 100,
    responseTimeAvg: data.responseTimeAvg || 0,
    rating: data.rating || 0,
    ratingCount: data.ratingCount || 0,
    status: data.status || 'active',
    searchKeywords: generateSearchKeywords(data.name, data.tags),
    createdAt: now,
    updatedAt: now,
  };

  await agentRef.set(agent);
  return agent;
}

export async function getAgentById(id: string): Promise<FirestoreAgent | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.AGENTS).doc(id).get();
  return doc.exists ? (doc.data() as FirestoreAgent) : null;
}

export async function getAgents(
  filter: Partial<FirestoreAgent> = {}
): Promise<FirestoreAgent[]> {
  const db = getFirestoreDb();
  let query: any = db.collection(COLLECTIONS.AGENTS);

  // Apply filters
  if (filter.status) {
    query = query.where('status', '==', filter.status);
  }
  if (filter.category) {
    query = query.where('category', '==', filter.category);
  }
  if (filter.creatorUid) {
    query = query.where('creatorUid', '==', filter.creatorUid);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => doc.data() as FirestoreAgent);
}

export async function getAgentsByCreator(
  creatorUid?: string,
  walletAddress?: string
): Promise<FirestoreAgent[]> {
  const db = getFirestoreDb();
  let query: any = db.collection(COLLECTIONS.AGENTS);

  if (creatorUid) {
    query = query.where('creatorUid', '==', creatorUid);
  } else if (walletAddress) {
    query = query.where('creatorWallet', '==', walletAddress);
  } else {
    return [];
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc: any) => doc.data() as FirestoreAgent);
}

export async function updateAgent(
  id: string,
  data: Partial<FirestoreAgent>
): Promise<boolean> {
  const db = getFirestoreDb();
  const agentRef = db.collection(COLLECTIONS.AGENTS).doc(id);

  try {
    const updates: any = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // If name or tags are updated, regenerate keywords
    if (data.name || data.tags) {
      const existing = await agentRef.get();
      const current = existing.data() as FirestoreAgent;
      updates.searchKeywords = generateSearchKeywords(
        data.name || current.name,
        data.tags || current.tags
      );
    }

    await agentRef.update(updates);
    return true;
  } catch (error) {
    console.error('[Firestore] Failed to update agent:', error);
    return false;
  }
}

export async function searchAgents(
  query: string,
  category?: string
): Promise<FirestoreAgent[]> {
  const db = getFirestoreDb();
  let firestoreQuery: any = db
    .collection(COLLECTIONS.AGENTS)
    .where('status', '==', 'active');

  if (category && category !== 'all') {
    firestoreQuery = firestoreQuery.where('category', '==', category);
  }

  // Use array-contains for indexed keyword search if query is a single word
  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  if (searchTerms.length > 0 && searchTerms[0].length > 1) {
    // Note: 'array-contains-any' is powerful but limited to 10 items.
    // We'll take the first 10 terms if multiple.
    firestoreQuery = firestoreQuery.where('searchKeywords', 'array-contains-any', searchTerms.slice(0, 10));
  }

  const snapshot = await firestoreQuery.get();
  let agents = snapshot.docs.map((doc: any) => doc.data() as FirestoreAgent);

  // Still keep some client-side filtering for complex queries or partial hits
  if (query && agents.length > 0) {
    const lowerQuery = query.toLowerCase();
    agents = agents.filter(
      (agent: FirestoreAgent) =>
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.description.toLowerCase().includes(lowerQuery) ||
        agent.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  return agents;
}

export async function incrementAgentUses(
  agentId: string,
  responseTime: number,
  success: boolean
): Promise<void> {
  const db = getFirestoreDb();
  const agentRef = db.collection(COLLECTIONS.AGENTS).doc(agentId);

  const agent = await agentRef.get();
  if (!agent.exists) return;

  const data = agent.data() as FirestoreAgent;
  const newTotalUses = data.totalUses + 1;
  const newResponseTimeAvg =
    (data.responseTimeAvg * data.totalUses + responseTime) / newTotalUses;
  const newSuccessRate =
    (data.successRate * data.totalUses + (success ? 100 : 0)) / newTotalUses;

  await agentRef.update({
    totalUses: FieldValue.increment(1),
    responseTimeAvg: newResponseTimeAvg,
    successRate: newSuccessRate,
    updatedAt: Timestamp.now(),
  });
}

// ============================================================================
// Dataset Operations (V2)
// ============================================================================

export async function createDataset(
  data: CreateFirestoreDataset
): Promise<FirestoreDataset> {
  const db = getFirestoreDb();
  const datasetRef = data.id
    ? db.collection(COLLECTIONS.DATASETS).doc(data.id)
    : db.collection(COLLECTIONS.DATASETS).doc();

  const now = Timestamp.now();
  const dataset: FirestoreDataset = {
    ...data,
    id: datasetRef.id,
    createdAt: now,
    updatedAt: now,
  };

  await datasetRef.set(dataset);
  return dataset;
}

export async function getDatasetById(id: string): Promise<FirestoreDataset | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.DATASETS).doc(id).get();
  return doc.exists ? (doc.data() as FirestoreDataset) : null;
}

export async function getDatasets(): Promise<FirestoreDataset[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.DATASETS).orderBy('createdAt', 'desc').limit(100).get();
  return snapshot.docs.map((doc) => doc.data() as FirestoreDataset);
}

export async function getDatasetsByOwner(ownerUid: string): Promise<FirestoreDataset[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.DATASETS)
    .where('ownerUid', '==', ownerUid)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => doc.data() as FirestoreDataset);
}


// ============================================================================
// Payment Operations
// ============================================================================

export async function createPayment(
  data: CreateFirestorePayment
): Promise<FirestorePayment> {
  const db = getFirestoreDb();
  const paymentRef = db.collection(COLLECTIONS.PAYMENTS).doc();

  const payment: FirestorePayment = {
    ...data,
    id: paymentRef.id,
    createdAt: Timestamp.now(),
  };

  await paymentRef.set(payment);
  return payment;
}

export async function getPaymentByTxSignature(
  txSignature: string
): Promise<FirestorePayment | null> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.PAYMENTS)
    .where('txSignature', '==', txSignature)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as FirestorePayment;
}

export async function getPaymentsByWallet(
  walletAddress: string,
  type: 'from' | 'to' = 'from'
): Promise<FirestorePayment[]> {
  const db = getFirestoreDb();
  const field = type === 'from' ? 'fromWallet' : 'toWallet';

  const snapshot = await db
    .collection(COLLECTIONS.PAYMENTS)
    .where(field, '==', walletAddress)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  return snapshot.docs.map((doc) => doc.data() as FirestorePayment);
}

export async function updatePaymentStatus(
  txSignature: string,
  status: FirestorePayment['status']
): Promise<boolean> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.PAYMENTS)
    .where('txSignature', '==', txSignature)
    .limit(1)
    .get();

  if (snapshot.empty) return false;

  await snapshot.docs[0].ref.update({
    status,
    verifiedAt: status === 'completed' ? Timestamp.now() : undefined,
  });

  return true;
}

// ============================================================================
// Agent Run Operations
// ============================================================================

export async function createAgentRun(
  data: CreateFirestoreAgentRun
): Promise<FirestoreAgentRun> {
  const db = getFirestoreDb();
  const runRef = db.collection(COLLECTIONS.AGENT_RUNS).doc();

  const run: FirestoreAgentRun = {
    ...data,
    id: runRef.id,
    createdAt: Timestamp.now(),
  };

  await runRef.set(run);
  return run;
}

export async function getAgentRuns(
  agentId: string,
  limit = 100
): Promise<FirestoreAgentRun[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.AGENT_RUNS)
    .where('agentId', '==', agentId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as FirestoreAgentRun);
}

export async function getUserAgentRuns(
  userWallet: string,
  limit = 100
): Promise<FirestoreAgentRun[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.AGENT_RUNS)
    .where('userWallet', '==', userWallet)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as FirestoreAgentRun);
}

// ============================================================================
// Review Operations
// ============================================================================

export async function createReview(
  data: CreateFirestoreReview
): Promise<FirestoreReview> {
  const db = getFirestoreDb();
  const reviewRef = db.collection(COLLECTIONS.REVIEWS).doc();

  const now = Timestamp.now();
  const review: FirestoreReview = {
    ...data,
    id: reviewRef.id,
    createdAt: now,
    updatedAt: now,
  };

  await reviewRef.set(review);

  // Update agent rating
  await updateAgentRating(data.agentId);

  return review;
}

export async function getReviewsByAgent(agentId: string): Promise<FirestoreReview[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.REVIEWS)
    .where('agentId', '==', agentId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => doc.data() as FirestoreReview);
}

export async function updateAgentRating(agentId: string): Promise<void> {
  const reviews = await getReviewsByAgent(agentId);

  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const avgRating = totalRating / reviews.length;

  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.AGENTS).doc(agentId).update({
    rating: avgRating,
    ratingCount: reviews.length,
    updatedAt: Timestamp.now(),
  });
}

// ============================================================================
// Notification Operations
// ============================================================================

export async function createNotification(
  data: CreateFirestoreNotification
): Promise<FirestoreNotification> {
  const db = getFirestoreDb();
  const notifRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc();

  const notification: FirestoreNotification = {
    ...data,
    id: notifRef.id,
    read: false,
    createdAt: Timestamp.now(),
  };

  await notifRef.set(notification);
  return notification;
}

export async function getUserNotifications(
  userUid: string,
  limit = 50
): Promise<FirestoreNotification[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.NOTIFICATIONS)
    .where('userUid', '==', userUid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as FirestoreNotification);
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const db = getFirestoreDb();
  try {
    await db.collection(COLLECTIONS.NOTIFICATIONS).doc(id).update({
      read: true,
      readAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('[Firestore] Failed to mark notification as read:', error);
    return false;
  }
}

// ============================================================================
// Favorite Operations
// ============================================================================

export async function addFavorite(
  userUid: string,
  agentId: string
): Promise<FirestoreFavorite> {
  const db = getFirestoreDb();
  const favoriteId = `${userUid}_${agentId}`;
  const favoriteRef = db.collection(COLLECTIONS.FAVORITES).doc(favoriteId);

  // Get agent info for denormalization
  const agent = await getAgentById(agentId);
  if (!agent) throw new Error('Agent not found');

  const favorite: FirestoreFavorite = {
    id: favoriteId,
    userUid,
    agentId,
    agentName: agent.name,
    agentCategory: agent.category,
    agentRating: agent.rating,
    createdAt: Timestamp.now(),
  };

  await favoriteRef.set(favorite);
  return favorite;
}

export async function removeFavorite(userUid: string, agentId: string): Promise<boolean> {
  const db = getFirestoreDb();
  const favoriteId = `${userUid}_${agentId}`;

  try {
    await db.collection(COLLECTIONS.FAVORITES).doc(favoriteId).delete();
    return true;
  } catch (error) {
    console.error('[Firestore] Failed to remove favorite:', error);
    return false;
  }
}

export async function getUserFavorites(userUid: string): Promise<FirestoreFavorite[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.FAVORITES)
    .where('userUid', '==', userUid)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => doc.data() as FirestoreFavorite);
}

export async function isFavorite(userUid: string, agentId: string): Promise<boolean> {
  const db = getFirestoreDb();
  const favoriteId = `${userUid}_${agentId}`;
  const doc = await db.collection(COLLECTIONS.FAVORITES).doc(favoriteId).get();
  return doc.exists;
}

// ============================================================================
// Subscription Operations
// ============================================================================

export async function createSubscription(
  userUid: string,
  agentId: string,
  plan: FirestoreSubscription['plan'],
  pricePerMonth: number
): Promise<FirestoreSubscription> {
  const db = getFirestoreDb();
  const subRef = db.collection(COLLECTIONS.SUBSCRIPTIONS).doc();

  const now = Timestamp.now();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription: FirestoreSubscription = {
    id: subRef.id,
    userUid,
    agentId,
    plan,
    pricePerMonth,
    currency: 'SOL',
    usageLimit: plan === 'basic' ? 100 : plan === 'pro' ? 1000 : 10000,
    usageCount: 0,
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: Timestamp.fromDate(periodEnd),
    createdAt: now,
    updatedAt: now,
  };

  await subRef.set(subscription);
  return subscription;
}

export async function getUserSubscriptions(
  userUid: string
): Promise<FirestoreSubscription[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.SUBSCRIPTIONS)
    .where('userUid', '==', userUid)
    .where('status', '==', 'active')
    .get();

  return snapshot.docs.map((doc) => doc.data() as FirestoreSubscription);
}

export async function incrementSubscriptionUsage(subscriptionId: string): Promise<void> {
  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId).update({
    usageCount: FieldValue.increment(1),
    updatedAt: Timestamp.now(),
  });
}

// ============================================================================
// Subscription Update Operation
// ============================================================================

export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<FirestoreSubscription>
): Promise<boolean> {
  const db = getFirestoreDb();
  try {
    await db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId).update({
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('[Firestore] Failed to update subscription:', error);
    return false;
  }
}

// ============================================================================
// Analytics Operations
// ============================================================================

export interface CreateAnalyticsEvent {
  agentId: string;
  eventType: 'view' | 'click' | 'use' | 'error' | 'payment';
  userWallet?: string;
  metadata?: Record<string, unknown>;
}

export async function createAnalyticsEvent(
  data: CreateAnalyticsEvent
): Promise<void> {
  const db = getFirestoreDb();
  const eventRef = db.collection(COLLECTIONS.ANALYTICS_EVENTS).doc();

  await eventRef.set({
    ...data,
    id: eventRef.id,
    createdAt: Timestamp.now(),
  });
}


// ============================================================================
// Admin Audit Operations
// ============================================================================

export interface CreateAdminAuditEvent {
  action: string;
  actorUid?: string;
  actorRole?: string;
  targetUid?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export async function createAdminAuditEvent(
  data: CreateAdminAuditEvent
): Promise<void> {
  const db = getFirestoreDb();
  const ref = db.collection(COLLECTIONS.ADMIN_AUDIT).doc();

  await ref.set({
    ...data,
    id: ref.id,
    createdAt: Timestamp.now(),
  });
}

// ============================================================================
// Agent Version Operations
// ============================================================================

export interface FirestoreAgentVersion {
  id: string;
  agentId: string;
  version: string; // semver: 1.0.0
  changelog: string;
  endpointUrl: string;
  deprecated: boolean;
  createdAt: Timestamp;
}

export interface CreateAgentVersionData {
  agentId: string;
  version: string;
  changelog: string;
  endpointUrl: string;
  deprecated: boolean;
}

export async function createAgentVersion(
  data: CreateAgentVersionData
): Promise<FirestoreAgentVersion> {
  const db = getFirestoreDb();
  const versionRef = db.collection(COLLECTIONS.AGENT_VERSIONS).doc();

  const version: FirestoreAgentVersion = {
    ...data,
    id: versionRef.id,
    createdAt: Timestamp.now(),
  };

  await versionRef.set(version);
  return version;
}

export async function getAgentVersions(agentId: string): Promise<FirestoreAgentVersion[]> {
  const db = getFirestoreDb();
  const snapshot = await db
    .collection(COLLECTIONS.AGENT_VERSIONS)
    .where('agentId', '==', agentId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => doc.data() as FirestoreAgentVersion);
}
