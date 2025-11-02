/**
 * Self-Healing Primitives - Auto Recovery
 * agent.autoRecovery - When health check or retry exceeds threshold, rollback to last working state or auto-patch agent config
 */

const { pool } = require('../../database');

class AutoRecoveryPrimitive {
  constructor() {
    this.recoveryThresholds = {
      maxFailures: 3,
      recoveryWindow: 60000 // 1 minute
    };
  }

  /**
   * agent.autoRecovery - Attempt to recover agent to last working state
   * @param {Object} params - { agentId, failureType, lastWorkingState }
   * @returns {Promise<Object>} - { recovered, action, restoredState }
   */
  async autoRecovery(params) {
    const { agentId, failureType = 'unknown', lastWorkingState = null } = params;

    try {
      // Check recent failures for this agent
      const failureResult = await pool.query(
        `SELECT COUNT(*) as failure_count 
         FROM mcp_health_checks 
         WHERE agent_id = $1 
         AND healthy = false 
         AND created_at > NOW() - INTERVAL '1 minute'`,
        [agentId]
      );

      const failureCount = parseInt(failureResult.rows[0].failure_count);

      if (failureCount < this.recoveryThresholds.maxFailures) {
        return {
          recovered: false,
          reason: 'failure_threshold_not_met',
          failureCount
        };
      }

      // Load last working state from database
      let stateToRestore = lastWorkingState;
      
      if (!stateToRestore) {
        const stateResult = await pool.query(
          `SELECT state_data 
           FROM mcp_agent_states 
           WHERE agent_id = $1 
           AND updated_at < NOW() - INTERVAL '5 minutes'
           ORDER BY updated_at DESC 
           LIMIT 1`,
          [agentId]
        );

        if (stateResult.rows.length > 0) {
          stateToRestore = stateResult.rows[0].state_data;
        }
      }

      // Load agent config
      const agentResult = await pool.query(
        'SELECT * FROM agents WHERE agent_id = $1',
        [agentId]
      );

      if (agentResult.rows.length === 0) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const agent = agentResult.rows[0];
      let recoveryAction = 'none';

      // Attempt recovery actions
      if (failureType === 'config' || failureType === 'unknown') {
        // Rollback config to last working version
        if (stateToRestore && stateToRestore.config) {
          await pool.query(
            'UPDATE agents SET config = $1, updated_at = NOW() WHERE agent_id = $2',
            [JSON.stringify(stateToRestore.config), agentId]
          );
          recoveryAction = 'config_rollback';
        }
      }

      if (failureType === 'api' || failureType === 'connection') {
        // Reset API connection status
        recoveryAction = 'api_reset';
      }

      // Log recovery attempt
      await pool.query(
        `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          agentId,
          'agent.autoRecovery',
          JSON.stringify({ failureType, recoveryAction }),
          JSON.stringify({ failureCount, restoredState: stateToRestore }),
          recoveryAction !== 'none' ? 'recovered' : 'no_action'
        ]
      );

      return {
        recovered: recoveryAction !== 'none',
        action: recoveryAction,
        restoredState: stateToRestore,
        failureCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('agent.autoRecovery error:', error);

      // Log recovery failure
      await pool.query(
        `INSERT INTO agent_logs (agent_id, action, payload, context, status, error_message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          agentId,
          'agent.autoRecovery',
          JSON.stringify({ failureType }),
          JSON.stringify({}),
          'error',
          error.message
        ]
      );

      throw error;
    }
  }

  /**
   * Set recovery thresholds
   * @param {Object} thresholds - { maxFailures, recoveryWindow }
   */
  setThresholds(thresholds) {
    this.recoveryThresholds = { ...this.recoveryThresholds, ...thresholds };
  }
}

module.exports = AutoRecoveryPrimitive;

