# Baseroot Core Developer Guide (Onboarding & Setup)

Hoş geldin Core Dev! Bu kılavuz, Baseroot V2'nin yerel ortamında hızlıca ayağa kalkabilmen ve geliştirme süreçlerine sorunsuz dahil olabilmen için hazırlanmıştır.

## 1. Teknoloji Yığını (Stack) Özeti

| Katman | Teknoloji | Açıklama |
|---|---|---|
| **Frontend** | React 19, Vite, TailwindCSS 4, shadcn/ui | Modern, hızlı ve modüler UI geliştirme ortamı. Siyah ağırlıklı *Glassmorphism* tasarımı kullanılır. |
| **Backend & Routing** | Express.js, tRPC | Type-safe API iletişimi. İstemci ile sunucu arasında veri tiplerinin tam eşleşmesi sağlanır. |
| **Blockchain (EVM)** | Avalanche (Fuji), Wagmi, Viem, Solidity | Testnet üzerinde akıllı sözleşme (`BaserootMarketplaceV2.sol`), cüzdan bağlama ve işlem onaylama katmanı. |
| **Veritabanı** | Firebase Firestore | NoSQL tabanlı, hızlı ve ölçeklenebilir bulut veritabanı. İzole edilmiş `avax_` prefix'li koleksiyonlar kullanır. |

## 2. Geliştirme Ortamı Kurulumu

Baseroot'u kendi makinenizde çalıştırmak için aşağıdaki adımları sırayla uygulayın:

### 2.1. Gereksinimler
- **Node.js**: v22+
- **Paket Yöneticisi**: `pnpm` (v10+ şiddetle önerilir)
- **Cüzdan**: Avalanche Fuji ağı eklenmiş MetaMask, Core veya Rabby Wallet
- **Firebase CLI**: Backend emülatörleri veya deploy işlemleri için `npm install -g firebase-tools`

### 2.2. Projeyi Klonlama ve Paket Yükleme
```bash
# Proje dizinine gidin
cd baseroot-marketplace-main

# Bağımlılıkları yükleyin (npm veya yarn KULLANMAYIN)
pnpm install
```

### 2.3. Ortam Değişkenleri (.env)
Projenin kök dizininde bulunan `.env.example` dosyasını kopyalayarak yeni bir `.env` dosyası oluşturun:
```bash
cp .env.example .env
```
Gerekli alanları doldurun. Özellikle Avalanche test ağı smart contract adresinizin var olduğundan emin olun (Örn: `0x3e251B4d78b0351A9E5a7d3df134b8e5870e7782`).

### 2.4. Geliştirme Sunucusunu Başlatma
Proje `tsx` ve `vite` ile hem sunucuyu hem de istemciyi aynı anda kaldırabilecek yapıdadır.
```bash
pnpm dev
```
Bu komut sonrası:
- **Frontend**: http://localhost:5173 
- **Backend (tRPC)**: Vite proxy'si ile aynı porttan haberleşir, arkada http://localhost:5000'de çalışır.

## 3. NPM Scriptleri Rehberi

`package.json` içerisindeki projenin ana komutları şunlardır:

* `pnpm dev`: Geliştirme modunu başlatır (Vite + Express).
* `pnpm build`: Frontend için statik dosyaları oluşturur (`vite build`) ve backend sunucusunu bundle eder (`esbuild`).
* `pnpm start`: Production ortamında build alınmış dosyaları Node.js ile çalıştırır.
* `pnpm check`: TypeScript tip kontrollerini gerçekleştirir (Bunu PR açmadan önce yapmanız FARZDIR!).
* `pnpm format`: Prettier kullanarak tüm dosyaları formatlar.
* `pnpm test`: Vitest kullanarak birim testlerini (unit tests) çalıştırır.

## 4. Akıllı Sözleşme (Smart Contract) Etkileşimi

Kullanıcı arayüzünde blockchain ile etkileşim kurarken mutlaka `wagmi` hook'larını kullanmalıyız. Eskiden Solana için yazılmış olan `@solana/web3.js` kalıntıları **TAMAMEN** temizlenmiştir.

**Örnek bir ödeme tx gönderimi:**
```tsx
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import contractJson from "../../../../contracts/out/BaserootMarketplaceV2.sol/BaserootMarketplaceV2.json";

// ...
const { writeContractAsync } = useWriteContract();

const handlePayment = async () => {
  const hash = await writeContractAsync({
    address: CONTRACT_ADDRESS,
    abi: contractJson.abi,
    functionName: "pay",
    args: [agentId, creatorAddress],
    value: parseEther(agentPrice)
  });
  // receipt bekle...
}
```

## 5. Firebase & Firestore Kuralları

- V2 sürümünde bütün veritabanı yolları `avax_` ile başlamalıdır. (Örn: `avax_users`, `avax_agents`).
- Güvenlik kurallarını güncellemek isterseniz kök dizindeki `firestore.rules` dosyasını değiştiriniz.
- Yeni bir veritabanı router'ı (tRPC) yazarken `server/` dizinine `.ts` olarak modülünüzü oluşturup `server/routers.ts` içerisine bağlayınız.
