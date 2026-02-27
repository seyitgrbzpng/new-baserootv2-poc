import { TRPCError } from '@trpc/server';

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  message: string;       // Error message when limit exceeded
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // General API calls
  general: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please try again in a minute.',
  },
  // Agent execution (more restrictive)
  execution: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,
    message: 'Too many agent executions. Please wait before running more agents.',
  },
  // Payment verification
  payment: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 20,
    message: 'Too many payment requests. Please slow down.',
  },
  // Agent creation
  creation: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 10,
    message: 'Agent creation limit reached. Please try again later.',
  },
  // Admin privileged operations
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many admin requests. Please slow down.',
  },
  // Health check (admin only, less restrictive)
  healthCheck: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 5,
    message: 'Health check rate limit exceeded.',
  },
} as const;

// In-memory store for rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store: key -> RateLimitEntry
const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Get rate limit key from identifier and limit type
 */
function getRateLimitKey(identifier: string, limitType: string): string {
  return `${limitType}:${identifier}`;
}

/**
 * Check if request is within rate limit
 * Returns remaining requests or throws TRPCError if limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): { remaining: number; resetTime: number } {
  const config = RATE_LIMITS[limitType];
  const key = getRateLimitKey(identifier, limitType);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `${config.message} Retry after ${retryAfter} seconds.`,
    });
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit by wallet address
 */
export function rateLimitByWallet(
  walletAddress: string | null | undefined,
  limitType: keyof typeof RATE_LIMITS
): { remaining: number; resetTime: number } {
  if (!walletAddress) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Wallet address required for this operation.',
    });
  }
  return checkRateLimit(walletAddress, limitType);
}

/**
 * Rate limit by IP address (for unauthenticated requests)
 */
export function rateLimitByIP(
  ip: string | undefined,
  limitType: keyof typeof RATE_LIMITS
): { remaining: number; resetTime: number } {
  const identifier = ip || 'unknown';
  return checkRateLimit(identifier, limitType);
}

/**
 * Get current rate limit status for an identifier
 */
export function getRateLimitStatus(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): {
  remaining: number;
  total: number;
  resetTime: number;
  isLimited: boolean;
} {
  const config = RATE_LIMITS[limitType];
  const key = getRateLimitKey(identifier, limitType);
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    return {
      remaining: config.maxRequests,
      total: config.maxRequests,
      resetTime: now + config.windowMs,
      isLimited: false,
    };
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    total: config.maxRequests,
    resetTime: entry.resetTime,
    isLimited: entry.count >= config.maxRequests,
  };
}

/**
 * Reset rate limit for an identifier (admin use)
 */
export function resetRateLimit(identifier: string, limitType: keyof typeof RATE_LIMITS): void {
  const key = getRateLimitKey(identifier, limitType);
  rateLimitStore.delete(key);
}

/**
 * Get all rate limit stats (for monitoring)
 */
export function getAllRateLimitStats(): {
  totalEntries: number;
  byType: Record<string, number>;
} {
  const stats: Record<string, number> = {};
  
  const keys = Array.from(rateLimitStore.keys());
  for (const key of keys) {
    const type = key.split(':')[0];
    stats[type] = (stats[type] || 0) + 1;
  }

  return {
    totalEntries: rateLimitStore.size,
    byType: stats,
  };
}
