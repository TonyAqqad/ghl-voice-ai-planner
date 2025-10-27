# 🚀 **How to Trigger Render Deployment**

## **Problem:**
No deployments showing in Render dashboard.

## **Solution: Trigger Manual Deployment**

### **Step 1: Check Service Configuration**

1. Go to: https://dashboard.render.com
2. Click on your service: **ghl-oauth-api**
3. Verify Build and Start commands:
   - **Build:** `cd server && npm install`
   - **Start:** `cd server && node ghl-express-api.js`

### **Step 2: Enable Auto-Deploy (If Not Enabled)**

1. In your service → **Settings**
2. Scroll to **"Auto-Deploy"**
3. Make sure it says **"Yes"**
4. Set branch to: **main**

### **Step 3: Manual Deploy (Immediate)**

1. In your service dashboard
2. Click **"Manual Deploy"** button (top right)
3. Select **"Deploy latest commit"**
4. Click **"Deploy"**
5. Watch the logs!

---

## **What You Should See:**

### **Build Phase:**
```
==> Cloning from https://github.com/TonyAqqad/ghl-voice-ai-planner
==> Checking out commit 4a5e5f5
==> Running build command 'cd server && npm install'...
added 65 packages in 5s
==> Build successful ✅
```

### **Deploy Phase:**
```
==> Starting service...
🚀 GHL OAuth API Server running on port 10000
📡 Auth endpoint: http://localhost:10000/auth/ghl
✅ Callback: http://localhost:10000/auth/callback
```

### **Live Status:**
Should show **"Live"** badge at the top!

---

## **If Still No Deployment:**

### **Check GitHub Connection:**

1. In Render → **Settings** → **Service**
2. Check **"Connected to GitHub"**
3. Should say: **"TonyAqqad / ghl-voice-ai-planner"**

If not connected:
1. Click **"Disconnect"**
2. Click **"Connect GitHub"** again
3. Select your repo
4. Then deploy

### **Alternative: Recreate Service**

If nothing works:

1. **Delete** the current service in Render
2. **Create New Service** from GitHub repo
3. Configure settings:
   - **Root Directory:** (leave blank)
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && node ghl-express-api.js`
   - **Branch:** `main`
4. **Save**
5. **Manual Deploy**

---

## **Quick Checklist:**

- [ ] Service exists in Render
- [ ] Build/Start commands set
- [ ] Connected to GitHub
- [ ] Branch set to `main`
- [ ] Environment variables added
- [ ] Clicked "Manual Deploy"

---

## **After Deployment:**

### **Test Health Check:**
Visit: `https://ghl-oauth-api.onrender.com/health`

Should return:
```json
{
  "status": "healthy",
  "service": "GHL OAuth API",
  "env": "production"
}
```

### **Test OAuth:**
Visit: `https://ghl-oauth-api.onrender.com/auth/ghl`

Should redirect to GHL! 🎉

---

## **Monitor Deployment:**

### **In Render Dashboard:**
1. Click **"Events"** tab
2. See real-time build logs
3. Watch for "Build successful"
4. Wait for "Service live"

### **Expected Timeline:**
- Build: 2-3 minutes
- Deploy: 1-2 minutes
- Total: ~5 minutes

---

## **Troubleshooting:**

### **Build Fails:**
- Check if `server/` directory exists in GitHub
- Verify `server/package.json` exists
- Check build logs for errors

### **Service Won't Start:**
- Check Start Command spelling
- Verify `ghl-express-api.js` exists
- Look at service logs

### **Still No Deploy:**
- Check if GitHub webhooks are enabled
- Try disconnecting and reconnecting GitHub
- Create new service

---

## **Quick Action:**

**Right now, do this:**

1. Go to Render dashboard
2. Click on **ghl-oauth-api**
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Watch the logs!

**That should trigger deployment immediately!** 🚀

