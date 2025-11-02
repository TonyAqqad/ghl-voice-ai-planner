/**
 * Webhook MCP Primitives
 * webhook.onEvent - Register backend handlers for GoHighLevel, voice agent, or API webhook events
 */

const { pool } = require('../../database');

class WebhookPrimitive {
  constructor() {
    this.handlers = new Map();
  }

  /**
   * webhook.onEvent - Register event handler
   * @param {Object} params - { eventType, handler, options }
   * @returns {Promise<Object>} - { handlerId, status }
   */
  async onEvent(params) {
    const { eventType, handler, options = {} } = params;

    try {
      const handlerId = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store handler in memory for runtime
      this.handlers.set(handlerId, {
        eventType,
        handler,
        options,
        registeredAt: new Date()
      });

      // Log registration
      await pool.query(
        'INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [
          'system',
          'webhook.onEvent',
          JSON.stringify({ eventType, handlerId }),
          JSON.stringify(options),
          'registered'
        ]
      );

      return {
        handlerId,
        status: 'registered',
        eventType,
        registeredAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('webhook.onEvent error:', error);
      throw error;
    }
  }

  /**
   * Process incoming webhook event
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event payload
   * @returns {Promise<Array>} - Results from all handlers
   */
  async processEvent(eventType, eventData) {
    const results = [];
    
    for (const [handlerId, handlerInfo] of this.handlers.entries()) {
      if (handlerInfo.eventType === eventType || handlerInfo.eventType === '*') {
        try {
          const result = await handlerInfo.handler(eventData);
          results.push({
            handlerId,
            status: 'success',
            result
          });

          // Log successful processing
          await pool.query(
            'INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
            [
              handlerId,
              'webhook.processEvent',
              JSON.stringify({ eventType }),
              JSON.stringify(eventData),
              'success'
            ]
          );
        } catch (error) {
          results.push({
            handlerId,
            status: 'error',
            error: error.message
          });

          // Log error
          await pool.query(
            'INSERT INTO agent_logs (agent_id, action, payload, context, status, error_message, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
            [
              handlerId,
              'webhook.processEvent',
              JSON.stringify({ eventType }),
              JSON.stringify(eventData),
              'error',
              error.message
            ]
          );
        }
      }
    }

    return results;
  }

  /**
   * Remove event handler
   * @param {string} handlerId - Handler ID to remove
   * @returns {Promise<Object>} - { status }
   */
  async removeHandler(handlerId) {
    if (this.handlers.has(handlerId)) {
      this.handlers.delete(handlerId);
      return { status: 'removed', handlerId };
    }
    return { status: 'not_found', handlerId };
  }
}

module.exports = WebhookPrimitive;

