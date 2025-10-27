# 🚀 **Deploy GHL Voice AI Planner from GitHub Codespaces**

## ✅ **You're in GitHub Codespaces!**

Your code is already on GitHub! Now let's deploy it to Render.

---

## 📝 **Step 1: Go to Render**

1. Open **https://render.com** in a new browser tab
2. Sign up or log in
3. Click **"New +"** → **"Web Service"**

---

## 📝 **Step 2: Connect Your Repository**

1. Click **"Connect GitHub"** or **"Public Git repository"**
2. Authorize Render to access your repositories
3. Search for: **`ghl-voice-ai-planner`**
4. Click **"Connect"**

---

## 📝 **Step 3: Configure Your Service**

### **Basic Settings:**
```
Name:          ghl-oauth-api
Region:        Oregon (or your preferred region)
Branch:        main
Root Directory: server
Environment:   Node
Build Command: cd server && npm install
Start Command: node ghl-express-api.js
```

### **Important:** 
- Set **Root Directory** to `server` (where your OAuth server is)
- OR manually upload just the files you need

---

## 📝 **Step 4: Add Environment Variables**

Click **"Environment"** tab and add:

```
GHL_CLIENT_ID=68fd461dc407410f0f0c0cb1-mh6umpou
GHL_CLIENT_SECRET=a7a79a21-828d-4744-b1a3-c13158773c92
GHL_SHARED_SECRET=0e06d8f4-6eed-4ab7-903e-ff93e5fdd42a
GHL_REDIRECT_URI=https://ghlvoiceai.captureclient.com/auth/callback
PORT=10000
NODE_ENV=production
```

---

## 📝 **Step 5: Deploy**

1. Click **"Create Web Service"**
2. Render starts building (2-5 minutes)
3. Wait for **"Live"** status
4. You'll get URL like: `ghl-oauth-api-123.onrender.com`

---

## 📝 **Step 6: Add Custom Domain**

1. In Render → Service → **"Settings"**
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter: `ghlvoiceai.captureclient.com`
5. Render gives you DNS instructions

---

## 📝 **Step 7: Update GoDaddy DNS**

Go to **GoDaddy** → **DNS Management** → Add CNAME:

```
Type:     CNAME
Name:     ghlvoiceai
Value:    [What Render provided] (e.g., lb.omar.onrender.com)
TTL:      3600
```

Save and wait 5-30 minutes.

---

## 📝 **Step 8: Update GHL Settings**

1. Go to: **https://marketplace.gohighlevel.com/developer**
2. Find your app (Client ID: `68fd461dc407410f0f0c0cb1-mh6umpou`)
3. Add redirect URI: `https://ghlvoiceai.captureclient.com/auth/callback`
4. Save

---

## ✅ **Step 9: Test!**

Once DNS propagates (5-30 min):

### **Health Check:**
Visit: `https://ghlvoiceai.captureclient.com/health`

Should return:
```json
{
  "status": "healthy",
  "service": "GHL OAuth API",
  "env": "production"
}
```

### **OAuth Test:**
Visit: `https://ghlvoiceai.captureclient.com/auth/ghl`

Should redirect to GHL authorization! 🎉

---

## 🔧 **Alternative: Deploy to Railway**

If Render doesn't work:

### **1. Go to Railway:**
https://railway.app

### **2. New Project:**
- Click **"New Project"**
- **"Deploy from GitHub repo"**
- Find `ghl-voice-ai-planner`

### **3. Settings:**
- Root Directory: `server`
- Start Command: `node ghl-express-api.js`

### **4. Environment Variables:**
Same as above!

### **5. Custom Domain:**
In Railway → Add custom domain → `ghlvoiceai.captureclient.com`

---

## 🎯 **Quick Reference**

**Your Domains:**
- `app.captureclient.com` → Your GHL App
- `ghlvoiceai.captureclient.com` → OAuth API (what you're deploying)

**Render/Railway:**
- OAuth API endpoint
- Handles `/auth/ghl` and `/auth/callback`
- Returns tokens

**What Happens:**
1. User clicks "Connect" in your app
2. Goes to `ghlvoiceai.captureclient.com/auth/ghl`
3. Redirects to GHL OAuth
4. GHL redirects back to `ghlvoiceai.captureclient.com/auth/callback`
5. API receives tokens
6. Success! ✅

---

## 📞 **Need Help?**

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **Check DNS:** https://dnschecker.org (search `ghlvoiceai.captureclient.com`)

---

## 🎉 **You're Almost Done!**

Once deployed:
1. ✅ OAuth API live at `ghlvoiceai.captureclient.com`
2. ✅ Health check works
3. ✅ OAuth flow completes
4. ✅ Tokens received

**Go to Render.com now and deploy!** 🚀
