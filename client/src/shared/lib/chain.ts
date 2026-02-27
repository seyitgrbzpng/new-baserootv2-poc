import { avalancheFuji } from 'viem/chains';

export const CHAIN = avalancheFuji;
export const CHAIN_ID = avalancheFuji.id;
export const CONTRACT_ADDRESS = (import.meta.env.VITE_BASEROOT_MARKETPLACE_ADDRESS || '0xF501b1615CD3B8E98c658C3F269A498c63A1D5Cb') as `0x${string}`;
export const PLATFORM_WALLET = import.meta.env.VITE_PLATFORM_WALLET || '';

export function getExplorerTxUrl(txHash: string): string {
    return `${CHAIN.blockExplorers?.default.url}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
    return `${CHAIN.blockExplorers?.default.url}/address/${address}`;
}
