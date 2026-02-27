# Vercel Deployment Rehberi - Baseroot Marketplace

## MongoDB Atlas Kurulumu

### 1. MongoDB Atlas Network Access Ayarları

MongoDB Atlas Dashboard'a gidin:
1. Sol menüden **Network Access** seçin
2. **Add IP Address** butonuna tıklayın
3. **Allow Access from Anywhere** seçeneğini seçin (0.0.0.0/0)
4. **Confirm** butonuna tıklayın

> **Önemli:** Vercel serverless fonksiyonları dinamik IP kullandığı için tüm IP'lere izin vermeniz gerekir. Bu production ortamları için standart bir uygulamadır.

### 2. MongoDB Atlas Database User

1. Sol menüden **Database Access** seçin
2. **Add New Database User** butonuna tıklayın
3. Authentication Method: **Password**
4. Kullanıcı adı ve güçlü bir şifre oluşturun
5. Database User Privileges: **Read and write to any database**
6. **Add User** butonuna tıklayın

> **Not:** Şifrenizde özel karakterler varsa (örn: @, #, $), bunları URL encode etmeniz gerekir.

### 3. Connection String Alma

1. Sol menüden **Database** seçin
2. Cluster'ınızın yanındaki **Connect** butonuna tıklayın
3. **Connect your application** seçeneğini seçin
4. Driver: **Node.js**, Version: **5.5 or later**
5. Connection string'i kopyalayın:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. `<username>` ve `<password>` kısımlarını kendi bilgilerinizle değiştirin

## Vercel Environment Variables

### Vercel Dashboard'da Ayarlama

1. [Vercel Dashboard](https://vercel.com/dashboard)'a gidin
2. Projenizi seçin
3. **Settings** → **Environment Variables** sekmesine gidin
4. Aşağıdaki değişkenleri ekleyin:

#### Gerekli Environment Variables

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `MONGODB_URL` | `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=baseroot-marketplace` | Production, Preview, Development |
| `MONGODB_DB_NAME` | `baseroot_marketplace` | Production, Preview, Development |

> **Önemli:** Her environment variable için **Production**, **Preview** ve **Development** ortamlarının hepsini seçin.

### Connection String Formatı

Doğru format:
```
mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority&appName=baseroot-marketplace
```

Yanlış formatlar:
- ❌ `mongodb://` (srv eksik)
- ❌ `mongodb+srv://cluster0.abc123.mongodb.net/` (kullanıcı adı/şifre eksik)
- ❌ `mongodb+srv://myuser:my@pass@cluster0...` (şifrede özel karakter encode edilmemiş)

### Özel Karakterlerin URL Encode Edilmesi

Eğer şifrenizde özel karakterler varsa, bunları encode edin:

| Karakter | Encoded |
|----------|---------|
| @ | %40 |
| : | %3A |
| / | %2F |
| ? | %3F |
| # | %23 |
| [ | %5B |
| ] | %5D |
| $ | %24 |
| & | %26 |
| + | %2B |
| , | %2C |
| ; | %3B |
| = | %3D |
| % | %25 |

Örnek:
- Şifre: `my@pass#123`
- Encoded: `my%40pass%23123`

## Deployment Sonrası Kontrol

### 1. Vercel Logs İnceleme

1. Vercel Dashboard → Projeniz → **Deployments**
2. Son deployment'a tıklayın
3. **Runtime Logs** sekmesine gidin
4. Aşağıdaki logları arayın:

✅ Başarılı bağlantı:
```
[MongoDB] Attempting to connect...
[MongoDB] Database name: baseroot_marketplace
[MongoDB] Successfully connected to baseroot_marketplace
[MongoDB] Indexes created
[Server] MongoDB connected successfully
[MongoDB] Checking if agents need to be seeded...
[MongoDB] Current agent count: 0
[MongoDB] Seeding mock agents...
[MongoDB] Seeded agent: Research Assistant Pro
...
[MongoDB] Successfully seeded 6 mock agents
[Server] Database initialization complete
```

❌ Başarısız bağlantı:
```
[MongoDB] MONGODB_URL environment variable is not set!
```
veya
```
[MongoDB] Connection failed: MongoServerSelectionError
```

### 2. Web Sitesini Test Etme

1. Vercel deployment URL'inizi açın (örn: `https://your-project.vercel.app`)
2. Ana sayfada agent listesinin görünüp görünmediğini kontrol edin
3. Eğer boş liste görüyorsanız:
   - Browser Console'u açın (F12)
   - Network sekmesinde `/api/trpc/agents.list` isteğini kontrol edin
   - Response'u inceleyin

### 3. Manuel Test API Çağrısı

Browser console'da:
```javascript
fetch('/api/trpc/agents.list')
  .then(r => r.json())
  .then(console.log)
```

Beklenen sonuç:
```json
{
  "result": {
    "data": [
      {
        "_id": "...",
        "name": "Research Assistant Pro",
        ...
      }
    ]
  }
}
```

## Yaygın Sorunlar ve Çözümleri

### Sorun 1: "MONGODB_URL environment variable is not set"

**Çözüm:**
- Vercel Dashboard → Settings → Environment Variables
- `MONGODB_URL` değişkenini ekleyin
- **Redeploy** yapın (Deployments → ... → Redeploy)

### Sorun 2: "MongoServerSelectionError: connection timeout"

**Çözüm:**
- MongoDB Atlas → Network Access
- 0.0.0.0/0 IP adresinin ekli olduğundan emin olun
- Birkaç dakika bekleyin (değişikliğin yayılması için)
- Vercel'de redeploy yapın

### Sorun 3: "Authentication failed"

**Çözüm:**
- MongoDB Atlas → Database Access
- Kullanıcının "Read and write to any database" yetkisi olduğundan emin olun
- Şifrede özel karakterler varsa URL encode edin
- Connection string'i tekrar kopyalayıp Vercel'e yapıştırın

### Sorun 4: "Agents already seeded" ama liste boş

**Çözüm:**
- MongoDB Atlas → Database → Browse Collections
- `baseroot_marketplace` database'ini seçin
- `agents` collection'ını kontrol edin
- Eğer boşsa, collection'ı silin ve redeploy yapın (seed tekrar çalışacak)

### Sorun 5: Vercel'de environment variable değişikliği yaptım ama çalışmıyor

**Çözüm:**
- Environment variable değişiklikleri sadece **yeni deployment'larda** aktif olur
- Mutlaka **Redeploy** yapın:
  - Deployments → Son deployment → ... (üç nokta) → Redeploy

## Güvenlik Notları

### Production Ortamı İçin Öneriler

1. **IP Whitelist:** Mümkünse Vercel'in IP aralıklarını kullanın (0.0.0.0/0 yerine)
2. **Database User:** Production için ayrı bir read-only user oluşturun (admin işlemleri için)
3. **Connection Pooling:** MongoDB driver otomatik olarak connection pooling yapar
4. **Monitoring:** MongoDB Atlas'ta alertler kurun (connection spikes, slow queries)

### Environment Variables Yedekleme

Vercel CLI ile environment variables'ı export edebilirsiniz:
```bash
vercel env pull .env.local
```

## Ek Kaynaklar

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [MongoDB Connection String Format](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)

## Destek

Sorun yaşamaya devam ederseniz:
1. Vercel Runtime Logs'u tam olarak kopyalayın
2. MongoDB Atlas'ta "Current Connections" sayısını kontrol edin (Database → Metrics)
3. Browser Network sekmesinde API response'larını inceleyin
