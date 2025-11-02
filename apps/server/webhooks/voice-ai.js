/**
 * Voice AI Webhook Handler
 * Processes incoming webhook events from GHL Voice AI
 */

const crypto = require('crypto');

class VoiceAIWebhookHandler {
  constructor(webhookSecret) {
    this.webhookSecret = webhookSecret;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature) {
    if (!this.webhookSecret) {
      console.warn('No webhook secret configured, skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  }

  /**
   * Process incoming webhook event
   */
  async processEvent(event) {
    try {
      console.log('📞 Processing Voice AI event:', event.type);

      switch (event.type) {
        case 'call.started':
          return await this.handleCallStarted(event);
        
        case 'call.ended':
          return await this.handleCallEnded(event);
        
        case 'call.analyzed':
          return await this.handleCallAnalyzed(event);
        
        case 'transcript.generated':
          return await this.handleTranscriptGenerated(event);
        
        case 'custom_action.triggered':
          return await this.handleCustomActionTriggered(event);
        
        case 'agent.error':
          return await this.handleAgentError(event);
        
        default:
          console.log('📞 Unknown event type:', event.type);
          return { status: 'ignored', reason: 'unknown_event_type' };
      }
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Handle call started event
   */
  async handleCallStarted(event) {
    const callData = {
      callId: event.call_id,
      agentId: event.agent_id,
      callerPhone: event.caller_phone,
      startTime: event.timestamp,
      locationId: event.location_id
    };

    console.log('✅ Call started:', callData.callId);
    
    // Store call data for tracking
    // In production, this would be stored in a database
    this.storeCallData(callData);

    return {
      status: 'processed',
      action: 'call_started',
      callId: callData.callId
    };
  }

  /**
   * Handle call ended event
   */
  async handleCallEnded(event) {
    const callData = {
      callId: event.call_id,
      agentId: event.agent_id,
      duration: event.duration,
      endTime: event.timestamp,
      status: event.status,
      transferReason: event.transfer_reason
    };

    console.log('✅ Call ended:', callData.callId, 'Duration:', callData.duration);
    
    // Update call data
    this.updateCallData(callData);

    // Trigger post-call workflows if configured
    await this.triggerPostCallWorkflows(callData);

    return {
      status: 'processed',
      action: 'call_ended',
      callId: callData.callId
    };
  }

  /**
   * Handle call analyzed event
   */
  async handleCallAnalyzed(event) {
    const analysisData = {
      callId: event.call_id,
      agentId: event.agent_id,
      sentiment: event.sentiment,
      intent: event.intent,
      confidence: event.confidence,
      keywords: event.keywords,
      summary: event.summary
    };

    console.log('✅ Call analyzed:', analysisData.callId, 'Intent:', analysisData.intent);
    
    // Store analysis data
    this.storeAnalysisData(analysisData);

    // Trigger analytics workflows
    await this.triggerAnalyticsWorkflows(analysisData);

    return {
      status: 'processed',
      action: 'call_analyzed',
      callId: analysisData.callId
    };
  }

  /**
   * Handle transcript generated event
   */
  async handleTranscriptGenerated(event) {
    const transcriptData = {
      callId: event.call_id,
      agentId: event.agent_id,
      transcript: event.transcript,
      timestamp: event.timestamp,
      duration: event.duration
    };

    console.log('✅ Transcript generated:', transcriptData.callId);
    
    // Store transcript
    this.storeTranscript(transcriptData);

    // Trigger transcript-based workflows
    await this.triggerTranscriptWorkflows(transcriptData);

    return {
      status: 'processed',
      action: 'transcript_generated',
      callId: transcriptData.callId
    };
  }

  /**
   * Handle custom action triggered event
   */
  async handleCustomActionTriggered(event) {
    const actionData = {
      callId: event.call_id,
      agentId: event.agent_id,
      actionId: event.action_id,
      actionName: event.action_name,
      parameters: event.parameters,
      result: event.result,
      timestamp: event.timestamp
    };

    console.log('✅ Custom action triggered:', actionData.actionName);
    
    // Store action data
    this.storeActionData(actionData);

    // Process custom action result
    await this.processCustomActionResult(actionData);

    return {
      status: 'processed',
      action: 'custom_action_triggered',
      callId: actionData.callId
    };
  }

  /**
   * Handle agent error event
   */
  async handleAgentError(event) {
    const errorData = {
      agentId: event.agent_id,
      callId: event.call_id,
      errorType: event.error_type,
      errorMessage: event.error_message,
      timestamp: event.timestamp,
      severity: event.severity || 'medium'
    };

    console.error('❌ Agent error:', errorData.errorType, errorData.errorMessage);
    
    // Store error data
    this.storeErrorData(errorData);

    // Trigger error handling workflows
    await this.triggerErrorWorkflows(errorData);

    return {
      status: 'processed',
      action: 'agent_error',
      agentId: errorData.agentId
    };
  }

  /**
   * Store call data (placeholder - implement with actual database)
   */
  storeCallData(callData) {
    // In production, store in database
    console.log('📊 Storing call data:', callData.callId);
  }

  /**
   * Update call data (placeholder - implement with actual database)
   */
  updateCallData(callData) {
    // In production, update in database
    console.log('📊 Updating call data:', callData.callId);
  }

  /**
   * Store analysis data (placeholder - implement with actual database)
   */
  storeAnalysisData(analysisData) {
    // In production, store in database
    console.log('📊 Storing analysis data:', analysisData.callId);
  }

  /**
   * Store transcript (placeholder - implement with actual database)
   */
  storeTranscript(transcriptData) {
    // In production, store in database
    console.log('📊 Storing transcript:', transcriptData.callId);
  }

  /**
   * Store action data (placeholder - implement with actual database)
   */
  storeActionData(actionData) {
    // In production, store in database
    console.log('📊 Storing action data:', actionData.callId);
  }

  /**
   * Store error data (placeholder - implement with actual database)
   */
  storeErrorData(errorData) {
    // In production, store in database
    console.log('📊 Storing error data:', errorData.agentId);
  }

  /**
   * Trigger post-call workflows
   */
  async triggerPostCallWorkflows(callData) {
    // In production, trigger configured workflows
    console.log('🔄 Triggering post-call workflows for:', callData.callId);
  }

  /**
   * Trigger analytics workflows
   */
  async triggerAnalyticsWorkflows(analysisData) {
    // In production, trigger analytics workflows
    console.log('📈 Triggering analytics workflows for:', analysisData.callId);
  }

  /**
   * Trigger transcript workflows
   */
  async triggerTranscriptWorkflows(transcriptData) {
    // In production, trigger transcript-based workflows
    console.log('📝 Triggering transcript workflows for:', transcriptData.callId);
  }

  /**
   * Process custom action result
   */
  async processCustomActionResult(actionData) {
    // In production, process the custom action result
    console.log('⚡ Processing custom action result:', actionData.actionName);
  }

  /**
   * Trigger error workflows
   */
  async triggerErrorWorkflows(errorData) {
    // In production, trigger error handling workflows
    console.log('🚨 Triggering error workflows for:', errorData.agentId);
  }

  /**
   * Retry failed webhook processing
   */
  async retryProcessing(event, maxRetries = 3) {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await this.processEvent(event);
      } catch (error) {
        retries++;
        console.error(`❌ Retry ${retries}/${maxRetries} failed:`, error.message);
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }
}

module.exports = VoiceAIWebhookHandler;
