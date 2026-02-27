import 'dotenv/config';
import { getFirestoreDb, COLLECTIONS } from './server/firebase.js';

async function test() {
    try {
        console.log('Connecting to Firestore...');
        const db = getFirestoreDb();
        console.log('Fetching agents...');
        const snapshot = await db.collection(COLLECTIONS.AGENTS).get();
        console.log('Found', snapshot.size, 'agents');
        snapshot.forEach(doc => {
            console.log('Agent:', doc.id, '->', doc.data().name);
        });
        process.exit(0);
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

test();
