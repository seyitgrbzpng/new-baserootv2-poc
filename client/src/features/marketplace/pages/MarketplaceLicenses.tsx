import { useWalletContext } from '@/contexts/WalletContext';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/shared/components/PageHeader';
import { GlassCard } from '@/shared/components/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

import {
    KeyRound,
    Bot,
    CheckCircle2,
    Clock,
    Loader2,
    ShoppingBag,
    XCircle,
} from 'lucide-react';

export default function MarketplaceLicenses() {
    const { isConnected, address } = useWalletContext();

    const { data: credits = [], isLoading } = trpc.paymentCredits.getAll.useQuery(
        { walletAddress: address || '' },
        { enabled: !!address }
    );

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 p-6 space-y-8">
            <PageHeader
                title="My Licenses"
                description="Active AI agent licenses you have purchased from the marketplace."
            />

            {!isConnected ? (
                <GlassCard className="p-12 text-center border-white/5">
                    <KeyRound className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Wallet Disconnected</h3>
                    <p className="text-gray-400">Connect your wallet to view your purchased licenses.</p>
                </GlassCard>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#F1A70E] animate-spin mr-3" />
                    <span className="text-gray-400 text-lg">Loading licenses...</span>
                </div>
            ) : credits.length === 0 ? (
                <GlassCard className="p-16 text-center border-white/5">
                    <div className="w-20 h-20 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Active Licenses</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                        You have not purchased any agent licenses yet. Browse the marketplace to find and use AI agents.
                    </p>
                    <Button
                        asChild
                        className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black px-8 py-3 font-bold rounded-xl"
                    >
                        <Link href="/marketplace">
                            Browse Marketplace
                        </Link>
                    </Button>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {credits.map((credit: any) => (
                        <GlassCard key={credit.id} className="p-6 space-y-4 hover:border-[#F1A70E]/30 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="p-3 rounded-xl bg-[#F1A70E]/10 flex items-center justify-center border border-[#F1A70E]/20">
                                    <Bot className="w-6 h-6 text-[#F1A70E]" />
                                </div>
                                <Badge
                                    variant="outline"
                                    className={
                                        credit.status === 'available'
                                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                            : credit.status === 'used'
                                                ? 'border-gray-500/30 text-gray-400 bg-gray-500/10'
                                                : 'border-red-500/30 text-red-400 bg-red-500/10'
                                    }
                                >
                                    {credit.status === 'available' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                    {credit.status === 'used' && <Clock className="w-3 h-3 mr-1" />}
                                    {credit.status === 'expired' && <XCircle className="w-3 h-3 mr-1" />}
                                    {credit.status === 'available' ? 'Available' : credit.status === 'used' ? 'Used' : 'Expired'}
                                </Badge>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white line-clamp-1">{credit.agentName || 'Unknown Agent'}</h3>
                                <p className="text-xs text-gray-500 font-mono mt-1">ID: {credit.id?.slice(0, 16)}...</p>
                            </div>

                            <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
                                <span className="text-gray-400">Paid</span>
                                <span className="text-[#F1A70E] font-bold">{credit.amountPaid?.toFixed(4) || '0.0000'} {credit.currency || 'AVAX'}</span>
                            </div>

                            {credit.status === 'available' && (
                                <Button
                                    asChild
                                    className="w-full bg-[#F1A70E]/10 hover:bg-[#F1A70E]/20 text-[#F1A70E] border border-[#F1A70E]/20"
                                >
                                    <Link href={`/marketplace/${credit.agentId}`}>
                                        Use License →
                                    </Link>
                                </Button>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
