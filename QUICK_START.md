# 🚀 **GHL Voice AI Planner - Quick Start**

## **Get Started in 3 Minutes!**

### **Step 1: Navigate to Project**
```powershell
cd "C:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"
```

### **Step 2: Setup Environment**

Create a `.env` file (copy from `.env.example`):

```powershell
Copy-Item ".env.example" ".env"
```

Your `.env` file will contain:
```env
# GHL OAuth Configuration
GHL_CLIENT_ID=68fd461dc407410f0f0c0cb1-mh6umpou
GHL_CLIENT_SECRET=a7a79a21-828d-4744-b1a3-c13158773c92
GHL_SHARED_SECRET=0e06d8f4-6eed-4ab7-903e-ff93e5fdd42a
GHL_REDIRECT_URI=http://localhost:10000/auth/callback

# Voice AI Provider Keys  
VITE_ELEVENLABS_API_KEY=sk_d98b81abb619e2416380692a2d89cf69b1d4af715c5c7832

# Server Configuration
PORT=10000
FRONTEND_URL=http://localhost:3001
```

### **Step 3: Install Dependencies**

```powershell
npm install
```

### **Step 4: Start Backend Server**

Open **Terminal 1:**
```powershell
cd server
npm install
npm run dev
```

Backend runs on: `http://localhost:10000`

### **Step 5: Start Frontend**

Open **Terminal 2:**
```powershell
npm run dev
```

Frontend runs on: `http://localhost:3001`

---

## **🎯 Using the App**

### **1. Connect to GoHighLevel**

1. Open http://localhost:3001
2. Navigate to `/ghl-api`
3. Click "Connect to GoHighLevel"
4. Complete OAuth flow
5. You're connected! ✅

### **2. Build a Voice Agent**

1. Navigate to `/ghl-voice-agents`
2. Click "Create Agent"
3. Configure:
   - Voice settings (ElevenLabs)
   - Conversation scripts
   - Intents and rules
   - Compliance settings
4. Save your agent

### **3. Test Voices**

1. Go to `/voice-testing`
2. Select a voice provider
3. Choose a voice
4. Enter test text
5. Generate and play audio

### **4. Deploy Your Agent**

1. Click "Deploy" on your agent
2. Agent deploys to GHL automatically
3. Get deployment ID
4. Status updates in real-time

### **5. Send SMS**

1. Navigate to `/sms-messaging`
2. Select a contact
3. Compose message
4. Send SMS
5. Track status

---

## **📊 Available Modules**

### **Core Features:**
- `/voice-agents` - Build voice agents
- `/voice-testing` - Test voices
- `/ghl-voice-agents` - GHL-specific agents
- `/agent-dashboard` - Monitor agents
- `/call-analytics` - View analytics
- `/sms-messaging` - Send SMS
- `/ghl-contact-sync` - Manage contacts
- `/webhook-config` - Configure webhooks
- `/performance` - System metrics
- `/export` - Export data

### **GHL Integration:**
- `/ghl-api` - Connect to GHL
- `/ghl-workflows` - Create workflows
- `/ghl-campaigns` - Campaign management
- `/ghl-analytics` - Advanced analytics
- `/ghl-deployer` - Deploy agents

---

## **🔗 Backend API**

Base URL: `http://localhost:10000`

### **Available Endpoints:**

**Auth:**
```
GET /auth/ghl                 - Start OAuth
GET /auth/callback            - OAuth callback
GET /api/tokens/latest        - Get tokens
```

**Voice AI:**
```
POST /api/voice-ai/deploy     - Deploy agent
GET  /api/voice-ai/agents     - List agents
GET  /api/voice-ai/agents/:id - Get agent
```

**Contacts:**
```
GET  /api/ghl/contacts        - Get contacts
POST /api/ghl/contacts/upsert - Create/update
POST /api/ghl/conversations/messages - Send SMS
```

**Health:**
```
GET /health                   - Health check
```

---

## **⚡ Quick Commands**

### **Start Everything:**
```powershell
# Start backend
cd server && npm run dev

# Start frontend (new terminal)
npm run dev
```

### **Stop Servers:**
Press `Ctrl+C` in each terminal

### **View Logs:**
Check terminal output for errors or success messages

---

## **🐛 Troubleshooting**

### **Port Already in Use:**
```powershell
# Kill process on port 10000
netstat -ano | findstr :10000
taskkill /PID <PID> /F

# Kill process on port 3001
netstat -ano | findstr :3001  
taskkill /PID <PID> /F
```

### **Module Not Found:**
```powershell
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### **Backend Not Starting:**
```powershell
# Check if .env exists
Test-Path .env

# Install server dependencies
cd server
npm install
```

---

## **📚 Next Steps**

1. ✅ Start the app
2. ✅ Connect to GHL
3. ✅ Build your first agent
4. ✅ Test voices
5. ✅ Deploy to production

See [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) for deployment.

---

## **🎉 You're Ready!**

The app is fully functional and ready to use. Happy building! 🚀

