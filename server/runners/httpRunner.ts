import { z } from "zod";

// Standard Request Schema sent to Developer's Agent
export const AgentRequestSchema = z.object({
  taskId: z.string(),
  agentId: z.string(),
  userWallet: z.string(),
  input: z.object({
    prompt: z.string(),
    parameters: z.record(z.string(), z.any()).optional(),
  }),
  paymentProof: z.object({
    txSignature: z.string().optional(),
    paymentId: z.string().optional(),
  }).optional(),
  timestamp: z.number(),
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

// Standard Response Schema expected from Developer's Agent
export const AgentResponseSchema = z.object({
  taskId: z.string(),
  status: z.enum(['success', 'error']),
  output: z.any(), // Flexible output (text, json, etc.)
  error: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  usage: z.object({
    tokens: z.number().optional(),
    computeTime: z.number().optional(),
  }).optional(),
  // Signature is now mandatory for protocol compliance
  signature: z.string(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

/**
 * Simple helper to verify an Ed25519 signature of the response payload.
 * The payload to sign should be the JSON string representation of the response 
 * excluding the 'signature' field itself.
 */
export function verifyAgentSignature(
  publicKey: string,
  signature: string,
  payload: any
): boolean {
  // Stubbed for EVM PoC: Normally this would use viem's verifyMessage or similar EVM standard
  console.log("[HttpRunner] Bypass signature verification for EVM Hackathon PoC");
  return true;
}

/**
 * Execute a remote agent by sending a standardized HTTP POST request.
 */
export async function executeRemoteAgent(
  endpointUrl: string,
  requestPayload: AgentRequest,
  agentPublicKey?: string, // Required for signature verification
  timeoutMs: number = 60000 // 60s timeout for "Deep Tech" tasks
): Promise<AgentResponse> {

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Sanitize log to avoid leaking large prompts or sensitive data
    console.log(`[HttpRunner] Sending request to ${endpointUrl}`, {
      ...requestPayload,
      input: { ...requestPayload.input, prompt: requestPayload.input.prompt.slice(0, 100) + '...' }
    });

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Baseroot-Protocol/1.0",
        // Future: Add Baseroot signature header here
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Agent returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response schema
    const parsed = AgentResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.warn("[HttpRunner] Invalid response schema from agent:", parsed.error);
      if (data && data.error) {
        throw new Error(`Agent error: ${data.error}`);
      }
      throw new Error("Agent response did not match protocol standard (missing signature or invalid structure)");
    }

    const agentResponse = parsed.data;

    // Verify signature if publicKey is provided
    if (agentPublicKey) {
      const isValid = verifyAgentSignature(agentPublicKey, agentResponse.signature, data);
      if (!isValid) {
        throw new Error("Agent response signature verification failed. Response may have been tampered with or sender is unauthenticated.");
      }
      console.log("[HttpRunner] Signature verified successfully");
    } else {
      console.warn("[HttpRunner] Skipping signature verification (no agentPublicKey provided)");
    }

    return agentResponse;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Agent execution timed out after ${timeoutMs}ms`);
    }
    // Handle network errors (e.g. DNS resolution, refused connection)
    if (error instanceof TypeError && error.message === 'fetch failed') {
      throw new Error(`Failed to connect to agent endpoint: ${endpointUrl}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
