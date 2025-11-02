/**
 * Turn Analyzer - Server Endpoint
 * POST /api/mcp/master/analyzeTurn
 * 
 * Provides deep analysis of conversation turns using AI
 */

const OpenAIProvider = require('../providers/openai');

/**
 * Analyze a single conversation turn
 */
async function analyzeTurn(req, res) {
  try {
    const {
      agentId,
      conversation = [],
      lastAgentResponse,
      promptSpec,
      systemPrompt,
      niche = 'generic'
    } = req.body;

    if (!lastAgentResponse) {
      return res.status(400).json({
        ok: false,
        error: 'lastAgentResponse is required'
      });
    }

    console.log(`🔍 Analyzing turn for agent ${agentId}...`);

    // Build analysis prompt for Master AI
    const conversationContext = conversation
      .map(turn => `${turn.role === 'caller' ? 'Caller' : 'Agent'}: ${turn.text}`)
      .join('\n');

    const analysisPrompt = `You are a Master AI Evaluator analyzing voice agent performance.

SYSTEM PROMPT BEING EVALUATED:
${systemPrompt || 'N/A'}

CONVERSATION SO FAR:
${conversationContext}

LAST AGENT RESPONSE TO ANALYZE:
"${lastAgentResponse}"

Analyze this response and provide a JSON object with the following structure:
{
  "compliance": {
    "score": 0-1 (1 = perfect compliance),
    "violations": ["list of rule violations"],
    "passed": ["list of rules followed correctly"]
  },
  "fieldProgress": {
    "collected": ["fields that appear to be collected"],
    "remaining": ["fields still needed"],
    "currentStep": number,
    "totalSteps": 5
  },
  "intentMatch": {
    "matched": true/false,
    "detected": "greeting|information_gathering|confirmation|booking|escalation",
    "confidence": 0-1
  },
  "redFlags": ["critical issues like AI self-reference, backend mentions"],
  "suggestions": ["actionable improvements"],
  "wouldHaveSaid": "What an ideal response might be (optional)",
  "tone": {
    "appropriate": true/false,
    "detected": "professional|casual|energetic|etc"
  }
}

Focus on:
1. Did it ask ONE question per turn?
2. Is response 1-2 sentences?
3. Any AI self-reference or backend system mentions?
4. Is it collecting fields in order?
5. Is the tone appropriate for ${niche}?

Return ONLY the JSON object, no other text.`;

    // Call OpenAI for analysis
    const openai = new OpenAIProvider(process.env.OPENAI_API_KEY);
    
    const analysisResult = await openai.generateCompletion(analysisPrompt, {
      model: 'gpt-4o-mini', // Fast and cheap for analysis
      temperature: 0.3, // More deterministic
      maxTokens: 800,
      responseFormat: { type: 'json_object' }
    });

    let analysis;
    try {
      analysis = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', parseError);
      // Fallback to basic analysis
      analysis = createFallbackAnalysis(lastAgentResponse);
    }

    console.log(`✅ Turn analysis complete:`, {
      score: analysis.compliance?.score,
      violations: analysis.compliance?.violations?.length || 0,
      redFlags: analysis.redFlags?.length || 0
    });

    return res.json({
      ok: true,
      analysis
    });

  } catch (error) {
    console.error('❌ Turn analysis error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to analyze turn',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Fallback analysis when AI call fails
 */
function createFallbackAnalysis(lastAgentResponse) {
  const violations = [];
  const passed = [];
  const redFlags = [];
  
  // Basic checks
  const questionCount = (lastAgentResponse.match(/\?/g) || []).length;
  if (questionCount === 1) {
    passed.push('Asked one question per turn');
  } else if (questionCount > 1) {
    violations.push('Asked multiple questions');
    redFlags.push('Multiple questions in one turn');
  }
  
  const wordCount = lastAgentResponse.split(/\s+/).length;
  if (wordCount <= 30) {
    passed.push('Response length appropriate');
  } else {
    violations.push('Response too long');
  }
  
  // Check for bad patterns
  if (/\b(i'm an ai|as an ai|i don't have access)\b/i.test(lastAgentResponse)) {
    violations.push('AI self-reference detected');
    redFlags.push('CRITICAL: AI exposed itself');
  }
  
  if (/\b(ghl|highlevel|crm|backend)\b/i.test(lastAgentResponse)) {
    violations.push('Backend system mentioned');
    redFlags.push('Mentioned backend systems');
  }
  
  const score = passed.length / (passed.length + violations.length || 1);
  
  return {
    compliance: {
      score,
      violations,
      passed
    },
    fieldProgress: {
      collected: [],
      remaining: ['first_name', 'last_name', 'phone', 'email', 'date'],
      currentStep: 0,
      totalSteps: 5
    },
    intentMatch: {
      matched: true,
      detected: 'unknown',
      confidence: 0.5
    },
    redFlags,
    suggestions: violations.length > 0 ? ['Review prompt compliance rules'] : [],
    tone: {
      appropriate: redFlags.length === 0,
      detected: 'professional'
    }
  };
}

module.exports = {
  analyzeTurn
};

