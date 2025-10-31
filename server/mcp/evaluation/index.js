/**
 * Evaluation Module - Main Export
 * Handles transcript ingestion, evaluation, patching, and review queue management
 */

const crypto = require('crypto');
const { evaluateTranscript } = require('./evaluateTranscript');
const { applyPromptPatch } = require('./applyPromptPatch');
const { pool } = require('../../database');
const { saveAgentPrompt, getAgentPrompt, getPromptById } = require('../../db/promptStore');
const { getNicheOverlay } = require('../promptLib');

/**
 * Ingest transcript endpoint
 * POST /api/mcp/agent/ingestTranscript
 */
async function ingestTranscript(req, res) {
  try {
    const { agentId, promptId, callId, transcript, summary, tags, metrics } = req.body;

    // Validation
    if (!agentId || !transcript) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: agentId and transcript are required' 
      });
    }

    console.log(`📝 Ingesting transcript for agent ${agentId}, call ${callId || 'N/A'}`);

    // Save to call logs
    const callLogResult = await pool.query(
      `INSERT INTO agent_call_logs (agent_id, prompt_id, call_id, transcript, summary, tags, metrics)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [agentId, promptId || null, callId || null, transcript, summary || null, tags || [], JSON.stringify(metrics || {})]
    );
    const callLog = callLogResult.rows[0];
    console.log(`  ✅ Call log saved: ${callLog.id}`);

    // Load prompt and overlay
    const prompt = promptId ? await getPromptById(promptId) : await getAgentPrompt(agentId);
    if (!prompt) {
      console.warn(`  ⚠️  No prompt found for agent ${agentId}, skipping evaluation`);
      return res.status(404).json({ 
        success: false, 
        error: 'Prompt not found. Run /api/mcp/prompt/compose first to create a prompt for this agent.' 
      });
    }

    const overlay = getNicheOverlay(prompt.niche);
    if (!overlay) {
      console.warn(`  ⚠️  No overlay found for niche ${prompt.niche}`);
      return res.status(400).json({
        success: false,
        error: `Niche overlay not found for: ${prompt.niche}`
      });
    }

    // Evaluate transcript
    console.log(`  🧠 Evaluating transcript against ${prompt.niche} rubric...`);
    const evaluation = await evaluateTranscript(transcript, prompt, overlay, { metrics });
    console.log(`  📊 Evaluation complete. Pass: ${evaluation.pass}, Confidence: ${evaluation.confidenceScore.toFixed(2)}`);

    // Save evaluation
    const reviewResult = await pool.query(
      `INSERT INTO agent_prompt_reviews (agent_id, call_log_id, prompt_id, evaluation, confidence_score, suggested_patch, kb_suggestion)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        agentId,
        callLog.id,
        prompt.id,
        JSON.stringify(evaluation),
        evaluation.confidenceScore,
        JSON.stringify(evaluation.suggestedPromptPatch),
        JSON.stringify(evaluation.suggestedKbAddition)
      ]
    );
    const review = reviewResult.rows[0];
    console.log(`  ✅ Review saved: ${review.id}`);

    // Update call log with review reference
    await pool.query(
      'UPDATE agent_call_logs SET review_id = $1, reviewed_at = NOW() WHERE id = $2',
      [review.id, callLog.id]
    );

    // Auto-apply patch if confidence >= 0.85 and patch exists
    if (evaluation.confidenceScore >= 0.85 && evaluation.suggestedPromptPatch) {
      console.log(`  🔧 High confidence (${(evaluation.confidenceScore * 100).toFixed(0)}%) - Auto-applying patch...`);
      
      try {
        const newPrompt = await applyPromptPatch(agentId, evaluation.suggestedPromptPatch, 'Auto-patch (high confidence)');
        await pool.query(
          'UPDATE agent_prompt_reviews SET patch_applied = true, applied_at = NOW() WHERE id = $1',
          [review.id]
        );
        
        console.log(`  ✅ Patch auto-applied successfully`);
        
        return res.json({
          success: true,
          callLog,
          evaluation,
          reviewId: review.id,
          promptId: prompt.id,
          patchApplied: true,
          newPromptId: newPrompt.id,
          message: `Evaluation complete. Patch auto-applied due to high confidence (${(evaluation.confidenceScore * 100).toFixed(0)}%)`
        });
      } catch (patchError) {
        console.error(`  ❌ Error applying patch:`, patchError.message);
        // Continue even if patch fails - evaluation is still stored
      }
    }

    res.json({
      success: true,
      callLog,
      evaluation,
      reviewId: review.id,
      promptId: prompt.id,
      patchApplied: false,
      message: evaluation.confidenceScore < 0.85 
        ? `Low confidence (${(evaluation.confidenceScore * 100).toFixed(0)}%) - queued for manual review` 
        : 'Evaluation complete. No patch suggested.'
    });
  } catch (error) {
    console.error('❌ ingestTranscript error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get review queue endpoint
 * GET /api/mcp/prompt/reviewQueue?agentId=1&limit=20
 */
async function getReviewQueue(req, res) {
  try {
    const { agentId, limit = 20 } = req.query;
    
    console.log(`📋 Fetching review queue${agentId ? ` for agent ${agentId}` : ''}, limit: ${limit}`);
    
    const query = agentId
      ? `SELECT r.*, c.transcript, c.summary, c.call_id, c.created_at as call_created_at
         FROM agent_prompt_reviews r
         LEFT JOIN agent_call_logs c ON r.call_log_id = c.id
         WHERE r.agent_id = $1 AND r.patch_applied = false 
         ORDER BY r.created_at DESC LIMIT $2`
      : `SELECT r.*, c.transcript, c.summary, c.call_id, c.created_at as call_created_at
         FROM agent_prompt_reviews r
         LEFT JOIN agent_call_logs c ON r.call_log_id = c.id
         WHERE r.patch_applied = false 
         ORDER BY r.created_at DESC LIMIT $1`;
    
    const params = agentId ? [agentId, parseInt(limit)] : [parseInt(limit)];
    const result = await pool.query(query, params);

    console.log(`  ✅ Found ${result.rows.length} pending reviews`);

    // Parse JSON fields
    const reviews = result.rows.map(row => ({
      ...row,
      evaluation: typeof row.evaluation === 'string' ? JSON.parse(row.evaluation) : row.evaluation,
      suggested_patch: typeof row.suggested_patch === 'string' ? JSON.parse(row.suggested_patch) : row.suggested_patch,
      kb_suggestion: typeof row.kb_suggestion === 'string' ? JSON.parse(row.kb_suggestion) : row.kb_suggestion
    }));

    res.json({ success: true, reviews, count: reviews.length });
  } catch (error) {
    console.error('❌ getReviewQueue error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Apply patch endpoint (manual trigger)
 * POST /api/mcp/prompt/applyPatch
 */
async function applyPatchEndpoint(req, res) {
  try {
    const { reviewId, agentId } = req.body;

    if (!reviewId || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reviewId and agentId are required'
      });
    }

    console.log(`🔧 Manually applying patch for review ${reviewId}, agent ${agentId}`);

    const reviewResult = await pool.query('SELECT * FROM agent_prompt_reviews WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const review = reviewResult.rows[0];
    const patch = typeof review.suggested_patch === 'string' 
      ? JSON.parse(review.suggested_patch) 
      : review.suggested_patch;

    if (!patch || Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'No patch to apply' });
    }

    const newPrompt = await applyPromptPatch(agentId, patch, `Manual approval of review ${reviewId}`);
    
    await pool.query(
      'UPDATE agent_prompt_reviews SET patch_applied = true, applied_at = NOW() WHERE id = $1',
      [reviewId]
    );

    console.log(`  ✅ Patch applied successfully`);

    res.json({ success: true, newPromptId: newPrompt.id, message: 'Patch applied successfully' });
  } catch (error) {
    console.error('❌ applyPatchEndpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Rollback prompt endpoint
 * POST /api/mcp/prompt/rollback
 */
async function rollbackPrompt(req, res) {
  try {
    const { agentId, toHash } = req.body;

    if (!agentId || !toHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId and toHash are required'
      });
    }

    console.log(`⏪ Rolling back agent ${agentId} to hash ${toHash}`);

    const result = await pool.query(
      'SELECT * FROM agent_prompts WHERE agent_id = $1 AND prompt_hash = $2',
      [agentId, toHash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `Prompt version with hash ${toHash} not found for agent ${agentId}` 
      });
    }

    const rollbackPrompt = result.rows[0];

    // Update agent table with rollback prompt
    await pool.query(
      'UPDATE agents SET system_prompt = $1, updated_at = NOW() WHERE agent_id = $2',
      [rollbackPrompt.system_prompt, agentId]
    );

    // Log rollback action
    await pool.query(
      `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        agentId,
        'prompt_rollback',
        JSON.stringify({ toHash }),
        JSON.stringify({ rolledBackToId: rollbackPrompt.id }),
        'success'
      ]
    );

    console.log(`  ✅ Rolled back to prompt ${rollbackPrompt.id}`);

    res.json({ 
      success: true, 
      rolledBackTo: rollbackPrompt.id,
      hash: toHash,
      message: 'Successfully rolled back to previous prompt version'
    });
  } catch (error) {
    console.error('❌ rollbackPrompt error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Batch review missed transcripts
 * POST /api/mcp/agent/batchReview
 */
async function batchReview(req, res) {
  try {
    const { limit = 50 } = req.body;

    console.log(`🔄 Starting batch review of unreviewed transcripts (limit: ${limit})...`);

    const result = await pool.query(
      'SELECT * FROM agent_call_logs WHERE reviewed_at IS NULL ORDER BY created_at ASC LIMIT $1',
      [limit]
    );

    console.log(`  📝 Found ${result.rows.length} unreviewed call logs`);

    let processedCount = 0;
    let errorCount = 0;

    for (const callLog of result.rows) {
      try {
        console.log(`  Processing call log ${callLog.id}...`);

        // Load prompt
        const prompt = callLog.prompt_id 
          ? await getPromptById(callLog.prompt_id) 
          : await getAgentPrompt(callLog.agent_id);

        if (!prompt) {
          console.warn(`    ⚠️  No prompt found, skipping`);
          continue;
        }

        const overlay = getNicheOverlay(prompt.niche);
        if (!overlay) {
          console.warn(`    ⚠️  No overlay found for niche ${prompt.niche}, skipping`);
          continue;
        }

        // Parse metrics
        const metrics = typeof callLog.metrics === 'string' 
          ? JSON.parse(callLog.metrics) 
          : callLog.metrics;

        // Evaluate
        const evaluation = await evaluateTranscript(callLog.transcript, prompt, overlay, { metrics });

        // Save review
        const reviewResult = await pool.query(
          `INSERT INTO agent_prompt_reviews (agent_id, call_log_id, prompt_id, evaluation, confidence_score, suggested_patch, kb_suggestion)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            callLog.agent_id,
            callLog.id,
            prompt.id,
            JSON.stringify(evaluation),
            evaluation.confidenceScore,
            JSON.stringify(evaluation.suggestedPromptPatch),
            JSON.stringify(evaluation.suggestedKbAddition)
          ]
        );

        // Update call log
        await pool.query(
          'UPDATE agent_call_logs SET review_id = $1, reviewed_at = NOW() WHERE id = $2',
          [reviewResult.rows[0].id, callLog.id]
        );

        // Auto-apply if high confidence
        if (evaluation.confidenceScore >= 0.85 && evaluation.suggestedPromptPatch) {
          try {
            await applyPromptPatch(callLog.agent_id, evaluation.suggestedPromptPatch, 'Auto-patch (batch review)');
            await pool.query(
              'UPDATE agent_prompt_reviews SET patch_applied = true, applied_at = NOW() WHERE id = $1',
              [reviewResult.rows[0].id]
            );
            console.log(`    ✅ Evaluated and auto-patched`);
          } catch (patchError) {
            console.warn(`    ⚠️  Evaluated but patch failed:`, patchError.message);
          }
        } else {
          console.log(`    ✅ Evaluated (no auto-patch)`);
        }

        processedCount++;
      } catch (error) {
        console.error(`    ❌ Error processing call log ${callLog.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Batch review complete. Processed: ${processedCount}, Errors: ${errorCount}`);

    res.json({ 
      success: true, 
      processed: processedCount,
      errors: errorCount,
      total: result.rows.length,
      message: `Batch review complete. Successfully processed ${processedCount} of ${result.rows.length} transcripts.`
    });
  } catch (error) {
    console.error('❌ batchReview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  ingestTranscript,
  getReviewQueue,
  applyPatchEndpoint,
  rollbackPrompt,
  batchReview,
  saveCorrection: saveCorrectionEndpoint,
  getCorrectionsHistory
};

/**
 * Save manual correction endpoint
 * POST /api/mcp/agent/saveCorrection
 */
async function saveCorrectionEndpoint(req, res) {
  try {
    const {
      agentId,
      promptId,
      callLogId,
      reviewId,
      originalResponse,
      correctedResponse,
      reason,
      storeIn = 'prompt',
      userId,
      sessionId,
      metadata = {}
    } = req.body || {};

    if (!agentId) {
      return res.status(400).json({ success: false, error: 'agentId is required' });
    }

    if (!originalResponse || !correctedResponse) {
      return res.status(400).json({ success: false, error: 'Both originalResponse and correctedResponse are required' });
    }

    const normalizedStore = (storeIn || 'prompt').toLowerCase();
    if (!['prompt', 'kb'].includes(normalizedStore)) {
      return res.status(400).json({ success: false, error: 'storeIn must be "prompt" or "kb"' });
    }

    const promptRecord = promptId ? await getPromptById(promptId) : await getAgentPrompt(agentId);
    if (!promptRecord) {
      return res.status(404).json({ success: false, error: 'Prompt not found for provided agentId/promptId' });
    }

    const timestamp = new Date().toISOString();
    const originalHash = hashText(originalResponse);
    const correctedHash = hashText(correctedResponse);

    const currentKbRefs = Array.isArray(promptRecord.kb_refs) ? promptRecord.kb_refs : [];
    const actions = promptRecord.actions || {};
    const customActions = actions.custom_actions || [];
    const evalRubric = actions.eval_rubric || [];

    let updatedSystemPrompt = promptRecord.system_prompt || '';
    let updatedKbRefs = currentKbRefs;
    let kbEntryId = null;
    const manualLabel = `Manual Correction ${timestamp}`;

    if (normalizedStore === 'prompt') {
      const correctionBlock = [
        `### ${manualLabel}`,
        `Original (hash ${originalHash}):`,
        originalResponse.trim(),
        '',
        `Preferred (hash ${correctedHash}):`,
        correctedResponse.trim()
      ].join('\n');

      updatedSystemPrompt = `${updatedSystemPrompt.trim()}\n\n${correctionBlock}`.trim();
    } else {
      const outline = [
        `Original (hash ${originalHash}): ${truncateForOutline(originalResponse)}`,
        `Preferred (hash ${correctedHash}): ${truncateForOutline(correctedResponse)}`
      ];

      const kbEntry = {
        id: `manual-${Date.now()}`,
        title: manualLabel,
        outline,
        metadata: {
          type: 'manual_correction',
          created_at: timestamp,
          original_response: originalResponse,
          corrected_response: correctedResponse,
          original_hash: originalHash,
          corrected_hash: correctedHash,
          reason: reason || null,
          user_id: userId || null,
          session_id: sessionId || null
        }
      };

      updatedKbRefs = [...currentKbRefs, kbEntry];
      kbEntryId = kbEntry.id;
    }

    const nextVersion = bumpVersion(promptRecord.version);

    const savedPrompt = await saveAgentPrompt(
      {
        version: nextVersion,
        agent_type: 'voice_ai',
        niche: promptRecord.niche,
        system_prompt: updatedSystemPrompt,
        kb_stubs: updatedKbRefs,
        custom_actions: customActions,
        eval_rubric: evalRubric
      },
      agentId,
      promptRecord.kit_id || null
    );

    if (normalizedStore === 'prompt') {
      await pool.query(
        'UPDATE agents SET system_prompt = $1, updated_at = NOW() WHERE agent_id = $2',
        [updatedSystemPrompt, agentId]
      );
    }

    const confirmationMessage = normalizedStore === 'prompt'
      ? `Corrected response stored in prompt version ${savedPrompt.version}.`
      : `Corrected response added to knowledge base as "${manualLabel}".`;

    const correctionMetadata = {
      ...metadata,
      userId: userId || null,
      sessionId: sessionId || null,
      createdAt: timestamp,
      storeIn: normalizedStore,
      manualLabel,
      promptVersion: savedPrompt.version,
      kbEntryId,
      originalHash,
      correctedHash
    };

    const correctionResult = await pool.query(
      `INSERT INTO agent_response_corrections (
        agent_id,
        call_log_id,
        prompt_id,
        review_id,
        original_response,
        original_hash,
        corrected_response,
        corrected_hash,
        store_in,
        reason,
        confirmation_message,
        metadata
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        agentId,
        callLogId || null,
        savedPrompt.id,
        reviewId || null,
        originalResponse,
        originalHash,
        correctedResponse,
        correctedHash,
        normalizedStore,
        reason || null,
        confirmationMessage,
        JSON.stringify(correctionMetadata)
      ]
    );

    await pool.query(
      `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        agentId,
        'manual_response_correction',
        JSON.stringify({
          correctionId: correctionResult.rows[0].id,
          storeIn: normalizedStore,
          reason: reason || null,
          originalHash,
          correctedHash
        }),
        JSON.stringify({
          callLogId: callLogId || null,
          reviewId: reviewId || null,
          promptId: savedPrompt.id,
          confirmationMessage,
          kbEntryId
        }),
        'success'
      ]
    );

    const insertedCorrection = correctionResult.rows[0];
    const parsedMetadata = typeof insertedCorrection.metadata === 'string'
      ? JSON.parse(insertedCorrection.metadata)
      : insertedCorrection.metadata;

    res.json({
      success: true,
      confirmationMessage,
      promptId: savedPrompt.id,
      promptVersion: savedPrompt.version,
      correction: {
        ...insertedCorrection,
        metadata: parsedMetadata
      }
    });
  } catch (error) {
    console.error('❌ saveCorrection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

function bumpVersion(version) {
  const numeric = parseFloat(version);
  if (Number.isFinite(numeric)) {
    return (numeric + 0.1).toFixed(1);
  }
  return `${version || '1.0'}-manual-${Date.now()}`;
}

function hashText(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

function truncateForOutline(text, maxLen = 160) {
  if (!text) return '';
  const singleLine = text.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLen) return singleLine;
  return `${singleLine.slice(0, maxLen - 1)}…`;
}

/**
 * GET /api/mcp/agent/corrections
 * Fetch all corrections with their impact
 */
async function getCorrectionsHistory(req, res) {
  try {
    const { agentId, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        arc.*,
        ap.version as prompt_version,
        ap.system_prompt as current_prompt,
        acl.transcript,
        acl.created_at as call_date
      FROM agent_response_corrections arc
      LEFT JOIN agent_prompts ap ON arc.prompt_id = ap.id
      LEFT JOIN agent_call_logs acl ON arc.call_log_id = acl.id
    `;
    
    const params = [];
    if (agentId) {
      query += ' WHERE arc.agent_id = $1';
      params.push(agentId);
    }
    
    query += ' ORDER BY arc.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await pool.query(query, params);
    
    // Get stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_corrections,
        COUNT(DISTINCT agent_id) as agents_improved,
        COUNT(CASE WHEN store_in = 'prompt' THEN 1 END) as prompt_updates,
        COUNT(CASE WHEN store_in = 'kb' THEN 1 END) as kb_additions
      FROM agent_response_corrections
      ${agentId ? 'WHERE agent_id = $1' : ''}
    `;
    
    const statsResult = await pool.query(statsQuery, agentId ? [agentId] : []);
    
    res.json({
      success: true,
      corrections: result.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching corrections:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

