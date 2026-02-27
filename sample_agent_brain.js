
import express from 'express';
import cors from 'cors';

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

/**
 * Honest Engine Chat Endpoint
 */
app.post('/chat', (req, res) => {
    const { taskId, agentId, userWallet, input, paymentProof } = req.body;

    console.log('--- New Request Received ---');
    console.log('Task ID:', taskId);
    console.log('Agent:', agentId);
    console.log('User:', userWallet);
    console.log('Prompt:', input?.prompt);
    console.log('Payment ID:', paymentProof?.paymentId);
    console.log('---------------------------');

    const prompt = input?.prompt || '';
    let response = '';

    // Realistic Research Logic
    if (prompt.toLowerCase().includes('solana')) {
        response = "Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale. It uses a unique Proof of History (PoH) consensus mechanism. Since you asked about it, I'd say its throughput and low fees make it perfect for AI marketplaces like Baseroot.";
    } else if (prompt.toLowerCase().includes('baseroot')) {
        response = "Baseroot is a decentralized AI marketplace that empowers creators. By using the 'Honest Engine' architecture, it ensures that AI computations are distributed and transparent, moving away from centralized control.";
    } else {
        response = `Hello! I am your AI Research Assistant. You asked: "${prompt}". 
    
Based on my analysis, I can tell you that decentralization is the key to the future of AI. By running me locally on a developer's machine while listing me on Baseroot, we are proving that the Honest Engine actually works!`;
    }

    // Standard AgentResponse format
    res.json({
        status: 'success',
        output: response,
        metadata: {
            model: 'Fast Researcher v1.0',
            computeTime: '450ms',
            tokensUsed: 124,
        },
        usage: {
            totalTokens: 124,
            cost: 0.0001
        }
    });
});

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'active', timestamp: Date.now() });
});

app.listen(port, () => {
    console.log(`🚀 Sample Agent Brain is running!`);
    console.log(`🔗 Endpoint URL: http://localhost:${port}/chat`);
    console.log(`💓 Health URL:   http://localhost:${port}/health`);
    console.log(`\nWaiting for requests from Baseroot Marketplace...`);
});
