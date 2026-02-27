import { ethers } from "hardhat";

async function main() {
    const currentTimestampInSeconds = Math.round(Date.now() / 1000);
    const unlockTime = currentTimestampInSeconds + 60;

    console.log("Deploying BaserootMarketplace...");

    // Get the deploying account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    const BaserootMarketplace = await ethers.getContractFactory("BaserootMarketplace");
    const baserootMarketplace = await BaserootMarketplace.deploy(deployer.address);

    await baserootMarketplace.waitForDeployment();

    const address = await baserootMarketplace.getAddress();

    console.log(`BaserootMarketplace deployed to ${address}`);
    console.log("Owner is:", deployer.address);

    // Output for frontend integration
    console.log("\n--- Frontend Integration ---");
    console.log(`VITE_BASEROOT_MARKETPLACE_ADDRESS=${address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
