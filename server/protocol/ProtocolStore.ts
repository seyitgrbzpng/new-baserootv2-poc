import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'server', 'protocol', 'protocol_db.json');

// Types representing On-Chain Data Structures

export type AgentStatus = 'active' | 'paused' | 'banned';

export interface ProtocolAgent {
    agent_id: string;
    creator_wallet: string;
    public_key: string; // Ed25519 public key for verifying execution signatures
    status: AgentStatus;
    stake_amount: number; // In Wei (for V2.1)
    created_at: number;
}

export interface DatasetPolicy {
    type: 'pay_per_use' | 'subscription';
    price: number; // In Wei
    currency: 'AVAX';
}

export interface ProtocolDataset {
    dataset_id: string;
    dao_wallet: string;
    data_hash: string; // IPFS CID or similar content hash
    license_policy: DatasetPolicy;
    status: 'active' | 'disabled';
    created_at: number;
}

// In-Memory "Blockchain" State (simulated)
// In a real implementation, this would be replaced by RPC calls to Avalanche
class ProtocolStore {
    private static instance: ProtocolStore;

    // "Accounts"
    private agents: Map<string, ProtocolAgent> = new Map();
    private datasets: Map<string, ProtocolDataset> = new Map();

    private constructor() {
        console.log('[Protocol] Initializing Simulated Chain...');
        this.loadState().catch(err => console.error('[Protocol] Failed to load state:', err));
    }

    private async loadState() {
        try {
            const data = await fs.readFile(DB_PATH, 'utf-8');
            const json = JSON.parse(data);

            this.agents = new Map(json.agents.map((a: any) => [a.agent_id, a]));
            this.datasets = new Map(json.datasets.map((d: any) => [d.dataset_id, d]));

            console.log(`[Protocol] Loaded ${this.agents.size} Agents and ${this.datasets.size} Datasets from persistence.`);
        } catch (err) {
            console.log('[Protocol] No existing DB found, starting fresh.');
        }
    }

    private async saveState() {
        const data = {
            agents: Array.from(this.agents.values()),
            datasets: Array.from(this.datasets.values())
        };
        try {
            await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('[Protocol] Failed to save state:', err);
        }
    }

    static getInstance(): ProtocolStore {
        if (!ProtocolStore.instance) {
            ProtocolStore.instance = new ProtocolStore();
        }
        return ProtocolStore.instance;
    }

    // --- AgentRegistry Contract Logic ---

    async registerAgent(
        creator_wallet: string,
        public_key: string
    ): Promise<ProtocolAgent> {
        // Validate inputs (Simulate Smart Contract checks)
        if (!creator_wallet || !public_key) {
            throw new Error('Protocol Error: Invalid agent registration data');
        }

        const agent: ProtocolAgent = {
            agent_id: `agent_${nanoid(8)}`,
            creator_wallet,
            public_key,
            status: 'active',
            stake_amount: 0,
            created_at: Date.now(),
        };

        this.agents.set(agent.agent_id, agent);
        await this.saveState();
        console.log(`[Protocol] Agent Registered: ${agent.agent_id}`);
        return agent;
    }

    async getAgent(agent_id: string): Promise<ProtocolAgent | null> {
        return this.agents.get(agent_id) || null;
    }

    async getAllAgents(): Promise<ProtocolAgent[]> {
        return Array.from(this.agents.values());
    }


    async updateAgentStatus(
        agent_id: string,
        status: AgentStatus,
        sender_wallet: string
    ): Promise<ProtocolAgent> {
        const agent = this.agents.get(agent_id);
        if (!agent) throw new Error('Protocol Error: Agent not found');

        // Auth Check (Only owner can update - simulate signature check)
        if (agent.creator_wallet !== sender_wallet) {
            throw new Error('Protocol Error: Unauthorized (Caller is not Owner)');
        }

        const updated = { ...agent, status };
        this.agents.set(agent_id, updated);
        await this.saveState();
        return updated;
    }

    // --- DatasetRegistry Contract Logic ---

    async registerDataset(
        dao_wallet: string,
        data_hash: string,
        price: number
    ): Promise<ProtocolDataset> {
        const dataset: ProtocolDataset = {
            dataset_id: `data_${nanoid(8)}`,
            dao_wallet,
            data_hash,
            license_policy: {
                type: 'pay_per_use',
                price,
                currency: 'AVAX'
            },
            status: 'active',
            created_at: Date.now(),
        };

        this.datasets.set(dataset.dataset_id, dataset);
        await this.saveState();
        console.log(`[Protocol] Dataset Registered: ${dataset.dataset_id}`);
        return dataset;
    }

    async getDataset(dataset_id: string): Promise<ProtocolDataset | null> {
        return this.datasets.get(dataset_id) || null;
    }

    async getAllDatasets(): Promise<ProtocolDataset[]> {
        return Array.from(this.datasets.values());
    }


    // --- RevenueRouter Simulation ---

    // Returns the distribution plan, doesn't actually move funds (that's for phase 3)
    simulateRevenueSplit(amount: number) {
        const PROTOCOL_FEE_BPS = 500; // 5%
        const protocol_fee = Math.floor(amount * PROTOCOL_FEE_BPS / 10000);
        const remainder = amount - protocol_fee;

        // Simple 100% to creator for now (minus protocol fee)
        // Complex splits (DAO vs Agent) will go here
        return {
            protocol: protocol_fee,
            creator: remainder
        };
    }
}

export const protocol = ProtocolStore.getInstance();
