/**
 * Action MCP Primitives
 * action.retryIfFail - Agent/backend workflow retry logic: exponential backoff, max attempts, error escalation
 */

const { pool } = require('../../database');

class ActionPrimitive {
  constructor() {
    this.retryAttempts = new Map(); // Track retry attempts in memory
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} attempt - Current attempt number (0-indexed)
   * @param {number} baseDelay - Base delay in milliseconds
   * @param {number} maxDelay - Maximum delay in milliseconds
   * @returns {number} - Delay in milliseconds
   */
  calculateBackoff(attempt, baseDelay = 1000, maxDelay = 60000) {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter (random 0-25% of delay)
    const jitter = Math.random() * 0.25 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * action.retryIfFail - Retry action with exponential backoff
   * @param {Object} params - { action, maxAttempts, baseDelay, maxDelay, onError }
   * @returns {Promise<Object>} - { success, attempts, result, error }
   */
  async retryIfFail(params) {
    const {
      action,
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 60000,
      actionId = `action_${Date.now()}`,
      onError = null
    } = params;

    if (typeof action !== 'function') {
      throw new Error('action must be a function');
    }

    let lastError = null;
    const attempts = [];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const startTime = Date.now();
      try {
        // Execute the action
        const result = await action(attempt);
        const duration = Date.now() - startTime;

        attempts.push({
          attempt: attempt + 1,
          status: 'success',
          duration,
          timestamp: new Date().toISOString()
        });

        // Store successful attempt in database
        await pool.query(
          `INSERT INTO mcp_action_retries 
           (action_id, attempt_number, status, duration_ms, error_message, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [actionId, attempt + 1, 'success', duration, null]
        );

        // Clear retry tracking on success
        this.retryAttempts.delete(actionId);

        return {
          success: true,
          attempts: attempts.length,
          result,
          attempts
        };
      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;

        attempts.push({
          attempt: attempt + 1,
          status: 'failed',
          error: error.message,
          duration,
          timestamp: new Date().toISOString()
        });

        // Store failed attempt in database
        await pool.query(
          `INSERT INTO mcp_action_retries 
           (action_id, attempt_number, status, duration_ms, error_message, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [actionId, attempt + 1, 'failed', duration, error.message]
        );

        // If this was the last attempt, escalate
        if (attempt === maxAttempts - 1) {
          // Call error handler if provided
          if (onError) {
            try {
              await onError(error, attempts);
            } catch (escalationError) {
              console.error('Error escalation handler failed:', escalationError);
            }
          }

          // Log incident (note: mcp_incidents doesn't have action_id, using agent_id with actionId as identifier)
          await pool.query(
            `INSERT INTO mcp_incidents 
             (agent_id, title, error_message, severity, status, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              `action_${actionId}`,
              'Action retry exhausted',
              error.message,
              'high',
              'open',
              JSON.stringify({ actionId, attempts: maxAttempts })
            ]
          );

          // Clear retry tracking
          this.retryAttempts.delete(actionId);

          return {
            success: false,
            attempts: attempts.length,
            error: error.message,
            attempts
          };
        }

        // Wait before retrying (exponential backoff) if not last attempt
        if (attempt < maxAttempts - 1) {
          const delay = this.calculateBackoff(attempt, baseDelay, maxDelay);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      attempts: attempts.length,
      error: lastError?.message || 'Unknown error',
      attempts
    };
  }

  /**
   * Get retry status for an action
   * @param {string} actionId - Action ID
   * @returns {Promise<Object>} - Retry status and history
   */
  async getRetryStatus(actionId) {
    const result = await pool.query(
      `SELECT * FROM mcp_action_retries 
       WHERE action_id = $1 
       ORDER BY attempt_number DESC`,
      [actionId]
    );

    return {
      actionId,
      attempts: result.rows,
      totalAttempts: result.rows.length,
      lastAttempt: result.rows[0] || null
    };
  }
}

module.exports = ActionPrimitive;

