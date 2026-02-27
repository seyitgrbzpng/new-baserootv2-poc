/**
 * licenseSync.ts — Event listener for LicensePurchased events from BaserootMarketplaceV2.
 * Syncs on-chain license purchases to Firestore `avax_licenses` collection.
 *
 * Features:
 * - Idempotent writes (licenseId = doc ID)
 * - Retry with exponential backoff
 * - Firestore-first check → event-based on-chain fallback
 * - Partial → complete self-heal for fallback records
 * - lastSyncedBlock persistence for restart durability
 * - 0x0 address guard at startup
 */

import { createPublicClient, http, parseAbiItem, getAddress, formatEther, Log } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { getFirestoreDb } from './firebase';

// ── Configuration ───────────────────────────────────────────────────────

// Backend env: use backend-standard names, fallback to VITE_ for backwards compat
const RPC_URL = process.env.RPC_URL || process.env.VITE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const RAW_ADDRESS = process.env.BASEROOT_MARKETPLACE_ADDRESS || process.env.VITE_BASEROOT_MARKETPLACE_ADDRESS || '';

// 0x0 guard: fail-fast if no contract address configured
if (!RAW_ADDRESS || RAW_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.error('[LicenseSync] ⛔ BASEROOT_MARKETPLACE_ADDRESS is not set or is 0x0. License sync will be disabled.');
}

const MARKETPLACE_ADDRESS = RAW_ADDRESS
    ? getAddress(RAW_ADDRESS as `0x${string}`)
    : '0x0000000000000000000000000000000000000000' as `0x${string}`;

const LICENSES_COLLECTION = 'avax_licenses';
const SYNC_META_COLLECTION = 'system_meta'; // stores lastSyncedBlock
const SYNC_META_DOC = 'license_sync';

// ABI fragments
const LICENSE_PURCHASED_EVENT = parseAbiItem(
    'event LicensePurchased(uint256 indexed licenseId, string agentId, address indexed buyer, uint256 amount, address creator, address daoOwner)'
);

const V2_ABI = [
    {
        inputs: [],
        name: 'nextLicenseId',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ type: 'uint256', name: '_licenseId' }],
        name: 'getLicense',
        outputs: [
            { type: 'address', name: 'buyer_' },
            { type: 'string', name: 'agentId_' },
            { type: 'uint256', name: 'purchasedAt_' },
            { type: 'bool', name: 'active_' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(RPC_URL),
});

// ── Types ───────────────────────────────────────────────────────────────

export interface FirestoreLicense {
    licenseId: number;
    agentId: string;
    buyer: string;
    amount: string;       // AVAX formatted
    amountWei: string;    // raw wei
    creator: string;
    daoOwner: string;
    purchasedAt: number;  // block timestamp
    txHash: string;
    blockNumber: number;
    syncedAt: number;
    status: 'complete' | 'partial'; // partial = from fallback, missing amount/creator/daoOwner
}

// ── Firestore License Operations ────────────────────────────────────────

/**
 * Write a license to Firestore idempotently.
 * Uses licenseId as doc ID → duplicate writes are no-op.
 * If existing doc is 'complete' and new data is 'partial', skip overwrite.
 */
async function writeLicenseToFirestore(license: FirestoreLicense, retries = 3): Promise<void> {
    const db = getFirestoreDb();
    const docRef = db.collection(LICENSES_COLLECTION).doc(String(license.licenseId));

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Check if a complete record already exists — don't downgrade
            if (license.status === 'partial') {
                const existing = await docRef.get();
                if (existing.exists && existing.data()?.status === 'complete') {
                    console.log(`[LicenseSync] License #${license.licenseId} already complete, skipping partial write`);
                    return;
                }
            }

            await docRef.set(license, { merge: true });
            console.log(`[LicenseSync] ✅ License #${license.licenseId} synced [${license.status}] (agent: ${license.agentId}, buyer: ${license.buyer})`);
            return;
        } catch (err) {
            console.error(`[LicenseSync] ❌ Write failed for license #${license.licenseId} (attempt ${attempt}/${retries}):`, err);
            if (attempt < retries) {
                const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    console.error(`[LicenseSync] ⚠️ Gave up writing license #${license.licenseId} after ${retries} attempts`);
}

/**
 * Check if a wallet has a valid license for a specific agent.
 * Strategy: Firestore first → event-based on-chain fallback if Firestore misses.
 */
export async function checkLicenseForAgent(
    walletAddress: string,
    agentId: string
): Promise<{ hasLicense: boolean; licenseId?: number; purchasedAt?: number }> {
    // 1. Check Firestore first (fast path)
    try {
        const db = getFirestoreDb();
        const snapshot = await db.collection(LICENSES_COLLECTION)
            .where('buyer', '==', walletAddress.toLowerCase())
            .where('agentId', '==', agentId)
            .orderBy('syncedAt', 'desc')
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0].data() as FirestoreLicense;
            return {
                hasLicense: true,
                licenseId: doc.licenseId,
                purchasedAt: doc.purchasedAt,
            };
        }
    } catch (err) {
        console.warn('[LicenseSync] Firestore check failed, falling back to chain:', err);
    }

    // 2. On-chain fallback — use getContractEvents (event-based, much faster than 50x getLicense)
    try {
        const currentBlock = await publicClient.getBlockNumber();
        // Scan last 10000 blocks (~a few hours on Fuji)
        const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

        const logs = await publicClient.getContractEvents({
            address: MARKETPLACE_ADDRESS,
            abi: [LICENSE_PURCHASED_EVENT],
            eventName: 'LicensePurchased',
            fromBlock,
            toBlock: currentBlock,
        });

        // Filter for this buyer + agentId (buyer is indexed, but we also filter agentId)
        for (const log of logs.reverse()) { // newest first
            const args = (log as any).args;
            if (!args) continue;

            const buyer = (args.buyer as string).toLowerCase();
            const licAgentId = args.agentId as string;

            if (buyer === walletAddress.toLowerCase() && licAgentId === agentId) {
                const licenseId = Number(args.licenseId);
                const amount = args.amount as bigint;
                const creator = (args.creator as string).toLowerCase();
                const daoOwner = (args.daoOwner as string).toLowerCase();

                console.log(`[LicenseSync] ✅ On-chain license found via event: #${licenseId} (Firestore was behind)`);

                // Self-heal: write complete record to Firestore (event has all fields)
                let purchasedAt = Math.floor(Date.now() / 1000);
                try {
                    if ((log as any).blockNumber) {
                        const block = await publicClient.getBlock({ blockNumber: (log as any).blockNumber });
                        purchasedAt = Number(block.timestamp);
                    }
                } catch { /* use current time */ }

                writeLicenseToFirestore({
                    licenseId,
                    agentId: licAgentId,
                    buyer,
                    amount: formatEther(amount),
                    amountWei: amount.toString(),
                    creator,
                    daoOwner,
                    purchasedAt,
                    txHash: (log as any).transactionHash || '',
                    blockNumber: Number((log as any).blockNumber || 0),
                    syncedAt: Date.now(),
                    status: 'complete', // event has all data — complete record
                }).catch(err => console.warn('[LicenseSync] Background sync failed:', err));

                return {
                    hasLicense: true,
                    licenseId,
                    purchasedAt,
                };
            }
        }
    } catch (err) {
        console.error('[LicenseSync] Event-based fallback failed:', err);
    }

    return { hasLicense: false };
}

/**
 * Get all licenses for a wallet address.
 */
export async function getLicensesByWallet(walletAddress: string): Promise<FirestoreLicense[]> {
    try {
        const db = getFirestoreDb();
        const snapshot = await db.collection(LICENSES_COLLECTION)
            .where('buyer', '==', walletAddress.toLowerCase())
            .orderBy('syncedAt', 'desc')
            .get();

        return snapshot.docs.map(doc => doc.data() as FirestoreLicense);
    } catch (err) {
        console.error('[LicenseSync] getLicensesByWallet error:', err);
        return [];
    }
}

// ── lastSyncedBlock Persistence ─────────────────────────────────────────

async function getLastSyncedBlock(): Promise<bigint> {
    try {
        const db = getFirestoreDb();
        const doc = await db.collection(SYNC_META_COLLECTION).doc(SYNC_META_DOC).get();
        if (doc.exists) {
            const data = doc.data();
            if (data?.lastSyncedBlock) {
                return BigInt(data.lastSyncedBlock);
            }
        }
    } catch (err) {
        console.warn('[LicenseSync] Could not read lastSyncedBlock:', err);
    }
    return BigInt(0);
}

async function setLastSyncedBlock(blockNumber: bigint): Promise<void> {
    try {
        const db = getFirestoreDb();
        await db.collection(SYNC_META_COLLECTION).doc(SYNC_META_DOC).set({
            lastSyncedBlock: blockNumber.toString(),
            updatedAt: Date.now(),
        }, { merge: true });
    } catch (err) {
        console.warn('[LicenseSync] Could not write lastSyncedBlock:', err);
    }
}

// ── Event Processing ────────────────────────────────────────────────────

async function processLicenseEvent(log: Log, txHash: string): Promise<void> {
    try {
        const args = log as any;

        const licenseId = Number(args.args.licenseId);
        const agentId = args.args.agentId as string;
        const buyer = (args.args.buyer as string).toLowerCase();
        const amount = args.args.amount as bigint;
        const creator = (args.args.creator as string).toLowerCase();
        const daoOwner = (args.args.daoOwner as string).toLowerCase();

        // Get block for timestamp
        let purchasedAt = Math.floor(Date.now() / 1000);
        try {
            if (args.blockNumber) {
                const block = await publicClient.getBlock({ blockNumber: args.blockNumber });
                purchasedAt = Number(block.timestamp);
            }
        } catch { /* use current time as fallback */ }

        const license: FirestoreLicense = {
            licenseId,
            agentId,
            buyer,
            amount: formatEther(amount),
            amountWei: amount.toString(),
            creator,
            daoOwner,
            purchasedAt,
            txHash: txHash || args.transactionHash || '',
            blockNumber: Number(args.blockNumber || 0),
            syncedAt: Date.now(),
            status: 'complete', // from event = always complete
        };

        await writeLicenseToFirestore(license);
    } catch (err) {
        console.error('[LicenseSync] Failed to process event:', err);
    }
}

// ── Sync Engine ─────────────────────────────────────────────────────────

let isWatching = false;

/**
 * Sync past LicensePurchased events and start watching for new ones.
 * Uses lastSyncedBlock for durability across restarts.
 */
export async function startLicenseSync(): Promise<void> {
    if (isWatching) {
        console.log('[LicenseSync] Already watching, skipping duplicate start');
        return;
    }

    // 0x0 guard
    if (!RAW_ADDRESS || RAW_ADDRESS === '0x0000000000000000000000000000000000000000') {
        console.warn('[LicenseSync] ⛔ Contract address not configured. License sync is disabled.');
        return;
    }

    console.log(`[LicenseSync] Starting license sync for contract ${MARKETPLACE_ADDRESS}`);

    // 1. Sync past events from lastSyncedBlock (or last 5000 blocks as fallback)
    try {
        const currentBlock = await publicClient.getBlockNumber();
        const lastSynced = await getLastSyncedBlock();

        // Use lastSyncedBlock if available, otherwise scan last 5000 blocks
        let fromBlock: bigint;
        if (lastSynced > BigInt(0)) {
            fromBlock = lastSynced + BigInt(1);
            console.log(`[LicenseSync] Resuming from lastSyncedBlock: ${lastSynced}`);
        } else {
            fromBlock = currentBlock > BigInt(5000) ? currentBlock - BigInt(5000) : BigInt(0);
            console.log(`[LicenseSync] No lastSyncedBlock found, scanning last 5000 blocks`);
        }

        console.log(`[LicenseSync] Scanning past events from block ${fromBlock} to ${currentBlock}...`);

        const logs = await publicClient.getContractEvents({
            address: MARKETPLACE_ADDRESS,
            abi: [LICENSE_PURCHASED_EVENT],
            eventName: 'LicensePurchased',
            fromBlock,
            toBlock: currentBlock,
        });

        console.log(`[LicenseSync] Found ${logs.length} past license events`);

        for (const log of logs) {
            await processLicenseEvent(log as any, (log as any).transactionHash || '');
        }

        // Persist the current block as lastSyncedBlock
        await setLastSyncedBlock(currentBlock);
    } catch (err) {
        console.error('[LicenseSync] Past event scan failed:', err);
    }

    // 2. Watch for new events
    try {
        const unwatch = publicClient.watchContractEvent({
            address: MARKETPLACE_ADDRESS,
            abi: [LICENSE_PURCHASED_EVENT],
            eventName: 'LicensePurchased',
            onLogs: async (logs) => {
                let maxBlock = BigInt(0);
                for (const log of logs) {
                    await processLicenseEvent(log as any, (log as any).transactionHash || '');
                    const bn = BigInt((log as any).blockNumber || 0);
                    if (bn > maxBlock) maxBlock = bn;
                }
                // Update lastSyncedBlock
                if (maxBlock > BigInt(0)) {
                    await setLastSyncedBlock(maxBlock);
                }
            },
            onError: (err) => {
                console.error('[LicenseSync] Watch error:', err);
            },
        });

        isWatching = true;
        console.log('[LicenseSync] ✅ Watching for new LicensePurchased events');
    } catch (err) {
        console.error('[LicenseSync] Failed to start event watcher:', err);
    }
}
