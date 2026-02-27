import { protocol } from "../server/protocol/ProtocolStore";
import { authGateway } from "../server/services/AuthGateway";
import { usageVerifier } from "../server/services/UsageVerifier";
import { datasetPermissionService } from "../server/services/DatasetPermissionService";
import { BaserootAgent } from "../sdk/src/index";
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import crypto from 'crypto';

// Use 'tsx' to run this: npx tsx scripts/simulate_v2_flow.ts

async function runSimulation() {
    console.log("🚀 Starting Baseroot V2 Protocol Simulation...\n");

    // Persistence Check
    const agents = await protocol.getAllAgents();
    if (agents.length > 0) {
        console.log(`💾 Persistence Verified: Found ${agents.length} existing and loaded agents.`);
    } else {
        console.log(`💾 No existing agents found in DB. Starting fresh (DB will be created).`);
    }

    // --- 1. Agent Registration (On-Chain) ---
    console.log("--- Phase 1: Registration ---");

    // Create a Keypair for the Agent (Ed25519)
    const agentKeyPair = nacl.sign.keyPair();
    const agentPublicKey = bs58.encode(agentKeyPair.publicKey);
    const creatorWallet = "Wallet_Creator_123";

    console.log(`🔑 Generated Agent Keypair. Public Key: ${agentPublicKey}`);

    const agent = await protocol.registerAgent(creatorWallet, agentPublicKey);
    console.log(`✅ Agent Registered: ${agent.agent_id} (Status: ${agent.status})`);

    // --- 2. Dataset Registration (On-Chain) ---
    const daoWallet = "Wallet_DAO_456";
    const dataset = await protocol.registerDataset(daoWallet, "QmHashOfData", 1000000); // 0.001 SOL
    console.log(`✅ Dataset Registered: ${dataset.dataset_id} (Price: ${dataset.license_policy.price} Lamports)`);


    // --- 3. User Payment & Access Request (Gateway) ---
    console.log("\n--- Phase 2: User Access ---");
    const userWallet = "Wallet_User_789";
    const paymentSignature = "Sig_Payment_ABC"; // Simulated

    console.log(`👤 User ${userWallet} paid for Agent ${agent.agent_id}...`);

    // Call AuthGateway
    const accessToken = await authGateway.generateAccessToken(userWallet, agent.agent_id, [dataset.dataset_id]);
    console.log(`🎟️  Access Token Granted: ${accessToken.substring(0, 20)}...`);


    // --- 4. Agent Execution (Off-Chain / "The Cloud") ---
    console.log("\n--- Phase 3: Agent Execution (Via SDK) ---");

    // Initialize SDK Agent
    const sdkAgent = new BaserootAgent({
        agentId: agent.agent_id,
        privateKey: bs58.encode(agentKeyPair.secretKey)
    });

    // Verify Token (Agent side via SDK)
    const decodedToken = await sdkAgent.verifyRequestToken(accessToken);
    console.log(`🤖 Agent verified User Token via SDK. User: ${decodedToken.u}`);

    // Request Dataset Access
    const signedUrl = await datasetPermissionService.grantAccess(dataset.dataset_id, userWallet, accessToken);
    console.log(`📂 Dataset Access Granted: ${signedUrl}`);

    // Simulate Compute
    const inputParams = { prompt: "Analyze this dataset" };
    const outputResult = { result: "Analysis Complete", confidence: 0.99 };

    // Hashing logic inside SDK helper in real app, but here manual for inputs
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(inputParams) + accessToken).digest('hex');
    const outputHash = crypto.createHash('sha256').update(JSON.stringify(outputResult)).digest('hex');
    const computeUnits = 500; // ms

    console.log(`⚡ Compute Finished. Units: ${computeUnits}`);


    // --- 5. Usage Attestation (Gateway) ---
    console.log("\n--- Phase 4: Verification & Settlement (Via SDK) ---");

    // Sign via SDK
    const attestation = sdkAgent.signAttestation({
        userWallet,
        requestHash,
        outputHash,
        computeUnits
    });

    console.log(`📝 SDK Signed Attestation. Sig: ${attestation.signature.substring(0, 10)}...`);

    // Submit to UsageVerifier (Gateway checks this)
    // Note: UsageVerifier on backend still uses manual verification logic which is compatible with SDK signing
    const isValid = await usageVerifier.verifyAttestation(attestation);

    if (isValid) {
        console.log(`✅ Attestation VERIFIED by Protocol!`);

        // Simulate Revenue Split
        const estimatedCost = dataset.license_policy.price + 500000; // Dataset + Agent Fee
        const revenuePlan = protocol.simulateRevenueSplit(estimatedCost);
        console.log(`💰 Revenue Split Plan: Protocol=${revenuePlan.protocol}, Creator=${revenuePlan.creator}`);

    } else {
        console.error(`❌ Attestation FAILED verification.`);
    }

    console.log("\n🚀 Simulation Complete.");
}

runSimulation().catch(console.error);
