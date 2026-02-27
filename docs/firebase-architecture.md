# Firebase Mimari Notları (Baseroot Marketplace)

## Kimlik Doğrulama Akışı (Wallet -> Firebase -> API)

1. Kullanıcı Solana cüzdanını bağlar.
2. Client, backend'den imzalanacak bir mesaj ister (nonce + timestamp içerir).
3. Kullanıcı mesajı cüzdanıyla imzalar.
4. Client, imzayı backend'e gönderir.
5. Backend imzayı doğrular ve kullanıcı için **Firebase Custom Token** üretir.
6. Client `signInWithCustomToken()` ile Firebase Auth oturumu açar.
7. Firebase, kullanıcı için **ID Token** üretir ve periyodik olarak yeniler.
8. Client, her tRPC isteğine şu header'ı ekler:
   - `Authorization: Bearer <firebase_id_token>`
9. Backend, Firebase Admin SDK ile ID Token doğrular ve `ctx.user` üretir.
10. Korumalı endpoint'ler `ctx.user` ve rol kontrolleri ile çalışır.

## Token Yaşam Döngüsü
- ID Token kısa ömürlüdür ve Firebase tarafından otomatik yenilenir.
- Client tarafında `onIdTokenChanged` dinlenerek token güncellemeleri yakalanır.
- tRPC request header'ı her çağrıda güncel token ile set edilir.

## Güvenlik Varsayımları
- Kritik yazımlar (payments, agent_runs, notifications, subscriptions) **client tarafından** Firestore Rules ile engellenir.
- Bu koleksiyonlara yazım **sadece backend Admin SDK** ile yapılır (Admin SDK rules bypass eder).
- Kullanıcı rollerinin (`admin`, `creator`) client tarafından değiştirilememesi için `users/{uid}` update'leri alan bazlı kısıtlanır.
