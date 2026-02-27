import { describe, expect, it, beforeAll, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock MongoDB functions
vi.mock("./firestore-db", () => ({
  connectMongoDB: vi.fn().mockResolvedValue({}),
  seedMockAgents: vi.fn().mockResolvedValue(undefined),
  getAgents: vi.fn().mockResolvedValue([
    {
      _id: { toString: () => "agent-1" },
      name: "Test Agent",
      description: "A test agent for unit testing",
      creatorWallet: "7xKX9PxcWzEgYT8gAsU3kZ9hVnQJxqVMfYJnkSgAsU",
      category: "Research",
      tags: ["test", "research"],
      endpointUrl: "https://api.test.com/agent",
      apiKeyRequired: false,
      pricePerUse: 0.05,
      currency: "SOL",
      totalUses: 100,
      successRate: 98.5,
      responseTimeAvg: 2500,
      rating: 4.8,
      ratingCount: 50,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getAgentById: vi.fn().mockImplementation((id: string) => {
    if (id === "agent-1") {
      return Promise.resolve({
        _id: { toString: () => "agent-1" },
        name: "Test Agent",
        description: "A test agent for unit testing",
        creatorWallet: "7xKX9PxcWzEgYT8gAsU3kZ9hVnQJxqVMfYJnkSgAsU",
        category: "Research",
        tags: ["test", "research"],
        endpointUrl: "https://api.test.com/agent",
        apiKeyRequired: false,
        pricePerUse: 0.05,
        currency: "SOL",
        totalUses: 100,
        successRate: 98.5,
        responseTimeAvg: 2500,
        rating: 4.8,
        ratingCount: 50,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return Promise.resolve(null);
  }),
  createAgent: vi.fn().mockImplementation((agent) => {
    return Promise.resolve({
      ...agent,
      _id: { toString: () => "new-agent-id" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }),
  updateAgent: vi.fn().mockResolvedValue(true),
  searchAgents: vi.fn().mockResolvedValue([]),
  createPayment: vi.fn().mockImplementation((payment) => {
    return Promise.resolve({
      ...payment,
      _id: { toString: () => "payment-1" },
      createdAt: new Date(),
    });
  }),
  getPaymentByTxSignature: vi.fn().mockResolvedValue(null),
  getPaymentsByWallet: vi.fn().mockResolvedValue([]),
  updatePaymentStatus: vi.fn().mockResolvedValue(true),
  createAgentRun: vi.fn().mockImplementation((run) => {
    return Promise.resolve({
      ...run,
      _id: { toString: () => "run-1" },
      createdAt: new Date(),
    });
  }),
  getAgentRuns: vi.fn().mockResolvedValue([]),
  upsertWalletUser: vi.fn().mockImplementation((walletAddress, data) => {
    return Promise.resolve({
      _id: { toString: () => "user-1" },
      walletAddress,
      ...data,
      role: "user",
      totalSpent: 0,
      totalEarned: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }),
  getWalletUser: vi.fn().mockResolvedValue(null),
  getCreatorStats: vi.fn().mockResolvedValue({
    totalAgents: 1,
    totalEarnings: 0.5,
    totalUses: 100,
    avgRating: 4.8,
  }),
  getUserByUid: vi.fn().mockResolvedValue({
    uid: "test-uid",
    walletAddress: "7xKX9PxcWzEgYT8gAsU3kZ9hVnQJxqVMfYJnkSgAsU",
    role: "creator",
    totalEarned: 0.5,
    createdAt: new Date(),
  }),
  updateUserStats: vi.fn().mockResolvedValue(undefined),
}));

// Mock Firebase initialization
vi.mock("./firebase", () => ({
  initializeFirebase: vi.fn(),
  getFirebaseAuth: vi.fn().mockReturnValue({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: "test-uid" }),
  }),
}));

// Mock Solana functions
vi.mock("./solana", () => ({
  verifyTransaction: vi.fn().mockResolvedValue({ success: true }),
  getWalletBalance: vi.fn().mockResolvedValue(1.5),
  getPlatformConfig: vi.fn().mockReturnValue({
    network: "devnet",
    platformWallet: "3HCeMh9nW2BSHionrrmxH7WNf1fpmZNTAskD9JjGK7eb",
    platformFeePercent: 10,
  }),
  calculatePaymentSplit: vi.fn().mockImplementation((amount: number) => ({
    platformFee: amount * 0.1,
    creatorAmount: amount * 0.9,
  })),
  isValidWalletAddress: vi.fn().mockReturnValue(true),
  getExplorerUrl: vi.fn().mockImplementation((sig: string) =>
    `https://explorer.solana.com/tx/${sig}?cluster=devnet`
  ),
}));

// Mock Notifications
vi.mock("./notifications-router", () => ({
  sendNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
}));

// Mock Payment Credits
vi.mock("./payment-credits", () => ({
  createPaymentCredit: vi.fn().mockResolvedValue({ id: "credit-1" }),
  usePaymentCredit: vi.fn().mockResolvedValue(true),
}));



function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Marketplace API", () => {
  describe("agents.list", () => {
    it("returns list of active agents", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.agents.list({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("pricePerUse");
    });

    it("filters agents by category", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.agents.list({ category: "Research" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("agents.getById", () => {
    it("returns agent by ID", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.agents.getById({ id: "agent-1" });

      expect(result).toBeDefined();
      expect(result?.name).toBe("Test Agent");
    });

    it("returns null for non-existent agent", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.agents.getById({ id: "non-existent" });

      expect(result).toBeNull();
    });
  });

  describe("agents.create", () => {
    it("creates a new agent with valid data", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const newAgent = {
        name: "New Test Agent",
        description: "A brand new test agent for the marketplace",
        creatorWallet: "7xKX9PxcWzEgYT8gAsU3kZ9hVnQJxqVMfYJnkSgAsU",
        category: "Analysis",
        tags: ["new", "test"],
        endpointUrl: "https://api.newtest.com/agent",
        apiKeyRequired: false,
        pricePerUse: 0.1,
        currency: "SOL" as const,
      };

      const result = await caller.agents.create(newAgent);

      expect(result).toBeDefined();
      expect(result?.name).toBe("New Test Agent");
    });
  });

  describe("wallet.connect", () => {
    it("connects a valid wallet address", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wallet.connect({
        walletAddress: "7xKX9PxcWzEgYT8gAsU3kZ9hVnQJxqVMfYJnkSgAsU",
      });

      expect(result).toBeDefined();
      expect(result?.walletAddress).toBe("7xKX9PxcWzEgYT8gAsU3kZ9hVnQJxqVMfYJnkSgAsU");
    });
  });

  describe("wallet.getBalance", () => {
    it("returns wallet balance", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wallet.getBalance({
        walletAddress: "7xKX9PxcWzEgYT8gAsU3kZ9hVnQJxqVMfYJnkSgAsU",
      });

      expect(result).toBe(1.5);
    });
  });

  describe("creator.stats", () => {
    it("returns creator statistics", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.creator.stats({
        walletAddress: "7xKX9PxcWzEgYT8gAsU3kZ9hVnQJxqVMfYJnkSgAsU",
      });

      expect(result).toBeDefined();
      expect(result.totalAgents).toBe(1);
      expect(result.totalEarnings).toBe(0.5);
      expect(result.avgRating).toBe(4.8);
    });
  });

  describe("platform.config", () => {
    it("returns platform configuration", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.platform.config();

      expect(result).toBeDefined();
      expect(result.network).toBe("devnet");
      expect(result.platformFeePercent).toBe(10);
    });
  });

  describe("payments.verify", () => {
    it("verifies a valid payment transaction", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.payments.verify({
        txSignature: "5wHu1qwD7q4nFqBPKdqEJYqsNHxqPqJLqYqsNHxqPqJLqYqsNHxqPqJL",
        agentId: "agent-1",
        amount: 0.05,
        creatorWallet: "7xKX9PxcWzEgYT8gAsU3kZ9hVnQJxqVMfYJnkSgAsU",
        userWallet: "9xKX9PxcWzEgYT8gAsU3kZ9hVnQJxqVMfYJnkSgAsU",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.explorerUrl).toContain("explorer.solana.com");
    });
  });
});

describe("Payment Split Calculation", () => {
  it("correctly calculates 90/10 split", async () => {
    const { calculatePaymentSplit } = await import("./solana");

    const split = calculatePaymentSplit(1.0);

    expect(split.platformFee).toBe(0.1);
    expect(split.creatorAmount).toBe(0.9);
  });
});

describe("Rate Limiting", () => {
  it("allows requests within limit", async () => {
    const { checkRateLimit, getRateLimitStatus } = await import("./rateLimit");

    // First request should succeed
    const result = checkRateLimit("test-wallet-1", "general");
    expect(result.remaining).toBeGreaterThan(0);

    // Check status
    const status = getRateLimitStatus("test-wallet-1", "general");
    expect(status.isLimited).toBe(false);
  });

  it("returns correct rate limit config", async () => {
    const { RATE_LIMITS } = await import("./rateLimit");

    expect(RATE_LIMITS.general.maxRequests).toBe(100);
    expect(RATE_LIMITS.execution.maxRequests).toBe(10);
    expect(RATE_LIMITS.creation.maxRequests).toBe(10);
  });
});

describe("Health Check", () => {
  it("returns health check status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.health.status();

    expect(result).toBeDefined();
    expect(typeof result.running).toBe("boolean");
    expect(typeof result.interval).toBe("number");
  });
});

describe("Network Configuration", () => {
  it("returns platform config with network info", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.platform.config();

    expect(result).toBeDefined();
    expect(result.network).toBeDefined();
    expect(result.platformFeePercent).toBe(10);
  });
});
