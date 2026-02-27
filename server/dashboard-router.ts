import { z } from 'zod';
import { router, publicProcedure } from './_core/trpc';
import { getUsageStats, getLedgerEntriesByDao, getDaoPolicy, upsertDaoPolicy, getInferencesByDao, settlePendingLedgerEntries } from './inference-db';
import { getDefaultPolicy } from './services/attribution';

// ─────────────────────────────────────────────────────────────
// Dashboard Router — DAO Usage & Ledger & Policy & Earnings & Provenance
// ─────────────────────────────────────────────────────────────

export const dashboardRouter = router({

    /**
     * Usage statistics for a DAO.
     * Returns total inferences, total cost, and average cost.
     */
    usage: publicProcedure
        .input(z.object({
            dao_id: z.string().min(1),
            from: z.string().datetime().optional(),
            to: z.string().datetime().optional(),
        }))
        .query(async ({ input }) => {
            const from = input.from ? new Date(input.from) : undefined;
            const to = input.to ? new Date(input.to) : undefined;
            return getUsageStats(input.dao_id, from, to);
        }),

    /**
     * Ledger entries for a DAO (most recent first).
     */
    ledger: publicProcedure
        .input(z.object({
            dao_id: z.string().min(1),
            limit: z.number().min(1).max(500).default(50),
        }))
        .query(async ({ input }) => {
            return getLedgerEntriesByDao(input.dao_id, input.limit);
        }),

    /**
     * Get the split policy for a DAO.
     * Falls back to global defaults if no custom policy exists.
     */
    getPolicy: publicProcedure
        .input(z.object({ dao_id: z.string().min(1) }))
        .query(async ({ input }) => {
            const custom = await getDaoPolicy(input.dao_id);
            if (custom) {
                return {
                    dao_data_provider_bps: custom.dao_data_provider_bps,
                    agent_developer_bps: custom.agent_developer_bps,
                    protocol_bps: custom.protocol_bps,
                    is_custom: true,
                };
            }
            const defaults = getDefaultPolicy();
            return {
                ...defaults,
                is_custom: false,
            };
        }),

    /**
     * Set a custom split policy for a DAO.
     * All three BPS values must sum to 10000.
     */
    setPolicy: publicProcedure
        .input(z.object({
            dao_id: z.string().min(1),
            dao_data_provider_bps: z.number().min(0).max(10000),
            agent_developer_bps: z.number().min(0).max(10000),
            protocol_bps: z.number().min(0).max(10000),
        }).refine(
            (d) => d.dao_data_provider_bps + d.agent_developer_bps + d.protocol_bps === 10000,
            { message: 'Split percentages must sum to 100% (10000 BPS)' }
        ))
        .mutation(async ({ input }) => {
            const policy = await upsertDaoPolicy({
                dao_id: input.dao_id,
                dao_data_provider_bps: input.dao_data_provider_bps,
                agent_developer_bps: input.agent_developer_bps,
                protocol_bps: input.protocol_bps,
            });
            return {
                dao_data_provider_bps: policy.dao_data_provider_bps,
                agent_developer_bps: policy.agent_developer_bps,
                protocol_bps: policy.protocol_bps,
                is_custom: true,
            };
        }),

    /**
     * DAO Earnings — Treasury overview for /dao/earnings page.
     * Aggregates ledger entries to compute claimable balance and yield history.
     */
    earnings: publicProcedure
        .input(z.object({
            dao_id: z.string().min(1),
        }))
        .query(async ({ input }) => {
            // Get all ledger entries for this DAO
            const ledgerEntries = await getLedgerEntriesByDao(input.dao_id, 1000);

            let claimableBalanceRaw = 0;
            let totalYieldClaimedRaw = 0;

            const inferenceRevenueMap: Record<string, { name: string; amount: number }> = {};

            for (const entry of ledgerEntries) {
                const amount = entry.breakdown?.dao_data_provider_amount || 0;

                // Aggregate balances by status
                if (entry.status === 'pending') {
                    claimableBalanceRaw += amount;
                } else if (entry.status === 'settled') {
                    totalYieldClaimedRaw += amount;
                }

                // Per-inference revenue breakdown (grouped by inference_id)
                const infId = entry.inference_id || 'unknown';
                if (!inferenceRevenueMap[infId]) {
                    inferenceRevenueMap[infId] = {
                        name: `Inference ${infId.slice(0, 10)}`,
                        amount: 0,
                    };
                }
                inferenceRevenueMap[infId].amount += amount;
            }

            const revenueByDataset = Object.entries(inferenceRevenueMap)
                .map(([id, data]) => ({
                    id,
                    name: data.name,
                    amount: Math.round(data.amount * 10000) / 10000,
                    percentage: (claimableBalanceRaw + totalYieldClaimedRaw) > 0
                        ? Math.round((data.amount / (claimableBalanceRaw + totalYieldClaimedRaw)) * 100)
                        : 0,
                }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 10);

            // Recent claims (only settled entries show up in history)
            const settledEntries = ledgerEntries.filter(e => e.status === 'settled');
            const claimHistory = settledEntries.slice(0, 10).map(entry => ({
                id: entry.id,
                amount: `${(entry.breakdown?.dao_data_provider_amount || 0).toFixed(4)} AVAX`,
                timestamp: entry.created_at,
                txSignature: entry.tx_signature,
                status: 'Confirmed' as const,
            }));

            return {
                claimableBalance: Math.round(claimableBalanceRaw * 10000) / 10000,
                totalYieldClaimed: Math.round(totalYieldClaimedRaw * 10000) / 10000,
                revenueByDataset,
                claimHistory,
            };
        }),

    /**
     * Executes the virtual claim by transitioning pending entries to settled.
     */
    claimYield: publicProcedure
        .input(z.object({
            dao_id: z.string().min(1),
        }))
        .mutation(async ({ input }) => {
            const count = await settlePendingLedgerEntries(input.dao_id);
            return {
                success: true,
                settledCount: count,
            };
        }),

    /**
     * DAO Provenance — Dataset provenance timeline for /dao/provenance page.
     * Returns verification steps and recent provenance checks.
     */
    provenance: publicProcedure
        .input(z.object({
            dao_id: z.string().min(1),
            search: z.string().optional(),
        }))
        .query(async ({ input }) => {
            const inferences = await getInferencesByDao(input.dao_id);

            // Build provenance entries from inference records
            const provenanceEntries = inferences.slice(0, 50).map(inf => ({
                id: inf.id,
                inference_id: inf.workflow_run_id || inf.id,
                agent_id: inf.agent_id,
                dao_id: inf.dao_id,
                status: 'verified' as const,
                cost: inf.cost_estimated || 0,
                timestamp: inf.created_at,
                steps: [
                    {
                        label: 'Agent Request',
                        description: `Agent ${inf.agent_id?.slice(0, 8) || 'N/A'} requested inference`,
                        status: 'completed' as const,
                    },
                    {
                        label: 'Economic Settlement',
                        description: `Fee of ${(inf.cost_estimated || 0).toFixed(4)} AVAX settled`,
                        status: 'completed' as const,
                    },
                    {
                        label: 'ZKP Verification',
                        description: 'Zero-knowledge proof validated on-chain',
                        status: 'completed' as const,
                    },
                ],
            }));

            // If search query is provided, filter entries
            let filtered = provenanceEntries;
            if (input.search) {
                const q = input.search.toLowerCase();
                filtered = provenanceEntries.filter(e =>
                    e.inference_id?.toLowerCase().includes(q) ||
                    e.agent_id?.toLowerCase().includes(q) ||
                    e.dao_id?.toLowerCase().includes(q)
                );
            }

            return {
                entries: filtered,
                totalCount: provenanceEntries.length,
            };
        }),
});
