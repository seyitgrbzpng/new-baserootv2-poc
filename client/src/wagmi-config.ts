import { http, createConfig } from 'wagmi'
import { avalancheFuji } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Use environment variable for RPC if available, otherwise default
const rpcUrl = import.meta.env.VITE_EVM_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '3fcc6bf1e3e7100b0e5170d1ed0de1d6';

export const config = createConfig({
    chains: [avalancheFuji],
    connectors: [
        injected(),
        walletConnect({
            projectId,
            showQrModal: true,
            metadata: {
                name: 'Baseroot Marketplace',
                description: 'DeSci AI Agent Marketplace',
                url: 'https://baseroot.io',
                icons: ['https://baseroot.io/logo.svg']
            }
        })
    ],
    transports: {
        [avalancheFuji.id]: http(rpcUrl),
    },
})
