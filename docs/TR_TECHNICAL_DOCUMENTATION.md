# Baseroot Marketplace V2 - Kapsamlı Teknik Dokümantasyon

## 1. Sistemin Genel Amacı ve Vizyonu
Baseroot Marketplace V2, veri sağlayıcılar (DAO'lar), yapay zeka ajan geliştiricileri (Creator) ve son kullanıcılar (Consumer) arasında güvenli, şeffaf ve kripto-ekonomik (Avalanche EVM tabanlı) bir köprü kurmak amacıyla tasarlanmış merkeziyetsiz bir pazar yeridir. Platform, DeSci (Merkeziyetsiz Bilim) felsefesinden yola çıkarak, kullanıcıların kendi verilerini fikri mülkiyet sınırları içerisinde, yapay zeka modelleri tarafından "çalınmadan" eğitilmesi veya kullanılması için pazar yerinde listelemelerine olanak tanır.

## 2. Platform Mimarisi (3 Ayaklı Yapı)
Kullanıcı deneyimi karmaşasını önlemek adına modüler bir 3 ayaklı (3-Pillar) yapı inşa edilmiştir.

### 2.1. Ana Sayfa (Landing Page - `/`)
- Platformun vizyonunu anlatan vitrin sayfası.
- "Derin Karanlık" (Deep Dark) ve Glassmorphism tasarım prensipleri, Kehribar (Amber - `#F1A70E`) rengi vurgularla kullanıldı.
- Kullanıcıların Cüzdan bağlayarak Hangi rolde (Tüketici, Geliştirici, DAO) giriş yapacaklarını seçtikleri bir Onboarding Modal barındırır.

### 2.2. Tüketici Alanı (Marketplace - `/marketplace`)
- Eskiden `Home.tsx` olan monolitik yapı buraya taşınmıştır.
- Son kullanıcılar (Consumers) burada listelenen özel yapay zeka ajanlarını kategorilerine (Örn: Web3 Governance, DeFi, vb.) göre filtreler.
- Kullanıcılar Avalanche (AVAX) üzerinden testnet ödemesi yaparak ajanlardan veri veya analiz hizmeti kiralarlar.
- **Pay-per-License:** Kullanıcılar bir kez lisans alarak ajanı sınırsız veya belirli sürelerle kullanabilirler.

### 2.3. Geliştirici Stüdyosu (Creator Dashboard - `/creator`)
- Yapay Zeka ajanlarını kodlayan veya tasarlayan "Geliştiricilerin" alanıdır.
- Geliştiriciler yeni ajan projeleri yaratır, fiyatlandırmaları belirler.
- On-Chain Registration (Zincir İçi Kayıt): Geliştirici bir ajan oluşturduğunda, bunu doğrudan akıllı sözleşme üzerinde (`registerAgent` fonksiyonuyla) kayıt altına alabilir.
- Ajanlarına DAO'ların veri setlerini "Dataset IDs" olarak bağlayarak ajanın Zeka Kapasitesini (RAG) artırırlar.

### 2.4. Veri Sağlayıcı Portalı (DAO Portal - `/dao`)
- Orijinal verilerini platforma yükleyen DAO'ların özel güvenlikli çalışma alanıdır.
- DAO'lar "Data Provenance" sekmesinden verilerini zincirde kayıt altına alır (`registerDataset`).
- Yüklenen dosyalar şifrelenir ve arka planda güvenle saklanır.

## 3. Akıllı Sözleşme ve Blockchain (EVM - Avalanche)
Solana mimarisinden Avalanche (C-Chain) ağına tam migrasyon sağlanmıştır.

- **Ağ:** Avalanche Fuji Testnet (Chain ID: `43113`)
- **Akıllı Sözleşme:** `BaserootMarketplaceV2.sol` (V2)
- **Sözleşme Adresi:** `0x46A354d117D3fC564EB06749a12E82f8F1289aA8` (Fuji Testnet)
- **Kütüphaneler:** Frontend ve Backend üzerinde Solana paketleri (`@solana/web3.js`, `bs58`) tamamen silinmiş, yerine `wagmi` ve `viem` paketleri entegre edilmiştir.

### 3.1. Temel Fonksiyonlar ve Gelir Modeli
1. **`registerDataset(string datasetId, uint256 pricePerUse)`:** Veri sahibinin varlığını kanıtlaması (Provenance) içindir.
2. **`registerAgent(string agentId, uint256 price, string datasetId)`:** Geliştiricinin ajanını platforma tanıtmasıdır.
3. **`buyLicense(string agentId)`:** Bir tüketici ajan ile konuştuğunda çalışan ödeme fonksiyonudur.
   - **Komisyon Modeli (3 Ayaklı Gelir Dağılımı):** Gönderilen AVAX tutarı akıllı sözleşme (`BaserootMarketplaceV2.sol`) tarafından `buyLicense()` fonksiyonu ile otomatik olarak 3'e bölünür:
    - **%50 DAO (Veri Sağlayıcı):** `daoOwner` hesabına anında aktarılır.
    - **%40 Creator (Ajan Geliştirici):** `creator` hesabına anında aktarılır.
    - **%10 Protocol (Baseroot Hazinesi):** `platformWallet` hesabına aktarılır.
    Bu protokol seviyesinde bir şeffaflık ve adalet sağlar.

## 4. Gizli Veri Çıkarımı – Confidential Inference (Server-Side Isolation & RAG)
Geliştiricilerin DAO verilerini kendi veri tabanlarına çekmesini veya modellerini eğitirken çalmasını engellemek projenin en kilit güvenlik özelliğidir. Sunucu tarafı izolasyon ve katı prompt kuralları ile veri gizliliği sağlanır. *(Not: Kriptografik sıfır bilgi ispatı (ZK Proof) kullanılmamaktadır; veri gizliliği sunucu tarafı güvenlik duvarı ile uygulanır.)*

### 4.1. Sunucu Tarafı Güvenlik Duvarı (Backend Isolation)
Yüklenen veriler asla frontend'e gönderilmez. `server/datasets-router.ts` içerisindeki `list`, `getById` veya `getByOwner` API uçlarında (TRPC) şu kod çalışır:
```typescript
const { dataContent, ...rest } = d;
return rest;
```
Bu kod, veri tabanı objesinden asıl metni (`dataContent`) siler. Böylece geliştirici sadece Dataset'in adını ve fiyatını listelemede görebilir.

### 4.2. Yapay Zeka Konuşması (Inference)
Tüketici, ajana bir soru sorduğunda istek doğrudan Firebase Backend'e (`agent-router.ts`) gider. Backend, geliştiricinin ajana bağladığı `dataset_id`'yi alır ve Firestore veritabanından GİZLİ `dataContent`'i çeker.

### 4.3. Katı Prompt Sınırları (Hard Prompt Constraints)
ChainGPT veya farklı bir LLM API'sine gönderilen Sistem Promptu (`buildPrompt` fonksiyonu) zorunlu olarak şu emri içerir:
> `[ZERO-KNOWLEDGE DATA PRIVACY MODE INITIATED]`
> `CRITICAL INSTRUCTION: You must analyze the proposal below using the research dataset above, but you MUST NOT output, quote, or leak the raw dataset text in your response. The dataset is confidential DAO intellectual property. Only output your derived insights.`

Bu sayede, LLM asıl metni tüketiciye asla iletmez; sadece bu metni okuyup, analizini sunar. DAO'nun veri mahremiyeti sonuna kadar korunur.

## 5. Veri Tabanı İzolasyonu (Firebase Firestore Identifiers)
Solana'dan Avalanche'e geçerken eski geliştirici ve işlem verilerinin sistemleri çökertmesini önlemek için veritabanında "İsim Uzayı" (Namespacing) politikası kullanıldı.

Eski koleksiyonlar (`users`, `agents`, `payments`) geride bırakılıp, bütün sistem `avax_` önekiyle baştan yaratıldı:
- `avax_agents`
- `avax_datasets`
- `avax_payments`
- `avax_users`
- `avax_inferences`



## 6. Frontend Teknolojileri ve UI/UX İyileştirmeleri
- Tüketici güvenini ve modern bir "Siberpunk / Yapay Zeka" hissiyatını yakalamak için UI bileşenlerinde (`shadcn/ui`, `lucide-react`) siyah arkaplanlar üzerine saydam, buzlu cam (Glassmorphism) görünümleri uygulandı.
- Eski, ilkel tarayıcı bildirimleri (`alert()`) yerini sağ alt köşeden akıcı animasyonlarla çıkan `sonner` Toast bildirimlerine bıraktı.
- Testnet olduğunu belirten Dinamik Ağ Uyarısı (`NetworkIndicator`) eklendi. Backend'deki ağ durumu `fuji` olduğunda kullanıcıya Testnet uyarıları verir. Backend'deki TRPC tip hataları (Type mismatch) sıfıra indirgenerek tam type-safe bir Client-Server bağlantısı kuruldu.

## 7. Derleme ve Çalıştırma (Build & Run)
Proje `npm run dev` komutu ile aynı anda Vite Frontend'i ve `tsx` ile Express Backend'i ayağa kaldırır.
Üretime (Production) alınırken:
- `npm run check` komutuyla 0 hatasız (`tsc --noEmit`) derleme kontrolü yapılır.
- Proje modüler yapısından ötürü Backend ayrı bir Docker/Node instance'ı, Frontend ise Vercel gibi bir statik sunucuda barındırılmaya tamamen hazırdır.
