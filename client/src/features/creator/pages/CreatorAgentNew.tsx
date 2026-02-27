import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useWalletContext } from "@/contexts/WalletContext";
import { PageHeader } from "@/shared/components/PageHeader";
import { GlassCard } from "@/shared/components/GlassCard";
import { TxButton, TxStatus } from "@/shared/components/TxButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Bot, Database, ShieldCheck, Copy, Check, Fingerprint, Globe, Key } from "lucide-react";
import { toast } from "sonner";
import { getAddress, parseEther } from 'viem';
import BaserootMarketplaceV2ABI from '@/contracts/BaserootMarketplaceV2.json';

const CATEGORIES = ['Research', 'Analysis', 'Trading', 'DeFi', 'Writing', 'Data Science', 'Other'];
const MARKETPLACE_ADDRESS = getAddress((import.meta.env.VITE_BASEROOT_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000') as string) as `0x${string}`;

/** Generate a unique agent ID from name + wallet + timestamp */
function generateAgentId(name: string, wallet: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 20);
  const walletSuffix = wallet.slice(-4).toLowerCase();
  const ts = Date.now().toString(36);
  return `agent-${slug}-${walletSuffix}-${ts}`;
}

export default function CreatorAgentNew() {
  const { isConnected, address: walletAddress, sendContractWrite } = useWalletContext();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    pricePerUse: "",
    endpointUrl: "",
    apiKeyRequired: false,
    datasetIds: [] as string[]
  });

  const { data: availableDatasets, isLoading: loadingDatasets } = trpc.datasets.list.useQuery();
  const createAgentMutation = trpc.agents.create.useMutation();

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string>();
  const [errorMsg, setErrorMsg] = useState<string>();
  const [copiedId, setCopiedId] = useState(false);

  // Auto-generate unique agent ID
  const generatedId = useMemo(() => {
    if (!formData.name || !walletAddress) return '';
    return generateAgentId(formData.name, walletAddress);
  }, [formData.name, walletAddress]);

  const handleCopyId = () => {
    if (generatedId) {
      navigator.clipboard.writeText(generatedId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleNextStep1 = () => {
    if (!formData.name || !formData.description || !formData.category || !formData.pricePerUse || !formData.endpointUrl) {
      toast.error("Please fill all required fields in Step 1.");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setStep(3);
  };

  const toggleDataset = (id: string) => {
    setFormData(prev => ({
      ...prev,
      datasetIds: prev.datasetIds.includes(id)
        ? prev.datasetIds.filter(d => d !== id)
        : [...prev.datasetIds, id]
    }));
  };

  const handleRegister = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!generatedId) {
      toast.error("Agent ID could not be generated. Enter a name first.");
      return;
    }

    if (formData.datasetIds.length === 0) {
      toast.warning("You should attach at least one dataset to the agent.");
    }

    setTxStatus("signing");
    setErrorMsg(undefined);

    try {
      // 1. On-chain registration via V2 contract
      const priceInWei = parseEther(Number(formData.pricePerUse).toFixed(18));
      const primaryDatasetId = formData.datasetIds[0] || '';

      const result = await sendContractWrite({
        address: MARKETPLACE_ADDRESS,
        abi: BaserootMarketplaceV2ABI.abi,
        functionName: 'registerAgent',
        args: [generatedId, priceInWei, primaryDatasetId],
      });

      if (result.success && result.txSignature) {
        setTxStatus("pending");
        setTxHash(result.txSignature);

        // 2. Save to Firestore
        await createAgentMutation.mutateAsync({
          id: generatedId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          tags: [formData.category.toLowerCase()],
          datasetIds: formData.datasetIds,
          endpointUrl: formData.endpointUrl,
          apiKeyRequired: formData.apiKeyRequired,
          pricePerUse: parseFloat(formData.pricePerUse),
          currency: 'AVAX',
          creatorWallet: walletAddress,
        });

        setTxStatus("confirmed");
        toast.success("Agent registered on-chain!");

        setTimeout(() => {
          setLocation("/creator/agents");
        }, 2500);
      } else {
        setTxStatus("error");
        setErrorMsg(result.error || "Contract call failed");
      }
    } catch (error: any) {
      setTxStatus("error");
      setErrorMsg(error.message || "Transaction failed");
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto pb-20">
      <Link href="/creator/agents">
        <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white pl-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Agents
        </Button>
      </Link>

      <PageHeader
        title="Agent Registration Wizard"
        description={`Step ${step} of 3 • Deploy a new AI agent on the network.`}
      />

      {/* Auto-generated ID Preview */}
      {generatedId && (
        <div className="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-blue-400 font-medium">Auto-Generated Agent ID</p>
                <p className="text-sm font-mono text-white mt-0.5">{generatedId}</p>
              </div>
            </div>
            <button onClick={handleCopyId} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              {copiedId
                ? <Check className="w-4 h-4 text-blue-400" />
                : <Copy className="w-4 h-4 text-gray-400" />
              }
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <GlassCard className="space-y-6 animate-in slide-in-from-right-4">
          <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#F1A70E]" /> 1. Basic Information
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Agent Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. DeFi Yield Optimizer"
                className="bg-black/40 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Description *</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe capabilities and specific tasks..."
                className="bg-black/40 border-white/10 text-white min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Category *</Label>
                <Select value={formData.category} onValueChange={val => setFormData(f => ({ ...f, category: val }))}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">License Price (AVAX) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.pricePerUse}
                  onChange={e => setFormData(f => ({ ...f, pricePerUse: e.target.value }))}
                  placeholder="e.g. 0.5"
                  className="bg-black/40 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Self-Hosted Endpoint */}
            <div className="space-y-2 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-blue-400" />
                <Label className="text-blue-300 font-medium">Self-Hosted Inference Endpoint *</Label>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                The URL where your agent brain server is running. Must expose a <code className="text-blue-400">/chat</code> POST endpoint.
                See <code className="text-blue-400">sample_agent_brain.js</code> for reference.
              </p>
              <Input
                value={formData.endpointUrl}
                onChange={e => setFormData(f => ({ ...f, endpointUrl: e.target.value }))}
                placeholder="e.g. https://my-agent.example.com/chat or http://localhost:8080/chat"
                className="bg-black/40 border-blue-500/20 text-white font-mono text-sm"
              />
              <div className="flex items-center gap-3 mt-3">
                <Checkbox
                  checked={formData.apiKeyRequired}
                  onCheckedChange={(checked) => setFormData(f => ({ ...f, apiKeyRequired: !!checked }))}
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm text-gray-400">Requires API Key for access</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleNextStep1} className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black px-8">
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </GlassCard>
      )}

      {/* STEP 2: Dataset Attach */}
      {step === 2 && (
        <GlassCard className="space-y-6 animate-in slide-in-from-right-4">
          <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" /> 2. Attach DAO Datasets
          </h3>
          <p className="text-gray-400 text-sm">
            Select verified zero-knowledge datasets to fine-tune your agent. The actual raw data is never exposed.
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {loadingDatasets ? (
              <p className="text-gray-500 text-center py-4">Loading datasets...</p>
            ) : availableDatasets?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No verified datasets available.</p>
            ) : (
              availableDatasets?.map(ds => (
                <div
                  key={ds.id}
                  onClick={() => toggleDataset(ds.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.datasetIds.includes(ds.id)
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-black/40 border-white/5 hover:border-emerald-500/20"
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.datasetIds.includes(ds.id)}
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        disabled
                      />
                      <span className="font-semibold text-gray-200">{ds.title}</span>
                    </div>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">Verified</span>
                  </div>
                  <p className="text-sm text-gray-400 pl-6 mb-2">{ds.description}</p>
                  <p className="text-xs text-gray-500 pl-6 font-mono">ID: {ds.id}</p>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 flex justify-between border-t border-white/10">
            <Button variant="ghost" onClick={() => setStep(1)} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={handleNextStep2} className="bg-[#F1A70E] hover:bg-[#F1A70E]/80 text-black px-8">
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </GlassCard>
      )}

      {/* STEP 3: On-chain Registration */}
      {step === 3 && (
        <GlassCard className="space-y-6 animate-in slide-in-from-right-4">
          <h3 className="text-xl font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" /> 3. On-chain Registration
          </h3>
          <p className="text-gray-400 text-sm">
            Review your agent settings and sign the transaction to deploy on Avalanche Fuji.
          </p>

          <div className="bg-black/40 border border-white/5 rounded-lg p-4 space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Name</span>
              <span className="text-gray-200 font-medium">{formData.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Category</span>
              <span className="text-gray-200 font-medium">{formData.category}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price Per Use</span>
              <span className="text-[#F1A70E] font-bold">{formData.pricePerUse} AVAX</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3">
              <span className="text-gray-500">Attached Datasets</span>
              <span className="text-emerald-400 font-medium">{formData.datasetIds.length} Verified Sources</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3">
              <span className="text-gray-500">On-Chain ID</span>
              <span className="text-blue-400 font-mono text-xs">{generatedId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Inference Endpoint</span>
              <span className="text-blue-400 font-mono text-xs truncate max-w-[200px]" title={formData.endpointUrl}>{formData.endpointUrl}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">API Key Required</span>
              <span className={formData.apiKeyRequired ? 'text-yellow-400' : 'text-gray-400'}>{formData.apiKeyRequired ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <TxButton
            status={txStatus}
            hash={txHash}
            errorMsg={errorMsg}
            onClick={handleRegister}
            idleText="Deploy Agent to Fuji Testnet"
          />

          {txStatus === "idle" && (
            <div className="pt-4 flex justify-start">
              <Button variant="ghost" onClick={() => setStep(2)} className="text-gray-400 hover:text-white pl-0">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Edit
              </Button>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
