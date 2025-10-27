# 🔧 **Quick Fix for Render Error**

## **The Error:**
```
npm error path /opt/render/project/src/package.json
Could not read package.json
```

---

## **The Fix: Update Render Settings**

Since you're already deployed to Render, just update the settings manually:

### **1. Go to Render Dashboard**
Visit: `https://dashboard.render.com`

### **2. Click on Your Service**
Service name: **ghl-oauth-api**

### **3. Go to Settings**
Click the **"Settings"** tab on the left sidebar

### **4. Scroll to "Build & Deploy"**

### **5. Update Build Command:**
Change from: `npm install`

To: `cd server && npm install`

### **6. Update Start Command:**
Change from: `node server/ghl-express-api.js`

To: `cd server && node ghl-express-api.js`

### **7. Save Changes**
Click **"Save Changes"**

### **8. Redeploy**
Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## **What This Does:**

The issue is that Render looks for `package.json` in the root, but your server files are in the `server/` directory.

By adding `cd server &&` before each command, you tell Render to:
1. Navigate to the `server/` directory
2. Run the commands there

---

## **Expected Result:**

After deploying, you should see in the logs:

```
🚀 GHL OAuth API Server running on port 10000
📡 Auth endpoint: http://localhost:10000/auth/ghl
✅ Callback: http://localhost:10000/auth/callback
```

---

## **Test After Deploy:**

### **1. Health Check:**
Visit: `https://ghl-oauth-api.onrender.com/health`

Should return:
```json
{
  "status": "healthy",
  "service": "GHL OAuth API"
}
```

### **2. OAuth Test:**
Visit: `https://ghl-oauth-api.onrender.com/auth/ghl`

Should redirect to GHL authorization! 🎉

---

## **If It Still Fails:**

### **Alternative: Change Root Directory**

Instead of using `cd server &&`, you can:

1. In **Settings** → **Build & Deploy**
2. Set **Root Directory** to: `server`
3. Set **Build Command** to: `npm install`
4. Set **Start Command** to: `node ghl-express-api.js`

This tells Render to run everything from the `server/` directory.

---

## **Environment Variables (Verify These):**

Make sure these are set in **Settings** → **Environment**:

```
GHL_CLIENT_ID=68fd461dc407410f0f0c0cb1-mh6umpou
GHL_CLIENT_SECRET=a7a79a21-828d-4744-b1a3-c13158773c92
GHL_SHARED_SECRET=0e06d8f4-6eed-4ab7-903e-ff93e5fdd42a
GHL_REDIRECT_URI=https://ghlvoiceai.captureclient.com/auth/callback
PORT=10000
NODE_ENV=production
```

---

## **That's It!** 🚀

Just update those two commands in Render settings and redeploy!

You can also push your changes to GitHub if you want to sync everything, but the manual fix above will work immediately!

