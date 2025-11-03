/**
 * Alert System - Production Monitoring
 * 
 * Purpose: Monitor Context7 memory health and alert on issues
 */

const metrics = require('./metrics');

/**
 * Alert thresholds
 */
const THRESHOLDS = {
  ERROR_RATE: 0.10, // 10%
  FALLBACK_RATE: 0.20, // 20%
  HIGH_LATENCY: 1000, // 1 second
  CRITICAL_ERROR_RATE: 0.25, // 25%
};

/**
 * Alert history (prevent spam)
 */
const alertHistory = new Map();
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if alert should be sent (respects cooldown)
 * @param {string} alertType - Type of alert
 * @returns {boolean} - True if alert should be sent
 */
function shouldAlert(alertType) {
  const lastAlert = alertHistory.get(alertType);
  
  if (!lastAlert) {
    return true;
  }
  
  const timeSinceLastAlert = Date.now() - lastAlert;
  return timeSinceLastAlert > ALERT_COOLDOWN_MS;
}

/**
 * Record that an alert was sent
 * @param {string} alertType - Type of alert
 */
function recordAlert(alertType) {
  alertHistory.set(alertType, Date.now());
}

/**
 * Send alert (currently logs to console, but could integrate with PagerDuty, Slack, etc.)
 * @param {string} level - Alert level (info, warning, error, critical)
 * @param {string} message - Alert message
 * @param {Object} data - Additional data
 */
function sendAlert(level, message, data = {}) {
  const alert = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };
  
  switch (level) {
    case 'critical':
      console.error('[ALERT_CRITICAL]', JSON.stringify(alert));
      // TODO: Integrate with PagerDuty or other alerting service
      break;
    case 'error':
      console.error('[ALERT_ERROR]', JSON.stringify(alert));
      // TODO: Send to Slack/email
      break;
    case 'warning':
      console.warn('[ALERT_WARNING]', JSON.stringify(alert));
      break;
    default:
      console.log('[ALERT_INFO]', JSON.stringify(alert));
  }
}

/**
 * Check memory health and send alerts if needed
 */
function checkMemoryHealth() {
  const snapshot = metrics.getSnapshot();
  
  // Check 1: High error rate
  if (snapshot.errorRate > THRESHOLDS.CRITICAL_ERROR_RATE) {
    if (shouldAlert('critical_error_rate')) {
      sendAlert(
        'critical',
        `Critical error rate: ${snapshot.errorRatePercent}`,
        {
          errorRate: snapshot.errorRate,
          threshold: THRESHOLDS.CRITICAL_ERROR_RATE,
          context7Requests: snapshot.context7Requests,
          context7Errors: snapshot.context7Errors,
        }
      );
      recordAlert('critical_error_rate');
    }
  } else if (snapshot.errorRate > THRESHOLDS.ERROR_RATE) {
    if (shouldAlert('high_error_rate')) {
      sendAlert(
        'error',
        `High error rate: ${snapshot.errorRatePercent}`,
        {
          errorRate: snapshot.errorRate,
          threshold: THRESHOLDS.ERROR_RATE,
          context7Requests: snapshot.context7Requests,
          context7Errors: snapshot.context7Errors,
        }
      );
      recordAlert('high_error_rate');
    }
  }
  
  // Check 2: High fallback rate
  if (snapshot.fallbackRate > THRESHOLDS.FALLBACK_RATE) {
    if (shouldAlert('high_fallback_rate')) {
      sendAlert(
        'warning',
        `High fallback rate: ${snapshot.fallbackRatePercent}`,
        {
          fallbackRate: snapshot.fallbackRate,
          threshold: THRESHOLDS.FALLBACK_RATE,
          fallbacksToLocalStorage: snapshot.fallbacksToLocalStorage,
          context7Requests: snapshot.context7Requests,
        }
      );
      recordAlert('high_fallback_rate');
    }
  }
  
  // Check 3: High latency
  if (snapshot.p95Latency > THRESHOLDS.HIGH_LATENCY) {
    if (shouldAlert('high_latency')) {
      sendAlert(
        'warning',
        `High latency detected: P95 ${snapshot.p95Latency}ms`,
        {
          p95Latency: snapshot.p95Latency,
          avgLatency: snapshot.avgLatency,
          threshold: THRESHOLDS.HIGH_LATENCY,
        }
      );
      recordAlert('high_latency');
    }
  }
  
  // Check 4: Error by type analysis
  if (snapshot.errorsByType && Object.keys(snapshot.errorsByType).length > 0) {
    const totalErrors = Object.values(snapshot.errorsByType).reduce((a, b) => a + b, 0);
    
    for (const [errorType, count] of Object.entries(snapshot.errorsByType)) {
      const errorTypeRate = count / totalErrors;
      
      // If one error type accounts for > 80% of errors, it's a specific issue
      if (errorTypeRate > 0.8 && count > 5) {
        if (shouldAlert(`error_type_${errorType}`)) {
          sendAlert(
            'error',
            `Dominant error type: ${errorType} (${count} occurrences, ${(errorTypeRate * 100).toFixed(1)}%)`,
            {
              errorType,
              count,
              rate: errorTypeRate,
              allErrors: snapshot.errorsByType,
            }
          );
          recordAlert(`error_type_${errorType}`);
        }
      }
    }
  }
  
  // Check 5: No activity (possible configuration issue)
  if (snapshot.uptime > 30 * 60 * 1000 && snapshot.context7Requests === 0) {
    // After 30 minutes, if no Context7 requests, something might be wrong
    if (shouldAlert('no_activity')) {
      sendAlert(
        'warning',
        'No Context7 requests after 30 minutes - is feature disabled or not being used?',
        {
          uptime: snapshot.uptimeFormatted,
          context7Requests: snapshot.context7Requests,
        }
      );
      recordAlert('no_activity');
    }
  }
}

/**
 * Get alert summary for observability
 */
function getAlertSummary() {
  const alerts = [];
  
  for (const [type, timestamp] of alertHistory.entries()) {
    alerts.push({
      type,
      lastTriggered: new Date(timestamp).toISOString(),
      age: Date.now() - timestamp,
    });
  }
  
  return {
    activeAlerts: alerts.filter((a) => a.age < ALERT_COOLDOWN_MS),
    recentAlerts: alerts.filter((a) => a.age < 60 * 60 * 1000), // Last hour
    allAlerts: alerts,
  };
}

// Run health check every 5 minutes
const healthCheckInterval = setInterval(checkMemoryHealth, 5 * 60 * 1000);

// Initial check after 1 minute (allow time for metrics to accumulate)
setTimeout(checkMemoryHealth, 60 * 1000);

// Graceful shutdown
process.on('SIGINT', () => {
  clearInterval(healthCheckInterval);
});

process.on('SIGTERM', () => {
  clearInterval(healthCheckInterval);
});

module.exports = {
  checkMemoryHealth,
  sendAlert,
  getAlertSummary,
  THRESHOLDS,
};

