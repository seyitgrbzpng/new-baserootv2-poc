import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { sha256 } from 'js-sha256';
import { callWeb3LLM, ChainGPTError } from './services/chaingpt';
import { estimateCost } from './services/pricing';
import { splitAmount } from './services/attribution';
import { createInference, createLedgerEntry, checkAndCreateEvent } from './inference-db';

// ─────────────────────────────────────────────────────────────
// Webhook Router — POST /v1/events/inference-completed
// For external orchestrators (AgenticOS etc.)
// ─────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = process.env.BASEROOT_WEBHOOK_SECRET ?? '';

export const webhookRouter = Router();

/**
 * Verify HMAC-SHA256 signature from X-BASEROOT-SIGNATURE header.
 */
function verifySignature(payload: string, signature: string): boolean {
    if (!WEBHOOK_SECRET) {
        console.warn('[Webhook] BASEROOT_WEBHOOK_SECRET not set — skipping signature check');
        return true; // Allow in dev / PoC
    }

    const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
    );
}

webhookRouter.post('/inference-completed', async (req: Request, res: Response) => {
    try {
        // 1) Signature check
        const signature = req.headers['x-baseroot-signature'] as string;
        const rawBody = JSON.stringify(req.body);

        if (signature && !verifySignature(rawBody, signature)) {
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }

        const {
            event_id,
            dao_id,
            project_id,
            agent_id,
            proposal_text,
            title,
        } = req.body;

        if (!event_id || !dao_id || !proposal_text) {
            res.status(400).json({ error: 'Missing required fields: event_id, dao_id, proposal_text' });
            return;
        }

        // 2) Dedup check
        const { exists } = await checkAndCreateEvent({
            id: event_id,
            event_type: 'inference-completed',
            processed: false,
        });

        if (exists) {
            res.status(200).json({ status: 'already_processed', event_id });
            return;
        }

        // 3) Build prompt & call LLM
        const promptTitle = title ?? 'Untitled Proposal';
        const prompt = `You are a Web3 governance analyst.
Analyze the DAO proposal below.
Return STRICTLY as JSON with keys:
risks (array of strings),
action_items (array of strings),
smart_contract_impact (array of strings),
governance_notes (array of strings).
No additional keys, no markdown.
If missing info, return empty arrays.
Proposal Title: ${promptTitle}
Proposal Text: ${proposal_text}`;

        const llmResult = await callWeb3LLM({ prompt });

        // 4) Hash + pricing + attribution
        const input_hash = sha256(proposal_text);
        const output_hash = sha256(llmResult.outputText);
        const pricing = estimateCost(llmResult.usage);
        const breakdown = splitAmount(pricing.estimated_cost);

        // 5) Write inference + ledger
        const inferenceDoc = await createInference({
            dao_id,
            project_id,
            agent_id: agent_id ?? 'a_external_webhook',
            workflow_run_id: `wfr_webhook_${event_id}`,
            provider: 'chaingpt',
            model: llmResult.model,
            input_hash,
            output_hash,
            usage: llmResult.usage,
            latency_ms: llmResult.latency_ms,
            cost_estimated: pricing.estimated_cost,
            pricing_mode: pricing.pricing_mode,
        });

        await createLedgerEntry({
            dao_id,
            inference_id: inferenceDoc.id,
            amount_total: pricing.estimated_cost,
            currency: 'USD_EST',
            breakdown: {
                agent_developer_amount: breakdown.agent_developer_amount,
                dao_data_provider_amount: breakdown.dao_data_provider_amount,
                protocol_amount: breakdown.protocol_amount,
            },
        });

        res.status(200).json({
            status: 'processed',
            event_id,
            inference_id: inferenceDoc.id,
            cost_estimated: pricing.estimated_cost,
        });
    } catch (error) {
        console.error('[Webhook] Error:', error);
        const message = error instanceof ChainGPTError
            ? error.message
            : (error as Error).message;
        res.status(500).json({ error: message });
    }
});
