/**
 * Circuit Breaker Pattern for GHL API
 * Automatically stops making requests when failures exceed threshold
 * Prevents cascading failures and gives the API time to recover
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = parseInt(process.env.GHL_CIRCUIT_BREAKER_THRESHOLD) || options.failureThreshold || 5;
    this.resetTimeout = parseInt(process.env.GHL_CIRCUIT_BREAKER_TIMEOUT) || options.resetTimeout || 60000; // 60 seconds
    this.monitorWindow = options.monitorWindow || 120000; // 2 minutes
    
    this.state = 'CLOSED'; // CLOSED = normal, OPEN = blocked, HALF_OPEN = testing
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = Date.now();
    this.lastStateChange = Date.now();
    this.recentErrors = []; // Track recent errors for debugging
    
    console.log(`🔌 Circuit Breaker initialized:`);
    console.log(`   Failure threshold: ${this.failureThreshold}`);
    console.log(`   Reset timeout: ${this.resetTimeout}ms`);
    console.log(`   State: ${this.state}`);
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @returns {Promise} - Result of the function
   */
  async execute(fn) {
    // If circuit is OPEN, reject immediately
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        const waitTime = Math.ceil((this.nextAttempt - Date.now()) / 1000);
        throw new Error(
          `Circuit breaker is OPEN - GHL API temporarily disabled. ` +
          `Try again in ${waitTime} seconds. ` +
          `Reason: Too many failures (${this.failures}/${this.failureThreshold})`
        );
      }
      // Time to try again - transition to HALF_OPEN
      this.state = 'HALF_OPEN';
      this.successes = 0;
      console.log('🔄 Circuit breaker transitioning to HALF_OPEN - testing recovery...');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
      
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Record a successful request
   */
  onSuccess() {
    this.successes++;
    
    // In HALF_OPEN state, need multiple successes to fully recover
    if (this.state === 'HALF_OPEN') {
      if (this.successes >= 3) {
        this.state = 'CLOSED';
        this.failures = 0;
        this.successes = 0;
        this.lastStateChange = Date.now();
        console.log('✅ Circuit breaker CLOSED - GHL API fully restored');
      }
    } else if (this.state === 'CLOSED') {
      // Gradually reduce failure count on success
      if (this.failures > 0) {
        this.failures = Math.max(0, this.failures - 1);
      }
    }
  }

  /**
   * Record a failed request
   */
  onFailure(error) {
    this.failures++;
    
    // Store error for debugging (keep last 10)
    this.recentErrors.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      status: error.response?.status,
      code: error.code
    });
    if (this.recentErrors.length > 10) {
      this.recentErrors.shift();
    }
    
    // In HALF_OPEN, any failure immediately reopens the circuit
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      this.lastStateChange = Date.now();
      console.error(
        `🚨 Circuit breaker RE-OPENED - Recovery failed. ` +
        `Will retry in ${this.resetTimeout/1000}s`
      );
    }
    // In CLOSED, open if threshold exceeded
    else if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      this.lastStateChange = Date.now();
      
      console.error(
        `🚨 Circuit breaker OPENED - GHL API disabled for ${this.resetTimeout/1000}s\n` +
        `   Reason: ${this.failures} consecutive failures\n` +
        `   Last error: ${error.message}`
      );
      
      // Log recent errors for debugging
      if (this.recentErrors.length > 0) {
        console.error(`   Recent errors:`);
        this.recentErrors.slice(-3).forEach(err => {
          console.error(`     - [${err.timestamp}] ${err.message} (status: ${err.status || 'N/A'})`);
        });
      }
    }
  }

  /**
   * Get current state and statistics
   */
  getState() {
    const now = Date.now();
    const timeInState = Math.floor((now - this.lastStateChange) / 1000);
    
    let status = {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      failureThreshold: this.failureThreshold,
      timeInCurrentState: `${timeInState}s`,
      healthy: this.state === 'CLOSED'
    };
    
    if (this.state === 'OPEN') {
      const waitTime = Math.ceil((this.nextAttempt - now) / 1000);
      status.nextAttempt = new Date(this.nextAttempt).toISOString();
      status.retryIn = `${waitTime}s`;
      status.message = `Circuit is open. API calls are blocked for ${waitTime} more seconds.`;
    } else if (this.state === 'HALF_OPEN') {
      status.message = 'Circuit is testing recovery. Need 3 successful requests to fully recover.';
    } else {
      status.message = 'Circuit is closed. API calls are flowing normally.';
    }
    
    // Include recent errors if any
    if (this.recentErrors.length > 0) {
      status.recentErrors = this.recentErrors.slice(-5);
    }
    
    return status;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset() {
    const oldState = this.state;
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.recentErrors = [];
    this.lastStateChange = Date.now();
    console.log(`🔄 Circuit breaker manually reset from ${oldState} to CLOSED`);
  }

  /**
   * Manually open the circuit breaker (emergency stop)
   */
  emergencyOpen(reason = 'Manual intervention') {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.resetTimeout;
    this.lastStateChange = Date.now();
    console.error(`🚨 Circuit breaker EMERGENCY OPEN: ${reason}`);
  }
}

// Singleton instance
const ghlCircuitBreaker = new CircuitBreaker();

module.exports = ghlCircuitBreaker;

