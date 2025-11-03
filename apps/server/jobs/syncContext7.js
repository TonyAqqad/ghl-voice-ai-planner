/**
 * Context7 Backfill & Sync Job
 * 
 * Purpose: Nightly job to sync localStorage/database snippets to Context7
 * Ensures Context7 has up-to-date data without impacting runtime performance
 */

const cron = require('node-cron');
const MemoryAdapterServer = require('../lib/memoryAdapterServer');
const { logSyncOperation } = require('../lib/telemetry');

/**
 * Sync all scopes from database to Context7
 * @returns {Promise<{synced: number, errors: number, duration: number}>}
 */
async function syncAllScopes() {
  const startTime = Date.now();
  
  console.log('[SYNC] Starting Context7 backfill...');
  console.log(`[SYNC] Time: ${new Date().toISOString()}`);
  
  const memoryAdapter = new MemoryAdapterServer();
  
  try {
    // Check if Context7 is enabled
    if (!process.env.ENABLE_CONTEXT7_MEMORY || process.env.ENABLE_CONTEXT7_MEMORY !== 'true') {
      console.log('[SYNC] Context7 is disabled, skipping sync');
      return { synced: 0, errors: 0, duration: 0, skipped: true };
    }
    
    if (!process.env.CONTEXT7_API_KEY) {
      console.warn('[SYNC] Context7 API key not found, skipping sync');
      return { synced: 0, errors: 0, duration: 0, skipped: true };
    }
    
    // Fetch all unique scopeIds from database
    const scopes = await memoryAdapter.fetchAllScopes();
    console.log(`[SYNC] Found ${scopes.length} scopes to sync`);
    
    if (scopes.length === 0) {
      console.log('[SYNC] No scopes found, nothing to sync');
      return { synced: 0, errors: 0, duration: Date.now() - startTime };
    }
    
    let synced = 0;
    let errors = 0;
    const errorDetails = [];
    
    for (const scopeId of scopes) {
      try {
        // Fetch snippets from database for this scope
        const dbSnippets = await memoryAdapter.fetchFromDatabase(scopeId, 100);
        
        if (dbSnippets.length === 0) {
          continue;
        }
        
        console.log(`[SYNC] Syncing ${dbSnippets.length} snippets for ${scopeId}`);
        
        // Sync each snippet to Context7
        for (const snippet of dbSnippets) {
          try {
            await memoryAdapter.saveSnippet(snippet);
            synced++;
          } catch (snippetError) {
            console.error(`[SYNC] Failed to sync snippet ${snippet.id}:`, snippetError.message);
            errors++;
            errorDetails.push({
              scopeId,
              snippetId: snippet.id,
              error: snippetError.message,
            });
          }
        }
        
        // Small delay between scopes to avoid rate limits
        if (scopes.indexOf(scopeId) < scopes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (scopeError) {
        console.error(`[SYNC] Failed for ${scopeId}:`, scopeError);
        errors++;
        errorDetails.push({
          scopeId,
          error: scopeError.message,
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    logSyncOperation({
      scopeId: 'all',
      synced,
      total: synced + errors,
      errors,
      durationMs: duration,
    });
    
    console.log(`[SYNC] Complete: ${synced} synced, ${errors} errors in ${duration}ms`);
    
    if (errorDetails.length > 0 && errorDetails.length <= 10) {
      console.log(`[SYNC] Error details:`, JSON.stringify(errorDetails, null, 2));
    } else if (errorDetails.length > 10) {
      console.log(`[SYNC] ${errorDetails.length} errors occurred (too many to log)`);
    }
    
    return {
      synced,
      errors,
      duration,
      scopes: scopes.length,
      errorDetails: errorDetails.slice(0, 5), // Keep only first 5 for logging
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[SYNC] Fatal sync error:', error);
    
    logSyncOperation({
      scopeId: 'all',
      synced: 0,
      total: 0,
      errors: 1,
      durationMs: duration,
    });
    
    return {
      synced: 0,
      errors: 1,
      duration,
      fatalError: error.message,
    };
  }
}

/**
 * Sync a specific scope (for manual/on-demand sync)
 * @param {string} scopeId - Scope to sync
 * @returns {Promise<{synced: number, errors: number}>}
 */
async function syncScope(scopeId) {
  const startTime = Date.now();
  
  console.log(`[SYNC] Syncing specific scope: ${scopeId}`);
  
  const memoryAdapter = new MemoryAdapterServer();
  
  try {
    const dbSnippets = await memoryAdapter.fetchFromDatabase(scopeId, 100);
    
    let synced = 0;
    let errors = 0;
    
    for (const snippet of dbSnippets) {
      try {
        await memoryAdapter.saveSnippet(snippet);
        synced++;
      } catch (error) {
        console.error(`[SYNC] Failed to sync snippet:`, error);
        errors++;
      }
    }
    
    const duration = Date.now() - startTime;
    
    logSyncOperation({
      scopeId,
      synced,
      total: dbSnippets.length,
      errors,
      durationMs: duration,
    });
    
    console.log(`[SYNC] Scope ${scopeId}: ${synced} synced, ${errors} errors`);
    
    return { synced, errors, duration };
  } catch (error) {
    console.error(`[SYNC] Failed to sync scope ${scopeId}:`, error);
    return { synced: 0, errors: 1, duration: Date.now() - startTime, error: error.message };
  }
}

// Schedule nightly sync at 2am (if enabled)
if (process.env.ENABLE_CONTEXT7_MEMORY === 'true' && process.env.CONTEXT7_API_KEY) {
  // Cron format: minute hour day month dayOfWeek
  // '0 2 * * *' = every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[SYNC] Scheduled sync job triggered');
    
    try {
      await syncAllScopes();
    } catch (error) {
      console.error('[SYNC] Scheduled job failed:', error);
    }
  });
  
  console.log('✅ Context7 sync job scheduled (daily at 2:00 AM)');
} else {
  console.log('ℹ️  Context7 sync job not scheduled (Context7 disabled or no API key)');
}

module.exports = {
  syncAllScopes,
  syncScope,
};

