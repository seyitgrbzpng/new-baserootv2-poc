import { useState } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useWalletContext, truncateAddress } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    BookOpen,
    Loader2,
    DollarSign,
    Zap,
    TrendingUp,
    ArrowUpRight,
    AlertTriangle,
    Layers,
    Copy,
    Check,
    Download,
    Database,
    Brain,
    Plus,
    User,
    Shield,
    ExternalLink,
} from 'lucide-react';
import { GlassCard } from '@/shared/components/GlassCard';
import { PageHeader } from '@/shared/components/PageHeader';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const formatCost = (n: number) => `$${n.toFixed(6)}`;

const formatDate = (date: any): string => {
    if (!date) return '—';
    const d = date && typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// ─────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────

export default function DaoDashboard() {
    const { isConnected, address: walletAddress } = useWalletContext();
    const [daoId, setDaoId] = useState('dao_test_001');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // ── Queries ──
    const usageQuery = trpc.dashboard.usage.useQuery(
        { dao_id: daoId },
        { enabled: daoId.length > 0 }
    );

    const ledgerQuery = trpc.dashboard.ledger.useQuery(
        { dao_id: daoId, limit: 50 },
        { enabled: daoId.length > 0 }
    );

    const policyQuery = trpc.dashboard.getPolicy.useQuery(
        { dao_id: daoId },
        { enabled: daoId.length > 0 }
    );

    const datasetsQuery = trpc.datasets.list.useQuery();

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (!isConnected) {
        return (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pt-20 flex flex-col items-center">
                <GlassCard className="max-w-md w-full text-center space-y-4 p-8">
                    <div className="w-16 h-16 rounded-xl bg-[#F1A70E]/10 flex items-center justify-center mx-auto mb-4 border border-[#F1A70E]/20">
                        <Shield className="w-8 h-8 text-[#F1A70E]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">DAO Data Portal</h2>
                    <p className="text-gray-400">
                        Please connect your wallet to manage datasets and view analytics.
                    </p>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <main className="py-8">
                <div className="container max-w-5xl">

                    {/* DAO Profile Card */}
                    <div className="mb-8 animate-in fade-in duration-300">
                        <GlassCard className="p-6 border-[#F1A70E]/20 bg-gradient-to-br from-[#F1A70E]/5 to-purple-500/5">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F1A70E]/30 to-purple-500/30 flex items-center justify-center border border-[#F1A70E]/30 shadow-[0_0_25px_rgba(241,167,14,0.15)] shrink-0">
                                    <Shield className="w-8 h-8 text-[#F1A70E]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl font-bold text-white tracking-tight mb-1">DAO Data Portal</h1>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Badge className="font-mono bg-[#F1A70E]/10 text-[#F1A70E] border-[#F1A70E]/20 text-xs px-2 py-0.5">
                                            {truncateAddress(walletAddress || '')}
                                        </Badge>
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                                            {datasetsQuery.data?.length || 0} Datasets
                                        </Badge>
                                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                                            50% Revenue Share
                                        </Badge>
                                    </div>
                                    <p className="text-gray-500 text-sm mt-2">Register and manage datasets for AI agents. Earn 50% of every license sale.</p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Quick Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in duration-500 delay-100">
                        {/* Register Dataset Card */}
                        <Link href="/dao/datasets/new">
                            <GlassCard className="p-6 cursor-pointer group hover:border-[#F1A70E]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(241,167,14,0.08)]">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                                        <Plus className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-[#F1A70E] transition-colors">Register New Dataset</h3>
                                        <p className="text-gray-400 text-sm mt-1">Deploy a verified data asset on-chain using the Registration Wizard. Auto-generated unique ID.</p>
                                        <div className="flex items-center gap-1 mt-3 text-[#F1A70E] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            Start Wizard <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>

                        {/* View Datasets Card */}
                        <Link href="/dao/datasets">
                            <GlassCard className="p-6 cursor-pointer group hover:border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors shrink-0">
                                        <Database className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">My Datasets</h3>
                                        <p className="text-gray-400 text-sm mt-1">View and manage your registered datasets, provenance proofs, and earnings breakdown.</p>
                                        <div className="flex items-center gap-1 mt-3 text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            View All <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    </div>

                    {/* Stats Overview */}
                    <div className="mb-8 animate-in fade-in duration-500 delay-200">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-[#F1A70E]" />
                            Economic Attribution Overview
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <GlassCard className="p-5 flex flex-col justify-center border-white/5 bg-black/40">
                                <p className="text-gray-400 text-sm font-medium mb-1">Total Datasets</p>
                                <p className="text-3xl font-bold text-white tracking-tight">
                                    {datasetsQuery.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-600" /> : (datasetsQuery.data?.length || 0)}
                                </p>
                            </GlassCard>
                            <GlassCard className="p-5 flex flex-col justify-center border-white/5 bg-black/40">
                                <p className="text-gray-400 text-sm font-medium mb-1">Total Inferences</p>
                                <p className="text-3xl font-bold text-white tracking-tight">
                                    {usageQuery.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-600" /> : (usageQuery.data?.total_inferences || 0)}
                                </p>
                            </GlassCard>
                            <GlassCard className="p-5 flex flex-col justify-center border-emerald-500/20 bg-emerald-500/5">
                                <p className="text-emerald-400 text-sm font-medium mb-1 flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5" /> Total Value
                                </p>
                                <p className="text-3xl font-bold text-emerald-400 tracking-tight">
                                    {usageQuery.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : formatCost(usageQuery.data?.total_cost || 0)}
                                </p>
                            </GlassCard>
                            <GlassCard className="p-5 flex flex-col justify-center border-purple-500/20 bg-purple-500/5">
                                <p className="text-purple-400 text-sm font-medium mb-1 flex items-center gap-1">
                                    <Database className="w-3.5 h-3.5" /> Active Policy
                                </p>
                                <div className="mt-1">
                                    {policyQuery.isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                                    ) : (
                                        <Badge className={`px-2.5 py-1 ${policyQuery.data?.is_custom ? 'bg-[#F1A70E]/20 text-[#F1A70E] border-[#F1A70E]/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                                            {policyQuery.data?.is_custom ? 'Custom' : 'Global Default'}
                                        </Badge>
                                    )}
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Attribution Ledger */}
                    <div className="animate-in fade-in duration-500 delay-300">
                        <GlassCard className="p-0 overflow-hidden">
                            <div className="p-6 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#F1A70E]/10 flex items-center justify-center border border-[#F1A70E]/20">
                                        <BookOpen className="w-5 h-5 text-[#F1A70E]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Attribution Ledger</h3>
                                        <p className="text-gray-400 text-sm mt-0.5">Chronological record of economic distribution</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => {
                                        if (!ledgerQuery.data || ledgerQuery.data.length === 0) return;
                                        const rows = ledgerQuery.data.map((entry: any) => [
                                            entry.id || '',
                                            entry.inference_id || '',
                                            entry.created_at ? new Date(entry.created_at).toISOString() : '',
                                            entry.amount_total || '0',
                                            entry.breakdown?.agent_owner_amount || '0',
                                            entry.breakdown?.data_provider_amount || '0',
                                            entry.breakdown?.protocol_amount || '0'
                                        ]);
                                        const content = [
                                            'Ledger ID,Inference ID,Date,Total Fee,Agent Payout,DAO Payout,Protocol Fee',
                                            ...rows.map(r => r.map(v => `"${v}"`).join(','))
                                        ].join('\n');
                                        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.setAttribute('href', url);
                                        link.setAttribute('download', `baseroot_dao_ledger_${new Date().toISOString().split('T')[0]}.csv`);
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    disabled={!ledgerQuery.data || ledgerQuery.data.length === 0}
                                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export CSV
                                </Button>
                            </div>
                            <div>
                                {ledgerQuery.isLoading ? (
                                    <div className="flex items-center justify-center py-16 text-gray-400">
                                        <Loader2 className="w-6 h-6 animate-spin mr-3" />
                                        Loading ledger...
                                    </div>
                                ) : ledgerQuery.isError ? (
                                    <div className="p-6 mx-6 my-6 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                                        <p className="text-red-400">{ledgerQuery.error.message}</p>
                                    </div>
                                ) : !ledgerQuery.data || ledgerQuery.data.length === 0 ? (
                                    <div className="text-center py-16 px-6">
                                        <div className="w-16 h-16 rounded-full bg-black/40 border border-white/5 flex items-center justify-center mx-auto mb-4">
                                            <BookOpen className="w-8 h-8 text-gray-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-2">No ledger entries yet</h3>
                                        <p className="text-gray-400 max-w-sm mx-auto">
                                            Revenue events will appear here once agents start using your datasets.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-400 uppercase bg-black/40 border-b border-white/5">
                                                <tr>
                                                    <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                                                    <th className="px-6 py-4 font-medium tracking-wider">Inference ID</th>
                                                    <th className="px-6 py-4 font-medium tracking-wider text-right">Total Fee</th>
                                                    <th className="px-6 py-4 font-medium tracking-wider text-right">Agent Payout</th>
                                                    <th className="px-6 py-4 font-medium tracking-wider text-right">DAO Payout</th>
                                                    <th className="px-6 py-4 font-medium tracking-wider text-right">Protocol</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {ledgerQuery.data.map((entry: any) => (
                                                    <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                                            {formatDate(entry.created_at)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleCopyId(entry.inference_id)}
                                                                className="flex items-center gap-1.5 text-gray-400 hover:text-[#F1A70E] transition-colors font-mono tracking-tight"
                                                            >
                                                                {entry.inference_id.slice(0, 10)}…
                                                                {copiedId === entry.inference_id
                                                                    ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                    : <Copy className="w-3.5 h-3.5" />
                                                                }
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-white">
                                                            {formatCost(entry.amount_total)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-emerald-400">
                                                            {formatCost(entry.breakdown.agent_owner_amount)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-[#F1A70E]">
                                                            {formatCost(entry.breakdown.data_provider_amount)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-purple-400">
                                                            {formatCost(entry.breakdown.protocol_amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>

                </div>
            </main>
        </div>
    );
}
