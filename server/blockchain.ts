import { createPublicClient, http, isAddress, formatEther, parseEther } from 'viem';
import { avalancheFuji } from 'viem/chains';

// Configuration
const RPC_URL = process.env.VITE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc'; // Fallback to public RPC
const PLATFORM_WALLET = process.env.PLATFORM_WALLET || ''; // Must be set in .env
const MARKETPLACE_CONTRACT = (process.env.VITE_BASEROOT_MARKETPLACE_ADDRESS || '').toLowerCase(); // V2 contract

// Revenue split aligned with BaserootMarketplaceV2.sol
const CREATOR_PERCENT = 40;
const DAO_PERCENT = 50;
const PLATFORM_FEE_PERCENT = 10;

// Initialize Viem Client
const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(RPC_URL),
});

// Verify a transaction on the blockchain
export interface TransactionVerification {
    success: boolean;
    error?: string;
    amount?: number;
    fromWallet?: string;
    toWallet?: string;
    blockTime?: number;
}

export async function verifyTransaction(
    txSignature: string,
    expectedAmount: number,
    expectedCreatorWallet: string
): Promise<TransactionVerification> {
    console.log(`[Blockchain] Verifying transaction: ${txSignature}`);

    try {
        // 0x prefix is required for Viem
        const hash = txSignature.startsWith('0x') ? txSignature as `0x${string}` : `0x${txSignature}` as `0x${string}`;

        const transaction = await publicClient.getTransaction({ hash });

        if (!transaction) {
            return { success: false, error: 'Transaction not found' };
        }

        // Verify recipient — V2: buyLicense sends to the marketplace contract, which splits internally
        const txTo = transaction.to?.toLowerCase() || '';
        const validRecipients = [
            expectedCreatorWallet.toLowerCase(),
            PLATFORM_WALLET.toLowerCase(),
            MARKETPLACE_CONTRACT, // V2 buyLicense sends AVAX to contract
        ].filter(Boolean);

        if (!validRecipients.includes(txTo)) {
            console.warn(`[Blockchain] Transaction recipient mismatch. Expected one of [${validRecipients.join(', ')}], got ${txTo}`);
            return { success: false, error: 'Transaction recipient mismatch' };
        }

        // Verify amount
        const valueEth = formatEther(transaction.value);
        const valueNum = parseFloat(valueEth);

        // 1% tolerance for floating point
        if (Math.abs(valueNum - expectedAmount) > expectedAmount * 0.01) {
            return { success: false, error: `Amount mismatch. Expected ${expectedAmount}, got ${valueNum}` };
        }

        return {
            success: true,
            amount: valueNum,
            fromWallet: transaction.from,
            toWallet: transaction.to || '',
            blockTime: Number(Date.now() / 1000), // Block time might require getBlock. Simplified.
        };

    } catch (error) {
        console.error('[Blockchain] Verification error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// Get wallet balance
export async function getWalletBalance(walletAddress: string): Promise<number> {
    try {
        if (!isAddress(walletAddress)) return 0;
        const balance = await publicClient.getBalance({ address: walletAddress as `0x${string}` });
        return parseFloat(formatEther(balance));
    } catch (error) {
        console.error('[Blockchain] Balance error:', error);
        return 0;
    }
}

// Validate wallet address
export function isValidWalletAddress(address: string): boolean {
    return isAddress(address);
}

// Get explorer URL for transaction
export function getExplorerUrl(txSignature: string): string {
    return `https://testnet.snowtrace.io/tx/${txSignature}`;
}

export function getPlatformConfig() {
    return {
        platformWallet: PLATFORM_WALLET,
        platformFeePercent: PLATFORM_FEE_PERCENT,
        rpcUrl: RPC_URL,
        network: 'avalanche-fuji',
        networkName: 'Avalanche Fuji',
        explorerUrl: 'https://testnet.snowtrace.io',
    };
}

export function calculatePaymentSplit(amount: number): {
    total: number;
    creatorAmount: number;
    daoAmount: number;
    platformFee: number;
} {
    const creatorAmount = amount * (CREATOR_PERCENT / 100);
    const daoAmount = amount * (DAO_PERCENT / 100);
    const platformFee = amount - creatorAmount - daoAmount; // remainder → protocol (10%)
    return {
        total: amount,
        creatorAmount,
        daoAmount,
        platformFee,
    };
}
