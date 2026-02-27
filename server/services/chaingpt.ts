import axios, { AxiosError } from 'axios';

// ─────────────────────────────────────────────────────────────
// ChainGPT Web3 AI LLM Client
// ─────────────────────────────────────────────────────────────

// Env config with defaults
const CHAINGPT_API_KEY = process.env.CHAINGPT_API_KEY ?? '';
const CHAINGPT_BASE_URL = process.env.CHAINGPT_BASE_URL ?? 'https://api.chaingpt.org';
const CHAINGPT_MODEL = process.env.CHAINGPT_MODEL ?? 'general_assistant';
const CHAINGPT_TIMEOUT_MS = parseInt(process.env.CHAINGPT_TIMEOUT_MS ?? '30000', 10);

// ─── Types ──────────────────────────────────────────────────

export interface ChainGPTRequest {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    metadata?: Record<string, unknown>;
}

export interface ChainGPTResponse {
    outputText: string;
    usage: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
        credits?: number;
    };
    latency_ms: number;
    model: string;
    raw?: unknown;
}

export class ChainGPTError extends Error {
    public readonly statusCode: number;
    public readonly isRetryable: boolean;

    constructor(message: string, statusCode: number, isRetryable = false) {
        super(message);
        this.name = 'ChainGPTError';
        this.statusCode = statusCode;
        this.isRetryable = isRetryable;
    }
}

// ─── Startup validation ─────────────────────────────────────

export function validateChainGPTConfig(): void {
    if (!CHAINGPT_API_KEY) {
        throw new Error(
            '[ChainGPT] CHAINGPT_API_KEY is not set. Please add it to your .env file. ' +
            'Get your API key from https://app.chaingpt.org'
        );
    }
    console.log(`[ChainGPT] Config validated — model: ${CHAINGPT_MODEL}, timeout: ${CHAINGPT_TIMEOUT_MS}ms`);
}

// ─── Core call ──────────────────────────────────────────────

async function callOnce(prompt: string): Promise<ChainGPTResponse> {
    const startTime = Date.now();

    try {
        const response = await axios.post(
            `${CHAINGPT_BASE_URL}/chat/stream`,
            {
                model: CHAINGPT_MODEL,
                question: prompt,
                chatHistory: 'off',
            },
            {
                headers: {
                    'Authorization': `Bearer ${CHAINGPT_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: CHAINGPT_TIMEOUT_MS,
            }
        );

        const latency_ms = Date.now() - startTime;
        const data = response.data;

        // Normalize response — ChainGPT may return different shapes
        // Stream endpoint often returns the full buffered text
        let outputText = '';
        if (typeof data === 'string') {
            outputText = data;
        } else if (data?.bot) {
            outputText = data.bot;
        } else if (data?.choices?.[0]?.message?.content) {
            outputText = data.choices[0].message.content;
        } else if (data?.message) {
            outputText = data.message;
        } else if (data?.data) {
            outputText = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
        } else {
            outputText = JSON.stringify(data);
        }

        // Normalize usage
        const usage: ChainGPTResponse['usage'] = {
            credits: data?.credits_used ?? data?.creditUsed ?? 0.5,
            prompt_tokens: data?.usage?.prompt_tokens,
            completion_tokens: data?.usage?.completion_tokens,
            total_tokens: data?.usage?.total_tokens,
        };

        return {
            outputText,
            usage,
            latency_ms,
            model: CHAINGPT_MODEL,
            raw: data,
        };
    } catch (error) {
        const latency_ms = Date.now() - startTime;

        if (error instanceof AxiosError) {
            const status = error.response?.status ?? 500;
            const message = error.response?.data?.message ?? error.message;

            // Determine retryability
            const isRetryable = status === 429 || status === 502 || status === 503 || status === 504;

            throw new ChainGPTError(
                `ChainGPT API error (${status}): ${message} [${latency_ms}ms]`,
                status,
                isRetryable
            );
        }

        throw new ChainGPTError(
            `ChainGPT request failed: ${(error as Error).message} [${latency_ms}ms]`,
            500,
            false
        );
    }
}

// ─── Public API with retry ──────────────────────────────────

export async function callWeb3LLM(request: ChainGPTRequest): Promise<ChainGPTResponse> {
    const MAX_RETRIES = 1;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await callOnce(request.prompt);
        } catch (error) {
            if (error instanceof ChainGPTError && error.isRetryable && attempt < MAX_RETRIES) {
                console.warn(`[ChainGPT] Retrying (attempt ${attempt + 1}/${MAX_RETRIES})...`);
                // Simple backoff
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                continue;
            }
            throw error;
        }
    }

    // Unreachable, but TypeScript needs it
    throw new ChainGPTError('Max retries exceeded', 500, false);
}
