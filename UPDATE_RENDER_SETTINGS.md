# 🔧 **Update Render Service Settings**

## ✅ **Latest Code Pushed to GitHub!**

Your `main` branch now has all the fixes including the `server/` directory.

## **Action Required: Update Render Settings**

Since you're already deployed, you need to update the settings manually:

### **1. Go to Render Dashboard**
Visit your service: `ghl-oauth-api`

### **2. Click "Settings" Tab**

### **3. Scroll to "Build & Deploy" Section**

### **4. Update Build Command:**
**Current:** `npm install`

**Change to:** `cd server && npm install`

### **5. Update Start Command:**
**Current:** (likely blank or wrong)

**Change to:** `cd server && node ghl-express-api.js`

### **6. Verify Branch:**
Make sure **Branch** is set to: `main`

### **7. Save Changes**
Click **"Save Changes"**

### **8. Redeploy**
Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## **What These Commands Do:**

### **Build Command:**
```
cd server && npm install
```
1. Navigates to `server/` directory
2. Runs `npm install`
3. Installs express, axios, cors, dotenv

### **Start Command:**
```
cd server && node ghl-express-api.js
```
1. Navigates to `server/` directory
2. Starts the OAuth API server

---

## **Expected Success Logs:**

After redeploying with these settings, you should see:

```
==> Running build command 'cd server && npm install'...
added 65 packages in 5s
==> Build successful ✅
==> Starting service...
🚀 GHL OAuth API Server running on port 10000
📡 Auth endpoint: http://localhost:10000/auth/ghl
✅ Callback: http://localhost:10000/auth/callback
```

---

## **Alternative: Use Root Directory**

Instead of `cd server &&`, you can:

1. Set **Root Directory** to: `server`
2. Set **Build Command** to: `npm install`
3. Set **Start Command** to: `node ghl-express-api.js`

This makes Render run everything from the `server/` directory.

---

## **Verify Environment Variables:**

Also check that these are set in **Settings** → **Environment**:

```
GHL_CLIENT_ID=68fd461dc407410f0f0c0cb1-mh6umpou
GHL_CLIENT_SECRET=a7a79a21-828d-4744-b1a3-c13158773c92
GHL_SHARED_SECRET=0e06d8f4-6eed-4ab7-903e-ff93e5fdd42a
GHL_REDIRECT_URI=https://ghlvoiceai.captureclient.com/auth/callback
PORT=10000
NODE_ENV=production
```

---

## **After Successful Deploy:**

### **1. Test Health:**
`https://ghl-oauth-api.onrender.com/health`

### **2. Test OAuth:**
`https://ghl-oauth-api.onrender.com/auth/ghl`

### **3. Add Custom Domain:**
- Go to Settings → Custom Domains
- Add: `ghlvoiceai.captureclient.com`

---

## **Quick Summary:**

**Just update these two settings in Render:**

1. ✅ Build Command: `cd server && npm install`
2. ✅ Start Command: `cd server && node ghl-express-api.js`

Then redeploy!

**That's it!** 🚀

