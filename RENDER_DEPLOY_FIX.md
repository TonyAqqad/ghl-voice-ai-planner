# 🔧 **Fix Render Deployment Error**

## **Error Message:**
```
npm error path /opt/render/project/src/package.json
npm error enoent Could not read package.json
```

## **Problem:**
Render is looking for `package.json` in the wrong directory. Your OAuth server is in the `server/` folder.

## **Solution Applied:**

Created `render.yaml` which tells Render exactly how to deploy:

```yaml
services:
  - type: web
    name: ghl-oauth-api
    buildCommand: cd server && npm install
    startCommand: cd server && node ghl-express-api.js
```

This tells Render to:
1. Build in the `server/` directory
2. Start the `ghl-express-api.js` file

---

## **Manual Fix (If render.yaml doesn't work):**

### **In Render Dashboard:**

1. Go to your service: **ghl-oauth-api**
2. Click **"Settings"**
3. Scroll to **"Build & Deploy"**
4. Change these settings:

**Build Command:**
```
cd server && npm install
```

**Start Command:**
```
cd server && node ghl-express-api.js
```

5. Click **"Save Changes"**
6. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## **What Happens Now:**

1. Render clones your GitHub repo
2. Runs: `cd server && npm install`
   - This installs express, axios, cors, dotenv
3. Runs: `cd server && node ghl-express-api.js`
   - Starts your OAuth server
4. Server listens on port 10000
5. OAuth API becomes live! ✅

---

## **Environment Variables (Already Set):**

Render should have these (check in Settings → Environment):

- ✅ `GHL_CLIENT_ID`
- ✅ `GHL_CLIENT_SECRET`
- ✅ `GHL_SHARED_SECRET`
- ✅ `GHL_REDIRECT_URI`
- ✅ `PORT=10000`
- ✅ `NODE_ENV=production`

---

## **Test After Deploy:**

Once deployed successfully:

1. **Health Check:**
   Visit: `https://ghl-oauth-api.onrender.com/health`
   Should return: `{"status":"healthy","service":"GHL OAuth API"}`

2. **OAuth Test:**
   Visit: `https://ghl-oauth-api.onrender.com/auth/ghl`
   Should redirect to GHL authorization!

---

## **Commit & Push:**

The `render.yaml` file needs to be pushed to GitHub:

```bash
git add render.yaml
git commit -m "Add render.yaml for automatic deployment"
git push origin main
```

Then Render will auto-deploy! 🚀

---

## **Alternative: Manual Deploy Settings**

If you prefer not to use `render.yaml`, update these in Render dashboard:

1. **Root Directory:** Leave blank (uses repo root)
2. **Build Command:** `cd server && npm install`
3. **Start Command:** `cd server && node ghl-express-api.js`

---

## **Next Steps After Success:**

Once OAuth API is live:

1. Add custom domain: `ghlvoiceai.captureclient.com`
2. Update DNS in GoDaddy
3. Update GHL redirect URI
4. Test OAuth flow

**You're almost there!** 🎉

