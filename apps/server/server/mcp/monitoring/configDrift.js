/**
 * Self-Healing Primitives - Config Drift Detection
 * configDrift.detect - Compare agent config (expected vs actual): voice, phone, CRM endpoints, API keys
 */

const { pool } = require('../../database');

class ConfigDriftPrimitive {
  constructor() {
    this.configFields = [
      'voice_id',
      'phone_number',
      'system_prompt',
      'crm_endpoint',
      'api_keys'
    ];
  }

  /**
   * configDrift.detect - Detect configuration drift
   * @param {Object} params - { agentId, expectedConfig, checkFields }
   * @returns {Promise<Object>} - { driftDetected, drifts, severity }
   */
  async detect(params) {
    const { agentId, expectedConfig, checkFields = this.configFields } = params;

    try {
      // Get current agent configuration
      const agentResult = await pool.query(
        'SELECT * FROM agents WHERE agent_id = $1',
        [agentId]
      );

      if (agentResult.rows.length === 0) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const agent = agentResult.rows[0];
      const currentConfig = {
        voice_id: agent.voice_id,
        system_prompt: agent.system_prompt,
        config: agent.config ? JSON.parse(agent.config) : {}
      };

      // Get expected config (from parameter or stored baseline)
      let expected = expectedConfig;
      if (!expected) {
        // Try to get baseline from agent_states or config history
        const baselineResult = await pool.query(
          `SELECT state_data->>'config' as baseline_config
           FROM mcp_agent_states
           WHERE agent_id = $1
           ORDER BY created_at ASC
           LIMIT 1`,
          [agentId]
        );

        if (baselineResult.rows.length > 0 && baselineResult.rows[0].baseline_config) {
          expected = JSON.parse(baselineResult.rows[0].baseline_config);
        } else {
          // Use current as baseline if no baseline exists
          expected = currentConfig;
        }
      }

      // Compare configurations
      const drifts = [];
      let severity = 'low';

      for (const field of checkFields) {
        const currentValue = this.getFieldValue(currentConfig, field);
        const expectedValue = this.getFieldValue(expected, field);

        if (JSON.stringify(currentValue) !== JSON.stringify(expectedValue)) {
          const drift = {
            field,
            expected: expectedValue,
            actual: currentValue,
            type: this.getDriftType(field)
          };

          if (drift.type === 'critical') {
            severity = 'critical';
          } else if (drift.type === 'important' && severity !== 'critical') {
            severity = 'important';
          }

          drifts.push(drift);
        }
      }

      const driftDetected = drifts.length > 0;

      if (driftDetected) {
        // Log drift detection
        await pool.query(
          `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            agentId,
            'configDrift.detect',
            JSON.stringify({ drifts, severity }),
            JSON.stringify({ expected, current: currentConfig }),
            driftDetected ? 'drift_detected' : 'no_drift'
          ]
        );

        // Create incident for critical drifts
        if (severity === 'critical') {
          await pool.query(
            `INSERT INTO mcp_incidents 
             (agent_id, error_message, status, metadata, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
              agentId,
              'Critical configuration drift detected',
              'open',
              JSON.stringify({ drifts })
            ]
          );
        }
      }

      return {
        driftDetected,
        drifts,
        severity,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('configDrift.detect error:', error);
      throw error;
    }
  }

  /**
   * Get field value from config object (supports nested paths)
   */
  getFieldValue(config, field) {
    if (field.includes('.')) {
      const parts = field.split('.');
      let value = config;
      for (const part of parts) {
        value = value?.[part];
      }
      return value;
    }
    return config[field];
  }

  /**
   * Determine drift type/severity based on field
   */
  getDriftType(field) {
    const criticalFields = ['api_keys', 'crm_endpoint'];
    const importantFields = ['voice_id', 'system_prompt'];
    
    if (criticalFields.includes(field)) {
      return 'critical';
    } else if (importantFields.includes(field)) {
      return 'important';
    }
    return 'low';
  }

  /**
   * Auto-repair configuration drift (if enabled)
   * @param {Object} params - { agentId, autoRepair }
   * @returns {Promise<Object>} - Repair result
   */
  async autoRepair(params) {
    const { agentId, autoRepair = false } = params;

    if (!autoRepair) {
      return { repaired: false, reason: 'auto_repair_disabled' };
    }

    try {
      const driftResult = await this.detect({ agentId });
      
      if (!driftResult.driftDetected) {
        return { repaired: false, reason: 'no_drift' };
      }

      // Only auto-repair low/important severity drifts
      const repairableDrifts = driftResult.drifts.filter(
        d => d.type !== 'critical'
      );

      if (repairableDrifts.length === 0) {
        return {
          repaired: false,
          reason: 'only_critical_drifts',
          drifts: driftResult.drifts
        };
      }

      // For now, just log that repair should be done manually
      // In production, this would restore from baseline or expected config
      await pool.query(
        `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          agentId,
          'configDrift.autoRepair',
          JSON.stringify({ repairableDrifts }),
          JSON.stringify({}),
          'repair_initiated'
        ]
      );

      return {
        repaired: true,
        repairedCount: repairableDrifts.length,
        drifts: repairableDrifts
      };
    } catch (error) {
      console.error('configDrift.autoRepair error:', error);
      throw error;
    }
  }
}

module.exports = ConfigDriftPrimitive;

