# 🎤 **GHL Voice AI Planner**

A comprehensive platform for building, deploying, and managing Voice AI agents for GoHighLevel.

---

## 🚀 **Quick Start**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend API
cd server && npm install && npm run dev
```

Visit: http://localhost:3001

---

## 📋 **Features**

### **Voice AI**
- 🤖 **Voice Agent Builder** - Create intelligent voice agents
- 🎙️ **Voice Testing Studio** - Test ElevenLabs & OpenAI voices
- 🚀 **Agent Deployment** - Deploy to production with one click
- 📊 **Analytics Dashboard** - Track performance and metrics
- 🔧 **Advanced Configuration** - Fine-tune every aspect

### **GHL Integration**
- 🔗 **OAuth Authentication** - Secure API connection
- 📱 **Contact Management** - Sync and manage contacts
- 💬 **SMS Messaging** - Send and track messages
- 🔔 **Webhook Handling** - Real-time event processing
- 🎯 **Workflow Integration** - Automate complex flows

### **Advanced Tools**
- 🎨 **Workflow Designer** - Visual workflow creation
- ✅ **Compliance Checker** - TCPA, GDPR compliance
- 📚 **Template Library** - Pre-built agent templates
- 📤 **Export Center** - Export configurations
- 📈 **Performance Monitor** - Real-time metrics

---

## 🛠️ **Tech Stack**

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **State:** Zustand with persistence
- **Routing:** React Router DOM
- **Backend:** Express.js, SQLite
- **APIs:** GoHighLevel, ElevenLabs, OpenAI

---

## 📦 **Installation**

```bash
# Clone repository
git clone <repository-url>
cd ghl-voice-ai-planner

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development
npm run dev
```

---

## 🔧 **Configuration**

### **Environment Variables**

Create a `.env` file:

```env
# GHL OAuth
GHL_CLIENT_ID=your_client_id
GHL_CLIENT_SECRET=your_client_secret
GHL_REDIRECT_URI=http://localhost:10000/auth/callback

# API Keys (Optional)
VITE_ELEVENLABS_API_KEY=your_key
VITE_OPENAI_API_KEY=your_key

# Backend
PORT=10000
FRONTEND_URL=http://localhost:3001
```

### **GHL Setup**

1. Create a GoHighLevel app
2. Configure OAuth redirect URI
3. Get client ID and secret
4. Add to `.env` file

---

## 📚 **Documentation**

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Feature List](./ULTRA_DEVELOPMENT_COMPLETE.md)

---

## 🎯 **Usage**

### **1. Connect to GHL**

Navigate to `/ghl-api` and connect your GoHighLevel account.

### **2. Build an Agent**

Use the Voice Agent Builder to create a new agent:
- Configure voice settings
- Write conversation scripts
- Set up intents and transfer rules
- Enable compliance features

### **3. Test Voice**

Go to Voice Testing Studio (`/voice-testing`):
- Select voice provider
- Choose a voice
- Enter test text
- Generate and play audio

### **4. Deploy**

Click "Deploy" on your agent:
- Agent deploys to GHL
- Phone routing configured
- Webhooks set up
- Status updated in real-time

### **5. Monitor**

View analytics and performance:
- Call analytics
- Performance metrics
- Cost tracking
- Conversion rates

---

## 📊 **Project Structure**

```
ghl-voice-ai-planner/
├── src/
│   ├── components/
│   │   ├── modules/        # 40+ feature modules
│   │   ├── layout/        # Header, Sidebar
│   │   ├── auth/          # OAuth handling
│   │   └── webhooks/      # Webhook handlers
│   ├── utils/             # API utilities
│   ├── store/             # State management
│   ├── types/             # TypeScript types
│   └── styles/            # CSS
├── server/                # Backend API
└── public/               # Static assets
```

---

## 🔗 **API Endpoints**

### **Authentication**
- `GET /auth/ghl` - Start OAuth
- `GET /auth/callback` - OAuth callback
- `GET /api/tokens/latest` - Get tokens

### **Voice AI**
- `POST /api/voice-ai/deploy` - Deploy agent
- `GET /api/voice-ai/agents` - List agents
- `GET /api/voice-ai/agents/:id` - Get agent
- `PUT /api/voice-ai/agents/:id` - Update agent
- `DELETE /api/voice-ai/agents/:id` - Delete agent

### **Contacts & Messaging**
- `GET /api/ghl/contacts` - Get contacts
- `POST /api/ghl/contacts/upsert` - Upsert contact
- `POST /api/ghl/conversations/messages` - Send SMS
- `GET /api/ghl/conversations` - Get conversations

### **Webhooks**
- `POST /api/webhooks/voice-ai` - Voice events
- `POST /api/webhooks/agent` - Agent events

---

## 🎨 **UI Modules**

| Module | Route | Description |
|--------|-------|-------------|
| Voice Agents | `/voice-agents` | Configure AI agents |
| Voice Testing | `/voice-testing` | Test voices |
| Agent Dashboard | `/agent-dashboard` | Monitor agents |
| Call Analytics | `/call-analytics` | Performance metrics |
| SMS Messaging | `/sms-messaging` | Send SMS |
| Contact Sync | `/ghl-contact-sync` | Manage contacts |
| Webhook Config | `/webhook-config` | Manage webhooks |
| Performance | `/performance` | System metrics |
| Export Center | `/export` | Export data |
| GHL API | `/ghl-api` | Connect to GHL |

---

## 🚀 **Deployment**

See [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### **Quick Deploy**

```bash
# Build for production
npm run build

# Deploy to Render/Vercel
# Follow deployment guide
```

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 **License**

MIT License - See LICENSE file for details

---

## 🆘 **Support**

For issues and questions:
- Check [documentation](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- Review [API docs](./API_DOCUMENTATION.md)
- Open an issue on GitHub

---

## 🎉 **Status**

✅ **Production Ready** - All features implemented and tested

**Built with ❤️ for GoHighLevel Voice AI**
