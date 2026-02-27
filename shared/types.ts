/**
 * Unified type exports
 * Migrated to Firestore types
 */

import type { 
  FirestoreUser, 
  FirestoreAgent, 
  FirestorePayment, 
  FirestoreAgentRun,
  FirestoreReview,
  FirestoreNotification,
  FirestoreFavorite,
  FirestoreSubscription
} from "../server/firestore-types";

export type User = FirestoreUser;
export type Agent = FirestoreAgent;
export type Payment = FirestorePayment;
export type AgentRun = FirestoreAgentRun;
export type Review = FirestoreReview;
export type Notification = FirestoreNotification;
export type Favorite = FirestoreFavorite;
export type Subscription = FirestoreSubscription;

export * from "./_core/errors";
