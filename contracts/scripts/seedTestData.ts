import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    const CONTRACT_ADDRESS = "0x3e251B4d78b0351A9E5a7d3df134b8e5870e7782";
    const marketplace = await ethers.getContractAt("BaserootMarketplaceV2", CONTRACT_ADDRESS);

    // 1. Register a test dataset (DAO role)
    const DATASET_ID = "ds-test-001";
    console.log(`\n--- Registering Dataset: ${DATASET_ID} ---`);
    const tx1 = await marketplace.registerDataset(DATASET_ID, 0);
    const receipt1 = await tx1.wait();
    console.log(`✅ Dataset registered! Tx: https://testnet.snowtrace.io/tx/${receipt1?.hash}`);

    // 2. Register a test agent linked to that dataset (Creator role)
    const AGENT_ID = "agent-test-001";
    const AGENT_PRICE = ethers.parseEther("0.01"); // 0.01 AVAX
    console.log(`\n--- Registering Agent: ${AGENT_ID} (price: 0.01 AVAX) ---`);
    const tx2 = await marketplace.registerAgent(AGENT_ID, AGENT_PRICE, DATASET_ID);
    const receipt2 = await tx2.wait();
    console.log(`✅ Agent registered! Tx: https://testnet.snowtrace.io/tx/${receipt2?.hash}`);

    // 3. Verify stored data
    console.log("\n--- Verifying on-chain data ---");
    const dataset = await marketplace.getDataset(DATASET_ID);
    console.log(`Dataset "${DATASET_ID}": owner=${dataset.owner_}, pricePerUse=${dataset.pricePerUse_}, exists=${dataset.exists_}`);

    const agent = await marketplace.getAgent(AGENT_ID);
    console.log(`Agent "${AGENT_ID}": creator=${agent.creator_}, datasetId=${agent.datasetId_}, price=${ethers.formatEther(agent.price_)} AVAX, exists=${agent.exists_}`);

    console.log("\n🎉 Test data created successfully! You can now test buyLicense from the frontend.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
