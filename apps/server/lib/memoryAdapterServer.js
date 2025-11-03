/**
 * Server-Side Memory Adapter
 * 
 * Purpose: Unified memory interface for server-side operations
 * Mirrors client-side MemoryAdapter but uses database instead of localStorage
 * 
 * CRITICAL: All operations must use proper scopeId format
 * scopeId = scope(<locationId>, <agentId>, <promptHash>)
 */

const { selectProvider } = require('../providers/llm-utils');
const { logMemoryOperation } = require('./telemetry');
const { isValidScopeId } = require('./scopeUtils');

class MemoryAdapterServer {
  constructor() {
    this.enabled = process.env.ENABLE_CONTEXT7_MEMORY === 'true';
    this.hasApiKey = !!process.env.CONTEXT7_API_KEY;
  }

  /**
   * Save snippet to both database and Context7 (if enabled)
   * @param {Object} snippet - Snippet to save
   * @param {string} snippet.id - Snippet ID
   * @param {string} snippet.scopeId - Scope identifier (MUST be valid scope:location:agent:hash format)
   * @param {string} snippet.trigger - Trigger phrase
   * @param {string} snippet.content - Snippet content
   * @param {number} snippet.appliedAt - Timestamp
   * @param {string} snippet.source - Source type
   * @param {number} snippet.charLength - Character length
   * @param {string} [snippet.contentHash] - Content hash for deduplication
   */
  async saveSnippet(snippet) {
    const startTime = Date.now();
    
    // CRITICAL: Validate scopeId format
    if (!isValidScopeId(snippet.scopeId)) {
      throw new Error(`Invalid scopeId format: ${snippet.scopeId}. Must be scope:locationId:agentId:promptHash`);
    }
    
    try {
      // Always save to database (server equivalent of localStorage)
      await this.saveToDatabase(snippet);
      
      logMemoryOperation('store-db', {
        scopeId: snippet.scopeId,
        source: 'database',
        success: true,
        latencyMs: Date.now() - startTime,
        metadata: { snippetId: snippet.id },
      });
      
      // Also save to Context7 if enabled
      if (this.enabled && this.hasApiKey) {
        try {
          const { provider } = selectProvider('context7');
          
          // Transform to Context7 format
          const memoryItem = {
            id: snippet.id,
            scopeId: snippet.scopeId,
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
          
          await provider.callMemory('store', memoryItem);
          
          logMemoryOperation('store-context7', {
            scopeId: snippet.scopeId,
            source: 'context7',
            success: true,
            latencyMs: Date.now() - startTime,
            metadata: { snippetId: snippet.id },
          });
          
          return { success: true, source: 'hybrid' };
        } catch (context7Error) {
          console.error('Context7 save failed (database save succeeded):', context7Error);
          
          logMemoryOperation('store-context7', {
            scopeId: snippet.scopeId,
            source: 'context7',
            success: false,
            latencyMs: Date.now() - startTime,
            error: context7Error,
            metadata: { snippetId: snippet.id },
          });
          
          return { success: true, source: 'database', warning: 'Context7 save failed' };
        }
      }
      
      return { success: true, source: 'database' };
    } catch (error) {
      console.error('Database save failed:', error);
      
      logMemoryOperation('store-db', {
        scopeId: snippet.scopeId,
        source: 'database',
        success: false,
        latencyMs: Date.now() - startTime,
        error,
        metadata: { snippetId: snippet.id },
      });
      
      throw error;
    }
  }

  /**
   * Get snippets from Context7 or database
   * @param {string} scopeId - Scope identifier
   * @param {number} limit - Max number of snippets
   * @returns {Promise<{snippets: Array, source: string}>}
   */
  async getSnippets(scopeId, limit = 5) {
    const startTime = Date.now();
    
    if (this.enabled && this.hasApiKey) {
      try {
        const { provider } = selectProvider('context7');
        const result = await provider.callMemory('retrieve', { scopeId, limit, type: 'snippets' });
        
        const snippets = (result.items || []).map((item) => ({
          id: item.id,
          scopeId: item.scopeId,
          trigger: item.trigger || item.question || '',
          content: item.content || item.response || '',
          appliedAt: item.timestamp || Date.now(),
          source: item.metadata?.source || 'unknown',
          charLength: item.metadata?.charLength || 0,
          contentHash: item.metadata?.contentHash,
        }));
        
        logMemoryOperation('retrieve-context7', {
          scopeId,
          source: 'context7',
          success: true,
          latencyMs: Date.now() - startTime,
          metadata: { limit, count: snippets.length },
        });
        
        return { snippets, source: 'context7' };
      } catch (error) {
        console.warn('Context7 fetch failed, using database fallback:', error);
        
        logMemoryOperation('retrieve-context7', {
          scopeId,
          source: 'context7',
          success: false,
          latencyMs: Date.now() - startTime,
          error,
        });
      }
    }
    
    // Fallback to database
    const snippets = await this.fetchFromDatabase(scopeId, limit);
    
    logMemoryOperation('retrieve-db', {
      scopeId,
      source: 'database',
      success: true,
      latencyMs: Date.now() - startTime,
      metadata: { limit, count: snippets.length },
    });
    
    return { snippets, source: 'database' };
  }

  /**
   * Save snippet to database
   * Uses agent_response_corrections table
   * @private
   */
  async saveToDatabase(snippet) {
    // TODO: Implement database save using existing Supabase connection
    // This would insert into agent_response_corrections table
    
    // For now, log that this would save to DB
    console.log('[MemoryAdapterServer] Would save to database:', {
      scopeId: snippet.scopeId,
      snippetId: snippet.id,
      trigger: snippet.trigger.substring(0, 50),
      contentLength: snippet.charLength,
    });
    
    // Placeholder: In production, this would be:
    // const { supabase } = require('./supabase');
    // await supabase.from('agent_response_corrections').insert({
    //   agent_id: extractAgentId(snippet.scopeId),
    //   original_response: snippet.trigger,
    //   corrected_response: snippet.content,
    //   original_hash: snippet.contentHash,
    //   store_in: 'prompt',
    //   reason: 'learned-pattern',
    //   metadata: { scopeId: snippet.scopeId, appliedAt: snippet.appliedAt },
    // });
    
    return true;
  }

  /**
   * Fetch snippets from database
   * @private
   */
  async fetchFromDatabase(scopeId, limit) {
    // TODO: Implement database fetch using existing Supabase connection
    
    console.log('[MemoryAdapterServer] Would fetch from database:', { scopeId, limit });
    
    // Placeholder: In production, this would be:
    // const { supabase } = require('./supabase');
    // const { data } = await supabase
    //   .from('agent_response_corrections')
    //   .select('*')
    //   .eq('metadata->>scopeId', scopeId)
    //   .order('created_at', { ascending: false })
    //   .limit(limit);
    //
    // return data.map(row => ({
    //   id: row.id,
    //   scopeId,
    //   trigger: row.original_response,
    //   content: row.corrected_response,
    //   appliedAt: new Date(row.created_at).getTime(),
    //   source: 'database',
    //   charLength: row.corrected_response.length,
    //   contentHash: row.original_hash,
    // }));
    
    return [];
  }

  /**
   * Fetch all unique scopeIds from database
   * Used for backfill operations
   */
  async fetchAllScopes() {
    // TODO: Implement scope enumeration
    console.log('[MemoryAdapterServer] Would fetch all scopes');
    
    // Placeholder: In production:
    // const { supabase } = require('./supabase');
    // const { data } = await supabase
    //   .from('agent_response_corrections')
    //   .select('metadata->>scopeId')
    //   .not('metadata->>scopeId', 'is', null);
    // 
    // return [...new Set(data.map(row => row.scopeId))];
    
    return [];
  }
}

module.exports = MemoryAdapterServer;

