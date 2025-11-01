/**
 * Costing Service
 * Tracks and calculates costs for Voice AI operations
 */

class CostingService {
  constructor() {
    this.costLedger = [];
    this.costRates = {
      // ElevenLabs pricing (per character)
      elevenlabs: {
        'eleven_monolingual_v1': 0.0003,
        'eleven_multilingual_v1': 0.0003,
        'eleven_multilingual_v2': 0.0003
      },
      // OpenAI pricing (per token)
      openai: {
        'gpt-5-mini': { input: 0.00000025, output: 0.000002 },
        'gpt-4o-mini': { input: 0.0000025, output: 0.00001 },
        'gpt-4': { input: 0.00003, output: 0.00006 },
        'gpt-3.5-turbo': { input: 0.0000015, output: 0.000002 }
      },
      // GHL Voice AI pricing (per minute)
      ghl: {
        voice_ai: 0.15, // $0.15 per minute
        phone: 0.02 // $0.02 per minute for phone calls
      }
    };
  }

  /**
   * Calculate voice synthesis cost
   */
  calculateVoiceCost(text, voiceProvider, voiceModel) {
    const characterCount = text.length;
    const rate = this.costRates[voiceProvider]?.[voiceModel] || 0.0003;
    return characterCount * rate;
  }

  /**
   * Calculate LLM cost
   */
  calculateLLMCost(inputTokens, outputTokens, model) {
    const rates = this.costRates.openai[model] || this.costRates.openai['gpt-5-mini'];
    return (inputTokens * rates.input) + (outputTokens * rates.output);
  }

  /**
   * Calculate call cost
   */
  calculateCallCost(durationMinutes, agentId) {
    const voiceCost = durationMinutes * this.costRates.ghl.voice_ai;
    const phoneCost = durationMinutes * this.costRates.ghl.phone;
    return voiceCost + phoneCost;
  }

  /**
   * Record cost transaction
   */
  recordCost(transaction) {
    const costEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      agentId: transaction.agentId,
      callId: transaction.callId,
      type: transaction.type, // 'voice', 'llm', 'call', 'custom_action'
      provider: transaction.provider,
      model: transaction.model,
      usage: transaction.usage, // characters, tokens, minutes
      rate: transaction.rate,
      cost: transaction.cost,
      metadata: transaction.metadata || {}
    };

    this.costLedger.push(costEntry);
    return costEntry;
  }

  /**
   * Get costs for agent
   */
  getAgentCosts(agentId, startDate, endDate) {
    return this.costLedger.filter(entry => {
      if (entry.agentId !== agentId) return false;
      if (startDate && entry.timestamp < startDate) return false;
      if (endDate && entry.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Get total costs for agent
   */
  getAgentTotalCost(agentId, startDate, endDate) {
    const costs = this.getAgentCosts(agentId, startDate, endDate);
    return costs.reduce((total, entry) => total + entry.cost, 0);
  }

  /**
   * Get costs by type
   */
  getCostsByType(type, startDate, endDate) {
    return this.costLedger.filter(entry => {
      if (entry.type !== type) return false;
      if (startDate && entry.timestamp < startDate) return false;
      if (endDate && entry.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Get daily cost breakdown
   */
  getDailyCostBreakdown(agentId, days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const costs = this.getAgentCosts(agentId, startDate, endDate);
    const dailyBreakdown = {};

    costs.forEach(entry => {
      const date = entry.timestamp.toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          date,
          total: 0,
          voice: 0,
          llm: 0,
          call: 0,
          custom_action: 0
        };
      }
      
      dailyBreakdown[date].total += entry.cost;
      dailyBreakdown[date][entry.type] += entry.cost;
    });

    return Object.values(dailyBreakdown).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Get cost analytics
   */
  getCostAnalytics(agentId, startDate, endDate) {
    const costs = this.getAgentCosts(agentId, startDate, endDate);
    
    const analytics = {
      totalCost: costs.reduce((sum, entry) => sum + entry.cost, 0),
      totalCalls: costs.filter(entry => entry.type === 'call').length,
      totalDuration: costs
        .filter(entry => entry.type === 'call')
        .reduce((sum, entry) => sum + (entry.usage || 0), 0),
      averageCallCost: 0,
      costByType: {},
      costByProvider: {},
      costTrend: this.getDailyCostBreakdown(agentId, 30)
    };

    // Calculate average call cost
    const callCosts = costs.filter(entry => entry.type === 'call');
    if (callCosts.length > 0) {
      analytics.averageCallCost = callCosts.reduce((sum, entry) => sum + entry.cost, 0) / callCosts.length;
    }

    // Cost by type
    costs.forEach(entry => {
      if (!analytics.costByType[entry.type]) {
        analytics.costByType[entry.type] = 0;
      }
      analytics.costByType[entry.type] += entry.cost;
    });

    // Cost by provider
    costs.forEach(entry => {
      if (!analytics.costByProvider[entry.provider]) {
        analytics.costByProvider[entry.provider] = 0;
      }
      analytics.costByProvider[entry.provider] += entry.cost;
    });

    return analytics;
  }

  /**
   * Estimate monthly cost
   */
  estimateMonthlyCost(agentId, projectedCalls, averageCallDuration) {
    const dailyCosts = this.getDailyCostBreakdown(agentId, 30);
    const averageDailyCost = dailyCosts.length > 0 
      ? dailyCosts.reduce((sum, day) => sum + day.total, 0) / dailyCosts.length
      : 0;

    const projectedDailyCalls = projectedCalls / 30;
    const currentDailyCalls = dailyCosts.length > 0 
      ? dailyCosts.reduce((sum, day) => sum + day.call, 0) / dailyCosts.length
      : 0;

    const costPerCall = currentDailyCalls > 0 ? averageDailyCost / currentDailyCalls : 0;
    const estimatedMonthlyCost = projectedDailyCalls * costPerCall * 30;

    return {
      currentAverageDailyCost: averageDailyCost,
      currentDailyCalls: currentDailyCalls,
      costPerCall: costPerCall,
      projectedMonthlyCalls: projectedCalls,
      estimatedMonthlyCost: estimatedMonthlyCost,
      confidence: dailyCosts.length >= 7 ? 'high' : dailyCosts.length >= 3 ? 'medium' : 'low'
    };
  }

  /**
   * Set cost alerts
   */
  setCostAlert(agentId, threshold, period = 'daily') {
    // In production, implement actual alerting system
    console.log(`🚨 Cost alert set for agent ${agentId}: $${threshold} ${period}`);
  }

  /**
   * Check cost thresholds
   */
  checkCostThresholds(agentId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayCosts = this.getAgentCosts(agentId, startOfDay, today);
    const todayTotal = todayCosts.reduce((sum, entry) => sum + entry.cost, 0);

    // Check if daily threshold exceeded
    if (todayTotal > 10) { // $10 daily threshold
      console.log(`🚨 Daily cost threshold exceeded for agent ${agentId}: $${todayTotal.toFixed(2)}`);
      return { threshold: 'daily', exceeded: true, amount: todayTotal };
    }

    return { threshold: 'daily', exceeded: false, amount: todayTotal };
  }

  /**
   * Generate cost report
   */
  generateCostReport(agentId, startDate, endDate) {
    const analytics = this.getCostAnalytics(agentId, startDate, endDate);
    const dailyBreakdown = this.getDailyCostBreakdown(agentId, 30);
    
    return {
      agentId,
      period: { startDate, endDate },
      summary: {
        totalCost: analytics.totalCost,
        totalCalls: analytics.totalCalls,
        averageCallCost: analytics.averageCallCost,
        totalDuration: analytics.totalDuration
      },
      breakdown: {
        byType: analytics.costByType,
        byProvider: analytics.costByProvider
      },
      dailyTrend: dailyBreakdown,
      recommendations: this.generateCostRecommendations(analytics)
    };
  }

  /**
   * Generate cost optimization recommendations
   */
  generateCostRecommendations(analytics) {
    const recommendations = [];

    if (analytics.averageCallCost > 0.50) {
      recommendations.push({
        type: 'high_call_cost',
        message: 'Average call cost is high. Consider optimizing prompts to reduce call duration.',
        impact: 'high',
        estimatedSavings: analytics.averageCallCost * 0.2
      });
    }

    if (analytics.costByType.llm > analytics.totalCost * 0.4) {
      recommendations.push({
        type: 'high_llm_usage',
        message: 'LLM costs are high. Consider using more efficient models or reducing token usage.',
        impact: 'medium',
        estimatedSavings: analytics.costByType.llm * 0.15
      });
    }

    if (analytics.costByType.voice > analytics.totalCost * 0.6) {
      recommendations.push({
        type: 'high_voice_usage',
        message: 'Voice synthesis costs are high. Consider optimizing voice settings or using cheaper voices.',
        impact: 'medium',
        estimatedSavings: analytics.costByType.voice * 0.1
      });
    }

    return recommendations;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Export cost data
   */
  exportCostData(agentId, startDate, endDate, format = 'json') {
    const costs = this.getAgentCosts(agentId, startDate, endDate);
    
    if (format === 'csv') {
      const headers = ['timestamp', 'type', 'provider', 'model', 'usage', 'rate', 'cost'];
      const csvRows = [headers.join(',')];
      
      costs.forEach(entry => {
        const row = [
          entry.timestamp.toISOString(),
          entry.type,
          entry.provider,
          entry.model || '',
          entry.usage,
          entry.rate,
          entry.cost
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    return costs;
  }
}

module.exports = CostingService;
