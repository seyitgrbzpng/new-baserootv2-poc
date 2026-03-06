import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
    createDataset,
    getDatasetById,
    getDatasets,
    getDatasetsByOwner,
} from "./firestore-db";
import { getUserByWallet, createOrUpdateUser } from "./firestore-db";
import { checkRateLimit } from "./rateLimit";
import { isValidWalletAddress } from "./blockchain";

export const datasetsRouter = router({
    list: publicProcedure
        .input(z.object({
            search: z.string().optional(),
        }).optional())
        .query(async ({ input }) => {
            // Strip dataContent to enforce Zero-Knowledge (Developer can't read DAO data)
            const datasets = await getDatasets();
            return datasets.map(d => {
                const { dataContent, ...rest } = d;
                return rest;
            });
        }),

    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const d = await getDatasetById(input.id);
            if (!d) return null;
            const { dataContent, ...rest } = d;
            return rest;
        }),

    getByOwner: publicProcedure
        .input(z.object({
            walletAddress: z.string().optional(),
            ownerUid: z.string().optional(),
        }))
        .query(async ({ input }) => {
            if (input.ownerUid) {
                const results = await getDatasetsByOwner(input.ownerUid);
                return results.map(d => {
                    const { dataContent, ...rest } = d;
                    return rest;
                });
            }
            if (input.walletAddress) {
                const user = await getUserByWallet(input.walletAddress);
                if (!user) return [];
                const results = await getDatasetsByOwner(user.uid);
                return results.map(d => {
                    const { dataContent, ...rest } = d;
                    return rest;
                });
            }
            return [];
        }),

    create: publicProcedure
        .input(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            ownerWallet: z.string(),
            ownerUid: z.string().optional(),
            pricePerUse: z.number().optional(),
            revenueShare: z.number().min(0).max(100),
            category: z.string(),
            tags: z.array(z.string()),
            sampleDataUrl: z.string().url().optional(),
            dataType: z.enum(['genomic', 'proteomic', 'imaging', 'clinical', 'environmental', 'web3_governance', 'web3_treasury', 'web3_defi']).optional(),
            dataFormat: z.enum(['csv', 'json', 'fastq', 'dicom', 'text']).optional(),
            dataContent: z.string().optional(),
            txSignature: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            checkRateLimit(input.ownerWallet, 'creation');

            if (!isValidWalletAddress(input.ownerWallet)) {
                throw new Error('Invalid wallet address');
            }

            // Duplicate protection: check if same owner already has a dataset with same title
            const existingDatasets = await getDatasetsByOwner(
                input.ownerUid || `wallet_${input.ownerWallet}`
            );
            const duplicate = existingDatasets.find(
                d => d.title.toLowerCase() === input.title.toLowerCase()
            );
            if (duplicate) {
                throw new Error(`Dataset "${input.title}" already exists for this wallet. Duplicate registration blocked.`);
            }

            // Get or create user
            let user = await getUserByWallet(input.ownerWallet);
            if (!user) {
                const uid = input.ownerUid || `wallet_${input.ownerWallet}`;
                user = await createOrUpdateUser(uid, {
                    walletAddress: input.ownerWallet,
                    role: 'creator', // Datasets also make you a creator
                } as any);
            }

            // Generate content hash if data provided
            let dataHash: string | undefined;
            if (input.dataContent) {
                const { createHash } = await import('crypto');
                dataHash = createHash('sha256').update(input.dataContent).digest('hex');
            }

            return createDataset({
                ...input,
                ownerUid: user.uid,
                dataHash,
            });
        }),
});
