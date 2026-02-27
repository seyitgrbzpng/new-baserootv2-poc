import { Timestamp } from 'firebase-admin/firestore';
import { getFirestoreDb, COLLECTIONS } from './firebase';
import type {
    FirestoreInference,
    FirestoreLedgerEntry,
    FirestoreEvent,
    FirestoreDaoPolicy,
    CreateFirestoreInference,
    CreateFirestoreLedgerEntry,
    CreateFirestoreEvent,
    CreateFirestoreDaoPolicy,
} from './firestore-types';

/**
 * Firestore CRUD for ChainGPT PoC — Inferences & Ledger
 * Follows the same pattern as firestore-db.ts
 */

// ============================================================================
// Inference Operations
// ============================================================================

export async function createInference(
    data: CreateFirestoreInference
): Promise<FirestoreInference> {
    const db = getFirestoreDb();
    const ref = db.collection(COLLECTIONS.INFERENCES).doc();

    const inference: FirestoreInference = {
        ...data,
        id: ref.id,
        created_at: Timestamp.now(),
    };

    await ref.set(inference);
    console.log(`[InferenceDB] Created inference: ${ref.id}`);
    return inference;
}

export async function getInferencesByDao(
    dao_id: string,
    from?: Date,
    to?: Date
): Promise<FirestoreInference[]> {
    const db = getFirestoreDb();
    // Simple where-only query to avoid needing a composite index
    const snapshot = await db
        .collection(COLLECTIONS.INFERENCES)
        .where('dao_id', '==', dao_id)
        .limit(500)
        .get();

    let results = snapshot.docs.map(doc => doc.data() as FirestoreInference);

    // Client-side date filtering (if needed)
    if (from) {
        const fromTs = Timestamp.fromDate(from);
        results = results.filter(r => r.created_at && r.created_at >= fromTs);
    }
    if (to) {
        const toTs = Timestamp.fromDate(to);
        results = results.filter(r => r.created_at && r.created_at <= toTs);
    }

    // Sort by created_at desc in memory
    results.sort((a, b) => {
        const aMs = a.created_at?.toMillis?.() ?? 0;
        const bMs = b.created_at?.toMillis?.() ?? 0;
        return bMs - aMs;
    });

    return results;
}

/**
 * Get usage stats for a DAO (aggregated).
 */
export async function getUsageStats(
    dao_id: string,
    from?: Date,
    to?: Date
): Promise<{
    total_inferences: number;
    total_cost: number;
    avg_cost: number;
}> {
    const inferences = await getInferencesByDao(dao_id, from, to);

    const total_inferences = inferences.length;
    const total_cost = inferences.reduce((sum, inf) => sum + (inf.cost_estimated || 0), 0);
    const avg_cost = total_inferences > 0 ? total_cost / total_inferences : 0;

    return {
        total_inferences,
        total_cost: Math.round(total_cost * 1_000_000) / 1_000_000,
        avg_cost: Math.round(avg_cost * 1_000_000) / 1_000_000,
    };
}

// ============================================================================
// Ledger Entry Operations
// ============================================================================

export async function createLedgerEntry(
    data: CreateFirestoreLedgerEntry
): Promise<FirestoreLedgerEntry> {
    const db = getFirestoreDb();
    const ref = db.collection(COLLECTIONS.LEDGER_ENTRIES).doc();

    const entry: FirestoreLedgerEntry = {
        ...data,
        id: ref.id,
        status: 'pending',
        created_at: Timestamp.now(),
    };

    await ref.set(entry);
    console.log(`[InferenceDB] Created ledger entry: ${ref.id} (Status: pending)`);
    return entry;
}

export async function getLedgerEntriesByDao(
    dao_id: string,
    limit = 50
): Promise<FirestoreLedgerEntry[]> {
    const db = getFirestoreDb();
    // Simple where-only query to avoid needing a composite index
    const snapshot = await db
        .collection(COLLECTIONS.LEDGER_ENTRIES)
        .where('dao_id', '==', dao_id)
        .limit(limit)
        .get();

    const results = snapshot.docs.map(doc => doc.data() as FirestoreLedgerEntry);

    // Sort by created_at desc in memory
    results.sort((a, b) => {
        const aMs = a.created_at?.toMillis?.() ?? 0;
        const bMs = b.created_at?.toMillis?.() ?? 0;
        return bMs - aMs;
    });

    return results;
}

export async function settlePendingLedgerEntries(
    dao_id: string
): Promise<number> {
    const db = getFirestoreDb();
    const snapshot = await db
        .collection(COLLECTIONS.LEDGER_ENTRIES)
        .where('dao_id', '==', dao_id)
        .where('status', '==', 'pending')
        .get();

    if (snapshot.empty) return 0;

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'settled' });
    });

    await batch.commit();
    console.log(`[InferenceDB] Settled ${snapshot.size} ledger entries for DAO: ${dao_id}`);
    return snapshot.size;
}

// ============================================================================
// Event Operations (Webhook Deduplication)
// ============================================================================

export async function checkAndCreateEvent(
    data: CreateFirestoreEvent
): Promise<{ exists: boolean; event: FirestoreEvent }> {
    const db = getFirestoreDb();
    const ref = db.collection(COLLECTIONS.EVENTS).doc(data.id);

    const existing = await ref.get();
    if (existing.exists) {
        return { exists: true, event: existing.data() as FirestoreEvent };
    }

    const event: FirestoreEvent = {
        ...data,
        created_at: Timestamp.now(),
    };

    await ref.set(event);
    console.log(`[InferenceDB] Created event: ${data.id}`);
    return { exists: false, event };
}

// ============================================================================
// DAO Split Policy Operations
// ============================================================================

export async function getDaoPolicy(
    dao_id: string
): Promise<FirestoreDaoPolicy | null> {
    const db = getFirestoreDb();
    const doc = await db.collection(COLLECTIONS.DAO_POLICIES).doc(dao_id).get();
    if (!doc.exists) return null;
    return doc.data() as FirestoreDaoPolicy;
}

export async function upsertDaoPolicy(
    data: CreateFirestoreDaoPolicy
): Promise<FirestoreDaoPolicy> {
    const db = getFirestoreDb();
    const ref = db.collection(COLLECTIONS.DAO_POLICIES).doc(data.dao_id);
    const now = Timestamp.now();

    const existing = await ref.get();
    const policy: FirestoreDaoPolicy = {
        ...data,
        updated_at: now,
        created_at: existing.exists
            ? (existing.data() as FirestoreDaoPolicy).created_at
            : now,
    };

    await ref.set(policy);
    console.log(`[InferenceDB] Upserted DAO policy: ${data.dao_id} (${data.dao_data_provider_bps}/${data.agent_developer_bps}/${data.protocol_bps})`);
    return policy;
}
