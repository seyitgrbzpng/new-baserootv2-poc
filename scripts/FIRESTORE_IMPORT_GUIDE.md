# 🔥 Firebase Firestore'a DeSci Agent'ları Manuel Ekleme Rehberi

## 📋 Adım 1: Firestore Console'a Git

1. Firebase Console'u açın: https://console.firebase.google.com/project/baserootio/firestore
2. Sol menüden **Firestore Database** seçin
3. Eğer database henüz oluşturulmadıysa, **Create database** butonuna tıklayın
   - **Production mode** seçin (security rules zaten hazır)
   - **Location** seçin (örn: `us-central1` veya size yakın bir bölge)
   - **Enable** butonuna tıklayın

## 📦 Adım 2: Agents Collection'ını Oluştur

1. Firestore Database ana sayfasında **Start collection** butonuna tıklayın
2. **Collection ID** olarak `agents` yazın
3. **Next** butonuna tıklayın

## 🤖 Adım 3: İlk Agent'ı Ekle

Her agent için aşağıdaki adımları tekrarlayın:

### Agent 1: Research Paper Analyzer

**Document ID:** Auto-ID (otomatik oluştur)

**Fields:**

| Field Name | Type | Value |
|------------|------|-------|
| `name` | string | `Research Paper Analyzer` |
| `description` | string | `Advanced AI agent that analyzes scientific papers, extracts key findings, identifies methodology gaps, and suggests improvements. Supports all major scientific disciplines and formats (PDF, LaTeX, Word).` |
| `category` | string | `Research Analysis` |
| `price` | number | `1.2` |
| `currency` | string | `SOL` |
| `endpointUrl` | string | `https://api.baseroot.io/research-analyzer` |
| `creatorWallet` | string | `DeSci1Creator123456789ABC` |
| `creatorName` | string | `ScienceDAO` |
| `imageUrl` | string | `https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400` |
| `tags` | array | `["research", "analysis", "papers", "peer-review", "desci"]` |
| `status` | string | `active` |
| `rating` | number | `4.9` |
| `ratingCount` | number | `287` |
| `totalUses` | number | `4560` |
| `successRate` | number | `98.7` |
| `featured` | boolean | `true` |
| `verified` | boolean | `true` |
| `createdAt` | timestamp | **Click "Set to current time"** |
| `updatedAt` | timestamp | **Click "Set to current time"** |

**Save** butonuna tıklayın.

---

### Agent 2: Experimental Data Validator

**Document ID:** Auto-ID

**Fields:**

| Field Name | Type | Value |
|------------|------|-------|
| `name` | string | `Experimental Data Validator` |
| `description` | string | `Validates experimental data for reproducibility, statistical significance, and methodological soundness. Detects anomalies, outliers, and potential data manipulation. Essential for maintaining scientific integrity.` |
| `category` | string | `Data Science` |
| `price` | number | `1.5` |
| `currency` | string | `SOL` |
| `endpointUrl` | string | `https://api.baseroot.io/data-validator` |
| `creatorWallet` | string | `DeSci2Creator123456789ABC` |
| `creatorName` | string | `DataIntegrity Labs` |
| `imageUrl` | string | `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400` |
| `tags` | array | `["data", "validation", "reproducibility", "statistics", "desci"]` |
| `status` | string | `active` |
| `rating` | number | `4.8` |
| `ratingCount` | number | `198` |
| `totalUses` | number | `3210` |
| `successRate` | number | `97.9` |
| `featured` | boolean | `true` |
| `verified` | boolean | `true` |
| `createdAt` | timestamp | **Set to current time** |
| `updatedAt` | timestamp | **Set to current time** |

---

### Agent 3: Peer Review Assistant

**Document ID:** Auto-ID

**Fields:**

| Field Name | Type | Value |
|------------|------|-------|
| `name` | string | `Peer Review Assistant` |
| `description` | string | `AI-powered peer review agent that provides comprehensive feedback on manuscripts, checks citations, evaluates methodology, and suggests revisions. Trained on millions of peer-reviewed papers.` |
| `category` | string | `Peer Review` |
| `price` | number | `2.0` |
| `currency` | string | `SOL` |
| `endpointUrl` | string | `https://api.baseroot.io/peer-review` |
| `creatorWallet` | string | `DeSci3Creator123456789ABC` |
| `creatorName` | string | `ReviewChain` |
| `imageUrl` | string | `https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400` |
| `tags` | array | `["peer-review", "manuscript", "feedback", "academic", "desci"]` |
| `status` | string | `active` |
| `rating` | number | `4.9` |
| `ratingCount` | number | `342` |
| `totalUses` | number | `5890` |
| `successRate` | number | `99.1` |
| `featured` | boolean | `true` |
| `verified` | boolean | `true` |
| `createdAt` | timestamp | **Set to current time** |
| `updatedAt` | timestamp | **Set to current time** |

---

## 💡 Hızlı Ekleme İpuçları

### Array (Dizi) Ekleme:
1. **Type** dropdown'dan `array` seçin
2. **Add item** butonuna tıklayın
3. Her tag için bir item ekleyin (örn: `research`, `analysis`, vb.)

### Timestamp Ekleme:
1. **Type** dropdown'dan `timestamp` seçin
2. **Set to current time** linkine tıklayın (otomatik şu anki zamanı ekler)

### Boolean Ekleme:
1. **Type** dropdown'dan `boolean` seçin
2. `true` veya `false` seçin

---

## 📄 Tüm Agent Listesi

Yukarıdaki formatı kullanarak şu agent'ları da ekleyin:

4. **Literature Discovery Engine** (Research Discovery)
5. **Hypothesis Generator** (Research Planning)
6. **Grant Proposal Writer** (Funding)
7. **Clinical Trial Optimizer** (Clinical Research)
8. **Protein Structure Predictor** (Computational Biology)
9. **Open Data Curator** (Data Management)
10. **Citation Network Analyzer** (Bibliometrics)
11. **Reproducibility Checker** (Research Integrity)
12. **Scientific Figure Generator** (Visualization)
13. **Blockchain Lab Notebook** (Lab Management)
14. **Preprint Reviewer** (Peer Review)
15. **Research Collaboration Matcher** (Networking)

**Detaylı bilgiler için:** `desci-agents.json` dosyasına bakın.

---

## ✅ Doğrulama

Agent'ları ekledikten sonra:

1. Firestore Console'da `agents` collection'ına gidin
2. Eklenen agent'ları görebilmelisiniz
3. Herhangi bir agent'a tıklayıp field'ları kontrol edin

---

## 🚀 Sonraki Adım

Agent'ları ekledikten sonra, Vercel deployment'ınız bu verileri otomatik olarak çekecek ve marketplace'de gösterecektir!

**Not:** `creatorUid` field'ını şimdilik eklemeyin. Bu, kullanıcılar wallet'larını bağladığında otomatik olarak oluşturulacak.
