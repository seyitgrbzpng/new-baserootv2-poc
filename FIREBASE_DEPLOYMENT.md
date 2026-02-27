# Firebase Deployment Guide

## 🎯 Quick Start

Your Firebase project is now fully configured and ready to deploy!

**Project ID:** `baserootio`  
**Status:** ✅ Configured and Ready

---

## 📋 Pre-Deployment Checklist

- [x] Firebase project created (`baserootio`)
- [x] Service account key generated
- [x] Client-side Firebase SDK configured
- [x] Server-side Firebase Admin SDK configured
- [x] Environment variables set
- [x] Firestore Security Rules created
- [x] Firestore Indexes configured
- [ ] Deploy Firestore Rules
- [ ] Deploy Firestore Indexes
- [ ] Deploy to Vercel

---

## 🚀 Step 1: Deploy Firestore Rules and Indexes

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Login to Firebase

```bash
firebase login
```

### Initialize Firebase (if not already done)

```bash
cd /path/to/baseroot-marketplace
firebase init firestore
```

**Select:**
- Use existing project: `baserootio`
- Firestore rules file: `firestore.rules` (already exists)
- Firestore indexes file: `firestore.indexes.json` (already exists)

### Deploy Rules and Indexes

```bash
# Deploy both rules and indexes
firebase deploy --only firestore

# Or deploy separately
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

**Expected Output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/baserootio/overview
```

---

## 🌐 Step 2: Deploy to Vercel

### Option A: Automatic Deployment (Recommended)

If your GitHub repository is connected to Vercel, it will automatically deploy when you push.

**Add Environment Variables in Vercel Dashboard:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add the following:

```bash
FIREBASE_PROJECT_ID=baserootio
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"baserootio","private_key_id":"56ea4c028693ce3c670a58d1bfe55d74659f7548","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/0zqdVCCFDv0J\n3LJHWeUX3IYT4BKvCyJcrSpcqyBU9U823pXJb2EG8oedOX5fZsKly0f8+BTM5tKh\ne9sZfYmrtPq+xd3aU+ly4niVB0o/5o8+6EpCV7WOGy8KGwRaUyL87p/Hlwsot/um\n9D6u3GcqAcZ3OnqoaB6hrCFCL++aYY5WWJbpvP/L3U8lbRSLoFb6osKISTvCM0V6\npV3curUt1tXEAPrUIpmmnMiVXYyCG5LMeqcePIYlEWIqaGL7lFXZgEbT0kGnN0WU\nCql80ynRAOIKNPnjIJ2R5721zi4rpVj9GsYG9c37a+Fi4kbbiTD2fTlCvd8aXn45\ndDbVZ3Y7AgMBAAECggEANm1VjTxIedh13W18PBh6kxmkBVGnm3j6R/duNJrtco2j\n6zqen2f1zMXVyrt8as86XVZfV5yAMl8v1lfRI9tly41vM9/qgb8bVtiBRC+sVpMx\ng7TfFRHT1r1JzIE76/D41XFTboshxGznf0h/3Jd2wgl86WlzUgMw5ch0K1Z0koWr\n3wj5uuAEqVfATT8VGbUntqagJbGBTrA1sbZUodqaiHQ0qSCBS2SW9lBJRSozSgJ\nBob+HQfbBJnOBk5J2/6VFAK9YNMS18/mKwrQXIj21+KZWk8SXj7Hd/4V0Jfa+rfN\n/H5UpCqspOrLe7SOMitMGlC3ZfoFWpUwIiA1ZU/NGQKBgQDsBBM/5/AKM6+Qb6ul\nl3UvGYcz7BE3kOuZ7jpbxuxDMuiINxdx4cCiLWnDvGzQTRTPbuh/PhF38r5MSBrl\nTzkxAFIAp/EXyrIrNnTqS/0ra7PRrHIaadH94lw9ciYgkJIGhzuTQiKxC2/eBxHq\nJLFjqpi+84zjNdKB6PiMva7lrQKBgQDQEUQDTU7PpnL4kLjc5JF1h8UDDNEEGJk9\nTsXlv0iWjUzJlgkJ73vCSQF/pU1x2nRjbaaTz0pD0DVlGT44i2e54h4+aakGk+pj\nXBktGlJ4lMcewRJQVSADHXtQQz972+FhBZ++Y2r0FQoecgwc6EYkT2RPQ4LTN2BR\n9JixMHi4hwKBgQDVPsFdxmR980E3kY5XKce5bKlaYnsT557YEAUuk0c5WC/9kzld\nrgns/ndHYWI3us2Itr7e6OfDptIF/kg+1BvqiE2PRi5xvrTIkoWEhHAU4VUxp0vZ\nTa9sYy/QXOjSF4241EshvGm36YuD4oNvOQQF90fXkBrF2AWBV0vrbh8uaQKBgCs3\nKtU0vWXLwJ14Ea1vm/a5WGYlx1P+d/WP4vKxJDaA6q4EB6SUpTPZTgJhJxC6uunb\n4Hla2KX1HOH+uDmuWsD1Aiscbwr6tfglLOV9ThvVavYsS817oMaE3RPyo8DqDonE\nTUWSCKjhpdRlA7cNV2Q7SS5da1LLcaoUD5Ld6nUJAoGBAJDLZb3g3ytWYhbL/wpp\nJIKK0HHSHFGkD3iyHTFwsiztAC/UomPFx1Aky3jY1Psblv3cHyr43srQ5UJZ7OTN\nCs8Bpvfi9uBL/e8GFffTlOegfKZMnw+u4M5iZiYsQ6FlzJtpndmS7Si0im1I9nOC\n3Vq6YuZsgXapGs6NBzjeup2c\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@baserootio.iam.gserviceaccount.com","client_id":"102212950319901191176","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40baserootio.iam.gserviceaccount.com","universe_domain":"googleapis.com"}

VITE_SOLANA_NETWORK=mainnet-beta
VITE_PLATFORM_WALLET=your-platform-wallet-address
```

**Important:** Make sure to add these as **Production** environment variables.

### Option B: Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🧪 Step 3: Test the Deployment

### 1. Check Firebase Console

```
https://console.firebase.google.com/project/baserootio/firestore
```

Verify:
- ✅ Firestore Database is active
- ✅ Security Rules are deployed
- ✅ Indexes are deployed

### 2. Test the Application

Visit your deployed URL and test:
- [ ] Homepage loads
- [ ] Wallet connection works
- [ ] Agent listing works
- [ ] Payment flow works
- [ ] Creator dashboard works

### 3. Monitor Firestore Usage

```
https://console.firebase.google.com/project/baserootio/usage
```

Check:
- Document reads/writes
- Storage usage
- Active connections

---

## 🔧 Local Development

### Run with Firebase Emulator

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulators
firebase emulators:start
```

### Configure Environment for Emulator

Create `.env.local`:

```bash
FIREBASE_PROJECT_ID=baserootio
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
VITE_USE_FIREBASE_EMULATOR=true
```

### Run Development Server

```bash
pnpm dev
```

---

## 📊 Monitoring and Analytics

### Firebase Console

- **Firestore:** https://console.firebase.google.com/project/baserootio/firestore
- **Authentication:** https://console.firebase.google.com/project/baserootio/authentication
- **Usage:** https://console.firebase.google.com/project/baserootio/usage

### Vercel Dashboard

- **Deployments:** https://vercel.com/dashboard
- **Logs:** Check function logs for errors
- **Analytics:** Monitor performance

---

## 🔒 Security Best Practices

### 1. Firestore Security Rules

Already configured in `firestore.rules`. Key rules:
- Users can only read/write their own data
- Agents are creator-owned
- Payments are immutable
- Admin-only analytics

### 2. Environment Variables

- ✅ Never commit `.env` to Git (already in `.gitignore`)
- ✅ Use Vercel environment variables for production
- ✅ Rotate service account keys periodically

### 3. Rate Limiting

Already implemented in the codebase:
- API rate limiting
- Firestore query limits
- Health check throttling

---

## 🐛 Troubleshooting

### Issue: "Permission denied" errors

**Solution:** Check Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```

### Issue: "Index required" errors

**Solution:** Deploy indexes
```bash
firebase deploy --only firestore:indexes
```

### Issue: Slow queries

**Solution:** 
1. Check Firebase Console for index suggestions
2. Add indexes to `firestore.indexes.json`
3. Deploy: `firebase deploy --only firestore:indexes`

### Issue: Authentication failures

**Solution:**
1. Verify `FIREBASE_SERVICE_ACCOUNT` is correct
2. Check Firebase Console for Auth errors
3. Ensure wallet signature verification is working

---

## 📈 Scaling Considerations

### Firestore Limits

- **Free Tier:**
  - 50K reads/day
  - 20K writes/day
  - 1 GB storage

- **Blaze Plan (Pay-as-you-go):**
  - Unlimited reads/writes
  - $0.06 per 100K reads
  - $0.18 per 100K writes

### Optimization Tips

1. **Use denormalization** to reduce reads
2. **Implement pagination** for large lists
3. **Cache frequently accessed data** on client
4. **Use composite indexes** for complex queries
5. **Monitor usage** in Firebase Console

---

## 🎉 Success Criteria

After deployment, verify:

- [x] Firebase project configured
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Vercel environment variables set
- [ ] Application deployed and running
- [ ] Wallet connection works
- [ ] Payments are processed
- [ ] Creator dashboard loads
- [ ] No console errors
- [ ] Firestore queries are fast (<500ms)

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Vercel Deployment](https://vercel.com/docs)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

---

## 🆘 Support

For issues:
1. Check Firebase Console logs
2. Check Vercel function logs
3. Review `FIREBASE_MIGRATION.md` for details
4. Open an issue on GitHub

---

**Deployment Status:** ✅ Ready to Deploy  
**Last Updated:** January 15, 2026
