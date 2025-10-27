# 🔗 GHL Redirect URL Setup Guide

## **Quick Setup Steps**

### **1. Go to GHL Developer Portal**
- Visit: https://marketplace.leadconnectorhq.com/
- Log in with your GoHighLevel account

### **2. Find Your App**
- Look for your app with Client ID: `68fd461dc407410f0f0c0cb1-mh6umpou`
- Click on the app to edit it

### **3. Add Redirect URI**
In the app settings, add this redirect URI:

**Production Redirect URI:**
```
https://captureclient.com/oauth/callback
```

### **4. Save Changes**
- Click "Save" or "Update" in the GHL developer portal
- The changes should take effect immediately

## **How to Test**

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Navigate to GHL API Connector:**
   - Go to `http://localhost:3000/ghl-api`
   - Click "Connect Account"

3. **Check the console:**
   - Open browser DevTools (F12)
   - Look for the redirect URI in the console logs
   - It should show: `https://captureclient.com/oauth/callback`

## **Troubleshooting**

### **Common Issues:**

1. **"Invalid redirect_uri" error:**
   - Make sure you added the exact URL: `https://captureclient.com/oauth/callback`
   - Check for typos in the GHL developer portal
   - Ensure there are no extra spaces or characters

2. **"Client ID not found" error:**
   - Verify your Client ID is correct: `68fd461dc407410f0f0c0cb1-mh6umpou`
   - Make sure the app is active in GHL developer portal

3. **Redirect not working:**
   - Check that your app is running on port 3000
   - Verify the callback route is working: `https://captureclient.com/oauth/callback`

### **Debug Information:**

When you click "Connect Account", check the browser console for:
- `GHL OAuth Redirect URI: https://captureclient.com/oauth/callback`
- `GHL Client ID: 68fd461dc407410f0f0c0cb1-mh6umpou`
- `GHL OAuth URL: https://marketplace.leadconnectorhq.com/oauth/chooselocation?...`

## **Production Deployment**

Your app is already configured for production with:
- **Redirect URI:** `https://captureclient.com/oauth/callback`
- **Domain:** `captureclient.com`
- **Path:** `/ghl/oauth/callback`

The OAuth flow will redirect users to your production domain after authentication.

## **Security Notes**

- The redirect URI must match exactly (including http/https)
- GHL validates the redirect URI for security
- Never share your Client Secret publicly
- Keep your Shared Secret secure

## **Need Help?**

If you're still having issues:
1. Check the browser console for error messages
2. Verify the redirect URI is exactly: `https://captureclient.com/oauth/callback`
3. Make sure your GHL app is active and approved
4. Try clearing browser cache and cookies

---

**Your app is ready to connect to GHL once you add the redirect URI!** 🚀
