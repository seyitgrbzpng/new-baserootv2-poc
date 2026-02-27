// ─────────────────────────────────────────────────────────────
// Pricing Service — Cost Estimation for LLM Inferences
// ─────────────────────────────────────────────────────────────

const UNIT_PRICE_PER_TOKEN = parseFloat(process.env.UNIT_PRICE_PER_TOKEN ?? '0.00005');
const FLAT_PRICE_USD = parseFloat(process.env.FLAT_PRICE_USD ?? '0.05');
const PRICE_PER_CREDIT = parseFloat(process.env.PRICE_PER_CREDIT ?? '0.05');

export type PricingMode = 'per_token' | 'per_credit' | 'flat';

export interface PricingResult {
    estimated_cost: number;
    pricing_mode: PricingMode;
}

export interface UsageInput {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    credits?: number;
}

/**
 * Estimate cost based on usage data.
 * Priority: tokens > credits > flat rate
 */
export function estimateCost(usage: UsageInput): PricingResult {
    // 1) Token-based pricing (highest priority — most granular)
    if (usage.total_tokens && usage.total_tokens > 0) {
        return {
            estimated_cost: Math.round(usage.total_tokens * UNIT_PRICE_PER_TOKEN * 1_000_000) / 1_000_000,
            pricing_mode: 'per_token',
        };
    }

    // 2) Credit-based pricing
    if (usage.credits && usage.credits > 0) {
        return {
            estimated_cost: Math.round(usage.credits * PRICE_PER_CREDIT * 1_000_000) / 1_000_000,
            pricing_mode: 'per_credit',
        };
    }

    // 3) Flat rate fallback
    return {
        estimated_cost: FLAT_PRICE_USD,
        pricing_mode: 'flat',
    };
}
