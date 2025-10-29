/**
 * MCP Primitives Index
 * Exports all MCP primitives for use in server and runtime
 */

// Core Primitives
const VoiceAgentPrimitive = require('./primitives/voiceAgent');
const GHLPrimitive = require('./primitives/ghl');
const WebhookPrimitive = require('./primitives/webhook');
const ContactPrimitive = require('./primitives/contact');
const ActionPrimitive = require('./primitives/action');
const AgentPrimitive = require('./primitives/agent');
const IntegrationPrimitive = require('./primitives/integration');

// Monitoring/Self-Healing Primitives
const AutoRecoveryPrimitive = require('./monitoring/autoRecovery');
const AnomalyDetectionPrimitive = require('./monitoring/anomalyDetection');
const FeedbackLoopPrimitive = require('./monitoring/feedbackLoop');
const ConfigDriftPrimitive = require('./monitoring/configDrift');
const LiveTracePrimitive = require('./monitoring/liveTrace');
const AutoPatchPrimitive = require('./monitoring/autoPatch');
const IncidentReportPrimitive = require('./monitoring/incidentReport');

module.exports = {
  // Core Primitives
  VoiceAgentPrimitive,
  GHLPrimitive,
  WebhookPrimitive,
  ContactPrimitive,
  ActionPrimitive,
  AgentPrimitive,
  IntegrationPrimitive,

  // Monitoring Primitives
  AutoRecoveryPrimitive,
  AnomalyDetectionPrimitive,
  FeedbackLoopPrimitive,
  ConfigDriftPrimitive,
  LiveTracePrimitive,
  AutoPatchPrimitive,
  IncidentReportPrimitive
};

