import { expect } from "chai";
import { ethers } from "hardhat";
import { BaserootMarketplaceV2 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BaserootMarketplaceV2", function () {
    let marketplace: BaserootMarketplaceV2;
    let owner: SignerWithAddress;
    let platformWallet: SignerWithAddress;
    let daoWallet: SignerWithAddress;
    let creatorWallet: SignerWithAddress;
    let consumerWallet: SignerWithAddress;

    const DATASET_ID = "ds-001";
    const AGENT_ID = "agent-001";
    const AGENT_PRICE = ethers.parseEther("0.01"); // 0.01 AVAX

    beforeEach(async function () {
        [owner, platformWallet, daoWallet, creatorWallet, consumerWallet] = await ethers.getSigners();

        const Factory = await ethers.getContractFactory("BaserootMarketplaceV2");
        marketplace = await Factory.deploy(owner.address, platformWallet.address) as BaserootMarketplaceV2;
        await marketplace.waitForDeployment();
    });

    // ─── Constructor ─────────────────────────────────────────────────

    describe("Constructor", function () {
        it("should set platformWallet correctly", async function () {
            expect(await marketplace.platformWallet()).to.equal(platformWallet.address);
        });

        it("should revert if platformWallet is zero", async function () {
            const Factory = await ethers.getContractFactory("BaserootMarketplaceV2");
            await expect(
                Factory.deploy(owner.address, ethers.ZeroAddress)
            ).to.be.revertedWith("Platform wallet cannot be zero");
        });
    });

    // ─── registerDataset ─────────────────────────────────────────────

    describe("registerDataset", function () {
        it("should register a dataset and emit event", async function () {
            await expect(
                marketplace.connect(daoWallet).registerDataset(DATASET_ID, 0)
            )
                .to.emit(marketplace, "DatasetRegistered")
                .withArgs(DATASET_ID, daoWallet.address, 0);

            const ds = await marketplace.getDataset(DATASET_ID);
            expect(ds.owner_).to.equal(daoWallet.address);
            expect(ds.exists_).to.be.true;
        });

        it("should revert on empty datasetId", async function () {
            await expect(
                marketplace.connect(daoWallet).registerDataset("", 0)
            ).to.be.revertedWith("Dataset ID cannot be empty");
        });

        it("should revert on duplicate dataset", async function () {
            await marketplace.connect(daoWallet).registerDataset(DATASET_ID, 0);
            await expect(
                marketplace.connect(daoWallet).registerDataset(DATASET_ID, 0)
            ).to.be.revertedWith("Dataset already exists");
        });
    });

    // ─── registerAgent ───────────────────────────────────────────────

    describe("registerAgent", function () {
        beforeEach(async function () {
            await marketplace.connect(daoWallet).registerDataset(DATASET_ID, 0);
        });

        it("should register an agent and emit event", async function () {
            await expect(
                marketplace.connect(creatorWallet).registerAgent(AGENT_ID, AGENT_PRICE, DATASET_ID)
            )
                .to.emit(marketplace, "AgentRegistered")
                .withArgs(AGENT_ID, creatorWallet.address, AGENT_PRICE, DATASET_ID);

            const ag = await marketplace.getAgent(AGENT_ID);
            expect(ag.creator_).to.equal(creatorWallet.address);
            expect(ag.datasetId_).to.equal(DATASET_ID);
            expect(ag.price_).to.equal(AGENT_PRICE);
            expect(ag.exists_).to.be.true;
        });

        it("should revert on empty agentId", async function () {
            await expect(
                marketplace.connect(creatorWallet).registerAgent("", AGENT_PRICE, DATASET_ID)
            ).to.be.revertedWith("Agent ID cannot be empty");
        });

        it("should revert if dataset does not exist", async function () {
            await expect(
                marketplace.connect(creatorWallet).registerAgent(AGENT_ID, AGENT_PRICE, "nonexistent")
            ).to.be.revertedWith("Dataset does not exist");
        });

        it("should revert on duplicate agent", async function () {
            await marketplace.connect(creatorWallet).registerAgent(AGENT_ID, AGENT_PRICE, DATASET_ID);
            await expect(
                marketplace.connect(creatorWallet).registerAgent(AGENT_ID, AGENT_PRICE, DATASET_ID)
            ).to.be.revertedWith("Agent already exists");
        });
    });

    // ─── buyLicense ──────────────────────────────────────────────────

    describe("buyLicense", function () {
        beforeEach(async function () {
            await marketplace.connect(daoWallet).registerDataset(DATASET_ID, 0);
            await marketplace.connect(creatorWallet).registerAgent(AGENT_ID, AGENT_PRICE, DATASET_ID);
        });

        it("should split funds 40/50/10 and emit LicensePurchased", async function () {
            const creatorBefore = await ethers.provider.getBalance(creatorWallet.address);
            const daoBefore = await ethers.provider.getBalance(daoWallet.address);
            const platformBefore = await ethers.provider.getBalance(platformWallet.address);

            const tx = await marketplace.connect(consumerWallet).buyLicense(AGENT_ID, {
                value: AGENT_PRICE,
            });

            const creatorAfter = await ethers.provider.getBalance(creatorWallet.address);
            const daoAfter = await ethers.provider.getBalance(daoWallet.address);
            const platformAfter = await ethers.provider.getBalance(platformWallet.address);

            const expectedCreator = (AGENT_PRICE * 40n) / 100n;
            const expectedDao = (AGENT_PRICE * 50n) / 100n;
            const expectedPlatform = AGENT_PRICE - expectedCreator - expectedDao;

            expect(creatorAfter - creatorBefore).to.equal(expectedCreator);
            expect(daoAfter - daoBefore).to.equal(expectedDao);
            expect(platformAfter - platformBefore).to.equal(expectedPlatform);

            // Check event
            await expect(tx)
                .to.emit(marketplace, "LicensePurchased")
                .withArgs(0, AGENT_ID, consumerWallet.address, AGENT_PRICE, creatorWallet.address, daoWallet.address);
        });

        it("should increment nextLicenseId", async function () {
            expect(await marketplace.nextLicenseId()).to.equal(0);
            await marketplace.connect(consumerWallet).buyLicense(AGENT_ID, { value: AGENT_PRICE });
            expect(await marketplace.nextLicenseId()).to.equal(1);
            await marketplace.connect(consumerWallet).buyLicense(AGENT_ID, { value: AGENT_PRICE });
            expect(await marketplace.nextLicenseId()).to.equal(2);
        });

        it("should store license data correctly", async function () {
            await marketplace.connect(consumerWallet).buyLicense(AGENT_ID, { value: AGENT_PRICE });
            const lic = await marketplace.getLicense(0);
            expect(lic.buyer_).to.equal(consumerWallet.address);
            expect(lic.agentId_).to.equal(AGENT_ID);
            expect(lic.active_).to.be.true;
        });

        it("should revert if agent does not exist", async function () {
            await expect(
                marketplace.connect(consumerWallet).buyLicense("nonexistent", { value: AGENT_PRICE })
            ).to.be.revertedWith("Agent does not exist");
        });

        it("should revert if msg.value < price", async function () {
            await expect(
                marketplace.connect(consumerWallet).buyLicense(AGENT_ID, { value: ethers.parseEther("0.001") })
            ).to.be.revertedWith("Insufficient payment");
        });

        it("isLicenseActive should return correct value", async function () {
            expect(await marketplace.isLicenseActive(0)).to.be.false; // not purchased yet
            await marketplace.connect(consumerWallet).buyLicense(AGENT_ID, { value: AGENT_PRICE });
            expect(await marketplace.isLicenseActive(0)).to.be.true;
        });
    });

    // ─── Admin ───────────────────────────────────────────────────────

    describe("Admin", function () {
        it("should allow owner to setPlatformWallet", async function () {
            const newWallet = consumerWallet.address;
            await expect(marketplace.connect(owner).setPlatformWallet(newWallet))
                .to.emit(marketplace, "PlatformWalletUpdated")
                .withArgs(newWallet);
            expect(await marketplace.platformWallet()).to.equal(newWallet);
        });

        it("should revert setPlatformWallet from non-owner", async function () {
            await expect(
                marketplace.connect(consumerWallet).setPlatformWallet(consumerWallet.address)
            ).to.be.reverted;
        });

        it("should revert setPlatformWallet with zero address", async function () {
            await expect(
                marketplace.connect(owner).setPlatformWallet(ethers.ZeroAddress)
            ).to.be.revertedWith("Platform wallet cannot be zero");
        });
    });
});
