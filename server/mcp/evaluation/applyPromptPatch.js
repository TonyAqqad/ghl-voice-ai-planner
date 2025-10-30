/**
 * Prompt Patching Module
 * Apply mutations to prompts and create versioned updates
 */

const { pool } = require('../../database');
const { getAgentPrompt, saveAgentPrompt } = require('../../db/promptStore');
const { renderPrompt, getStandardKit, getNicheOverlay } = require('../promptLib');

/**
 * Apply a patch to an agent's prompt
 * @param {String} agentId
 * @param {Object} patch - { reinforceReminder, addBookingGate, etc }
 * @param {String} reason - Why this patch was applied
 * @returns {Promise<Object>} New prompt record
 */
async function applyPromptPatch(agentId, patch, reason = 'Auto-patch from evaluation') {
  try {
    console.log(`🔧 Applying prompt patch for agent ${agentId}:`, patch);
    
    // Load current prompt
    const currentPrompt = await getAgentPrompt(agentId);
    if (!currentPrompt) {
      throw new Error(`No prompt found for agent ${agentId}`);
    }

    // Load agent config
    const agentResult = await pool.query('SELECT * FROM agents WHERE agent_id = $1', [agentId]);
    if (agentResult.rows.length === 0) {
      throw new Error(`Agent ${agentId} not found`);
    }
    const agent = agentResult.rows[0];
    const config = agent.config || {};

    // Load standard + overlay
    const standard = getStandardKit('voice-ai-standard-v1');
    const overlay = getNicheOverlay(config.niche || 'fitness_gym');

    if (!overlay) {
      throw new Error(`Niche overlay not found for: ${config.niche || 'fitness_gym'}`);
    }

    // Apply patch mutations to overlay
    const patchedOverlay = JSON.parse(JSON.stringify(overlay)); // Deep clone
    
    if (patch.reinforceReminder && Array.isArray(patch.reinforceReminder)) {
      // Add reminder for missing fields
      const fieldNames = patch.reinforceReminder.map(f => {
        const parts = f.split('.');
        return parts[parts.length - 1].replace(/_/g, ' ');
      });
      
      const reminderText = `Remember to collect all required fields in order: ${fieldNames.join(', ')}`;
      
      if (!patchedOverlay.must_ask_first) {
        patchedOverlay.must_ask_first = [];
      }
      
      // Add if not already present
      if (!patchedOverlay.must_ask_first.includes(reminderText)) {
        patchedOverlay.must_ask_first.push(reminderText);
      }
      
      console.log('  ✅ Added field collection reminder');
    }

    if (patch.addBookingGate) {
      // Reinforce booking block rule
      patchedOverlay.booking_block_until_fields_complete = true;
      
      // Add explicit reminder about booking gate
      if (!patchedOverlay.must_ask_first) {
        patchedOverlay.must_ask_first = [];
      }
      
      const gateReminder = 'Do NOT use booking language or schedule appointments until ALL required fields are collected';
      if (!patchedOverlay.must_ask_first.includes(gateReminder)) {
        patchedOverlay.must_ask_first.push(gateReminder);
      }
      
      console.log('  ✅ Reinforced booking gate rule');
    }

    if (patch.addToneReminder) {
      // Add reminder about conversational tone
      if (!patchedOverlay.must_ask_first) {
        patchedOverlay.must_ask_first = [];
      }
      
      const toneReminder = 'Speak naturally and conversationally. Avoid robotic or overly formal language.';
      if (!patchedOverlay.must_ask_first.includes(toneReminder)) {
        patchedOverlay.must_ask_first.push(toneReminder);
      }
      
      console.log('  ✅ Added tone reminder');
    }

    if (patch.addEscalationReminder) {
      // Add reminder about escalation
      if (!patchedOverlay.qualification) {
        patchedOverlay.qualification = [];
      }
      
      const escalationReminder = 'If unable to help, offer to transfer to a human agent or schedule a callback';
      if (!patchedOverlay.qualification.includes(escalationReminder)) {
        patchedOverlay.qualification.push(escalationReminder);
      }
      
      console.log('  ✅ Added escalation reminder');
    }

    // Re-render prompt with patched overlay
    const newPromptSpec = renderPrompt({
      standard,
      overlay: patchedOverlay,
      goals: config.goals || ['Qualify leads', 'Book trial classes', 'Capture accurate contact info'],
      tone: config.tone || 'professional',
      businessHours: config.businessHours || { open: '9 AM', close: '5 PM' },
      clientContext: { 
        companyName: agent.name,
        agentName: agent.name
      },
      compliance: config.compliance || [],
      customValues: config.customValues || {}
    });

    // Save new version
    const savedPrompt = await saveAgentPrompt(newPromptSpec, agentId);

    // Update agent table with new system prompt
    await pool.query(
      'UPDATE agents SET system_prompt = $1, updated_at = NOW() WHERE agent_id = $2',
      [newPromptSpec.system_prompt, agentId]
    );

    // Log patch application
    await pool.query(
      `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        agentId, 
        'prompt_patch_applied', 
        JSON.stringify(patch), 
        JSON.stringify({ 
          reason, 
          newPromptId: savedPrompt.id,
          previousPromptHash: currentPrompt.prompt_hash,
          newPromptHash: savedPrompt.prompt_hash
        }), 
        'success'
      ]
    );

    console.log(`✅ Prompt patch applied successfully for agent ${agentId}:`, savedPrompt.id);
    return savedPrompt;
  } catch (error) {
    console.error('❌ Error applying prompt patch:', error);
    
    // Log error
    await pool.query(
      `INSERT INTO agent_logs (agent_id, action, payload, context, status, error_message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        agentId,
        'prompt_patch_applied',
        JSON.stringify(patch),
        JSON.stringify({ reason }),
        'error',
        error.message
      ]
    );
    
    throw error;
  }
}

module.exports = { applyPromptPatch };

