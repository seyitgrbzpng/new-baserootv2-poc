import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

// Default private key for development (do not use in production)
// This strictly corresponds to a test account
const TEST_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
    solidity: "0.8.20",
    networks: {
        fuji: {
            url: "https://api.avax-test.network/ext/bc/C/rpc",
            chainId: 43113,
            accounts: [TEST_PRIVATE_KEY]
        },
        hardhat: {
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};

export default config;
