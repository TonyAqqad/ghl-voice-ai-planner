/**
 * MCP Server Runtime
 * Express router/endpoints exposing MCP primitives
 * Chainlit integration layer
 * MCP protocol handlers for runtime use
 */

const express = require('express');
const router = express.Router();

// Import all primitives
const {
  VoiceAgentPrimitive,
  GHLPrimitive,
  WebhookPrimitive,
  ContactPrimitive,
  ActionPrimitive,
  AgentPrimitive,
  IntegrationPrimitive,
  AutoRecoveryPrimitive,
  AnomalyDetectionPrimitive,
  FeedbackLoopPrimitive,
  ConfigDriftPrimitive,
  LiveTracePrimitive,
  AutoPatchPrimitive,
  IncidentReportPrimitive
} = require('./index');

// Initialize primitives with config
function initializePrimitives(config) {
  const config_full = {
    ...config,
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY
  };

  return {
    voiceAgent: new VoiceAgentPrimitive(config_full),
    ghl: new GHLPrimitive(config_full),
    webhook: new WebhookPrimitive(),
    contact: new ContactPrimitive(config_full),
    action: new ActionPrimitive(),
    agent: new AgentPrimitive(config_full),
    integration: new IntegrationPrimitive(),
    autoRecovery: new AutoRecoveryPrimitive(),
    anomalyDetection: new AnomalyDetectionPrimitive(),
    feedbackLoop: new FeedbackLoopPrimitive(),
    configDrift: new ConfigDriftPrimitive(),
    liveTrace: new LiveTracePrimitive(),
    autoPatch: new AutoPatchPrimitive(),
    incidentReport: new IncidentReportPrimitive()
  };
}

// Get or create primitives instance
let primitives = null;

function getPrimitives() {
  if (!primitives) {
    primitives = initializePrimitives({});
  }
  return primitives;
}

// MCP Endpoints - Core Primitives

// Voice Agent endpoints
router.post('/voiceAgent/call', async (req, res) => {
  try {
    const result = await getPrimitives().voiceAgent.call(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/voiceAgent/generatePrompt', async (req, res) => {
  try {
    console.log('📝 Generating prompt with params:', JSON.stringify(req.body, null, 2));
    const result = await getPrimitives().voiceAgent.generatePrompt(req.body);
    
    // Ensure result is a string
    const promptText = typeof result === 'string' ? result : JSON.stringify(result);
    
    console.log('✅ Prompt generated successfully, length:', promptText.length);
    res.json({ success: true, data: promptText });
  } catch (error) {
    console.error('❌ Error generating prompt:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate prompt',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GHL endpoints
router.post('/ghl/triggerWorkflow', async (req, res) => {
  try {
    const result = await getPrimitives().ghl.triggerWorkflow(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook endpoints
router.post('/webhook/onEvent', async (req, res) => {
  try {
    const result = await getPrimitives().webhook.onEvent(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/webhook/processEvent/:eventType', async (req, res) => {
  try {
    const result = await getPrimitives().webhook.processEvent(req.params.eventType, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Contact endpoints
router.post('/contact/extractAndUpdate', async (req, res) => {
  try {
    const result = await getPrimitives().contact.extractAndUpdate(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Action endpoints
router.post('/action/retryIfFail', async (req, res) => {
  try {
    const result = await getPrimitives().action.retryIfFail(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agent endpoints
router.post('/agent/log', async (req, res) => {
  try {
    const result = await getPrimitives().agent.log(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agent/checkHealth', async (req, res) => {
  try {
    const result = await getPrimitives().agent.checkHealth(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agent/saveState', async (req, res) => {
  try {
    const result = await getPrimitives().agent.saveState(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agent/loadState', async (req, res) => {
  try {
    const result = await getPrimitives().agent.loadState(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Integration endpoints
router.post('/integration/connect', async (req, res) => {
  try {
    const result = await getPrimitives().integration.connect(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Monitoring/Self-Healing endpoints
router.post('/agent/autoRecovery', async (req, res) => {
  try {
    const result = await getPrimitives().autoRecovery.autoRecovery(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agent/anomalyDetect', async (req, res) => {
  try {
    const result = await getPrimitives().anomalyDetection.anomalyDetect(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agent/feedbackLoop', async (req, res) => {
  try {
    const result = await getPrimitives().feedbackLoop.feedbackLoop(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/configDrift/detect', async (req, res) => {
  try {
    const result = await getPrimitives().configDrift.detect(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agent/liveTrace', async (req, res) => {
  try {
    const result = await getPrimitives().liveTrace.liveTrace(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agent/getTrace/:traceId', async (req, res) => {
  try {
    const result = await getPrimitives().liveTrace.getTrace(req.params.traceId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/autoPatch/deploy', async (req, res) => {
  try {
    const result = await getPrimitives().autoPatch.deploy(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/incidentReport/create', async (req, res) => {
  try {
    const result = await getPrimitives().incidentReport.create(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/incidentReport/getIncidents', async (req, res) => {
  try {
    const result = await getPrimitives().incidentReport.getIncidents(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthResult = await getPrimitives().agent.checkHealth({ agentId: 'system' });
    res.json({ success: true, data: healthResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Prompt Composer Endpoints (Layer 2)
// ============================================
const promptComposer = require('./promptComposer');

// Compose a new Voice AI prompt
router.post('/prompt/compose', promptComposer.composePrompt);

// Get list of available niches
router.get('/prompt/niches', promptComposer.listNiches);

// Get latest prompt for an agent
router.get('/prompt/:agentId', promptComposer.getPrompt);

// Get prompt history for an agent
router.get('/prompt/:agentId/history', promptComposer.getPromptHistory);

// Validate a prompt structure
router.post('/prompt/validate', promptComposer.validatePromptEndpoint);

// ============================================
// Autonomous Evaluation Endpoints
// ============================================
const evaluationModule = require('./evaluation');

// Ingest transcript and trigger evaluation
router.post('/agent/ingestTranscript', evaluationModule.ingestTranscript);

// Get review queue for manual approval
router.get('/prompt/reviewQueue', evaluationModule.getReviewQueue);

// Apply a suggested patch manually
router.post('/prompt/applyPatch', evaluationModule.applyPatchEndpoint);

// Rollback to previous prompt version
router.post('/prompt/rollback', evaluationModule.rollbackPrompt);

// Batch review missed transcripts
router.post('/agent/batchReview', evaluationModule.batchReview);

// Store a manual response correction from the Training Hub
router.post('/agent/saveCorrection', evaluationModule.saveCorrection);

// Get corrections history for dashboard
router.get('/agent/corrections', evaluationModule.getCorrectionsHistory);

// Get prompt version history
router.get('/prompt/versions', evaluationModule.getPromptVersions);

module.exports = router;

