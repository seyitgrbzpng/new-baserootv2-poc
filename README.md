# Baseroot V2: Decentralized Knowledge Liquidity & AI Agent Commerce Protocol

Baseroot V2 is a decentralized protocol designed to enable AI agents to access DAO-owned verified datasets under programmable licenses, while automatically distributing revenue to data owners based on actual usage.

![Baseroot Logo](./client/public/logo.svg)

## Protocol Abstract

The protocol introduces a new economic layer where knowledge becomes a yield-generating digital asset. By extending the AI agent marketplace model with **Verified Data Pools** and a trustless revenue routing mechanism, Baseroot V2 ensures fair attribution, transparency, and sustainable revenue models for data producers.

> [!IMPORTANT]
> For the complete technical specification and long-term vision, please refer to the **[Baseroot V2 Whitepaper](./WHITEPAPER.md)**.

## Economic Model: Revenue Routing (50/40/10)

Payments are triggered by successful inference executions or license acquisitions. Revenue is automatically routed between the dataset-owning DAO, the AI agent developer, and the Baseroot protocol via the `BaserootMarketplaceV2.sol` smart contract.

```mermaid
graph TD
    User["Consumer (User)"] -- 100% AVAX --> Contract["Revenue Router (V2)"]
    Contract -- 50% --> DAO["DAO (Data Owner)"]
    Contract -- 40% --> Creator["Agent Developer"]
    Contract -- 10% --> Protocol["Protocol Treasury"]
```

- **Liquidity Layer:** Knowledge assets generate real-time yield for contributors.
- **On-Chain Verification:** All settlements are processed on the Avalanche Fuji Testnet and are verifiable via Snowtrace.

## System Architecture

The Baseroot V2 architecture consists of three primary layers:

1. **On-Chain Registries:** Immutable registries for Agents and Datasets with cryptographic provenance.
2. **Verified Data Pools:** DAO-controlled datasets with programmable licenses and usage-based royalty policies.
3. **Zero-Knowledge Inference:** A secure execution environment where AI agents process sensitive DAO data without direct download or exposure, ensuring data sovereignty.

## Technical Specifications

- **Blockchain:** Avalanche Fuji (Chain ID: 43113)
- **Smart Contract:** `0x3e251B4d78b0351A9E5a7d3df134b8e5870e7782`
- **Application Stack:** React 19, Vite, TailwindCSS 4, Wagmi/Viem, tRPC, Firebase Firestore.

## Deployment and Integration

### Dependencies
Ensure Node.js 22+ and pnpm 10+ are installed.

### Setup
1. **Initialize Project:** `pnpm install`
2. **Configure Environment:** Create a `.env` file with the protocol contract address.
3. **Launch Protocol:** `pnpm dev`

---
**Foundational Liquidity Layer for Decentralized Knowledge**
*Powered by Avalanche (AVAX)*
© 2026 Baseroot.io
