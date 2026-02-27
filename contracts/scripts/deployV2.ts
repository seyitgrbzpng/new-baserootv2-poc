import { ethers } from "hardhat";

async function main() {
    console.log("Deploying BaserootMarketplaceV2...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Platform wallet — defaults to deployer if not set via env
    const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
    console.log("Platform wallet:", platformWallet);

    const Factory = await ethers.getContractFactory("BaserootMarketplaceV2");
    const marketplace = await Factory.deploy(deployer.address, platformWallet);
    await marketplace.waitForDeployment();

    const address = await marketplace.getAddress();

    console.log(`\nBaserootMarketplaceV2 deployed to: ${address}`);
    console.log("Owner:", deployer.address);
    console.log("Platform Wallet:", platformWallet);

    console.log("\n--- Frontend Integration ---");
    console.log(`VITE_BASEROOT_MARKETPLACE_ADDRESS=${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
