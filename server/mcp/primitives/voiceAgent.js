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
      
      // Build messages array with conversation history support
      const messages = [];
      
      // Add conversation history if provided
      if (context.conversationHistory && Array.isArray(context.conversationHistory)) {
        messages.push(...context.conversationHistory);
      }
      
      // Add current user message
      if (context.userMessage) {
        messages.push({
          role: 'user',
          content: context.userMessage
        });
      }
      
      // Generate conversation using OpenAI
      const conversationResult = await this.openai.generateCompletion(
        messages.length > 0 ? messages : 'Hello',
        {
          model: options.model || 'gpt-5-mini',
          systemPrompt: systemPrompt,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 1000
        }
      );

      const assistantMessage = conversationResult.choices?.[0]?.message?.content || conversationResult;

      // Generate voice using ElevenLabs (skip if textOnly mode)
      let audioBuffer = null;
      const textOnly = options.textOnly !== undefined ? options.textOnly : true; // Default to text-only for dry-run
      
      if (!textOnly && this.elevenlabs.apiKey) {
        try {
          const voiceId = agent.voice_id || options.voiceId || 'default';
          audioBuffer = await this.elevenlabs.generateSpeech(
            assistantMessage,
            voiceId,
            {
              stability: options.stability || 0.5,
              similarityBoost: options.similarityBoost || 0.75
            }
          );
        } catch (voiceError) {
          console.warn('⚠️  Voice generation failed (continuing with text-only):', voiceError.message);
          // Continue without audio - text response is sufficient
        }
      }

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
        mode: textOnly ? 'text' : 'voice',
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
   * voiceAgent.generatePrompt - Dynamic prompt builder for GHL Voice AI
   * @param {Object} params - { template, businessHours, clientContext, customFields, enhance, industry, goals, tone }
   * @returns {Promise<string>} - Generated prompt optimized for Voice AI
   */
  async generatePrompt(params) {
    const { 
      template, 
      businessHours, 
      clientContext = {}, 
      customFields = {}, 
      enhance = false,
      industry = 'general',
      goals = [],
      tone = 'professional'
    } = params;

    try {
      let promptParts = [];

      // GHL Voice AI Best Practices Header
      promptParts.push('You are an expert Voice AI agent for GoHighLevel (GHL). Follow these guidelines:');
      promptParts.push('');
      promptParts.push('CORE PRINCIPLES:');
      promptParts.push('- Speak naturally and conversationally, as if talking to a friend');
      promptParts.push('- Keep responses concise (2-3 sentences max per turn)');
      promptParts.push('- Use active listening: acknowledge what the caller said before responding');
      promptParts.push('- Ask one question at a time');
      promptParts.push('- Use the caller\'s name when you learn it');
      promptParts.push('- Sound empathetic and understanding, not robotic');
      promptParts.push('');

      // Base template (user-provided)
      if (template) {
        promptParts.push('YOUR ROLE AND PURPOSE:');
        promptParts.push(template);
        promptParts.push('');
      }

      // Business hours handling
      if (businessHours) {
        const { open, close } = businessHours;
        promptParts.push('BUSINESS OPERATIONS:');
        promptParts.push(`- Business hours: ${open} to ${close}`);
        promptParts.push(`- If caller contacts outside business hours, offer to: schedule a callback, leave a message, or direct them to resources that are available 24/7`);
        promptParts.push('');
      }

      // Industry-specific context
      if (industry && industry !== 'general') {
        const industryGuidance = this._getIndustryGuidance(industry);
        if (industryGuidance) {
          promptParts.push(`INDUSTRY CONTEXT (${industry.toUpperCase()}):`);
          promptParts.push(industryGuidance);
          promptParts.push('');
        }
      }

      // Client context
      if (Object.keys(clientContext).length > 0) {
        promptParts.push('CLIENT INFORMATION:');
        Object.entries(clientContext).forEach(([key, value]) => {
          promptParts.push(`- ${key}: ${value}`);
        });
        promptParts.push('');
      }

      // Goals and objectives
      if (goals && goals.length > 0) {
        promptParts.push('PRIMARY GOALS:');
        goals.forEach((goal, index) => {
          promptParts.push(`${index + 1}. ${goal}`);
        });
        promptParts.push('');
      }

      // Tone and personality
      promptParts.push('COMMUNICATION STYLE:');
      const toneGuidance = this._getToneGuidance(tone);
      promptParts.push(toneGuidance);
      promptParts.push('');

      // GHL-specific capabilities
      promptParts.push('YOUR CAPABILITIES:');
      promptParts.push('- Capture and update contact information in GoHighLevel');
      promptParts.push('- Schedule appointments and add to calendars');
      promptParts.push('- Answer questions about products/services');
      promptParts.push('- Qualify leads and gather information');
      promptParts.push('- Transfer to human agent if requested or if situation requires it');
      promptParts.push('');

      // Custom fields
      if (Object.keys(customFields).length > 0) {
        promptParts.push('ADDITIONAL INFORMATION:');
        Object.entries(customFields).forEach(([key, value]) => {
          promptParts.push(`- ${key}: ${value}`);
        });
        promptParts.push('');
      }

      // Conversation flow guidelines
      promptParts.push('CONVERSATION FLOW:');
      promptParts.push('1. Greet warmly and introduce yourself');
      promptParts.push('2. Ask how you can help');
      promptParts.push('3. Listen actively and take notes on key information');
      promptParts.push('4. Ask clarifying questions when needed');
      promptParts.push('5. Provide helpful information or complete requested actions');
      promptParts.push('6. Confirm next steps before ending the call');
      promptParts.push('');
      promptParts.push('END CALL PROTOCOL:');
      promptParts.push('- Summarize what was discussed');
      promptParts.push('- Confirm any actions that will be taken');
      promptParts.push('- Thank them for calling');
      promptParts.push('- Offer additional help if needed');

      // Join all parts
      let finalPrompt = promptParts.join('\n');

      // Use OpenAI to enhance if requested and API key is available
      if (enhance && this.openai.apiKey) {
        try {
          const enhanced = await this.openai.generateCompletion(
            `Enhance this Voice AI prompt for GoHighLevel to be more effective. Make it conversational, specific, and actionable while preserving all the guidelines:\n\n${finalPrompt}`,
            {
              model: 'gpt-5-mini',
              systemPrompt: 'You are an expert Voice AI prompt engineer specializing in GoHighLevel Voice AI agents. Enhance prompts to be natural, actionable, and effective for voice conversations.',
              temperature: 0.4,
              maxTokens: 1500
            }
          );

          const enhancedContent = enhanced.choices?.[0]?.message?.content || enhanced;
          if (enhancedContent && typeof enhancedContent === 'string' && enhancedContent.trim().length > 0) {
            console.log('✅ OpenAI enhancement successful');
            return enhancedContent;
          }
        } catch (enhanceError) {
          // Log the specific error but continue with base prompt
          const errorMsg = enhanceError.message || 'Unknown error';
          console.warn('⚠️  OpenAI enhancement failed, using base prompt without AI enhancement:');
          console.warn(`   Error: ${errorMsg}`);
          
          // If it's an auth error, log helpful message
          if (errorMsg.includes('authentication') || errorMsg.includes('401')) {
            console.warn('   💡 Tip: Set OPENAI_API_KEY in Render environment variables to enable AI enhancement.');
            console.warn('   The base prompt will still work without enhancement.');
          }
          
          // Fall through to return base prompt - don't fail the entire operation
        }
      } else if (enhance && !this.openai.apiKey) {
        console.warn('⚠️  Enhancement requested but OpenAI API key not configured.');
        console.warn('   Using base prompt without AI enhancement.');
        console.warn('   💡 Tip: Set OPENAI_API_KEY in Render environment variables to enable enhancement.');
      }

      return finalPrompt;
    } catch (error) {
      console.error('voiceAgent.generatePrompt error:', error);
      // Provide fallback prompt instead of throwing
      return this._getFallbackPrompt(params);
    }
  }

  /**
   * Get industry-specific guidance
   */
  _getIndustryGuidance(industry) {
    const guidance = {
      'sales': `- Focus on understanding customer needs before pitching
- Ask qualifying questions about budget, timeline, and decision-making process
- Provide clear value propositions relevant to their situation`,
      'appointment': `- Confirm appointment details clearly (date, time, service type)
- Ask about any special requests or accommodations needed
- Provide reminder details and cancellation policy`,
      'support': `- Show empathy for their issue
- Ask specific questions to understand the problem
- Guide them through solutions step-by-step
- Escalate to human if issue cannot be resolved`,
      'healthcare': `- Maintain HIPAA compliance and professional medical tone
- Direct medical emergencies to appropriate channels immediately
- Focus on scheduling and general information only`,
      'real-estate': `- Understand property type and price range preferences
- Qualify buyer/seller status and timeline
- Schedule property viewings or consultations`,
      'legal': `- Understand the type of legal matter (without providing legal advice)
- Schedule consultations with appropriate attorneys
- Explain consultation process and expectations`
    };

    return guidance[industry.toLowerCase()] || null;
  }

  /**
   * Get tone-specific guidance
   */
  _getToneGuidance(tone) {
    const tones = {
      'professional': 'Maintain a professional yet warm tone. Be respectful, clear, and helpful.',
      'friendly': 'Use a warm, approachable tone. Be conversational and build rapport quickly.',
      'formal': 'Use a more formal tone. Be precise, structured, and maintain professional distance.',
      'casual': 'Use a relaxed, informal tone. Be conversational and relatable.',
      'empathetic': 'Show high empathy and emotional intelligence. Be understanding and supportive.',
      'sales': 'Be enthusiastic but not pushy. Show genuine interest in helping them succeed.'
    };

    return tones[tone.toLowerCase()] || tones['professional'];
  }

  /**
   * Fallback prompt if generation fails
   */
  _getFallbackPrompt(params) {
    return `You are a professional Voice AI agent for GoHighLevel.

${params.template || 'You help customers with their inquiries and needs.'}

${params.businessHours ? `Business Hours: ${params.businessHours.open} - ${params.businessHours.close}` : ''}

Guidelines:
- Speak naturally and conversationally
- Keep responses concise
- Ask one question at a time
- Listen actively and acknowledge caller input
- Be helpful, professional, and empathetic`;
  }
}

module.exports = VoiceAgentPrimitive;

