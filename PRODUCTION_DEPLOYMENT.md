# 🚀 GHL Voice AI Planner - Production Deployment Guide

## 🎯 **Domain Strategy**

You have multiple domains. Here's the best setup:

```
app.captureclient.com       → Production GHL App (GoHighLevel integration)
ghlvoiceai.captureclient.com → OAuth Test API (New deployment)
```

## 📋 **Prerequisites**

- ✅ Railway/Render account (free tier works)
- ✅ GoDaddy DNS access
- ✅ GHL Developer account with Client ID
- ✅ Environment variables ready

## 🚀 **Step 1: Prepare Express Server**

### **1.1: Create Production Server File**

Create `server/ghl-oauth-server.js`:

```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const GHL_CONFIG = {
  base_url: 'https://services.leadconnectorhq.com',
  auth_url: 'https://marketplace.gohighlevel.com',
  client_id: process.env.GHL_CLIENT_ID || '68fd461dc407410f0f0c0cb1-mh6umpou',
  client_secret: process.env.GHL_CLIENT_SECRET || '',
  redirect_uri: process.env.GHL_REDIRECT_URI || 'https://ghlvoiceai.captureclient.com/auth/callback'
};

// Generate OAuth URL
app.get('/auth/ghl', (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  
  const scope = 'calendars.write conversations/message.readonly voice-ai-agents.readonly voice-ai-agents.write conversations.readonly conversations.write contacts.readonly contacts.write workflows.readonly phonenumbers.read voice-ai-dashboard.readonly voice-ai-agent-goals.readonly voice-ai-agent-goals.write knowledge-bases.write knowledge-bases.readonly conversation-ai.readonly conversation-ai.write agent-studio.readonly calendars.readonly calendars/events.readonly calendars/events.write agent-studio.write locations/customValues.write locations/customFields.write locations/customFields.readonly locations.readonly locations/customValues.readonly conversations/message.write';
  
  const versionId = GHL_CONFIG.client_id.split('-')[0];
  const authUrl = `${GHL_CONFIG.auth_url}/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(GHL_CONFIG.redirect_uri)}&client_id=${GHL_CONFIG.client_id}&scope=${encodeURIComponent(scope)}&version_id=${versionId}&state=${state}`;
  
  console.log('📍 OAuth URL:', authUrl);
  res.redirect(authUrl);
});

// Handle OAuth callback
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  
  try {
    const params = new URLSearchParams();
    params.append('client_id', GHL_CONFIG.client_id);
    params.append('client_secret', GHL_CONFIG.client_secret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('user_type', 'Location');
    params.append('redirect_uri', GHL_CONFIG.redirect_uri);
    
    const tokenResponse = await axios.post(
      `${GHL_CONFIG.base_url}/oauth/token`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );
    
    const { access_token, refresh_token } = tokenResponse.data;
    
    console.log('✅ Tokens received');
    
    // Store tokens securely (implement your storage)
    // TODO: Save to database
    
    // Redirect to your app
    res.json({ 
      success: true, 
      message: 'OAuth successful!',
      hasTokens: !!access_token 
    });
    
  } catch (error) {
    console.error('❌ OAuth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Token exchange failed',
      details: error.response?.data 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'GHL OAuth API',
    env: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GHL OAuth API running on port ${PORT}`);
  console.log(`📡 OAuth endpoint: ${process.env.RAILWAY_PUBLIC_DOMAIN || `http://localhost:${PORT}`}/auth/ghl`);
});

module.exports = app;
```

### **1.2: Create package.json for Server**

Create `server/package.json`:

```json
{
  "name": "ghl-oauth-api",
  "version": "1.0.0",
  "main": "ghl-oauth-server.js",
  "scripts": {
    "start": "node ghl-oauth-server.js",
    "dev": "nodemon ghl-oauth-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  }
}
```

## 🚀 **Step 2: Deploy to Railway**

### **2.1: Create Account**
1. Go to https://railway.app
2. Sign up with GitHub (free tier available)

### **2.2: Create New Project**
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"** or **"Empty Project"**
3. Name: `ghl-oauth-api`

### **2.3: Upload Code**
Option A - From GitHub:
1. Connect your GitHub repo
2. Select the branch
3. Railway auto-detects Node.js

Option B - Manual Upload:
1. In Railway dashboard, click **"Add"** → **"GitHub Repo"**
2. Select repository
3. Railway will create deployment

### **2.4: Add Environment Variables**
In Railway dashboard → Settings → Variables:

```
GHL_CLIENT_ID=68fd461dc407410f0f0c0cb1-mh6umpou
GHL_CLIENT_SECRET=a7a79a21-828d-4744-b1a3-c13158773c92
GHL_REDIRECT_URI=https://ghlvoiceai.captureclient.com/auth/callback
PORT=3000
NODE_ENV=production
```

### **2.5: Deploy**
1. Railway automatically builds and deploys
2. Get your Railway URL: `your-app-1234.railway.app`

## 🌐 **Step 3: Point DNS to Railway**

### **3.1: Go to GoDaddy DNS Settings**
1. Log in to GoDaddy
2. Go to **My Products** → **DNS** → **captureclient.com**
3. Manage DNS

### **3.2: Add CNAME Record**
```
Type:     CNAME
Name:     ghlvoiceai
Value:    your-app-1234.railway.app
TTL:      3600 (or 600 for faster updates)
```

### **3.3: Save and Wait**
- DNS propagation takes 5-30 minutes
- Check with: `nslookup ghlvoiceai.captureclient.com`

## 🔧 **Step 4: Update GHL OAuth Settings**

### **4.1: Go to GHL Developer Portal**
1. Visit: https://marketplace.gohighlevel.com/developer
2. Sign in with your GHL developer account

### **4.2: Find Your App**
- Client ID: `68fd461dc407410f0f0c0cb1-mh6umpou`
- Or search for "Voice AI" or your app name

### **4.3: Add Redirect URI**
1. Go to **OAuth Settings** or **Redirect URIs**
2. Add new redirect URI:
   ```
   https://ghlvoiceai.captureclient.com/auth/callback
   ```
3. Save

## ✅ **Step 5: Test OAuth Flow**

### **5.1: Test Health Check**
Visit: `https://ghlvoiceai.captureclient.com/health`

Should return:
```json
{
  "status": "healthy",
  "service": "GHL OAuth API",
  "env": "production"
}
```

### **5.2: Test OAuth**
Visit: `https://ghlvoiceai.captureclient.com/auth/ghl`

Should redirect to GHL authorization screen!

### **5.3: Complete Flow**
1. Select your location/company
2. Authorize permissions
3. GHL redirects back to your callback
4. Check Railway logs for token receipt

## 📋 **Deployment Checklist**

- [ ] Railway account created
- [ ] Code deployed to Railway
- [ ] Environment variables set
- [ ] DNS CNAME added in GoDaddy
- [ ] DNS propagated (wait 5-30 min)
- [ ] Redirect URI added in GHL settings
- [ ] Health check works
- [ ] OAuth flow completes
- [ ] Tokens received successfully

## 🎯 **Alternative: Render.com**

If Railway doesn't work, use Render:

### **Render Setup:**
1. Go to https://render.com
2. **New +** → **Web Service**
3. Connect GitHub repo
4. Build: `npm install`
5. Start: `node server/ghl-oauth-server.js`
6. Port: `10000` (check Render docs)
7. Add custom domain: `ghlvoiceai.captureclient.com`
8. Update GoDaddy DNS with Render provided values

## 🔧 **Production Server Structure**

```
ghl-voice-ai-planner/
├── server/
│   ├── ghl-oauth-server.js    ← OAuth API
│   ├── package.json
│   └── .env (on Railway)
├── src/                        ← Frontend app
├── package.json
└── webhook-server.cjs          ← Webhooks (separate deployment)
```

## 🎉 **Success Indicators**

✅ **Health check returns:** `{"status": "healthy"}`  
✅ **OAuth URL redirects:** To GHL authorization  
✅ **Callback receives tokens:** Check Railway logs  
✅ **No CORS errors:** API accessible from frontend  
✅ **SSL working:** HTTPS URL loads properly  

## 🚀 **Next Steps**

Once OAuth works:
1. Frontend (`app.captureclient.com`) can call OAuth API
2. Store tokens in database
3. Implement token refresh logic
4. Add GHL API endpoints
5. Deploy webhook server separately

## 📞 **Troubleshooting**

### **DNS Not Working**
```bash
# Check DNS
nslookup ghlvoiceai.captureclient.com

# Should show Railway IP
```

### **SSL Errors**
- Railway provides free SSL
- May take 5-10 minutes after DNS

### **OAuth Callback Fails**
- Check redirect URI matches EXACTLY
- No trailing slash in GHL settings
- Check Railway logs for errors

### **Token Exchange Fails**
- Verify `client_secret` is correct
- Check `redirect_uri` matches
- Look at error response in logs

---

## 🎯 **Recommended Domain Usage**

```
ghlvoiceai.captureclient.com → OAuth API (Railway)
app.captureclient.com         → Frontend App (Vercel/Netlify)
webhooks.captureclient.com   → Webhook Server (Railway)
```

---

**Ready to deploy!** 🚀
