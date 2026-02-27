# Baseroot.io - DeSci AI Agent Marketplace

> Decentralized AI Agent Marketplace powered by Avalanche (AVAX) blockchain

![Baseroot Logo](./client/public/logo.svg)

## 🚀 Genel Bakış

Baseroot.io, yapay zeka agentlarının alınıp satılabildiği, kullanıcıların AVAX token ile ödeme yaparak agentları kullanabildiği merkezi olmayan bir pazaryeri platformudur. DeSci (Decentralized Science) topluluğu için özel olarak tasarlanmıştır.

## ✨ Özellikler

### 🎨 UI/UX
- Modern ve responsive tasarım
- Mobil uyumlu hamburger menü
- Gradient butonlar ve hover efektleri
- Dark mode tema
- Altın sarısı (#F1A70E) renk paleti

### 🔐 Blockchain & Wallet
- Avalanche (C-Chain) blockchain entegrasyonu
- Core, Metamask & EVM-compatible wallet desteği
- Fuji Testnet desteği
- Otomatik payment split (%50 DAO, %40 Creator, %10 Platform)
- Transaction verification via Snowtrace

### 🤖 Agent Marketplace
- Agent listeleme ve arama
- Kategori filtreleme (Research, Analysis, Writing)
- Agent detay sayfası
- Rating & Review sistemi
- Favori agent sistemi
- Agent versiyonlama

### 💳 Payment & Subscriptions
- AVAX (Avalanche Fuji) ile ödeme
- Pay-per-License/License Gateway model
- Subscription planları (Basic, Pro, Enterprise)
- Virtual Treasury (Claim) sistemi
- Payment history with direct Snowtrace links

### 📊 Analytics & Dashboard
- Creator Dashboard
  - Gelir analizi
  - Agent performans metrikleri
  - Kullanım istatistikleri
- User Dashboard
  - Kullanım geçmişi
  - Harcama özeti
  - Favori agentlar
- Admin Panel
  - Platform istatistikleri
  - Agent yönetimi
  - Rate limit monitoring

### 🔔 Notifications
- Real-time bildirimler
- Payment onayları
- Agent güncellemeleri
- Review bildirimleri
- Unread badge

### 📚 Developer Tools
- API Documentation
- Code examples (JS, Python, cURL)
- REST API endpoints
- Rate limiting
- Webhook support

## 🛠️ Teknoloji Stack

### Frontend
- **React 19.2** + TypeScript
- **Vite** - Build tool
- **TailwindCSS 4.1** - Styling
- **Wouter** - Routing
- **TanStack Query** - Data fetching
- **tRPC** - Type-safe API
- **Radix UI** - Component library
- **Framer Motion** - Animations
- **Wagmi / Viem** - EVM Wallet integration

### Backend
- **Express.js** - Web server
- **tRPC** - API layer
- **Firebase Firestore** - Database
- **Firebase Auth** - Authentication (wallet-based & OAuth)
- **Wagmi / Viem** - Blockchain interaction
- **BaserootMarketplaceV2.sol** - Avalanche Smart Contract
- **OpenAI API** - LLM integration

## 📦 Kurulum

### Gereksinimler
- Node.js 22.13.0+
- pnpm 10.4.1+
- Firebase account (Firestore + Auth)
- Avalanche wallet (Core, Metamask, etc.)

### Adımlar

1. **Repoyu klonlayın**
```bash
git clone https://github.com/ahmetgurbuz7158/baseroot-marketplace.git
cd baseroot-marketplace
```

2. **Dependencies yükleyin**
```bash
pnpm install
```

3. **Firebase projesini yapılandırın**
```bash
# Firebase Console'dan proje oluşturun
# Service account key'i indirin
# Firestore ve Auth'u aktifleştirin
```

4. **Environment variables ayarlayın**
```bash
# .env dosyası oluşturun
cp .env.example .env

# Gerekli değişkenleri doldurun:
# - FIREBASE_PROJECT_ID
# - FIREBASE_SERVICE_ACCOUNT
# - VITE_SOLANA_NETWORK (devnet/mainnet-beta)
# - VITE_PLATFORM_WALLET
```

5. **Firestore rules ve indexes'i deploy edin**
```bash
firebase login
firebase init firestore
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

6. **Development server başlatın**
```bash
pnpm dev
```

7. **Production build**
```bash
pnpm build
pnpm start
```

## 🗄️ Database Schema

### Firebase Firestore Collections

#### Core Collections
- `users` - Kullanıcı profilleri (wallet + OAuth unified)
- `agents` - AI agent bilgileri
- `payments` - Payment kayıtları (blockchain verified)
- `agent_runs` - Agent kullanım kayıtları

#### Feature Collections
- `reviews` - Kullanıcı değerlendirmeleri (verified badges)
- `notifications` - Real-time bildirim sistemi
- `favorites` - Favori agentlar (denormalized)
- `subscriptions` - Abonelik sistemi
- `agent_versions` - Agent versiyonları
- `analytics_events` - Analitik olayları
- `search_filters` - Arama filtreleri
- `multichain_wallets` - Multi-chain wallet desteği

### Firebase Auth
- Wallet-based authentication (Solana signatures)
- OAuth providers (Email, Google, GitHub)
- Custom tokens for wallet users
- Role-based access control

**Not:** MongoDB ve MySQL bağımlılıkları kaldırılmıştır. Detaylar için [FIREBASE_MIGRATION.md](./FIREBASE_MIGRATION.md) dosyasına bakın.

## 🔌 API Endpoints

### Agents
```
GET    /api/agents              # List all agents
GET    /api/agents/:id          # Get agent details
POST   /api/agents              # Create agent
PUT    /api/agents/:id          # Update agent
POST   /api/agents/execute      # Execute agent
```

### Reviews
```
GET    /api/reviews/:agentId    # Get agent reviews
POST   /api/reviews             # Create review
PUT    /api/reviews/:id         # Update review
DELETE /api/reviews/:id         # Delete review
```

### Notifications
```
GET    /api/notifications       # Get user notifications
POST   /api/notifications/read  # Mark as read
DELETE /api/notifications/:id   # Delete notification
```

### Analytics
```
GET    /api/analytics/agent/:id # Get agent analytics
GET    /api/analytics/creator   # Get creator stats
POST   /api/analytics/track     # Track event
```

### Favorites
```
GET    /api/favorites           # Get user favorites
POST   /api/favorites           # Add favorite
DELETE /api/favorites/:id       # Remove favorite
```

### Subscriptions
```
GET    /api/subscriptions       # Get user subscriptions
POST   /api/subscriptions       # Create subscription
PUT    /api/subscriptions/:id   # Update subscription
DELETE /api/subscriptions/:id   # Cancel subscription
```

## 📱 Sayfalar

- `/` - Ana sayfa (Marketplace)
- `/dashboard` - Creator Dashboard
- `/user-dashboard` - User Dashboard
- `/register-agent` - Agent kayıt formu
- `/api-docs` - API Dokümantasyonu
- `/admin` - Admin Panel

## 🧪 Testing

```bash
# Run tests
pnpm test

# Type check
pnpm check

# Format code
pnpm format
```

## 📝 Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm check        # TypeScript type check
pnpm format       # Format code with Prettier
pnpm test         # Run tests
pnpm db:push      # Run database migrations
```

## 🔒 Security

- API key authentication
- Rate limiting
- Wallet signature verification
- CORS protection
- Input validation with Zod

## 🌐 Deployment

### Vercel (Önerilen)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build image
docker build -t baseroot-marketplace .

# Run container
docker run -p 3000:3000 baseroot-marketplace
```

## 📊 Monitoring

- Health check system (5 dakikada bir)
- Rate limit tracking
- Analytics event tracking
- Error logging

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Solana Foundation
- DeSci Community
- Manus Platform
- OpenAI

## 📞 Contact

- Website: [baseroot.io](https://baseroot.io)
- Twitter: [@baserootio](https://twitter.com/baserootio)
- Discord: [Join our community](https://discord.gg/baseroot)

---

**Built for the DeSci Community • Powered by Solana**

© 2026 Baseroot.io
