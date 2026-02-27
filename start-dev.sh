#!/bin/bash
cd /home/ubuntu/baseroot-marketplace
export MONGODB_URL="mongodb+srv://essesoftcontact_db_user:14531453_Baseroot@baserootio.t8r6grz.mongodb.net/?retryWrites=true&w=majority&appName=baserootio"
export MONGODB_DB_NAME="baseroot_marketplace"
export VITE_SOLANA_NETWORK="devnet"
export VITE_SOLANA_RPC_URL="https://api.devnet.solana.com"
export VITE_PLATFORM_WALLET="3HCeMh9nW2BSHionrrmxH7WNf1fpmZNTAskD9JjGK7eb"
pnpm dev
