import admin from 'firebase-admin';
import fs from 'fs';

const TARGET_WALLET = 'FbwWHaMmxHenZZgFBTh51d2i6oUhUucFbfEJXnPBDiq';

async function diagnose() {
    console.log(`[Diagnostic] Analyzing data for wallet: ${TARGET_WALLET}`);

    const serviceAccountPath = 'C:\\Users\\user\\Downloads\\baserootio-firebase-adminsdk-fbsvc-87ca22db91.json';
    if (fs.existsSync(serviceAccountPath)) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;
        console.log(`[Diagnostic] Using service account: ${serviceAccountPath}`);
    }

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    }

    const db = admin.firestore();

    // 1. Check Payments
    console.log('\n--- Checking PAYMENTS collection ---');
    const paymentsSnapshot = await db.collection('payments')
        .where('fromWallet', '==', TARGET_WALLET)
        .get();

    console.log(`Found ${paymentsSnapshot.size} payments where fromWallet == ${TARGET_WALLET}`);

    // 1c. Global summary
    console.log('\n--- Global Payments Summary ---');
    const allPayments = await db.collection('payments').orderBy('createdAt', 'desc').limit(10).get();
    console.log(`Total payments in system (last 10): ${allPayments.size}`);
    allPayments.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}, From: ${data.fromWallet}, To: ${data.toWallet}, Amount: ${data.amount}`);
    });

    // 2. Check Payment Credits
    console.log('\n--- Checking PAYMENT_CREDITS collection ---');
    const creditsSnapshot = await db.collection('payment_credits')
        .limit(10)
        .get();
    console.log(`Total credits in system: ${creditsSnapshot.size}`);

    // 3. Connectivity check
    const agents = await db.collection('agents').limit(1).get();
    console.log(`Firestore connection OK. Agent count: ${agents.size}`);
}

diagnose().catch(console.error);
