/**
 * Agent MCP Primitives
 * agent.log - Structured logging (success, error, payload, context)
 * agent.checkHealth - Automated health checks (API connectivity, workflow status, voice agent function)
 * agent.saveState/loadState - Store session/context in Supabase (per agent per customer)
 */

const { pool } = require('../../database');
const axios = require('axios');

class AgentPrimitive {
  constructor(config) {
    this.config = config || {};
  }

  /**
   * agent.log - Structured logging
   * @param {Object} params - { agentId, action, payload, context, status, errorMessage }
   * @returns {Promise<Object>} - { logId, status }
   */
  async log(params) {
    const {
      agentId,
      action,
      payload = {},
      context = {},
      status = 'info',
      errorMessage = null
    } = params;

    try {
      const result = await pool.query(
        `INSERT INTO agent_logs 
         (agent_id, action, payload, context, status, error_message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [
          agentId,
          action,
          JSON.stringify(payload),
          JSON.stringify(context),
          status,
          errorMessage
        ]
      );

      return {
        logId: result.rows[0].id,
        status: 'logged',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('agent.log error:', error);
      throw error;
    }
  }

  /**
   * agent.checkHealth - Health check for agent/system
   * @param {Object} params - { agentId, checks }
   * @returns {Promise<Object>} - { healthy, checks, summary }
   */
  async checkHealth(params) {
    const { agentId = 'system', checks = ['database', 'apis'] } = params;

    const healthChecks = {
      database: false,
      apis: false,
      voiceAgent: false,
      ghl: false
    };

    const checkResults = [];

    try {
      // Check database
      if (checks.includes('database')) {
        try {
          await pool.query('SELECT 1');
          healthChecks.database = true;
          checkResults.push({ check: 'database', status: 'healthy', error: null });
        } catch (error) {
          checkResults.push({ check: 'database', status: 'unhealthy', error: error.message });
        }
      }

      // Check APIs
      if (checks.includes('apis')) {
        // Check OpenAI
        if (this.config.openaiApiKey) {
          try {
            await axios.get('https://api.openai.com/v1/models', {
              headers: { 'Authorization': `Bearer ${this.config.openaiApiKey}` },
              timeout: 5000
            });
            healthChecks.apis = true;
            checkResults.push({ check: 'openai_api', status: 'healthy', error: null });
          } catch (error) {
            checkResults.push({ check: 'openai_api', status: 'unhealthy', error: error.message });
          }
        }

        // Check ElevenLabs
        if (this.config.elevenlabsApiKey) {
          try {
            await axios.get('https://api.elevenlabs.io/v1/voices', {
              headers: { 'xi-api-key': this.config.elevenlabsApiKey },
              timeout: 5000
            });
            healthChecks.apis = true;
            checkResults.push({ check: 'elevenlabs_api', status: 'healthy', error: null });
          } catch (error) {
            checkResults.push({ check: 'elevenlabs_api', status: 'unhealthy', error: error.message });
          }
        }
      }

      // Check voice agent
      if (checks.includes('voiceAgent') && agentId !== 'system') {
        try {
          const result = await pool.query(
            'SELECT * FROM agents WHERE agent_id = $1',
            [agentId]
          );
          
          if (result.rows.length > 0) {
            healthChecks.voiceAgent = true;
            checkResults.push({ check: 'voiceAgent', status: 'healthy', error: null });
          } else {
            checkResults.push({ check: 'voiceAgent', status: 'not_found', error: 'Agent not found' });
          }
        } catch (error) {
          checkResults.push({ check: 'voiceAgent', status: 'error', error: error.message });
        }
      }

      // Check GHL
      if (checks.includes('ghl')) {
        try {
          await pool.query(
            'SELECT access_token FROM tokens ORDER BY created_at DESC LIMIT 1'
          );
          healthChecks.ghl = true;
          checkResults.push({ check: 'ghl_token', status: 'healthy', error: null });
        } catch (error) {
          checkResults.push({ check: 'ghl_token', status: 'unhealthy', error: error.message });
        }
      }

      // Store health check result
      const healthy = Object.values(healthChecks).some(v => v === true);

      await pool.query(
        `INSERT INTO mcp_health_checks 
         (agent_id, healthy, checks_data, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [
          agentId,
          healthy,
          JSON.stringify(checkResults)
        ]
      );

      return {
        healthy,
        checks: checkResults,
        summary: {
          total: checkResults.length,
          healthy: checkResults.filter(c => c.status === 'healthy').length,
          unhealthy: checkResults.filter(c => c.status !== 'healthy').length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('agent.checkHealth error:', error);
      throw error;
    }
  }

  /**
   * agent.saveState - Save agent state
   * @param {Object} params - { agentId, customerId, state }
   * @returns {Promise<Object>} - { stateId, status }
   */
  async saveState(params) {
    const { agentId, customerId, state } = params;

    try {
      const result = await pool.query(
        `INSERT INTO mcp_agent_states 
         (agent_id, customer_id, state_data, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (agent_id, customer_id) 
         DO UPDATE SET state_data = $3, updated_at = NOW()
         RETURNING id`,
        [agentId, customerId, JSON.stringify(state)]
      );

      return {
        stateId: result.rows[0].id,
        status: 'saved',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('agent.saveState error:', error);
      throw error;
    }
  }

  /**
   * agent.loadState - Load agent state
   * @param {Object} params - { agentId, customerId }
   * @returns {Promise<Object>} - { state, stateId, exists }
   */
  async loadState(params) {
    const { agentId, customerId } = params;

    try {
      const result = await pool.query(
        `SELECT * FROM mcp_agent_states 
         WHERE agent_id = $1 AND customer_id = $2 
         ORDER BY updated_at DESC 
         LIMIT 1`,
        [agentId, customerId]
      );

      if (result.rows.length === 0) {
        return {
          state: null,
          exists: false
        };
      }

      return {
        state: result.rows[0].state_data,
        stateId: result.rows[0].id,
        exists: true,
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      console.error('agent.loadState error:', error);
      throw error;
    }
  }
}

module.exports = AgentPrimitive;

