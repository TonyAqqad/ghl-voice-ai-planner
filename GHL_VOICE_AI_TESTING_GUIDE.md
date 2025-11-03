# 🎯 **GHL Voice AI Testing Guide - Complete Setup**

## **🚀 Quick Start Testing Process**

### **Step 1: Environment Setup**
1. **Create `.env` file in `server/` directory:**
```bash
# Copy from env.example and fill in your actual values
cp server/env.example server/.env
```

2. **Required Environment Variables:**
```env
# GHL OAuth Configuration
GHL_CLIENT_ID=68fd461dc407410f0f0c0cb1-mh6umpou
GHL_CLIENT_SECRET=your_actual_secret_here
GHL_REDIRECT_URI=https://ghlvoiceai.captureclient.com/auth/callback
GHL_WEBHOOK_SECRET=your_webhook_secret_here

# AI Provider API Keys
ELEVENLABS_API_KEY=your_elevenlabs_key_here
OPENAI_API_KEY=your_openai_key_here

# Server Configuration
PORT=10000
NODE_ENV=production
```

### **Step 2: Start Backend Server**
```bash
cd server
npm install
node ghl-express-api.js
```

### **Step 3: Start Frontend**
```bash
# In new terminal
npm install
npm run dev
```

---

## **🔗 GHL OAuth Connection Test**

### **1. Connect to GHL**
- **URL:** `https://ghlvoiceai.captureclient.com/auth/ghl`
- **Expected:** Redirects to GHL OAuth page
- **Action:** Authorize the app
- **Result:** Redirects back with tokens stored

### **2. Verify Connection**
- **URL:** `https://ghlvoiceai.captureclient.com/api/auth/status`
- **Expected:** `{"connected": true, "locationId": "xxx"}`

---

## **🤖 Voice AI Agent Testing**

### **Method 1: AI-Generated Agent (Recommended)**

1. **Open Voice AI Deployer:**
   - Navigate to: `http://localhost:3001/voice-ai-deployer`
   - Click **"Generate with AI"** button

2. **Fill AI Generation Form:**
   ```json
   Business Description: "We are a premium fitness studio offering HIIT classes, personal training, and nutrition coaching. We want to capture leads, book classes, and answer common questions about our services."
   
   Industry: "Fitness & Wellness"
   Business Type: "Fitness Studio"
   ```

3. **AI Will Generate:**
   - Custom system prompt
   - Conversation scripts
   - Intents and responses
   - Knowledge base
   - Voice settings

4. **Deploy Agent:**
   - Review generated configuration
   - Click **"Deploy Agent"**
   - Monitor deployment status

### **Method 2: Template-Based Agent**

1. **Use Pre-built Templates:**
   - F45 Training template
   - Restaurant template
   - Gracie Barra template

2. **Customize Template:**
   - Modify business-specific details
   - Update contact information
   - Adjust voice settings

3. **Deploy from Template:**
   - Click **"Generate from Template"**
   - Select template
   - Deploy to GHL

### **Method 3: Manual Configuration**

1. **Manual Agent Setup:**
   - Name: "Test Voice Agent"
   - Description: "Test agent for GHL integration"
   - Voice: Select from ElevenLabs voices
   - System Prompt: Custom prompt

2. **Add Custom Actions:**
   - Lead capture
   - Appointment booking
   - FAQ responses

---

## **📞 Live Testing Process**

### **1. Deploy Agent to GHL**
```bash
# API Call to deploy
curl -X POST https://ghlvoiceai.captureclient.com/api/voice-ai/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "description": "Test voice agent",
    "voice": "21m00Tzpb8x4C1GBRz8M",
    "systemPrompt": "You are a helpful assistant...",
    "phoneNumbers": ["+1234567890"]
  }'
```

### **2. Assign Phone Number**
- Go to GHL Dashboard
- Navigate to Voice AI section
- Assign phone number to your agent
- Configure routing rules

### **3. Test Call Flow**
1. **Call the assigned number**
2. **Expected Flow:**
   - Agent answers professionally
   - Captures lead information
   - Books appointment (if applicable)
   - Transfers to human (if needed)

### **4. Monitor Real-Time**
- Open Real-Time Agent Monitor
- Watch live call status
- View transcript updates
- Monitor performance metrics

---

## **🔧 Custom Actions Testing**

### **1. Create Custom Action**
```bash
curl -X POST https://ghlvoiceai.captureclient.com/api/voice-ai/agents/{agentId}/custom-actions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "book_appointment",
    "description": "Book fitness class appointment",
    "url": "https://ghlvoiceai.captureclient.com/api/webhooks/book-appointment",
    "method": "POST",
    "headers": {"Content-Type": "application/json"},
    "body": {
      "contactId": "{{contact_id}}",
      "appointmentType": "{{appointment_type}}",
      "preferredTime": "{{preferred_time}}"
    }
  }'
```

### **2. Test Custom Action**
- Trigger during voice call
- Verify webhook receives data
- Check GHL contact updates

---

## **📊 Analytics & Cost Monitoring**

### **1. View Cost Dashboard**
- Navigate to Cost Optimization
- Select deployed agent
- View real-time costs
- Check daily/monthly estimates

### **2. Monitor Performance**
- Call volume metrics
- Average call duration
- Success rates
- Cost per lead

---

## **🚨 Troubleshooting Common Issues**

### **Issue 1: OAuth Connection Fails**
**Symptoms:** 401 errors, token expired
**Solution:**
```bash
# Check token status
curl https://ghlvoiceai.captureclient.com/api/auth/status

# Re-authenticate if needed
# Visit: https://ghlvoiceai.captureclient.com/auth/ghl
```

### **Issue 2: Agent Deployment Fails**
**Symptoms:** 500 errors, agent not created
**Solution:**
1. Check GHL API limits
2. Verify phone number availability
3. Check webhook URL accessibility

### **Issue 3: WebSocket Connection Issues**
**Symptoms:** Real-time monitoring not working
**Solution:**
1. Check WebSocket URL: `wss://ghlvoiceai.captureclient.com/ws`
2. Verify server WebSocket support
3. Check firewall settings

### **Issue 4: Voice Quality Issues**
**Symptoms:** Robotic voice, poor quality
**Solution:**
1. Try different ElevenLabs voices
2. Adjust voice settings
3. Check audio quality settings

---

## **✅ Success Criteria**

### **Phase 1: Basic Deployment**
- [ ] OAuth connection established
- [ ] Agent deployed to GHL
- [ ] Phone number assigned
- [ ] Test call successful

### **Phase 2: Advanced Features**
- [ ] Custom actions working
- [ ] Real-time monitoring active
- [ ] Cost tracking accurate
- [ ] Webhook processing

### **Phase 3: Production Ready**
- [ ] Multiple agents deployed
- [ ] Analytics dashboard functional
- [ ] Error handling robust
- [ ] Performance optimized

---

## **🎯 Next Steps After Testing**

1. **Deploy Production Agents**
   - Use AI generation for client agents
   - Customize templates for different industries
   - Set up monitoring and alerts

2. **Scale Operations**
   - Deploy multiple agents
   - Set up cost controls
   - Implement automation workflows

3. **Client Onboarding**
   - Use platform for client deployments
   - Generate revenue from DFY services
   - Build white-label partnerships

---

## **📞 Support & Resources**

- **GHL API Docs:** https://highlevel.stoplight.io/
- **ElevenLabs Docs:** https://docs.elevenlabs.io/
- **OpenAI API Docs:** https://platform.openai.com/docs
- **Platform Status:** Check `https://ghlvoiceai.captureclient.com/health`

**Ready to test? Let's get your first Voice AI agent deployed! 🚀**
