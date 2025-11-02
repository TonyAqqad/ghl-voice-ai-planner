/**
 * GHL Provider Service
 * Handles all GoHighLevel API interactions for Voice AI agents
 */

const axios = require('axios');

class GHLProvider {
  constructor(config) {
    this.baseUrl = config.base_url || 'https://services.leadconnectorhq.com';
    this.version = '2021-07-28';
  }

  /**
   * Get authenticated headers
   */
  getHeaders(accessToken) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Version': this.version,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create Voice AI agent
   */
  async createAgent(accessToken, agentConfig) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voice-ai/agents`,
        {
          name: agentConfig.name,
          description: agentConfig.description || '',
          voiceSettings: agentConfig.voiceSettings || {
            provider: 'elevenlabs',
            voiceId: 'default',
            speed: 1.0,
            stability: 0.5
          },
          conversationSettings: agentConfig.conversationSettings || {
            systemPrompt: agentConfig.systemPrompt || '',
            temperature: 0.7,
            maxTokens: 1000
          },
          scripts: agentConfig.scripts || {
            greeting: 'Hello! How can I help you today?',
            main: 'I understand you need assistance.',
            fallback: 'I apologize, I didn\'t understand that.',
            transfer: 'Let me transfer you to a human agent.',
            goodbye: 'Thank you for calling. Have a great day!'
          },
          intents: agentConfig.intents || [],
          transferRules: agentConfig.transferRules || [],
          compliance: agentConfig.compliance || {
            tcpaCompliant: true,
            recordingConsent: true
          }
        },
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL createAgent error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Voice AI agent
   */
  async getAgent(accessToken, agentId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/voice-ai/agents/${agentId}`,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL getAgent error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * List Voice AI agents
   */
  async listAgents(accessToken) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/voice-ai/agents`,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL listAgents error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update Voice AI agent
   */
  async updateAgent(accessToken, agentId, updates) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/voice-ai/agents/${agentId}`,
        updates,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL updateAgent error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete Voice AI agent
   */
  async deleteAgent(accessToken, agentId) {
    try {
      await axios.delete(
        `${this.baseUrl}/voice-ai/agents/${agentId}`,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return { success: true };
    } catch (error) {
      console.error('GHL deleteAgent error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Add custom action to agent
   */
  async addCustomAction(accessToken, agentId, customAction) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voice-ai/agents/${agentId}/custom-actions`,
        {
          name: customAction.name,
          triggerPhrases: customAction.triggerPhrases || [],
          webhook: {
            url: customAction.webhookUrl,
            method: customAction.method || 'POST',
            headers: customAction.headers || {},
            body: customAction.body || {}
          },
          responseMapping: customAction.responseMapping || {}
        },
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL addCustomAction error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get custom actions for agent
   */
  async getCustomActions(accessToken, agentId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/voice-ai/agents/${agentId}/custom-actions`,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL getCustomActions error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update custom action
   */
  async updateCustomAction(accessToken, agentId, actionId, updates) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/voice-ai/agents/${agentId}/custom-actions/${actionId}`,
        updates,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL updateCustomAction error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete custom action
   */
  async deleteCustomAction(accessToken, agentId, actionId) {
    try {
      await axios.delete(
        `${this.baseUrl}/voice-ai/agents/${agentId}/custom-actions/${actionId}`,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return { success: true };
    } catch (error) {
      console.error('GHL deleteCustomAction error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create workflow with transcript trigger
   */
  async createWorkflow(accessToken, workflowConfig) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/workflows`,
        {
          name: workflowConfig.name,
          trigger: {
            type: 'voice_ai.transcript_generated',
            conditions: {
              agent_id: workflowConfig.agentId,
              ...workflowConfig.conditions
            }
          },
          actions: workflowConfig.actions || []
        },
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL createWorkflow error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Configure phone number routing
   */
  async configurePhoneRouting(accessToken, agentId, phoneConfig) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voice-ai/agents/${agentId}/phone-numbers`,
        {
          phoneNumber: phoneConfig.phoneNumber,
          routingRules: phoneConfig.routingRules || []
        },
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL configurePhoneRouting error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Set up webhooks
   */
  async setupWebhooks(accessToken, agentId, webhookConfig) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voice-ai/agents/${agentId}/webhooks`,
        {
          webhookUrl: webhookConfig.webhookUrl,
          events: webhookConfig.events || ['call.started', 'call.ended', 'call.analyzed']
        },
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL setupWebhooks error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Activate agent
   */
  async activateAgent(accessToken, agentId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voice-ai/agents/${agentId}/activate`,
        {},
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL activateAgent error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Deactivate agent
   */
  async deactivateAgent(accessToken, agentId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voice-ai/agents/${agentId}/deactivate`,
        {},
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL deactivateAgent error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update knowledge base
   */
  async updateKnowledgeBase(accessToken, agentId, knowledgeItems) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voice-ai/agents/${agentId}/knowledge-base`,
        {
          items: knowledgeItems.map(item => ({
            type: 'text',
            text: item
          }))
        },
        {
          headers: this.getHeaders(accessToken)
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL updateKnowledgeBase error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken, clientId, clientSecret) {
    try {
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);
      params.append('user_type', 'Location');

      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('GHL refreshToken error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = GHLProvider;
