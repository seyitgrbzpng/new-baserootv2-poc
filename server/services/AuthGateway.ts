import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import { protocol } from '../protocol/ProtocolStore';

// Secret key for signing internal Protocol Tokens
// In production this must be in .env
const JWT_SECRET = new TextEncoder().encode('baseroot-protocol-secret-key-change-me');

export interface AccessTokenPayload {
    t: 'access';
    u: string;  // user_wallet
    a: string;  // agent_id
    d?: string[]; // dataset_ids (optional permissions)
    n: string;  // nonce
    e: number;  // expiry (timestamp)
}

export class AuthGateway {
    /**
     * Generates a short-lived Access Token for a User to call an Agent.
     * This is called AFTER the Protocol has verified the User's Payment.
     */
    async generateAccessToken(
        user_wallet: string,
        agent_id: string,
        datasets: string[] = []
    ): Promise<string> {

        // 1. Verify Agent Exists & Is Active (Protocol Check)
        const agent = await protocol.getAgent(agent_id);
        if (!agent) throw new Error('AuthGateway: Agent not found');
        if (agent.status !== 'active') throw new Error('AuthGateway: Agent is not active');

        // 2. Verify Datasets (Protocol Check)
        for (const dsId of datasets) {
            const ds = await protocol.getDataset(dsId);
            if (!ds || ds.status !== 'active') {
                throw new Error(`AuthGateway: Dataset ${dsId} invalid or disabled`);
            }
        }

        // 3. Generate Token
        const nonce = nanoid(10);
        const now = Math.floor(Date.now() / 1000);

        // Short lifespan: 5 minutes to prevent replay/sharing
        const TOKEN_LIFESPAN_SEC = 300;

        const jwt = await new SignJWT({
            t: 'access',
            u: user_wallet,
            a: agent_id,
            d: datasets,
            n: nonce
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt(now)
            .setExpirationTime(now + TOKEN_LIFESPAN_SEC)
            .sign(JWT_SECRET);

        console.log(`[AuthGateway] Issued Token for User ${user_wallet.substring(0, 6)}... -> Agent ${agent_id}`);
        return jwt;
    }

    /**
     * Verifies an Access Token.
     * Used by the Agent (via SDK) or by the Protocol Gateway if proxying.
     */
    async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            return payload as unknown as AccessTokenPayload;
        } catch (err) {
            throw new Error('AuthGateway: Invalid Token');
        }
    }
}

export const authGateway = new AuthGateway();
