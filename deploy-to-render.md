# 🚀 **Deploy to Render.com (Super Easy!)**

## ✅ **Why Render.com?**

- ✅ **No CLI needed** - Deploy from browser!
- ✅ **Free tier available**
- ✅ **Automatic HTTPS**
- ✅ **Easy custom domains**
- ✅ **Perfect for Node.js apps**

---

## 📋 **Step 1: Create Render Account**

1. Go to: **https://render.com**
2. Click **"Get Started"** (free)
3. Sign up with **GitHub** (recommended)
4. Authorize Render to access your repos

---

## 📋 **Step 2: Deploy Your OAuth Server**

### **Option A: If Your Code is on GitHub**

1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Click **"Connect GitHub"**
4. Select your repository
5. Render auto-detects settings!

### **Option B: If Not on GitHub (Manual Upload)**

1. In Render, click **"New +"** → **"Web Service"**
2. Click **"Public Git repository"** → **"Connect a new Git repository"**
3. Or click **"Manual Deploy"**
4. Upload your files

---

## 📋 **Step 3: Configure Your Service**

Render will show settings. Here's what to set:

### **Basic Settings:**
```
Name:                   ghl-oauth-api
Region:                 Oregon (closest to you)
Branch:                 main (or your branch)
Root Directory:         server
```

### **Build & Start:**
```
Environment:            Node
Build Command:          cd server && npm install
Start Command:          node server/ghl-express-api.js
```

Wait, you need to update the start command based on your file location:

### **Actual Configuration:**
```
Name:                   ghl-oauth-api
Environment:            Node
Build Command:          npm install
Start Command:          node server/ghl-express-api.js
Root Directory:         . (current directory)
```

---

## 📋 **Step 4: Add Environment Variables**

In Render dashboard → Your Service → **"Environment"** tab:

Add these variables:

```
GHL_CLIENT_ID=68fd461dc407410f0f0c0cb1-mh6umpou
GHL_CLIENT_SECRET=a7a79a21-828d-4744-b1a3-c13158773c92
GHL_REDIRECT_URI=https://ghlvoiceai.captureclient.com/auth/callback
PORT=10000
NODE_ENV=production
```

**Note:** Render uses port from environment variable or PORT env var.

---

## 📋 **Step 5: Deploy**

1. Click **"Create Web Service"**
2. Render starts building
3. Wait 2-3 minutes
4. You'll get a URL like: `ghl-oauth-api.onrender.com`

---

## 📋 **Step 6: Add Custom Domain**

1. In Render dashboard → Service → **"Settings"**
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter: `ghlvoiceai.captureclient.com`
5. Render gives you DNS instructions

---

## 📋 **Step 7: Update GoDaddy DNS**

Go to **GoDaddy** → DNS Management → Add CNAME:

```
Type:     CNAME
Name:     ghlvoiceai
Value:    [What Render says] (e.g., lb.omar.onrender.com)
TTL:      3600
```

Save and wait 5-30 minutes.

---

## 📋 **Step 8: Update GHL Settings**

1. Go to: **https://marketplace.gohighlevel.com/developer**
2. Find your app
3. Add redirect URI: `https://ghlvoiceai.captureclient.com/auth/callback`
4. Save

---

## ✅ **Step 9: Test!**

Visit these URLs:

### **Health Check:**
`https://ghlvoiceai.captureclient.com/health`

Should return:
```json
{
  "status": "healthy",
  "service": "GHL OAuth API",
  "env": "production"
}
```

### **OAuth Flow:**
`https://ghlvoiceai.captureclient.com/auth/ghl`

Should redirect to GHL authorization!

---

## 🎯 **File Structure for Render**

Your project structure should be:

```
ghl-voice-ai-planner/
├── server/
│   ├── ghl-express-api.js    ← Your OAuth server
│   └── (dependencies)
├── package.json               ← Has dependencies
├── .env                       ← Don't upload! (Add to Render)
└── ... (other files)
```

---

## 📝 **What Files Do I Upload?**

You only need these for OAuth API:
- ✅ `server/ghl-express-api.js`
- ✅ `package.json` (at root)
- ✅ Dependencies will be installed via `npm install`

**Add `.env` variables in Render dashboard, don't upload the file!**

---

## 🎉 **That's It!**

Once deployed:
1. Health check works
2. OAuth flow redirects to GHL
3. Callback receives tokens
4. Success! 🚀

---

## 🔧 **Quick Troubleshooting**

### **Build Fails:**
- Check `package.json` has all dependencies
- Make sure `server/ghl-express-api.js` exists

### **DNS Not Working:**
- Wait 5-30 minutes
- Check: `nslookup ghlvoiceai.captureclient.com`
- Should show Render IP

### **OAuth Callback Fails:**
- Verify redirect URI matches EXACTLY in GHL
- Check Render logs for errors
- No trailing slash in URL

---

## 📞 **Need More Help?**

- Render Docs: https://render.com/docs
- Render Support: https://render.com/help

**Deploy now and let me know when it's live!** ✨
