import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const wallet = ethers.Wallet.createRandom();
    console.log("New Wallet Generated:");
    console.log("Address:", wallet.address);
    console.log("Private Key:", wallet.privateKey);

    const envPath = path.join(__dirname, "../../.env");
    let envContent = "";

    try {
        envContent = fs.readFileSync(envPath, "utf8");
    } catch (e) {
        // file might not exist
    }

    if (!envContent.includes("DEPLOYER_PRIVATE_KEY")) {
        fs.appendFileSync(envPath, `\nDEPLOYER_PRIVATE_KEY=${wallet.privateKey}\n`);
        console.log("Added DEPLOYER_PRIVATE_KEY to .env");
    } else {
        console.log("DEPLOYER_PRIVATE_KEY already exists in .env. Skipping append.");
        console.log("If you want to use this new wallet, update .env manually.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
