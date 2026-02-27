import { useState } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/shared/components/PageHeader';
import { GlassCard } from '@/shared/components/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
    Search,
    ShieldCheck,
    Clock,
    Bot,
    DollarSign,
    Loader2,
    ChevronRight,
    CheckCircle2,
    FileSearch,
} from 'lucide-react';

export default function DaoProvenance() {
    const { address } = useWalletContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

    // Use wallet address as dao_id for PoC
    const daoId = address || '';

    const { data: provenanceData, isLoading } = trpc.dashboard.provenance.useQuery(
        { dao_id: daoId, search: searchQuery || undefined },
        { enabled: !!daoId }
    );

    const entries = provenanceData?.entries ?? [];
    const totalCount = provenanceData?.totalCount ?? 0;

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 p-6 space-y-8">
            <PageHeader
                title="Data Provenance Explorer"
                description="Trace every inference's journey: dataset attribution, zero-knowledge proofs, and on-chain economic settlement."
            />

            {/* Search Bar */}
            <GlassCard className="p-5 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by inference ID, agent ID, or DAO ID..."
                    className="bg-transparent border-none text-white placeholder:text-gray-500 focus-visible:ring-0 text-lg"
                />
                {searchQuery && (
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 whitespace-nowrap">
                        {entries.length} of {totalCount} results
                    </Badge>
                )}
            </GlassCard>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mr-3" />
                    <span className="text-gray-400 text-lg">Loading provenance trail...</span>
                </div>
            ) : entries.length === 0 ? (
                <GlassCard className="p-16 text-center border-white/5">
                    <div className="w-20 h-20 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mx-auto mb-6">
                        <FileSearch className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Provenance Records Found</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        {searchQuery
                            ? 'No entries match your search. Try a different inference ID or agent address.'
                            : 'Provenance records will appear here once agents begin using your datasets for inference.'
                        }
                    </p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry) => (
                        <GlassCard
                            key={entry.id}
                            className={`p-0 overflow-hidden transition-all cursor-pointer ${expandedEntry === entry.id ? 'border-purple-500/30' : 'hover:border-white/20'
                                }`}
                            onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                        >
                            {/* Entry Header */}
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <ShieldCheck className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-white font-semibold">
                                                Inference {entry.inference_id?.slice(0, 16)}...
                                            </h4>
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Bot className="w-3.5 h-3.5" /> Agent: {entry.agent_id?.slice(0, 10)}...
                                            </span>
                                            <span className="text-white/10">•</span>
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> {entry.cost.toFixed(4)} AVAX
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedEntry === entry.id ? 'rotate-90' : ''
                                    }`} />
                            </div>

                            {/* Expanded Steps */}
                            {expandedEntry === entry.id && (
                                <div className="px-6 pb-6 border-t border-white/5 pt-4">
                                    <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider font-medium">Verification Pipeline</p>
                                    <div className="space-y-3">
                                        {entry.steps.map((step, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0 mt-0.5">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{step.label}</p>
                                                    <p className="text-gray-400 text-xs mt-0.5">{step.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
