import { protocol } from '../protocol/ProtocolStore';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export interface UsageAttestation {
    agent_id: string;
    user_wallet: string;
    request_hash: string; // Hash of the input params + token
    output_hash: string;  // Hash of the result
    compute_units: number; // Ms or distinct units
    timestamp: number;
    signature: string; // Signed by Agent's Private Key
}

export class UsageVerifier {

    /**
     * Verifies that an Agent actually performed work.
     * This is the "Proof of Compute" trigger for Revenue Distribution.
     */
    async verifyAttestation(attestation: UsageAttestation): Promise<boolean> {
        const { agent_id, user_wallet, request_hash, output_hash, compute_units, timestamp, signature } = attestation;

        // 1. Get Agent Public Key from Protocol
        const agent = await protocol.getAgent(agent_id);
        if (!agent) {
            console.error(`[UsageVerifier] Agent ${agent_id} not found in registry`);
            return false;
        }

        // 2. Reconstruct the Message that was signed
        // Format: "${agent_id}:${user_wallet}:${request_hash}:${output_hash}:${compute_units}:${timestamp}"
        const messageString = `${agent_id}:${user_wallet}:${request_hash}:${output_hash}:${compute_units}:${timestamp}`;
        const messageBytes = new TextEncoder().encode(messageString);

        // 3. Verify Signature (Ed25519)
        try {
            const signatureBytes = bs58.decode(signature);
            const publicKeyBytes = bs58.decode(agent.public_key);

            const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

            if (!isValid) {
                console.error(`[UsageVerifier] Invalid Signature for Agent ${agent_id}`);
                return false;
            }

            console.log(`[UsageVerifier] Verified Attestation: Agent ${agent_id} units: ${compute_units}`);
            return true;

        } catch (err) {
            console.error(`[UsageVerifier] Crypto Error:`, err);
            return false;
        }
    }
}

export const usageVerifier = new UsageVerifier();
