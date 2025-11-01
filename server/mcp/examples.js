/**
 * MCP Usage Examples
 * Real-world examples of how to use MCP primitives
 */

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

// Example 1: Complete Voice Agent Call Flow
async function exampleVoiceAgentCall() {
  const voiceAgent = new VoiceAgentPrimitive({
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY
  });

  const trace = new LiveTracePrimitive();
  const traceId = `trace_${Date.now()}`;

  try {
    // Start trace
    await trace.liveTrace({
      traceId,
      agentId: 'sales-agent-1',
      step: 1,
      action: 'voiceAgent.call.init',
      input: { phoneNumber: '+1234567890' }
    });

    // Make the call
    const callResult = await voiceAgent.call({
      agentId: 'sales-agent-1',
      phoneNumber: '+1234567890',
      context: {
        userMessage: 'I need information about your services'
      },
      options: {
        model: 'gpt-5-mini',
        voiceId: 'voice-123',
        temperature: 0.7
      }
    });

    // Log success
    await trace.liveTrace({
      traceId,
      agentId: 'sales-agent-1',
      step: 2,
      action: 'voiceAgent.call.success',
      output: callResult,
      status: 'completed'
    });

    return callResult;
  } catch (error) {
    // Log error
    await trace.liveTrace({
      traceId,
      agentId: 'sales-agent-1',
      step: 2,
      action: 'voiceAgent.call.error',
      output: { error: error.message },
      status: 'error'
    });
    throw error;
  }
}

// Example 2: Workflow with Retry Logic
async function exampleWorkflowWithRetry() {
  const ghl = new GHLPrimitive({
    baseUrl: 'https://services.leadconnectorhq.com'
  });
  const action = new ActionPrimitive();
  const agent = new AgentPrimitive();

  // Define action that might fail
  const triggerWorkflowAction = async (attempt) => {
    return await ghl.triggerWorkflow({
      locationId: 'location-123',
      workflowId: 'workflow-456',
      contactId: 'contact-789',
      data: { source: 'voice-agent' }
    });
  };

  // Retry with exponential backoff
  const result = await action.retryIfFail({
    action: triggerWorkflowAction,
    maxAttempts: 3,
    baseDelay: 1000,
    actionId: 'workflow-trigger-123',
    onError: async (error, attempts) => {
      // Create incident if all retries fail
      const incident = new IncidentReportPrimitive();
      await incident.create({
        agentId: 'system',
        errorMessage: `Workflow trigger failed after ${attempts.length} attempts`,
        severity: 'high',
        metadata: { workflowId: 'workflow-456', attempts }
      });

      // Log error
      await agent.log({
        agentId: 'system',
        action: 'workflow.trigger.failed',
        payload: { workflowId: 'workflow-456', error: error.message },
        status: 'error',
        errorMessage: error.message
      });
    }
  });

  return result;
}

// Example 3: Contact Extraction and GHL Update
async function exampleContactExtraction() {
  const contact = new ContactPrimitive({
    baseUrl: 'https://services.leadconnectorhq.com'
  });

  // Extract from transcript
  const result = await contact.extractAndUpdate({
    transcript: `
      Hi, my name is John Smith and I'm interested in your services.
      You can reach me at john.smith@email.com or call me at 555-123-4567.
    `,
    locationId: 'location-123',
    updateGHL: true,
    updateDatabase: true
  });

  console.log('Extracted:', result.extracted);
  console.log('Contact ID:', result.contactId);

  return result;
}

// Example 4: Health Check and Auto-Recovery
async function exampleHealthCheckAndRecovery() {
  const agent = new AgentPrimitive({
    openaiApiKey: process.env.OPENAI_API_KEY,
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY
  });
  const recovery = new AutoRecoveryPrimitive();
  const anomaly = new AnomalyDetectionPrimitive();

  // Check health
  const health = await agent.checkHealth({
    agentId: 'agent-123',
    checks: ['database', 'apis', 'voiceAgent']
  });

  console.log('Health status:', health.healthy);

  // If unhealthy, detect anomalies
  if (!health.healthy) {
    const anomalies = await anomaly.anomalyDetect({
      agentId: 'agent-123',
      type: 'all'
    });

    if (anomalies.anomalyDetected) {
      console.log('Anomalies detected:', anomalies.anomalies);

      // Attempt auto-recovery
      const recoveryResult = await recovery.autoRecovery({
        agentId: 'agent-123',
        failureType: 'unknown'
      });

      console.log('Recovery attempted:', recoveryResult.recovered);
    }
  }

  return health;
}

// Example 5: Config Drift Detection and Auto-Repair
async function exampleConfigDriftDetection() {
  const configDrift = new ConfigDriftPrimitive();

  // Detect drift
  const driftResult = await configDrift.detect({
    agentId: 'agent-123',
    expectedConfig: {
      voice_id: 'voice-123',
      system_prompt: 'You are a helpful assistant.',
      api_keys: { /* expected keys */ }
    },
    checkFields: ['voice_id', 'system_prompt', 'api_keys']
  });

  if (driftResult.driftDetected) {
    console.log('Config drift detected:', driftResult.drifts);

    // Auto-repair (if enabled)
    const repairResult = await configDrift.autoRepair({
      agentId: 'agent-123',
      autoRepair: true // Set to true to enable
    });

    console.log('Repair result:', repairResult);
  }

  return driftResult;
}

// Example 6: Complete Agent Deployment with Monitoring
async function exampleAgentDeployment() {
  const integration = new IntegrationPrimitive();
  const voiceAgent = new VoiceAgentPrimitive({
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY
  });
  const agent = new AgentPrimitive();
  const patch = new AutoPatchPrimitive();
  const trace = new LiveTracePrimitive();

  const traceId = `deploy_${Date.now()}`;

  try {
    // 1. Connect integrations
    const elevenLabsConn = await integration.connect({
      service: 'elevenlabs',
      apiKey: process.env.ELEVENLABS_API_KEY
    });
    console.log('ElevenLabs connected:', elevenLabsConn.connectionId);

    const openAIConn = await integration.connect({
      service: 'openai',
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI connected:', openAIConn.connectionId);

    // 2. Generate prompt
    const prompt = await voiceAgent.generatePrompt({
      template: 'You are a sales assistant.',
      businessHours: { open: '9 AM', close: '5 PM' },
      clientContext: { industry: 'fitness' },
      enhance: true
    });

    // 3. Save initial state
    await agent.saveState({
      agentId: 'new-agent-123',
      customerId: 'deployment',
      state: {
        prompt,
        config: { voiceId: 'voice-123' },
        deployedAt: new Date().toISOString()
      }
    });

    // 4. Test agent
    const testCall = await voiceAgent.call({
      agentId: 'new-agent-123',
      phoneNumber: '+19999999999',
      context: { userMessage: 'Test call' }
    });

    // 5. Deploy patch if needed
    if (testCall.status === 'success') {
      await patch.deploy({
        patchId: `initial-config-${Date.now()}`,
        patchConfig: {
          type: 'prompt',
          data: { systemPrompt: prompt }
        },
        agentIds: ['new-agent-123'],
        testFirst: true
      });
    }

    return { success: true, agentId: 'new-agent-123', testCall };
  } catch (error) {
    // Log deployment failure
    await trace.liveTrace({
      traceId,
      agentId: 'system',
      step: 999,
      action: 'agent.deployment.error',
      output: { error: error.message },
      status: 'error'
    });
    throw error;
  }
}

// Example 7: Feedback Loop Integration
async function exampleFeedbackCollection() {
  const feedback = new FeedbackLoopPrimitive();

  // Collect user feedback
  const feedbackResult = await feedback.feedbackLoop({
    agentId: 'agent-123',
    type: 'correction',
    feedback: 'The agent misunderstood my request about pricing',
    rating: 2,
    context: {
      callId: 'call-456',
      transcript: 'User asked about pricing...'
    },
    userId: 'user-789',
    sessionId: 'session-101'
  });

  // Get feedback summary
  const summary = await feedback.getFeedbackSummary('agent-123', {
    timeWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
    type: 'correction'
  });

  console.log('Feedback insights:', feedbackResult.insights);
  console.log('Summary:', summary);

  return { feedbackResult, summary };
}

// Export examples
module.exports = {
  exampleVoiceAgentCall,
  exampleWorkflowWithRetry,
  exampleContactExtraction,
  exampleHealthCheckAndRecovery,
  exampleConfigDriftDetection,
  exampleAgentDeployment,
  exampleFeedbackCollection
};

// Run example (if executed directly)
if (require.main === module) {
  (async () => {
    try {
      console.log('Running example: Health Check and Recovery');
      await exampleHealthCheckAndRecovery();
    } catch (error) {
      console.error('Example failed:', error);
    }
  })();
}

