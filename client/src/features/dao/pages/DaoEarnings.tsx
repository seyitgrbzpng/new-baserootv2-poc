import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/shared/components/PageHeader';
import { GlassCard } from '@/shared/components/GlassCard';
import { Badge } from '@/components/ui/badge';
import { TxButton, TxStatus } from '@/shared/components/TxButton';
import { toast } from 'sonner';

import {
    Vault,
    ArrowUpRight,
    Database,
    CheckCircle2,
    Clock,
    Wallet,
    Loader2,
    TrendingUp,
    Coins,
} from 'lucide-react';

export default function DaoEarnings() {
    const { isConnected, address } = useWalletContext();
    const [txStatus, setTxStatus] = useState<TxStatus>('idle');

    // Use wallet address as dao_id for PoC
    const daoId = address || '';

    const utils = trpc.useUtils();

    const { data: earningsData, isLoading } = trpc.dashboard.earnings.useQuery(
        { dao_id: daoId },
        { enabled: !!daoId }
    );

    const claimMutation = trpc.dashboard.claimYield.useMutation({
        onSuccess: () => {
            utils.dashboard.earnings.invalidate({ dao_id: daoId });
        },
    });

    const claimableBalance = earningsData?.claimableBalance ?? 0;
    const totalYieldClaimed = earningsData?.totalYieldClaimed ?? 0;
    const revenueByDataset = earningsData?.revenueByDataset ?? [];
    const claimHistory = earningsData?.claimHistory ?? [];

    const handleClaimYield = async () => {
        if (!isConnected) {
            toast.error("Please connect your wallet first.");
            return;
        }

        if (claimableBalance <= 0) {
            toast.error("No yield available to claim.");
            return;
        }

        setTxStatus('signing');

        try {
            // Keep the artificial 3-second 'signing/pending' UX loop as requested
            setTimeout(async () => {
                setTxStatus('pending');

                await claimMutation.mutateAsync({ dao_id: daoId });

                setTimeout(() => {
                    setTxStatus('confirmed');
                    toast.success(`Successfully settled ${claimableBalance.toFixed(4)} AVAX directly to your wallet history!`);
                    setTimeout(() => { setTxStatus('idle'); }, 5000);
                }, 2000);
            }, 1000);
        } catch (error) {
            setTxStatus('error');
            toast.error("Failed to process yield claim.");
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 p-6 space-y-8">
            <PageHeader
                title="DAO Treasury & Earnings"
                description="Monitor dataset yield accumulation, claim your provider share, and review the attribution ledger."
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mr-3" />
                    <span className="text-gray-400 text-lg">Loading treasury data...</span>
                </div>
            ) : (
                <>
                    {/* Treasury Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Claim Card */}
                        <GlassCard className="p-8 md:col-span-2 flex flex-col justify-center border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Vault className="w-5 h-5 text-emerald-400" />
                                        <h2 className="text-gray-300 font-medium">Claimable Yield Balance</h2>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <span className="text-5xl font-bold text-white tracking-tight">
                                            {claimableBalance.toFixed(4)}
                                        </span>
                                        <span className="text-2xl text-emerald-400 font-medium pb-1">AVAX</span>
                                    </div>
                                    <p className="text-sm text-emerald-400/80 mt-2 flex items-center gap-1">
                                        <ArrowUpRight className="w-4 h-4" /> Accumulated from data attribution splits
                                    </p>
                                </div>

                                <div className="w-full md:w-auto">
                                    <TxButton
                                        status={txStatus}
                                        onClick={handleClaimYield}
                                        disabled={!isConnected || claimableBalance <= 0 || claimMutation.isPending}
                                        idleText="Claim Yield"
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        {/* Lifetime Stats */}
                        <div className="space-y-6">
                            <GlassCard className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-[#F1A70E]/10 flex items-center justify-center border border-[#F1A70E]/20">
                                        <TrendingUp className="w-5 h-5 text-[#F1A70E]" />
                                    </div>
                                    <Badge className="bg-[#F1A70E]/10 text-[#F1A70E] border-[#F1A70E]/20 gap-1 my-auto">
                                        Lifetime
                                    </Badge>
                                </div>
                                <h3 className="text-gray-400 text-sm font-medium">Total Yield Claimed</h3>
                                <p className="text-2xl font-bold text-white mt-1">{totalYieldClaimed.toFixed(4)} AVAX</p>
                            </GlassCard>

                            <GlassCard className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <Database className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1 my-auto">
                                        Active
                                    </Badge>
                                </div>
                                <h3 className="text-gray-400 text-sm font-medium">Revenue Sources</h3>
                                <p className="text-2xl font-bold text-white mt-1">{revenueByDataset.length}</p>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Revenue Breakdown + Claim History */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                        {/* Revenue by Dataset */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                                <Coins className="w-5 h-5 text-[#F1A70E]" /> Revenue by Source
                            </h3>

                            {revenueByDataset.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 text-sm">No revenue data yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {revenueByDataset.map((source, index) => (
                                        <div key={source.id} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <div className="text-sm font-medium text-gray-200">{source.name}</div>
                                                <div className="text-sm text-emerald-400 font-semibold">{source.amount} AVAX</div>
                                            </div>
                                            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? 'bg-emerald-400' :
                                                        index === 1 ? 'bg-emerald-400/70' :
                                                            'bg-emerald-400/40'
                                                        }`}
                                                    style={{ width: `${source.percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-500 text-right">{source.percentage}% of total yield</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>

                        {/* Claim History */}
                        <GlassCard className="p-0 overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-400" /> Claim History
                                </h3>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                {claimHistory.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <p className="text-gray-400 text-sm">No claim history yet.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-black/40 text-gray-400 text-xs">
                                            <tr>
                                                <th className="px-6 py-4 font-medium">Entry ID</th>
                                                <th className="px-6 py-4 font-medium">Transaction Hash</th>
                                                <th className="px-6 py-4 font-medium">Amount</th>
                                                <th className="px-6 py-4 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {claimHistory.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-5 font-mono text-gray-500 text-xs">{entry.id.slice(0, 10)}...</td>
                                                    <td className="px-6 py-5 font-mono">
                                                        {entry.txSignature ? (
                                                            <a
                                                                href={`https://testnet.snowtrace.io/tx/${entry.txSignature}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                                                            >
                                                                {entry.txSignature.slice(0, 16)}...
                                                                <ArrowUpRight className="w-3 h-3" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-600 italic text-xs">Internal / Legacy</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 font-bold text-white">{entry.amount}</td>
                                                    <td className="px-6 py-5">
                                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-normal">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> {entry.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </>
            )}
        </div>
    );
}
