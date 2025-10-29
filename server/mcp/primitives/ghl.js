/**
 * GoHighLevel MCP Primitives
 * ghl.triggerWorkflow - Directly activate GoHighLevel workflows via API/webhook
 */

const axios = require('axios');
const { pool } = require('../../database');
const GHLProvider = require('../../providers/ghl');

class GHLPrimitive {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'https://services.leadconnectorhq.com';
    this.version = '2021-07-28';
  }

  /**
   * Get access token for location
   */
  async getAccessToken(locationId) {
    const result = await pool.query(
      'SELECT access_token, expires_at FROM tokens WHERE location_id = $1 ORDER BY created_at DESC LIMIT 1',
      [locationId]
    );

    if (result.rows.length === 0) {
      throw new Error(`No tokens found for location ${locationId}`);
    }

    const token = result.rows[0];
    
    // Check if token is expired (with 5 minute buffer)
    if (token.expires_at && token.expires_at < Date.now() - 300000) {
      throw new Error(`Token expired for location ${locationId}`);
    }

    return token.access_token;
  }

  /**
   * ghl.triggerWorkflow - Activate GoHighLevel workflow
   * @param {Object} params - { locationId, workflowId, contactId, data }
   * @returns {Promise<Object>} - { workflowId, status, result }
   */
  async triggerWorkflow(params) {
    const { locationId, workflowId, contactId, data = {} } = params;

    try {
      const accessToken = await this.getAccessToken(locationId);
      
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Version': this.version,
        'Content-Type': 'application/json'
      };

      // Trigger workflow via GHL API
      const response = await axios.post(
        `${this.baseUrl}/workflows/${workflowId}/actions/trigger`,
        {
          contactId: contactId,
          ...data
        },
        { headers }
      );

      // Log the workflow trigger
      await pool.query(
        'INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [
          `ghl_${locationId}`,
          'ghl.triggerWorkflow',
          JSON.stringify({ workflowId, contactId, data }),
          JSON.stringify({ locationId }),
          'success'
        ]
      );

      return {
        workflowId,
        status: 'triggered',
        result: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('ghl.triggerWorkflow error:', error);

      // Log error
      await pool.query(
        'INSERT INTO agent_logs (agent_id, action, payload, context, status, error_message, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [
          `ghl_${locationId}`,
          'ghl.triggerWorkflow',
          JSON.stringify({ workflowId, contactId, data }),
          JSON.stringify({ locationId }),
          'error',
          error.response?.data?.message || error.message
        ]
      );

      throw error;
    }
  }
}

module.exports = GHLPrimitive;

