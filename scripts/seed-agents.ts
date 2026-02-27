import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is not set!');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'baserootio',
});

const db = admin.firestore();

interface AgentData {
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  endpointUrl: string;
  creatorWallet: string;
  creatorName: string;
  imageUrl: string;
  tags: string[];
  status: string;
  rating: number;
  ratingCount: number;
  totalUses: number;
  successRate: number;
  featured: boolean;
}

async function seedAgents() {
  console.log('🚀 Starting DeSci agents seeding...\n');

  // Read DeSci agents data
  const agentsData: AgentData[] = JSON.parse(
    readFileSync(join(__dirname, 'desci-agents.json'), 'utf-8')
  );

  console.log(`📦 Found ${agentsData.length} agents to seed\n`);

  const batch = db.batch();
  const now = admin.firestore.Timestamp.now();

  // Create demo users for creators
  const creatorWallets = new Set(agentsData.map(a => a.creatorWallet));
  console.log(`👥 Creating ${creatorWallets.size} demo creator accounts...\n`);

  for (const wallet of creatorWallets) {
    const creatorData = agentsData.find(a => a.creatorWallet === wallet);
    if (!creatorData) continue;

    const userRef = db.collection('users').doc();
    batch.set(userRef, {
      uid: userRef.id,
      walletAddress: wallet,
      username: creatorData.creatorName,
      email: `${creatorData.creatorName.toLowerCase().replace(/\s/g, '')}@desci.example`,
      role: 'creator',
      totalSpent: 0,
      totalEarned: Math.random() * 10000, // Random earnings for demo
      createdAt: now,
      updatedAt: now,
    });
  }

  // Add agents
  console.log('🤖 Adding agents to Firestore...\n');

  for (const agentData of agentsData) {
    const agentRef = db.collection('agents').doc();
    
    // Get creator UID (we'll use wallet as temporary UID for demo)
    const creatorUid = agentData.creatorWallet;

    batch.set(agentRef, {
      id: agentRef.id,
      name: agentData.name,
      description: agentData.description,
      category: agentData.category,
      price: agentData.price,
      currency: agentData.currency,
      endpointUrl: agentData.endpointUrl,
      creatorUid: creatorUid,
      creatorWallet: agentData.creatorWallet,
      creatorName: agentData.creatorName,
      imageUrl: agentData.imageUrl,
      tags: agentData.tags,
      status: agentData.status,
      rating: agentData.rating,
      ratingCount: agentData.ratingCount,
      totalUses: agentData.totalUses,
      successRate: agentData.successRate,
      featured: agentData.featured,
      verified: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`  ✅ ${agentData.name} (${agentData.category})`);
  }

  // Commit batch
  console.log('\n💾 Committing to Firestore...');
  await batch.commit();
  
  console.log('\n✨ Successfully seeded all agents!');
  console.log(`\n📊 Summary:`);
  console.log(`   - ${creatorWallets.size} creators`);
  console.log(`   - ${agentsData.length} agents`);
  console.log(`   - Categories: ${new Set(agentsData.map(a => a.category)).size}`);
  console.log(`   - Featured: ${agentsData.filter(a => a.featured).length}`);
}

// Run seeding
seedAgents()
  .then(() => {
    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error seeding agents:', error);
    process.exit(1);
  });
