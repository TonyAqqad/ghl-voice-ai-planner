/**
 * Self-Healing Primitives - Live Tracing
 * agent.liveTrace - Real-time trace of workflow/agent decisions, API calls
 */

const { pool } = require('../../database');

class LiveTracePrimitive {
  constructor() {
    this.activeTraces = new Map(); // In-memory trace storage for real-time access
  }

  /**
   * agent.liveTrace - Create or update trace entry
   * @param {Object} params - { traceId, agentId, step, action, input, output, context }
   * @returns {Promise<Object>} - { traceId, step, timestamp }
   */
  async liveTrace(params) {
    const {
      traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      step,
      action,
      input = {},
      output = {},
      context = {},
      status = 'in_progress'
    } = params;

    try {
      const traceEntry = {
        traceId,
        agentId,
        step,
        action,
        input,
        output,
        context,
        status,
        timestamp: new Date().toISOString()
      };

      // Store in memory for real-time access
      if (!this.activeTraces.has(traceId)) {
        this.activeTraces.set(traceId, {
          traceId,
          agentId,
          steps: [],
          startedAt: new Date(),
          status: 'in_progress'
        });
      }

      const trace = this.activeTraces.get(traceId);
      trace.steps.push(traceEntry);
      trace.lastUpdated = new Date();

      if (status === 'completed' || status === 'error') {
        trace.status = status;
      }

      // Store in database for persistence
      await pool.query(
        `INSERT INTO mcp_traces 
         (trace_id, agent_id, step_number, action, input_data, output_data, context_data, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          traceId,
          agentId,
          step,
          action,
          JSON.stringify(input),
          JSON.stringify(output),
          JSON.stringify(context),
          status
        ]
      );

      return {
        traceId,
        step,
        timestamp: traceEntry.timestamp
      };
    } catch (error) {
      console.error('agent.liveTrace error:', error);
      throw error;
    }
  }

  /**
   * Get trace by ID
   * @param {string} traceId - Trace ID
   * @returns {Promise<Object>} - Full trace data
   */
  async getTrace(traceId) {
    // First check memory cache
    if (this.activeTraces.has(traceId)) {
      return this.activeTraces.get(traceId);
    }

    // Fallback to database
    const result = await pool.query(
      `SELECT * FROM mcp_traces 
       WHERE trace_id = $1 
       ORDER BY step_number ASC`,
      [traceId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const steps = result.rows.map(row => ({
      step: row.step_number,
      action: row.action,
      input: row.input_data,
      output: row.output_data,
      context: row.context_data,
      status: row.status,
      timestamp: row.created_at
    }));

    return {
      traceId,
      agentId: result.rows[0].agent_id,
      steps,
      startedAt: result.rows[0].created_at,
      status: result.rows[result.rows.length - 1].status
    };
  }

  /**
   * Get traces for agent
   * @param {string} agentId - Agent ID
   * @param {Object} options - { limit, status, timeWindow }
   * @returns {Promise<Array>} - List of traces
   */
  async getAgentTraces(agentId, options = {}) {
    const { limit = 10, status = null, timeWindow = null } = options;

    let query = `
      SELECT DISTINCT trace_id, agent_id, 
             MIN(created_at) as started_at,
             MAX(created_at) as last_updated,
             MAX(step_number) as total_steps
      FROM mcp_traces
      WHERE agent_id = $1
    `;
    const params = [agentId];

    if (status) {
      query += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    if (timeWindow) {
      const cutoffTime = new Date(Date.now() - timeWindow);
      query += ' AND created_at > $' + (params.length + 1);
      params.push(cutoffTime);
    }

    query += ' GROUP BY trace_id, agent_id ORDER BY started_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      traceId: row.trace_id,
      agentId: row.agent_id,
      startedAt: row.started_at,
      lastUpdated: row.last_updated,
      totalSteps: row.total_steps,
      status: row.status
    }));
  }

  /**
   * Clean up old traces from memory
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanup(maxAge = 3600000) { // Default 1 hour
    const cutoff = Date.now() - maxAge;
    
    for (const [traceId, trace] of this.activeTraces.entries()) {
      if (trace.lastUpdated.getTime() < cutoff && trace.status !== 'in_progress') {
        this.activeTraces.delete(traceId);
      }
    }
  }
}

module.exports = LiveTracePrimitive;

