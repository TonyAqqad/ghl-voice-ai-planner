/**
 * OpenAI Provider Service
 * Handles LLM interactions for agent intelligence
 */

const axios = require('axios');

const DEFAULT_CHAT_MODEL = 'gpt-5-mini';

class OpenAIProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Get authenticated headers
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Generate completion using GPT models
   * @param {string|Array} prompt - String prompt or array of message objects
   * @param {Object} options - Configuration options
   */
  async generateCompletion(prompt, options = {}) {
    // Validate API key format
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Check if API key format looks valid (should start with sk-)
    if (!this.apiKey.startsWith('sk-') && !this.apiKey.startsWith('sk-proj-')) {
      console.warn('⚠️  OpenAI API key format may be invalid. Expected format: sk-... or sk-proj-...');
    }
    
    try {
      const targetModel = options.model || DEFAULT_CHAT_MODEL;
      const useResponsesApi = /^gpt-5/i.test(targetModel);

      // Build messages array
      let messages;
      
      if (Array.isArray(prompt)) {
        // Prompt is already an array of messages (conversation history)
        messages = [
          {
            role: 'system',
            content: options.systemPrompt || 'You are a helpful AI assistant.'
          },
          ...prompt
        ];
      } else {
        // Prompt is a string, use legacy format
        messages = [
          {
            role: 'system',
            content: options.systemPrompt || 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ];
      }

      if (useResponsesApi) {
        const toInputMessage = (msg) => ({
          role: msg.role,
          content: Array.isArray(msg.content)
            ? msg.content
            : [{ type: 'input_text', text: msg.content }]
        });

        const responsePayload = {
          model: targetModel,
          input: messages.map(toInputMessage),
          temperature: options.temperature || 0.7,
          max_output_tokens: options.maxTokens || 1000,
          top_p: options.topP || 1,
        };

        if (options.reasoningEffort || true) {
          responsePayload.reasoning = {
            effort: options.reasoningEffort || 'medium'
          };
        }

        const response = await axios.post(
          `${this.baseUrl}/responses`,
          responsePayload,
          {
            headers: this.getHeaders()
          }
        );

        const extractText = (data) => {
          if (!data) return '';
          if (typeof data.output_text === 'string') {
            return data.output_text;
          }

          if (Array.isArray(data.output)) {
            return data.output
              .flatMap(item =>
                (item.content || [])
                  .filter(chunk => chunk.type === 'output_text' || chunk.type === 'text')
                  .map(chunk => chunk.text || '')
              )
              .join('\n')
              .trim();
          }

          return '';
        };

        const content = extractText(response.data);

        return {
          choices: [
            {
              message: {
                content
              }
            }
          ],
          usage: {
            prompt_tokens: response.data?.usage?.input_tokens ?? null,
            completion_tokens: response.data?.usage?.output_tokens ?? null,
            total_tokens:
              response.data?.usage?.input_tokens != null && response.data?.usage?.output_tokens != null
                ? response.data.usage.input_tokens + response.data.usage.output_tokens
                : null
          }
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: targetModel,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000,
          top_p: options.topP || 1,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0
        },
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      const errorData = error.response?.data || {};
      const statusCode = error.response?.status;
      
      // Provide helpful error messages
      if (statusCode === 401) {
        const errorMessage = errorData.error?.message || 'Unauthorized';
        console.error('❌ OpenAI API Authentication Error (401):');
        console.error(`   ${errorMessage}`);
        console.error('   Check that your OPENAI_API_KEY environment variable is set correctly.');
        console.error('   Valid keys start with "sk-" or "sk-proj-"');
        throw new Error(`OpenAI API authentication failed: ${errorMessage}. Please check your OPENAI_API_KEY in Render environment variables.`);
      } else if (statusCode === 429) {
        console.error('❌ OpenAI API Rate Limit Error (429):');
        console.error('   Rate limit exceeded. Please wait before retrying.');
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
        console.error(`❌ OpenAI API Server Error (${statusCode}):`);
        console.error('   OpenAI service may be temporarily unavailable.');
        throw new Error(`OpenAI API server error (${statusCode}). Please try again later.`);
      }
      
      if (
        statusCode === 400 &&
        options.model !== 'gpt-4o-mini' &&
        (errorData?.error?.message || '').toLowerCase().includes('model')
      ) {
        console.warn(`⚠️  OpenAI rejected model "${options.model || DEFAULT_CHAT_MODEL}". Falling back to gpt-4o-mini.`);
        return this.generateCompletion(prompt, {
          ...options,
          model: 'gpt-4o-mini'
        });
      }

      console.error('OpenAI generateCompletion error:', errorData || error.message);
      throw error;
    }
  }

  /**
   * Generate system prompt for voice agent
   */
  async generateSystemPrompt(businessDescription, industry, options = {}) {
    const prompt = `Create a professional system prompt for a voice AI agent for a ${industry} business.

Business Description: ${businessDescription}

Requirements:
- Professional and helpful tone
- Industry-specific knowledge
- Clear conversation flow
- Appropriate escalation procedures
- Compliance awareness (TCPA, GDPR if applicable)

Generate a comprehensive system prompt that will guide the AI agent's behavior during phone conversations.`;

    try {
      const response = await this.generateCompletion(prompt, {
        model: options.model || DEFAULT_CHAT_MODEL,
        temperature: options.temperature || 0.3,
        maxTokens: options.maxTokens || 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI generateSystemPrompt error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate conversation scripts
   */
  async generateScripts(businessType, industry, options = {}) {
    const prompt = `Generate conversation scripts for a voice AI agent serving a ${industry} business.

Business Type: ${businessType}

Create scripts for:
1. Greeting - Professional opening
2. Main conversation - Core interaction flow
3. Fallback - When AI doesn't understand
4. Transfer - Escalation to human
5. Goodbye - Professional closing

Each script should be natural, conversational, and appropriate for phone conversations.`;

    try {
      const response = await this.generateCompletion(prompt, {
        model: options.model || DEFAULT_CHAT_MODEL,
        temperature: options.temperature || 0.5,
        maxTokens: options.maxTokens || 1500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI generateScripts error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate intents and responses
   */
  async generateIntents(businessDescription, industry, options = {}) {
    const prompt = `Generate common customer intents and appropriate responses for a ${industry} business.

Business Description: ${businessDescription}

For each intent, provide:
1. Intent name (e.g., "book_appointment", "check_hours", "pricing_inquiry")
2. Trigger phrases (what customers might say)
3. Appropriate response
4. Required information to collect
5. Next steps or actions

Focus on the most common customer interactions for this type of business.`;

    try {
      const response = await this.generateCompletion(prompt, {
        model: options.model || DEFAULT_CHAT_MODEL,
        temperature: options.temperature || 0.4,
        maxTokens: options.maxTokens || 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI generateIntents error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate knowledge base content
   */
  async generateKnowledgeBase(businessDescription, industry, options = {}) {
    const prompt = `Generate a comprehensive knowledge base for a voice AI agent serving a ${industry} business.

Business Description: ${businessDescription}

Create knowledge base entries covering:
1. Business hours and location
2. Services/products offered
3. Pricing information
4. Policies and procedures
5. Frequently asked questions
6. Contact information
7. Special offers or promotions

Each entry should be concise but informative, suitable for voice conversation.`;

    try {
      const response = await this.generateCompletion(prompt, {
        model: options.model || DEFAULT_CHAT_MODEL,
        temperature: options.temperature || 0.3,
        maxTokens: options.maxTokens || 3000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI generateKnowledgeBase error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Analyze conversation transcript
   */
  async analyzeTranscript(transcript, options = {}) {
    const prompt = `Analyze this phone conversation transcript and provide insights:

Transcript: ${transcript}

Provide analysis on:
1. Customer intent and satisfaction
2. Agent performance
3. Areas for improvement
4. Key information collected
5. Follow-up actions needed
6. Sentiment analysis

Format as structured JSON with clear categories.`;

    try {
      const response = await this.generateCompletion(prompt, {
        model: options.model || DEFAULT_CHAT_MODEL,
        temperature: options.temperature || 0.2,
        maxTokens: options.maxTokens || 1500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI analyzeTranscript error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Optimize agent performance
   */
  async optimizeAgent(currentConfig, performanceData, options = {}) {
    const prompt = `Analyze this voice AI agent configuration and performance data to suggest optimizations:

Current Configuration: ${JSON.stringify(currentConfig, null, 2)}
Performance Data: ${JSON.stringify(performanceData, null, 2)}

Suggest improvements for:
1. System prompt optimization
2. Script improvements
3. Intent recognition enhancement
4. Response quality
5. Conversation flow
6. Escalation triggers

Provide specific, actionable recommendations.`;

    try {
      const response = await this.generateCompletion(prompt, {
        model: options.model || DEFAULT_CHAT_MODEL,
        temperature: options.temperature || 0.3,
        maxTokens: options.maxTokens || 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI optimizeAgent error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate A/B test variants
   */
  async generateABTestVariants(basePrompt, testType, options = {}) {
    const prompt = `Generate A/B test variants for this voice AI agent prompt:

Base Prompt: ${basePrompt}
Test Type: ${testType}

Create 3 different variants that test:
1. Tone variation (professional vs friendly vs casual)
2. Length variation (concise vs detailed)
3. Approach variation (direct vs consultative)

Each variant should maintain the core functionality while testing the specific aspect.`;

    try {
      const response = await this.generateCompletion(prompt, {
        model: options.model || DEFAULT_CHAT_MODEL,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI generateABTestVariants error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Estimate cost for completion
   */
  estimateCost(prompt, model = DEFAULT_CHAT_MODEL, maxTokens = 1000) {
    // Rough estimation based on token count
    const inputTokens = Math.ceil(prompt.length / 4); // Rough token estimation
    const outputTokens = maxTokens;
    
    let costPerInputToken, costPerOutputToken;
    
    switch (model) {
      case 'gpt-4':
        costPerInputToken = 0.00003;
        costPerOutputToken = 0.00006;
        break;
      case 'gpt-5-mini':
        costPerInputToken = 0.00000025;
        costPerOutputToken = 0.000002;
        break;
      case 'gpt-3.5-turbo':
        costPerInputToken = 0.0000015;
        costPerOutputToken = 0.000002;
        break;
      default:
        costPerInputToken = 0.00003;
        costPerOutputToken = 0.00006;
    }
    
    return (inputTokens * costPerInputToken) + (outputTokens * costPerOutputToken);
  }

  /**
   * Get available models
   */
  async getModels() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/models`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data.data.filter(model => 
        model.id.includes('gpt') || model.id.includes('text')
      );
    } catch (error) {
      console.error('OpenAI getModels error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate speech from text using OpenAI TTS
   */
  async generateSpeech(text, voice, options = {}) {
    try {
      const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      if (!validVoices.includes(voice)) {
        throw new Error(`Invalid voice. Must be one of: ${validVoices.join(', ')}`);
      }

      const response = await axios.post(
        `${this.baseUrl}/audio/speech`,
        {
          model: options.model || 'tts-1',
          input: text,
          voice: voice,
          ...(options.speed !== undefined && { speed: options.speed })
        },
        {
          headers: this.getHeaders(),
          responseType: 'arraybuffer'
        }
      );

      return response.data;
    } catch (error) {
      console.error('OpenAI generateSpeech error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = OpenAIProvider;
