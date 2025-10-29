/**
 * Integration MCP Primitives
 * integration.connect - Modular backend—on-demand connect to ElevenLabs, GHL, Twilio, Stripe, etc.
 */

const { pool } = require('../../database');
const axios = require('axios');

class IntegrationPrimitive {
  constructor() {
    this.connections = new Map(); // Track active connections
  }

  /**
   * integration.connect - Connect to external service
   * @param {Object} params - { service, apiKey, config, locationId }
   * @returns {Promise<Object>} - { connectionId, status, service }
   */
  async connect(params) {
    const { service, apiKey, config = {}, locationId = null } = params;

    try {
      let connectionId;
      let status;
      let details = {};

      switch (service.toLowerCase()) {
        case 'elevenlabs':
          // Test ElevenLabs connection
          try {
            const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
              headers: { 'xi-api-key': apiKey },
              timeout: 5000
            });
            connectionId = `elevenlabs_${Date.now()}`;
            status = 'connected';
            details = {
              voicesCount: response.data.voices?.length || 0,
              apiKey: apiKey.substring(0, 8) + '...' // Partial key for logging
            };
            this.connections.set(connectionId, { service: 'elevenlabs', apiKey, config });
          } catch (error) {
            throw new Error(`ElevenLabs connection failed: ${error.message}`);
          }
          break;

        case 'openai':
          // Test OpenAI connection
          try {
            const response = await axios.get('https://api.openai.com/v1/models', {
              headers: { 'Authorization': `Bearer ${apiKey}` },
              timeout: 5000
            });
            connectionId = `openai_${Date.now()}`;
            status = 'connected';
            details = {
              modelsCount: response.data.data?.length || 0,
              apiKey: apiKey.substring(0, 8) + '...'
            };
            this.connections.set(connectionId, { service: 'openai', apiKey, config });
          } catch (error) {
            throw new Error(`OpenAI connection failed: ${error.message}`);
          }
          break;

        case 'ghl':
        case 'gohighlevel':
          // Store GHL tokens/credentials
          if (locationId) {
            connectionId = `ghl_${locationId}_${Date.now()}`;
            status = 'connected';
            details = {
              locationId,
              baseUrl: config.baseUrl || 'https://services.leadconnectorhq.com'
            };
            
            // Store in database if tokens provided
            if (apiKey) {
              await pool.query(
                `INSERT INTO tokens (access_token, location_id, created_at, updated_at)
                 VALUES ($1, $2, NOW(), NOW())
                 ON CONFLICT (location_id) DO UPDATE 
                 SET access_token = $1, updated_at = NOW()`,
                [apiKey, locationId]
              );
            }
            
            this.connections.set(connectionId, { service: 'ghl', locationId, config });
          } else {
            throw new Error('locationId required for GHL connection');
          }
          break;

        case 'twilio':
          // Test Twilio connection
          try {
            const accountSid = apiKey || config.accountSid;
            const authToken = config.authToken;
            
            const response = await axios.get(
              `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
              {
                auth: { username: accountSid, password: authToken },
                timeout: 5000
              }
            );
            connectionId = `twilio_${Date.now()}`;
            status = 'connected';
            details = {
              accountStatus: response.data.status,
              friendlyName: response.data.friendly_name
            };
            this.connections.set(connectionId, { service: 'twilio', accountSid, authToken, config });
          } catch (error) {
            throw new Error(`Twilio connection failed: ${error.message}`);
          }
          break;

        case 'stripe':
          // Test Stripe connection
          try {
            const response = await axios.get('https://api.stripe.com/v1/account', {
              headers: { 'Authorization': `Bearer ${apiKey}` },
              timeout: 5000
            });
            connectionId = `stripe_${Date.now()}`;
            status = 'connected';
            details = {
              accountId: response.data.id,
              country: response.data.country
            };
            this.connections.set(connectionId, { service: 'stripe', apiKey, config });
          } catch (error) {
            throw new Error(`Stripe connection failed: ${error.message}`);
          }
          break;

        default:
          throw new Error(`Unsupported service: ${service}`);
      }

      // Log the connection
      await pool.query(
        `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          locationId || 'system',
          'integration.connect',
          JSON.stringify({ service, connectionId, details }),
          JSON.stringify(config),
          status
        ]
      );

      return {
        connectionId,
        status,
        service,
        details,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('integration.connect error:', error);

      // Log error
      await pool.query(
        `INSERT INTO agent_logs (agent_id, action, payload, context, status, error_message, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          locationId || 'system',
          'integration.connect',
          JSON.stringify({ service }),
          JSON.stringify(config),
          'error',
          error.message
        ]
      );

      throw error;
    }
  }

  /**
   * Get connection status
   * @param {string} connectionId - Connection ID
   * @returns {Promise<Object>} - Connection status
   */
  async getConnectionStatus(connectionId) {
    if (this.connections.has(connectionId)) {
      const conn = this.connections.get(connectionId);
      return {
        connectionId,
        service: conn.service,
        status: 'active',
        connectedAt: conn.connectedAt || 'unknown'
      };
    }
    return {
      connectionId,
      status: 'not_found'
    };
  }

  /**
   * Disconnect service
   * @param {string} connectionId - Connection ID
   * @returns {Promise<Object>} - Disconnect result
   */
  async disconnect(connectionId) {
    if (this.connections.has(connectionId)) {
      this.connections.delete(connectionId);
      return {
        connectionId,
        status: 'disconnected'
      };
    }
    return {
      connectionId,
      status: 'not_found'
    };
  }
}

module.exports = IntegrationPrimitive;

