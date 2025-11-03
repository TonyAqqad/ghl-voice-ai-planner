/**
 * Master AI Manager - Server Endpoints
 *
 * Provides Master AI orchestration with:
 * - Pre-turn guidance
 * - Quality review and gating
 * - Automatic intervention
 * - Pattern learning
 * - Full observability
 */

const crypto = require('crypto');
const { runLLM } = require('../providers/llm-utils');

const DATE_RULE_REGEX = /specific\s+(?:date|time)|date\/time/i;

/**
 * Generate a short hash of a prompt for tracking/comparison
 */
const generatePromptHash = (prompt) => {
  if (!prompt) return 'none';
  return crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 8);
};

const normalizeWhitespace = (value = '') =>
  value.replace(/\s+/g, ' ').trim();

const hasLikelyDate = (text = '') => {
  const dayPattern =
    /\b(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i;
  const monthPattern =
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;
  const slashDatePattern =
    /\b(?:0?[1-9]|1[0-2])[\/-](?:0?[1-9]|[12][0-9]|3[01])[\/-](?:\d{2}|\d{4})\b/;

  return (
    dayPattern.test(text) ||
    monthPattern.test(text) ||
    slashDatePattern.test(text)
  );
};

const hasLikelyTime = (text = '') => {
  const twelveHourPattern =
    /\b(?:[01]?\d|2[0-3])(?::[0-5]\d)?\s?(?:am|pm)\b/i;
  const twentyFourHourPattern = /\b(?:[01]\d|2[0-3]):[0-5]\d\b/;
  return (
    twelveHourPattern.test(text) ||
    twentyFourHourPattern.test(text) ||
    /\bnoon\b/i.test(text) ||
    /\bmidnight\b/i.test(text)
  );
};

/**
 * Generate pre-turn guidance
 * POST /api/mcp/master/preTurnGuidance
 */
async function preTurnGuidance(req, res) {
  try {
    const {
      agentId,
      niche,
      systemPrompt,
      conversation = [],
      fieldsCollected = [],
      goldenDatasetMode = false,
      traceId,
    } = req.body;

    const promptHash = generatePromptHash(systemPrompt);

    console.log(`🎯 Pre-turn guidance for agent ${agentId} [${traceId}]`);
    console.log(`🔍 DIAGNOSTIC: Pre-Turn Guidance Request`, {
      traceId,
      agentId,
      niche,
      temperature: 0.3,
      llmProvider: req.body.llmProvider || 'openai',
      systemPromptHash: promptHash,
      systemPromptLength: systemPrompt?.length || 0,
      conversationTurns: conversation.length,
      fieldsCollected: fieldsCollected.length,
      goldenDatasetMode,
    });

    const conversationContext = conversation
      .map(turn => `${turn.role === 'caller' ? 'Caller' : 'Agent'}: ${turn.text}`)
      .join('\n');

    const guidancePrompt = `You are a Master AI providing guidance to a voice agent.

YOUR ONLY JOB: Follow the system prompt rules below EXACTLY. Do not add your own opinions or rules.

===== AGENT'S SYSTEM PROMPT (FOLLOW THIS EXACTLY) =====
${systemPrompt || 'N/A'}
===== END SYSTEM PROMPT =====

CONVERSATION SO FAR:
${conversationContext || '(No conversation yet)'}

FIELDS ALREADY COLLECTED: ${fieldsCollected.join(', ') || 'None'}

NICHE: ${niche}

Based ONLY on the system prompt above, provide the IDEAL next response.

Return JSON:
{
  "recommendedResponse": "the ideal agent response (following system prompt rules exactly)",
  "reasoning": ["why this follows the system prompt"],
  "confidence": 0-1,
  "fieldToCollect": "next field name or null",
  "alternativeResponses": ["alternative 1", "alternative 2"]
}

CRITICAL: Do not invent rules. Only follow what's written in the system prompt above.
Return ONLY the JSON object.`;

    const { payload: guidance, usage, model: usedModel } = await runLLM(req.body.llmProvider, guidancePrompt, {
      temperature: 0.3,
      maxTokens: 500,
      responseFormat: { type: 'json_object' },
    });

    // Rules checked
    const rulesChecked = [
      'field_order',
      'one_question_per_turn',
      'response_length',
      'tone_appropriateness',
    ];

    console.log(
      `✅ Guidance generated [${traceId}] via ${usedModel}: "${
        guidance.recommendedResponse.substring(0, 50)
      }..."`
    );
    console.log(`🔍 DIAGNOSTIC: Pre-Turn Guidance Response`, {
      traceId,
      model: usedModel,
      temperature: 0.3,
      tokensIn: usage?.prompt_tokens || 0,
      tokensOut: usage?.completion_tokens || 0,
      tokensTotal: usage?.total_tokens || 0,
      confidence: guidance.confidence,
      fieldToCollect: guidance.fieldToCollect || 'none',
      recommendedResponseLength: guidance.recommendedResponse?.length || 0,
      recommendedResponsePreview: guidance.recommendedResponse?.substring(0, 100),
      reasoning: guidance.reasoning,
      alternativeCount: guidance.alternativeResponses?.length || 0,
    });

    return res.json({
      ok: true,
      guidance,
      model: usedModel,
      rulesChecked,
      usage,
    });
  } catch (error) {
    console.error('❌ Pre-turn guidance error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n')[0]
    });
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to generate guidance',
      details: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    });
  }
}

/**
 * Review response with quality gates
 * POST /api/mcp/master/reviewResponse
 */
async function reviewResponse(req, res) {
  try {
    const {
      agentId,
      niche,
      systemPrompt,
      response,
      conversation = [],
      qualityThreshold = 70,
      confidenceThreshold = 70,
      goldenDatasetMode = false,
      traceId,
    } = req.body;

    const promptHash = generatePromptHash(systemPrompt);

    console.log(`🔍 Reviewing response for agent ${agentId} [${traceId}]`);
    console.log(`🔍 DIAGNOSTIC: Quality Review Request`, {
      traceId,
      agentId,
      niche,
      temperature: 0.2,
      llmProvider: req.body.llmProvider || 'openai',
      systemPromptHash: promptHash,
      systemPromptLength: systemPrompt?.length || 0,
      conversationTurns: conversation.length,
      responseLength: response?.length || 0,
      responsePreview: response?.substring(0, 100),
      qualityThreshold,
      confidenceThreshold,
      goldenDatasetMode,
    });

    const conversationContext = conversation
      .map(turn => `${turn.role === 'caller' ? 'Caller' : 'Agent'}: ${turn.text}`)
      .join('\n');

    const reviewPrompt = `You are a Master AI quality reviewer for voice agents.

YOUR ONLY JOB: Check if the response follows the system prompt rules below. Do not enforce rules that are NOT in the system prompt.

===== AGENT'S SYSTEM PROMPT (ENFORCE ONLY THESE RULES) =====
${systemPrompt || 'N/A'}
===== END SYSTEM PROMPT =====

CONVERSATION CONTEXT:
${conversationContext || '(No conversation yet)'}

AGENT RESPONSE TO REVIEW:
"${response}"

Review ONLY against the rules in the system prompt above. Return JSON:
{
  "approved": true/false,
  "score": 0-100,
  "issues": ["only issues that violate the ACTUAL system prompt"],
  "suggestions": ["suggestions based on system prompt"],
  "confidenceScore": 0-100,
  "blockedReasons": ["specific system prompt rule violations"],
  "suggestedResponse": "better response if needed"
}

Universal checks (always apply):
1. No AI self-reference ("I'm an AI", "I don't have access")
2. No backend mentions (GHL, CRM, Capture Client, system names)

ALL OTHER CHECKS: Only enforce what's explicitly in the system prompt.

If in training/testing mode, be MORE LENIENT with scores (minimum 60 unless critical violation).

Return ONLY the JSON object.`;

    const { payload: review, usage, model: usedModel } = await runLLM(req.body.llmProvider, reviewPrompt, {
      temperature: 0.2,
      maxTokens: 600,
      responseFormat: { type: 'json_object' },
    });

    // Normalise response collections for downstream logic
    review.issues = Array.isArray(review.issues)
      ? review.issues
      : review.issues
      ? [String(review.issues)]
      : [];
    review.suggestions = Array.isArray(review.suggestions)
      ? review.suggestions
      : review.suggestions
      ? [String(review.suggestions)]
      : [];
    review.blockedReasons = Array.isArray(review.blockedReasons)
      ? review.blockedReasons
      : review.blockedReasons
      ? [String(review.blockedReasons)]
      : [];

    const normalizedOriginal = normalizeWhitespace(response);
    const normalizedSuggestion = normalizeWhitespace(review.suggestedResponse || '');
    const suggestionMatchesOriginal =
      normalizedOriginal.length > 0 &&
      normalizedSuggestion.length > 0 &&
      normalizedOriginal === normalizedSuggestion;

    const autopassReasons = [];

    if (
      review.issues.some(issue => DATE_RULE_REGEX.test(issue)) &&
      hasLikelyDate(response) &&
      hasLikelyTime(response)
    ) {
      review.issues = review.issues.filter(issue => !DATE_RULE_REGEX.test(issue));
      review.blockedReasons = review.blockedReasons.filter(
        reason => !DATE_RULE_REGEX.test(reason)
      );
      review.suggestions = review.suggestions.filter(
        suggestion => !DATE_RULE_REGEX.test(suggestion)
      );
      autopassReasons.push('date_time_present');
    }

    if (suggestionMatchesOriginal) {
      autopassReasons.push('identical_suggestion');
    }

    const autoCleared =
      autopassReasons.length > 0 &&
      review.issues.length === 0 &&
      review.blockedReasons.length === 0;

    if (autoCleared) {
      review.approved = true;
      review.blockedReasons = [];
      review.score = Math.max(review.score, qualityThreshold);
      review.warnings = [
        ...(review.warnings || []),
        `Auto-cleared quality gate (${autopassReasons.join(', ')})`,
      ];
      console.log(
        `🟢 Quality gate auto-cleared [${traceId}] due to ${autopassReasons.join(', ')}`
      );
    } else if (suggestionMatchesOriginal) {
      review.warnings = [
        ...(review.warnings || []),
        'Suggested fix matches the original response—verify prompt alignment.',
      ];
    }

    // Enforce quality threshold (but be lenient in training mode)
    // Only block on CRITICAL violations, not low scores during training
    const hasCriticalViolation = review.issues && review.issues.some(issue => 
      issue.toLowerCase().includes('ai reference') || 
      issue.toLowerCase().includes('backend mention') ||
      issue.toLowerCase().includes('ghl') ||
      issue.toLowerCase().includes('crm')
    );
    
    if (hasCriticalViolation) {
      review.approved = false;
      if (!review.blockedReasons || review.blockedReasons.length === 0) {
        review.blockedReasons = ['Critical violation: AI self-reference or backend mention'];
      }
    } else if (review.score < qualityThreshold && !goldenDatasetMode) {
      // Low score but no critical violation - warn but DON'T block in training
      review.approved = true; // Allow in training mode
      review.warnings = [`Score ${review.score} below threshold ${qualityThreshold} - monitor closely`];
    }

    // Rules checked
    const rulesChecked = [
      'one_question',
      'response_length',
      'no_ai_reference',
      'no_backend_mention',
      'tone_check',
      'field_order',
    ];

    console.log(
      `✅ Review complete [${traceId}] via ${usedModel}: ${review.approved ? 'APPROVED' : 'BLOCKED'} (score: ${review.score})`
    );
    console.log(`🔍 DIAGNOSTIC: Quality Review Response`, {
      traceId,
      model: usedModel,
      temperature: 0.2,
      tokensIn: usage?.prompt_tokens || 0,
      tokensOut: usage?.completion_tokens || 0,
      tokensTotal: usage?.total_tokens || 0,
      approved: review.approved,
      score: review.score,
      confidenceScore: review.confidenceScore,
      issuesCount: review.issues?.length || 0,
      issues: review.issues,
      blockedReasonsCount: review.blockedReasons?.length || 0,
      blockedReasons: review.blockedReasons,
      warningsCount: review.warnings?.length || 0,
      warnings: review.warnings,
      hasSuggestedResponse: !!review.suggestedResponse,
      suggestedResponseLength: review.suggestedResponse?.length || 0,
      suggestionsCount: review.suggestions?.length || 0,
    });

    return res.json({
      ok: true,
      review,
      model: usedModel,
      rulesChecked,
      usage,
    });
  } catch (error) {
    console.error('❌ Review error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to review response',
    });
  }
}

/**
 * Intervene and fix response
 * POST /api/mcp/master/intervene
 */
async function intervene(req, res) {
  try {
    const {
      agentId,
      niche,
      originalResponse,
      issues = [],
      systemPrompt,
      traceId,
    } = req.body;

    console.log(`🔧 Intervening on response for agent ${agentId} [${traceId}]`);

    const interventionPrompt = `You are a Master AI fixing a problematic response.

ORIGINAL RESPONSE:
"${originalResponse}"

ISSUES FOUND:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

SYSTEM PROMPT (RULES TO FOLLOW):
${systemPrompt || 'N/A'}

NICHE: ${niche}

Fix the response to address all issues while maintaining the intent.

Return JSON:
{
  "correctedResponse": "the fixed response",
  "reasoning": "why this is better",
  "changesMade": ["change 1", "change 2"],
  "autoApplied": true (recommend auto-applying this fix?)
}

Keep it natural, conversational, and appropriate for ${niche}.
Return ONLY the JSON object.`;

    const { payload: intervention, usage, model: usedModel } = await runLLM(
      req.body.llmProvider,
      interventionPrompt,
      {
        temperature: 0.3,
        maxTokens: 400,
        responseFormat: { type: 'json_object' },
      }
    );

    console.log(
      `✅ Intervention complete [${traceId}] via ${usedModel}: "${
        intervention.correctedResponse.substring(0, 50)
      }..."`
    );

    return res.json({
      ok: true,
      ...intervention,
      model: usedModel,
      usage,
    });
  } catch (error) {
    console.error('❌ Intervention error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to intervene',
    });
  }
}

/**
 * Learn patterns from interactions
 * POST /api/mcp/master/learnPattern
 */
async function learnPattern(req, res) {
  try {
    const {
      agentId,
      niche,
      conversation = [],
      outcome,
      interventions = [],
      traceId,
    } = req.body;

    console.log(`📚 Learning patterns for agent ${agentId} [${traceId}]`);

    const conversationContext = conversation
      .map(turn => `${turn.role === 'caller' ? 'Caller' : 'Agent'}: ${turn.text}`)
      .join('\n');

    const interventionContext = interventions.length > 0
      ? `\n\nINTERVENTIONS MADE:\n${interventions.map(i => `- ${i.issue}: ${i.originalResponse} → ${i.correctedResponse}`).join('\n')}`
      : '';

    const learningPrompt = `You are a Master AI learning from voice agent interactions.

CONVERSATION:
${conversationContext}

OUTCOME: ${outcome}${interventionContext}

NICHE: ${niche}

Analyze this interaction and extract 2-3 actionable patterns.

Return JSON:
{
  "patterns": [
    {
      "pattern": "When X happens (e.g., 'When caller mentions urgency')",
      "action": "Agent should Y (e.g., 'reduce small talk and get to booking faster')",
      "confidence": 0-1,
      "examples": ["example from this conversation"]
    }
  ]
}

Focus on:
1. What worked well (if success)
2. What went wrong (if failure)
3. Patterns that could improve future interactions
4. Niche-specific insights

Return ONLY the JSON object.`;

    const { payload: data, usage, model: usedModel, latencyMs } = await runLLM(
      req.body.llmProvider,
      learningPrompt,
      {
        // allow override via request model if provided
        model: req.body.model || undefined,
        temperature: 0.4,
        maxTokens: 800,
        responseFormat: { type: 'json_object' },
      }
    );

    // Add metadata to patterns
    const patterns = (data.patterns || []).map(p => ({
      ...p,
      id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      agentId,
      niche,
      createdAt: new Date().toISOString(),
      appliedCount: 0,
    }));

    const promptTokens = usage?.prompt_tokens ?? Math.ceil(learningPrompt.length / 4);
    const completionTokens = usage?.completion_tokens ?? Math.ceil(JSON.stringify(patterns).length / 4);
    const tokensUsed = promptTokens + completionTokens;
    const costUsd = usage?.total_tokens
      ? (usage.total_tokens / 1000) * 0.002
      : (tokensUsed / 1000) * 0.002;

    console.log(`✅ Learned ${patterns.length} patterns [${traceId}] via ${usedModel}`);

    // Save patterns to memory (hybrid: database + Context7)
    try {
      const MemoryAdapterServer = require('../lib/memoryAdapterServer');
      const { generateScopeId } = require('../lib/scopeUtils');
      const memoryAdapter = new MemoryAdapterServer();
      
      // CRITICAL: Generate proper scopeId with SHA-256 hash of system prompt
      const systemPrompt = req.body.systemPrompt || req.body.prompt || '';
      if (!systemPrompt) {
        throw new Error('System prompt required for scopeId generation');
      }
      
      const scopeId = await generateScopeId({
        locationId: req.body.locationId || 'default',
        agentId,
        promptText: systemPrompt,
      });
      
      console.log(`📊 Using scopeId: ${scopeId}`);
      
      let savedCount = 0;
      let savedSources = [];
      
      for (const pattern of patterns) {
        const snippet = {
          id: pattern.id,
          scopeId,
          trigger: pattern.trigger || 'general',
          content: pattern.example || pattern.guidance || pattern.pattern,
          appliedAt: Date.now(),
          source: 'post-call',
          charLength: (pattern.example || pattern.guidance || pattern.pattern).length,
        };
        
        const result = await memoryAdapter.saveSnippet(snippet);
        savedCount++;
        if (result.source && !savedSources.includes(result.source)) {
          savedSources.push(result.source);
        }
      }
      
      console.log(`💾 Saved ${savedCount} patterns to memory (${savedSources.join(', ')})`);
    } catch (memoryError) {
      console.error('Failed to save patterns to memory:', memoryError);
      // Don't fail the request - patterns are still returned
    }

    return res.json({
      ok: true,
      patterns,
      model: usedModel,
      latencyMs,
      costUsd,
      usage,
    });
  } catch (error) {
    console.error('❌ Learning error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to learn patterns',
      patterns: [],
    });
  }
}

/**
 * Review entire call transcript
 * POST /api/mcp/master/reviewCall
 */
async function reviewCall(req, res) {
  try {
    const {
      agentId,
      niche,
      systemPrompt,
      conversation = [],
      qualityThreshold = 70,
      confidenceThreshold = 70,
      traceId,
    } = req.body;

    console.log(`📞 Post-call review for agent ${agentId} [${traceId}] (turns: ${conversation.length})`);

    if (!Array.isArray(conversation) || conversation.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Conversation transcript is required for post-call review',
      });
    }

    const transcript = conversation
      .map((turn, index) => {
        const speaker = turn.role === 'caller' ? 'Caller' : 'Agent';
        return `${index + 1}. ${speaker}: ${normalizeWhitespace(turn.text || '')}`;
      })
      .join('\n');

    const reviewPrompt = `You are a Master AI quality reviewer for Go High Level Voice AI agents.

Evaluate the ENTIRE CALL transcript. Focus STRICTLY on the system prompt rules.

===== SYSTEM PROMPT (ENFORCE ONLY THESE RULES) =====
${systemPrompt || 'N/A'}
===== END SYSTEM PROMPT =====

===== CALL TRANSCRIPT =====
${transcript}
===== END TRANSCRIPT =====

Return JSON:
{
  "approved": true/false,
  "score": 0-100,
  "confidenceScore": 0-100,
  "summary": "one paragraph summary of call quality",
  "issues": ["issue tied to RULES in system prompt"],
  "suggestions": ["actionable improvements grounded in system prompt"],
  "blockedReasons": ["critical reasons if the call should be blocked"],
  "keyMoments": ["significant events in the conversation"],
  "handoffRecommended": true/false,
  "suggestedTranscript": "optional rewritten agent response(s) if needed"
}

If no issues, return empty arrays.
Do NOT invent new rules. Only enforce what is explicitly written in the system prompt.
Lower scores if confirmation/order requirements are missed.`;

    const { payload, usage, model: usedModel } = await runLLM(
      req.body.llmProvider,
      reviewPrompt,
      {
        temperature: 0.2,
        maxTokens: 900,
        responseFormat: { type: 'json_object' },
      }
    );

    const review = {
      approved: typeof payload.approved === 'boolean'
        ? payload.approved
        : (typeof payload.score === 'number' ? payload.score >= qualityThreshold : true),
      score: typeof payload.score === 'number' ? payload.score : 100,
      confidenceScore: typeof payload.confidenceScore === 'number'
        ? payload.confidenceScore
        : confidenceThreshold,
      summary: payload.summary || '',
      issues: Array.isArray(payload.issues) ? payload.issues : [],
      suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
      blockedReasons: Array.isArray(payload.blockedReasons) ? payload.blockedReasons : [],
      keyMoments: Array.isArray(payload.keyMoments) ? payload.keyMoments : [],
      handoffRecommended: Boolean(payload.handoffRecommended),
      suggestedTranscript: payload.suggestedTranscript || null,
    };

    const promptTokens = usage?.prompt_tokens ?? Math.ceil(reviewPrompt.length / 4);
    const completionTokens = usage?.completion_tokens ?? Math.ceil(JSON.stringify(review).length / 4);
    const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;
    const costUsd = (totalTokens / 1000) * 0.002;

    console.log(`✅ Post-call review complete [${traceId}] via ${usedModel} • Score ${review.score}/100`);

    return res.json({
      ok: true,
      review,
      model: usedModel,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
      },
      costUsd,
    });
  } catch (error) {
    console.error('❌ Post-call review error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to review call',
    });
  }
}

module.exports = {
  preTurnGuidance,
  reviewResponse,
  reviewCall,
  intervene,
  learnPattern,
};

