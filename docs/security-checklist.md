# Güvenlik Checklist

## Kapsanan Riskler
- **Privilege escalation:** Kullanıcıların `users.role` alanını güncelleyerek admin/creator olmasının engellenmesi (rules: alan bazlı update).
- **Client-side payment/run creation:** `payments` ve `agent_runs` koleksiyonlarında client create/update/delete tamamen kapalı (rules).
- **Data leakage:** Payments ve agent_runs okuma kuralları sadece ilgili taraflara (from/to/creator/admin) izin verir.
- **Immutable records:** Payments ve agent_runs immutable; update/delete kapalı.
- **Notification integrity:** Notifications create server-only; kullanıcı sadece `read/readAt` alanlarını değiştirebilir.

## Kontrol Edilecek Konular (Deploy Öncesi)
- Firebase Emulator ile rules testleri (okuma/yazma senaryoları)
- Admin/creator rol ataması sadece backend üzerinden yapılmalı
- Wallet login için nonce/timestamp kontrolü (replay azaltma)
- Rate limit / abuse koruması (API gateway veya server middleware)

## Bilinen Sınırlamalar
- Firebase rules, zincir üzeri (Avalanche) transaction doğrulamasını yapmaz; bu doğrulama backend tarafında yapılmalıdır.
- Public read açık koleksiyonlarda (agents, reviews, agent_versions) hassas veri tutulmamalıdır.

## Rol Atama (Admin / Creator)
- Rol ataması için server tarafında `admin.setUserRole` endpoint'i kullanılır.
- İlk admin kurulumu için `ADMIN_BOOTSTRAP_SECRET` tanımlanır ve istek başlığına `x-admin-secret` eklenir.
- Bootstrap sonrası, günlük kullanımda sadece `role=admin` kullanıcılar rol değiştirebilir.


## Admin işlemleri için audit log
- `admin.setUserRole` gibi ayrıcalıklı işlemler `admin_audit` koleksiyonuna kaydedilir.
- Audit log: actorUid/role, targetUid, ip, userAgent, createdAt.


## CI / Otomatik doğrulama
- GitHub Actions workflow (`.github/workflows/ci.yml`) her PR/push için Firestore rules testlerini çalıştırır.
