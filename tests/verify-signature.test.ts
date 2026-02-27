import { verifyAgentSignature } from '../server/runners/httpRunner';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

async function testSignature() {
    console.log('--- Testing Agent Signature Logic ---');

    // 1. Generate a mock keypair for the agent
    const keypair = nacl.sign.keyPair();
    const publicKeyStr = bs58.encode(keypair.publicKey);
    const secretKey = keypair.secretKey;

    // 2. Mock Agent Response
    const mockResponse = {
        taskId: 'test-task-123',
        status: 'success',
        output: 'Hello from verified agent',
        metadata: { version: '1.0.0' },
        usage: { computeTime: 120 }
    };

    // 3. Agent Signs the Response
    const messageUint8 = new TextEncoder().encode(JSON.stringify(mockResponse));
    const signatureUint8 = nacl.sign.detached(messageUint8, secretKey);
    const signatureStr = bs58.encode(signatureUint8);

    // Add signature to full payload (as it would come in the POST body)
    const fullPayload = {
        ...mockResponse,
        signature: signatureStr
    };

    console.log('Public Key:', publicKeyStr);
    console.log('Signature:', signatureStr);

    // 4. Verify using our helper
    const isValid = verifyAgentSignature(publicKeyStr, signatureStr, fullPayload);

    if (isValid) {
        console.log('✅ Signature Verification SUCCESS');
    } else {
        console.error('❌ Signature Verification FAILED');
        process.exit(1);
    }

    // 5. Test Tamper Resistance
    const tamperedPayload = { ...fullPayload, output: 'Tampered content' };
    const isTamperedValid = verifyAgentSignature(publicKeyStr, signatureStr, tamperedPayload);

    if (!isTamperedValid) {
        console.log('✅ Tamper Resistance SUCCESS (rejected tampered content)');
    } else {
        console.error('❌ Tamper Resistance FAILED (accepted tampered content)');
        process.exit(1);
    }
}

testSignature().catch(console.error);
