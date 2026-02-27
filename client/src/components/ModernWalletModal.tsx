import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, ExternalLink, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalletOption {
  name: string;
  icon: string;
  adapter: string;
  description: string;
  installed?: boolean;
}

interface ModernWalletModalProps {
  open: boolean;
  onClose: () => void;
  wallets: WalletOption[];
  onSelectWallet: (adapter: string) => void;
  connecting: boolean;
}

export function ModernWalletModal({ open, onClose, wallets, onSelectWallet, connecting }: ModernWalletModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleWalletClick = (wallet: WalletOption) => {
    setSelectedWallet(wallet.name);
    onSelectWallet(wallet.adapter);
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 pr-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Wallet className="w-6 h-6 text-[#F1A70E]" />
            Connect Wallet
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            Choose your preferred wallet to connect to Baseroot Marketplace
          </p>
        </div>

        <div className="space-y-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleWalletClick(wallet)}
              className="w-full group relative text-left cursor-pointer z-10"
            >
              <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-800 bg-gray-950 hover:border-[#F1A70E] hover:bg-gray-900 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center group-hover:bg-[#F1A70E]/10 transition-colors shrink-0 overflow-hidden">
                  {wallet.icon ? (
                    <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded-lg object-contain" />
                  ) : (
                    <Wallet className="w-6 h-6 text-[#F1A70E]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-[#F1A70E] transition-colors truncate">
                    {wallet.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{wallet.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {connecting && selectedWallet === wallet.name ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#F1A70E]" />
                  ) : wallet.installed ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <ExternalLink className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            New to Web3 wallets?{' '}
            <a
              href="https://core.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F1A70E] hover:underline"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Custom Wallet Button Component
interface ModernWalletButtonProps {
  connected: boolean;
  connecting: boolean;
  walletAddress: string | null;
  balance: number;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ModernWalletButton({
  connected,
  connecting,
  walletAddress,
  balance,
  onConnect,
  onDisconnect,
}: ModernWalletButtonProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connected && walletAddress) {
    return (
      <div className="flex items-center gap-2">
        {/* Balance Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-xl border border-gray-800">
          <Wallet className="w-4 h-4 text-[#F1A70E]" />
          <span className="text-white font-medium text-sm">{balance.toFixed(2)} AVAX</span>
        </div>

        {/* Wallet Address Button */}
        <Button
          onClick={onDisconnect}
          className="bg-[#F1A70E] hover:bg-[#F5B83D] text-black font-semibold px-4 py-2 rounded-xl transition-all"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {truncateAddress(walletAddress)}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={onConnect}
      disabled={connecting}
      className="bg-[#F1A70E] hover:bg-[#F5B83D] text-black font-semibold px-6 py-2 rounded-xl transition-all disabled:opacity-50"
    >
      {connecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}
