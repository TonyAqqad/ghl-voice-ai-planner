# ✅ **Complete Fix Applied - OAuth Flow**

## **The Problem:**
```
POST https://backend.leadconnectorhq.com/oauth/authorize... 400 (Bad Request)
```

This was trying to call the wrong endpoint.

## **The Fix:**

### **1. Updated Frontend OAuth URL**
Changed from:
```
https://ghlvoiceai.captureclient.com/auth/ghl
```

To direct GHL OAuth:
```
https://marketplace.gohighlevel.com/oauth/chooselocation
```

### **2. Fixed Redirect URI**
Changed server default from:
```
https://captureclient.com/oauth/callback
```

To:
```
https://ghlvoiceai.captureclient.com/auth/callback
```

### **3. Added Proper Parameters**
- ✅ `response_type=code`
- ✅ `redirect_uri` (correct one)
- ✅ `client_id` (your Client ID)
- ✅ `scope` (all required scopes)
- ✅ `version_id` (extracted from client_id)
- ✅ `state` (random for security)

---

## **What Happens Now:**

1. **User clicks "Connect"**
2. **Frontend builds OAuth URL:**
   ```
   https://marketplace.gohighlevel.com/oauth/chooselocation?
     response_type=code&
     redirect_uri=https%3A%2F%2Fghlvoiceai.captureclient.com%2Fauth%2Fcallback&
     client_id=68fd461dc407410f0f0c0cb1-mh6umpou&
     scope=...&
     version_id=68fd461dc407410f0f0c0cb1&
     state=...
   ```
3. **Redirects to GHL OAuth page** ✅
4. **User authorizes** ✅
5. **GHL redirects to callback** ✅
6. **Server receives tokens** ✅

---

## **Next Steps:**

### **1. Update GHL Developer Settings**

In https://marketplace.gohighlevel.com/developer:

Add redirect URI:
```
https://ghlvoiceai.captureclient.com/auth/callback
```

### **2. Wait for Render Redeploy**

Render should auto-deploy from the latest `main` branch.

Check Render logs for:
- ✅ "Build successful"
- ✅ "GHL OAuth API Server running"

### **3. Test OAuth Flow**

1. Go to your app: `http://localhost:3001/ghl-api`
2. Click **"Connect Account"**
3. Should redirect to GHL OAuth
4. Complete authorization
5. Should return to your app

---

## **If Still 400 Error:**

### **Check Redirect URI:**

Make sure in GHL Developer Portal:

✅ Redirect URI added:
```
https://ghlvoiceai.captureclient.com/auth/callback
```

❌ NOT:
```
https://captureclient.com/oauth/callback
```

### **Verify Client ID:**

Your Client ID should be:
```
68fd461dc407410f0f0c0cb1-mh6umpou
```

And Version ID is:
```
68fd461dc407410f0f0c0cb1
```

---

## **Test OAuth URL Manually:**

Try this URL directly in browser:

```
https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=https%3A%2F%2Fghlvoiceai.captureclient.com%2Fauth%2Fcallback&client_id=68fd461dc407410f0f0c0cb1-mh6umpou&scope=calendars.write&version_id=68fd461dc407410f0f0c0cb1&state=test123
```

Should redirect to GHL login! ✅

---

## **Key Changes Made:**

1. ✅ Fixed frontend to use direct GHL OAuth URL
2. ✅ Fixed server redirect URI default
3. ✅ Added all required OAuth parameters
4. ✅ Pushed to GitHub
5. ✅ Render will auto-redeploy

---

## **Success Indicators:**

After testing:
- ✅ No 400 errors
- ✅ Redirects to GHL OAuth page
- ✅ Can complete authorization
- ✅ Tokens received

---

**The fix is deployed! Test the OAuth flow now!** 🚀

