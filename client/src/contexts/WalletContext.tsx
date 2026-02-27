import { FC, ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useSendTransaction, useSignMessage, useSwitchChain, useChainId, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useConnectors } from 'wagmi';
import { parseEther, getAddress } from 'viem';
import { injected } from 'wagmi/connectors';
import { avalancheFuji } from 'wagmi/chains';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { auth as firebaseAuth } from '@/firebase-config';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { ModernWalletModal } from '@/components/ModernWalletModal';

const NETWORK_NAME = 'Avalanche Fuji';
const PLATFORM_WALLET = import.meta.env.VITE_PLATFORM_WALLET || '';
const MARKETPLACE_ADDRESS = getAddress((import.meta.env.VITE_BASEROOT_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000') as string) as `0x${string}`;
import BaserootMarketplaceABI from '../contracts/BaserootMarketplace.json';
import BaserootMarketplaceV2ABI from '../contracts/BaserootMarketplaceV2.json';

interface PaymentParams {
  amount: number;
  creatorWallet: string;
  agentId: string;
  agentName?: string;
  description?: string;
}

interface PaymentResult {
  success: boolean;
  txSignature?: string;
  explorerUrl?: string;
  error?: string;
}

interface ContractWriteParams {
  address: `0x${string}`;
  abi: any;
  functionName: string;
  args?: any[];
  value?: bigint;
}

export type UserRole = 'guest' | 'user' | 'creator' | 'dao';

// Wallet context types
interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: number;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  connect: (adapter?: any) => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  sendPayment: (params: PaymentParams) => Promise<PaymentResult>;
  sendContractWrite: (params: ContractWriteParams) => Promise<PaymentResult>;
  signMessage: (message: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWalletContext(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletContextProvider');
  }
  return context;
}

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected, isConnecting, chainId } = useAccount();
  const { connect, connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const connectors = useConnectors();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
  });

  const { sendTransactionAsync } = useSendTransaction();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [userRole, setUserRoleState] = useState<UserRole>('guest');
  const prevAuthWalletRef = useMemo(() => ({ current: '' }), []);

  // Persist role in localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole && ['guest', 'user', 'creator', 'dao'].includes(savedRole)) {
      setUserRoleState(savedRole as UserRole);
    }
  }, []);

  const setUserRole = useCallback((role: UserRole) => {
    setUserRoleState(role);
    localStorage.setItem('userRole', role);
  }, []);

  // Ensure we are on the correct chain
  useEffect(() => {
    if (isConnected && chainId !== avalancheFuji.id) {
      switchChain({ chainId: avalancheFuji.id });
    }
  }, [isConnected, chainId, switchChain]);

  // Backend mutations
  const connectMutation = trpc.wallet.connect.useMutation();
  const walletMessageMutation = trpc.auth.walletMessage.useMutation();
  const walletLoginMutation = trpc.auth.walletLogin.useMutation();

  // Stable refs for mutation functions to avoid useEffect re-firing
  const connectMutationRef = useMemo(() => ({ current: connectMutation }), []);
  const walletMessageMutationRef = useMemo(() => ({ current: walletMessageMutation }), []);
  const walletLoginMutationRef = useMemo(() => ({ current: walletLoginMutation }), []);
  const signMessageAsyncRef = useMemo(() => ({ current: signMessageAsync }), []);

  // Keep refs up to date
  connectMutationRef.current = connectMutation;
  walletMessageMutationRef.current = walletMessageMutation;
  walletLoginMutationRef.current = walletLoginMutation;
  signMessageAsyncRef.current = signMessageAsync;

  // Handle Auth & Connection
  useEffect(() => {
    if (!isConnected || !address) {
      prevAuthWalletRef.current = '';
      return;
    }

    if (prevAuthWalletRef.current === address) return;
    prevAuthWalletRef.current = address;

    // Defer to avoid React concurrent rendering conflicts with Hydrate
    const timeoutId = setTimeout(() => {
      // Register wallet
      connectMutationRef.current.mutate({ walletAddress: address });

      // Attempt Firebase Login via Signature
      (async () => {
        try {
          const { message } = await walletMessageMutationRef.current.mutateAsync({ walletAddress: address });
          const signature = await signMessageAsyncRef.current({ message });
          const login = await walletLoginMutationRef.current.mutateAsync({
            walletAddress: address,
            signature,
            message,
          });
          await signInWithCustomToken(firebaseAuth, login.customToken);
          console.log('[WalletAuth] Login successful for', address);
        } catch (err) {
          console.error("[WalletAuth] Login failed:", err);
        }
      })();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isConnected, address]);


  const handleDisconnect = useCallback(async () => {
    try {
      await signOut(firebaseAuth);
      localStorage.removeItem('firebaseIdToken');
    } catch { }
    disconnect();
    // setUserRole('guest'); // Optional
  }, [disconnect]);

  const refreshBalance = useCallback(async () => {
    await refetchBalance();
  }, [refetchBalance]);

  // V2: License-first payment — uses buyLicense (40% creator / 50% DAO / 10% platform)
  const sendPayment = useCallback(async (params: PaymentParams): Promise<PaymentResult> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      console.log('[V2] Buying license for agent:', params.agentId, 'amount:', params.amount);

      const txHash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: BaserootMarketplaceV2ABI.abi,
        functionName: 'buyLicense',
        args: [params.agentId],
        value: parseEther(Number(params.amount).toFixed(18)),
      });

      console.log('[V2] Transaction sent:', txHash, '— waiting for receipt...');

      if (publicClient && txHash) {
        await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
        console.log('[V2] Transaction mined!', txHash);
      }

      return {
        success: true,
        txSignature: txHash,
        explorerUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
      };
    } catch (error) {
      console.error('[V2] Payment error:', error);

      let errorMessage = 'License purchase failed';
      if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).shortMessage || (error as any).details || (error as any).message || String(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [address, writeContractAsync, publicClient]);

  // Generic contract write for registerDataset, registerAgent, etc.
  const sendContractWrite = useCallback(async (params: ContractWriteParams): Promise<PaymentResult> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      console.log('[V2] Contract write:', params.functionName, params.args);

      const txHash = await writeContractAsync({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args || [],
        ...(params.value !== undefined ? { value: params.value } : {}),
      });

      console.log('[V2] Transaction sent:', txHash, '— waiting for receipt...');

      if (publicClient && txHash) {
        await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
        console.log('[V2] Transaction mined!', txHash);
      }

      return {
        success: true,
        txSignature: txHash,
        explorerUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
      };
    } catch (error) {
      console.error('[V2] Contract write error:', error);
      let errorMessage = 'Contract write failed';
      if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).shortMessage || (error as any).details || (error as any).message || String(error);
      }
      return { success: false, error: errorMessage };
    }
  }, [address, writeContractAsync, publicClient]);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    return await signMessageAsync({ message });
  }, [signMessageAsync]);

  const handleConnect = useCallback(async (uid?: string) => {
    try {
      if (uid) {
        const connector = connectors.find(c => c.uid === uid);
        if (!connector) throw new Error('Connector not found in wagmi config');

        if (connector.id === 'injected' && !(window as any).ethereum) {
          toast.error('No wallet extension detected', {
            description: 'Please install MetaMask or Core Wallet to connect.',
            action: {
              label: 'Install MetaMask',
              onClick: () => window.open('https://metamask.io/download/', '_blank'),
            },
            duration: 8000,
          });
          return;
        }
        await connectAsync({ connector });
      } else {
        // Fallback or default flow if no connector provided
        const injectedConnector = connectors.find(c => c.type === 'injected') || connectors[0];
        if (injectedConnector) {
          await connectAsync({ connector: injectedConnector });
        }
      }
    } catch (err: any) {
      console.error('[WalletConnect] Connection failed:', err);
      if (err.code === 4001 || err.name === 'UserRejectedRequestError') {
        toast.error('Connection rejected', { description: 'You rejected the connection request.' });
      } else {
        toast.error('Wallet connection failed', { description: err?.message || 'Please try again.' });
      }
    }
  }, [connectAsync, connectors]);

  const value: WalletContextType = {
    isConnected,
    isConnecting,
    address: address || null,
    balance: balanceData ? Number(balanceData.formatted) : 0,
    userRole,
    setUserRole,
    connect: handleConnect,
    disconnect: handleDisconnect,
    refreshBalance,
    sendPayment,
    sendContractWrite,
    signMessage,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

interface WalletOption {
  name: string;
  icon: string;
  adapter: string;
  description: string;
  installed?: boolean;
}

// Replacement for WalletMultiButton
export const WalletMultiButton = () => {
  const { isConnected, isConnecting, address, connect, disconnect, balance } = useWalletContext();
  const [modalOpen, setModalOpen] = useState(false);
  const { connectors } = useConnect();

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        onClick={disconnect}
        className="bg-[#F1A70E]/10 text-[#F1A70E] border-[#F1A70E]/50 hover:bg-[#F1A70E]/20"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {address.slice(0, 6)}...{address.slice(-4)} ({balance.toFixed(2)} AVAX)
      </Button>
    );
  }

  const walletOptions: WalletOption[] = [];

  // Find connectors from wagmi
  const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'metaMask');
  const walletConnectConnector = connectors.find(c => c.id === 'walletConnect');

  // 1. MetaMask
  if (injectedConnector) {
    walletOptions.push({
      name: 'MetaMask',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
      adapter: injectedConnector.uid,
      description: 'Connect to your MetaMask wallet',
      installed: !!(window as any).ethereum?.isMetaMask || !!(window as any).ethereum,
    });
  }

  // 2. Core Wallet
  if (injectedConnector) {
    walletOptions.push({
      name: 'Core',
      // Loading locally since external SVG URLs were blocked
      icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iI2YyZjJmMiIgc3Ryb2tlPSJub25lIi8+PHBhdGggZD0iTTEyIDZ2MTJtLTMtM2wzIDMgMy0zIiBzdHJva2U9IiMxYTFhMWEiLz48L3N2Zz4=',
      adapter: injectedConnector.uid, // Shares injected provider
      description: 'Connect to Avalanche Core wallet',
      installed: !!(window as any).avalanche || !!(window as any).ethereum,
    });
  }

  // 3. WalletConnect
  if (walletConnectConnector) {
    walletOptions.push({
      name: 'WalletConnect',
      // Official WC logo SVG
      icon: 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg',
      adapter: walletConnectConnector.uid,
      description: 'Scan QR code with your mobile wallet',
      installed: true,
    });
  }

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className="bg-[#F1A70E] text-black hover:bg-[#F1A70E]/80"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      <ModernWalletModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        wallets={walletOptions}
        onSelectWallet={(adapter) => {
          connect(adapter);
          setModalOpen(false);
        }}
        connecting={isConnecting}
      />
    </>
  );
};

export const formatAVAX = (amount: number) => `${amount.toFixed(4)} AVAX`;
export const truncateAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;
