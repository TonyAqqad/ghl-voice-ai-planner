# 🎯 **Domain Setup Summary - Production Deployment**

## 📋 **Your Domain Architecture**

You own multiple domains. Here's the recommended setup:

```
app.captureclient.com       → Production GHL App (Frontend)
ghlvoiceai.captureclient.com → OAuth Test API (Backend API)
```

## ✅ **What We Updated**

### **1. Environment Variables (`.env`)**
```env
# OAuth API endpoint
GHL_REDIRECT_URI=https://ghlvoiceai.captureclient.com/auth/callback

# Production frontend
FRONTEND_URL=https://app.captureclient.com
```

### **2. GHL API Client (`src/utils/ghlApi.ts`)**
Updated to use OAuth API at `ghlvoiceai.captureclient.com`:
```typescript
const oauthApiUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/auth/ghl'
  : 'https://ghlvoiceai.captureclient.com/auth/ghl';
```

### **3. Deployment Configuration**
- ✅ OAuth flow points to new subdomain
- ✅ Local development still works (`localhost:3001`)
- ✅ Production will use `ghlvoiceai.captureclient.com`

## 🚀 **Next Steps**

### **Step 1: Deploy OAuth API to Railway**
1. Follow `PRODUCTION_DEPLOYMENT.md`
2. Deploy OAuth server to Railway
3. Get Railway URL

### **Step 2: Point DNS**
Add CNAME in GoDaddy:
```
Type:     CNAME
Name:     ghlvoiceai
Value:    your-railway-url.railway.app
TTL:      3600
```

### **Step 3: Update GHL Settings**
In GHL Developer Portal:
- Add redirect URI: `https://ghlvoiceai.captureclient.com/auth/callback`

### **Step 4: Test**
1. Visit: `https://ghlvoiceai.captureclient.com/auth/ghl`
2. Should redirect to GHL OAuth
3. Complete flow
4. Check Railway logs for tokens

## 📊 **Current Status**

- ✅ **Code Updated** - OAuth points to new subdomain
- ✅ **Environment Configured** - `.env` updated
- ⏳ **Waiting for Deployment** - Need to deploy to Railway
- ⏳ **Waiting for DNS** - Point `ghlvoiceai` subdomain
- ⏳ **Waiting for GHL Update** - Add redirect URI in GHL

## 🎯 **Domain Strategy**

```
┌─────────────────────────────────────────────┐
│  ghlvoiceai.captureclient.com                │
│  → OAuth API (Railway)                      │
│  → Handles /auth/ghl and /auth/callback    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  app.captureclient.com                       │
│  → Frontend App                             │
│  → Your GHL Voice AI Planner                │
└─────────────────────────────────────────────┘
```

## ✅ **Benefits**

1. **Separation of Concerns** - API separate from frontend
2. **Testing Environment** - OAuth on subdomain, production app separate
3. **Easy Management** - Clear domain structure
4. **Scalable** - Can add more subdomains later

## 📝 **Deployment Checklist**

Follow this order:
- [ ] Deploy OAuth API to Railway
- [ ] Get Railway URL
- [ ] Point `ghlvoiceai` DNS to Railway
- [ ] Wait for DNS propagation (5-30 min)
- [ ] Update GHL redirect URI
- [ ] Test OAuth flow
- [ ] Deploy frontend to Vercel/Netlify on `app.captureclient.com`

## 🎉 **Ready to Deploy!**

Your code is configured and ready. Just need to:
1. Deploy to Railway (follow guide)
2. Point DNS
3. Test OAuth flow

---

**See `PRODUCTION_DEPLOYMENT.md` for detailed deployment steps!** 🚀
