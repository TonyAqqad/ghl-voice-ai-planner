/**
 * Memory API Routes - Context7 Integration
 * 
 * Purpose: Server-side proxy for Context7 Memory API
 * Keeps API keys secure on server side
 */

const express = require('express');
const { selectProvider } = require('../providers/llm-utils');
const { logMemoryOperation, logContext7Call, logCacheOperation } = require('../lib/telemetry');
const memoryCache = require('../lib/memoryCache');
const metrics = require('../lib/metrics');

const router = express.Router();

/**
 * Health check for memory API
 */
router.get('/health', async (req, res) => {
  try {
    const useContext7 = process.env.ENABLE_CONTEXT7_MEMORY === 'true';
    
    if (!useContext7) {
      return res.json({
        available: false,
        reason: 'Context7 memory not enabled',
      });
    }

    const { provider } = selectProvider('context7');
    
    // Simple health check - if provider initialized, we're good
    const available = !!provider && !!process.env.CONTEXT7_API_KEY;
    
    res.json({
      available,
      provider: 'context7',
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      error: error.message,
    });
  }
});

/**
 * Get snippets from Context7 memory
 * POST /api/memory/snippets with { scopeId, limit }
 */
router.post('/snippets', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { scopeId, limit = 5 } = req.body;
    
    if (!scopeId) {
      return res.status(400).json({ error: 'scopeId required' });
    }

    // Check if Context7 memory is enabled
    const useContext7 = process.env.ENABLE_CONTEXT7_MEMORY === 'true';
    
    if (!useContext7) {
      logMemoryOperation('retrieve', {
        scopeId,
        source: 'disabled',
        success: true,
        latencyMs: Date.now() - startTime,
        metadata: { limit, reason: 'ENABLE_CONTEXT7_MEMORY not set' },
      });
      
      // Return empty array - client will fallback to localStorage
      return res.json({ snippets: [], source: 'disabled' });
    }

    // Check cache first
    const cacheKey = `snippets:${scopeId}:${limit}`;
    const cached = memoryCache.get(cacheKey);
    
    if (cached) {
      logCacheOperation('hit', { 
        key: cacheKey, 
        hit: true,
        ttlMs: memoryCache.ttlMs,
      });
      
      metrics.recordCacheHit();
      
      logMemoryOperation('retrieve', {
        scopeId,
        source: 'cache',
        success: true,
        latencyMs: Date.now() - startTime,
        metadata: { limit, count: cached.count },
      });
      
      return res.json({
        ...cached,
        source: 'cache',
      });
    }
    
    logCacheOperation('miss', { 
      key: cacheKey, 
      hit: false 
    });
    
    metrics.recordCacheMiss();

    const { provider } = selectProvider('context7');
    
    // Call Context7 memory API to retrieve snippets
    const result = await provider.callMemory('retrieve', {
      scopeId,
      limit,
      type: 'snippets',
    });
    
    // Transform Context7 format to our format
    const snippets = (result.items || []).map((item) => ({
      originalQuestion: item.trigger || item.question || '',
      correctedResponse: item.content || item.response || '',
      appliedAt: item.timestamp || Date.now(),
    }));
    
    // Cache the result
    const responseData = {
      snippets,
      count: snippets.length,
    };
    memoryCache.set(cacheKey, responseData);
    
    const latencyMs = Date.now() - startTime;
    
    metrics.recordContext7Request(true, latencyMs, 'retrieve');
    
    logMemoryOperation('retrieve', {
      scopeId,
      source: 'context7',
      success: true,
      latencyMs,
      metadata: { limit, count: snippets.length, cached: true },
    });
    
    res.json({
      ...responseData,
      source: 'context7',
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    metrics.recordContext7Request(false, latencyMs, 'retrieve');
    metrics.recordFallback();
    
    logMemoryOperation('retrieve', {
      scopeId: req.body.scopeId,
      source: 'context7',
      success: false,
      latencyMs,
      error,
      metadata: { limit: req.body.limit },
    });
    
    // Return 503 with empty array - client will fallback to localStorage
    res.status(503).json({
      snippets: [],
      source: 'error',
      error: error.message,
      fallback: 'localStorage',
    });
  }
});

/**
 * Save snippet to Context7 memory
 * PUT /api/memory/snippets with { scopeId, snippet }
 */
router.put('/snippets', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { scopeId, snippet } = req.body;
    
    if (!scopeId || !snippet) {
      return res.status(400).json({ error: 'scopeId and snippet required' });
    }

    // Check if Context7 memory is enabled
    const useContext7 = process.env.ENABLE_CONTEXT7_MEMORY === 'true';
    
    if (!useContext7) {
      logMemoryOperation('store', {
        scopeId,
        source: 'disabled',
        success: true,
        latencyMs: Date.now() - startTime,
        metadata: { snippetId: snippet.id, reason: 'ENABLE_CONTEXT7_MEMORY not set' },
      });
      
      // Success but not saved - client already saved to localStorage
      return res.json({ success: true, source: 'disabled' });
    }

    const { provider } = selectProvider('context7');
    
    // Check for duplicates if contentHash is provided
    if (snippet.contentHash) {
      try {
        const existing = await provider.callMemory('retrieve', {
          scopeId,
          contentHash: snippet.contentHash,
          limit: 1,
        });
        
        if (existing?.items?.length > 0) {
          logMemoryOperation('store', {
            scopeId,
            source: 'context7',
            success: true,
            latencyMs: Date.now() - startTime,
            metadata: { 
              snippetId: snippet.id, 
              deduped: true,
              reason: 'Snippet with same content hash already exists',
            },
          });
          
          return res.json({ 
            success: true, 
            source: 'context7', 
            deduped: true,
            snippetId: snippet.id,
          });
        }
      } catch (dedupError) {
        // If dedup check fails, continue with save (best effort deduplication)
        console.warn('Deduplication check failed, proceeding with save:', dedupError.message);
      }
    }
    
    // Transform our format to Context7 format
    const memoryItem = {
      id: snippet.id,
      scopeId,
      type: 'snippet',
      trigger: snippet.trigger,
      content: snippet.content,
      timestamp: snippet.appliedAt,
      metadata: {
        source: snippet.source,
        charLength: snippet.charLength,
        contentHash: snippet.contentHash,
      },
    };
    
    // Call Context7 memory API to store snippet
    await provider.callMemory('store', memoryItem);
    
    const latencyMs = Date.now() - startTime;
    
    metrics.recordContext7Request(true, latencyMs, 'store');
    
    logMemoryOperation('store', {
      scopeId,
      source: 'context7',
      success: true,
      latencyMs,
      metadata: { snippetId: snippet.id, charLength: snippet.charLength },
    });
    
    // Invalidate cache for this scope (new snippet added)
    const invalidated = memoryCache.invalidatePattern(`snippets:${scopeId}:`);
    if (invalidated > 0) {
      logCacheOperation('invalidate', { 
        key: `snippets:${scopeId}:*`, 
        hit: false,
        metadata: { invalidatedCount: invalidated },
      });
    }
    
    res.json({
      success: true,
      source: 'context7',
      snippetId: snippet.id,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    metrics.recordContext7Request(false, latencyMs, 'store');
    metrics.recordFallback();
    
    logMemoryOperation('store', {
      scopeId: req.body.scopeId,
      source: 'context7',
      success: false,
      latencyMs,
      error,
      metadata: { snippetId: req.body.snippet?.id },
    });
    
    // Return 202 (Accepted) - localStorage save succeeded, Context7 failed
    res.status(202).json({
      success: true,
      source: 'localStorage',
      warning: 'Context7 save failed, localStorage only',
      error: error.message,
    });
  }
});

/**
 * Sync localStorage snippets to Context7
 * POST /api/memory/sync with { scopeId, snippets[] }
 * 
 * Useful for backfilling Context7 with existing localStorage data
 */
router.post('/sync', async (req, res) => {
  try {
    const { scopeId, snippets } = req.body;
    
    if (!scopeId || !Array.isArray(snippets)) {
      return res.status(400).json({ error: 'scopeId and snippets array required' });
    }

    const useContext7 = process.env.ENABLE_CONTEXT7_MEMORY === 'true';
    
    if (!useContext7) {
      return res.json({
        synced: 0,
        source: 'disabled',
      });
    }

    const { provider } = selectProvider('context7');
    
    let synced = 0;
    const errors = [];
    
    for (const snippet of snippets) {
      try {
        const memoryItem = {
          id: snippet.id || `sync-${Date.now()}-${synced}`,
          scopeId,
          type: 'snippet',
          trigger: snippet.originalQuestion || snippet.trigger,
          content: snippet.correctedResponse || snippet.content,
          timestamp: snippet.appliedAt,
          metadata: {
            source: snippet.source || 'voice-agent',
            synced: true,
          },
        };
        
        await provider.callMemory('store', memoryItem);
        synced++;
      } catch (error) {
        errors.push({
          snippet: snippet.id,
          error: error.message,
        });
      }
    }
    
    res.json({
      synced,
      total: snippets.length,
      errors: errors.length > 0 ? errors : undefined,
      source: 'context7',
    });
  } catch (error) {
    console.error('Context7 sync error:', error);
    res.status(500).json({
      error: error.message,
      synced: 0,
    });
  }
});

module.exports = router;

