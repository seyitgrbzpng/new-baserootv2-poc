# Firebase Migration Guide

## Overview

This document describes the complete migration from MongoDB + MySQL to Firebase (Firestore + Firebase Auth) for the Baseroot.io marketplace.

## What Changed

### Database Layer

**Before:**
- MongoDB for marketplace data (agents, payments, agent_runs, wallet_users)
- MySQL + Drizzle ORM for user management (Manus OAuth)
- Express.js backend with tRPC

**After:**
- Firebase Firestore for all marketplace data
- Firebase Auth for wallet-based and OAuth authentication
- Express.js + tRPC backend (unchanged structure, Firebase-backed)

### Data Models

All MongoDB collections have been migrated to Firestore with optimized schemas:

| MongoDB Collection | Firestore Collection | Changes |
|-------------------|---------------------|---------|
| `agents` | `agents` | Added `creatorUid` (Firebase UID), denormalized creator info |
| `payments` | `payments` | Added `fromUid`, `toUid`, `agentName` for quick lookups |
| `agent_runs` | `agent_runs` | Added `userUid`, `agentName` for denormalization |
| `wallet_users` | `users` | Unified with OAuth users, added Firebase Auth integration |
| - | `reviews` | New collection with verified review system |
| - | `notifications` | New collection for real-time notifications |
| - | `favorites` | New collection with denormalized agent info |
| - | `subscriptions` | New collection for subscription management |
| - | `agent_versions` | New collection for agent versioning |
| - | `analytics_events` | New collection for analytics tracking |
| - | `search_filters` | New collection for saved search preferences |
| - | `multichain_wallets` | New collection for multi-chain wallet support |

### Authentication

**Before:**
- Wallet signature verification
- MySQL-based user records
- Manus OAuth for email/social login

**After:**
- Firebase Auth with custom tokens
- Wallet-based authentication using Solana signatures
- Firebase Auth for OAuth (email, Google, GitHub)
- Unified user identity across wallets and OAuth

### Key Files

#### New Files
- `server/firebase.ts` - Firebase initialization and configuration
- `server/firestore-types.ts` - TypeScript types for Firestore documents
- `server/firestore-db.ts` - Database operations (replaces MongoDB queries)
- `server/firebase-auth.ts` - Authentication logic (wallet + OAuth)
- `firestore.rules` - Security rules for Firestore
- `firestore.indexes.json` - Index configuration for optimal queries

#### Modified Files
- `server/routers.ts` - Updated to use Firestore operations
- `server/reviews-router.ts` - Migrated to Firestore
- `server/notifications-router.ts` - Migrated to Firestore
- `server/favorites-router.ts` - Migrated to Firestore
- `.env.example` - Updated with Firebase configuration

#### Backup Files
- `server/routers-mongodb-backup.ts` - Original MongoDB router (backup)
- `server/mongodb.ts` - Original MongoDB operations (kept for reference)
- `server/db.ts` - Original Drizzle ORM operations (kept for reference)

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable Firestore Database
4. Enable Firebase Authentication

### 2. Generate Service Account

1. Go to Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Copy the entire JSON content

### 3. Configure Environment Variables

Create a `.env` file with:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'

# For local development with emulator (optional)
# FIRESTORE_EMULATOR_HOST=localhost:8080
# FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Deploy Firestore Rules and Indexes

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Firestore)
firebase init firestore

# Deploy rules and indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. Install Dependencies

Dependencies are already installed. The project now uses:
- `firebase` - Firebase client SDK
- `firebase-admin` - Firebase Admin SDK (server-side)
- `firebase-functions` - Firebase Cloud Functions (optional)

### 6. Run the Application

```bash
# Development
pnpm dev

# Production build
pnpm build

# Production start
pnpm start
```

## Firestore Data Structure

### Users Collection

```typescript
{
  uid: string;                    // Firebase Auth UID
  walletAddress?: string;         // Solana wallet address
  username?: string;
  email?: string;
  role: 'user' | 'creator' | 'admin';
  totalSpent: number;
  totalEarned: number;
  loginMethod?: 'wallet' | 'email' | 'google' | 'github';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSignedIn?: Timestamp;
}
```

### Agents Collection

```typescript
{
  id: string;                     // Document ID
  name: string;
  description: string;
  creatorUid: string;             // Firebase Auth UID
  creatorWallet: string;          // For payment routing
  category: string;
  tags: string[];
  endpointUrl: string;
  pricePerUse: number;
  currency: 'SOL' | 'TON' | 'BASE';
  totalUses: number;
  rating: number;
  status: 'pending' | 'active' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Payments Collection

```typescript
{
  id: string;                     // Document ID
  txSignature: string;            // Blockchain transaction (unique)
  fromWallet: string;
  fromUid?: string;               // Firebase Auth UID
  toWallet: string;
  toUid?: string;                 // Firebase Auth UID
  agentId: string;
  agentName: string;              // Denormalized for quick display
  amount: number;
  currency: string;
  platformFee: number;
  creatorAmount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
}
```

## Security Rules

Firestore Security Rules are defined in `firestore.rules`:

- **Users**: Read-only for all, write-only for self
- **Agents**: Public read, creator-only write
- **Payments**: Read-only for involved parties, backend-only write
- **Reviews**: Public read, authenticated write (own reviews only)
- **Notifications**: User-only read/write
- **Favorites**: User-only read/write

## Performance Optimizations

### Denormalization

To optimize read-heavy operations:
- Agent names stored in payments, runs, and favorites
- User info cached in reviews
- Rating aggregates stored in agent documents

### Indexes

Composite indexes created for:
- Agent filtering by status + category + rating
- Payment queries by wallet + timestamp
- Agent run queries by agent/user + timestamp
- Review queries by agent + verified status

### Query Limits

Default limits applied:
- Agents: No limit (filtered by status)
- Payments: 100 per query
- Agent runs: 100 per query
- Notifications: 50 per query

## Migration Strategy

### For Existing Data

If you have existing MongoDB data, create a migration script:

```typescript
// Example migration script
import { connectMongoDB, getAgents } from './server/mongodb';
import { createAgent } from './server/firestore-db';

async function migrateAgents() {
  await connectMongoDB();
  const agents = await getAgents();
  
  for (const agent of agents) {
    await createAgent({
      name: agent.name,
      description: agent.description,
      creatorUid: `wallet_${agent.creatorWallet}`,
      creatorWallet: agent.creatorWallet,
      // ... map other fields
    });
  }
}
```

### Zero-Downtime Migration

1. Deploy Firebase-backed code alongside MongoDB
2. Write to both databases temporarily
3. Migrate historical data
4. Switch reads to Firebase
5. Remove MongoDB dependencies

## Vercel Deployment

### Environment Variables

Add to Vercel Dashboard → Settings → Environment Variables:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

**Important**: Store `FIREBASE_SERVICE_ACCOUNT` as a single-line JSON string.

### Build Configuration

No changes needed. The existing Vercel configuration works with Firebase.

## Firebase Emulator (Local Development)

### Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize emulators
firebase init emulators

# Start emulators
firebase emulators:start
```

### Configure Environment

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

## Monitoring and Analytics

### Firestore Usage

Monitor in Firebase Console:
- Document reads/writes
- Storage usage
- Index usage

### Cost Optimization

- Use denormalization to reduce reads
- Implement pagination for large lists
- Cache frequently accessed data
- Use subcollections sparingly

## Troubleshooting

### Common Issues

**Issue**: "Permission denied" errors
**Solution**: Check Firestore Security Rules, ensure user is authenticated

**Issue**: "Index required" errors
**Solution**: Deploy indexes from `firestore.indexes.json`

**Issue**: Slow queries
**Solution**: Add composite indexes, implement pagination

**Issue**: Authentication failures
**Solution**: Verify Firebase service account credentials

## Rollback Plan

If issues occur:

1. Restore `server/routers-mongodb-backup.ts` to `server/routers.ts`
2. Reinstall MongoDB dependencies: `pnpm add mongodb mysql2 drizzle-orm`
3. Restore environment variables
4. Restart the server

## Success Criteria

✅ All dashboards function correctly
✅ Payments and agent execution work
✅ No MongoDB or MySQL dependencies
✅ Firebase-native, scalable architecture
✅ Security rules enforced
✅ Indexes deployed and optimized

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase Support](https://firebase.google.com/support)

For project-specific issues:
- Check `server/firebase.ts` for initialization errors
- Review Firestore Security Rules in Firebase Console
- Check server logs for detailed error messages
