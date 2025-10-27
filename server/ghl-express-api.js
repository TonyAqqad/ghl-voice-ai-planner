/**
 * GHL OAuth2 Integration - Express.js Backend
 * Complete implementation based on tested Postman collection
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// GHL Configuration from environment variables
const GHL_CONFIG = {
  base_url: 'https://services.leadconnectorhq.com',
  auth_url: 'https://marketplace.gohighlevel.com', // Correct OAuth authorization URL
  client_id: process.env.GHL_CLIENT_ID || '68fd461dc407410f0f0c0cb1-mh6umpou',
  client_secret: process.env.GHL_CLIENT_SECRET || '',
  redirect_uri: process.env.GHL_REDIRECT_URI || 'https://ghlvoiceai.captureclient.com/auth/callback'
};

// ===== STEP 1: GET AUTHORIZATION CODE =====
app.get('/auth/ghl', (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  
  // Using the exact scopes from your working OAuth URL
  const scope = 'calendars.write conversations/message.readonly voice-ai-agents.readonly voice-ai-agents.write conversations.readonly conversations.write contacts.readonly contacts.write workflows.readonly phonenumbers.read voice-ai-dashboard.readonly voice-ai-agent-goals.readonly voice-ai-agent-goals.write knowledge-bases.write knowledge-bases.readonly conversation-ai.readonly conversation-ai.write agent-studio.readonly calendars.readonly calendars/events.readonly calendars/events.write agent-studio.write locations/customValues.write locations/customFields.write locations/customFields.readonly locations.readonly locations/customValues.readonly conversations/message.write';
  
  // Extract version_id from client_id (remove suffix)
  const versionId = GHL_CONFIG.client_id.split('-')[0];
  
  const authUrl = `${GHL_CONFIG.auth_url}/oauth/chooselocation?` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(GHL_CONFIG.redirect_uri)}&` +
    `client_id=${GHL_CONFIG.client_id}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `version_id=${versionId}&` +
    `state=${state}`;
  
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
    
    // Store tokens securely (implement your storage logic)
    console.log('✅ Tokens received:', { access_token: access_token.substring(0, 20) + '...', refresh_token: refresh_token?.substring(0, 20) + '...' });
    
    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/ghl-api?connected=true`);
  } catch (error) {
    console.error('❌ OAuth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/ghl-api?error=${encodeURIComponent(error.message)}`);
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 GHL OAuth API Server running on port ${PORT}`);
  console.log(`📡 Auth endpoint: http://localhost:${PORT}/auth/ghl`);
  console.log(`✅ Callback: http://localhost:${PORT}/auth/callback`);
});

// Export functions
module.exports = {
  getLocationToken,
  createCustomField,
  upsertContact,
  sendSMS,
  refreshAccessToken
};
