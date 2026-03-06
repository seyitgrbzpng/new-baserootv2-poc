import { useRoute, Link } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/shared/components/PageHeader";
import { GlassCard } from "@/shared/components/GlassCard";
import { TxButton, TxStatus } from "@/shared/components/TxButton";
import { TransactionProofCard } from "@/shared/components/TransactionProofCard";
import { EmptyState, LoadingState, ErrorState } from "@/shared/components/UIStates";
import { Bot, ShieldCheck, Database, ArrowLeft, Send, Zap, Clock, Users, DollarSign, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useWalletContext } from "@/contexts/WalletContext";

export default function AgentDetail() {
    const [match, params] = useRoute("/marketplace/agents/:id");
    const agentId = params?.id || "";

    const { data: agent, isLoading, isError } = trpc.agents.getById.useQuery(
        { id: agentId },
        { enabled: !!agentId }
    );

    const { sendPayment, address: walletAddress } = useWalletContext();
    const verifyPaymentMutation = trpc.payments.verify.useMutation();
    const executeMutation = trpc.execution.run.useMutation();

    const [txStatus, setTxStatus] = useState<TxStatus>("idle");
    const [txHash, setTxHash] = useState<string>();
    const [errorMsg, setErrorMsg] = useState<string>();
    const [hasLicense, setHasLicense] = useState(false);
    const [licenseId, setLicenseId] = useState<number | null>(null);
    const [pendingCreditId, setPendingCreditId] = useState<string | null>(null);

    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);

    // Check if user already has a license for this agent
    const { data: licenseCheck, isLoading: licenseLoading } = trpc.licenses.check.useQuery(
        { walletAddress: walletAddress || '', agentId },
        { enabled: !!walletAddress && !!agentId }
    );

    // Auto-set license state from backend check
    useEffect(() => {
        if (licenseCheck?.hasLicense) {
            setHasLicense(true);
            setLicenseId(licenseCheck.licenseId ?? null);
            if (chatMessages.length === 0) {
                setChatMessages([{ role: "system", content: "License verified! You can send a message." }]);
            }
        }
    }, [licenseCheck]);

    const handleBuyLicense = async () => {
        if (!agent || !walletAddress) {
            toast.error("Wallet not connected or agent not found");
            return;
        }

        setTxStatus("signing");
        setErrorMsg(undefined);

        try {
            const result = await sendPayment({
                amount: agent.pricePerUse,
                creatorWallet: agent.creatorWallet,
                agentId: agent.id,
                description: `License for ${agent.name}`,
            });

            if (result.success && result.txSignature) {
                setTxStatus("pending");

                const verifyResult = await verifyPaymentMutation.mutateAsync({
                    txSignature: result.txSignature,
                    agentId: agent.id,
                    amount: agent.pricePerUse,
                    creatorWallet: agent.creatorWallet,
                    userWallet: walletAddress,
                });

                if (!verifyResult.success) {
                    throw new Error(verifyResult.error || "Verification failed");
                }

                setTxStatus("confirmed");
                setTxHash(result.txSignature);
                setHasLicense(true);
                if (verifyResult.creditId) {
                    setPendingCreditId(verifyResult.creditId);
                }

                // Try to extract licenseId from event logs (will be synced by backend)
                // For frontend, show a placeholder until sync catches up
                setLicenseId(Date.now()); // placeholder — will be replaced by backend sync

                setChatMessages([{ role: "system", content: `✅ License activated! Tx: ${result.txSignature.slice(0, 10)}...` }]);
            } else {
                setTxStatus("error");
                setErrorMsg(result.error || "Payment failed");
            }
        } catch (error: any) {
            console.error(error);
            setTxStatus("error");
            setErrorMsg(error.message || "An unexpected error occurred");
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !agent || !walletAddress) return;

        const userMessage = chatInput.trim();
        setChatInput("");
        setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);

        try {
            const result = await executeMutation.mutateAsync({
                agentId: agent.id,
                userWallet: walletAddress,
                message: userMessage,
                creditId: pendingCreditId || undefined,
            });

            if (pendingCreditId) setPendingCreditId(null);

            if (result.success && result.response) {
                setChatMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: (result.response as any).content || "No response" },
                ]);
                setHasLicense(false); // Used up the credit (pay-per-use)
            } else {
                setChatMessages((prev) => [...prev, { role: "assistant", content: "Error processing inference." }]);
            }
        } catch (error) {
            setChatMessages((prev) => [...prev, { role: "assistant", content: "Connection error." }]);
        }
    };

    if (isLoading) return <LoadingState message="Loading agent details..." />;
    if (isError || !agent) return <ErrorState message="Agent not found or failed to load." />;

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
            <Link href="/marketplace">
                <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white pl-0">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
                </Button>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <PageHeader
                        title={agent.name}
                        description={agent.description}
                    />

                    <GlassCard>
                        <h3 className="text-lg font-semibold text-white mb-4">Capabilities & Stats</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {agent.tags.map((tag: string, i: number) => (
                                <div key={i} className="px-3 py-1 rounded bg-[#F1A70E]/10 text-[#F1A70E] text-sm border border-[#F1A70E]/20">
                                    {tag}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                            <div className="text-center">
                                <Zap className="w-5 h-5 text-green-400 mx-auto mb-1" />
                                <div className="font-bold text-white">{Math.round(agent.successRate || 0)}%</div>
                                <div className="text-xs text-gray-500">Success</div>
                            </div>
                            <div className="text-center">
                                <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                                <div className="font-bold text-white">{((agent.responseTimeAvg || 0) / 1000).toFixed(1)}s</div>
                                <div className="text-xs text-gray-500">Speed</div>
                            </div>
                            <div className="text-center">
                                <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                                <div className="font-bold text-white">{agent.totalUses || 0}</div>
                                <div className="text-xs text-gray-500">Uses</div>
                            </div>
                        </div>
                    </GlassCard>

                    {agent.datasetIds && agent.datasetIds.length > 0 && (
                        <GlassCard className="border-emerald-500/20 bg-emerald-950/20">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-semibold text-emerald-300">Attached Datasets (Zero-Knowledge)</h3>
                            </div>
                            <div className="space-y-3">
                                {agent.datasetIds.map((dsId: string) => (
                                    <div key={dsId} className="flex items-center justify-between p-3 rounded bg-black/40 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Database className="w-4 h-4 text-emerald-400" />
                                            <span className="font-mono text-sm text-gray-300">{dsId}</span>
                                        </div>
                                        <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Verified Provenance</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-emerald-400/60 mt-4">
                                Raw dataset contents are never exposed to the frontend.
                            </p>
                        </GlassCard>
                    )}
                </div>

                {/* Right Col: License & Chat */}
                <div className="space-y-6">
                    <GlassCard className="sticky top-24">
                        <h3 className="text-lg font-semibold text-white mb-2">License Information</h3>
                        <p className="text-sm text-gray-400 mb-6">Pay-per-use on-chain inference.</p>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/10 mb-6 text-xl">
                            <span className="text-gray-300">Price</span>
                            <div className="flex items-center text-[#F1A70E] font-bold">
                                <DollarSign className="w-5 h-5 mr-1" />
                                {agent.pricePerUse} AVAX
                            </div>
                        </div>

                        {!hasLicense ? (
                            <>
                                {licenseLoading ? (
                                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-center text-sm">
                                        Checking license status...
                                    </div>
                                ) : (
                                    <TxButton
                                        status={txStatus}
                                        hash={txHash}
                                        errorMsg={errorMsg}
                                        onClick={handleBuyLicense}
                                        idleText={`Buy License (${agent.pricePerUse} AVAX)`}
                                    />
                                )}
                            </>
                        ) : (
                            <div className="space-y-3">
                                {txHash ? (
                                    <TransactionProofCard
                                        txHash={txHash}
                                        agentId={agentId}
                                        amount={agent.pricePerUse}
                                        licenseId={licenseId}
                                    />
                                ) : (
                                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                                        <div>
                                            <p className="text-green-400 font-medium text-sm">Licensed ✅</p>
                                            {licenseId !== null && (
                                                <p className="text-green-400/60 text-xs font-mono">License #{licenseId}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </GlassCard>

                    {/* Chat Window */}
                    {hasLicense && (
                        <GlassCard className="flex flex-col h-[400px]">
                            <div className="border-b border-white/10 pb-3 mb-3">
                                <h3 className="font-semibold text-white flex items-center">
                                    <Bot className="w-4 h-4 mr-2 text-[#F1A70E]" /> Interaction Terminal
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-[#F1A70E]/10 border border-[#F1A70E]/20 text-white ml-8" :
                                        msg.role === "system" ? "bg-blue-500/10 border border-blue-500/20 text-blue-300 text-center text-xs" :
                                            "bg-white/5 border border-white/10 text-gray-300 mr-8"
                                        }`}>
                                        {msg.content}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 mt-auto">
                                <Input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Send a prompt..."
                                    className="bg-black/40 border-white/10"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={executeMutation.isPending}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || executeMutation.isPending}
                                    className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black px-3"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>
        </div>
    );
}
