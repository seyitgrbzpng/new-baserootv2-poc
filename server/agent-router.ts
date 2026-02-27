import { z } from 'zod';
import { router, publicProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { sha256 } from 'js-sha256';
import { nanoid } from 'nanoid';

import { callWeb3LLM, ChainGPTError } from './services/chaingpt';
import { estimateCost } from './services/pricing';
import { splitAmount, SplitPolicy } from './services/attribution';
import { createInference, createLedgerEntry, getDaoPolicy } from './inference-db';
import { getDatasetById } from './firestore-db';

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────

const ALLOWED_DAO_IDS = (process.env.ALLOWED_DAO_IDS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

// ─────────────────────────────────────────────────────────────
// Prompt Template
// ─────────────────────────────────────────────────────────────

function buildPrompt(title: string, proposalText: string, datasetContext?: string): string {
    const datasetSection = datasetContext
        ? `\n\n[ZERO-KNOWLEDGE DATA PRIVACY MODE INITIATED]\nResearch Dataset Context (Highly Confidential):\n${datasetContext}\n\nCRITICAL INSTRUCTION: You must analyze the proposal below using the research dataset above, but you MUST NOT output, quote, or leak the raw dataset text in your response. The dataset is confidential DAO intellectual property. Only output your derived insights.`
        : '';

    return `You are a Web3 governance analyst and research data specialist.
Analyze the DAO proposal below.${datasetSection}
Return STRICTLY as JSON with keys:
risks (array of strings),
action_items (array of strings),
smart_contract_impact (array of strings),
governance_notes (array of strings),
data_insights (array of strings — insights derived from the dataset, if provided).
No additional keys, no markdown.
If missing info, return empty arrays.
Proposal Title: ${title}
Proposal Text: ${proposalText}`;
}

// ─────────────────────────────────────────────────────────────
// Try to parse the LLM output as JSON
// ─────────────────────────────────────────────────────────────

function tryParseAnalysis(text: string): Record<string, unknown> | string {
    try {
        // Strip potential markdown code fences
        const cleaned = text
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
        return JSON.parse(cleaned);
    } catch {
        return text;
    }
}

// ─────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────

export const agentRunRouter = router({
    run: publicProcedure
        .input(z.object({
            dao_id: z.string().min(1),
            project_id: z.string().optional(),
            agent_id: z.string().default('a_proposal_analyzer'),
            proposal_text: z.string().min(1),
            title: z.string().optional(),
            dataset_id: z.string().optional(), // V2: Analyze using a specific dataset
        }))
        .mutation(async ({ input }) => {
            const workflow_run_id = `wfr_${nanoid(16)}`;

            // 1) DAO access check
            if (ALLOWED_DAO_IDS.length > 0 && !ALLOWED_DAO_IDS.includes(input.dao_id)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: `DAO '${input.dao_id}' is not in the allowed list. Set ALLOWED_DAO_IDS env.`,
                });
            }

            // 2) If dataset_id provided, fetch the dataset content
            let datasetContext: string | undefined;
            let datasetTitle: string | undefined;
            if (input.dataset_id) {
                const dataset = await getDatasetById(input.dataset_id);
                if (dataset && dataset.dataContent) {
                    // ── DATA PRIVACY GATE ──
                    // ChainGPT (third-party LLM) may ONLY process Web3 public data.
                    // Sensitive bio/DeSci data must use self-hosted models (future).
                    const CHAINGPT_SAFE_TYPES = ['web3_governance', 'web3_treasury', 'web3_defi'];
                    if (dataset.dataType && !CHAINGPT_SAFE_TYPES.includes(dataset.dataType)) {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message: `Data privacy violation: Dataset type '${dataset.dataType}' contains sensitive data and cannot be sent to ChainGPT (third-party LLM). Only Web3 research data (governance, treasury, DeFi) is allowed. Sensitive data requires a self-hosted LLM (coming soon).`,
                        });
                    }

                    datasetContext = dataset.dataContent.substring(0, 8000); // Limit context size
                    datasetTitle = dataset.title;
                    console.log(`[AgentRun] ✅ Data privacy check passed — using Web3 dataset '${dataset.title}' (${dataset.dataType}/${dataset.dataFormat}) as context`);
                }
            }

            // 3) Build prompt with optional dataset context
            const title = input.title ?? 'Untitled Proposal';
            const prompt = buildPrompt(title, input.proposal_text, datasetContext);

            // 4) Call ChainGPT
            let llmResult;
            try {
                llmResult = await callWeb3LLM({ prompt });
            } catch (error) {
                if (error instanceof ChainGPTError) {
                    const trpcCode = error.statusCode === 401 ? 'UNAUTHORIZED'
                        : error.statusCode === 429 ? 'TOO_MANY_REQUESTS'
                            : error.statusCode === 402 || error.statusCode === 403 ? 'FORBIDDEN'
                                : 'INTERNAL_SERVER_ERROR';

                    throw new TRPCError({
                        code: trpcCode as any,
                        message: `ChainGPT: ${error.message}`,
                        cause: error,
                    });
                }
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `LLM call failed: ${(error as Error).message}`,
                });
            }

            // 4) Hash input + output
            const input_hash = sha256(input.proposal_text);
            const output_hash = sha256(llmResult.outputText);

            // 5) Calculate pricing
            const pricing = estimateCost(llmResult.usage);

            // 6) Look up DAO-specific split policy (or fall back to global defaults)
            let daoPolicy: SplitPolicy | undefined;
            try {
                const customPolicy = await getDaoPolicy(input.dao_id);
                if (customPolicy) {
                    daoPolicy = {
                        dao_data_provider_bps: customPolicy.dao_data_provider_bps,
                        agent_developer_bps: customPolicy.agent_developer_bps,
                        protocol_bps: customPolicy.protocol_bps,
                    };
                    console.log(`[AgentRun] Using custom split for DAO ${input.dao_id}: ${daoPolicy.dao_data_provider_bps}/${daoPolicy.agent_developer_bps}/${daoPolicy.protocol_bps}`);
                }
            } catch (err) {
                console.warn('[AgentRun] Failed to fetch DAO policy, using defaults:', err);
            }

            // 7) Calculate attribution split
            const breakdown = splitAmount(pricing.estimated_cost, daoPolicy);

            // 7) Write inference doc
            let inferenceDoc;
            try {
                inferenceDoc = await createInference({
                    dao_id: input.dao_id,
                    project_id: input.project_id,
                    agent_id: input.agent_id,
                    workflow_run_id,
                    provider: 'chaingpt',
                    model: llmResult.model,
                    input_hash,
                    output_hash,
                    usage: llmResult.usage,
                    latency_ms: llmResult.latency_ms,
                    cost_estimated: pricing.estimated_cost,
                    pricing_mode: pricing.pricing_mode,
                });
            } catch (err) {
                console.error('[AgentRun] Failed to write inference doc:', err);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to persist inference record',
                });
            }

            // 8) Write ledger entry
            try {
                await createLedgerEntry({
                    dao_id: input.dao_id,
                    inference_id: inferenceDoc.id,
                    amount_total: pricing.estimated_cost,
                    currency: 'USD_EST',
                    breakdown: {
                        dao_data_provider_amount: breakdown.dao_data_provider_amount,
                        agent_developer_amount: breakdown.agent_developer_amount,
                        protocol_amount: breakdown.protocol_amount,
                    },
                });
            } catch (err) {
                console.error('[AgentRun] Failed to write ledger entry:', err);
                // Non-fatal — inference was already stored
            }

            // 9) Return result
            const analysis_json = tryParseAnalysis(llmResult.outputText);

            return {
                workflow_run_id,
                analysis_json,
                usage: llmResult.usage,
                latency_ms: llmResult.latency_ms,
                cost_estimated: pricing.estimated_cost,
                pricing_mode: pricing.pricing_mode,
                breakdown: {
                    dao_data_provider_amount: breakdown.dao_data_provider_amount,
                    agent_developer_amount: breakdown.agent_developer_amount,
                    protocol_amount: breakdown.protocol_amount,
                },
                dataset_used: datasetTitle ?? null,
            };
        }),
});
