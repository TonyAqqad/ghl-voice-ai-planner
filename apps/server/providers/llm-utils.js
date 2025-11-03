const OpenAIProvider = require('./openai');
const Context7Provider = require('./context7');

const providerCache = {
  openai: null,
  context7: null,
};

function selectProvider(llmProvider) {
  const rawKey = llmProvider || 'openai';
  const key = rawKey.toLowerCase();

  if (key === 'context7') {
    if (!providerCache.context7) {
      providerCache.context7 = new Context7Provider(
        process.env.CONTEXT7_API_KEY,
        process.env.CONTEXT7_BASE_URL
      );
    }
    return {
      key: 'context7',
      provider: providerCache.context7,
      defaultModel: 'context7-ultra',
    };
  }

  if (!['openai', 'anthropic', 'azure', 'cohere'].includes(key)) {
    console.warn(`⚠️  Unknown llmProvider "${rawKey}". Falling back to OpenAI.`);
  } else if (key !== 'openai') {
    console.warn(`⚠️  LLM provider "${rawKey}" not yet implemented; using OpenAI fallback.`);
  }

  if (!providerCache.openai) {
    providerCache.openai = new OpenAIProvider(process.env.OPENAI_API_KEY);
  }

  return {
    key: 'openai',
    provider: providerCache.openai,
    defaultModel: 'gpt-4o-mini',
  };
}

function coerceJsonPayload(result) {
  if (!result) {
    throw new Error('LLM returned empty response');
  }

  const usage = result.usage || result.raw?.usage || null;

  if (typeof result === 'string') {
    return { payload: JSON.parse(result), usage };
  }

  const extractFromChoices = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    const choice = Array.isArray(obj.choices) ? obj.choices[0] : null;
    if (!choice) return null;
    const content =
      choice.message?.content ||
      choice.delta?.content ||
      choice.text ||
      null;
    return typeof content === 'string' ? content : null;
  };

  const messageContent = extractFromChoices(result) || extractFromChoices(result.raw);
  if (messageContent) {
    try {
      // Try parsing directly first
      return { payload: JSON.parse(messageContent), usage };
    } catch (error) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = messageContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return { payload: JSON.parse(jsonMatch[1]), usage };
        } catch (innerError) {
          throw new Error(`Failed to parse JSON from markdown: ${jsonMatch[1].slice(0, 200)}`);
        }
      }
      throw new Error(`Failed to parse JSON from LLM response: ${messageContent.slice(0, 200)}`);
    }
  }

  if (
    typeof result === 'object' &&
    (result.recommendedResponse || result.approved !== undefined || result.patterns)
  ) {
    return { payload: result, usage };
  }

  if (result.raw && typeof result.raw === 'string') {
    return { payload: JSON.parse(result.raw), usage };
  }

  throw new Error('LLM response missing JSON payload.');
}

async function runLLM(llmProvider, prompt, options = {}) {
  const { provider, defaultModel, key } = selectProvider(llmProvider);
  const model = options.model || defaultModel;
  const start = Date.now();
  const result = await provider.generateCompletion(prompt, {
    ...options,
    model,
  });
  const latencyMs = Date.now() - start;
  const { payload, usage } = coerceJsonPayload(result);
  return { payload, usage, model, latencyMs, providerKey: key };
}

module.exports = {
  runLLM,
  selectProvider,
  coerceJsonPayload,
};

