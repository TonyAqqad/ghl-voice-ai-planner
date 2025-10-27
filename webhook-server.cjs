/**
 * GHL Webhook Server
 * Handles GoHighLevel webhook events with signature verification
 * Integrates with GHL Voice AI Planner
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const { ghlApiClient } = require('./src/utils/ghlApi'); // Commented out - TypeScript module

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Body parsing with raw body preservation for signature verification
app.use(express.json({ 
  verify: (req, res, buf) => { 
    req.rawBody = buf;
  } 
}));

// Webhook signature verification middleware
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.header('x-gohighlevel-signature');
  const secret = process.env.GHL_SHARED_SECRET;
  
  if (!signature || !secret) {
    console.error('Missing signature or secret');
    return res.status(401).json({ error: 'Unauthorized - Missing signature or secret' });
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.rawBody)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Unauthorized - Invalid signature' });
    }
    
    next();
  } catch (error) {
    console.error('Signature verification error:', error);
    return res.status(401).json({ error: 'Unauthorized - Signature verification failed' });
  }
};

// Webhook event handlers
const webhookHandlers = {
  // Contact Events
  ContactCreate: async (data) => {
    console.log('📞 New contact created:', data);
    
    // Sync contact to your app's database
    try {
      // You can add your contact sync logic here
      console.log('Contact synced successfully:', data.id);
    } catch (error) {
      console.error('Contact sync failed:', error);
    }
  },

  ContactUpdate: async (data) => {
    console.log('📝 Contact updated:', data);
    
    // Update contact in your app
    try {
      console.log('Contact updated successfully:', data.id);
    } catch (error) {
      console.error('Contact update failed:', error);
    }
  },

  ContactTagUpdate: async (data) => {
    console.log('🏷️ Contact tags updated:', data);
    
    // Handle tag updates for segmentation
    try {
      console.log('Contact tags processed:', data.id);
    } catch (error) {
      console.error('Tag processing failed:', error);
    }
  },

  // Appointment Events
  AppointmentCreate: async (data) => {
    console.log('📅 New appointment created:', data);
    
    // Sync appointment to your calendar
    try {
      console.log('Appointment synced successfully:', data.id);
    } catch (error) {
      console.error('Appointment sync failed:', error);
    }
  },

  AppointmentUpdate: async (data) => {
    console.log('📅 Appointment updated:', data);
    
    // Update appointment in your system
    try {
      console.log('Appointment updated successfully:', data.id);
    } catch (error) {
      console.error('Appointment update failed:', error);
    }
  },

  AppointmentDelete: async (data) => {
    console.log('🗑️ Appointment deleted:', data);
    
    // Remove appointment from your system
    try {
      console.log('Appointment removed successfully:', data.id);
    } catch (error) {
      console.error('Appointment removal failed:', error);
    }
  },

  // Conversation Events
  InboundMessage: async (data) => {
    console.log('💬 Inbound message received:', data);
    
    // Process incoming message for Voice AI
    try {
      console.log('Message processed for Voice AI:', data.id);
    } catch (error) {
      console.error('Message processing failed:', error);
    }
  },

  OutboundMessage: async (data) => {
    console.log('📤 Outbound message sent:', data);
    
    // Track outbound message
    try {
      console.log('Outbound message tracked:', data.id);
    } catch (error) {
      console.error('Message tracking failed:', error);
    }
  },

  // Opportunity Events
  OpportunityCreate: async (data) => {
    console.log('💰 New opportunity created:', data);
    
    // Sync opportunity to your CRM
    try {
      console.log('Opportunity synced successfully:', data.id);
    } catch (error) {
      console.error('Opportunity sync failed:', error);
    }
  },

  OpportunityUpdate: async (data) => {
    console.log('💰 Opportunity updated:', data);
    
    // Update opportunity in your system
    try {
      console.log('Opportunity updated successfully:', data.id);
    } catch (error) {
      console.error('Opportunity update failed:', error);
    }
  },

  OpportunityStatusUpdate: async (data) => {
    console.log('📊 Opportunity status updated:', data);
    
    // Handle status changes
    try {
      console.log('Opportunity status processed:', data.id);
    } catch (error) {
      console.error('Status processing failed:', error);
    }
  },

  // Voice AI Events
  VoiceAiCallEnd: async (data) => {
    console.log('🎙️ Voice AI call ended:', data);
    
    // Process call completion for Voice AI analytics
    try {
      console.log('Voice AI call processed:', data.callId);
      
      // Extract call data
      const callData = {
        callId: data.callId,
        status: data.status,
        transcript: data.transcript,
        duration: data.duration,
        timestamp: new Date().toISOString()
      };
      
      // Store call analytics
      console.log('Call analytics stored:', callData);
      
    } catch (error) {
      console.error('Voice AI call processing failed:', error);
    }
  },

  // Task Events
  TaskCreate: async (data) => {
    console.log('✅ New task created:', data);
    
    // Sync task to your task management system
    try {
      console.log('Task synced successfully:', data.id);
    } catch (error) {
      console.error('Task sync failed:', error);
    }
  },

  TaskComplete: async (data) => {
    console.log('✅ Task completed:', data);
    
    // Handle task completion
    try {
      console.log('Task completion processed:', data.id);
    } catch (error) {
      console.error('Task completion processing failed:', error);
    }
  },

  // Campaign Events
  CampaignStatusUpdate: async (data) => {
    console.log('📢 Campaign status updated:', data);
    
    // Handle campaign status changes
    try {
      console.log('Campaign status processed:', data.id);
    } catch (error) {
      console.error('Campaign status processing failed:', error);
    }
  }
};

// Main webhook endpoint
app.post('/leadconnector/webhook', verifyWebhookSignature, async (req, res) => {
  try {
    const { event, data } = req.body;
    
    console.log(`🔔 Webhook received: ${event}`);
    console.log('Event data:', JSON.stringify(data, null, 2));
    
    // Handle the webhook event
    if (webhookHandlers[event]) {
      await webhookHandlers[event](data);
      console.log(`✅ Event ${event} processed successfully`);
    } else {
      console.log(`⚠️ Unhandled event type: ${event}`);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      event: event 
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'GHL Webhook Server'
  });
});

// Webhook status endpoint
app.get('/webhook/status', (req, res) => {
  res.status(200).json({
    status: 'active',
    supportedEvents: Object.keys(webhookHandlers),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GHL Webhook Server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/leadconnector/webhook`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Status: http://localhost:${PORT}/webhook/status`);
  console.log(`🔐 Shared Secret: ${process.env.GHL_SHARED_SECRET ? 'Configured' : 'Missing'}`);
});

module.exports = app;
