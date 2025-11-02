/**
 * Context7 Provider Service
 *
 * Mirrors the OpenAI provider interface so existing orchestration logic
 * can switch providers without branching behavior.
 */

const axios = require('axios');

const DEFAULT_MODEL = 'context7-ultra';

class Context7Provider {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || process.env.CONTEXT7_BASE_URL || 'https://api.context7.ai';
  }

  getHeaders() {
    if (!this.apiKey) {
      throw new Error('Context7 API key not configured');
    }

    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  normaliseMessages(prompt, options = {}) {
    if (Array.isArray(prompt)) {
      return prompt;
    }

    const systemPrompt = options.systemPrompt || 'You are a highly capable Context7 assistant.';
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];
  }

  async generateCompletion(prompt, options = {}) {
    const messages = this.normaliseMessages(prompt, options);

    const payload = {
      model: options.model || DEFAULT_MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 800,
      top_p: options.topP ?? 1,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
    };

    if (options.responseFormat) {
      payload.response_format = options.responseFormat;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/v1/chat/completions`, payload, {
        headers: this.getHeaders(),
      });

      const data = response.data || {};
      const firstChoice = Array.isArray(data.choices) ? data.choices[0] : null;
      const content = firstChoice?.message?.content || firstChoice?.text || '';

      return {
        choices: [
          {
            message: {
              content,
            },
          },
        ],
        usage: {
          prompt_tokens: data.usage?.prompt_tokens ?? null,
          completion_tokens: data.usage?.completion_tokens ?? null,
          total_tokens:
            data.usage?.prompt_tokens != null && data.usage?.completion_tokens != null
              ? data.usage.prompt_tokens + data.usage.completion_tokens
              : null,
        },
        raw: data,
      };
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        throw new Error('Context7 authentication failed. Check CONTEXT7_API_KEY.');
      }

      if (status === 429) {
        throw new Error('Context7 rate limit exceeded. Try again later.');
      }

      throw new Error(
        `Context7 error${status ? ` (${status})` : ''}: ${
          error.response?.data?.error || error.message || 'Unknown error'
        }`
      );
    }
  }

  /**
   * Optional helper for Context7 memory APIs. Exposed so master
   * orchestration can persist / retrieve teachings without a dedicated client.
   */
  async callMemory(endpoint, body) {
    const url = `${this.baseUrl.replace(/\/$/, '')}/v1/memory/${endpoint.replace(/^\//, '')}`;
    const response = await axios.post(url, body, { headers: this.getHeaders() });
    return response.data;
  }
}

module.exports = Context7Provider;
