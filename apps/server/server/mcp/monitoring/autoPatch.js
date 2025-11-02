/**
 * Self-Healing Primitives - Auto Patch Deployment
 * autoPatch.deploy - Automated agent/module update—apply fixes tested in dev to production agent fleet
 */

const { pool } = require('../../database');
const fs = require('fs');
const path = require('path');

class AutoPatchPrimitive {
  constructor() {
    this.patchHistory = [];
  }

  /**
   * autoPatch.deploy - Deploy patch to agents
   * @param {Object} params - { patchId, patchConfig, agentIds, environment, testFirst }
   * @returns {Promise<Object>} - { deployed, patchId, results }
   */
  async deploy(params) {
    const {
      patchId = `patch_${Date.now()}`,
      patchConfig,
      agentIds = [],
      environment = 'production',
      testFirst = true
    } = params;

    try {
      // Validate patch config
      if (!patchConfig || !patchConfig.type || !patchConfig.data) {
        throw new Error('Invalid patch configuration');
      }

      const results = {
        patchId,
        environment,
        deployed: [],
        failed: [],
        skipped: []
      };

      // Test patch first if requested
      if (testFirst) {
        const testResult = await this.testPatch(patchConfig);
        if (!testResult.success) {
          throw new Error(`Patch test failed: ${testResult.error}`);
        }
      }

      // Get agents to patch
      let agentsToPatch = [];
      if (agentIds.length === 0) {
        // Patch all agents if none specified
        const allAgentsResult = await pool.query(
          'SELECT agent_id FROM agents WHERE status = $1',
          ['active']
        );
        agentsToPatch = allAgentsResult.rows.map(row => row.agent_id);
      } else {
        agentsToPatch = agentIds;
      }

      // Deploy patch to each agent
      for (const agentId of agentsToPatch) {
        try {
          const deployResult = await this.applyPatch(agentId, patchConfig);
          
          if (deployResult.success) {
            results.deployed.push({
              agentId,
              status: 'success',
              changes: deployResult.changes
            });

            // Log successful deployment
            await pool.query(
              `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
              [
                agentId,
                'autoPatch.deploy',
                JSON.stringify({ patchId, patchConfig }),
                JSON.stringify({ environment }),
                'deployed'
              ]
            );
          } else {
            results.failed.push({
              agentId,
              status: 'failed',
              error: deployResult.error
            });
          }
        } catch (error) {
          results.failed.push({
            agentId,
            status: 'error',
            error: error.message
          });
        }
      }

      // Store patch history
      this.patchHistory.push({
        patchId,
        timestamp: new Date(),
        results
      });

      return results;
    } catch (error) {
      console.error('autoPatch.deploy error:', error);
      throw error;
    }
  }

  /**
   * Test patch before deployment
   */
  async testPatch(patchConfig) {
    try {
      // Simulate patch application
      // In production, this would apply to a test agent or sandbox environment
      
      if (patchConfig.type === 'config') {
        // Validate config structure
        if (!patchConfig.data.config) {
          return { success: false, error: 'Invalid config patch data' };
        }
      } else if (patchConfig.type === 'prompt') {
        // Validate prompt
        if (!patchConfig.data.systemPrompt || typeof patchConfig.data.systemPrompt !== 'string') {
          return { success: false, error: 'Invalid prompt patch data' };
        }
      } else if (patchConfig.type === 'module') {
        // Validate module file exists
        if (patchConfig.data.modulePath && !fs.existsSync(patchConfig.data.modulePath)) {
          return { success: false, error: 'Module file not found' };
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply patch to specific agent
   */
  async applyPatch(agentId, patchConfig) {
    try {
      const agentResult = await pool.query(
        'SELECT * FROM agents WHERE agent_id = $1',
        [agentId]
      );

      if (agentResult.rows.length === 0) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const agent = agentResult.rows[0];
      const changes = [];

      if (patchConfig.type === 'config') {
        // Update agent config
        const currentConfig = agent.config ? JSON.parse(agent.config) : {};
        const newConfig = { ...currentConfig, ...patchConfig.data.config };
        
        await pool.query(
          'UPDATE agents SET config = $1, updated_at = NOW() WHERE agent_id = $2',
          [JSON.stringify(newConfig), agentId]
        );

        changes.push('config_updated');
      } else if (patchConfig.type === 'prompt') {
        // Update system prompt
        await pool.query(
          'UPDATE agents SET system_prompt = $1, updated_at = NOW() WHERE agent_id = $2',
          [patchConfig.data.systemPrompt, agentId]
        );

        changes.push('prompt_updated');
      } else if (patchConfig.type === 'voice') {
        // Update voice settings
        await pool.query(
          'UPDATE agents SET voice_id = $1, updated_at = NOW() WHERE agent_id = $2',
          [patchConfig.data.voiceId, agentId]
        );

        changes.push('voice_updated');
      }

      return {
        success: true,
        changes
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get patch history
   * @param {Object} options - { limit, agentId }
   * @returns {Promise<Array>} - Patch history
   */
  async getPatchHistory(options = {}) {
    const { limit = 20, agentId = null } = options;

    let query = `
      SELECT DISTINCT 
        payload->>'patchId' as patch_id,
        agent_id,
        status,
        created_at
      FROM agent_logs
      WHERE action = 'autoPatch.deploy'
    `;
    const params = [];

    if (agentId) {
      query += ' AND agent_id = $1';
      params.push(agentId);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);

    return result.rows;
  }
}

module.exports = AutoPatchPrimitive;

