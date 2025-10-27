# 🚀 **Quick Deploy to Railway (No CLI Needed!)**

## ✅ **Super Simple Deployment - No CLI Required!**

You don't need to install the Railway CLI. Deploy directly from the web dashboard!

---

## 📋 **Step 1: Create Railway Account**

1. Go to **https://railway.app**
2. Click **"Sign in"**
3. Choose **"Sign up with GitHub"**
4. Authorize Railway to access your repositories

---

## 📋 **Step 2: Create New Project**

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. If your project is on GitHub, select it
4. If not, see **Step 3** below

---

## 📋 **Step 3: Create the OAuth Server (If Not on GitHub Yet)**

### **Option A: Upload Files Directly to Railway**

1. In Railway, click **"New Project"** → **"Empty Project"**
2. Click **"Add Service"** → **"Empty Service"**
3. Railway will create a folder
4. Upload these files:

```bash
# In your project, create this server file:
server/
├── ghl-oauth-server.js    # (See code below)
├── package.json           # (See code below)
├── .env                   # (Add via Railway dashboard)
└── Procfile              # (Railway auto-creates)
```

### **Option B: Use Existing `webhook-server.cjs`**

You already have `webhook-server.cjs`! Let's use that:

1. In Railway dashboard → **New Project**
2. Click **"Empty Project"**
3. Click your project → **"Add Service"**
4. Railway creates a folder
5. Upload `webhook-server.cjs` to Railway

---

## 📋 **Step 4: Configure Environment Variables**

In Railway dashboard → Project Settings → Variables:

Add these:

```
GHL_CLIENT_ID=68fd461dc407410f0f0c0cb1-mh6umpou
GHL_CLIENT_SECRET=a7a79a21-828d-4744-b1a3-c13158773c92
GHL_SHARED_SECRET=0e06d8f4-6eed-4ab7-903e-ff93e5fdd42a
GHL_REDIRECT_URI=https://ghlvoiceai.captureclient.com/auth/callback
PORT=3000
NODE_ENV=production
```

---

## 📋 **Step 5: Deploy Settings**

In Railway → Your Service → Settings:

- **Source:** Upload `webhook-server.cjs`
- **Build Command:** (leave empty, Railway auto-detects Node.js)
- **Start Command:** `node webhook-server.cjs`

---

## 📋 **Step 6: Custom Domain Setup**

### **6.1: Railway URL**
Railway gives you a URL like: `your-project-production.up.railway.app`

### **6.2: Add Custom Domain**
1. In Railway → Service → Settings → **"Custom Domains"**
2. Click **"Add Domain"**
3. Enter: `ghlvoiceai.captureclient.com`
4. Railway shows DNS instructions

### **6.3: Update GoDaddy DNS**
Go to GoDaddy → DNS Management → Add CNAME:

```
Type:     CNAME
Name:     ghlvoiceai
Value:    [What Railway provided] (e.g., your-project-production.up.railway.app)
TTL:      3600
```

Save and wait 5-30 minutes for DNS.

---

## 📋 **Step 7: Update GHL Developer Portal**

1. Go to: https://marketplace.gohighlevel.com/developer
2. Find your app (Client ID: `68fd461dc407410f0f0c0cb1-mh6umpou`)
3. Add redirect URI: `https://ghlvoiceai.captureclient.com/webhooks/ghl`

Wait, actually, your `webhook-server.cjs` already has the callback route!

Check what routes it has:
- `/health` - Health check
- `/webhooks/ghl` - Webhook handler  
- `/oauth/callback` - OAuth callback

---

## ✅ **Step 8: Test**

Once DNS propagates:

1. Health check: `https://ghlvoiceai.captureclient.com/health`
2. Should return: `{"status":"healthy"}`

---

## 🎯 **Alternatively: Use Render.com (Even Easier!)**

If Railway is too complicated:

### **Render.com Steps:**
1. Go to **https://render.com**
2. Sign up (free)
3. Click **"New +"** → **"Web Service"**
4. Connect GitHub or upload files
5. Add environment variables (same as Railway)
6. Click **"Create Web Service"**
7. Wait for deployment
8. Add custom domain: `ghlvoiceai.captureclient.com`
9. Update DNS in GoDaddy

**Render is actually simpler for beginners!** 🚀

---

## 📝 **What Files Do I Need?**

You already have everything:
- ✅ `webhook-server.cjs` - Your server (works for OAuth!)
- ✅ `.env` - Environment variables (add via dashboard)
- ✅ `package.json` - Already has dependencies

Just upload `webhook-server.cjs` and configure it!

---

## 🎉 **Quick Start (Render.com Recommended)**

1. Go to **https://render.com**
2. Create account (free)
3. Click **"New +"** → **"Web Service"**
4. Upload `webhook-server.cjs`
5. Add env vars
6. Deploy!
7. Get URL and point DNS

**That's it!** 🎉

---

## 📞 **Need Help?**

- Railway: https://docs.railway.app/getting-started
- Render: https://render.com/docs
- Check `webhook-server.cjs` line 1 for required dependencies

**You don't need the CLI! Deploy from web dashboard!** ✨

