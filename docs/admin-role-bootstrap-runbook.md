# Admin / Creator Rol Kurulumu (Runbook)

Bu doküman, production ortamında **ilk admin kullanıcısını** oluşturma ve sonrasında **admin/creator** rollerini güvenli şekilde yönetme adımlarını içerir.

## Ön Koşullar
- Firebase projesi kurulmuş olmalı
- Backend ortam değişkenleri ayarlanmış olmalı:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_SERVICE_ACCOUNT` (tek satır JSON)
  - `ADMIN_BOOTSTRAP_SECRET` (uzun, tahmin edilemez bir secret)

Öneri: `ADMIN_BOOTSTRAP_SECRET` en az 32 karakter olsun ve yalnızca backend ortamında bulunsun.

## 1) İlk Admin'i Bootstrap ile Atama

### Adım 1 — Hedef kullanıcının UID’sini öğren
- Kullanıcı frontend üzerinden wallet ile giriş yapsın
- Backend Firestore `users/{uid}` dokümanı oluşur
- UID değerini Firestore’dan veya backend logundan alın

### Adım 2 — `admin.setUserRole` çağrısını yap
tRPC endpoint: `admin.setUserRole`

İstek header’larına şunu ekleyin:
- `x-admin-secret: <ADMIN_BOOTSTRAP_SECRET>`

Body:
- `uid`: hedef kullanıcının UID’si
- `role`: `"admin"`

### Adım 3 — Doğrula
- Firestore `users/{uid}.role` = `admin`
- Firebase Auth custom claims: `admin: true`, `creator: true`

> Not: Bootstrap secret sadece ilk kurulum için kullanılmalı. İlk admin atandıktan sonra secret rotasyonu önerilir.

## 2) Normal Rol Yönetimi (Admin ile)

Artık rol atama işlemleri için:
- Caller kullanıcının `users/{callerUid}.role` alanı `admin` olmalı
- Client tarafında role değişimi **rules ile engellenmiştir**; sadece backend endpoint’i ile yapılır.

## 3) Güvenlik Kontrolleri
- Firestore Rules:
  - `users` dokümanında `role` client tarafından değiştirilemez
  - `admin_audit` server-only write, admin read
  - `payments` ve `agent_runs` server-only create
- Rate limit:
  - `admin.setUserRole` çağrısı `admin` rate limitine tabidir

## 4) Olay Kaydı (Audit Log)
Her `admin.setUserRole` işlemi `admin_audit` koleksiyonuna yazılır:
- `action`: `set_user_role`
- `actorUid`, `actorRole`
- `targetUid`
- `metadata.role`
- `ip`, `userAgent`
- `createdAt`

## 5) Secret Rotasyonu (Önerilen)
- İlk admin oluşturulduktan sonra `ADMIN_BOOTSTRAP_SECRET` değerini değiştirin
- Eski secret’ı devre dışı bırakın
