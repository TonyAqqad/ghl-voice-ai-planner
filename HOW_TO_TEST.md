# 🧪 **How to Test the GHL Voice AI Planner**

## 🚀 **Quick Start Testing**

### **Step 1: Start All Servers**

Open two terminal windows:

**Terminal 1:**
```bash
cd "C:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"
npm run dev
```
This starts the frontend on **http://localhost:3001**

**Terminal 2:**
```bash
cd "C:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"
node webhook-server.cjs
```
This starts the webhook server on **http://localhost:3001** (different port or same, depending on availability)

---

## 🧪 **Testing the OAuth Flow**

### **Option A: Through the App UI**

1. **Navigate to GHL API Connector:**
   - Open http://localhost:3001/ghl-api
   - Or click "GHL API Connector" in the sidebar

2. **Click "Connect Account" button:**
   - Button is in the "Overview" tab
   - This initiates OAuth flow

3. **You'll be redirected to GHL:**
   - Select your location/company
   - Grant required permissions
   - GHL will redirect back to your app

4. **Verify success:**
   - Check browser console for "✅ OAuth tokens received"
   - Check localStorage in DevTools
   - Connection status should show "Connected"

### **Option B: Direct OAuth URL Test**

1. **Open browser console on http://localhost:3001/ghl-api**

2. **Run this in console:**
   ```javascript
   import { ghlApiClient } from './utils/ghlApi';
   const authUrl = await ghlApiClient.initializeAuth();
   console.log('Auth URL:', authUrl);
   window.location.href = authUrl;
   ```

3. **Complete OAuth in GHL**

4. **Return to app** - should automatically complete

---

## 🔍 **What to Check**

### **✅ OAuth Success Indicators:**

1. **Browser Console:**
   - ✅ "GHL OAuth Redirect URI: https://captureclient.com/oauth/callback"
   - ✅ "GHL Client ID: 68fd461dc407410f0f0c0cb1-mh6umpou"
   - ✅ "✅ OAuth tokens received and stored"

2. **localStorage (DevTools):**
   - `ghl_access_token` - Should have a token
   - `ghl_refresh_token` - Should have a token
   - `ghl_token_expiry` - Should have a timestamp
   - `ghl_oauth_state` - Should have the state

3. **App UI:**
   - Connection status: "Connected"
   - Last sync time updated
   - "Test Connection" button works

### **✅ API Function Tests:**

Once connected, test these in the GHL API Connector:

1. **Contacts Sync:**
   - Go to "Data Sync" tab
   - Click "Sync Data"
   - Should retrieve contacts from GHL

2. **Test Connection:**
   - Click "Test Connection" button
   - Should show success message

3. **API Logs:**
   - Go to "Logs" tab
   - Should show API request history

---

## 🌐 **Testing Webhooks**

### **1. Start Webhook Server:**
```bash
node webhook-server.cjs
```

### **2. Check Health:**
- Visit: http://localhost:3001/health
- Should return: `{"status":"healthy"}`

### **3. Webhook Status:**
- Visit: http://localhost:3001/webhook/status
- Should show supported events

### **4. Test with ngrok (Production Testing):**
```bash
ngrok http 3001
```

Copy the ngrok URL to GHL webhook configuration.

---

## 🐛 **Troubleshooting**

### **Issue: OAuth redirect fails**

**Check:**
1. Redirect URI in GHL Developer Portal matches: `https://captureclient.com/oauth/callback`
2. OAuth URL uses correct domain: `marketplace.gohighlevel.com`
3. Client ID is correct: `68fd461dc407410f0f0c0cb1-mh6umpou`

### **Issue: "Invalid state parameter"**

**Fix:**
- Clear localStorage and try again
- Make sure `ghl_oauth_state` is being set before redirect

### **Issue: Token exchange fails**

**Check:**
1. Client Secret is correct in `.env` file
2. Redirect URI matches exactly
3. OAuth scope includes all required permissions

### **Issue: App shows "No connections"**

**Fix:**
1. Complete OAuth flow successfully
2. Check console for errors
3. Verify tokens in localStorage

---

## 📝 **Testing Checklist**

### **OAuth Integration:**
- [ ] App loads without errors
- [ ] "Connect Account" button is visible
- [ ] OAuth redirect works
- [ ] Tokens are stored in localStorage
- [ ] Connection status shows "Connected"
- [ ] Can test connection successfully

### **API Functions:**
- [ ] Can retrieve contacts
- [ ] Can test connection
- [ ] API logs show activity
- [ ] Data sync works
- [ ] No console errors

### **Webhooks:**
- [ ] Webhook server starts
- [ ] Health endpoint works
- [ ] Status endpoint shows events
- [ ] Can receive GHL webhooks (with ngrok)

---

## 🎯 **Next Steps After Testing**

Once OAuth is working:

1. **Test Contact Sync:**
   - Import contacts from GHL
   - Verify custom fields work
   - Test contact updates

2. **Test SMS Messaging:**
   - Use the SMS function
   - Verify messages are sent
   - Check GHL for received messages

3. **Test Voice AI Integration:**
   - Create a Voice AI agent
   - Configure with GHL custom fields
   - Test the agent

4. **Production Deployment:**
   - Deploy frontend
   - Deploy webhook server
   - Update OAuth URLs

---

## 🚀 **Quick Test Commands**

**Check if app is running:**
```bash
curl http://localhost:3001/health
```

**Check webhook server:**
```bash
curl http://localhost:3001/health
```

**View localStorage:**
```javascript
console.log(localStorage.getItem('ghl_access_token'));
```

**Test API connection:**
```javascript
import { ghlApiClient } from './utils/ghlApi';
const isConnected = await ghlApiClient.testConnection();
console.log('Connected:', isConnected);
```

---

## ✅ **Success Indicators**

You'll know OAuth is working when:
- ✅ Redirect to GHL works
- ✅ Return to app with code parameter
- ✅ Console shows token storage
- ✅ Connection status is "Connected"
- ✅ Can retrieve contacts from GHL
- ✅ Test connection succeeds

---

**Your app is ready to test!** 🎉

Navigate to: **http://localhost:3001/ghl-api** and click "Connect Account"!
