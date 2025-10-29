/**
 * Self-Healing Primitives - Anomaly Detection
 * agent.anomalyDetect - Detect abnormal workflow outcomes (missed calls, errors, unresponsive workflows)
 */

const { pool } = require('../../database');

class AnomalyDetectionPrimitive {
  constructor() {
    this.thresholds = {
      errorRate: 0.2, // 20% error rate threshold
      timeWindow: 300000, // 5 minutes
      minSamples: 10 // Minimum samples needed for detection
    };
  }

  /**
   * agent.anomalyDetect - Detect anomalies in agent/workflow behavior
   * @param {Object} params - { agentId, type, timeWindow }
   * @returns {Promise<Object>} - { anomalyDetected, type, details, severity }
   */
  async anomalyDetect(params) {
    const { agentId, type = 'all', timeWindow = this.thresholds.timeWindow } = params;

    try {
      const anomalies = [];
      const cutoffTime = new Date(Date.now() - timeWindow);

      if (type === 'all' || type === 'error_rate') {
        // Check error rate
        const errorResult = await pool.query(
          `SELECT 
             COUNT(*) FILTER (WHERE status = 'error') as error_count,
             COUNT(*) as total_count
           FROM agent_logs
           WHERE agent_id = $1 
           AND created_at > $2`,
          [agentId, cutoffTime]
        );

        const errorCount = parseInt(errorResult.rows[0].error_count);
        const totalCount = parseInt(errorResult.rows[0].total_count);

        if (totalCount >= this.thresholds.minSamples) {
          const errorRate = errorCount / totalCount;
          
          if (errorRate > this.thresholds.errorRate) {
            anomalies.push({
              type: 'high_error_rate',
              severity: errorRate > 0.5 ? 'critical' : 'warning',
              details: {
                errorRate: errorRate.toFixed(2),
                errorCount,
                totalCount
              }
            });
          }
        }
      }

      if (type === 'all' || type === 'missed_calls') {
        // Check for missed calls (agents with no logs in time window)
        const activityResult = await pool.query(
          `SELECT COUNT(*) as activity_count
           FROM agent_logs
           WHERE agent_id = $1 
           AND action LIKE '%call%'
           AND created_at > $2`,
          [agentId, cutoffTime]
        );

        const activityCount = parseInt(activityResult.rows[0].activity_count);

        if (activityCount === 0) {
          // Check if agent should be active
          const agentResult = await pool.query(
            'SELECT * FROM agents WHERE agent_id = $1',
            [agentId]
          );

          if (agentResult.rows.length > 0 && agentResult.rows[0].status === 'active') {
            anomalies.push({
              type: 'missed_calls',
              severity: 'warning',
              details: {
                expectedActivity: true,
                actualActivity: false,
                timeWindow: timeWindow / 1000 // seconds
              }
            });
          }
        }
      }

      if (type === 'all' || type === 'unresponsive_workflows') {
        // Check for workflows that started but never completed
        const workflowResult = await pool.query(
          `SELECT 
             COUNT(*) FILTER (WHERE action = 'ghl.triggerWorkflow' AND status = 'success') as triggered,
             COUNT(*) FILTER (WHERE action LIKE '%workflow%complete%' OR action LIKE '%workflow%finish%') as completed
           FROM agent_logs
           WHERE agent_id = $1 
           AND created_at > $2`,
          [agentId, cutoffTime]
        );

        const triggered = parseInt(workflowResult.rows[0].triggered);
        const completed = parseInt(workflowResult.rows[0].completed);

        if (triggered > 0 && completed < triggered * 0.8) {
          anomalies.push({
            type: 'unresponsive_workflows',
            severity: 'warning',
            details: {
              triggered,
              completed,
              completionRate: (completed / triggered).toFixed(2)
            }
          });
        }
      }

      const anomalyDetected = anomalies.length > 0;

      if (anomalyDetected) {
        // Log anomaly detection
        await pool.query(
          `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            agentId,
            'agent.anomalyDetect',
            JSON.stringify({ anomalies }),
            JSON.stringify({ type, timeWindow }),
            anomalyDetected ? 'anomaly_detected' : 'normal'
          ]
        );

        // Create incident for critical anomalies
        const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
        if (criticalAnomalies.length > 0) {
          await pool.query(
            `INSERT INTO mcp_incidents 
             (agent_id, error_message, status, metadata, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
              agentId,
              'Critical anomaly detected',
              'open',
              JSON.stringify({ anomalies: criticalAnomalies })
            ]
          );
        }
      }

      return {
        anomalyDetected,
        anomalies,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('agent.anomalyDetect error:', error);
      throw error;
    }
  }

  /**
   * Set detection thresholds
   * @param {Object} thresholds - Configuration for anomaly detection
   */
  setThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}

module.exports = AnomalyDetectionPrimitive;

