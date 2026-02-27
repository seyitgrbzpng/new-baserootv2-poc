import { getAgents, updateAgent } from './firestore-db';
import type { FirestoreAgent } from './firestore-types';
import { Timestamp } from 'firebase-admin/firestore';

// Health check configuration
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds
const MAX_CONSECUTIVE_FAILURES = 3;

// Track consecutive failures per agent
const failureCount: Record<string, number> = {};

/**
 * Check if an agent's endpoint is healthy
 */
export async function checkAgentHealth(agent: FirestoreAgent): Promise<{
  healthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  const checkUrl = agent.healthCheckUrl || agent.endpointUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(checkUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Baseroot-HealthCheck/1.0',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Consider 2xx and 3xx as healthy
    const healthy = response.status >= 200 && response.status < 400;

    return {
      healthy,
      responseTime,
      error: healthy ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      healthy: false,
      responseTime,
      error: errorMessage.includes('abort') ? 'Timeout' : errorMessage,
    };
  }
}

/**
 * Run health check for all active agents
 */
export async function runHealthChecks(): Promise<{
  checked: number;
  healthy: number;
  unhealthy: number;
  suspended: number;
}> {
  const agents = await getAgents({ status: 'active' });
  let healthy = 0;
  let unhealthy = 0;
  let suspended = 0;

  console.log(`[HealthCheck] Starting health check for ${agents.length} agents`);

  for (const agent of agents) {
    const agentId = agent.id;
    if (!agentId) continue;

    const result = await checkAgentHealth(agent);

    if (result.healthy) {
      // Reset failure count on success
      failureCount[agentId] = 0;
      healthy++;

      // Update agent with health check info
      await updateAgent(agentId, {
        lastHealthCheck: Timestamp.now(),
        responseTimeAvg: Math.round(
          ((agent.responseTimeAvg || 0) * 0.8 + result.responseTime * 0.2)
        ),
      });
    } else {
      // Increment failure count
      failureCount[agentId] = (failureCount[agentId] || 0) + 1;
      unhealthy++;

      console.warn(
        `[HealthCheck] Agent ${agent.name} (${agentId}) failed: ${result.error} (failures: ${failureCount[agentId]})`
      );

      // Suspend agent after max consecutive failures
      if (failureCount[agentId] >= MAX_CONSECUTIVE_FAILURES) {
        console.warn(`[HealthCheck] Suspending agent ${agent.name} after ${MAX_CONSECUTIVE_FAILURES} failures`);
        await updateAgent(agentId, {
          status: 'suspended',
          lastHealthCheck: Timestamp.now(),
        });
        suspended++;
        delete failureCount[agentId];
      } else {
        await updateAgent(agentId, {
          lastHealthCheck: Timestamp.now(),
        });
      }
    }
  }

  console.log(
    `[HealthCheck] Completed: ${healthy} healthy, ${unhealthy} unhealthy, ${suspended} suspended`
  );

  return {
    checked: agents.length,
    healthy,
    unhealthy,
    suspended,
  };
}

/**
 * Check health of a single agent by ID
 */
export async function checkSingleAgentHealth(agentId: string): Promise<{
  healthy: boolean;
  responseTime: number;
  error?: string;
} | null> {
  const { getAgentById } = await import('./firestore-db');
  const agent = await getAgentById(agentId);

  if (!agent) {
    return null;
  }

  return checkAgentHealth(agent);
}

// Health check scheduler
let healthCheckInterval: NodeJS.Timeout | null = null;

/**
 * Start periodic health checks
 */
export function startHealthCheckScheduler(): void {
  if (healthCheckInterval) {
    console.log('[HealthCheck] Scheduler already running');
    return;
  }

  console.log(`[HealthCheck] Starting scheduler (interval: ${HEALTH_CHECK_INTERVAL / 1000}s)`);

  // Run initial check after 30 seconds
  setTimeout(() => {
    runHealthChecks().catch(console.error);
  }, 30000);

  // Schedule periodic checks
  healthCheckInterval = setInterval(() => {
    runHealthChecks().catch(console.error);
  }, HEALTH_CHECK_INTERVAL);
}

/**
 * Stop health check scheduler
 */
export function stopHealthCheckScheduler(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('[HealthCheck] Scheduler stopped');
  }
}

/**
 * Get health check status
 */
export function getHealthCheckStatus(): {
  running: boolean;
  interval: number;
  failureCounts: Record<string, number>;
} {
  return {
    running: healthCheckInterval !== null,
    interval: HEALTH_CHECK_INTERVAL,
    failureCounts: { ...failureCount },
  };
}
