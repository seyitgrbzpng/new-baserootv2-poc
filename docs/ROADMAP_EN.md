# Baseroot Roadmap
**Infrastructure for the Decentralized AI Economy**

## Core Vision

Baseroot is building decentralized infrastructure for the AI agent economy. Its purpose is to create a programmable marketplace where:
- dataset owners can register and monetize data
- AI developers can build and deploy agents on top of datasets
- users can license those agents
- and revenue can be settled automatically on-chain

At its core, Baseroot connects:
**Data → AI Agents → Licensing → Revenue**

## 1. Strategic Product Direction
**What Baseroot is really becoming**

Baseroot is not just an AI marketplace. It is evolving toward an AI economy infrastructure layer.

Over time, Baseroot should become:
- a dataset registry
- an AI agent deployment layer
- a programmable licensing protocol
- a revenue settlement primitive
- and eventually a knowledge liquidity protocol

This means the long-term product direction is:
> Turn data into an economic asset for AI, and turn AI agents into programmable digital businesses.

---

## 2. Product Maturity Path

Baseroot should grow in a staged way.

### Phase 1 — MVP Foundation (Current Stage)
**Goal:** Prove the core economic loop works.

**What exists in the current MVP:**
- Dataset on-chain registry
- AI agent deployment flow
- Agent marketplace
- Licensing mechanism
- Revenue split smart contract
- Middleware for syncing blockchain activity
- Frontend for role-based interaction

**Core workflow:**
1. A DAO or dataset owner registers a dataset.
2. A creator deploys an AI agent connected to that dataset.
3. A user licenses the agent.   
4. The smart contract settles the payment.
5. Revenue is split automatically.

**Current economic model:**
- 50% to dataset owner / DAO
- 40% to AI agent creator
- 10% to platform

**Current stack:**
- Avalanche Fuji smart contracts
- Node.js middleware
- Firebase / Firestore
- React frontend

**Why this phase matters:**
This phase proves that Baseroot is not just a concept. It proves the existence of a working primitive: **AI agent licensing with on-chain settlement**.

---

### Phase 2 — Dataset Discovery Layer
**Goal:** Turn datasets into a real marketplace, not just uploaded records.

**Objectives:**
- Add dataset categories
- Add search and filtering
- Create verified dataset labeling
- Introduce metadata standards
- Improve dataset discoverability for creators

**Key product features:**
- Dataset category system
- Search and browse interface
- Verified dataset badges
- Metadata templates
- Standard fields for licensing terms, scope, origin, and usage

**Creator workflow:**
Creator starts agent deployment → Selects a category → Browses relevant datasets → Attaches a dataset → Deploys the agent.

**Strategic impact:**
This phase creates the first real bridge between dataset supply and agent creation demand. It moves Baseroot from a basic registry to an actual data-to-agent marketplace layer.

---

### Phase 3 — Dataset-Aware AI Agents
**Goal:** Make AI agents meaningfully linked to datasets.

**Why Stage 3 matters:**
This is the phase that makes Baseroot much stronger as infrastructure. Right now, the MVP proves the economic loop. Stage 3 should prove the intelligence layer is dataset-aware, not just marketplace-aware.

**What Stage 3 should achieve:**
- Each agent should clearly reference one or more datasets.
- The system should show dataset-agent dependency.
- Creators should be able to build agents with context from selected datasets.
- Users should understand what knowledge source an agent is built on.

**Required features:**
- Agent metadata structure
- Dataset linking
- Dataset-aware deployment wizard
- Agent detail pages showing linked datasets
- Category-aware deployment flow

**Example metadata:**
```json
{
  "agent_id": "123",
  "dataset_id": "456",
  "category": "web3",
  "creator_wallet": "0x...",
  "license_type": "pay-per-license"
}
```

**Strategic impact:**
This phase moves Baseroot from an *AI marketplace* to *dataset-aware AI infrastructure*. This is extremely important for both judges and future investors because it makes the protocol architecture much clearer.

---

## 3. Detailed Stage 3 Plan
**What you should build if you advance to Stage 3**

Stage 3 should not try to become a huge, fully mature product. It should make the MVP deeper, clearer, and more infrastructure-like. The best strategy is: 
> Take the existing MVP foundation and add one layer of product depth that clearly shows where Baseroot is going.

### Stage 3 Primary Objective
Build the first true version of **Dataset-aware agent infrastructure**.

This means that in Stage 3, your system should show a creator can discover datasets, choose one, deploy an agent on top of it, and the user can see that relationship before licensing. That alone would make Baseroot much more compelling.

### Stage 3 Product Scope

**A. Dataset Discovery Module**
Build a marketplace-style discovery system for datasets.
- **Must-have features:** categories, search, filters, verification tags, better dataset cards.
- **Suggested dataset fields:** name, description, category, owner / DAO, pricing model, verification status, dataset format, usage terms.
*Why this matters:* Judges need to see that creators are not selecting data randomly. There has to be a visible data marketplace logic.

**B. Dataset-Aware Agent Deployment**
This should become the strongest Stage 3 screen.
- **Suggested deployment flow:** Choose agent type → Choose category → Browse matching datasets → Select dataset → Define agent metadata → Deploy agent.
*What this proves:* This flow proves Baseroot is more than a marketplace. It becomes an agent deployment protocol with structured knowledge inputs.

**C. Agent Profile With Dataset Context**
Each agent page should show: linked dataset, dataset owner, category, license price, revenue split explanation, usage info.
*Why this matters:* This creates transparency for users and shows the core Baseroot thesis: This agent has an identifiable economic and knowledge source.

**D. Stronger Licensing UX**
Improve the license purchase experience.
- **Suggested additions:** license details before purchase, simple explanation of revenue routing, confirmation of on-chain settlement, visible proof that payment was split.
*Why this matters:* The payment event is the strongest blockchain moment in the product. That must feel clear and intentional.

**Stage 3 Demo Goal:**
Your Stage 3 demo should communicate one message:
> Baseroot enables developers to discover datasets, deploy dataset-aware AI agents, and license them with on-chain programmable revenue distribution.

---

## 4. Stage 3 Technical Plan

### Smart Contract Layer
You likely do not need a full rewrite. You should extend the existing contract logic only where needed.
- **Keep:** dataset registry, agent registration, license purchase, revenue split.
- **Add or improve:** explicit dataset-agent linking, cleaner metadata references, better event design for indexing, clearer license event payloads.

### Middleware Layer
This layer becomes more important in Stage 3.
- **Responsibilities:** sync dataset registrations, sync agent deployments, resolve linked dataset metadata, sync license purchases, build fast frontend views from on-chain events.
- **Important improvement:** Create a clean mapping structure (`dataset ID`, `agent ID`, `creator`, `owner`, `category`, `linked dataset(s)`). This will make the UI much stronger.

### Frontend Layer
This is where Stage 3 will feel significantly better.
- **Priority screens:** dataset marketplace, deploy agent wizard, agent detail page, license confirmation flow, transaction/revenue visibility.
- **UI priority:** Do not try to make the app huge. Make it clear. Judges respond better to clean steps, visible logic, obvious economic flow than to overloaded interfaces.

---

## 5. Stage 3 Deliverables
If you reach Stage 3, your team should prepare the following:

**Product deliverables:**
- improved dataset marketplace
- dataset-aware deployment flow
- upgraded agent profile pages
- clearer licensing UX
- stronger on-chain flow visibility

**Technical deliverables:**
- linked metadata model
- updated middleware sync
- event-driven state updates
- cleaner contract event indexing

**Narrative deliverables:**
- clear one-line primitive
- updated architecture diagram
- roadmap slide
- “why Avalanche” explanation
- future protocol vision

**Demo deliverables:**
- 3 to 5 minute clean walkthrough
- one story, one flow
- no confusion, no unnecessary branching

---

## 6. What Stage 3 Judges Will Likely Want to See

If you advance, judges will likely ask themselves:

1. **Is this really infrastructure?**
   Yes, because Baseroot creates primitives for dataset registration, agent deployment, licensing, and revenue settlement.
2. **Is blockchain essential here?**
   Yes, because ownership and payment routing happen on-chain.
3. **Is there a real economic model?**
   Yes, because Baseroot aligns data owners, AI creators, and platform incentives.
4. **Is there a real path beyond MVP?**
   Yes, through dataset-aware agents, proof of data usage, composable agents, and future developer layer / SDK.

---

## 7. Post-Stage 3 Roadmap
Once Stage 3 is complete, Baseroot should continue evolving in a structured way.

### Phase 4 — Proof of Data Usage (PoDU)
**Goal:** Prove that a dataset was actually used by an AI agent.
**Why it matters:** This is the biggest long-term trust problem in AI economics. If Baseroot can eventually prove data usage, then data owners can be paid not just for listing data, but for actual usage.
**Potential approaches:** usage receipts, signed execution logs, zk verification, trusted execution environments.
**Strategic impact:** This could become Baseroot’s strongest long-term moat.

### Phase 5 — AI Agent Composability
**Goal:** Allow agents to call other agents.
**Example:** Research Agent → Market Analysis Agent → Trading Strategy Agent. One agent invokes another, creating multi-agent workflows.
**Why it matters:** This transforms Baseroot from a single-agent marketplace into an AI agent economy network, expanding revenue splitting from `[owner + creator + platform]` to multiple creators and service layers.

### Phase 6 — Marketplace Expansion
**Goal:** Turn Baseroot into a more complete AI agent commercial layer.
**Features:** reputation system, ranking, usage analytics, subscriptions, pay-per-call, dynamic pricing, creator dashboards.
**Why it matters:** This phase supports retention and monetization.

### Phase 7 — Decentralized Compute Layer
**Goal:** Connect agent execution to decentralized compute.
**Possible integrations:** decentralized GPU networks, inference node providers, execution markets.
**Why it matters:** At this stage, Baseroot stops being just licensing infrastructure and starts becoming a more complete execution economy.

### Phase 8 — Knowledge Liquidity Protocol
**Goal:** Transform knowledge into a programmable economic asset class.
**Final chain:** Knowledge → Dataset → Agent → Licensing → Revenue.
**End-state identity:** At this phase, Baseroot becomes **Decentralized Knowledge Liquidity Infrastructure**. This is the strongest final narrative.

---

## 8. The Most Important Stage 3 Positioning
For Stage 3, your messaging must become sharper. Do not present Baseroot as only an AI tool, a marketplace app, or a dashboard. Present Baseroot as:
- infrastructure for dataset-aware AI agents
- programmable licensing for AI
- on-chain revenue settlement for AI ecosystems

**Best Stage 3 one-liner:**
> Baseroot is infrastructure for discovering datasets, deploying dataset-aware AI agents, and licensing them on-chain.

**Slightly more ambitious version:**
> Baseroot is decentralized infrastructure for the AI agent economy, connecting datasets, creators, agents, and programmable licensing on Avalanche.

---

## 9. Recommended Internal Team Priorities for Stage 3
1. **Product clarity:** Make the flow easier to understand.
2. **Dataset-agent linking:** This is the most important functional upgrade.
3. **Demo strength:** Everything should support one clean demo story.
4. **Narrative consistency:** Your deck, script, UI, and explanation should all say the same thing.
5. **Future-facing roadmap:** Show a believable next step after Stage 3.

---

## 10. Suggested Stage 3 Execution Timeline

- **Week 1:** finalize Stage 3 scope, define metadata model, design dataset marketplace improvements, design dataset-aware deployment flow
- **Week 2:** implement category system, implement dataset search and selection, link agents to datasets, update middleware sync
- **Week 3:** improve agent detail page, improve licensing flow, expose linked dataset context, test contract and event flow
- **Week 4:** polish demo path, refine UI copy, create updated architecture diagram, finalize pitch narrative, rehearse demo repeatedly

---

## 11. Final Strategic Conclusion
Baseroot should not try to become everything at once. The right path is:
- **Step 1:** Prove the economic primitive
- **Step 2:** Prove the dataset-agent relationship
- **Step 3:** Prove the protocol can scale into a real AI economy layer

That is the path from MVP to a category-defining infrastructure project.

---

## 12. Final Vision Statement
> **Baseroot is building the infrastructure layer for the decentralized AI economy — where datasets become assets, AI agents become products, and licensing becomes programmable on-chain commerce.**
