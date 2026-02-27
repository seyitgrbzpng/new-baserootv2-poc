import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { parseEther, getAddress } from 'viem';
import BaserootMarketplaceABI from '@/contracts/BaserootMarketplace.json';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Link as LinkIcon } from 'lucide-react';

interface AgentRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string; // The Firestore Agent ID
    metadataUrl: string; // URL to agent metadata (json)
    defaultPrice?: string;
}

export default function AgentRegistrationModal({ isOpen, onClose, agentId, metadataUrl, defaultPrice = '0.01' }: AgentRegistrationModalProps) {
    const { writeContractAsync } = useWriteContract();

    const [price, setPrice] = useState(defaultPrice);
    const [datasetIds, setDatasetIds] = useState(''); // Comma separated
    const [isRegistering, setIsRegistering] = useState(false);

    const handleRegister = async () => {
        setIsRegistering(true);
        try {
            const datasets = datasetIds.split(',').map(s => s.trim()).filter(Boolean);

            const MARKETPLACE_ADDRESS = getAddress((import.meta.env.VITE_BASEROOT_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000') as string) as `0x${string}`;

            const tx = await writeContractAsync({
                address: MARKETPLACE_ADDRESS,
                abi: BaserootMarketplaceABI.abi,
                functionName: 'registerAgent',
                args: [
                    agentId,
                    parseEther(price),
                    metadataUrl,
                    datasets
                ],
            });

            console.log('Agent Registered:', tx);
            alert(`Agent Registered On-Chain! TX: ${tx}`);
            onClose();
        } catch (error) {
            console.error('Error registering agent:', error);
            alert('Failed to register agent on-chain');
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle>Register Agent On-Chain</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Link your AI agent to the Baseroot Marketplace smart contract.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Agent ID</label>
                        <input
                            disabled
                            value={agentId}
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-gray-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Price Per Use (AVAX)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Used Dataset IDs (Data Provenance)</label>
                        <input
                            placeholder="e.g. bio-research-v1, chem-data-v2"
                            value={datasetIds}
                            onChange={(e) => setDatasetIds(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                        <p className="text-xs text-gray-500">Comma separated IDs of registered datasets this agent uses.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRegister}
                        disabled={isRegistering}
                        className="bg-[#F1A70E] text-black hover:bg-[#F1A70E]/80"
                    >
                        {isRegistering ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registering...
                            </>
                        ) : (
                            <>
                                <LinkIcon className="mr-2 h-4 w-4" />
                                Register On-Chain
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
