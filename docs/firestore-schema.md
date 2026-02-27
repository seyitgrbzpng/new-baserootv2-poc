# Firestore Şema Taslağı

Bu doküman, projenin Firestore koleksiyonlarını ve temel alanlarını özetler.

## users/{uid}
- displayName (string)
- photoURL (string)
- bio (string)
- website (string)
- twitter (string)
- telegram (string)
- role (string: user|creator|admin) **(backend tarafından yönetilir)**
- createdAt (timestamp)
- updatedAt (timestamp)
- lastSignedIn (timestamp)
- walletAddress (string) (opsiyonel)

## agents/{agentId}
- creatorUid (string)
- title (string)
- description (string)
- category (string)
- status (string: active|draft|archived)
- pricing (object)
- rating (number)
- createdAt (timestamp)
- updatedAt (timestamp)

## agent_versions/{versionId}
- agentId (string)
- version (number|string)
- changelog (string)
- status (string: published|draft)
- createdAt (timestamp)
- updatedAt (timestamp)

## agent_runs/{runId} (server-only writes)
- userUid (string)
- agentId (string)
- agentVersionId (string)
- input (object|string)
- output (object|string)
- status (string)
- createdAt (timestamp)

## payments/{paymentId} (server-only writes)
- fromUid (string)
- toUid (string)
- agentId (string)
- amount (number)
- currency (string)
- txSignature (string)
- createdAt (timestamp)

## reviews/{reviewId}
- userUid (string)
- agentId (string)
- rating (number)
- comment (string)
- createdAt (timestamp)
- updatedAt (timestamp)

## favorites/{favoriteId}
- userUid (string)
- agentId (string)
- createdAt (timestamp)
