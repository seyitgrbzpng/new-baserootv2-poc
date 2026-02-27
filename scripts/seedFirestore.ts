/**
 * Seeds Firestore with test agent + dataset matching on-chain V2 data.
 * Run from project root:  npx tsx scripts/seedFirestore.ts
 */
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Parse the service account from the env var (same as server/firebase.ts does)
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
    console.error('ERROR: FIREBASE_SERVICE_ACCOUNT not found in .env');
    process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'baserootio',
});

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

async function main() {
    const DEPLOYER_WALLET = '0x4949D6e2aEf7483aA0A4e4dA68Febad1a78C757f';
    const now = Timestamp.now();

    // 1. Seed test dataset
    const datasetId = 'ds-test-001';
    console.log(`Seeding dataset: ${datasetId}...`);
    await db.collection('avax_datasets').doc(datasetId).set({
        id: datasetId,
        title: 'DeSci Research Papers — Genomics',
        description: 'Curated dataset of open-access genomics research papers for AI training.',
        dataType: 'text',
        dataFormat: 'json',
        ownerUid: 'system',
        ownerWallet: DEPLOYER_WALLET,
        pricePerUse: 0,
        recordCount: 1500,
        status: 'active',
        createdAt: now,
        updatedAt: now,
    });
    console.log(`✅ Dataset seeded into avax_datasets`);

    // 2. Seed test agent
    const agentId = 'agent-test-001';
    console.log(`Seeding agent: ${agentId}...`);
    await db.collection('avax_agents').doc(agentId).set({
        id: agentId,
        name: 'Genomics Research Analyzer',
        description: 'AI agent specialized in analyzing genomics research proposals using curated DeSci datasets.',
        category: 'research',
        tags: ['genomics', 'desci', 'research', 'analysis'],
        creatorWallet: DEPLOYER_WALLET,
        creatorUid: 'system',
        pricePerUse: 0.01,
        currency: 'AVAX',
        datasetIds: [datasetId],
        totalUses: 0,
        successRate: 100,
        responseTimeAvg: 0,
        rating: 0,
        ratingCount: 0,
        status: 'active',
        searchKeywords: ['genomics', 'research', 'analyzer', 'desci', 'analysis'],
        createdAt: now,
        updatedAt: now,
    });
    console.log(`✅ Agent seeded into avax_agents`);

    console.log('\n🎉 Done! Refresh the marketplace to see the test agent.');
    process.exit(0);
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
