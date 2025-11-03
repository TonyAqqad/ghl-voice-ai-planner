/**
 * Metrics Collector
 * 
 * Purpose: Track Context7 memory operations for observability
 * and performance monitoring
 */

class MetricsCollector {
  constructor() {
    this.metrics = {
      context7Requests: 0,
      context7Errors: 0,
      fallbacksToLocalStorage: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgLatency: [],
      requestsByOperation: {}, // retrieve, store, sync
      errorsByType: {}, // network, timeout, api_error, etc.
    };
    
    this.startTime = Date.now();
  }
  
  /**
   * Record a Context7 API request
   * @param {boolean} success - Whether request succeeded
   * @param {number} latencyMs - Request latency in milliseconds
   * @param {string} operation - Operation type (retrieve, store, sync)
   */
  recordContext7Request(success, latencyMs, operation = 'unknown') {
    this.metrics.context7Requests++;
    
    if (!success) {
      this.metrics.context7Errors++;
    }
    
    if (latencyMs !== undefined && latencyMs !== null) {
      this.metrics.avgLatency.push(latencyMs);
      
      // Keep only last 1000 latency measurements
      if (this.metrics.avgLatency.length > 1000) {
        this.metrics.avgLatency.shift();
      }
    }
    
    // Track by operation
    if (!this.metrics.requestsByOperation[operation]) {
      this.metrics.requestsByOperation[operation] = { total: 0, errors: 0 };
    }
    this.metrics.requestsByOperation[operation].total++;
    if (!success) {
      this.metrics.requestsByOperation[operation].errors++;
    }
  }
  
  /**
   * Record a fallback to localStorage
   */
  recordFallback() {
    this.metrics.fallbacksToLocalStorage++;
  }
  
  /**
   * Record a cache hit
   */
  recordCacheHit() {
    this.metrics.cacheHits++;
  }
  
  /**
   * Record a cache miss
   */
  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }
  
  /**
   * Record an error by type
   * @param {string} errorType - Type of error (network, timeout, api_error, etc.)
   */
  recordError(errorType) {
    if (!this.metrics.errorsByType[errorType]) {
      this.metrics.errorsByType[errorType] = 0;
    }
    this.metrics.errorsByType[errorType]++;
  }
  
  /**
   * Get current metrics snapshot
   * @returns {Object} Metrics snapshot
   */
  getSnapshot() {
    const uptime = Date.now() - this.startTime;
    const avgLatency = this.metrics.avgLatency.length > 0
      ? this.metrics.avgLatency.reduce((a, b) => a + b, 0) / this.metrics.avgLatency.length
      : 0;
    
    const errorRate = this.metrics.context7Requests > 0
      ? this.metrics.context7Errors / this.metrics.context7Requests
      : 0;
    
    const fallbackRate = this.metrics.context7Requests > 0
      ? this.metrics.fallbacksToLocalStorage / this.metrics.context7Requests
      : 0;
    
    const totalCacheAttempts = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheAttempts > 0
      ? this.metrics.cacheHits / totalCacheAttempts
      : 0;
    
    return {
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      context7Requests: this.metrics.context7Requests,
      context7Errors: this.metrics.context7Errors,
      fallbacksToLocalStorage: this.metrics.fallbacksToLocalStorage,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      avgLatency: Math.round(avgLatency),
      medianLatency: this.getMedianLatency(),
      p95Latency: this.getPercentileLatency(0.95),
      p99Latency: this.getPercentileLatency(0.99),
      errorRate: errorRate,
      errorRatePercent: (errorRate * 100).toFixed(2) + '%',
      fallbackRate: fallbackRate,
      fallbackRatePercent: (fallbackRate * 100).toFixed(2) + '%',
      cacheHitRate: cacheHitRate,
      cacheHitRatePercent: (cacheHitRate * 100).toFixed(2) + '%',
      requestsByOperation: this.metrics.requestsByOperation,
      errorsByType: this.metrics.errorsByType,
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * Get median latency
   * @private
   */
  getMedianLatency() {
    if (this.metrics.avgLatency.length === 0) return 0;
    
    const sorted = [...this.metrics.avgLatency].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : Math.round(sorted[mid]);
  }
  
  /**
   * Get percentile latency
   * @param {number} percentile - Percentile (0-1)
   * @private
   */
  getPercentileLatency(percentile) {
    if (this.metrics.avgLatency.length === 0) return 0;
    
    const sorted = [...this.metrics.avgLatency].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    
    return Math.round(sorted[Math.max(0, index)]);
  }
  
  /**
   * Format uptime in human-readable format
   * @param {number} ms - Uptime in milliseconds
   * @private
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      context7Requests: 0,
      context7Errors: 0,
      fallbacksToLocalStorage: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgLatency: [],
      requestsByOperation: {},
      errorsByType: {},
    };
    this.startTime = Date.now();
  }
}

// Export singleton instance
module.exports = new MetricsCollector();

