# Baseroot Yol Haritası (Roadmap)
**Merkeziyetsiz Yapay Zeka Ekonomisi İçin Altyapı**

## Temel Vizyon

Baseroot, yapay zeka ajan (AI agent) ekonomisi için merkeziyetsiz bir altyapı inşa ediyor. Amacı, aşağıdakileri sağlayan programlanabilir bir pazar yeri (marketplace) yaratmaktır:
- Veri seti sahiplerinin (DAO'lar vb.) verilerini kaydedip bunlardan gelir elde etmesi,
- Yapay zeka geliştiricilerinin bu veri setleri üzerinde ajanlar inşa edip canlıya alması,
- Son kullanıcıların bu ajanları lisanslayarak kullanabilmesi,
- Ve tüm gelir dağılımının zincir üzerinde (on-chain) otomatik olarak gerçekleştirilmesi.

Temelde Baseroot şu yapıları birbirine bağlar:
**Veri → Yapay Zeka Ajanları → Lisanslama → Gelir**

## 1. Stratejik Ürün Yönü
**Baseroot Gerçekte Neye Dönüşüyor?**

Baseroot sadece bir yapay zeka pazar yeri değildir. Yapay zeka ekonomisinin *altyapı katmanı* olmaya doğru evrilmektedir.

Zamanla Baseroot şunlara dönüşmelidir:
- Bir veri seti kayıt defteri (dataset registry)
- Bir yapay zeka ajanı dağıtım katmanı (deployment layer)
- Programlanabilir bir lisanslama protokolü
- Bir gelir mutabakat/dağıtım temeli (settlement primitive)
- Ve en sonunda bir *Bildi / Veri Likidite Protokolü (knowledge liquidity protocol)*

Bunun anlamı, uzun vadeli ürün yönünün şu olmasıdır:
> **Veriyi yapay zeka için ekonomik bir varlığa, yapay zeka ajanlarını ise programlanabilir dijital işletmelere dönüştürmek.**

---

## 2. Ürün Olgunlaşma Yolu

Baseroot aşamalı bir şekilde büyümelidir.

### Aşama 1 — MVP Temeli (Mevcut Durum)
**Hedef:** Temel ekonomik döngünün çalıştığını kanıtlamak.

**Mevcut MVP'de neler var:**
- Veri seti on-chain kayıt sistemi
- Yapay zeka ajanı deploy (dağıtım) akışı
- Ajan pazar yeri (Agent marketplace)
- Lisanslama mekanizması
- Gelir paylaşımı yapan akıllı kontrat
- Blok zinciri aktivitelerini senkronize eden middleware (ara katman)
- Rol bazlı (DAO/Kullanıcı/Geliştirici) etkileşim için Frontend

**Temel İş Akışı:**
1. Bir DAO veya veri sahibi veri setini kaydeder.
2. Bir yaratıcı (creator) bu veri setine bağlı bir yapay zeka ajanı deploy eder.
3. Bir kullanıcı (consumer) bu ajanı lisanslar.
4. Akıllı kontrat ödemeyi alır ve mutabakatı sağlar.
5. Gelir otomatik olarak bölünür ve dağıtılır.

**Mevcut Ekonomik Model:**
- %50 → Veri seti sahibi / DAO
- %40 → Yapay zeka ajanı yaratıcısı
- %10 → Platform

**Mevcut Teknoloji Yığını:**
- Avalanche Fuji akıllı kontratları
- Node.js (Middleware)
- Firebase / Firestore
- React frontend

**Bu aşama neden önemli:**
Bu aşama Baseroot'un sadece bir fikir olmadığını kanıtlar. Çalışan temel bir yapının (**on-chain mutabakat ile çalışan yapay zeka lisanslaması**) var olduğunu gösterir.

---

### Aşama 2 — Veri Seti Keşif Katmanı
**Hedef:** Veri setlerini sadece yüklenen kayıtlar olmaktan çıkarıp, gerçek bir pazar yerine (marketplace) dönüştürmek.

**Amaçlar:**
- Veri seti kategorileri eklemek
- Arama ve filtreleme özellikleri getirmek
- Doğrulanmış veri seti etiketleri (verified labels) oluşturmak
- Meta veri (metadata) standartları sunmak
- Geliştiriciler için veri setlerinin bulunabilirliğini artırmak

**Kilit Ürün Özellikleri:**
- Kategori sistemi
- Arama ve gezinme arayüzü
- Doğrulanmış (Verified) rozetleri
- Meta veri şablonları
- Lisans şartları, veri kaynağı ve kullanım hakları gibi standart metin alanları

**Geliştirici (Creator) İş Akışı:**
Geliştirici deploy işlemine başlar → Bir kategori seçer → İlgili veri setlerine göz atar → Bir veri setini projesine bağlar → Ajanı canlıya alır (deploy eder).

**Stratejik Etki:**
Bu aşama, veri seti arzı ile ajan yaratma talebi arasındaki ilk gerçek köprüyü kurar. Baseroot'u basit bir kayıt defterinden, gerçek bir veri-ajan pazar yeri (data-to-agent marketplace) katmanına taşır.

---

### Aşama 3 — Veri Seti Farkındalığı Olan Yapay Zeka Ajanları
**Hedef:** Yapay zeka ajanlarını veri setleriyle anlamlı bir şekilde ilişkilendirmek.

**Aşama 3 Neden Önemli:**
Burası, Baseroot'u bir "altyapı" olarak çok daha güçlü hale getiren aşamadır. Şu anki MVP ekonomik döngüyü kanıtlamaktadır. Aşama 3 ise sistemin zekâ katmanının pazar yerinin ötesinde "veri seti farkındalığına" sahip olduğunu göstermelidir.

**Aşama 3'ün Başarması Gerekenler:**
- Her ajan, bir veya birden fazla veri setini açıkça referans göstermelidir.
- Sistem; veri seti ile ajan arasındaki bağımlılığı (dependency) görselleştirmelidir.
- Yaratıcılar, seçtikleri veri setlerinden beslenen (context alan) ajanlar üretebilmelidir.
- Son kullanıcılar, lisanslayacakları ajanın hangi bilgi kaynağı/veri seti üzerine inşa edildiğini anlamalıdır.

**Gerekli Özellikler:**
- Ajan meta veri yapısı (Metadata structure)
- Veri seti bağlantıları (Dataset linking)
- Veri seti odaklı ajan yükleme ekranı (Deployment wizard)
- Bağlı veri setlerini gösteren Ajan Detay Sayfaları

**Örnek Meta Veri (Metadata):**
```json
{
  "agent_id": "123",
  "dataset_id": "456",
  "category": "web3",
  "creator_wallet": "0x...",
  "license_type": "pay-per-license"
}
```

**Stratejik Etki:**
Bu aşama Baseroot'u sadece bir *AI Pazar Yeri* olmaktan çıkarıp *Veri Seti Farkındalığı Olan AI Altyapısına* (Dataset-aware AI infrastructure) dönüştürür. Bu hem jüriler hem de gelecekteki yatırımcılar için protokolün kalıcı mimarisini çok daha netleştirdiği için son derece önemlidir.

---

## 3. Detaylı Aşama 3 (Stage 3) Planı
**Aşama 3'e geçerseniz tam olarak ne inşa etmelisiniz?**

Aşama 3 devasa ve tamamen olgun bir ürün olmaya çalışmamalıdır. Mevcut MVP'yi derinleştirmeli, netleştirmeli ve daha çok bir "altyapı" (infrastructure) gibi konumlandırmalıdır. En iyi strateji şudur:
> Mevcut MVP temelini alın ve Baseroot'un nereye gittiğini gösteren tek bir derinlik katmanı daha ekleyin.

### Aşama 3 Temel Hedefi
**Veri Seti Farkındalığı Olan Ajan Altyapısının (Dataset-aware agent infrastructure)** ilk gerçek versiyonunu inşa etmek.

Bu, Aşama 3'teki sisteminizin şunu göstermesi demektir: Bir yaratıcı veri setlerini bulabilir, birini seçebilir, kendi ajanını bunun üzerine deploy edebilir ve son kullanıcı bu ajanı lisanslamadan önce aradaki lisans/veri ilişkisini şeffaf bir şekilde görebilir. Sadece bu akış bile Baseroot'u muazzam derecede ilgi çekici yapar.

### Aşama 3 Ürün Kapsamı

**A. Veri Seti Keşif Modülü (Dataset Discovery Module)**
Veri setleri için pazar yeri tarzında bir keşif (arama/filtreleme) sistemi kurun.
- **Olmazsa Olmaz Özellikler:** Kategoriler, arama, filtrelemeler, doğrulama (verification) etiketleri, geliştirilmiş veri seti kartları.
- **Odak:* Jüriler, üreticilerin verileri rastgele seçmediğini, görünür ve fonksiyonel bir veri piyasası mantığı olduğunu görmelidir.

**B. Veri-Odaklı Ajan Deploy Etme (Dataset-Aware Agent Deployment)**
Burası, Aşama 3'ün en güçlü ekranı olmalıdır.
- **Önerilen İş Akışı:** Ajan tipini seç → Kategori seç → Uyan veri setlerine göz at → Veri setini seç → Meta veriyi tanımla → Ajanı deploy et.
- **Neyi Kanıtlar:** Baseroot'un yapılandırılmış bilgi girdileri olan bir ajan protoklü (deployment protocol) olduğunu gösterir.

**C. Veri Kontekstine Sahip Ajan Profili**
Her ajanın sayfasında şunlar gösterilmelidir: Bağlı veri seti, veri setinin sahibi (DAO), kategori, lisans bedeli ve otomatik gelir dağılım yüzdeleri.
- **Neden Önemli:** Kullanıcılarda şeffaflık yaratır ve tezin kanıtını sunar: *Bu ajanın doğrulanabilir, ekonomik bir bilgi kaynağı vardır.*

**D. Güçlü Lisanslama Arayüzü (Licensing UX)**
- **Önerilen Eklemeler:** Satın alım öncesi net lisans detayları, paranın kime nasıl gideceğini gösteren basit bir özet (revenue routing), blockchain üzerinde settlement (mutabakat) onayı bildirimleri.
- **Neden Önemli:** Ödeme (Lisanslama) anı, projedeki en güçlü Web3/Blockchain anıdır. Bu sürecin son derece net, güvenli ve "kasıtlı" hissettirmesi gerekir.

**Aşama 3 Demo Hedefi:**
Demo'nuz tek bir net mesaj vermelidir:
> **Baseroot, geliştiricilerin veri setlerini keşfetmesini, bu verilerle entegre (dataset-aware) ajanlar yaratmasını ve bu ajanları şeffaf bir gelir dağılımı sağlayan zincir üstü (on-chain) bir altyapı ile lisanslamasını sağlar.**

---

## 4. Aşama 3 Teknik Plan

### Akıllı Kontrat Katmanı (Smart Contract)
Tüm kontratı baştan yazmaya gerek yoktur. Sadece mevcut mantığı gerektiği noktalarda genişletmelisiniz.
- **Tutulacaklar:** Veri seti kaydı, ajan kaydı, lisans satın alma, 50/40/10 gelir dağılımı.
- **Geliştirilecekler:** Ajan ile Veri Seti (Dataset) arasındaki bağın kontrat düzeyinde daha net (explicit) kurulması, indeksleme işlemleri için kontrattan yayımlanan eventlerin (olayların) daha temiz tasarlanması.

### Ara Katman (Middleware / Node.js + Firebase)
Bu katman Aşama 3'te daha da kritik hale gelecektir.
- **Sorumluluklar:** Ajan ve veri seti on-chain kayıtlarının senkronizasyonu, ajan profilleriyle veri setlerinin ilişkilerinin çözümlenmesi (resolve), blockchain verilerini hızlı ön yükleme işlemleri.
- **Geliştirme:** Temiz bir ilişkilendirme yapısı (`dataset ID`, `agent ID`, `creator`, `owner`, vb.) oluşturularak UI beslenmelidir.

### Frontend Katmanı
Burası, uygulamanın ciddi seviye atladığı yerdir.
- **Öncelikli Ekranlar:** Veri seti pazar yeri (Dataset Marketplace), Deploy (Canlıya alma) arayüzü, Lisans Mutabakat onay akışı.
- **Püf Noktası:** Her şeyi tek bir ekrana doldurmaya çalışmayın. Temiz adımlar, net mantık ve açık bir ekonomik akış, karmakarışık dev menülerden her zaman daha iyi puan alır.

---

## 5. Aşama 3 Teslim Edilecekler (Deliverables)

**Ürünsel Beklentiler:**
- Geliştirilmiş Veri Seti Pazar yeri ve filtreleri
- Veri Seti-Odaklı (Dataset-aware) yeni nesil deploy akışı
- On-chain ödeme süreçlerinin (vizibilitesinin) netleştirilmesi

**Teknik Beklentiler:**
- İlişkilendirilmiş metadata modeli
- Event-driven (olay güdümlü) durum güncellemeleri
- Akıllı kontrat verilerinin (event) daha pürüzsüz indexing entegrasyonu

**Hikaye/Sunum Beklentileri:**
- Temiz, tek cümlelik proje tanımı (One-line primitive)
- Güncellenmiş, net bir "Mimari Şema" (Architecture diagram)
- "Neden Avalanche kullanıyoruz?" sorusunun tok bir cevabı
- 3 veya en fazla 5 dakikalık, takılmayan, kafa karıştırmayan, tek bir hikayesi olan demo videosu.

---

## 6. Jüriler Aşama 3'te Muhtemelen Neyi Görmek İsteyecek?

1. **Bu gerçekten bir altyapı (infrastructure) mı?**
   Evet. Çünkü Baseroot, başka projelerin üstünde inşa edilebileceği modüler yapı taşları sunar.
2. **Blockchain burada olmazsa olmaz mı?**
   Evet. Çünkü gelirin 3 tarafa birden güvene dayalı olmayan (trustless) ve saniyeler içinde anlık olarak (Avalanche hızıyla) dağıtılması sadece Web3 ile mümkündür. Mülkiyet kanıtı zincirdedir.
3. **Gerçek bir ekonomik model var mı?**
   Evet. Veri sahipleri, AI geliştiricileri ve platformun çıkarları tamamen aynı doğrultudadır (Incentive alignment).
4. **Peki MVP sonrası gerçek bir yol haritası var mı?**
   Evet. "Veri kullanımının kanıtlanması (PoDU)", "birlikte çalışabilen ajanlar (composability)" gibi çok derin hedefleri vardır.

---

## 7. Aşama 3 Sonrası Yol Haritası (Gelecek Vizyonu)

### Kademe 4 — Veri Kullanım Kanıtı (Proof of Data Usage - PoDU)
**Amaç:** Bir veri setinin, bir yapay zeka ajanı tarafından *gerçekten* çağrıldığını (kullanıldığını) kanıtlamak. AI ekonomisindeki en büyük güvenlik/güven açığı budur. Bunu başarmak Baseroot için devasa bir rekabet avantajı (moat) olacaktır. TEE (Trusted Execution Environments) veya ZK (Sıfır Bilgi) teknolojileri kullanılabilir.

### Kademe 5 — Birlikte Çalışabilen Ajanlar (Composability)
**Amaç:** Yapay zeka ajanlarının, kendi başlarına diğer ajanları kiralayıp çalıştırabilmesini sağlamak. Örneğin: "Araştırmacı Ajan", işin bir kısmı için "Piyasa Analiz Ajanı"nı kiralayabilir ve geliri paylaşabilir.

### Kademe 6 — Pazar Yeri Genişlemesi (Marketplace Expansion)
**Amaç:** İtibar (Reputation) sistemi, dinamik fiyatlama, abonelik modelleri ve "kullanım başına ödeme" (pay-per-call) sistemlerinin gelmesi.

### Kademe 7 — Merkeziyetsiz İşlem Katmanı (Decentralized Compute Layer)
**Amaç:** Ajanların çalışma (inference) süreçlerinin doğrudan merkeziyetsiz GPU ağlarına (örn: Akash, Render) veya inference node sağlayıcılarına entegre edilmesi.

### Kademe 8 — Veri/Bilgi Likidite Protokolü (Knowledge Liquidity Protocol)
**Amacın Zirvesi:** Bilgiyi programlanabilir, ekonomik bir varlık (asset class) sınıfına sokmak.
Tüm zincir tamamlanmıştır: *Bilgi → Veri Seti → Ajan → Lisanslama → Gelir.*
Baseroot, merkeziyetsiz zeka ekonomisinin temel finans ve işletim katmanı haline gelir.

---

## 8. En Önemli Aşama 3 Konumlandırması (Positioning)

Baseroot'u jüriye sadece "bir uygulama" veya "sıradan bir pazar yeri" gibi anlatmayın. Şöyle sunun:
- Yapay zeka ajanları için **Veri Odaklı Altyapı**
- Yapay zeka sistemleri için **Programlanabilir Lisanslama**
- Yapay zeka ekosistemleri için **On-chain Gelir Mutabakat Katmanı**

**En iyi "Tek Cümlelik" Tanıtım:**
> Baseroot, geliştiricilerin veri setlerini keşfetmesini, bu verilerle entegre (dataset-aware) yapay zeka ajanları deploy etmesini ve tüm süreci on-chain lisanslamasını sağlayan bir protokoldür.

**Biraz daha iddialı hali:**
> Baseroot; veri setlerini, geliştiricileri, ajanları ve programlanabilir lisanslamayı Avalanche ağı üzerinde birbirine bağlayan, merkeziyetsiz yapay zeka ekonomisinin altyapı katmanıdır.

---

## 9. Ekip İçin Aşama 3 Öncelikleri
1. **Ürün Netliği:** Uygulama akışını (UX) yeni giren birinin hiç zorlanmadan anlayacağı kadar basitleştirin.
2. **Veri Seti - Ajan Bağlantısı:** İşlevsel açıdan en kritik güncellemeyi (bir ajanın hangi veriyi kullandığının görünürlüğünü) tamamlayın.
3. **Demo Gücü:** Her şey tek, vurucu ve pürüzsüz bir hikayeyi desteklemelidir.
4. **Gelecek Odaklılık:** Aşama 3'ten sonraki inandırıcı adımı netleştirin (Proof of Data Usage gibi).

---

## 10. Sonuç ve Nihai Vizyon Beyanı
Baseroot bir anda her şey olmaya çalışmamalıdır. Doğru olan yol:
- **Adım 1:** Ekonomik modeli (primitive) kanıtla.
- **Adım 2:** Veri seti ile Ajan arasındaki güçlü / on-chain bağı kanıtla.
- **Adım 3:** Protokolün koca bir AI ekonomisi çapında ölçeklenebileceğini göster.

> **Nihai Vizyon:** Baseroot; veri setlerinin finansal varlıklara, yapay zeka ajanlarının dijital ürünlere ve tüm lisanslama işlemlerinin akıllı blockchain ticaretine dönüştüğü Merkeziyetsiz Yapay Zeka Ekonomisinin temel altyapı katmanını inşa etmektedir.
