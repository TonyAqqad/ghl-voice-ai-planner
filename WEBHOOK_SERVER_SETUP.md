# 🔗 GHL Webhook Server Setup Guide

## **🚀 Complete Webhook Integration**

This guide will help you set up a production-ready webhook server that integrates perfectly with your GHL Voice AI Planner.

### **📋 What You Need:**

1. **Webhook Server** (`webhook-server.js`) - ✅ Created
2. **Dependencies** (`webhook-package.json`) - ✅ Created  
3. **Environment Variables** - ✅ Configured
4. **GHL Webhook Configuration** - ⚠️ Needs setup

---

## **🔧 Step 1: Install Webhook Server Dependencies**

```bash
# Navigate to your project directory
cd "C:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"

# Install webhook server dependencies
npm install express cors helmet express-rate-limit dotenv nodemon --save

# Or copy the webhook-package.json and run:
cp webhook-package.json package.json
npm install
```

---

## **🔐 Step 2: Environment Variables**

Your `.env` file should already have:
```env
GHL_SHARED_SECRET=0e06d8f4-6eed-4ab7-903e-ff93e5fdd42a
```

Add these additional variables:
```env
# Webhook Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=production
```

---

## **🚀 Step 3: Start the Webhook Server**

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

**Server will start on:** `http://localhost:3001`

---

## **🔗 Step 4: Configure GHL Webhooks**

### **A. Go to GHL Developer Portal**
1. Visit: https://marketplace.leadconnectorhq.com/
2. Find your app (Client ID: `68fd461dc407410f0f0c0cb1-mh6umpou`)
3. Go to "Webhooks" section

### **B. Enable Webhook Events**
Toggle ON these events:

**Essential Voice AI Events:**
- ✅ `ContactCreate` - New leads
- ✅ `ContactUpdate` - Lead updates  
- ✅ `ContactTagUpdate` - Lead segmentation
- ✅ `AppointmentCreate` - Calendar bookings
- ✅ `AppointmentUpdate` - Appointment changes
- ✅ `InboundMessage` - Incoming messages
- ✅ `OutboundMessage` - Outgoing messages
- ✅ `OpportunityCreate` - New sales opportunities
- ✅ `OpportunityUpdate` - Opportunity changes
- ✅ `VoiceAiCallEnd` - Voice AI call completion
- ✅ `TaskCreate` - Task management
- ✅ `TaskComplete` - Task completion

### **C. Set Webhook URL**
Enter your webhook endpoint:
```
https://captureclient.com/leadconnector/webhook
```

**For local testing:**
```
http://localhost:3001/leadconnector/webhook
```

### **D. Save Configuration**
Click "Save" to activate webhooks.

---

## **🧪 Step 5: Test Webhook Integration**

### **A. Test Webhook Endpoint**
```bash
# Health check
curl http://localhost:3001/health

# Webhook status
curl http://localhost:3001/webhook/status
```

### **B. Test with GHL Events**
1. **Create a test contact** in GHL
2. **Check server logs** for webhook receipt
3. **Verify signature validation** is working

### **C. Monitor Webhook Events**
Your server will log all events:
```
🔔 Webhook received: ContactCreate
📞 New contact created: { id: "contact_123", firstName: "John" }
✅ Event ContactCreate processed successfully
```

---

## **🔒 Security Features**

### **✅ Signature Verification**
- HMAC-SHA256 validation using your shared secret
- Prevents unauthorized webhook calls
- Automatic rejection of invalid signatures

### **✅ Rate Limiting**
- 1000 requests per 15 minutes per IP
- Prevents webhook spam/abuse
- Configurable limits

### **✅ CORS Protection**
- Only allows requests from your frontend
- Configurable origin restrictions
- Secure cross-origin handling

### **✅ Helmet Security**
- Security headers for webhook endpoint
- XSS protection
- Content type validation

---

## **📊 Webhook Event Handlers**

### **Contact Events**
- `ContactCreate` → Sync new leads to your system
- `ContactUpdate` → Update lead information
- `ContactTagUpdate` → Handle lead segmentation

### **Appointment Events**
- `AppointmentCreate` → Sync calendar bookings
- `AppointmentUpdate` → Handle appointment changes
- `AppointmentDelete` → Remove cancelled appointments

### **Conversation Events**
- `InboundMessage` → Process incoming messages for Voice AI
- `OutboundMessage` → Track outgoing message delivery

### **Opportunity Events**
- `OpportunityCreate` → Sync new sales opportunities
- `OpportunityUpdate` → Update opportunity status
- `OpportunityStatusUpdate` → Handle status changes

### **Voice AI Events**
- `VoiceAiCallEnd` → Process call completion data
- Extract transcripts, duration, and call analytics
- Store Voice AI performance metrics

### **Task Events**
- `TaskCreate` → Sync new tasks
- `TaskComplete` → Handle task completion

---

## **🚀 Production Deployment**

### **A. Update Webhook URL**
Change from localhost to your production domain:
```
https://captureclient.com/leadconnector/webhook
```

### **B. Environment Variables**
```env
PORT=3001
FRONTEND_URL=https://captureclient.com
NODE_ENV=production
GHL_SHARED_SECRET=0e06d8f4-6eed-4ab7-903e-ff93e5fdd42a
```

### **C. Process Management**
```bash
# Install PM2 for process management
npm install -g pm2

# Start webhook server with PM2
pm2 start webhook-server.js --name "ghl-webhook-server"

# Save PM2 configuration
pm2 save
pm2 startup
```

---

## **🔍 Monitoring & Debugging**

### **A. Webhook Logs**
Monitor your server logs for:
- ✅ Successful webhook receipts
- ⚠️ Signature verification failures
- ❌ Processing errors

### **B. Health Checks**
```bash
# Check server health
curl https://captureclient.com/health

# Check webhook status
curl https://captureclient.com/webhook/status
```

### **C. GHL Webhook Logs**
- Check GHL developer portal for webhook delivery status
- Monitor failed webhook attempts
- Verify webhook URL is accessible

---

## **🎯 Next Steps**

1. **✅ Install dependencies** and start webhook server
2. **✅ Configure GHL webhooks** with your webhook URL
3. **✅ Test webhook integration** with sample events
4. **✅ Deploy to production** with proper domain
5. **✅ Monitor webhook performance** and logs

---

## **🆘 Troubleshooting**

### **Common Issues:**

**"Webhook not receiving events"**
- Check webhook URL is accessible
- Verify GHL webhook configuration
- Check server logs for errors

**"Signature verification failed"**
- Verify `GHL_SHARED_SECRET` is correct
- Check webhook payload format
- Ensure raw body is preserved

**"Rate limit exceeded"**
- Adjust rate limiting settings
- Check for webhook spam
- Monitor IP-based limits

---

**Your GHL Webhook Server is ready for production!** 🚀

The server will automatically process all GHL events and integrate them with your Voice AI Planner app.
