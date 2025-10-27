# 🔍 **Browser Console Test - appId Error**

## 📋 **How to Debug in Browser Console**

Open Developer Tools (F12) and run these tests:

---

## ✅ **Test 1: Check Environment Variables**

```javascript
console.log('Client ID:', import.meta.env.VITE_GHL_CLIENT_ID);
console.log('Client Secret length:', import.meta.env.VITE_GHL_CLIENT_SECRET?.length);
```

**Expected output:**
- Client ID: `68fd461dc407410f0f0c0cb1-mh6umpou`
- Client Secret length: should be a number (not 0)

---

## ✅ **Test 2: Test OAuth URL Generation**

```javascript
const { ghlApiClient } = await import('./src/utils/ghlApi.ts');
const authUrl = await ghlApiClient.initializeAuth();
console.log('OAuth URL:', authUrl);
```

**Check for:**
- URL contains `appId`
- URL contains `version_id`
- URL contains `state`

---

## ✅ **Test 3: Manual OAuth Request**

```javascript
const code = 'YOUR_CODE_HERE'; // From callback URL
const state = localStorage.getItem('ghl_oauth_state');

const params = new URLSearchParams({
  client_id: '68fd461dc407410f0f0c0cb1-mh6umpou',
  client_secret: 'a7a79a21-828d-4744-b1a3-c13158773c92',
  grant_type: 'authorization_code',
  code: code,
  user_type: 'Location',
  redirect_uri: 'https://captureclient.com/oauth/callback',
  appId: '68fd461dc407410f0f0c0cb1-mh6umpou'
});

console.log('Request body:', params.toString());

fetch('https://services.leadconnectorhq.com/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  },
  body: params
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## ✅ **Test 4: Check Local Storage**

```javascript
console.log('Access token:', localStorage.getItem('ghl_access_token'));
console.log('Refresh token:', localStorage.getItem('ghl_refresh_token'));
console.log('Token expiry:', localStorage.getItem('ghl_token_expiry'));
console.log('OAuth state:', localStorage.getItem('ghl_oauth_state'));
```

---

## 🐛 **Common Issues**

### **Issue 1: Environment Variables Empty**

**Solution:**
```bash
# Check vite.config.ts has the correct define block
# Check .env file has GHL_CLIENT_ID and GHL_CLIENT_SECRET
```

### **Issue 2: appId Still Missing**

**Solution:**
- Clear browser cache
- Restart dev server
- Check updated ghlApi.ts has `appId` in request body

### **Issue 3: Token Exchange Fails**

**Error: "Invalid client_id"**
- Check client_id matches exactly
- No extra spaces or characters

**Error: "Invalid redirect_uri"**
- Must match exactly: `https://captureclient.com/oauth/callback`
- No trailing slashes

---

## 🎯 **Quick Fix Checklist**

- [ ] Restart dev server
- [ ] Clear browser cache/localStorage
- [ ] Disable ad blockers
- [ ] Check environment variables in console
- [ ] Verify appId is in request body
- [ ] Check OAuth URL includes all parameters
- [ ] Test in incognito mode

---

## 💡 **Next Steps**

Run the browser console tests above and report what you see!

The Firestore error (`ERR_BLOCKED_BY_CLIENT`) is separate - likely an ad blocker on your browser. The real issue is the OAuth `appId` validation error from GHL's servers.
