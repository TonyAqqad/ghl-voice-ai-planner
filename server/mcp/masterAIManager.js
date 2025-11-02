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

const OpenAIProvider = require('../providers/openai');

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

    console.log(`🎯 Pre-turn guidance for agent ${agentId} [${traceId}]`);

    const conversationContext = conversation
      .map(turn => `${turn.role === 'caller' ? 'Caller' : 'Agent'}: ${turn.text}`)
      .join('\n');

    const guidancePrompt = `You are a Master AI providing guidance to a voice agent.

SYSTEM PROMPT FOR AGENT:
${systemPrompt || 'N/A'}

CONVERSATION SO FAR:
${conversationContext || '(No conversation yet)'}

FIELDS ALREADY COLLECTED: ${fieldsCollected.join(', ') || 'None'}

NICHE: ${niche}

Provide the IDEAL next response for the agent. Consider:
1. What field should be collected next (in order)?
2. Keep it 1-2 sentences max
3. Ask ONE question only
4. Natural, conversational tone appropriate for ${niche}
5. Follow all rules in the system prompt

Return JSON:
{
  "recommendedResponse": "the ideal agent response",
  "reasoning": ["reason 1", "reason 2", "reason 3"],
  "confidence": 0-1 (how confident you are this is correct),
  "fieldToCollect": "next field name or null",
  "alternativeResponses": ["alternative 1", "alternative 2"]
}

Return ONLY the JSON object.`;

    const openai = new OpenAIProvider(process.env.OPENAI_API_KEY);
    const result = await openai.generateCompletion(guidancePrompt, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 500,
      responseFormat: { type: 'json_object' }
    });

    // Parse result if it's a string, otherwise use as-is
    const guidance = typeof result === 'string' ? JSON.parse(result) : result;

    // Rules checked
    const rulesChecked = [
      'field_order',
      'one_question_per_turn',
      'response_length',
      'tone_appropriateness',
    ];

    console.log(`✅ Guidance generated [${traceId}]: "${guidance.recommendedResponse.substring(0, 50)}..."`);

    return res.json({
      ok: true,
      guidance,
      model: 'gpt-4o-mini',
      rulesChecked,
    });
  } catch (error) {
    console.error('❌ Pre-turn guidance error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to generate guidance',
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

    console.log(`🔍 Reviewing response for agent ${agentId} [${traceId}]`);

    const conversationContext = conversation
      .map(turn => `${turn.role === 'caller' ? 'Caller' : 'Agent'}: ${turn.text}`)
      .join('\n');

    const reviewPrompt = `You are a Master AI quality reviewer for voice agents.

SYSTEM PROMPT (RULES TO FOLLOW):
${systemPrompt || 'N/A'}

CONVERSATION CONTEXT:
${conversationContext || '(No conversation yet)'}

AGENT RESPONSE TO REVIEW:
"${response}"

Review this response against the rules. Return JSON:
{
  "approved": true/false (should this response be allowed?),
  "score": 0-100 (quality score),
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "confidenceScore": 0-100 (confidence this agent is performing well),
  "blockedReasons": ["why blocked if not approved"],
  "suggestedResponse": "better response if score < ${qualityThreshold}"
}

Critical checks:
1. ONE question only? (not multiple)
2. 1-2 sentences max?
3. No AI self-reference ("I'm an AI", "I don't have access")?
4. No backend mentions (GHL, CRM, Capture Client)?
5. Appropriate tone for ${niche}?
6. Following field collection order?

Return ONLY the JSON object.`;

    const openai = new OpenAIProvider(process.env.OPENAI_API_KEY);
    const result = await openai.generateCompletion(reviewPrompt, {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 600,
      responseFormat: { type: 'json_object' }
    });

    // Parse result if it's a string, otherwise use as-is
    const review = typeof result === 'string' ? JSON.parse(result) : result;

    // Enforce quality threshold
    if (review.score < qualityThreshold && !goldenDatasetMode) {
      review.approved = false;
      if (!review.blockedReasons || review.blockedReasons.length === 0) {
        review.blockedReasons = [`Score ${review.score} below threshold ${qualityThreshold}`];
      }
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

    console.log(`✅ Review complete [${traceId}]: ${review.approved ? 'APPROVED' : 'BLOCKED'} (score: ${review.score})`);

    return res.json({
      ok: true,
      review,
      model: 'gpt-4o-mini',
      rulesChecked,
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

    const openai = new OpenAIProvider(process.env.OPENAI_API_KEY);
    const result = await openai.generateCompletion(interventionPrompt, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 400,
      responseFormat: { type: 'json_object' }
    });

    // Parse result if it's a string, otherwise use as-is
    const intervention = typeof result === 'string' ? JSON.parse(result) : result;

    console.log(`✅ Intervention complete [${traceId}]: "${intervention.correctedResponse.substring(0, 50)}..."`);

    return res.json({
      ok: true,
      ...intervention,
      model: 'gpt-4o-mini',
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

    const openai = new OpenAIProvider(process.env.OPENAI_API_KEY);
    const startTime = Date.now();
    
    const result = await openai.generateCompletion(learningPrompt, {
      model: 'gpt-4o', // Use stronger model for learning
      temperature: 0.4,
      maxTokens: 800,
      responseFormat: { type: 'json_object' }
    });

    // Parse result if it's a string, otherwise use as-is
    const data = typeof result === 'string' ? JSON.parse(result) : result;
    const latencyMs = Date.now() - startTime;

    // Add metadata to patterns
    const patterns = (data.patterns || []).map(p => ({
      ...p,
      id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      agentId,
      niche,
      createdAt: new Date().toISOString(),
      appliedCount: 0,
    }));

    // Estimate cost
    const tokensUsed = Math.ceil((learningPrompt.length + result.length) / 4);
    const costUsd = (tokensUsed / 1000) * 0.002; // GPT-4o pricing

    console.log(`✅ Learned ${patterns.length} patterns [${traceId}]`);

    return res.json({
      ok: true,
      patterns,
      model: 'gpt-4o',
      latencyMs,
      costUsd,
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

module.exports = {
  preTurnGuidance,
  reviewResponse,
  intervene,
  learnPattern,
};

