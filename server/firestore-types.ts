import { Timestamp, FieldValue } from 'firebase-admin/firestore';

/**
 * Firestore Data Models for Baseroot Marketplace
 * Optimized for read-heavy marketplace operations
 */

// ============================================================================
// User Management
// ============================================================================

export interface FirestoreUser {
  uid: string; // Firebase Auth UID
  walletAddress?: string; // Primary EVM wallet (Avalanche)
  username?: string;
  email?: string;
  role: 'user' | 'creator' | 'admin';
  totalSpent: number;
  totalEarned: number;

  // OAuth fields
  loginMethod?: 'wallet' | 'email' | 'google' | 'github';

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSignedIn?: Timestamp;
}

// ============================================================================
// Datasets (Verified Data Pools) - V2
// ============================================================================

export interface FirestoreDataset {
  id: string; // Document ID
  title: string;
  description: string;
  ownerWallet: string; // Wallet to receive revenue
  ownerUid: string; // Firebase Auth UID

  // Data Classification
  dataType?: 'genomic' | 'proteomic' | 'imaging' | 'clinical' | 'environmental' | 'web3_governance' | 'web3_treasury' | 'web3_defi';
  dataFormat?: 'csv' | 'json' | 'fastq' | 'dicom' | 'text';
  dataContent?: string; // Actual data content (PoC: stored as text, production: IPFS/encrypted)
  dataHash?: string;    // SHA-256 hash of content for verification

  // Pricing & Revenue
  pricePerUse?: number; // Optional: Flat fee per use
  revenueShare: number; // Percentage of agent revenue (e.g., 10%)

  // Sample / verification
  sampleDataUrl?: string; // URL to a sample file
  verificationProof?: string; // Hash or proof of ownership

  // Metadata
  category: string;
  tags: string[];
  txSignature?: string; // Verification link to original on-chain registration
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Agents
// ============================================================================

export interface FirestoreAgent {
  id: string; // Document ID
  name: string;
  description: string;
  creatorUid: string; // Firebase Auth UID of creator
  creatorWallet: string; // For payment routing

  // V2: Datasets
  datasetIds?: string[]; // IDs of datasets this agent uses

  // Categorization
  category: string;
  tags: string[];

  // API Configuration
  endpointUrl: string;
  apiKeyRequired: boolean;

  healthCheckUrl?: string;
  publicKey?: string; // For cryptographic verification of agent responses

  // Pricing
  pricePerUse: number;
  currency: 'SOL' | 'TON' | 'BASE' | 'AVAX';

  // Performance metrics (denormalized for fast reads)
  totalUses: number;
  successRate: number;
  responseTimeAvg: number;
  rating: number;
  ratingCount: number;

  // Status
  status: 'pending' | 'active' | 'suspended';
  searchKeywords?: string[]; // For Firestore indexed search
  lastHealthCheck?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Payments
// ============================================================================

export interface FirestorePayment {
  id: string; // Document ID
  txSignature: string; // Blockchain transaction signature (unique)

  // Parties
  fromWallet: string;
  fromUid?: string; // Firebase Auth UID if available
  toWallet: string;
  toUid?: string; // Firebase Auth UID if available

  // Agent reference
  agentId: string;
  agentName: string; // Denormalized for quick display

  // Amounts
  amount: number;
  currency: string;
  platformFee: number; // 10%
  creatorAmount: number; // Remaining after splits

  // V2: Data Owner Splits
  datasetAmount?: number; // Total amount paid to data owners
  datasetSplits?: { wallet: string; amount: number; datasetId: string }[];

  // Status
  status: 'pending' | 'completed' | 'failed';

  // Blockchain verification
  blockTime?: number;
  slot?: number;

  // Metadata
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
}

// ============================================================================
// Agent Runs (Execution History)
// ============================================================================

export interface FirestoreAgentRun {
  id: string; // Document ID
  agentId: string;
  agentName: string; // Denormalized

  // User info
  userWallet: string;
  userUid?: string;

  // Payment reference
  paymentId?: string;
  txSignature?: string;

  // Execution data
  requestData: Record<string, any>;
  responseData?: Record<string, any>;
  responseTime: number; // milliseconds

  // Status
  status: 'success' | 'failed' | 'timeout';
  errorMessage?: string;

  // Metadata
  createdAt: Timestamp;
}

// ============================================================================
// Reviews
// ============================================================================

export interface FirestoreReview {
  id: string; // Document ID
  agentId: string;
  agentName: string; // Denormalized

  // Reviewer
  userUid: string;
  userWallet: string;
  username?: string;

  // Review content
  rating: number; // 1-5
  comment?: string;

  // Verification
  verified: boolean; // Has user actually used the agent?
  paymentId?: string;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Notifications
// ============================================================================

export interface FirestoreNotification {
  id: string; // Document ID
  userUid: string;

  // Content
  type: 'payment' | 'agent_run' | 'review' | 'system' | 'subscription';
  title: string;
  message: string;

  // Related entities
  agentId?: string;
  paymentId?: string;
  reviewId?: string;

  // Status
  read: boolean;

  // Metadata
  createdAt: Timestamp;
  readAt?: Timestamp;
}

// ============================================================================
// Favorites
// ============================================================================

export interface FirestoreFavorite {
  id: string; // Document ID (composite: userUid_agentId)
  userUid: string;
  agentId: string;

  // Denormalized agent info for quick display
  agentName: string;
  agentCategory: string;
  agentRating: number;

  // Metadata
  createdAt: Timestamp;
}

// ============================================================================
// Subscriptions
// ============================================================================

export interface FirestoreSubscription {
  id: string; // Document ID
  userUid: string;
  agentId: string;

  // Plan details
  plan: 'basic' | 'pro' | 'enterprise';
  pricePerMonth: number;
  currency: string;

  // Usage limits
  usageLimit: number; // Calls per month
  usageCount: number; // Current usage

  // Status
  status: 'active' | 'cancelled' | 'expired';

  // Billing
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Agent Versions
// ============================================================================

export interface FirestoreAgentVersion {
  id: string; // Document ID
  agentId: string;
  version: string; // Semantic version

  // Changes
  changelog: string;
  endpointUrl: string;

  // Status
  status: 'draft' | 'active' | 'deprecated';

  // Metadata
  createdAt: Timestamp;
  publishedAt?: Timestamp;
}

// ============================================================================
// Analytics Events
// ============================================================================

export interface FirestoreAnalyticsEvent {
  id: string; // Document ID

  // Event details
  eventType: 'page_view' | 'agent_view' | 'agent_run' | 'payment' | 'search';

  // User info
  userUid?: string;
  userWallet?: string;

  // Related entities
  agentId?: string;
  paymentId?: string;
  searchQuery?: string;

  // Context
  metadata?: Record<string, any>;

  // Metadata
  createdAt: Timestamp;
}

// ============================================================================
// Search Filters (User preferences)
// ============================================================================

export interface FirestoreSearchFilter {
  id: string; // Document ID
  userUid: string;

  // Filter criteria
  name: string;
  category?: string;
  tags?: string[];
  minRating?: number;
  maxPrice?: number;
  currency?: string;

  // Metadata
  createdAt: Timestamp;
  lastUsed?: Timestamp;
}

// ============================================================================
// Multichain Wallets
// ============================================================================

export interface FirestoreMultichainWallet {
  id: string; // Document ID
  userUid: string;

  // Wallet addresses
  solanaAddress?: string;
  tonAddress?: string;
  baseAddress?: string;

  // Primary wallet
  primaryChain: 'AVAX' | 'TON' | 'BASE';

  // Verification
  verified: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// LLM Inferences (ChainGPT PoC)
// ============================================================================

export interface FirestoreInference {
  id: string; // Document ID
  dao_id: string;
  project_id?: string;
  agent_id: string;
  workflow_run_id: string; // Request-level unique ID

  // Provider info
  provider: string; // "chaingpt"
  model: string;

  // Hashes for verification
  input_hash?: string;
  output_hash?: string;

  // Usage & performance
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    credits?: number;
  };
  latency_ms: number;

  // Cost
  cost_estimated: number;
  pricing_mode: string; // "per_token" | "per_credit" | "flat"

  // Metadata
  created_at: Timestamp;
}

// ============================================================================
// Ledger Entries (Economic Attribution)
// ============================================================================

export interface FirestoreLedgerEntry {
  id: string; // Document ID
  dao_id: string;
  inference_id: string; // Reference to inference doc
  tx_signature?: string; // Blockchain transaction hash

  // Amounts
  amount_total: number;
  currency: string; // "USD_EST"

  // Breakdown
  breakdown: {
    dao_data_provider_amount: number;
    agent_developer_amount: number;
    protocol_amount: number;
  };

  // Virtual Claim Status
  status: 'pending' | 'settled';

  // Metadata
  created_at: Timestamp;
}

// ============================================================================
// DAO Split Policies
// ============================================================================

export interface FirestoreDaoPolicy {
  dao_id: string; // Document ID = dao_id
  dao_data_provider_bps: number; // Basis points for DAO (data provider)
  agent_developer_bps: number;   // Basis points for agent developer
  protocol_bps: number;          // Basis points for protocol (Baseroot)
  updated_at: Timestamp;
  created_at: Timestamp;
}

export type CreateFirestoreDaoPolicy = Omit<FirestoreDaoPolicy, 'created_at' | 'updated_at'>;

// ============================================================================
// Webhook Events (Deduplication)
// ============================================================================

export interface FirestoreEvent {
  id: string; // event_id (used as doc ID for dedup)
  event_type: string;
  processed: boolean;
  payload?: Record<string, unknown>;
  created_at: Timestamp;
}

// ============================================================================
// Helper Types
// ============================================================================

export type FirestoreTimestamp = Timestamp;
export type FirestoreFieldValue = FieldValue;

// For creating new documents (without id and timestamps)
export type CreateFirestoreUser = Omit<FirestoreUser, 'uid' | 'createdAt' | 'updatedAt'>;
export type CreateFirestoreAgent = Omit<FirestoreAgent, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type CreateFirestoreDataset = Omit<FirestoreDataset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type CreateFirestorePayment = Omit<FirestorePayment, 'id' | 'createdAt'>;
export type CreateFirestoreAgentRun = Omit<FirestoreAgentRun, 'id' | 'createdAt'>;
export type CreateFirestoreReview = Omit<FirestoreReview, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateFirestoreNotification = Omit<FirestoreNotification, 'id' | 'createdAt'>;
export type CreateFirestoreFavorite = Omit<FirestoreFavorite, 'id' | 'createdAt'>;
export type CreateFirestoreSubscription = Omit<FirestoreSubscription, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateFirestoreInference = Omit<FirestoreInference, 'id' | 'created_at'>;
export type CreateFirestoreLedgerEntry = Omit<FirestoreLedgerEntry, 'id' | 'created_at' | 'status'>;
export type CreateFirestoreEvent = Omit<FirestoreEvent, 'created_at'>;
