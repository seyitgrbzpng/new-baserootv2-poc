import { useWalletContext } from '@/contexts/WalletContext';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/shared/components/PageHeader';
import { GlassCard } from '@/shared/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

import {
    Bot,
    PlusCircle,
    Activity,
    TrendingUp,
    Clock,
    MoreVertical,
    DollarSign,
    Database,
    Loader2
} from 'lucide-react';

export default function CreatorAgents() {
    const { isConnected, address: walletAddress } = useWalletContext();

    const { data: agents = [], isLoading } = trpc.agents.getByCreator.useQuery(
        { walletAddress: walletAddress || '' },
        { enabled: !!walletAddress }
    );

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 p-6 space-y-8">
            <PageHeader
                title="My AI Agents"
                description="Manage your deployed autonomous agents, monitor their live performance, and create new revenue streams."
                action={
                    <Button
                        asChild
                        className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black px-6 font-semibold rounded-xl"
                    >
                        <Link href="/creator/agents/new">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Deploy New Agent
                        </Link>
                    </Button>
                }
            />

            {!isConnected ? (
                <GlassCard className="p-12 text-center border-[#F1A70E]/20 bg-[#F1A70E]/5">
                    <Bot className="w-12 h-12 text-[#F1A70E]/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Wallet Disconnected</h3>
                    <p className="text-gray-400">Please connect your Web3 wallet to manage and view your deployed agents.</p>
                </GlassCard>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#F1A70E] animate-spin mr-3" />
                    <span className="text-gray-400 text-lg">Loading your agents...</span>
                </div>
            ) : agents.length === 0 ? (
                <GlassCard className="p-16 text-center border-white/5">
                    <div className="w-20 h-20 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mx-auto mb-6">
                        <Bot className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Agents Deployed Yet</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                        You haven't registered any agents on the marketplace yet. Deploy your first agent to start serving inferences and earning AVAX.
                    </p>
                    <Button
                        asChild
                        className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black px-8 py-6 text-lg font-bold rounded-xl"
                    >
                        <Link href="/creator/agents/new">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Create Your First Agent
                        </Link>
                    </Button>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent: any) => (
                        <GlassCard key={agent.id} className="p-0 overflow-hidden flex flex-col hover:border-[#F1A70E]/30 transition-colors group">
                            <div className="p-6 border-b border-white/5 flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 group-hover:border-[#F1A70E]/50 transition-colors">
                                        <Bot className="w-6 h-6 text-[#F1A70E]" />
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={
                                            agent.status === 'active'
                                                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                                : "border-gray-500/30 text-gray-400 bg-gray-500/10"
                                        }
                                    >
                                        {agent.status === 'active' && <Activity className="w-3 h-3 mr-1 animate-pulse" />}
                                        {agent.status === 'active' ? 'Active' : 'Paused'}
                                    </Badge>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{agent.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span>{agent.category || 'General'}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 font-mono text-xs">
                                            {agent.id.slice(0, 12)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> Inferences
                                        </p>
                                        <p className="text-lg font-semibold text-white">
                                            {(agent.totalUses || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" /> Price/Use
                                        </p>
                                        <p className="text-lg font-semibold text-[#F1A70E]">
                                            {agent.pricePerUse || 0} AVAX
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Database className="w-3 h-3" /> Datasets
                                        </p>
                                        <p className="text-lg font-semibold text-white">
                                            {(agent.datasetIds?.length || 0)} Links
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Activity className="w-3 h-3" /> Success
                                        </p>
                                        <p className="text-lg font-semibold text-white">
                                            {Math.round(agent.successRate || 100)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-black/40 flex items-center justify-between">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Rating: {(agent.rating || 0).toFixed(1)}
                                </span>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white h-8 w-8 hover:bg-white/10">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
