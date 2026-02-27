import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { protocol } from "./protocol/ProtocolStore";
import { authGateway } from "./services/AuthGateway";
import { usageVerifier } from "./services/UsageVerifier";
import { verifyTransaction } from "./blockchain"; // Import real verification logic

export const gatewayRouter = router({

    // --- Chain Simulation Endpoints (For MVP Dashboard) ---

    getChainState: publicProcedure
        .query(async () => {
            const agents = await protocol.getAllAgents();
            const datasets = await protocol.getAllDatasets();
            return { agents, datasets };
        }),


    registerAgent: publicProcedure
        .input(z.object({
            creator_wallet: z.string(),
            public_key: z.string()
        }))
        .mutation(async ({ input }) => {
            return await protocol.registerAgent(input.creator_wallet, input.public_key);
        }),

    registerDataset: publicProcedure
        .input(z.object({
            dao_wallet: z.string(),
            data_hash: z.string(),
            price: z.number()
        }))
        .mutation(async ({ input }) => {
            return await protocol.registerDataset(input.dao_wallet, input.data_hash, input.price);
        }),

    // --- Auth Gateway Endpoints ---

    requestAccessToken: publicProcedure
        .input(z.object({
            user_wallet: z.string(),
            agent_id: z.string(),
            payment_signature: z.string() // Proof of payment (simulated)
        }))
        .mutation(async ({ input }) => {
            // 1. Get Agent to verify price/wallet
            const agent = await protocol.getAgent(input.agent_id);
            if (!agent) {
                throw new Error("Agent not found");
            }

            // 2. Determine Price (For MVP, we assume 0.001 SOL per use or need to look up Dataset policy)
            // Ideally, we look up the dataset associated with this agent run.
            // For MVP simplicity: we charge a flat fee or check against the Agent's expected "cost" logic in ProtocolStore
            const expectedPrice = 0.001; // Hardcoded generic price for MVP tests

            console.log(`[Gateway] Verifying payment ${input.payment_signature} for agent ${input.agent_id}`);

            // 3. Verify Transaction On-Chain
            const verification = await verifyTransaction(
                input.payment_signature,
                expectedPrice,
                agent.creator_wallet
            );

            if (!verification.success) {
                console.error(`[Gateway] Payment Verification Failed: ${verification.error}`);
                throw new Error(`Payment verification failed: ${verification.error}`);
            }

            console.log(`[Gateway] Payment Verified! Amount: ${verification.amount} SOL`);

            // 4. Issue Access Token
            const token = await authGateway.generateAccessToken(input.user_wallet, input.agent_id);
            return { token };
        }),

    getAccessTokenWithCredit: publicProcedure
        .input(z.object({
            creditId: z.string(),
            userWallet: z.string()
        }))
        .mutation(async ({ input }) => {
            // Verify ownership of the credit
            const { getFirestoreDb } = await import("./firebase");
            const db = getFirestoreDb();
            const doc = await db.collection('avax_payment_credits').doc(input.creditId).get();

            if (!doc.exists) {
                throw new Error("Credit not found");
            }

            const credit = doc.data();
            if (credit?.userId !== input.userWallet) {
                throw new Error("Unauthorized: Credit does not belong to this wallet");
            }

            if (credit.status !== 'available') {
                throw new Error("Credit is not available (used or expired)");
            }

            // Generate token
            const token = await authGateway.generateAccessToken(input.userWallet, credit.agentId);
            return { token };
        }),

    // --- Usage Verification Endpoints (Called by Agent) ---

    submitAttestation: publicProcedure
        .input(z.object({
            agent_id: z.string(),
            user_wallet: z.string(),
            request_hash: z.string(),
            output_hash: z.string(),
            compute_units: z.number(),
            timestamp: z.number(),
            signature: z.string()
        }))
        .mutation(async ({ input }) => {
            const isValid = await usageVerifier.verifyAttestation(input);

            if (isValid) {
                // Trigger Revenue Router Logic (Simulated)
                // In real protocol, this might happen on-chain or via oracle
                console.log(`[Gateway] Attestation Valid. Triggering Payout...`);
                return { success: true, status: 'payout_scheduled' };
            } else {
                throw new Error('Invalid Attestation Signature');
            }
        })
});
