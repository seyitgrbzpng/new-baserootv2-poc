import { ExternalLink, Shield, Cpu, Coins, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/shared/components/GlassCard";

const CONTRACT_ADDRESS = import.meta.env.VITE_BASEROOT_MARKETPLACE_ADDRESS || "0x46A354d117D3fC564EB06749a12E82f8F1289aA8";
const NETWORK_NAME = "Avalanche Fuji Testnet";
const CHAIN_ID = "43113";

interface TransactionProofCardProps {
    txHash: string;
    agentId: string;
    amount: number;
    licenseId?: number | null;
}

/** Prominent on-chain proof card shown after a successful license purchase. */
export function TransactionProofCard({ txHash, agentId, amount, licenseId }: TransactionProofCardProps) {
    const snowtraceUrl = `https://testnet.snowtrace.io/tx/${txHash}`;
    const contractUrl = `https://testnet.snowtrace.io/address/${CONTRACT_ADDRESS}`;

    const creatorShare = (amount * 0.40).toFixed(4);
    const daoShare = (amount * 0.50).toFixed(4);
    const protocolShare = (amount * 0.10).toFixed(4);

    return (
        <GlassCard className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-black/60 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-emerald-300">License Purchased On-Chain</h3>
                    <p className="text-xs text-emerald-400/60">Verified on Avalanche Fuji</p>
                </div>
            </div>

            {/* Transaction Info */}
            <div className="space-y-3 mb-5">
                <InfoRow label="Tx Hash" mono>
                    <a href={snowtraceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[#F1A70E] hover:underline flex items-center gap-1.5 truncate">
                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                </InfoRow>

                <InfoRow label="Contract" mono>
                    <a href={contractUrl} target="_blank" rel="noopener noreferrer"
                        className="text-gray-300 hover:text-[#F1A70E] flex items-center gap-1.5 truncate transition-colors">
                        {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-6)}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                </InfoRow>

                <InfoRow label="Network">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-gray-300">{NETWORK_NAME}</span>
                        <span className="text-xs text-gray-500">({CHAIN_ID})</span>
                    </div>
                </InfoRow>

                {licenseId !== null && licenseId !== undefined && (
                    <InfoRow label="License ID">
                        <span className="text-white font-semibold">#{licenseId}</span>
                    </InfoRow>
                )}
            </div>

            {/* Revenue Split Visualization */}
            <div className="border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 mb-3">
                    <Coins className="w-4 h-4 text-[#F1A70E]" />
                    <span className="text-sm font-semibold text-white">Revenue Split — {amount} AVAX</span>
                </div>

                {/* Split bars */}
                <div className="flex h-3 rounded-full overflow-hidden mb-3 border border-white/10">
                    <div className="bg-blue-500 h-full" style={{ width: "50%" }}
                        title={`50% DAO — ${daoShare} AVAX`} />
                    <div className="bg-[#F1A70E] h-full" style={{ width: "40%" }}
                        title={`40% Creator — ${creatorShare} AVAX`} />
                    <div className="bg-purple-500 h-full" style={{ width: "10%" }}
                        title={`10% Protocol — ${protocolShare} AVAX`} />
                </div>

                <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                        <span className="text-gray-400">50% DAO</span>
                        <span className="text-blue-300 font-mono">{daoShare}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#F1A70E]" />
                        <span className="text-gray-400">40% Creator</span>
                        <span className="text-[#F1A70E] font-mono">{creatorShare}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                        <span className="text-gray-400">10% Protocol</span>
                        <span className="text-purple-300 font-mono">{protocolShare}</span>
                    </div>
                </div>
            </div>

            {/* Powered by Avalanche */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-3.5 h-3.5" />
                Powered by Avalanche C-Chain · Secured by ReentrancyGuard
            </div>
        </GlassCard>
    );
}

/** Helper row for key-value pairs */
function InfoRow({ label, mono, children }: { label: string; mono?: boolean; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-500 shrink-0">{label}</span>
            <div className={`truncate ${mono ? "font-mono text-xs" : ""}`}>{children}</div>
        </div>
    );
}
