/**
 * Self-Healing Primitives - Feedback Loop
 * agent.feedbackLoop - Collect end-user/agent feedback (success, error, correction)
 */

const { pool } = require('../../database');

class FeedbackLoopPrimitive {
  constructor() {
    this.feedbackTypes = ['success', 'error', 'correction', 'improvement', 'general'];
  }

  /**
   * agent.feedbackLoop - Collect and process feedback
   * @param {Object} params - { agentId, type, feedback, context, rating }
   * @returns {Promise<Object>} - { feedbackId, processed, insights }
   */
  async feedbackLoop(params) {
    const {
      agentId,
      type = 'general',
      feedback,
      context = {},
      rating = null,
      userId = null,
      sessionId = null
    } = params;

    try {
      if (!this.feedbackTypes.includes(type)) {
        throw new Error(`Invalid feedback type. Must be one of: ${this.feedbackTypes.join(', ')}`);
      }

      // Store feedback in database
      const result = await pool.query(
        `INSERT INTO mcp_feedback 
         (agent_id, user_id, session_id, feedback_type, feedback_text, rating, context_data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [
          agentId,
          userId,
          sessionId,
          type,
          feedback,
          rating,
          JSON.stringify(context)
        ]
      );

      const feedbackId = result.rows[0].id;

      // Process feedback for insights
      const insights = await this.processFeedback({
        agentId,
        type,
        feedback,
        rating,
        context
      });

      // If correction or improvement, flag for prompt/config update
      if (type === 'correction' || type === 'improvement') {
        await pool.query(
          `INSERT INTO agent_logs (agent_id, action, payload, context, status, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            agentId,
            'agent.feedbackLoop',
            JSON.stringify({ feedbackId, type, insights }),
            JSON.stringify(context),
            'needs_review'
          ]
        );
      }

      return {
        feedbackId,
        processed: true,
        insights,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('agent.feedbackLoop error:', error);
      throw error;
    }
  }

  /**
   * Process feedback to extract insights
   */
  async processFeedback(params) {
    const { agentId, type, feedback, rating, context } = params;

    const insights = {
      sentiment: 'neutral',
      actionable: false,
      priority: 'low'
    };

    // Simple sentiment analysis (can be enhanced with AI)
    const positiveWords = ['good', 'great', 'excellent', 'helpful', 'perfect', 'thanks', 'thank you'];
    const negativeWords = ['bad', 'wrong', 'error', 'failed', 'broken', 'issue', 'problem'];

    const lowerFeedback = feedback.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerFeedback.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerFeedback.includes(w)).length;

    if (positiveCount > negativeCount) {
      insights.sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      insights.sentiment = 'negative';
      insights.priority = 'high';
    }

    // Check if feedback is actionable
    if (type === 'correction' || type === 'improvement') {
      insights.actionable = true;
      insights.priority = 'high';
    }

    // Rating-based insights
    if (rating !== null) {
      if (rating >= 4) {
        insights.sentiment = 'positive';
      } else if (rating <= 2) {
        insights.sentiment = 'negative';
        insights.priority = 'high';
        insights.actionable = true;
      }
    }

    return insights;
  }

  /**
   * Get feedback summary for agent
   * @param {string} agentId - Agent ID
   * @param {Object} options - { timeWindow, type }
   * @returns {Promise<Object>} - Feedback summary
   */
  async getFeedbackSummary(agentId, options = {}) {
    const { timeWindow = 7 * 24 * 60 * 60 * 1000, type = null } = options; // Default 7 days
    const cutoffTime = new Date(Date.now() - timeWindow);

    let query = `
      SELECT 
        feedback_type,
        COUNT(*) as count,
        AVG(rating) as avg_rating,
        COUNT(*) FILTER (WHERE rating IS NOT NULL) as rated_count
      FROM mcp_feedback
      WHERE agent_id = $1 
      AND created_at > $2
    `;
    const params = [agentId, cutoffTime];

    if (type) {
      query += ' AND feedback_type = $3';
      params.push(type);
    }

    query += ' GROUP BY feedback_type';

    const result = await pool.query(query, params);

    return {
      agentId,
      summary: result.rows,
      timeWindow: timeWindow / 1000 / 60 / 60 / 24, // days
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = FeedbackLoopPrimitive;

