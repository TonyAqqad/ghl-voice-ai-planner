/**
 * Prompt Store - Database operations for agent prompts
 * Handles CRUD operations for the prompt composition system
 */

const { pool } = require('../database');

/**
 * Save a composed agent prompt to the database
 * @param {Object} composedPrompt - The Layer 1 spec output
 * @param {String} agentId - The agent ID this prompt is for
 * @param {String} kitId - Optional kit ID (for future DB-backed kits)
 * @returns {Promise<Object>} - Saved record with ID
 */
async function saveAgentPrompt(composedPrompt, agentId = null, kitId = null) {
  try {
    const {
      version = '1.0',
      agent_type = 'voice_ai',
      niche,
      system_prompt,
      kb_stubs = [],
      custom_actions = [],
      eval_rubric = []
    } = composedPrompt;
    
    // Generate hash for deduplication
    const promptHash = generateHash(system_prompt);
    
    const result = await pool.query(
      `INSERT INTO agent_prompts 
       (agent_id, kit_id, niche, system_prompt, kb_refs, actions, version, prompt_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        agentId,
        kitId,
        niche,
        system_prompt,
        JSON.stringify(kb_stubs),
        JSON.stringify({ custom_actions, eval_rubric }),
        version,
        promptHash
      ]
    );
    
    console.log('✅ Agent prompt saved to database:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error saving agent prompt:', error.message);
    throw error;
  }
}

/**
 * Get the latest prompt for an agent
 * @param {String} agentId - The agent ID
 * @returns {Promise<Object|null>} - Latest prompt or null
 */
async function getAgentPrompt(agentId) {
  try {
    const result = await pool.query(
      `SELECT * FROM agent_prompts 
       WHERE agent_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [agentId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // Parse JSON fields
    return {
      ...row,
      kb_refs: typeof row.kb_refs === 'string' ? JSON.parse(row.kb_refs) : row.kb_refs,
      actions: typeof row.actions === 'string' ? JSON.parse(row.actions) : row.actions
    };
  } catch (error) {
    console.error('❌ Error getting agent prompt:', error.message);
    return null;
  }
}

/**
 * Get prompt by ID
 * @param {String} promptId - The prompt UUID
 * @returns {Promise<Object|null>}
 */
async function getPromptById(promptId) {
  try {
    const result = await pool.query(
      'SELECT * FROM agent_prompts WHERE id = $1',
      [promptId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      ...row,
      kb_refs: typeof row.kb_refs === 'string' ? JSON.parse(row.kb_refs) : row.kb_refs,
      actions: typeof row.actions === 'string' ? JSON.parse(row.actions) : row.actions
    };
  } catch (error) {
    console.error('❌ Error getting prompt by ID:', error.message);
    return null;
  }
}

/**
 * Get all prompts for an agent (with pagination)
 * @param {String} agentId
 * @param {Number} limit
 * @param {Number} offset
 * @returns {Promise<Array>}
 */
async function getAgentPromptHistory(agentId, limit = 10, offset = 0) {
  try {
    const result = await pool.query(
      `SELECT id, agent_id, niche, version, created_at, prompt_hash
       FROM agent_prompts 
       WHERE agent_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [agentId, limit, offset]
    );
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error getting agent prompt history:', error.message);
    return [];
  }
}

/**
 * Delete a prompt
 * @param {String} promptId
 * @returns {Promise<Boolean>}
 */
async function deletePrompt(promptId) {
  try {
    const result = await pool.query(
      'DELETE FROM agent_prompts WHERE id = $1',
      [promptId]
    );
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('❌ Error deleting prompt:', error.message);
    return false;
  }
}

/**
 * Load a prompt kit from database (future implementation)
 * @param {String} kitName
 * @returns {Promise<Object|null>}
 */
async function loadPromptKit(kitName) {
  try {
    const result = await pool.query(
      'SELECT * FROM prompt_kits WHERE name = $1 ORDER BY created_at DESC LIMIT 1',
      [kitName]
    );
    
    if (result.rows.length === 0) {
      console.log(`⚠️  Prompt kit "${kitName}" not found in database, using in-memory default`);
      return null;
    }
    
    const row = result.rows[0];
    return {
      ...row,
      schema: typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema
    };
  } catch (error) {
    console.error('❌ Error loading prompt kit:', error.message);
    return null;
  }
}

/**
 * Load niche overlay from database (future implementation)
 * @param {String} kitId - The kit UUID
 * @param {String} niche - Niche name
 * @returns {Promise<Object|null>}
 */
async function loadNicheOverlay(kitId, niche) {
  try {
    const result = await pool.query(
      'SELECT * FROM prompt_kits_niche_overlays WHERE kit_id = $1 AND niche = $2',
      [kitId, niche]
    );
    
    if (result.rows.length === 0) {
      console.log(`⚠️  Niche overlay "${niche}" not found in database for kit ${kitId}, using in-memory default`);
      return null;
    }
    
    const row = result.rows[0];
    return {
      ...row,
      overlay_json: typeof row.overlay_json === 'string' ? JSON.parse(row.overlay_json) : row.overlay_json
    };
  } catch (error) {
    console.error('❌ Error loading niche overlay:', error.message);
    return null;
  }
}

/**
 * Save prompt kit to database (for future DB migration)
 * @param {String} name
 * @param {String} version
 * @param {Object} schema
 * @returns {Promise<Object|null>}
 */
async function savePromptKit(name, version, schema) {
  try {
    const result = await pool.query(
      `INSERT INTO prompt_kits (name, version, schema)
       VALUES ($1, $2, $3)
       ON CONFLICT (name, version) DO UPDATE
       SET schema = EXCLUDED.schema
       RETURNING *`,
      [name, version, JSON.stringify(schema)]
    );
    
    console.log('✅ Prompt kit saved to database:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error saving prompt kit:', error.message);
    throw error;
  }
}

/**
 * Save niche overlay to database (for future DB migration)
 * @param {String} kitId
 * @param {String} niche
 * @param {Object} overlayData
 * @returns {Promise<Object|null>}
 */
async function saveNicheOverlay(kitId, niche, overlayData) {
  try {
    const result = await pool.query(
      `INSERT INTO prompt_kits_niche_overlays (kit_id, niche, overlay_json)
       VALUES ($1, $2, $3)
       ON CONFLICT (kit_id, niche) DO UPDATE
       SET overlay_json = EXCLUDED.overlay_json
       RETURNING *`,
      [kitId, niche, JSON.stringify(overlayData)]
    );
    
    console.log('✅ Niche overlay saved to database:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error saving niche overlay:', error.message);
    throw error;
  }
}

/**
 * Generate a simple hash for deduplication
 * @param {String} text
 * @returns {String}
 */
function generateHash(text) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

/**
 * Search prompts by niche
 * @param {String} niche
 * @param {Number} limit
 * @returns {Promise<Array>}
 */
async function searchPromptsByNiche(niche, limit = 10) {
  try {
    const result = await pool.query(
      `SELECT id, agent_id, niche, version, created_at
       FROM agent_prompts 
       WHERE niche = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [niche, limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error searching prompts by niche:', error.message);
    return [];
  }
}

module.exports = {
  saveAgentPrompt,
  getAgentPrompt,
  getPromptById,
  getAgentPromptHistory,
  deletePrompt,
  loadPromptKit,
  loadNicheOverlay,
  savePromptKit,
  saveNicheOverlay,
  searchPromptsByNiche
};

