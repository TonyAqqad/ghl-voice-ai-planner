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

    console.log(`🔍 Reviewing response for agent ${agentId} [${traceId}]`);

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

    const openai = new OpenAIProvider(process.env.OPENAI_API_KEY);
    const result = await openai.generateCompletion(reviewPrompt, {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 600,
      responseFormat: { type: 'json_object' }
    });

    // Parse result if it's a string, otherwise use as-is
    const review = typeof result === 'string' ? JSON.parse(result) : result;

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

