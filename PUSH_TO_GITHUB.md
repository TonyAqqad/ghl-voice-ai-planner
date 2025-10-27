# 🚀 **Push to GitHub & Deploy to Render**

## ✅ **Git is Ready!**

Your project is now committed. Next steps:

## 📝 **Step 1: Create GitHub Repository**

1. Go to **https://github.com**
2. Click **"New repository"** (plus icon → **"New repository"**)
3. Name: `ghl-voice-ai-planner`
4. Description: "GHL Voice AI Planner with OAuth integration"
5. Click **"Create repository"** (don't initialize with README)

## 📝 **Step 2: Push to GitHub**

Copy the commands shown after creating the repo, or run:

```bash
cd "C:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"

# Add your GitHub repo as remote
git remote add origin https://github.com/YOUR-USERNAME/ghl-voice-ai-planner.git

# Push to GitHub
git push -u origin master
```

Replace `YOUR-USERNAME` with your actual GitHub username.

## 📝 **Step 3: Deploy to Render**

1. Go to **https://render.com**
2. Click **"New +"** → **"Web Service"**
3. Connect to your GitHub account
4. Find **`ghl-voice-ai-planner`** repository
5. Click **"Connect"**

## 📝 **Step 4: Configure Service**

Render auto-detects, but verify these settings:

**Basic Settings:**
- **Name:** `ghl-oauth-api`
- **Region:** Oregon (or closest to you)
- **Branch:** `master`
- **Root Directory:** `server` (for OAuth server)
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `node ghl-express-api.js`

**Environment Variables:**
Add these in Render dashboard:

```
GHL_CLIENT_ID=68fd461dc407410f0f0c0cb1-mh6umpou
GHL_CLIENT_SECRET=a7a79a21-828d-4744-b1a3-c13158773c92
GHL_SHARED_SECRET=0e06d8f4-6eed-4ab7-903e-ff93e5fdd42a
GHL_REDIRECT_URI=https://ghlvoiceai.captureclient.com/auth/callback
PORT=10000
NODE_ENV=production
```

## 📝 **Step 5: Deploy**

1. Click **"Create Web Service"**
2. Render starts building (takes 2-5 minutes)
3. You'll get a URL like: `ghl-oauth-api.onrender.com`

## 📝 **Step 6: Add Custom Domain**

1. In Render → Service → **"Settings"**
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter: `ghlvoiceai.captureclient.com`
5. Render gives DNS instructions

## 📝 **Step 7: Update GoDaddy DNS**

Add CNAME in GoDaddy:

```
Type:     CNAME
Name:     ghlvoiceai
Value:    [Render provides this] (e.g., lb.omar.onrender.com)
TTL:      3600
```

Wait 5-30 minutes for DNS to propagate.

## 📝 **Step 8: Update GHL Settings**

1. Go to: **https://marketplace.gohighlevel.com/developer**
2. Find your app
3. Add redirect URI: `https://ghlvoiceai.captureclient.com/auth/callback`
4. Save

## ✅ **Step 9: Test!**

Visit: `https://ghlvoiceai.captureclient.com/auth/ghl`

Should redirect to GHL OAuth! 🎉

---

## 🎯 **Success Checklist**

- [ ] Created GitHub repo
- [ ] Pushed code to GitHub
- [ ] Connected repo to Render
- [ ] Added environment variables
- [ ] Deployed to Render
- [ ] Added custom domain
- [ ] Updated GoDaddy DNS
- [ ] Updated GHL redirect URI
- [ ] Tested OAuth flow

---

## 📞 **Need Help?**

- GitHub: https://github.com/settings/tokens (if auth issues)
- Render: https://render.com/docs
- GoDaddy: https://www.godaddy.com/help

**You're almost there!** 🚀
