# Baseroot Katkıda Bulunma Kılavuzu (Contributing Guidelines)

Baseroot V2 geliştirme ekibine hoş geldin! Bu doküman, temiz, sürdürülebilir ve anlaşılır bir kod tabanı (codebase) yaratmamız için izlememiz gereken kuralları belirler.

## 1. Git İş Akışı (Git Workflow)

Projede çevik geliştirme stratejisi benimsenmiştir. Ana branch'ler şunlardır:
- `main`: Üretim (Production). Canlı ortama denk gelir. Asla doğrudan `commit` atılmaz.
- `dev` (opsiyonel): Test ve QA süreçleri için. (Gelecekte ihtiyaç olursa).

### Branch İsimlendirme Formatı
Lütfen her yeni iş veya hata düzeltmesi (bugfix) için branch açın.
- `feat/feature-adi` (Örn: `feat/add-wallet-connect`)
- `fix/hata-adi` (Örn: `fix/payment-contract-error`)
- `refactor/temizlik-adi` (Örn: `refactor/remove-solana-deps`)
- `docs/doc-adi` (Örn: `docs/update-readme`)

## 2. Commit Mesajları (Conventional Commits)

Commit geçmişini temiz tutmak ve gelecekteki otomatik sürümleri (changelog'ları) takip edebilmek için *Conventional Commits* kuralına uyuyoruz. Türkçe veya İngilizce mesaj atılabilir.

**Yapı:**
`<tip>: <kısa açıklama>`

**Tipler:**
- `feat:` Yeni bir özellik eklendiğinde.
- `fix:` Bir hata çözüldüğünde.
- `chore:` Ortam dosyaları, paket kurulumları gibi küçük değişikliklerde.
- `docs:` Dokümantasyon yeniliklerinde.
- `style:` Code formatlama, boşluk silme, noktalı virgül ekleme işlerinde.
- `refactor:` Mevcut kodu düzeltip optimize etme amaçlı, davranış değiştirmeyen işlerde.

**Örnek:**
`feat: Add Avalanche Fuji support to wagmi config`

## 3. Kod Standartları & Pull Request (PR)

### PR (Pull Request) Açma Süreci
1. İşinizi `feat/` veya `fix/` dalınızda tamamlayın.
2. Açtığınız dalda yerel makinenizde TypeScript testlerini yapın: `pnpm check`.
3. Biçimlendirme kontrolleri için `pnpm format` çalıştırın.
4. Sıfır hata aldığınıza emin olduktan sonra PR açın.
5. Bir başka Core ekip arkadaşınızın `Approve` etmesini bekleyin.

### PR Şablonu (Gelecekte Eklenecek)
PR açıklamanıza lütfen neleri değiştirdiğinizi açık bir dil ile yazınız (Örn: "Firebase koleksiyon isimlerindeki çakışmalar düzeltildi.").

## 4. UI/UX Konvansiyonları (Frontend)

- **Shadcn UI:** Tüm bileşenler `components/ui` dizininde mevcuttur. Dışarıdan ekstra framework (MUI, Chakra vb.) KESİNLİKLE yüklenmeyecektir.
- **Tailwind:** Global CSS kullanmak yerine Utility-Class mantığını tam uyguluyoruz. Renk paleti olarak siyah-kehribar (amber) konsepti korunmalıdır. `className="bg-background/95 backdrop-blur"` (Glassmorphism) pencereler için zorunludur.

## 5. Güvenlik Notları (Backend)
- Geliştirici Tarafına ASLA DAO kaynak kodlarını ya da dataset verisini göndermeyin (`dataContent` exclude edilmelidir, detaylar için `ARCHITECTURE_OVERVIEW.md` 'ye bakınız).
- Akıllı sözleşme (Solidity) güncellemelerinde **kesinlikle** Audit raporu olmadan ana ağa (Mainnet'e) çıkmayacağız.
