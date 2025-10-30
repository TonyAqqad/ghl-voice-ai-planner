/**
 * GHL Request Queue with Rate Limiting and Retry Logic
 * Prevents 429 rate limit errors by controlling request flow
 */

class GHLRequestQueue {
  constructor(options = {}) {
    this.queue = [];
    this.processing = false;
    this.requestsPerSecond = parseFloat(process.env.GHL_REQUESTS_PER_SECOND) || options.requestsPerSecond || 2;
    this.maxRetries = parseInt(process.env.GHL_MAX_RETRIES) || options.maxRetries || 3;
    this.retryDelay = parseInt(process.env.GHL_RETRY_DELAY) || options.retryDelay || 5000;
    
    // Metrics for monitoring
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      lastRequestTime: null,
      averageWaitTime: 0,
      queueHighWaterMark: 0
    };
    
    console.log(`🛡️  GHL Request Queue initialized:`);
    console.log(`   Rate: ${this.requestsPerSecond} req/sec`);
    console.log(`   Max retries: ${this.maxRetries}`);
    console.log(`   Retry delay: ${this.retryDelay}ms`);
  }

  /**
   * Add a request to the queue
   * @param {Function} requestFn - Function that returns a Promise (the actual axios call)
   * @param {number} priority - Higher priority = processed first (default: 0)
   * @returns {Promise} - Resolves with the request result
   */
  async add(requestFn, priority = 0) {
    return new Promise((resolve, reject) => {
      const queueItem = {
        requestFn,
        priority,
        resolve,
        reject,
        retries: 0,
        addedAt: Date.now()
      };
      
      this.queue.push(queueItem);
      
      // Update high water mark
      if (this.queue.length > this.metrics.queueHighWaterMark) {
        this.metrics.queueHighWaterMark = this.queue.length;
      }
      
      // Sort by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority);
      
      // Start processing
      this.processQueue();
    });
  }

  async processQueue() {
    // Don't start multiple processors
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        // Rate limiting: enforce minimum delay between requests
        const now = Date.now();
        if (this.metrics.lastRequestTime) {
          const timeSinceLastRequest = now - this.metrics.lastRequestTime;
          const minDelay = 1000 / this.requestsPerSecond;
          
          if (timeSinceLastRequest < minDelay) {
            const waitTime = minDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
        
        // Execute the request
        this.metrics.totalRequests++;
        this.metrics.lastRequestTime = Date.now();
        
        const result = await item.requestFn();
        
        // Calculate wait time
        const waitTime = Date.now() - item.addedAt;
        this.metrics.averageWaitTime = 
          (this.metrics.averageWaitTime * (this.metrics.successfulRequests) + waitTime) / 
          (this.metrics.successfulRequests + 1);
        
        this.metrics.successfulRequests++;
        item.resolve(result);
        
      } catch (error) {
        // Handle 429 rate limit errors with exponential backoff
        if (error.response?.status === 429) {
          this.metrics.rateLimitHits++;
          
          if (item.retries < this.maxRetries) {
            item.retries++;
            
            // Exponential backoff: 5s, 10s, 20s
            const backoffDelay = this.retryDelay * Math.pow(2, item.retries - 1);
            
            console.warn(`⚠️  Rate limit hit (429). Retrying in ${backoffDelay}ms (attempt ${item.retries}/${this.maxRetries})...`);
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            
            // Re-add to front of queue
            this.queue.unshift(item);
            continue;
          } else {
            console.error(`❌ Rate limit exceeded after ${this.maxRetries} retries`);
          }
        }
        
        this.metrics.failedRequests++;
        item.reject(error);
      }
    }
    
    this.processing = false;
  }
  
  /**
   * Get current metrics and status
   */
  getMetrics() {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.metrics,
      queueLength: this.queue.length,
      processing: this.processing,
      successRate: `${successRate}%`,
      averageWaitTime: `${Math.round(this.metrics.averageWaitTime)}ms`,
      configuration: {
        requestsPerSecond: this.requestsPerSecond,
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay
      }
    };
  }
  
  /**
   * Clear the queue (for emergency stop)
   */
  clear() {
    const clearedCount = this.queue.length;
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    console.log(`🧹 Cleared ${clearedCount} pending requests from queue`);
    return clearedCount;
  }
  
  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      lastRequestTime: null,
      averageWaitTime: 0,
      queueHighWaterMark: 0
    };
    console.log('📊 Metrics reset');
  }
}

// Singleton instance
const ghlQueue = new GHLRequestQueue();

module.exports = ghlQueue;

