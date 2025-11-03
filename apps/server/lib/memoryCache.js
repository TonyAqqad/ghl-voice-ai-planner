/**
 * Memory Cache - TTL-based in-memory cache
 * 
 * Purpose: Cache Context7 API responses to reduce redundant calls
 * during single sandbox runs or frequent operations
 */

class MemoryCache {
  constructor(ttlMs = 5 * 60 * 1000) { // 5 min default
    this.cache = new Map();
    this.ttlMs = ttlMs;
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }
  
  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    
    entry.hits++;
    return entry.value;
  }
  
  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key, value) {
    this.cache.set(key, { 
      value, 
      timestamp: Date.now(),
      hits: 0,
    });
  }
  
  /**
   * Invalidate (delete) a specific cache entry
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key) {
    this.cache.delete(key);
  }
  
  /**
   * Invalidate all cache entries matching a pattern
   * @param {string} pattern - Pattern to match (simple string contains)
   */
  invalidatePattern(pattern) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }
  
  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }
  
  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[CACHE] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    let totalHits = 0;
    const now = Date.now();
    let expired = 0;
    
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      if (now - entry.timestamp > this.ttlMs) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      expired,
      totalHits,
      ttlMs: this.ttlMs,
    };
  }
  
  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export singleton instance
const instance = new MemoryCache();

// Graceful shutdown
process.on('SIGINT', () => {
  instance.destroy();
});

process.on('SIGTERM', () => {
  instance.destroy();
});

module.exports = instance;

