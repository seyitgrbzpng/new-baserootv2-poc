import { useState, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useWalletContext } from '@/contexts/WalletContext';
import { auth } from '@/firebase-config';
import { toast } from 'sonner';
import { getAddress } from 'viem';

import { PageHeader } from '@/shared/components/PageHeader';
import { GlassCard } from '@/shared/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TxButton, TxStatus } from "@/shared/components/TxButton";
import BaserootMarketplaceV2ABI from '@/contracts/BaserootMarketplaceV2.json';

import {
    Database,
    Upload,
    ShieldCheck,
    DollarSign,
    Info,
    ArrowLeft,
    ArrowRight,
    Copy,
    Check,
    Fingerprint,
} from 'lucide-react';

const MARKETPLACE_ADDRESS = getAddress((import.meta.env.VITE_BASEROOT_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000') as string) as `0x${string}`;

/** Generate a unique dataset ID from title + wallet + timestamp */
function generateDatasetId(title: string, wallet: string): string {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 20);
    const walletSuffix = wallet.slice(-4).toLowerCase();
    const ts = Date.now().toString(36);
    return `ds-${slug}-${walletSuffix}-${ts}`;
}

export default function DaoDatasetNew() {
    const [, setLocation] = useLocation();
    const { address: walletAddress, isConnected, sendContractWrite } = useWalletContext();
    const user = auth.currentUser;

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        tags: '',
        revenueShare: 10,
        pricePerUse: 0.001,
        sampleDataUrl: '',
        verificationProof: '',
        dataContent: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>();

    const [txStatus, setTxStatus] = useState<TxStatus>("idle");
    const [txHash, setTxHash] = useState<string>();
    const [errorMsg, setErrorMsg] = useState<string>();
    const [copiedId, setCopiedId] = useState(false);

    const utils = trpc.useContext();
    const createMutation = trpc.datasets.create.useMutation();

    // Auto-generate unique dataset ID
    const generatedId = useMemo(() => {
        if (!formData.title || !walletAddress) return '';
        return generateDatasetId(formData.title, walletAddress);
    }, [formData.title, walletAddress]);

    const handleCopyId = () => {
        if (generatedId) {
            navigator.clipboard.writeText(generatedId);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const handleNextStep1 = () => {
        if (!formData.title || !formData.description || !formData.category) {
            toast.warning("Please fill out all required basic info fields.");
            return;
        }
        setStep(2);
    };

    const handleNextStep2 = () => {
        setStep(3);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setFormData(prev => ({ ...prev, dataContent: content }));
        };
        reader.readAsText(file);
    };

    const handleRegister = async () => {
        if (!walletAddress) {
            toast.error("Please connect your wallet first.");
            return;
        }

        if (!generatedId) {
            toast.error("Dataset ID could not be generated. Enter a title first.");
            return;
        }

        setTxStatus("signing");
        setErrorMsg(undefined);

        try {
            // 1. On-chain registration via V2 contract
            const priceInWei = BigInt(Math.floor(formData.pricePerUse * 1e18));

            const result = await sendContractWrite({
                address: MARKETPLACE_ADDRESS,
                abi: BaserootMarketplaceV2ABI.abi,
                functionName: 'registerDataset',
                args: [generatedId, priceInWei],
            });

            if (result.success && result.txSignature) {
                setTxStatus("pending");
                setTxHash(result.txSignature);

                // 2. Save to Firestore
                await createMutation.mutateAsync({
                    id: generatedId,
                    title: formData.title,
                    description: formData.description,
                    ownerWallet: walletAddress,
                    ownerUid: user?.uid,
                    revenueShare: Number(formData.revenueShare),
                    pricePerUse: Number(formData.pricePerUse),
                    category: formData.category,
                    tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
                    sampleDataUrl: formData.sampleDataUrl || undefined,
                    dataContent: formData.dataContent || undefined,
                });

                setTxStatus("confirmed");
                toast.success("Data Asset Registered On-Chain!");
                utils.datasets.getByOwner.invalidate();

                setTimeout(() => {
                    setLocation('/dao/datasets');
                }, 2500);
            } else {
                setTxStatus("error");
                setErrorMsg(result.error || "Contract call failed");
            }
        } catch (err: any) {
            setTxStatus("error");
            setErrorMsg(err.message || "Transaction failed");
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-3xl mx-auto pb-20 p-6">
            <button
                onClick={() => setLocation('/dao/datasets')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm font-medium"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Datasets
            </button>

            <PageHeader
                title="Data Asset Registration Wizard"
                description={`Step ${step} of 3 • Deploy a new verified dataset on-chain securely.`}
            />

            {/* Auto-generated ID Preview */}
            {generatedId && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Fingerprint className="w-5 h-5 text-emerald-400" />
                            <div>
                                <p className="text-xs text-emerald-400 font-medium">Auto-Generated Dataset ID</p>
                                <p className="text-sm font-mono text-white mt-0.5">{generatedId}</p>
                            </div>
                        </div>
                        <button onClick={handleCopyId} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                            {copiedId
                                ? <Check className="w-4 h-4 text-emerald-400" />
                                : <Copy className="w-4 h-4 text-gray-400" />
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 1: Basic Information */}
            {step === 1 && (
                <GlassCard className="space-y-6 animate-in slide-in-from-right-4 p-8">
                    <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-400" /> 1. Basic Information
                    </h3>
                    <p className="text-sm text-gray-400">Metadata defining your dataset for Agent consumers.</p>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-gray-300">Dataset Title <span className="text-red-400">*</span></Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Bio-Medical Research Corpus V2"
                                className="bg-black/60 border-white/10 focus:border-[#F1A70E]/50 text-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-gray-300">Category <span className="text-red-400">*</span></Label>
                                <Input
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g. Healthcare, Finance"
                                    className="bg-black/60 border-white/10 focus:border-[#F1A70E]/50 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tags" className="text-gray-300">Keywords / Tags</Label>
                                <Input
                                    id="tags"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="Comma separated (e.g. dna, genetics)"
                                    className="bg-black/60 border-white/10 focus:border-[#F1A70E]/50 text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-gray-300">Description <span className="text-red-400">*</span></Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Provide a detailed overview of what this dataset contains..."
                                className="bg-black/60 border-white/10 focus:border-[#F1A70E]/50 text-white min-h-[120px]"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleNextStep1} className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black px-8">
                            Next Step <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </GlassCard>
            )}

            {/* STEP 2: Data Payload & Samples */}
            {step === 2 && (
                <GlassCard className="space-y-6 animate-in slide-in-from-right-4 p-8">
                    <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                        <Database className="w-5 h-5 text-emerald-400" /> 2. Data Payload
                    </h3>
                    <p className="text-sm text-gray-400">Sample connections and manifest upload for dataset retrieval endpoints.</p>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="sampleUrl" className="text-gray-300">Sample Data URL</Label>
                            <p className="text-xs text-gray-500 mb-2">A public URL for consumers to preview format.</p>
                            <Input
                                id="sampleUrl"
                                value={formData.sampleDataUrl}
                                onChange={(e) => setFormData({ ...formData, sampleDataUrl: e.target.value })}
                                placeholder="https://ipfs.io/ipfs/..."
                                className="bg-black/60 border-white/10 focus:border-emerald-500/50 text-white"
                            />
                        </div>

                        <div className="p-8 border-2 border-dashed border-white/10 rounded-xl bg-white/[0.02] text-center mt-4 flex flex-col items-center justify-center gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json,.csv,.txt"
                                onChange={handleFileUpload}
                            />
                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                {fileName ? (
                                    <Check className="w-7 h-7 text-emerald-400" />
                                ) : (
                                    <Upload className="w-7 h-7 text-gray-400" />
                                )}
                            </div>
                            <p className="text-sm text-gray-300 font-medium">
                                {fileName ? `Uploaded: ${fileName}` : "Upload Dataset Manifest"}
                            </p>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                Hook up the actual IPFS JSON manifest so Agents can load the underlying weights or knowledge graphs.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4 border-white/10 bg-black/40 text-gray-300 hover:text-white hover:bg-white/10"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {fileName ? "Change File" : "Browse Files"}
                            </Button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-between border-t border-white/10 mt-6 pt-6">
                        <Button variant="ghost" onClick={() => setStep(1)} className="text-gray-400 hover:text-white pl-0">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button onClick={handleNextStep2} className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black px-8">
                            Next Step <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </GlassCard>
            )}

            {/* STEP 3: Economics & Registration */}
            {step === 3 && (
                <GlassCard className="space-y-6 animate-in slide-in-from-right-4 p-8 border-[#F1A70E]/20 bg-[#F1A70E]/[0.02]">
                    <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#F1A70E]" /> 3. Economics & On-Chain Registration
                    </h3>
                    <p className="text-sm text-[#F1A70E]/70">Set your pricing policy and deploy immutable proofs to Avalanche.</p>

                    {/* Summary Card */}
                    <div className="bg-black/40 border border-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Dataset Title</span>
                            <span className="text-gray-200 font-medium">{formData.title}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Category</span>
                            <span className="text-gray-200 font-medium">{formData.category}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">On-Chain ID</span>
                            <span className="text-emerald-400 font-mono text-xs">{generatedId}</span>
                        </div>
                    </div>

                    <div className="space-y-8 py-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="revenueShare" className="text-gray-300 text-base">Protocol Revenue Share</Label>
                                <span className="text-lg font-bold text-[#F1A70E]">{formData.revenueShare}%</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">Percentage taken by the DAO/Protocol per inference. Agent consumers will pay this dynamically.</p>
                            <input
                                type="range"
                                id="revenueShare"
                                min="0"
                                max="50"
                                value={formData.revenueShare}
                                onChange={(e) => setFormData({ ...formData, revenueShare: Number(e.target.value) })}
                                className="w-full accent-[#F1A70E] bg-black/40 h-2 rounded-lg appearance-none cursor-pointer mt-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pricePerUse" className="text-gray-300">Price Per Inference (AVAX)</Label>
                            <p className="text-sm text-gray-500 mb-2">Cost paid by the Agent in AVAX every time this payload is utilized.</p>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <Input
                                    id="pricePerUse"
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={formData.pricePerUse}
                                    onChange={(e) => setFormData({ ...formData, pricePerUse: Number(e.target.value) })}
                                    className="bg-black/60 pl-11 py-6 text-lg border-[#F1A70E]/30 focus:border-[#F1A70E] text-white font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col gap-4 border-t border-white/10 mt-6">
                        <TxButton
                            status={txStatus}
                            hash={txHash}
                            onClick={handleRegister}
                            disabled={!isConnected}
                            idleText="Register Asset On-Chain"
                        />
                        {errorMsg && (
                            <p className="text-red-400 text-sm text-center">{errorMsg}</p>
                        )}
                        {txStatus === "idle" && (
                            <Button variant="ghost" onClick={() => setStep(2)} className="text-gray-400 hover:text-white mx-auto">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                        )}
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
