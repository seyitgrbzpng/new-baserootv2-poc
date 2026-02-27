import { Link } from "wouter";
import { GlassCard } from "@/shared/components/GlassCard";
import { Bot, Tag, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentCardProps {
    agent: any; // We use any for PoC brevity, but typed properly in real app
}

export function AgentCard({ agent }: AgentCardProps) {
    return (
        <Link href={`/marketplace/agents/${agent.id}`}>
            <GlassCard variant="interactive" className="flex flex-col h-full hover:-translate-y-1 block cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center border border-amber-500/30">
                            <Bot className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-100">{agent.name || "Unnamed Agent"}</h3>
                            <p className="text-sm text-gray-400">by {agent.creatorWallet?.slice(0, 6)}...</p>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-3">
                    {agent.description || "No description provided."}
                </p>

                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                        <Tag className="w-3 h-3 mr-1 text-green-400" />
                        {agent.pricePerUse || 0} AVAX / use
                    </div>
                    {agent.datasetIds && agent.datasetIds.length > 0 && (
                        <div className="flex items-center text-xs text-gray-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-emerald-400">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified Data
                        </div>
                    )}
                </div>

                <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 disabled:opacity-50">
                    View Details <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </GlassCard>
        </Link>
    );
}
