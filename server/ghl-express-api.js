/**
 * GHL OAuth2 Integration - Express.js Backend
 * Complete implementation based on tested Postman collection
 */

// Force IPv4-first DNS resolution to avoid ENETUNREACH on IPv6
const dns = require('dns');
dns.setDefaultResultOrder?.('ipv4first');

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

// Load environment variables with explicit path
const envPath = path.join(__dirname, '.env');
console.log('🔍 Loading environment from:', envPath);
console.log('📁 File exists:', require('fs').existsSync(envPath));

require('dotenv').config({ path: envPath });

console.log('🔍 Environment variables loaded:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
const { 
  pool,
  initializeDatabase,
  storeTokens, 
  getLatestTokens, 
  storeLocation, 
  getLocation,
  getAllLocations,
  isTokenExpired 
} = require('./database');

// Import new services
const GHLProvider = require('./providers/ghl');
const ElevenLabsProvider = require('./providers/elevenlabs');
const OpenAIProvider = require('./providers/openai');
const VoiceAIWebhookHandler = require('./webhooks/voice-ai');
const CostingService = require('./services/costing');
const TemplateService = require('./services/templates');

// Helper to make synchronous functions work in async context
const storeTokensAsync = (tokens, locationId, companyToken) => {
  try {
    return storeTokens(tokens, locationId, companyToken);
  } catch (err) {
    throw err;
  }
};

// GHL Configuration from environment variables
const GHL_CONFIG = {
  base_url: 'https://services.leadconnectorhq.com',
  auth_url: 'https://marketplace.gohighlevel.com', // GHL Marketplace OAuth URL
  // SECURITY: Never hardcode secrets - use environment variables only
  client_id: process.env.GHL_CLIENT_ID || '',
  client_secret: process.env.GHL_CLIENT_SECRET || '',
  redirect_uri: process.env.GHL_REDIRECT_URI || 'https://ghlvoiceai.captureclient.com/auth/callback',
  webhook_secret: process.env.GHL_WEBHOOK_SECRET || ''
};

const app = express();

// Initialize services
const ghlProvider = new GHLProvider(GHL_CONFIG);
const elevenLabsProvider = new ElevenLabsProvider(process.env.ELEVENLABS_API_KEY);
const openAIProvider = new OpenAIProvider(process.env.OPENAI_API_KEY);
const webhookHandler = new VoiceAIWebhookHandler(process.env.GHL_WEBHOOK_SECRET);
const costingService = new CostingService();
const templateService = new TemplateService();

// Middleware
app.use(cors());
app.use(express.json());

// API health check endpoint (keep this for API monitoring)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GHL Voice AI Platform API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/ghl-api',
      dbHealth: '/health/db',
      auth: '/auth/ghl',
      callback: '/auth/callback',
      templates: '/api/templates',
      agents: '/api/voice-ai/agents',
      demo: '/api/demo/create-agent'
    }
  });
});

// API routes - Place BEFORE static file serving
app.get('/ghl-api', (req, res) => {
  console.log('📡 /ghl-api endpoint hit');
  res.json({
    status: 'ok',
    message: 'GHL Voice AI API is running',
    timestamp: new Date().toISOString(),
    auth: {
      authUrl: '/auth/ghl',
      callback: '/auth/callback'
    },
    endpoints: [
      'GET /api/voice-ai/agents',
      'POST /api/voice-ai/agents',
      'GET /api/voice-ai/agents/:agentId',
      'PUT /api/voice-ai/agents/:agentId',
      'POST /api/voice-ai/agents/:agentId/activate',
      'POST /api/voice-ai/agents/:agentId/deactivate',
      'DELETE /api/voice-ai/agents/:agentId',
      'GET /api/elevenlabs/voices',
      'POST /api/elevenlabs/speech',
      'GET /api/templates',
      'POST /api/demo/create-agent'
    ]
  });
});

// Database health check endpoint
app.get('/health/db', async (_req, res) => {
  try {
    if (!pool || typeof pool.query !== 'function') {
      return res.status(503).json({ 
        ok: false, 
        error: 'Database pool not initialized',
        code: 'POOL_NOT_INITIALIZED'
      });
    }
    const r = await pool.query('select now() as ts');
    res.json({ ok: true, ts: r.rows[0].ts });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, code: e.code });
  }
});

// Note: Static file serving and React Router handler will be set up
// AFTER all routes are registered (see async initialization below)

// ===== STEP 1: GET AUTHORIZATION CODE =====
app.get('/auth/ghl', (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  
  // Essential scopes for Voice AI functionality
  const scope = 'voice-ai-agents.readonly voice-ai-agents.write conversations.readonly conversations.write contacts.readonly contacts.write workflows.readonly phonenumbers.read voice-ai-dashboard.readonly voice-ai-agent-goals.readonly voice-ai-agent-goals.write knowledge-bases.write knowledge-bases.readonly conversation-ai.readonly conversation-ai.write agent-studio.readonly agent-studio.write locations.readonly locations/customFields.readonly locations/customFields.write locations/customValues.readonly locations/customValues.write';
  
  // Try direct GHL OAuth URL (alternative to marketplace)
  const authUrl = `https://gohighlevel.com/oauth/chooselocation?` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(GHL_CONFIG.redirect_uri)}&` +
    `client_id=${GHL_CONFIG.client_id}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;
  
  console.log('🔗 Redirecting to GHL OAuth:', authUrl);
  res.redirect(authUrl);
});

// ===== STEP 2: EXCHANGE CODE FOR TOKENS =====
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  
  try {
    // Convert to URL-encoded form data
    const params = new URLSearchParams();
    params.append('client_id', GHL_CONFIG.client_id);
    params.append('client_secret', GHL_CONFIG.client_secret);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('user_type', 'Location');
    params.append('redirect_uri', GHL_CONFIG.redirect_uri);
    
    console.log('🔑 Requesting tokens with params:', {
      client_id: GHL_CONFIG.client_id,
      redirect_uri: GHL_CONFIG.redirect_uri,
      user_type: 'Location'
    });
    
    const tokenResponse = await axios.post(
      `https://services.leadconnectorhq.com/oauth/token`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );
    
    const { access_token, refresh_token } = tokenResponse.data;
    
    // Store tokens securely in database
    console.log('✅ Tokens received:', { access_token: access_token.substring(0, 20) + '...', refresh_token: refresh_token?.substring(0, 20) + '...' });
    
    try {
      await storeTokensAsync({ access_token, refresh_token });
      console.log('✅ Tokens stored in database');
    } catch (err) {
      console.error('⚠️ Failed to store tokens:', err.message);
    }
    
    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/ghl-api?connected=true`);
  } catch (error) {
    console.error('❌ OAuth error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/ghl-api?error=${encodeURIComponent(errorMsg)}`);
  }
});

// ===== STEP 3: GET LOCATION TOKEN (for sub-accounts) =====
async function getLocationToken(companyToken, locationId) {
  try {
    const response = await axios.post(
      `${GHL_CONFIG.base_url}/oauth/locationToken`,
      { locationId },
      {
        headers: {
          'Authorization': `Bearer ${companyToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Location token error:', error.response?.data);
    throw error;
  }
}

// ===== STEP 4: CREATE CUSTOM FIELD =====
async function createCustomField(locationToken, locationId, fieldName) {
  try {
    const response = await axios.post(
      `${GHL_CONFIG.base_url}/locations/${locationId}/customFields`,
      { name: fieldName, dataType: 'TEXT' },
      {
        headers: {
          'Authorization': `Bearer ${locationToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.customField.id;
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
      console.log('Custom field already exists');
      return null;
    }
    throw error;
  }
}

// ===== STEP 5: UPSERT CONTACT WITH CUSTOM FIELD =====
async function upsertContact(locationToken, locationId, contactData, customFieldId) {
  try {
    const contactPayload = {
      locationId,
      firstName: contactData.firstName,
      phone: contactData.phone
    };
    
    if (customFieldId && contactData.customFieldValue) {
      contactPayload.customFields = [
        { id: customFieldId, value: contactData.customFieldValue }
      ];
    }
    
    const response = await axios.post(
      `${GHL_CONFIG.base_url}/contacts/upsert`,
      contactPayload,
      {
        headers: {
          'Authorization': `Bearer ${locationToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.contact;
  } catch (error) {
    console.error('Upsert contact error:', error.response?.data);
    throw error;
  }
}

// ===== STEP 6: SEND SMS MESSAGE =====
async function sendSMS(locationToken, locationId, contactId, message) {
  try {
    const response = await axios.post(
      `${GHL_CONFIG.base_url}/conversations/messages`,
      {
        locationId,
        contactId,
        message,
        type: 'SMS',
        assignedTo: locationId
      },
      {
        headers: {
          'Authorization': `Bearer ${locationToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Send message error:', error.response?.data);
    throw error;
  }
}

// ===== REFRESH TOKEN =====
async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post(
      `${GHL_CONFIG.base_url}/oauth/token`,
      {
        client_id: GHL_CONFIG.client_id,
        client_secret: GHL_CONFIG.client_secret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        user_type: 'Location'
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Refresh token error:', error.response?.data);
    throw error;
  }
}

// ===== EXAMPLE: COMPLETE FLOW =====
app.post('/api/voice-ai/process-contact', async (req, res) => {
  const { phone, firstName, customFieldValue, locationId } = req.body;
  
  try {
    // Get company token (from your stored session/database)
    const companyToken = 'YOUR_STORED_COMPANY_TOKEN';
    
    // 1. Get location token
    const locationToken = await getLocationToken(companyToken, locationId);
    
    // 2. Get or create custom field
    const customFieldId = 'Z49wQv2t8wcd2yKAjs7x'; // Or create it dynamically
    
    // 3. Upsert contact with custom field
    const contact = await upsertContact(
      locationToken,
      locationId,
      { firstName, phone, customFieldValue: customFieldValue || 'Onboarded' },
      customFieldId
    );
    
    // 4. Send welcome message
    const messageResult = await sendSMS(
      locationToken,
      locationId,
      contact.id,
      'Hey! Your AI plan is ready.'
    );
    
    res.json({
      success: true,
      contact,
      messageId: messageResult.messageId,
      conversationId: messageResult.conversationId
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'GHL OAuth API' });
});

// Get latest tokens
app.get('/api/tokens/latest', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens) {
      return res.status(404).json({ error: 'No tokens found' });
    }
    
    // Check if expired
    const expired = isTokenExpired(tokens.expires_at);
    
    res.json({
      ...tokens,
      expired
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all locations
app.get('/api/locations', (req, res) => {
  try {
    const locations = getAllLocations();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get location details
app.get('/api/locations/:locationId', (req, res) => {
  try {
    const location = getLocation(req.params.locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TRAINING SYNC (Prompts/Knowledge/Q&A) =====
app.post('/api/ghl/training/sync', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const { agentId, systemPrompt, knowledgeBase, qnaPairs, customActions } = req.body || {};
    if (!agentId) return res.status(400).json({ error: 'Missing agentId' });

    // 1) Update system prompt / conversation settings
    await axios.put(
      `${GHL_CONFIG.base_url}/voice-ai/agents/${agentId}`,
      {
        conversationSettings: {
          systemPrompt: systemPrompt || ''
        },
        customActions: customActions || []
      },
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    // 2) Overwrite knowledge base (simple approach)
    if (Array.isArray(knowledgeBase)) {
      await axios.post(
        `${GHL_CONFIG.base_url}/voice-ai/agents/${agentId}/knowledge-base`,
        { items: knowledgeBase.map(text => ({ type: 'text', text })) },
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 3) Store Q&A pairs (if supported; otherwise persist via custom values)
    if (Array.isArray(qnaPairs) && qnaPairs.length > 0) {
      await axios.post(
        `${GHL_CONFIG.base_url}/voice-ai/agents/${agentId}/faqs`,
        { pairs: qnaPairs },
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        }
      ).catch(() => {}); // Some accounts may not support FAQs endpoint yet
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Training sync error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message, details: error.response?.data });
  }
});

// ===== GHL CONTACT MANAGEMENT =====

// Get contacts
app.get('/api/ghl/contacts', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const response = await axios.get(
      `${GHL_CONFIG.base_url}/contacts`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        params: req.query
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Failed to get contacts:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Upsert contact
app.post('/api/ghl/contacts/upsert', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const { locationId, ...contactData } = req.body;

    const response = await axios.post(
      `${GHL_CONFIG.base_url}/contacts/upsert`,
      { locationId, ...contactData },
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Failed to upsert contact:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get single contact
app.get('/api/ghl/contacts/:contactId', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const response = await axios.get(
      `${GHL_CONFIG.base_url}/contacts/${req.params.contactId}`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Failed to get contact:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Send SMS
app.post('/api/ghl/conversations/messages', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const response = await axios.post(
      `${GHL_CONFIG.base_url}/conversations/messages`,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Failed to send SMS:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get conversations
app.get('/api/ghl/conversations', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const response = await axios.get(
      `${GHL_CONFIG.base_url}/conversations`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        params: req.query
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Failed to get conversations:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== VOICE AI AGENT MANAGEMENT =====

// Deploy Voice AI agent to GHL
app.post('/api/voice-ai/deploy', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const agentConfig = req.body;
    console.log('🚀 Deploying Voice AI agent:', agentConfig.name);

    // Step 1: Create Voice AI agent in GHL
    const agentResponse = await axios.post(
      `${GHL_CONFIG.base_url}/voice-ai/agents`,
      {
        name: agentConfig.name,
        description: agentConfig.description,
        voiceSettings: agentConfig.voiceSettings,
        conversationSettings: agentConfig.conversationSettings,
        scripts: agentConfig.scripts,
        intents: agentConfig.intents,
        transferRules: agentConfig.transferRules,
        compliance: agentConfig.compliance
      },
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    const agentId = agentResponse.data.agent_id;
    console.log('✅ Voice AI agent created:', agentId);

    // Step 2: Configure phone number routing
    if (agentConfig.ghlIntegration?.phoneNumber) {
      await axios.post(
        `${GHL_CONFIG.base_url}/voice-ai/${agentId}/phone-numbers`,
        {
          phoneNumber: agentConfig.ghlIntegration.phoneNumber,
          routingRules: agentConfig.transferRules
        },
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Phone routing configured');
    }

    // Step 3: Set up webhooks
    if (agentConfig.ghlIntegration?.webhookUrl) {
      await axios.post(
        `${GHL_CONFIG.base_url}/voice-ai/${agentId}/webhooks`,
        {
          webhookUrl: agentConfig.ghlIntegration.webhookUrl,
          events: ['call.started', 'call.ended', 'call.analyzed']
        },
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ Webhooks configured');
    }

    // Step 4: Activate the agent
    await axios.post(
      `${GHL_CONFIG.base_url}/voice-ai/${agentId}/activate`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28'
        }
      }
    );
    console.log('✅ Agent activated');

    res.json({
      success: true,
      deploymentId: agentId,
      agentName: agentConfig.name,
      status: 'active',
      message: 'Voice AI agent deployed successfully'
    });
  } catch (error) {
    console.error('❌ Deployment error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Create Voice AI Agent
app.post('/api/voice-ai/agents', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found. Please authenticate first.' });
    }

    const agentConfig = req.body;
    
    // Validate required fields
    if (!agentConfig.name || !agentConfig.systemPrompt) {
      return res.status(400).json({ 
        error: 'Missing required fields: name and systemPrompt are required' 
      });
    }
    
    // Create agent using GHL provider
    const agent = await ghlProvider.createAgent(tokens.access_token, agentConfig);
    
    // Store agent in database
    const db = require('./database');
    await db.pool.query(
      `INSERT INTO agents (agent_id, name, description, location_id, voice_id, system_prompt, config)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        agent.id,
        agent.name,
        agent.description,
        tokens.location_id,
        agentConfig.voiceId || 'default',
        agentConfig.systemPrompt,
        JSON.stringify(agentConfig)
      ]
    );
    
    res.json({
      success: true,
      agent,
      message: 'Voice AI agent created successfully'
    });
    
  } catch (error) {
    console.error('Create agent error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create voice agent' });
  }
});

// Get deployed Voice AI agents
app.get('/api/voice-ai/agents', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found. Please authenticate first.' });
    }

    // Get agents from GHL
    const agents = await ghlProvider.listAgents(tokens.access_token);
    
    // Also get from database for additional info
    const db = require('./database');
    const dbAgents = await db.pool.query('SELECT * FROM agents ORDER BY created_at DESC');
    
    res.json({
      success: true,
      agents: agents.agents || agents,
      dbAgents: dbAgents.rows,
      message: 'Voice AI agents retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to get agents:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== ELEVENLABS INTEGRATION =====

// Get available voices from ElevenLabs
app.get('/api/elevenlabs/voices', async (req, res) => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(400).json({ error: 'ElevenLabs API key not configured' });
    }
    
    const voices = await elevenLabsProvider.getVoices();
    
    res.json({
      success: true,
      voices,
      message: 'Voices retrieved successfully'
    });
  } catch (error) {
    console.error('ElevenLabs voices error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get voices' });
  }
});

// Get voice details
app.get('/api/elevenlabs/voices/:voiceId', async (req, res) => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(400).json({ error: 'ElevenLabs API key not configured' });
    }
    
    const voice = await elevenLabsProvider.getVoice(req.params.voiceId);
    
    res.json({
      success: true,
      voice,
      message: 'Voice details retrieved successfully'
    });
  } catch (error) {
    console.error('ElevenLabs voice error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get voice details' });
  }
});

// Generate speech from text
app.post('/api/elevenlabs/speech', async (req, res) => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(400).json({ error: 'ElevenLabs API key not configured' });
    }
    
    const { text, voiceId, options } = req.body;
    
    if (!text || !voiceId) {
      return res.status(400).json({ error: 'Text and voiceId are required' });
    }
    
    const audioBuffer = await elevenLabsProvider.generateSpeech(text, voiceId, options);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length
    });
    
    res.send(audioBuffer);
  } catch (error) {
    console.error('ElevenLabs speech error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Get ElevenLabs usage and subscription info
app.get('/api/elevenlabs/usage', async (req, res) => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(400).json({ error: 'ElevenLabs API key not configured' });
    }
    
    const [subscription, usage] = await Promise.all([
      elevenLabsProvider.getUserSubscription(),
      elevenLabsProvider.getUsage()
    ]);
    
    res.json({
      success: true,
      subscription,
      usage,
      message: 'Usage information retrieved successfully'
    });
  } catch (error) {
    console.error('ElevenLabs usage error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get usage information' });
  }
});

// Get Voice AI agent details
app.get('/api/voice-ai/agents/:agentId', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found. Please authenticate first.' });
    }

    // Get agent from GHL
    const agent = await ghlProvider.getAgent(tokens.access_token, req.params.agentId);
    
    // Get from database for additional info
    const db = require('./database');
    const dbAgent = await db.pool.query(
      'SELECT * FROM agents WHERE agent_id = $1',
      [req.params.agentId]
    );
    
    res.json({
      success: true,
      agent,
      dbAgent: dbAgent.rows[0],
      message: 'Voice AI agent details retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to get agent:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update Voice AI Agent
app.put('/api/voice-ai/agents/:agentId', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found. Please authenticate first.' });
    }

    const updates = req.body;
    
    // Update agent in GHL
    const agent = await ghlProvider.updateAgent(tokens.access_token, req.params.agentId, updates);
    
    // Update in database
    const db = require('./database');
    await db.pool.query(
      `UPDATE agents 
       SET name = $1, description = $2, system_prompt = $3, config = $4, updated_at = CURRENT_TIMESTAMP
       WHERE agent_id = $5`,
      [
        updates.name,
        updates.description,
        updates.systemPrompt,
        JSON.stringify(updates),
        req.params.agentId
      ]
    );
    
    res.json({
      success: true,
      agent,
      message: 'Voice AI agent updated successfully'
    });
    
  } catch (error) {
    console.error('Update agent error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update voice agent' });
  }
});

// Activate Voice AI Agent
app.post('/api/voice-ai/agents/:agentId/activate', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found. Please authenticate first.' });
    }

    // Activate agent in GHL
    const result = await ghlProvider.activateAgent(tokens.access_token, req.params.agentId);
    
    res.json({
      success: true,
      result,
      message: 'Voice AI agent activated successfully'
    });
    
  } catch (error) {
    console.error('Activate agent error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to activate voice agent' });
  }
});

// Deactivate Voice AI Agent
app.post('/api/voice-ai/agents/:agentId/deactivate', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found. Please authenticate first.' });
    }

    // Deactivate agent in GHL
    const result = await ghlProvider.deactivateAgent(tokens.access_token, req.params.agentId);
    
    res.json({
      success: true,
      result,
      message: 'Voice AI agent deactivated successfully'
    });
    
  } catch (error) {
    console.error('Deactivate agent error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to deactivate voice agent' });
  }
});

// Delete Voice AI Agent
app.delete('/api/voice-ai/agents/:agentId', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found. Please authenticate first.' });
    }

    // Delete agent from GHL
    await ghlProvider.deleteAgent(tokens.access_token, req.params.agentId);
    
    // Delete from database
    const db = require('./database');
    await db.pool.query('DELETE FROM agents WHERE agent_id = $1', [req.params.agentId]);
    
    res.json({
      success: true,
      message: 'Voice AI agent deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete agent error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to delete voice agent' });
  }
});

// ===== GHL API ENDPOINT =====

// Main GHL API endpoint for frontend integration
app.get('/ghl-api', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    
    if (!tokens) {
      return res.status(401).json({ 
        error: 'No tokens found. Please authenticate first.',
        authUrl: `${process.env.FRONTEND_URL || 'https://ghlvoiceai.captureclient.com'}/auth/ghl`
      });
    }
    
    // Get basic platform info
    const platformInfo = {
      status: 'connected',
      locationId: tokens.location_id,
      hasTokens: true,
      tokenExpiresAt: tokens.expires_at,
      isExpired: isTokenExpired(tokens.expires_at),
      endpoints: {
        agents: '/api/voice-ai/agents',
        templates: '/api/templates',
        voices: '/api/elevenlabs/voices',
        demo: '/api/demo/create-agent'
      }
    };
    
    res.json({
      success: true,
      platform: platformInfo,
      message: 'GHL Voice AI Platform is connected and ready'
    });
    
  } catch (error) {
    console.error('GHL API error:', error.message);
    res.status(500).json({ 
      error: 'Failed to connect to GHL API',
      details: error.message
    });
  }
});

// ===== DEMO AGENT CREATION =====

// Create Demo Voice AI Agent for Testing
app.post('/api/demo/create-agent', async (req, res) => {
  try {
    const tokens = await getLatestTokens();
    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found. Please authenticate first.' });
    }

    // Demo agent configuration
    const demoAgentConfig = {
      name: 'Demo Sales Assistant',
      description: 'AI-powered sales assistant for lead qualification and appointment booking',
      systemPrompt: `You are a professional sales assistant for a digital marketing agency. Your role is to:

1. Greet callers warmly and professionally
2. Qualify leads by asking about their business needs
3. Identify pain points in their current marketing
4. Schedule appointments for qualified prospects
5. Handle objections professionally
6. Transfer complex technical questions to human agents

Key talking points:
- We help businesses increase their online presence
- We specialize in Google Ads, Facebook Ads, and SEO
- We offer free consultations and audits
- We work with businesses of all sizes

Always be helpful, professional, and focused on understanding their needs first before pitching our services.`,
      voiceId: 'rachel', // ElevenLabs voice
      voiceSettings: {
        provider: 'elevenlabs',
        voiceId: 'rachel',
        speed: 1.0,
        stability: 0.7,
        similarityBoost: 0.8
      },
      conversationSettings: {
        temperature: 0.7,
        maxTokens: 1000,
        model: 'gpt-4'
      },
      scripts: {
        greeting: 'Hello! Thank you for calling our digital marketing agency. I\'m here to help you grow your business online. How can I assist you today?',
        main: 'I understand you\'re looking to improve your online presence. Can you tell me a bit about your current business and what marketing challenges you\'re facing?',
        fallback: 'I apologize, I didn\'t quite catch that. Could you please repeat what you said?',
        transfer: 'Let me transfer you to one of our marketing specialists who can provide more detailed information about our services.',
        goodbye: 'Thank you for calling! We look forward to helping you grow your business. Have a wonderful day!'
      },
      intents: [
        {
          name: 'schedule_appointment',
          phrases: ['schedule', 'book', 'appointment', 'meeting', 'consultation'],
          action: 'schedule_appointment'
        },
        {
          name: 'pricing_inquiry',
          phrases: ['price', 'cost', 'how much', 'pricing', 'rates'],
          action: 'provide_pricing_info'
        },
        {
          name: 'service_inquiry',
          phrases: ['services', 'what do you do', 'help', 'marketing'],
          action: 'explain_services'
        },
        {
          name: 'transfer_request',
          phrases: ['speak to someone', 'human', 'manager', 'transfer'],
          action: 'transfer_to_human'
        }
      ],
      transferRules: [
        {
          condition: 'complex_technical_question',
          action: 'transfer_to_technical_specialist'
        },
        {
          condition: 'complaint_or_issue',
          action: 'transfer_to_customer_service'
        }
      ],
      compliance: {
        tcpaCompliant: true,
        recordingConsent: true,
        optOutOption: true
      }
    };
    
    // Create agent using GHL provider
    const agent = await ghlProvider.createAgent(tokens.access_token, demoAgentConfig);
    
    // Store agent in database
    const db = require('./database');
    await db.pool.query(
      `INSERT INTO agents (agent_id, name, description, location_id, voice_id, system_prompt, config)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        agent.id,
        agent.name,
        agent.description,
        tokens.location_id,
        demoAgentConfig.voiceId,
        demoAgentConfig.systemPrompt,
        JSON.stringify(demoAgentConfig)
      ]
    );
    
    // Set up webhooks for the agent
    try {
      await ghlProvider.setupWebhooks(tokens.access_token, agent.id, {
        webhookUrl: `${process.env.FRONTEND_URL || 'https://ghlvoiceai.captureclient.com'}/api/webhooks/voice-ai`,
        events: ['call.started', 'call.ended', 'call.analyzed', 'transcript.generated']
      });
    } catch (webhookError) {
      console.log('Webhook setup failed (this is okay for demo):', webhookError.message);
    }
    
    res.json({
      success: true,
      agent,
      message: 'Demo voice AI agent created successfully!',
      nextSteps: [
        'Agent is ready for testing',
        'Visit your GHL dashboard to see the agent',
        'Configure phone number routing',
        'Test with a real phone call'
      ]
    });
    
  } catch (error) {
    console.error('Create demo agent error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create demo voice agent' });
  }
});

// ===== LIVE TESTING ENDPOINTS =====

// Test Agent with Sample Conversation
app.post('/api/demo/test-conversation', async (req, res) => {
  try {
    const { message, agentId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Simulate conversation with the agent
    const response = await openAIProvider.generateResponse(message, {
      systemPrompt: 'You are a professional sales assistant for a digital marketing agency.',
      temperature: 0.7,
      maxTokens: 200
    });
    
    res.json({
      success: true,
      userMessage: message,
      agentResponse: response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test conversation error:', error.message);
    res.status(500).json({ error: 'Failed to test conversation' });
  }
});

// Get Agent Performance Stats
app.get('/api/demo/agent-stats/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Get cost data from database
    const db = require('./database');
    const costData = await db.pool.query(
      'SELECT * FROM cost_entries WHERE agent_id = $1 ORDER BY timestamp DESC LIMIT 100',
      [agentId]
    );
    
    // Calculate stats
    const totalCost = costData.rows.reduce((sum, entry) => sum + parseFloat(entry.cost), 0);
    const callCount = costData.rows.filter(entry => entry.type === 'call').length;
    const avgCostPerCall = callCount > 0 ? totalCost / callCount : 0;
    
    res.json({
      success: true,
      stats: {
        totalCalls: callCount,
        totalCost: totalCost.toFixed(4),
        avgCostPerCall: avgCostPerCall.toFixed(4),
        lastUpdated: new Date().toISOString(),
        costBreakdown: {
          calls: costData.rows.filter(entry => entry.type === 'call').length,
          llmInput: costData.rows.filter(entry => entry.type === 'llm_input').length,
          llmOutput: costData.rows.filter(entry => entry.type === 'llm_output').length,
          tts: costData.rows.filter(entry => entry.type === 'tts').length
        }
      }
    });
    
  } catch (error) {
    console.error('Get agent stats error:', error.message);
    res.status(500).json({ error: 'Failed to get agent stats' });
  }
});

// Update Voice AI agent
app.put('/api/voice-ai/agents/:agentId', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const response = await axios.put(
      `${GHL_CONFIG.base_url}/voice-ai/agents/${req.params.agentId}`,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Failed to update agent:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete Voice AI agent
app.delete('/api/voice-ai/agents/:agentId', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    await axios.delete(
      `${GHL_CONFIG.base_url}/voice-ai/agents/${req.params.agentId}`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28'
        }
      }
    );

    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Failed to delete agent:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== ENHANCED VOICE AI AGENT MANAGEMENT =====

// Create Voice AI agent with full configuration
app.post('/api/voice-ai/agents', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const agentConfig = req.body;
    console.log('🚀 Creating Voice AI agent:', agentConfig.name);

    // Create agent in GHL
    const agent = await ghlProvider.createAgent(tokens.access_token, agentConfig);
    
    // Record creation cost
    costingService.recordCost({
      agentId: agent.agent_id,
      type: 'agent_creation',
      provider: 'ghl',
      cost: 0, // No direct cost for creation
      metadata: { action: 'create' }
    });

    res.json({
      success: true,
      agentId: agent.agent_id,
      agent: agent,
      message: 'Voice AI agent created successfully'
    });
  } catch (error) {
    console.error('❌ Create agent error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// Get Voice AI agent with full details
app.get('/api/voice-ai/agents/:agentId', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const agent = await ghlProvider.getAgent(tokens.access_token, req.params.agentId);
    res.json(agent);
  } catch (error) {
    console.error('Failed to get agent:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update Voice AI agent
app.put('/api/voice-ai/agents/:agentId', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const updates = req.body;
    const agent = await ghlProvider.updateAgent(tokens.access_token, req.params.agentId, updates);
    
    res.json({
      success: true,
      agent: agent,
      message: 'Agent updated successfully'
    });
  } catch (error) {
    console.error('Failed to update agent:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete Voice AI agent
app.delete('/api/voice-ai/agents/:agentId', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    await ghlProvider.deleteAgent(tokens.access_token, req.params.agentId);
    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Failed to delete agent:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add custom action to agent
app.post('/api/voice-ai/agents/:agentId/custom-actions', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const customAction = req.body;
    const result = await ghlProvider.addCustomAction(tokens.access_token, req.params.agentId, customAction);
    
    res.json({
      success: true,
      customAction: result,
      message: 'Custom action added successfully'
    });
  } catch (error) {
    console.error('Failed to add custom action:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get custom actions for agent
app.get('/api/voice-ai/agents/:agentId/custom-actions', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const customActions = await ghlProvider.getCustomActions(tokens.access_token, req.params.agentId);
    res.json(customActions);
  } catch (error) {
    console.error('Failed to get custom actions:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update custom action
app.put('/api/voice-ai/agents/:agentId/custom-actions/:actionId', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const updates = req.body;
    const result = await ghlProvider.updateCustomAction(tokens.access_token, req.params.agentId, req.params.actionId, updates);
    
    res.json({
      success: true,
      customAction: result,
      message: 'Custom action updated successfully'
    });
  } catch (error) {
    console.error('Failed to update custom action:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete custom action
app.delete('/api/voice-ai/agents/:agentId/custom-actions/:actionId', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    await ghlProvider.deleteCustomAction(tokens.access_token, req.params.agentId, req.params.actionId);
    res.json({ success: true, message: 'Custom action deleted successfully' });
  } catch (error) {
    console.error('Failed to delete custom action:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create workflow with transcript trigger
app.post('/api/workflows', async (req, res) => {
  try {
    const tokens = getLatestTokens();
    if (!tokens || tokens.expired) {
      return res.status(401).json({ error: 'No valid tokens' });
    }

    const workflowConfig = req.body;
    const workflow = await ghlProvider.createWorkflow(tokens.access_token, workflowConfig);
    
    res.json({
      success: true,
      workflow: workflow,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    console.error('Failed to create workflow:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== AI-ASSISTED AGENT GENERATION =====

// Generate agent from business description
app.post('/api/voice-ai/generate', async (req, res) => {
  try {
    const { businessDescription, industry, businessType, customizations = {} } = req.body;
    
    if (!businessDescription || !industry) {
      return res.status(400).json({ error: 'Business description and industry are required' });
    }

    console.log('🤖 Generating AI agent for:', industry, businessType);

    // Generate system prompt
    const systemPrompt = await openAIProvider.generateSystemPrompt(businessDescription, industry);
    
    // Generate scripts
    const scripts = await openAIProvider.generateScripts(businessType, industry);
    
    // Generate intents
    const intents = await openAIProvider.generateIntents(businessDescription, industry);
    
    // Generate knowledge base
    const knowledgeBase = await openAIProvider.generateKnowledgeBase(businessDescription, industry);

    // Calculate costs
    const promptCost = openAIProvider.estimateCost(systemPrompt);
    const scriptsCost = openAIProvider.estimateCost(scripts);
    const intentsCost = openAIProvider.estimateCost(intents);
    const kbCost = openAIProvider.estimateCost(knowledgeBase);
    const totalCost = promptCost + scriptsCost + intentsCost + kbCost;

    const agentConfig = {
      name: `${industry} Voice Agent - ${new Date().toISOString().split('T')[0]}`,
      description: `AI-generated voice agent for ${industry} business`,
      industry,
      businessType,
      voiceSettings: {
        provider: 'elevenlabs',
        voiceId: 'default',
        speed: 1.0,
        stability: 0.5
      },
      conversationSettings: {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1000
      },
      scripts: {
        greeting: 'Hello! How can I help you today?',
        main: scripts,
        fallback: 'I apologize, I didn\'t understand that. Could you please rephrase?',
        transfer: 'Let me transfer you to a human agent who can better assist you.',
        goodbye: 'Thank you for calling. Have a great day!'
      },
      intents: JSON.parse(intents),
      knowledgeBase: JSON.parse(knowledgeBase),
      compliance: {
        tcpaCompliant: true,
        recordingConsent: true
      },
      ...customizations
    };

    res.json({
      success: true,
      agentConfig,
      costs: {
        promptGeneration: promptCost,
        scriptsGeneration: scriptsCost,
        intentsGeneration: intentsCost,
        knowledgeBaseGeneration: kbCost,
        total: totalCost
      },
      message: 'AI agent configuration generated successfully'
    });
  } catch (error) {
    console.error('❌ AI generation error:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// ===== TEMPLATE MANAGEMENT =====

// Get all templates
app.get('/api/templates', (req, res) => {
  try {
    const templates = templateService.getAllTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template by ID
app.get('/api/templates/:templateId', (req, res) => {
  try {
    const template = templateService.getTemplate(req.params.templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
app.post('/api/templates', (req, res) => {
  try {
    const { agentConfig, metadata } = req.body;
    const template = templateService.createTemplate(agentConfig, metadata);
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate agent from template
app.post('/api/templates/:templateId/generate', (req, res) => {
  try {
    const { customizations } = req.body;
    const agentConfig = templateService.generateAgentConfig(req.params.templateId, customizations);
    res.json(agentConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== COSTING & ANALYTICS =====

// Get agent costs
app.get('/api/voice-ai/agents/:agentId/costs', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const costs = costingService.getAgentCosts(req.params.agentId, start, end);
    const total = costingService.getAgentTotalCost(req.params.agentId, start, end);
    
    res.json({
      costs,
      total,
      period: { startDate: start, endDate: end }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cost analytics
app.get('/api/voice-ai/agents/:agentId/analytics', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const analytics = costingService.getCostAnalytics(req.params.agentId, start, end);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily cost breakdown
app.get('/api/voice-ai/agents/:agentId/costs/daily', (req, res) => {
  try {
    const { days = 30 } = req.query;
    const breakdown = costingService.getDailyCostBreakdown(req.params.agentId, parseInt(days));
    res.json(breakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estimate monthly cost
app.post('/api/voice-ai/agents/:agentId/costs/estimate', (req, res) => {
  try {
    const { projectedCalls, averageCallDuration } = req.body;
    const estimate = costingService.estimateMonthlyCost(req.params.agentId, projectedCalls, averageCallDuration);
    res.json(estimate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== WEBHOOK HANDLERS =====

// Enhanced GHL Voice AI webhook endpoint
app.post('/api/webhooks/voice-ai', async (req, res) => {
  try {
    const event = req.body;
    const signature = req.headers['x-ghl-signature'];
    
    // Verify webhook signature
    if (!webhookHandler.verifySignature(JSON.stringify(event), signature)) {
      console.warn('⚠️ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    console.log('📞 Voice AI event received:', event.type);
    
    // Process event
    const result = await webhookHandler.processEvent(event);
    
    // Record costs if applicable
    if (event.type === 'call.ended' && event.duration) {
      costingService.recordCost({
        agentId: event.agent_id,
        callId: event.call_id,
        type: 'call',
        provider: 'ghl',
        usage: event.duration,
        rate: 0.17, // $0.17 per minute (voice + phone)
        cost: event.duration * 0.17
      });
    }
    
    res.json({ status: 'processed', result });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Voice AI agent webhook
app.post('/api/webhooks/agent', async (req, res) => {
  try {
    const data = req.body;
    console.log('🤖 Agent event:', data);
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Agent webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;

// Initialize database and start server
(async () => {
  try {
    console.log('🚀 Starting GHL Voice AI Server...');
    
    // Check environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    console.log('📊 Environment check:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   GHL_CLIENT_ID: ${process.env.GHL_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   GHL_CLIENT_SECRET: ${process.env.GHL_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
    
    // Initialize database tables
    await initializeDatabase();
    console.log('✅ Database connected and initialized');
    
    // Serve static files from the frontend build
    // Try multiple possible paths since Render build location may vary
    const fs = require('fs');
    
    console.log(`📁 Current working directory: ${process.cwd()}`);
    console.log(`📁 Server __dirname: ${__dirname}`);
    
    // First, let's see what's actually in the parent directory
    const parentDir = path.join(__dirname, '..');
    console.log(`📁 Parent directory: ${parentDir}`);
    try {
      const parentContents = fs.readdirSync(parentDir);
      console.log(`📁 Parent directory contents (${parentContents.length} items):`);
      parentContents.forEach((item, idx) => {
        const itemPath = path.join(parentDir, item);
        const isDir = fs.statSync(itemPath).isDirectory();
        console.log(`   ${idx + 1}. ${item}${isDir ? ' [DIR]' : ''}`);
      });
    } catch (e) {
      console.log(`⚠️  Could not read parent directory: ${e.message}`);
    }
    
    // Build list of possible paths to check
    const possiblePaths = [
      path.join(__dirname, '..', 'dist'),        // Standard: ../dist from server
      path.join(parentDir, 'dist'),              // Explicit parent/dist
      '/opt/render/project/src/dist',            // Absolute Render path
      '/opt/render/project/dist',                // Alternative Render path
      path.join(process.cwd(), '..', 'dist'),    // One level up from CWD
      path.join(process.cwd(), 'dist'),         // From current working directory
    ];
    
    // Remove duplicates
    const uniquePaths = [...new Set(possiblePaths)];
    
    let frontendDistPath = null;
    
    console.log(`\n🔍 Checking ${uniquePaths.length} possible dist locations:`);
    // Try each possible path
    for (const testPath of uniquePaths) {
      const normalizedPath = path.resolve(testPath);
      console.log(`   Checking: ${normalizedPath}`);
      try {
        if (fs.existsSync(normalizedPath)) {
          const indexPath = path.join(normalizedPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            frontendDistPath = normalizedPath;
            console.log(`   ✅ FOUND! Dist folder with index.html at: ${normalizedPath}`);
            break;
          } else {
            console.log(`   └─ Path exists but no index.html inside`);
            // List what IS in there
            try {
              const contents = fs.readdirSync(normalizedPath).slice(0, 5);
              console.log(`      Contents: ${contents.join(', ')}...`);
            } catch (e) {}
          }
        } else {
          console.log(`   └─ Not found`);
        }
      } catch (e) {
        console.log(`   └─ Error checking path: ${e.message}`);
      }
    }
    
    // Serve static files if found
    if (frontendDistPath) {
      try {
        const distContents = fs.readdirSync(frontendDistPath);
        console.log(`✅ Dist folder contents:`, distContents.slice(0, 10).join(', ') + (distContents.length > 10 ? '...' : ''));
        
        app.use(express.static(frontendDistPath, {
          maxAge: '1y', // Cache static assets for 1 year
          etag: true
        }));
        console.log('✅ Static file serving enabled');
      } catch (e) {
        console.log(`⚠️  Error serving dist folder:`, e.message);
        frontendDistPath = null;
      }
    } else {
      console.log('⚠️  Frontend dist folder not found in any location');
      console.log('⚠️  App will serve API only until build completes');
      console.log('⚠️  Make sure "npm run build" completes successfully in Render build logs');
    }
    
    // For all non-API routes, serve the React app (handles React Router)
    // This MUST be the very last route handler
    app.get('*', (req, res) => {
      // Skip API routes - these should have been handled already
      if (req.path.startsWith('/api/') || 
          req.path.startsWith('/auth/') || 
          req.path.startsWith('/health/') || 
          req.path.startsWith('/ghl-api')) {
        return res.status(404).json({
          error: 'Route not found',
          path: req.path
        });
      }
      
      // Serve index.html for all other routes (React Router handles client-side routing)
      if (!frontendDistPath) {
        return res.json({
          status: 'ok',
          message: 'GHL Voice AI Platform API is running',
          note: 'Frontend app not found. Please ensure "npm run build" completes successfully.',
          apiEndpoints: {
            health: '/api/health',
            dbHealth: '/health/db',
            auth: '/auth/ghl',
            templates: '/api/templates'
          }
        });
      }
      
      const indexPath = path.join(frontendDistPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.log(`⚠️  Error serving index.html: ${err.message}`);
          res.json({
            status: 'ok',
            message: 'GHL Voice AI Platform API is running',
            note: 'Frontend index.html not found. Please check build logs.',
            apiEndpoints: {
              health: '/api/health',
              dbHealth: '/health/db',
              auth: '/auth/ghl',
              templates: '/api/templates'
            }
          });
        } else {
          console.log(`✅ Served React app for: ${req.path}`);
        }
      });
    });
    
    // List all registered routes for debugging
    const routes = [];
    app._router?.stack?.forEach((middleware) => {
      if (middleware.route) {
        routes.push(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
      }
    });
    console.log(`📋 Registered routes: ${routes.length} routes`);
    routes.forEach(route => console.log(`   ${route}`));
    console.log(`🎨 React app will be served for all non-API routes`);
    
    // Start server
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 GHL OAuth API Server running on port ${PORT}`);
      console.log(`📡 Auth endpoint: http://localhost:${PORT}/auth/ghl`);
      console.log(`✅ Callback: http://localhost:${PORT}/auth/callback`);
      console.log(`💾 Database: PostgreSQL (Supabase)`);
      console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
      console.log(`🔗 API Status: http://localhost:${PORT}/ghl-api`);
      console.log(`🏠 Root endpoint: http://localhost:${PORT}/`);
      console.log(`📊 Available routes:`);
      console.log(`   GET / - Health check`);
      console.log(`   GET /ghl-api - API status`);
      console.log(`   GET /health/db - Database health`);
      console.log(`   GET /auth/ghl - OAuth start`);
      console.log(`   GET /auth/callback - OAuth callback`);
      console.log(`   GET /api/templates - Templates`);
      console.log(`   GET /api/voice-ai/agents - List agents`);
      console.log(`   POST /api/demo/create-agent - Create demo agent`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  }
})();

// Export functions
module.exports = {
  getLocationToken,
  createCustomField,
  upsertContact,
  sendSMS,
  refreshAccessToken
};
