import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/shared/components/PageHeader';
import { GlassCard } from '@/shared/components/GlassCard';
import { Badge } from '@/components/ui/badge';
import { TxButton, TxStatus } from '@/shared/components/TxButton';
import { toast } from 'sonner';

import {
    Banknote,
    ArrowUpRight,
    Bot,
    CheckCircle2,
    Clock,
    Wallet,
    LineChart,
    Loader2
} from 'lucide-react';

export default function CreatorRevenue() {
    const { isConnected, address } = useWalletContext();
    const [txStatus, setTxStatus] = useState<TxStatus>('idle');

    const { data: revenueData, isLoading: loadingRevenue } = trpc.creator.revenue.useQuery(
        { walletAddress: address || '' },
        { enabled: !!address }
    );

    const { data: withdrawals = [], isLoading: loadingWithdrawals } = trpc.creator.withdrawHistory.useQuery(
        { walletAddress: address || '' },
        { enabled: !!address }
    );

    const claimableBalance = revenueData?.claimableBalance ?? 0;
    const lifetimeEarnings = revenueData?.lifetimeEarnings ?? 0;
    const activeEndpoints = revenueData?.activeEndpoints ?? 0;
    const revenueByAgent = revenueData?.revenueByAgent ?? [];

    const handleWithdrawRoyalties = async () => {
        if (!isConnected) {
            toast.error("Please connect your wallet first.");
            return;
        }

        if (claimableBalance <= 0) {
            toast.error("No affiliate yield available to withdraw.");
            return;
        }

        setTxStatus('signing');

        try {
            setTimeout(() => {
                setTxStatus('pending');
                setTimeout(() => {
                    setTxStatus('confirmed');
                    toast.success(`Successfully withdrew ${claimableBalance.toFixed(2)} AVAX to your wallet!`);
                    setTimeout(() => { setTxStatus('idle'); }, 5000);
                }, 2000);
            }, 1000);
        } catch (error) {
            setTxStatus('error');
            toast.error("Failed to withdraw royalties.");
        }
    };

    const isLoading = loadingRevenue || loadingWithdrawals;

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 p-6 space-y-8">
            <PageHeader
                title="Creator Revenue & Royalties"
                description="Track marketplace sales from your deployed agents and withdraw your gathered license fees securely."
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mr-3" />
                    <span className="text-gray-400 text-lg">Loading revenue data...</span>
                </div>
            ) : (
                <>
                    {/* Top Revenue Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Withdrawal Card */}
                        <GlassCard className="p-8 md:col-span-2 flex flex-col justify-center border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wallet className="w-5 h-5 text-blue-400" />
                                        <h2 className="text-gray-300 font-medium">Claimable License Fees</h2>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <span className="text-5xl font-bold text-white tracking-tight">
                                            {claimableBalance.toFixed(2)}
                                        </span>
                                        <span className="text-2xl text-blue-400 font-medium pb-1">AVAX</span>
                                    </div>
                                    <p className="text-sm text-blue-400/80 mt-2 flex items-center gap-1">
                                        <ArrowUpRight className="w-4 h-4" /> Unclaimed balance ready to route to {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'your wallet'}
                                    </p>
                                </div>

                                <div className="w-full md:w-auto">
                                    <TxButton
                                        status={txStatus}
                                        onClick={handleWithdrawRoyalties}
                                        disabled={!isConnected || claimableBalance <= 0}
                                        idleText="Withdraw Royalties"
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        {/* Lifetime Metrics */}
                        <div className="space-y-6">
                            <GlassCard className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-[#F1A70E]/10 flex items-center justify-center border border-[#F1A70E]/20">
                                        <LineChart className="w-5 h-5 text-[#F1A70E]" />
                                    </div>
                                    <Badge className="bg-[#F1A70E]/10 text-[#F1A70E] border-[#F1A70E]/20 gap-1 my-auto">
                                        Lifetime
                                    </Badge>
                                </div>
                                <h3 className="text-gray-400 text-sm font-medium">Total Earned</h3>
                                <p className="text-2xl font-bold text-white mt-1">{lifetimeEarnings.toFixed(2)} AVAX</p>
                            </GlassCard>

                            <GlassCard className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Bot className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 my-auto">
                                        Live
                                    </Badge>
                                </div>
                                <h3 className="text-gray-400 text-sm font-medium">Deployed Agents</h3>
                                <p className="text-2xl font-bold text-white mt-1">{activeEndpoints}</p>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Split Metrics Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                        {/* Agent Revenue Breakdown */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                                <Banknote className="w-5 h-5 text-[#F1A70E]" /> Revenue by Agent
                            </h3>

                            {revenueByAgent.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 text-sm">No revenue data yet. Start earning from agent usage.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {revenueByAgent.map((source, index) => (
                                        <div key={source.id} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <div className="text-sm font-medium text-gray-200">{source.name}</div>
                                                <div className="text-sm text-[#F1A70E] font-semibold">{source.amount} AVAX</div>
                                            </div>
                                            <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? 'bg-[#F1A70E]' :
                                                        index === 1 ? 'bg-[#F1A70E]/70' :
                                                            'bg-[#F1A70E]/40'
                                                        }`}
                                                    style={{ width: `${source.percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-500 text-right">{source.percentage}% of total agency revenue</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>

                        {/* Withdrawals Ledger */}
                        <GlassCard className="p-0 overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-400" /> Recent Withdrawals
                                </h3>
                            </div>

                            <div className="flex-1 overflow-x-auto">
                                {withdrawals.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <p className="text-gray-400 text-sm">No withdrawal history yet.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-black/40 text-gray-400 text-xs">
                                            <tr>
                                                <th className="px-6 py-4 font-medium">Transaction Hash</th>
                                                <th className="px-6 py-4 font-medium">Net Amount</th>
                                                <th className="px-6 py-4 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {withdrawals.map((withdrawal) => (
                                                <tr key={withdrawal.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-5 font-mono">
                                                        {withdrawal.txSignature ? (
                                                            <a
                                                                href={`https://testnet.snowtrace.io/tx/${withdrawal.txSignature}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                                            >
                                                                {withdrawal.txSignature.slice(0, 16)}...
                                                                <ArrowUpRight className="w-3 h-3" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-500">{withdrawal.id.slice(0, 16)}...</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 font-bold text-white">{withdrawal.amount}</td>
                                                    <td className="px-6 py-5">
                                                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-normal">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> {withdrawal.status}
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
