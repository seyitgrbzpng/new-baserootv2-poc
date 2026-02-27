import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { trpc } from '@/lib/trpc';
import { trpcClient, queryClient } from '@/lib/queryClient';
import { config as wagmiConfig } from '@/wagmi-config';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WalletContextProvider } from '@/contexts/WalletContext';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <WagmiProvider config={wagmiConfig}>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider defaultTheme="dark">
                        <WalletContextProvider>
                            <TooltipProvider>
                                <Toaster />
                                {children}
                            </TooltipProvider>
                        </WalletContextProvider>
                    </ThemeProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </trpc.Provider>
    );
}
