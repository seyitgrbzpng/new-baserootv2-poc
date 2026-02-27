import { createPublicClient, http, parseEther } from 'viem';
import { avalancheFuji } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';

const client = createPublicClient({
    chain: avalancheFuji,
    transport: http()
});

const abiPath = path.resolve(__dirname, '../../client/src/contracts/BaserootMarketplace.json');
const abiFile = fs.readFileSync(abiPath, 'utf8');
const BaserootMarketplaceABI = JSON.parse(abiFile);

async function main() {
    try {
        console.log("Simulating contract call...");
        const result = await client.simulateContract({
            address: '0xF501b1615CD3B8E98c658C3F269A498c63A1D5Cb',
            abi: BaserootMarketplaceABI.abi,
            functionName: 'pay',
            args: ['luna-test-id', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'],
            account: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            value: parseEther('0.05')
        });
        console.log('Simulate Success!', result);
    } catch (e) {
        console.error('Simulate Error:', e);
    }
}
main();
