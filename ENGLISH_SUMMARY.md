# Baseroot V2 — Project Summary

## What is Baseroot?

Baseroot V2 is a **decentralized licensing infrastructure for AI agents** powered by DAO-owned datasets, built on the **Avalanche Fuji C-Chain**.

It solves a core problem: *How can AI agents ethically and transparently use proprietary datasets while ensuring fair revenue for data owners?*

## How It Works

1. **DAOs upload verified datasets** with on-chain provenance (`registerDataset`)
2. **Developers build AI agents** and link them to DAO datasets (`registerAgent`)
3. **Consumers purchase a license** to use an agent — payment is split **atomically** by the smart contract:
   - **50% → DAO** (data owner royalty)
   - **40% → Creator** (agent developer)
   - **10% → Protocol** (Baseroot treasury)
4. **Consumer sends a prompt** → Backend retrieves confidential DAO data → LLM generates analysis → **Raw data is never exposed**

## Key Technical Features

| Feature | Implementation |
|---------|---------------|
| Revenue Split | On-chain, atomic 3-way split in `buyLicense()` |
| Duplicate Prevention | `licenseExists` mapping blocks repeat purchases |
| License Verification | `hasLicense()` view function + Firestore sync |
| Data Privacy | Server-side isolation — `dataContent` stripped before API response |
| Prompt Security | Hard system prompt: "NEVER leak raw dataset text" |
| Reentrancy Guard | OpenZeppelin `ReentrancyGuard` on all payable functions |

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Frontend    │───▶│  Backend     │───▶│  Smart Contract  │
│  React/Vite  │    │  tRPC/Node   │    │  BaserootV2.sol  │
│  Wagmi/Viem  │    │  Firebase    │    │  Avalanche Fuji  │
└─────────────┘    └──────────────┘    └──────────────────┘
       │                   │                     │
  3 Pillars:          License Sync:         On-chain:
  /marketplace        Event listener        registerDataset
  /creator            Firestore write       registerAgent
  /dao                Retry + fallback      buyLicense
```

## Live Deployment

- **Contract:** [`0x46A354d117D3fC564EB06749a12E82f8F1289aA8`](https://testnet.snowtrace.io/address/0x46A354d117D3fC564EB06749a12E82f8F1289aA8)
- **Network:** Avalanche Fuji Testnet (Chain ID: 43113)
- **Test Data:** Dataset `ds-test-001` + Agent `agent-test-001` registered and verified

## What Makes It Special

- **Real blockchain execution** — not mocked. Every license purchase creates a verifiable Snowtrace transaction.
- **Transaction Proof Card** — UI shows tx hash, contract address, network, and visual revenue split bar after purchase.
- **Confidential Inference** — DAO data never reaches the frontend or the developer. Server-side isolation with strict prompt constraints.
- **3-Pillar UX** — Dedicated interfaces for Consumers, Creators, and DAOs.

## Judge Evidence File

| Component | Information & Explorer Links |
| :--- | :--- |
| **Contract** | `BaserootMarketplaceV2` (Fuji Testnet) |
| **Address** | [`0x46A354d117D3fC564EB06749a12E82f8F1289aA8`](https://testnet.snowtrace.io/address/0x46A354d117D3fC564EB06749a12E82f8F1289aA8) |
| **Demo Agent** | `agent-test-001` |
| **Demo Dataset**| `ds-test-001` |

## Final Demo Script (2 Minutes)

**"Baseroot turns AI agents into licensed digital products."**

1. **Dataset Register:** Show DAO uploading verified data pool via Creator Studio.
2. **Agent Register:** Show Developer creating an AI agent linked to the DAO dataset.
3. **License Purchase:** Show Consumer buying a license on the Marketplace with AVAX.
4. **Avalanche Transaction:** Show metamask confirmation and fast finality.
5. **On-Chain Verification:** Show the Transaction Proof Card linking to Snowtrace, proving the 50/40/10 revenue split.
6. **AI Agent Unlock:** Show the Confidential Inference run securely without raw data exposure.

---

*Built for Avalanche Build Games · Powered by Avalanche C-Chain*
© 2026 Baseroot.io