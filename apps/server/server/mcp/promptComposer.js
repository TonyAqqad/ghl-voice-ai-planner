/**
 * Prompt Composer - Layer 2
 * Express endpoint handler for composing Voice AI prompts
 * 
 * Glues together:
 * - Standard kit (from promptLib)
 * - Niche overlay (from promptLib)
 * - Client context and requirements
 * - Optional AI enhancement
 */

const {
  getStandardKit,
  getNicheOverlay,
  getAvailableNiches,
  renderPrompt,
  validatePrompt,
  enhancePromptWithAI
} = require('./promptLib');

const {
  saveAgentPrompt,
  getAgentPrompt,
  getAgentPromptHistory
} = require('../db/promptStore');

/**
 * POST /api/mcp/prompt/compose
 * Compose a new Voice AI prompt from standard kit + niche + context
 */
async function composePrompt(req, res) {
  try {
    const {
      niche = 'generic',
      goals = [],
      tone = 'professional',
      businessHours = null,
      clientContext = {},
      compliance = [],
      enhance = true,
      agentId = null,
      saveToDb = true
    } = req.body;

    console.log('📝 Composing prompt:', {
      niche,
      goals: goals.length,
      tone,
      enhance,
      agentId
    });

    // 1) Load standard kit
    const standard = await getStandardKit('voice-ai-standard-v1');
    
    // 2) Load niche overlay
    const overlay = await getNicheOverlay(niche);
    
    if (!overlay || !overlay.name) {
      console.warn(`⚠️  Niche "${niche}" not found, using generic`);
    }

    // 3) Merge and render to Layer 1 spec
    let composed = renderPrompt({
      standard,
      overlay,
      goals,
      tone,
      businessHours,
      clientContext,
      compliance,
      enhance: false // We'll handle enhancement separately
    });

    // 4) Validate structure
    const validation = validatePrompt(composed);
    if (!validation.valid) {
      console.error('❌ Prompt validation failed:', validation.errors);
      return res.status(400).json({
        ok: false,
        error: 'Prompt validation failed',
        details: validation.errors
      });
    }

    // 5) Optional AI enhancement
    if (enhance && process.env.OPENAI_API_KEY) {
      try {
        composed = await enhancePromptWithAI(composed, process.env.OPENAI_API_KEY);
      } catch (enhanceError) {
        console.warn('⚠️  AI enhancement failed, using base prompt:', enhanceError.message);
        // Continue with base prompt
      }
    } else if (enhance && !process.env.OPENAI_API_KEY) {
      console.warn('⚠️  Enhancement requested but OPENAI_API_KEY not configured');
    }

    // 6) Save to database (if requested)
    let saved = null;
    if (saveToDb) {
      try {
        saved = await saveAgentPrompt(composed, agentId);
      } catch (saveError) {
        console.error('❌ Error saving prompt:', saveError.message);
        // Continue anyway - don't fail the request
      }
    }

    console.log('✅ Prompt composed successfully:', {
      niche: composed.niche,
      promptLength: composed.system_prompt.length,
      kbStubs: composed.kb_stubs.length,
      actions: composed.custom_actions.length,
      saved: !!saved
    });

    // 7) Return result
    return res.json({
      ok: true,
      prompt: composed,
      id: saved?.id || null,
      validation
    });
  } catch (error) {
    console.error('❌ Error composing prompt:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to compose prompt',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * GET /api/mcp/prompt/niches
 * Get list of available niches
 */
async function listNiches(req, res) {
  try {
    const niches = getAvailableNiches();
    return res.json({
      ok: true,
      niches
    });
  } catch (error) {
    console.error('❌ Error listing niches:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

/**
 * GET /api/mcp/prompt/:agentId
 * Get the latest prompt for an agent
 */
async function getPrompt(req, res) {
  try {
    const { agentId } = req.params;
    
    const prompt = await getAgentPrompt(agentId);
    
    if (!prompt) {
      return res.status(404).json({
        ok: false,
        error: 'Prompt not found for agent'
      });
    }
    
    return res.json({
      ok: true,
      prompt
    });
  } catch (error) {
    console.error('❌ Error getting prompt:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

/**
 * GET /api/mcp/prompt/:agentId/history
 * Get prompt history for an agent
 */
async function getPromptHistory(req, res) {
  try {
    const { agentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const history = await getAgentPromptHistory(agentId, limit, offset);
    
    return res.json({
      ok: true,
      history,
      pagination: {
        limit,
        offset,
        count: history.length
      }
    });
  } catch (error) {
    console.error('❌ Error getting prompt history:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

/**
 * POST /api/mcp/prompt/validate
 * Validate a prompt structure
 */
async function validatePromptEndpoint(req, res) {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        ok: false,
        error: 'Prompt object required'
      });
    }
    
    const validation = validatePrompt(prompt);
    
    return res.json({
      ok: true,
      validation
    });
  } catch (error) {
    console.error('❌ Error validating prompt:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}

module.exports = {
  composePrompt,
  listNiches,
  getPrompt,
  getPromptHistory,
  validatePromptEndpoint
};

