import { useState } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useWalletContext, truncateAddress } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/shared/components/PageHeader';
import { GlassCard } from '@/shared/components/GlassCard';
import {
  Bot,
  DollarSign,
  Users,
  Plus,
  ArrowUpRight,
  Star,
  ExternalLink,
  Zap,
  Download,
  Code2,
  Cpu,
} from 'lucide-react';

export default function CreatorDashboard() {
  const { isConnected: connected, address: walletAddress } = useWalletContext();

  // Fetch creator stats
  const { data: stats } = trpc.creator.stats.useQuery(
    { walletAddress: walletAddress || '' },
    { enabled: !!walletAddress }
  );

  // Fetch earnings
  const { data: earnings = [] } = trpc.creator.earnings.useQuery(
    { walletAddress: walletAddress || '' },
    { enabled: !!walletAddress }
  );

  if (!connected) {
    return (
      <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pt-20 flex flex-col items-center">
        <GlassCard className="max-w-md w-full text-center space-y-4 p-8">
          <div className="w-16 h-16 rounded-xl bg-[#F1A70E]/10 flex items-center justify-center mx-auto mb-4 border border-[#F1A70E]/20">
            <Bot className="w-8 h-8 text-[#F1A70E]" />
          </div>
          <h2 className="text-2xl font-bold text-white">Creator Studio</h2>
          <p className="text-gray-400">
            Please connect your wallet to view and manage your AI agents.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">

      {/* Creator Profile Card */}
      <div className="mb-8 animate-in fade-in duration-300">
        <GlassCard className="p-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-[#F1A70E]/30 flex items-center justify-center border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.15)] shrink-0">
              <Code2 className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Creator Studio</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="font-mono bg-[#F1A70E]/10 text-[#F1A70E] border-[#F1A70E]/20 text-xs px-2 py-0.5">
                  {truncateAddress(walletAddress || '')}
                </Badge>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                  {stats?.totalAgents || 0} Agents
                </Badge>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  40% Revenue Share
                </Badge>
              </div>
              <p className="text-gray-500 text-sm mt-2">Build and deploy AI agents on the Baseroot network. Earn 40% of every license sale.</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in duration-500 delay-100">
        {/* Register Agent Card */}
        <Link href="/creator/agents/new">
          <GlassCard className="p-6 cursor-pointer group hover:border-blue-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors shrink-0">
                <Plus className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Register New Agent</h3>
                <p className="text-gray-400 text-sm mt-1">Deploy a new AI agent on-chain using the Agent Registration Wizard. Auto-generated unique ID.</p>
                <div className="flex items-center gap-1 mt-3 text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Start Wizard <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </GlassCard>
        </Link>

        {/* View Agents Card */}
        <Link href="/creator/agents">
          <GlassCard className="p-6 cursor-pointer group hover:border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors shrink-0">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">My Agents</h3>
                <p className="text-gray-400 text-sm mt-1">Manage your deployed agents, view usage metrics, attached datasets, and performance stats.</p>
                <div className="flex items-center gap-1 mt-3 text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View All <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in duration-500 delay-200">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Earnings</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.totalEarnings?.toFixed(4) || '0.000'} <span className="text-lg text-gray-500">AVAX</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-green-400 text-sm font-medium">
            <ArrowUpRight className="w-4 h-4" />
            <span>+12.5% from last week</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Uses</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.totalUses?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-blue-400 text-sm font-medium">
            <ArrowUpRight className="w-4 h-4" />
            <span>+8.2% from last week</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Agents</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.totalAgents || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-gray-400 text-sm">
            <span>All agents online</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Rating</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.avgRating?.toFixed(1) || '0.0'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#F1A70E]/10 flex items-center justify-center border border-[#F1A70E]/20">
              <Star className="w-6 h-6 text-[#F1A70E]" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= (stats?.avgRating || 0) ? 'fill-[#F1A70E] text-[#F1A70E]' : 'text-gray-600'
                  }`}
              />
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Recent Earnings */}
      <div className="space-y-6 animate-in fade-in duration-500 delay-300">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-white">Recent Earnings Overview</h3>
          <Button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-9 text-sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <GlassCard className="p-0 overflow-hidden">
          {earnings.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-12 h-12 rounded-full bg-black/40 border border-white/5 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">No transaction history found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {earnings.slice(0, 5).map((payment: any) => (
                <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 shrink-0">
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-white font-medium truncate">
                        +{payment.creatorAmount?.toFixed(4)} <span className="text-gray-500 text-xs">AVAX</span>
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://testnet.snowtrace.io/tx/${payment.txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-white/10 text-gray-500 hover:text-[#F1A70E] transition-colors shrink-0"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
          {earnings.length > 5 && (
            <div className="p-4 border-t border-white/5 text-center bg-black/20">
              <Button variant="link" className="text-[#F1A70E] hover:text-[#F1A70E]/80 h-auto p-0 text-sm font-medium">
                View All Transactions
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
