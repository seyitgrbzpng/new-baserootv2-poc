// ─────────────────────────────────────────────────────────────
// Attribution Service — Revenue Split (Basis Points)
// Aligned with Baseroot V2 Whitepaper §7
// 3-way split: DAO (Data Provider) / Agent Developer / Protocol
// ─────────────────────────────────────────────────────────────

const SPLIT_DAO_BPS = parseInt(process.env.SPLIT_DAO_BPS ?? '5000', 10);           // 50%  — matches BaserootMarketplaceV2.sol
const SPLIT_AGENT_DEV_BPS = parseInt(process.env.SPLIT_AGENT_DEV_BPS ?? '4000', 10); // 40%  — matches BaserootMarketplaceV2.sol
const SPLIT_PROTOCOL_BPS = parseInt(process.env.SPLIT_PROTOCOL_BPS ?? '1000', 10);   // 10%  — matches BaserootMarketplaceV2.sol

export interface SplitPolicy {
    dao_data_provider_bps: number;
    agent_developer_bps: number;
    protocol_bps: number;
}

export interface SplitBreakdown {
    dao_data_provider_amount: number;
    agent_developer_amount: number;
    protocol_amount: number;
    total: number;
    policy: SplitPolicy;
}

/**
 * Returns the current attribution policy from env (or defaults).
 */
export function getDefaultPolicy(): SplitPolicy {
    const total = SPLIT_DAO_BPS + SPLIT_AGENT_DEV_BPS + SPLIT_PROTOCOL_BPS;
    if (total !== 10000) {
        console.warn(
            `[Attribution] Split bps total is ${total}, expected 10000. ` +
            `Using raw values: dao=${SPLIT_DAO_BPS}, agent_dev=${SPLIT_AGENT_DEV_BPS}, protocol=${SPLIT_PROTOCOL_BPS}`
        );
    }

    return {
        dao_data_provider_bps: SPLIT_DAO_BPS,
        agent_developer_bps: SPLIT_AGENT_DEV_BPS,
        protocol_bps: SPLIT_PROTOCOL_BPS,
    };
}

/**
 * Split a total amount according to the given policy (basis points).
 * 1 bps = 0.01%
 */
export function splitAmount(total: number, policy?: SplitPolicy): SplitBreakdown {
    const p = policy ?? getDefaultPolicy();
    const bpsSum = p.dao_data_provider_bps + p.agent_developer_bps + p.protocol_bps;

    return {
        dao_data_provider_amount: Math.round((total * p.dao_data_provider_bps / bpsSum) * 1_000_000) / 1_000_000,
        agent_developer_amount: Math.round((total * p.agent_developer_bps / bpsSum) * 1_000_000) / 1_000_000,
        protocol_amount: Math.round((total * p.protocol_bps / bpsSum) * 1_000_000) / 1_000_000,
        total,
        policy: p,
    };
}

