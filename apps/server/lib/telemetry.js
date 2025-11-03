/**
 * Telemetry Module - Structured Logging
 * 
 * Purpose: Structured logging for memory operations and debugging
 */

/**
 * Log a memory operation with structured data
 * @param {string} operation - Operation name (e.g., 'retrieve', 'store', 'sync')
 * @param {Object} details - Operation details
 * @param {string} details.scopeId - Scope identifier
 * @param {string} details.source - Memory source (localStorage, context7, hybrid, cache)
 * @param {boolean} details.success - Whether operation succeeded
 * @param {number} [details.latencyMs] - Operation latency in milliseconds
 * @param {Error} [details.error] - Error object if operation failed
 * @param {Object} [details.metadata] - Additional metadata
 */
function logMemoryOperation(operation, details) {
  const {
    scopeId,
    source,
    success,
    latencyMs,
    error,
    metadata = {},
  } = details;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'memory-adapter',
    operation,
    scopeId: scopeId ? scopeId.substring(0, 50) : 'unknown', // Truncate long scopes
    source,
    success,
    latencyMs: latencyMs ? Math.round(latencyMs) : undefined,
    error: error?.message,
    errorStack: error?.stack ? error.stack.split('\n').slice(0, 3).join('\n') : undefined,
    ...metadata,
  };
  
  // Remove undefined fields for cleaner logs
  Object.keys(logEntry).forEach(key => {
    if (logEntry[key] === undefined) {
      delete logEntry[key];
    }
  });
  
  if (success) {
    console.log('[MEMORY]', JSON.stringify(logEntry));
  } else {
    console.error('[MEMORY_ERROR]', JSON.stringify(logEntry));
  }
  
  return logEntry;
}

/**
 * Log Context7 API call
 */
function logContext7Call(endpoint, { success, latencyMs, error, scopeId }) {
  return logMemoryOperation('context7-api', {
    scopeId,
    source: 'context7',
    success,
    latencyMs,
    error,
    metadata: { endpoint },
  });
}

/**
 * Log cache operation
 */
function logCacheOperation(action, { key, hit, ttlMs }) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'memory-cache',
    action,
    key: key ? key.substring(0, 50) : undefined,
    hit,
    ttlMs,
  };
  
  console.log('[CACHE]', JSON.stringify(logEntry));
  return logEntry;
}

/**
 * Log sync operation
 */
function logSyncOperation(details) {
  const {
    scopeId,
    synced,
    total,
    errors,
    duration Ms,
  } = details;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'context7-sync',
    scopeId: scopeId ? scopeId.substring(0, 50) : 'all',
    synced,
    total,
    errors,
    durationMs,
    successRate: total > 0 ? ((synced / total) * 100).toFixed(1) + '%' : '0%',
  };
  
  if (errors > 0) {
    console.warn('[SYNC_WARNING]', JSON.stringify(logEntry));
  } else {
    console.log('[SYNC]', JSON.stringify(logEntry));
  }
  
  return logEntry;
}

/**
 * Log diagnostic information
 */
function logDiagnostic(level, message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: 'memory-adapter',
    level,
    message,
    ...metadata,
  };
  
  switch (level) {
    case 'error':
      console.error('[DIAGNOSTIC_ERROR]', JSON.stringify(logEntry));
      break;
    case 'warning':
      console.warn('[DIAGNOSTIC_WARNING]', JSON.stringify(logEntry));
      break;
    case 'info':
    default:
      console.log('[DIAGNOSTIC_INFO]', JSON.stringify(logEntry));
  }
  
  return logEntry;
}

module.exports = {
  logMemoryOperation,
  logContext7Call,
  logCacheOperation,
  logSyncOperation,
  logDiagnostic,
};

