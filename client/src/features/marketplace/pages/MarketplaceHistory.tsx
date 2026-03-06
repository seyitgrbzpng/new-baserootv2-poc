import { useWalletContext } from '@/contexts/WalletContext';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/shared/components/PageHeader';
import { GlassCard } from '@/shared/components/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
    Download,
    Clock,
    Bot,
    CheckCircle2,
    XCircle,
    Loader2,
    History,
} from 'lucide-react';

export default function MarketplaceHistory() {
    const { isConnected, address } = useWalletContext();

    const { data: history = [], isLoading } = trpc.execution.getUserHistory.useQuery(
        { userWallet: address || '', limit: 50 },
        { enabled: !!address }
    );

    const handleExportCsv = () => {
        if (!history || history.length === 0) return;

        // CSV Header
        const headers = ['Agent Name', 'Agent ID', 'Status', 'Response Time (ms)', 'Date', 'Transaction ID'];
        
        // CSV Rows
        const rows = history.map((run: any) => [
            run.agentName || 'Unknown Agent',
            run.agentId || '',
            run.status || 'unknown',
            run.responseTime || '',
            run.createdAt ? new Date(run.createdAt).toISOString() : '',
            run.id || ''
        ]);

        // Build CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(v => `"${v}"`).join(','))
        ].join('\n');

        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `baseroot_usage_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 p-6 space-y-8">
            <PageHeader
                title="Usage History"
                description="A log of your AI agent interactions and inference calls."
                action={
                    <Button 
                        onClick={handleExportCsv}
                        disabled={!history || history.length === 0}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-9 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                }
            />

            {!isConnected ? (
                <GlassCard className="p-12 text-center border-white/5">
                    <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Wallet Disconnected</h3>
                    <p className="text-gray-400">Connect your wallet to view your inference history.</p>
                </GlassCard>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mr-3" />
                    <span className="text-gray-400 text-lg">Loading history...</span>
                </div>
            ) : history.length === 0 ? (
                <GlassCard className="p-16 text-center border-white/5">
                    <div className="w-20 h-20 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mx-auto mb-6">
                        <History className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No History Found</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        You have not executed any inference tasks yet. Start using AI agents on the marketplace to see your history here.
                    </p>
                </GlassCard>
            ) : (
                <GlassCard className="p-0 overflow-hidden">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-black/40 text-gray-400 text-xs">
                            <tr>
                                <th className="px-6 py-4 font-medium">Agent</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Response Time</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.map((run: any) => (
                                <tr key={run.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#F1A70E]/10 flex items-center justify-center border border-[#F1A70E]/20 shrink-0">
                                                <Bot className="w-4 h-4 text-[#F1A70E]" />
                                            </div>
                                            <span className="text-white font-medium">{run.agentName || 'Unknown Agent'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {run.status === 'success' ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-normal">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-normal">
                                                <XCircle className="w-3 h-3 mr-1" /> Failed
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {run.responseTime ? `${run.responseTime}ms` : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-gray-400">
                                        {run.createdAt ? new Date(run.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </GlassCard>
            )}
        </div>
    );
}
