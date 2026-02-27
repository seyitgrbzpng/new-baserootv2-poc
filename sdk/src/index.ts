import { jwtVerify } from 'jose';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import crypto from 'crypto';

export interface AgentConfig {
    agentId: string;
    privateKey: string; // Base58 encoded Ed25519 private key
    protocolPublicKey?: string; // Optional: To verify Protocol's JWT signatures
}

export class BaserootAgent {
    private config: AgentConfig;

    constructor(config: AgentConfig) {
        this.config = config;
    }

    /**
     * middleware to verify the incoming 'Authorization' header.
     * Returns the decoded token payload if valid, throws if not.
     */
    async verifyRequestToken(token: string): Promise<any> {
        try {
            // In a real scenario, we verify against the Protocol's Public Key.
            // For MVP/Simulation, we use the shared secret (simulated).
            // WARNING: IN PRODUCTION THIS MUST BE ASYMMETRIC VERIFICATION.
            const JWT_SECRET = new TextEncoder().encode('baseroot-protocol-secret-key-change-me');

            const { payload } = await jwtVerify(token, JWT_SECRET);

            if (payload.a !== this.config.agentId) {
                throw new Error(`Token intended for agent ${payload.a}, not me (${this.config.agentId})`);
            }

            return payload;
        } catch (err) {
            throw new Error('Invalid or Expired Baseroot Token');
        }
    }

    /**
     * Generates the Attestation signature required to claim payment.
     */
    signAttestation(params: {
        userWallet: string;
        requestHash: string; // Hash of input
        outputHash: string;  // Hash of output result
        computeUnits: number;
    }) {
        const timestamp = Date.now();
        const { userWallet, requestHash, outputHash, computeUnits } = params;

        // Message Format: "${agent_id}:${user_wallet}:${request_hash}:${output_hash}:${compute_units}:${timestamp}"
        const messageString = `${this.config.agentId}:${userWallet}:${requestHash}:${outputHash}:${computeUnits}:${timestamp}`;
        const messageBytes = new TextEncoder().encode(messageString);

        const secretKeyBytes = bs58.decode(this.config.privateKey);
        const signatureBytes = nacl.sign.detached(messageBytes, secretKeyBytes);

        return {
            agent_id: this.config.agentId,
            user_wallet: userWallet,
            request_hash: requestHash,
            output_hash: outputHash,
            compute_units: computeUnits,
            timestamp,
            signature: bs58.encode(signatureBytes)
        };
    }

    /**
     * Helper to hash data (SHA-256)
     */
    hash(data: any): string {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }
}
