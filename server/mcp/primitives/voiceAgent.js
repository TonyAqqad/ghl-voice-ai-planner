/**
 * Voice Agent MCP Primitives
 * voiceAgent.call - Invoke ElevenLabs/OpenAI-powered agent for lead capture, booking, or orders
 * voiceAgent.generatePrompt - Dynamic prompt builder for custom orders, business hours, client context
 */

const ElevenLabsProvider = require('../../providers/elevenlabs');
const OpenAIProvider = require('../../providers/openai');
const { pool } = require('../../database');

class VoiceAgentPrimitive {
  constructor(config) {
    this.elevenlabs = new ElevenLabsProvider(config.elevenlabsApiKey);
    this.openai = new OpenAIProvider(config.openaiApiKey);
  }

  /**
   * voiceAgent.call - Invoke voice agent for conversation
   * @param {Object} params - { agentId, phoneNumber, context, options }
   * @returns {Promise<Object>} - { callId, status, transcript }
   */
  async call(params) {
    const { agentId, phoneNumber, context = {}, options = {} } = params;

    try {
      // Get agent configuration from database
      const agentResult = await pool.query(
        'SELECT * FROM agents WHERE agent_id = $1',
        [agentId]
      );

      if (agentResult.rows.length === 0) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const agent = agentResult.rows[0];
      const systemPrompt = agent.system_prompt || 'You are a helpful assistant.';
      
      // Generate conversation using OpenAI
      const conversationResult = await this.openai.generateCompletion(
        context.userMessage || 'Hello',
        {
          model: options.model || 'gpt-4',
          systemPrompt: systemPrompt,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 1000
        }
      );

      const assistantMessage = conversationResult.choices?.[0]?.message?.content || conversationResult;

      // Generate voice using ElevenLabs
      const voiceId = agent.voice_id || options.voiceId || 'default';
      const audioBuffer = await this.elevenlabs.generateSpeech(
        assistantMessage,
        voiceId,
        {
          stability: options.stability || 0.5,
          similarityBoost: options.similarityBoost || 0.75
        }
      );

      // Log the call
      await pool.query(
        'INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [
          agentId,
          'voiceAgent.call',
          JSON.stringify({ phoneNumber, options }),
          JSON.stringify(context),
          'success'
        ]
      );

      return {
        callId: `call_${Date.now()}`,
        status: 'success',
        transcript: assistantMessage,
        audioBuffer: audioBuffer ? Buffer.from(audioBuffer).toString('base64') : null,
        duration: 0 // Can be calculated from audio buffer length
      };
    } catch (error) {
      console.error('voiceAgent.call error:', error);
      
      // Log error
      await pool.query(
        'INSERT INTO agent_logs (agent_id, action, payload, context, status, error_message, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [
          agentId,
          'voiceAgent.call',
          JSON.stringify({ phoneNumber, options }),
          JSON.stringify(context),
          'error',
          error.message
        ]
      );

      throw error;
    }
  }

  /**
   * voiceAgent.generatePrompt - Dynamic prompt builder
   * @param {Object} params - { template, businessHours, clientContext, customFields }
   * @returns {Promise<string>} - Generated prompt
   */
  async generatePrompt(params) {
    const { template, businessHours, clientContext = {}, customFields = {} } = params;

    try {
      const promptParts = [];

      // Base template
      if (template) {
        promptParts.push(template);
      }

      // Business hours
      if (businessHours) {
        promptParts.push(`\nBusiness Hours: ${JSON.stringify(businessHours)}`);
      }

      // Client context
      if (Object.keys(clientContext).length > 0) {
        promptParts.push(`\nClient Context: ${JSON.stringify(clientContext)}`);
      }

      // Custom fields
      if (Object.keys(customFields).length > 0) {
        promptParts.push(`\nCustom Information: ${JSON.stringify(customFields)}`);
      }

      // Use OpenAI to enhance the prompt if needed
      if (params.enhance) {
        const enhanced = await this.openai.generateCompletion(
          promptParts.join('\n'),
          {
            model: 'gpt-4',
            systemPrompt: 'You are a prompt engineering assistant. Enhance the given prompt to be more effective for a voice AI agent.',
            temperature: 0.3,
            maxTokens: 500
          }
        );

        return enhanced.choices?.[0]?.message?.content || enhanced;
      }

      return promptParts.join('\n');
    } catch (error) {
      console.error('voiceAgent.generatePrompt error:', error);
      throw error;
    }
  }
}

module.exports = VoiceAgentPrimitive;

