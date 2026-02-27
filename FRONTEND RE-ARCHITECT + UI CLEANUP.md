# ANTIGRAVITY PROMPT — BASEROOT MARKETPLACE V2 (FRONTEND RE-ARCHITECT + UI CLEANUP)

## 0) Role
You are a senior Frontend Architect + UI/UX engineer. Your job is to refactor and reorganize the existing frontend so it looks professional, is maintainable, and matches the product spec below. Keep the existing backend + smart contract integration working.

## 1) Context (Product Spec)
Project: **Baseroot Marketplace V2**
Design: Deep Dark + Glassmorphism, Amber accent `#F1A70E`, white typography.
3-Pillar structure:
1) Landing `/` : Vision + onboarding modal (role selection: Consumer / Creator / DAO)
2) Marketplace `/marketplace` : Consumers browse agents, filter categories, buy license (Fuji AVAX)
3) Creator `/creator` : Create agents, set pricing, registerAgent on-chain, attach dataset IDs
4) DAO `/dao` : Upload datasets, registerDataset on-chain, data provenance, privacy

Blockchain:
- Avalanche Fuji (43113)
- Contract `BaserootMarketplace.sol` (already deployed)
- wagmi + viem in use; solana libs removed

Database:
- Firebase Firestore with namespacing:
  - `avax_agents`, `avax_datasets`, `avax_payments`, `avax_users`, `avax_inferences`
Key privacy rule:
- dataset `dataContent` must never be sent to frontend; only metadata.

Payments:
- Using **Fuji test AVAX**
- Revenue split target: **40% Agent Dev / 50% DAO / 10% Baseroot**
- Prefer PoC flow: **buyLicense on-chain** then inference off-chain (faster UX). If current implementation is `pay()` per chat, keep working but restructure UI so migration is easy.

LLM:
- ChainGPT is integrated for DAO research/agent behavior generation; enforce zero-knowledge prompt constraints.

## 2) Goal (Frontend)
Frontend is currently messy/confusing. You will:
- Re-architect routing, layout, and components for clarity.
- Make the UI consistent, minimal, professional.
- Reduce component duplication, centralize shared UI.
- Ensure role-based navigation is clean (Consumer/Creator/DAO).
- Keep all existing features functional.
- Improve loading/error states and empty states.
- Ensure "Testnet" status is always visible.

## 3) Hard Constraints (Do NOT break)
- Do NOT expose dataset `dataContent` anywhere in frontend.
- Do NOT break wallet connect, wagmi/viem config, chain switching logic.
- Keep existing TRPC / API contracts working (do not change request/response shapes unless necessary; if you must, update both sides).
- Keep dark theme & amber accent.
- Avoid massive rewrites of business logic; focus on re-structure + UI polish.
- No alert(); use `sonner` toasts.
- Keep `NetworkIndicator` (or re-implement equivalently).

## 4) Deliverables (Must output)
A) New frontend architecture (folders + route structure)
B) Updated layouts (AppShell + role-specific shells)
C) Polished UI:
   - consistent spacing/typography
   - glass cards
   - page headers
   - clean tables/cards
   - empty/loading/error states
D) Onboarding:
   - Landing role picker modal
   - Role remembered (localStorage)
E) Marketplace:
   - Agent listing with filters
   - Agent detail drawer/page
   - Buy License CTA
F) Creator:
   - Agent create wizard (2-3 steps)
   - Pricing input
   - Dataset attach (IDs)
   - Register on-chain button with tx status UI
G) DAO:
   - Dataset upload UI
   - Provenance registerDataset button with tx status UI
   - Data list table (metadata only)
H) UI consistency:
   - top nav + left sidebar (role dependent)
   - breadcrumb where helpful

## 5) Route & IA (Information Architecture)
Implement exactly these routes (map to existing pages, refactor as needed):
- `/` Landing
- `/marketplace` Marketplace home (agents list)
- `/marketplace/agents/:id` Agent detail (or modal route)
- `/creator` Creator dashboard
- `/creator/agents` Agent list
- `/creator/agents/new` Create agent wizard
- `/creator/agents/:id` Agent detail/manage
- `/dao` DAO dashboard
- `/dao/datasets` Dataset list
- `/dao/datasets/new` Upload dataset
- `/settings` (optional) wallet + network info + profile

Add `NotFound` and `Unauthorized` pages.

## 6) Layout System (Make it professional)
Create 3 reusable layouts:

### 6.1 PublicLayout (Landing)
- Minimal top bar (logo + connect wallet)
- Hero + feature sections
- CTA opens RoleModal

### 6.2 AppShell (Authenticated area)
- Topbar: Logo, network indicator, wallet, role switch
- Sidebar: role-specific nav
- Content: page header + actions + content
- Use consistent max width, spacing, page title

### 6.3 Role-based navigation
- Consumer: Marketplace
- Creator: Creator dashboard/agents
- DAO: DAO dashboard/datasets

Role is selected from the modal on landing, stored in localStorage:
- key: `baseroot_role` (values: consumer | creator | dao)

If no role, redirect to `/` with toast "Select a role to continue".

## 7) Component System (Refactor)
Create and use these shared components:
- `AppTopbar`
- `AppSidebar`
- `PageHeader` (title + subtitle + right actions)
- `GlassCard` (consistent glass look)
- `StatCard` (dashboard metrics)
- `DataTable` wrapper (for agents/datasets)
- `TxButton` (handles tx states: idle → signing → pending → confirmed → error)
- `EmptyState`
- `ErrorState`
- `LoadingState`

Use shadcn/ui primitives; keep style consistent.

## 8) UI Style Guide (Strict)
- Background: deep black
- Cards: glassmorphism (blur + translucent)
- Accent: Amber #F1A70E for buttons/links/highlights
- Typography: clear hierarchy
- Avoid visual clutter; whitespace is premium
- Always show testnet label: "Fuji Testnet"

## 9) Implementation Plan (Step-by-step)
### Step 1 — Audit
- Scan current routes/pages.
- Identify duplicates and dead files.
- List all current screens and map them to the new route structure.

### Step 2 — Create new folder structure (see below)
- Move files without breaking imports (update paths).

### Step 3 — Build layouts + shared components
- Implement PublicLayout + AppShell + role nav.

### Step 4 — Refactor each feature area
- marketplace feature
- creator feature
- dao feature

### Step 5 — Polish states
- skeleton loaders
- empty state copy
- error boundaries/toasts

### Step 6 — Final QA
- ensure wallet connect works
- ensure network indicator works
- ensure flows work end-to-end
- run typecheck + lint

## 10) Required Folder Structure (Implement)
Refactor `/src` into:

/src
  /app
    App.tsx (router)
    providers.tsx (wagmi, trpc, theme, toast)
    routes.tsx
  /layouts
    PublicLayout.tsx
    AppShell.tsx
  /shared
    /ui (shadcn wrappers if needed)
    /components
      AppTopbar.tsx
      AppSidebar.tsx
      PageHeader.tsx
      GlassCard.tsx
      TxButton.tsx
      EmptyState.tsx
      LoadingState.tsx
      ErrorState.tsx
    /lib
      cn.ts
      format.ts
      role.ts (get/set role)
  /features
    /marketplace
      pages
        MarketplaceHome.tsx
        AgentDetail.tsx
      components
        AgentCard.tsx
        AgentFilters.tsx
    /creator
      pages
        CreatorDashboard.tsx
        CreatorAgents.tsx
        CreatorAgentNew.tsx
        CreatorAgentDetail.tsx
      components
        AgentWizard.tsx
        DatasetAttach.tsx
    /dao
      pages
        DaoDashboard.tsx
        DaoDatasets.tsx
        DaoDatasetNew.tsx
      components
        DatasetUpload.tsx
        ProvenancePanel.tsx

## 11) Tx UX Requirements (Fuji)
All tx actions must:
- show wallet prompt state
- show pending confirmation state
- show confirmed with explorer link (Snowtrace)
- show error toast with readable message

Create helper:
- `getExplorerTxUrl(txHash)` for Fuji

## 12) Acceptance Criteria (Must pass)
- Build succeeds (`npm run build` or equivalent)
- No TypeScript errors
- Navigation is clean and role-based
- Landing role selection works
- Marketplace list + filter works
- Creator create agent wizard works
- DAO dataset upload + provenance register works
- Tx buttons show correct states
- UI looks consistent, modern, professional

## 13) Output Format
After implementing, print:
1) Summary of changes
2) New route map
3) Key files changed list
4) Screenshots are optional (if tool supports)
5) Any TODO remaining

Now start by auditing the repo and mapping current pages to the target structure. Then execute refactor with minimal breaking changes.