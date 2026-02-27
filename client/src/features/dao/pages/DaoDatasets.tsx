import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useWalletContext } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Database, DollarSign, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

import { PageHeader } from "@/shared/components/PageHeader";
import { GlassCard } from "@/shared/components/GlassCard";

export default function DatasetsPage() {
    const [, setLocation] = useLocation();
    const { address: walletAddress } = useWalletContext();

    // Fetch user datasets by deterministic wallet address instead of Firebase UID
    const { data: datasets, isLoading } = trpc.datasets.getByOwner.useQuery(
        { walletAddress: (walletAddress as string) || undefined },
        { enabled: !!walletAddress }
    );

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 p-6 space-y-6">
            <div className="flex items-center justify-between mb-8">
                <PageHeader
                    title="My Datasets"
                    description="Manage your verified datasets and track revenue."
                />

                <Button
                    onClick={() => setLocation('/dao/datasets/new')}
                    className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black shadow-[0_0_15px_rgba(241,167,14,0.15)]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Dataset
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : datasets?.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-2xl border border-white/5 bg-black/40">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Database className="h-10 w-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No Datasets Found</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                        You haven't registered any datasets yet. Use the button above to add your first dataset.
                    </p>
                    <Button onClick={() => setLocation('/dao/datasets/new')} className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black">
                        Create First Dataset
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {datasets?.map((dataset) => (
                        <GlassCard key={dataset.id} className="p-0 flex flex-col overflow-hidden">
                            <div className="p-5 border-b border-white/5 bg-black/20">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-white truncate pr-4" title={dataset.title}>{dataset.title}</h3>
                                    <Badge className="bg-[#F1A70E]/10 text-[#F1A70E] border-[#F1A70E]/20">{dataset.category}</Badge>
                                </div>
                                <p className="text-gray-400 text-sm line-clamp-2" title={dataset.description}>
                                    {dataset.description}
                                </p>
                            </div>
                            <div className="p-5 flex-1">
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {dataset.tags.map(tag => (
                                        <Badge key={tag} className="bg-white/5 text-gray-300 border-white/10 font-normal px-2 py-0.5">{tag}</Badge>
                                    ))}
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between text-gray-300">
                                        <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-400" /> Revenue Share</span>
                                        <span className="font-semibold text-white">{dataset.revenueShare}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-300">
                                        <span className="flex items-center gap-1.5"><Database className="w-4 h-4 text-blue-400" /> Price Per Use</span>
                                        <span className="font-semibold text-white">{dataset.pricePerUse || 0} AVAX</span>
                                    </div>
                                    {dataset.sampleDataUrl && (
                                        <div className="pt-3 mt-3 border-t border-white/5">
                                            <a href={dataset.sampleDataUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-[#F1A70E] hover:text-[#F1A70E]/80 transition-colors font-medium">
                                                <ExternalLink className="w-4 h-4" /> View Sample Data
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-black/40 p-4 border-t border-white/5 text-xs text-center text-gray-500 font-medium">
                                Registered: {new Date(((dataset.createdAt as any)?._seconds ? (dataset.createdAt as any)._seconds * 1000 : (dataset.createdAt as any)?.seconds ? (dataset.createdAt as any).seconds * 1000 : dataset.createdAt) as number | string).toLocaleDateString()}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
