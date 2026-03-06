import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// Firebase imports
import { initializeFirebase } from "./firebase";
import {
  createAgent,
  getAgentById,
  getAgents,
  getAgentsByCreator,
  updateAgent,
  searchAgents,
  incrementAgentUses,
  createPayment,
  getPaymentByTxSignature,
  getPaymentsByWallet,
  updatePaymentStatus,
  createAgentRun,
  getAgentRuns,
  getUserAgentRuns,
  createOrUpdateUser,
  getUserByUid,
  getUserByWallet,
  updateUserStats,
  getDatasetById,
} from "./firestore-db";

import {
  generateAuthMessage,
  validateAuthMessageTimestamp,
  authenticateWithWallet,
} from "./firebase-auth";

// Blockchain imports (EVM/Avalanche)
import {
  verifyTransaction,
  getWalletBalance,
  getPlatformConfig,
  calculatePaymentSplit,
  isValidWalletAddress,
  getExplorerUrl,
} from "./blockchain";

// Health check imports (unchanged)
import {
  checkSingleAgentHealth,
  runHealthChecks,
  getHealthCheckStatus,
  startHealthCheckScheduler,
} from "./healthCheck";

// Rate limit imports (unchanged)
import {
  checkRateLimit,
  getRateLimitStatus,
  getAllRateLimitStats,
  RATE_LIMITS,
} from "./rateLimit";
// V2 Gateway removed

// Core imports


// Feature routers (will be updated separately)
import { reviewsRouter } from "./reviews-router";
import { notificationsRouter, sendNotification } from "./notifications-router";
import { analyticsRouter } from "./analytics-router";
import { favoritesRouter } from "./favorites-router";
import { subscriptionsRouter } from "./subscriptions-router";
import { versioningRouter } from "./versioning-router";
import { paymentCreditsRouter } from "./payment-credits-router";
import { adminRouter } from "./admin-router";
import { datasetsRouter } from "./datasets-router"; // V2 NEW
import { createPaymentCredit, usePaymentCredit } from "./payment-credits";
import { executeRemoteAgent } from "./runners/httpRunner";
import { agentRunRouter } from "./agent-router"; // ChainGPT PoC
import { dashboardRouter } from "./dashboard-router"; // ChainGPT PoC
import { validateChainGPTConfig } from "./services/chaingpt"; // ChainGPT PoC
import { startLicenseSync, checkLicenseForAgent, getLicensesByWallet } from "./licenseSync";
import { createLedgerEntry } from "./inference-db";
import { splitAmount } from "./services/attribution";

// Initialize Firebase on startup
initializeFirebase();
console.log('[Server] Firebase initialized successfully');

// Start license event sync (non-blocking)
startLicenseSync().catch(err => console.error('[Server] License sync failed to start:', err));

// Validate ChainGPT config (fail-fast if API key missing)
try {
  validateChainGPTConfig();
} catch (err) {
  console.warn('[Server] ChainGPT validation warning:', (err as Error).message);
  console.warn('[Server] agentRun.run will not work without CHAINGPT_API_KEY');
}

export const appRouter = router({
  system: systemRouter,
  reviews: reviewsRouter,
  notifications: notificationsRouter,
  analytics: analyticsRouter,
  favorites: favoritesRouter,
  subscriptions: subscriptionsRouter,
  versioning: versioningRouter,
  paymentCredits: paymentCreditsRouter,
  datasets: datasetsRouter, // V2 NEW

  // V2 Protocol Gateway (Obsolete)

  // ChainGPT PoC — LLM Inference + Economic Attribution
  agentRun: agentRunRouter,
  dashboard: dashboardRouter,


  auth: router({
    // Returns the Firestore user doc for the authenticated Firebase user (via Authorization: Bearer <idToken>)
    me: publicProcedure.query(opts => opts.ctx.user),

    // Wallet-based Firebase Auth (custom token)
    walletMessage: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .mutation(({ input }) => {
        if (!isValidWalletAddress(input.walletAddress)) {
          throw new Error('Invalid wallet address');
        }
        const message = generateAuthMessage(input.walletAddress);
        return { message } as const;
      }),

    walletLogin: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        signature: z.string(),
        message: z.string(),
        username: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        if (!isValidWalletAddress(input.walletAddress)) {
          throw new Error('Invalid wallet address');
        }
        if (!validateAuthMessageTimestamp(input.message)) {
          throw new Error('Auth message expired');
        }

        const result = await authenticateWithWallet(
          input.walletAddress,
          input.signature,
          input.message
        );

        if (!result) {
          throw new Error('Wallet authentication failed');
        }

        // Optional: set username on first login / update
        if (input.username) {
          await createOrUpdateUser(result.uid, { username: input.username } as any);
        }

        return {
          uid: result.uid,
          walletAddress: result.walletAddress,
          customToken: result.customToken,
          isNewUser: result.isNewUser,
        } as const;
      }),

    // Client should call Firebase signOut; this endpoint is kept for backward compatibility.
    logout: publicProcedure.mutation(() => ({ success: true } as const)),
  }),

  admin: adminRouter,




  // Agent routes
  agents: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        if (input?.search) {
          return searchAgents(input.search, input.category);
        }

        const filter: any = { status: 'active' };
        if (input?.category && input.category !== 'all') {
          filter.category = input.category;
        }
        return getAgents(filter);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return getAgentById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        creatorWallet: z.string(),
        creatorUid: z.string().optional(), // Firebase UID
        category: z.string(),
        tags: z.array(z.string()),
        endpointUrl: z.string().url(),
        apiKeyRequired: z.boolean().default(false),
        healthCheckUrl: z.string().url().optional(),
        publicKey: z.string().optional(),
        pricePerUse: z.number().positive(),
        currency: z.literal('AVAX').default('AVAX'),
        datasetIds: z.array(z.string()).optional(), // V2 NEW
      }))
      .mutation(async ({ input }) => {
        // Apply rate limiting for agent creation
        checkRateLimit(input.creatorWallet, 'creation');

        if (!isValidWalletAddress(input.creatorWallet)) {
          throw new Error('Invalid wallet address');
        }

        // Get or create user
        let user = await getUserByWallet(input.creatorWallet);
        if (!user) {
          const uid = input.creatorUid || `wallet_${input.creatorWallet}`;
          user = await createOrUpdateUser(uid, {
            walletAddress: input.creatorWallet,
            role: 'creator',
          } as any);
        }

        return createAgent({
          ...input,
          creatorUid: user.uid,
          totalUses: 0,
          successRate: 100,
          responseTimeAvg: 0,
          rating: 0,
          ratingCount: 0,
          status: 'active',
        });
      }),

    update: publicProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          tags: z.array(z.string()).optional(),
          endpointUrl: z.string().url().optional(),
          pricePerUse: z.number().positive().optional(),
          status: z.enum(['pending', 'active', 'suspended']).optional(),
          datasetIds: z.array(z.string()).optional(), // V2 NEW
        }),
      }))
      .mutation(async ({ input }) => {
        return updateAgent(input.id, input.data);
      }),

    getByCreator: publicProcedure
      .input(z.object({
        walletAddress: z.string().optional(),
        creatorUid: z.string().optional(),
      }))
      .query(async ({ input }) => {
        if (input.creatorUid) {
          return getAgentsByCreator(input.creatorUid);
        }

        if (input.walletAddress) {
          return getAgentsByCreator(undefined, input.walletAddress);
        }

        return [];
      }),
  }),

  // Payment routes
  payments: router({
    verify: publicProcedure
      .input(z.object({
        txSignature: z.string().min(1),
        agentId: z.string().min(1),
        amount: z.number(),
        creatorWallet: z.string().min(1),
        userWallet: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        console.log(`[TRPC] Verifying payment for tx: ${input.txSignature}`);

        // Check if payment already exists (prevent double-spend)
        const existingPayment = await getPaymentByTxSignature(input.txSignature);
        if (existingPayment) {
          console.warn(`[TRPC] Payment already exists for tx: ${input.txSignature}`);
          return {
            success: false,
            error: 'Payment already recorded',
            payment: existingPayment,
          };
        }

        // Verify transaction on blockchain
        console.log(`[TRPC] Calling verifyTransaction...`);
        const verification = await verifyTransaction(
          input.txSignature,
          input.amount,
          input.creatorWallet
        );

        if (!verification.success) {
          console.error(`[TRPC] Blockchain verification FAILED: ${verification.error}`);
          return { success: false, error: verification.error };
        }

        console.log(`[TRPC] Blockchain verification SUCCESS`);

        // Helper for timeouts
        const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, name: string): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs))
          ]);
        };

        try {
          // Get agent info
          console.log(`[TRPC] Fetching agent info for ID: "${input.agentId}"...`);
          const agent = await withTimeout(getAgentById(input.agentId), 10000, 'getAgentById');
          if (!agent) {
            console.error(`[TRPC] Agent not found in Firestore: ${input.agentId}`);
            return { success: false, error: 'Agent not found' };
          }
          console.log(`[TRPC] Agent info retrieved: ${agent.name} (Creator: ${agent.creatorWallet})`);

          // Get or create users
          console.log(`[TRPC] Fetching users from Firestore...`);
          const fromUser = await withTimeout(getUserByWallet(input.userWallet), 10000, 'getUserByWallet(sender)');
          const toUser = await withTimeout(getUserByWallet(input.creatorWallet), 10000, 'getUserByWallet(receiver)');
          console.log(`[TRPC] Users check: senderUID=${fromUser?.uid || 'NONE'}, receiverUID=${toUser?.uid || 'NONE'}`);

          console.log(`[TRPC] Recording payment in Firestore...`);

          // Calculate split based on agent's datasets??
          // For now, standard split because client side calc logic needs to match
          // If we want verification.datasetSplits, we need verifyTransaction to return them
          // Assuming verifyTransaction parses the splits from the TX

          const split = calculatePaymentSplit(input.amount);

          // V2: Harmonize with Attribution Split (3-way)
          const attributionBreakdown = splitAmount(input.amount);

          const payment = await withTimeout(createPayment({
            txSignature: input.txSignature,
            fromWallet: input.userWallet,
            fromUid: fromUser?.uid,
            toWallet: input.creatorWallet,
            toUid: toUser?.uid,
            agentId: input.agentId,
            agentName: agent.name,
            amount: input.amount,
            currency: 'AVAX',
            platformFee: split.platformFee,
            creatorAmount: split.creatorAmount,
            status: 'completed',
            // V2 TODO: capture dataset splits from verification result
          }), 10000, 'createPayment');
          console.log(`[TRPC] Payment record created: ${payment.id}`);

          // V2: Create Ledger Entries for DAOs (Data Providers)
          if (agent.datasetIds && agent.datasetIds.length > 0) {
            console.log(`[TRPC] Creating ledger entries for ${agent.datasetIds.length} datasets...`);

            // Split the DAO portion among all datasets
            const perDatasetDaoAmount = attributionBreakdown.dao_data_provider_amount / agent.datasetIds.length;

            for (const datasetId of agent.datasetIds) {
              try {
                const dataset = await withTimeout(getDatasetById(datasetId), 5000, `getDatasetById(${datasetId})`);
                if (dataset) {
                  await createLedgerEntry({
                    dao_id: dataset.ownerWallet, // Target DAO is the dataset owner
                    inference_id: `license_${payment.id}`, // Reference the payment/license
                    tx_signature: input.txSignature,
                    amount_total: input.amount,
                    currency: 'AVAX',
                    breakdown: {
                      dao_data_provider_amount: perDatasetDaoAmount,
                      agent_developer_amount: attributionBreakdown.agent_developer_amount / agent.datasetIds.length,
                      protocol_amount: attributionBreakdown.protocol_amount / agent.datasetIds.length,
                    }
                  });
                  console.log(`[TRPC] Ledger entry created for DAO: ${dataset.ownerWallet}`);
                }
              } catch (ledgerErr) {
                console.warn(`[TRPC] Failed to create ledger entry for dataset ${datasetId}:`, ledgerErr);
              }
            }
          }

          // Update agent usage count
          console.log(`[TRPC] Incrementing agent uses...`);
          await withTimeout(incrementAgentUses(input.agentId, 0, true), 10000, 'incrementAgentUses');

          // Update user stats
          console.log(`[TRPC] Updating user stats...`);
          if (fromUser && fromUser.uid) {
            await withTimeout(updateUserStats(fromUser.uid, input.amount, undefined), 10000, 'updateUserStats(sender)');
          } else {
            console.warn(`[TRPC] Skipping sender stats update: User not found or UID empty (Wallet: ${input.userWallet})`);
          }

          if (toUser && toUser.uid) {
            await withTimeout(updateUserStats(toUser.uid, undefined, split.creatorAmount), 10000, 'updateUserStats(receiver)');
          } else {
            console.warn(`[TRPC] Skipping receiver stats update: User not found or UID empty (Wallet: ${input.creatorWallet})`);
          }

          // Send notifications (non-blocking errors)
          console.log(`[TRPC] Sending notifications...`);
          try {
            if (toUser && toUser.uid) {
              await sendNotification({
                userId: toUser.uid,
                type: 'payment',
                title: 'Payment Received',
                message: `You received ${split.creatorAmount.toFixed(4)} AVAX for agent usage`,
                data: { txSignature: input.txSignature, agentId: input.agentId },
              });
            }
            if (fromUser && fromUser.uid) {
              await sendNotification({
                userId: fromUser.uid,
                type: 'payment',
                title: 'Payment Confirmed',
                message: `Payment of ${input.amount.toFixed(4)} AVAX confirmed`,
                data: { txSignature: input.txSignature, agentId: input.agentId },
              });
            }
          } catch (notifErr) {
            console.warn('[TRPC] Notification failed (non-critical):', notifErr);
          }

          // Create payment credit
          console.log(`[TRPC] Creating payment credit...`);
          const credit = await withTimeout(createPaymentCredit({
            userId: input.userWallet,
            agentId: input.agentId,
            agentName: agent.name,
            paymentId: payment.id,
            txSignature: input.txSignature,
            amountPaid: input.amount,
            currency: 'AVAX',
            status: 'available',
          }), 10000, 'createPaymentCredit');
          console.log(`[TRPC] Credit created: ${credit?.id || 'FAILED'}`);

          console.log(`[TRPC] Payment verify SUCCESS`);
          return {
            success: true,
            payment,
            creditId: credit?.id,
            explorerUrl: getExplorerUrl(input.txSignature),
          };
        } catch (dbErr: any) {
          console.error('[TRPC] Firestore operation FAILED or TIMED OUT:', dbErr);
          return {
            success: false,
            error: `Database operation fell through: ${dbErr.message || 'Unknown error'}`,
          };
        }
      }),

    getByTx: publicProcedure
      .input(z.object({ txSignature: z.string() }))
      .query(async ({ input }) => {
        return getPaymentByTxSignature(input.txSignature);
      }),

    getByWallet: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        type: z.enum(['from', 'to']).default('from'),
      }))
      .query(async ({ input }) => {
        return getPaymentsByWallet(input.walletAddress, input.type);
      }),
  }),

  // Agent execution routes
  execution: router({
    run: publicProcedure
      .input(z.object({
        agentId: z.string(),
        userWallet: z.string(),
        message: z.string(),
        paymentId: z.string().optional(),
        creditId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // License gate: verify user has a valid license before inference
        const licenseCheck = await checkLicenseForAgent(input.userWallet, input.agentId);
        if (!licenseCheck.hasLicense) {
          throw new Error('No valid license found for this agent. Please purchase a license first.');
        }
        console.log(`[Execution] License verified: #${licenseCheck.licenseId} for ${input.userWallet}`);

        // If using a payment credit, mark it as used
        if (input.creditId) {
          const creditUsed = await usePaymentCredit(input.creditId);
          if (!creditUsed) {
            throw new Error('Failed to use payment credit. Credit may have already been used or expired.');
          }
        }

        // Apply rate limiting for agent execution
        checkRateLimit(input.userWallet, 'execution');

        const agent = await getAgentById(input.agentId);
        if (!agent) {
          throw new Error('Agent not found');
        }

        const startTime = Date.now();
        let responseData: Record<string, unknown> = {};
        let status: 'success' | 'failed' | 'timeout' = 'success';
        let errorMessage: string | undefined;

        try {
          // Construct the standard request payload
          const requestPayload = {
            taskId: `task_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            agentId: input.agentId,
            userWallet: input.userWallet,
            input: {
              prompt: input.message,
            },
            paymentProof: {
              txSignature: undefined, // Update this if we have the tx signature passed in input
              paymentId: input.paymentId,
            },
            timestamp: Date.now(),
          };

          // Execute remote agent via proxy
          // This replaces the previous 'facade' LLM call
          const agentResponse = await executeRemoteAgent(
            agent.endpointUrl,
            requestPayload,
            agent.publicKey // Pass the agent's public key for signature verification
          );

          status = agentResponse.status === 'success' ? 'success' : 'failed';
          errorMessage = agentResponse.error;

          responseData = {
            content: agentResponse.output, // Should be whatever the agent returned
            metadata: agentResponse.metadata,
            usage: agentResponse.usage,
          };

          // Legacy support: if output is a string, wrap it in the expected structure for frontend
          if (typeof responseData.content === 'string') {
            // The frontend expects 'content' to be the message text
            // references client/src/components/AIChatBox.tsx streamdown
          } else if (typeof responseData.content === 'object' && responseData.content !== null) {
            // If agent returns JSON, we might need to stringify it for the chat view or handle it
            if ((responseData.content as any).message) {
              responseData.content = (responseData.content as any).message;
            } else if ((responseData.content as any).text) {
              responseData.content = (responseData.content as any).text;
            } else {
              responseData.content = JSON.stringify(responseData.content);
            }
          }

        } catch (error) {
          console.error('[Execution] Remote execution failed:', error);
          status = 'failed';
          errorMessage = error instanceof Error ? error.message : 'Unknown error';
          responseData = { error: errorMessage };
        }

        const responseTime = Date.now() - startTime;

        // Get user UID
        const user = await getUserByWallet(input.userWallet);

        // Record the run in Firestore
        const run = await createAgentRun({
          agentId: input.agentId,
          agentName: agent.name,
          userWallet: input.userWallet,
          userUid: user?.uid,
          paymentId: input.paymentId,
          txSignature: undefined,
          requestData: { message: input.message },
          responseData,
          responseTime,
          status,
          errorMessage,
        });

        // Update agent stats
        await incrementAgentUses(input.agentId, responseTime, status === 'success');

        return {
          success: status === 'success',
          response: responseData,
          responseTime,
          runId: run.id,
        };
      }),

    getHistory: publicProcedure
      .input(z.object({
        agentId: z.string(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return getAgentRuns(input.agentId, input.limit);
      }),

    getUserHistory: publicProcedure
      .input(z.object({
        userWallet: z.string(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return getUserAgentRuns(input.userWallet, input.limit);
      }),
  }),

  // License routes
  licenses: router({
    check: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        agentId: z.string(),
      }))
      .query(async ({ input }) => {
        return checkLicenseForAgent(input.walletAddress, input.agentId);
      }),

    getByWallet: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
      }))
      .query(async ({ input }) => {
        return getLicensesByWallet(input.walletAddress);
      }),
  }),

  // Wallet user routes
  wallet: router({
    connect: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        username: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        if (!isValidWalletAddress(input.walletAddress)) {
          throw new Error('Invalid wallet address');
        }

        // Get or create user
        let user = await getUserByWallet(input.walletAddress);
        if (!user) {
          const uid = `wallet_${input.walletAddress}`;
          user = await createOrUpdateUser(uid, {
            walletAddress: input.walletAddress,
            username: input.username,
            role: 'user',
          } as any);
        } else if (input.username) {
          user = await createOrUpdateUser(user.uid, {
            username: input.username,
          } as any);
        }

        return user;
      }),

    getUser: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .query(async ({ input }) => {
        return getUserByWallet(input.walletAddress);
      }),

    getBalance: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .query(async ({ input }) => {
        return getWalletBalance(input.walletAddress);
      }),
  }),

  // Creator dashboard routes
  creator: router({
    stats: publicProcedure
      .input(z.object({
        walletAddress: z.string().optional(),
        creatorUid: z.string().optional(),
      }))
      .query(async ({ input }) => {
        let uid = input.creatorUid;

        if (!uid && input.walletAddress) {
          const user = await getUserByWallet(input.walletAddress);
          if (!user) {
            return {
              totalAgents: 0,
              totalEarnings: 0,
              totalUses: 0,
              avgRating: 0,
            };
          }
          uid = user.uid;
        }

        if (!uid) {
          throw new Error('Creator UID or wallet address required');
        }

        // Get creator's agents
        const agents = await getAgentsByCreator(uid);

        // Calculate stats
        const totalAgents = agents.length;
        const totalUses = agents.reduce((sum, agent) => sum + agent.totalUses, 0);
        const avgRating = agents.length > 0
          ? agents.reduce((sum, agent) => sum + agent.rating, 0) / agents.length
          : 0;

        // Get user for earnings
        const user = await getUserByUid(uid);
        const totalEarnings = user?.totalEarned || 0;

        return {
          totalAgents,
          totalEarnings,
          totalUses,
          avgRating,
        };
      }),

    earnings: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .query(async ({ input }) => {
        const payments = await getPaymentsByWallet(input.walletAddress, 'to');
        return payments.filter(p => p.status === 'completed');
      }),

    // Revenue breakdown for /creator/revenue page
    revenue: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
      }))
      .query(async ({ input }) => {
        // Get user
        const user = await getUserByWallet(input.walletAddress);
        if (!user) {
          return {
            claimableBalance: 0,
            lifetimeEarnings: 0,
            activeEndpoints: 0,
            revenueByAgent: [],
          };
        }

        // Get creator's agents
        const agents = await getAgentsByCreator(user.uid);
        const activeEndpoints = agents.filter(a => a.status === 'active').length;

        // Get all completed payments TO this creator
        const payments = await getPaymentsByWallet(input.walletAddress, 'to');
        const completedPayments = payments.filter(p => p.status === 'completed');

        // Calculate lifetime earnings
        const lifetimeEarnings = completedPayments.reduce(
          (sum, p) => sum + (p.creatorAmount || p.amount || 0), 0
        );

        // Per-agent breakdown
        const agentRevenueMap: Record<string, { name: string; amount: number }> = {};
        for (const payment of completedPayments) {
          const agentId = payment.agentId || 'unknown';
          if (!agentRevenueMap[agentId]) {
            agentRevenueMap[agentId] = {
              name: payment.agentName || 'Unknown Agent',
              amount: 0,
            };
          }
          agentRevenueMap[agentId].amount += (payment.creatorAmount || payment.amount || 0);
        }

        const revenueByAgent = Object.entries(agentRevenueMap)
          .map(([id, data]) => ({
            id,
            name: data.name,
            amount: Math.round(data.amount * 10000) / 10000,
            percentage: lifetimeEarnings > 0
              ? Math.round((data.amount / lifetimeEarnings) * 100)
              : 0,
          }))
          .sort((a, b) => b.amount - a.amount);

        // Claimable balance: For PoC, simulate as 30% of lifetime not yet withdrawn
        // In production, this would track against on-chain withdrawals
        const claimableBalance = Math.round(lifetimeEarnings * 0.3 * 10000) / 10000;

        return {
          claimableBalance,
          lifetimeEarnings: Math.round(lifetimeEarnings * 10000) / 10000,
          activeEndpoints,
          revenueByAgent,
        };
      }),

    // Withdraw history for /creator/revenue page
    withdrawHistory: publicProcedure
      .input(z.object({
        walletAddress: z.string(),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        // For PoC, we derive "withdrawals" from completed outbound payments
        // In production, this would be a separate Firestore collection tracking on-chain withdrawals
        const payments = await getPaymentsByWallet(input.walletAddress, 'to');
        const completed = payments
          .filter(p => p.status === 'completed')
          .slice(0, input.limit)
          .map(p => ({
            id: p.txSignature || p.id,
            amount: `${(p.creatorAmount || p.amount || 0).toFixed(4)} AVAX`,
            timestamp: p.createdAt,
            txSignature: p.txSignature,
            status: 'Confirmed' as const,
          }));

        return completed;
      }),
  }),

  // Platform config
  platform: router({
    config: publicProcedure.query(() => {
      return getPlatformConfig();
    }),
  }),

  // Health check routes
  health: router({
    checkAgent: publicProcedure
      .input(z.object({ agentId: z.string() }))
      .query(async ({ input }) => {
        return checkSingleAgentHealth(input.agentId);
      }),

    runAll: publicProcedure.mutation(async () => {
      return runHealthChecks();
    }),

    status: publicProcedure.query(() => {
      return getHealthCheckStatus();
    }),
  }),

  // Rate limit routes
  rateLimit: router({
    status: publicProcedure
      .input(z.object({
        identifier: z.string(),
        limitType: z.enum(['general', 'execution', 'payment', 'creation', 'healthCheck']),
      }))
      .query(({ input }) => {
        return getRateLimitStatus(input.identifier, input.limitType);
      }),

    stats: publicProcedure.query(() => {
      return getAllRateLimitStats();
    }),

    config: publicProcedure.query(() => {
      return RATE_LIMITS;
    }),
  }),
});

export type AppRouter = typeof appRouter;
