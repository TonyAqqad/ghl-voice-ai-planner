/**
 * Self-Healing Primitives - Incident Reporting
 * incidentReport.create - Create, route, and log incidents (failed calls, API outages) for escalation/reporting
 */

const { pool } = require('../../database');

class IncidentReportPrimitive {
  constructor() {
    this.incidentSeverity = ['low', 'medium', 'high', 'critical'];
    this.incidentStatus = ['open', 'investigating', 'resolved', 'closed'];
  }

  /**
   * incidentReport.create - Create incident report
   * @param {Object} params - { agentId, errorMessage, severity, metadata, source }
   * @returns {Promise<Object>} - { incidentId, status, severity }
   */
  async create(params) {
    const {
      agentId = 'system',
      errorMessage,
      severity = 'medium',
      metadata = {},
      source = 'system',
      title = null
    } = params;

    try {
      if (!this.incidentSeverity.includes(severity)) {
        throw new Error(`Invalid severity. Must be one of: ${this.incidentSeverity.join(', ')}`);
      }

      const incidentTitle = title || errorMessage?.substring(0, 100) || 'Incident';

      const result = await pool.query(
        `INSERT INTO mcp_incidents 
         (agent_id, title, error_message, severity, status, source, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id`,
        [
          agentId,
          incidentTitle,
          errorMessage,
          severity,
          'open',
          source,
          JSON.stringify(metadata)
        ]
      );

      const incidentId = result.rows[0].id;

      // Log incident creation
      await pool.query(
        `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          agentId,
          'incidentReport.create',
          JSON.stringify({ incidentId, severity, title: incidentTitle }),
          JSON.stringify(metadata),
          'incident_created'
        ]
      );

      // Auto-escalate critical incidents
      if (severity === 'critical') {
        await this.escalate(incidentId, { reason: 'auto_escalate_critical' });
      }

      return {
        incidentId,
        status: 'open',
        severity,
        title: incidentTitle,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('incidentReport.create error:', error);
      throw error;
    }
  }

  /**
   * Update incident status
   * @param {number} incidentId - Incident ID
   * @param {Object} params - { status, resolution, updatedBy }
   * @returns {Promise<Object>} - Updated incident
   */
  async update(incidentId, params) {
    const { status, resolution = null, updatedBy = 'system' } = params;

    try {
      if (status && !this.incidentStatus.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${this.incidentStatus.join(', ')}`);
      }

      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (status) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      if (resolution) {
        updates.push(`resolution = $${paramIndex++}`);
        values.push(resolution);
      }

      updates.push(`updated_at = NOW()`);
      updates.push(`updated_by = $${paramIndex++}`);
      values.push(updatedBy);

      values.push(incidentId);

      const query = `
        UPDATE mcp_incidents 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      return result.rows[0];
    } catch (error) {
      console.error('incidentReport.update error:', error);
      throw error;
    }
  }

  /**
   * Escalate incident
   * @param {number} incidentId - Incident ID
   * @param {Object} params - { reason, escalatedTo }
   * @returns {Promise<Object>} - Escalation result
   */
  async escalate(incidentId, params) {
    const { reason, escalatedTo = null } = params;

    try {
      // Get incident
      const incidentResult = await pool.query(
        'SELECT * FROM mcp_incidents WHERE id = $1',
        [incidentId]
      );

      if (incidentResult.rows.length === 0) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      const incident = incidentResult.rows[0];

      // Increase severity if not already critical
      let newSeverity = incident.severity;
      if (incident.severity === 'low') {
        newSeverity = 'medium';
      } else if (incident.severity === 'medium') {
        newSeverity = 'high';
      } else if (incident.severity === 'high') {
        newSeverity = 'critical';
      }

      // Update incident
      await pool.query(
        `UPDATE mcp_incidents 
         SET severity = $1, status = 'investigating', updated_at = NOW()
         WHERE id = $2`,
        [newSeverity, incidentId]
      );

      // Log escalation
      await pool.query(
        `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          incident.agent_id,
          'incidentReport.escalate',
          JSON.stringify({ incidentId, reason, escalatedTo, newSeverity }),
          JSON.stringify({}),
          'escalated'
        ]
      );

      return {
        incidentId,
        escalated: true,
        newSeverity,
        reason,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('incidentReport.escalate error:', error);
      throw error;
    }
  }

  /**
   * Get incidents
   * @param {Object} filters - { agentId, status, severity, limit }
   * @returns {Promise<Array>} - List of incidents
   */
  async getIncidents(filters = {}) {
    const { agentId = null, status = null, severity = null, limit = 50 } = filters;

    let query = 'SELECT * FROM mcp_incidents WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (agentId) {
      query += ` AND agent_id = $${paramIndex++}`;
      params.push(agentId);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(severity);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return result.rows;
  }

  /**
   * Get incident summary
   * @param {Object} filters - { agentId, timeWindow }
   * @returns {Promise<Object>} - Summary statistics
   */
  async getSummary(filters = {}) {
    const { agentId = null, timeWindow = 7 * 24 * 60 * 60 * 1000 } = filters;
    const cutoffTime = new Date(Date.now() - timeWindow);

    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical,
        COUNT(*) FILTER (WHERE severity = 'high') as high
      FROM mcp_incidents
      WHERE created_at > $1
    `;
    const params = [cutoffTime];

    if (agentId) {
      query += ' AND agent_id = $2';
      params.push(agentId);
    }

    const result = await pool.query(query, params);

    return {
      summary: result.rows[0],
      timeWindow: timeWindow / 1000 / 60 / 60 / 24, // days
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = IncidentReportPrimitive;

