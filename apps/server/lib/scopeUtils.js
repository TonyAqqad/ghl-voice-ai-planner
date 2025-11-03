/**
 * Scope Utilities
 * 
 * CRITICAL: Single Source of Truth for Scope ID Generation
 * 
 * Everything training-related MUST be keyed by:
 * scopeId = scope(<locationId>, <agentId>, <promptHash>)
 * 
 * This prevents training leakage between locations or prompt versions.
 */

const crypto = require('crypto');

/**
 * Generate SHA-256 hash of prompt text
 * @param {string} promptText - The exact system prompt text
 * @returns {Promise<string>} - First 16 chars of SHA-256 hash (hex)
 */
async function generatePromptHash(promptText) {
  if (!promptText || typeof promptText !== 'string') {
    throw new Error('Invalid prompt text for hashing');
  }
  
  const hash = crypto.createHash('sha256').update(promptText).digest('hex');
  return hash.substring(0, 16); // First 16 chars for brevity
}

/**
 * Generate scope ID (synchronous version with pre-computed hash)
 * @param {Object} params
 * @param {string} params.locationId - Location identifier
 * @param {string} params.agentId - Agent identifier
 * @param {string} params.promptHash - Pre-computed prompt hash
 * @returns {string} - Scope ID in format "scope:locationId:agentId:promptHash"
 */
function scopeId({ locationId, agentId, promptHash }) {
  if (!locationId || !agentId || !promptHash) {
    throw new Error('Missing required parameters for scopeId: locationId, agentId, promptHash');
  }
  
  return `scope:${locationId}:${agentId}:${promptHash}`;
}

/**
 * Generate scope ID (async version with prompt text)
 * @param {Object} params
 * @param {string} params.locationId - Location identifier
 * @param {string} params.agentId - Agent identifier
 * @param {string} params.promptText - Full system prompt text
 * @returns {Promise<string>} - Scope ID
 */
async function generateScopeId({ locationId, agentId, promptText }) {
  const promptHash = await generatePromptHash(promptText);
  return scopeId({ locationId, agentId, promptHash });
}

/**
 * Parse scope ID back into components
 * @param {string} scopeIdStr - Scope ID string
 * @returns {Object|null} - Parsed components or null if invalid
 */
function parseScopeId(scopeIdStr) {
  if (!scopeIdStr || typeof scopeIdStr !== 'string') {
    return null;
  }
  
  const parts = scopeIdStr.split(':');
  
  if (parts.length !== 4 || parts[0] !== 'scope') {
    return null;
  }
  
  return {
    locationId: parts[1],
    agentId: parts[2],
    promptHash: parts[3],
  };
}

/**
 * Validate scope ID format
 * @param {string} scopeIdStr - Scope ID to validate
 * @returns {boolean} - True if valid format
 */
function isValidScopeId(scopeIdStr) {
  return parseScopeId(scopeIdStr) !== null;
}

module.exports = {
  generatePromptHash,
  scopeId,
  generateScopeId,
  parseScopeId,
  isValidScopeId,
};

