# 🔐 **GHL OAuth Setup Guide**

## 🚨 **Current Issue**

The OAuth redirect URL `https://captureclient.com/oauth/callback` returns **404** because:
1. This domain is not owned by you (it's a production domain)
2. You need to use a local development setup OR
3. Update the redirect URL in your GHL Developer Portal

---

## ✅ **Solution Options**

### **Option 1: Use ngrok (Recommended for Testing)**

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or use npm:
   npm install -g ngrok
   ```

2. **Start the webhook server:**
   ```bash
   cd "C:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"
   node webhook-server.cjs
   ```

3. **Expose with ngrok:**
   ```bash
   ngrok http 3001
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Update GHL Developer Portal:**
   - Go to https://marketplace.gohighlevel.com/developer
   - Update Redirect URI to: `https://abc123.ngrok.io/auth/callback`

6. **Update `.env` file:**
   ```env
   GHL_REDIRECT_URI=https://abc123.ngrok.io/auth/callback
   VITE_GHL_REDIRECT_URI=https://abc123.ngrok.io/auth/callback
   ```

---

### **Option 2: Use LocalTunnel (Free Alternative)**

1. **Install LocalTunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start webhook server:**
   ```bash
   node webhook-server.cjs
   ```

3. **Expose with LocalTunnel:**
   ```bash
   lt --port 3001
   ```

4. **Copy the URL** and follow steps 5-6 from Option 1

---

### **Option 3: Update GHL Developer Portal to Your Domain**

If you own a domain:

1. **Update in GHL Developer Portal:**
   - Go to https://marketplace.gohighlevel.com/developer
   - Add redirect URI: `https://yourdomain.com/auth/callback`

2. **Update `.env`:**
   ```env
   GHL_REDIRECT_URI=https://yourdomain.com/auth/callback
   VITE_GHL_REDIRECT_URI=https://yourdomain.com/auth/callback
   ```

3. **Deploy Express server** to handle the callback

---

## 🎯 **Current OAuth Flow (What Happens)**

1. **User clicks "Connect Account"** → Goes to GHL OAuth page
2. **User authorizes** → GHL redirects to: `https://captureclient.com/oauth/callback?code=...`
3. **❌ PROBLEM:** This URL doesn't exist (returns 404)
4. **✅ SHOULD redirect to:** Your ngrok/domain URL

---

## 🚀 **Quick Fix: Use ngrok Now**

### **Step 1: Start Everything**

**Terminal 1** (Frontend):
```bash
cd "C:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"
npm run dev
```

**Terminal 2** (Webhook Server):
```bash
cd "C:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"
node webhook-server.cjs
```

**Terminal 3** (ngrok):
```bash
ngrok http 3001
```

### **Step 2: Update Redirect URI**

1. Copy the ngrok URL from Terminal 3 (e.g., `https://abc123.ngrok.io`)
2. Go to: https://marketplace.gohighlevel.com/developer/settings
3. Update Redirect URI to: `https://abc123.ngrok.io/oauth/callback`
4. Save

### **Step 3: Update .env**

```bash
cd "C:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"
```

Create/update `.env` with your ngrok URL:
```env
GHL_REDIRECT_URI=https://abc123.ngrok.io/oauth/callback
VITE_GHL_REDIRECT_URI=https://abc123.ngrok.io/oauth/callback
```

### **Step 4: Restart Servers**

Restart both Terminal 1 and Terminal 2 to load new `.env` values.

### **Step 5: Test OAuth**

1. Go to: http://localhost:3001/ghl-api
2. Click "Connect Account"
3. Complete OAuth in GHL
4. Should redirect back to your app via ngrok ✅

---

## 🎯 **Alternative: Local Development Setup**

If you want to use a local callback without ngrok:

1. **Update GHL Developer Portal** with: `http://localhost:3001/oauth/callback`
   - ⚠️ **Note:** GHL might not allow `localhost` redirects
   - This is why ngrok is recommended

2. **Update `.env`:**
   ```env
   GHL_REDIRECT_URI=http://localhost:3001/oauth/callback
   VITE_GHL_REDIRECT_URI=http://localhost:3001/oauth/callback
   ```

3. **Test the OAuth flow**

---

## ✅ **Verification**

After setup, test with:

```javascript
// In browser console on http://localhost:3001/ghl-api
const authUrl = await ghlApiClient.initializeAuth();
console.log('Redirect URL:', authUrl);
// Should show your ngrok URL, not captureclient.com
```

---

## 🎉 **Success Indicators**

✅ OAuth URL shows your ngrok domain  
✅ No 404 errors  
✅ Callback redirects back to your app  
✅ Tokens are stored in localStorage  
✅ Connection status shows "Connected"  

---

## 📚 **Additional Resources**

- [ngrok Setup Guide](https://dashboard.ngrok.com/get-started)
- [GHL OAuth Docs](https://highlevel.stoplight.io/docs/integrations/66a8e5de7d0d5-oauth)
- [LocalTunnel Docs](https://localtunnel.github.io/www/)

---

**Next Steps:** Choose an option above and update your redirect URI! 🚀
