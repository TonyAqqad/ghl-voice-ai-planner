/**
 * Memory Adapter - Hybrid Context7 + localStorage
 * 
 * SOLID Principles:
 * - Single Responsibility: Abstracts memory storage
 * - Open/Closed: Extensible with new backends
 * - Liskov Substitution: All backends implement same interface
 * - Dependency Inversion: Depends on abstractions
 * 
 * Purpose: Unify snippet storage across localStorage and Context7 Memory API
 */

import { getScopedLearnedSnippets, saveScopedSession, applyScopedCorrections } from '../evaluation/masterStore';
import type { SessionEvaluation } from '../evaluation/types';

/**
 * Memory source type
 */
export type MemorySource = 'localStorage' | 'context7' | 'hybrid';

/**
 * Learned snippet for memory storage
 */
export interface MemorySnippet {
  id: string;
  scopeId: string;
  trigger: string;
  content: string;
  appliedAt: number;
  source: 'voice-agent' | 'owner' | 'niche' | 'global';
  charLength: number;
  contentHash?: string;
}

/**
 * Normalized snippet (for deduplication)
 */
export interface NormalizedSnippet extends MemorySnippet {
  contentHash: string;
}

/**
 * Memory adapter configuration
 */
export interface MemoryAdapterConfig {
  /** Enable Context7 memory (requires API key) */
  enableContext7: boolean;
  /** Fallback to localStorage if Context7 fails */
  fallbackToLocalStorage: boolean;
  /** API base URL for server endpoints */
  apiBaseUrl: string;
}

/**
 * Memory adapter result
 */
export interface MemoryResult<T> {
  data: T;
  source: MemorySource;
  error?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MemoryAdapterConfig = {
  enableContext7: false, // Off by default - opt-in
  fallbackToLocalStorage: true,
  apiBaseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
};

/**
 * Simple hash function for content deduplication
 * Uses FNV-1a hash algorithm for fast hashing
 */
function hashString(str: string): string {
  let hash = 2166136261; // FNV offset basis
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  
  // Convert to hex string
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Normalize a snippet for deduplication
 * - Trims and lowercases trigger
 * - Trims content
 * - Generates content hash from trigger + content
 * - Uses hash as ID for deduplication
 */
function normalizeSnippet(snippet: MemorySnippet): NormalizedSnippet {
  const normalizedTrigger = snippet.trigger.trim().toLowerCase();
  const normalizedContent = snippet.content.trim();
  const contentHash = hashString(`${normalizedTrigger}:${normalizedContent}`);
  
  return {
    ...snippet,
    id: contentHash, // Use content hash as ID for deduplication
    trigger: normalizedTrigger,
    content: normalizedContent,
    contentHash,
    charLength: normalizedContent.length,
  };
}

/**
 * Memory Adapter - Unified interface for snippet storage
 * 
 * Strategy:
 * 1. Try Context7 memory API (if enabled)
 * 2. Fallback to localStorage (if Context7 fails or disabled)
 * 3. Track source in attestation for transparency
 */
export class MemoryAdapter {
  private config: MemoryAdapterConfig;

  constructor(config?: Partial<MemoryAdapterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get learned snippets from memory
   * Tries Context7 first, falls back to localStorage
   */
  async getSnippets(
    scopeId: string,
    limit: number = 5
  ): Promise<MemoryResult<Array<{ originalQuestion: string; correctedResponse: string; appliedAt: number }>>> {
    // Try Context7 memory if enabled
    if (this.config.enableContext7) {
      try {
        const context7Snippets = await this.getSnippetsFromContext7(scopeId, limit);
        if (context7Snippets && context7Snippets.length > 0) {
          return {
            data: context7Snippets,
            source: 'context7',
          };
        }
      } catch (error) {
        console.warn('Context7 memory failed, falling back to localStorage:', error);
        
        if (!this.config.fallbackToLocalStorage) {
          return {
            data: [],
            source: 'context7',
            error: error instanceof Error ? error.message : 'Context7 fetch failed',
          };
        }
      }
    }

    // Use localStorage (either as primary or fallback)
    const localSnippets = getScopedLearnedSnippets(scopeId, limit);
    return {
      data: localSnippets,
      source: 'localStorage',
    };
  }

  /**
   * Save snippet to memory
   * Saves to both Context7 and localStorage for redundancy
   */
  async saveSnippet(
    scopeId: string,
    conversationId: string,
    correction: {
      turnId: string;
      correctedResponse: string;
    }
  ): Promise<MemoryResult<boolean>> {
    // Always save to localStorage first (guaranteed to work)
    const session = applyScopedCorrections(scopeId, conversationId, correction);
    
    if (!session) {
      return {
        data: false,
        source: 'localStorage',
        error: 'Session not found in localStorage',
      };
    }

    // Also save to Context7 if enabled (best effort)
    if (this.config.enableContext7) {
      try {
        // Create snippet and normalize for deduplication
        const snippet: MemorySnippet = {
          id: `snippet-${Date.now()}`,
          scopeId,
          trigger: correction.turnId, // Simplified for now
          content: correction.correctedResponse,
          appliedAt: Date.now(),
          source: 'voice-agent',
          charLength: correction.correctedResponse.length,
        };
        
        // Normalize before sending (handles deduplication)
        const normalized = normalizeSnippet(snippet);
        await this.saveSnippetToContext7(scopeId, normalized);
        
        return {
          data: true,
          source: 'hybrid', // Saved to both!
        };
      } catch (error) {
        console.warn('Failed to save to Context7, but localStorage succeeded:', error);
        // Not a failure - localStorage succeeded
      }
    }

    return {
      data: true,
      source: 'localStorage',
    };
  }

  /**
   * Fetch snippets from Context7 Memory API via server
   */
  private async getSnippetsFromContext7(
    scopeId: string,
    limit: number
  ): Promise<Array<{ originalQuestion: string; correctedResponse: string; appliedAt: number }>> {
    const response = await fetch(`${this.config.apiBaseUrl}/api/memory/snippets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopeId, limit }),
    });

    if (!response.ok) {
      throw new Error(`Context7 API error: ${response.status}`);
    }

    const data = await response.json();
    return data.snippets || [];
  }

  /**
   * Save snippet to Context7 Memory API via server
   */
  private async saveSnippetToContext7(scopeId: string, snippet: MemorySnippet): Promise<void> {
    const response = await fetch(`${this.config.apiBaseUrl}/api/memory/snippets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopeId, snippet }),
    });

    if (!response.ok) {
      throw new Error(`Context7 API error: ${response.status}`);
    }
  }

  /**
   * Check if Context7 is available
   */
  async healthCheck(): Promise<{ localStorage: boolean; context7: boolean }> {
    const localStorageAvailable = typeof localStorage !== 'undefined';
    
    let context7Available = false;
    if (this.config.enableContext7) {
      try {
        const response = await fetch(`${this.config.apiBaseUrl}/api/memory/health`, {
          method: 'GET',
        });
        context7Available = response.ok;
      } catch {
        context7Available = false;
      }
    }

    return {
      localStorage: localStorageAvailable,
      context7: context7Available,
    };
  }
}

/**
 * Global singleton instance
 * Configured via environment or runtime settings
 */
let globalAdapter: MemoryAdapter | null = null;

/**
 * Get or create the global memory adapter
 */
export function getMemoryAdapter(config?: Partial<MemoryAdapterConfig>): MemoryAdapter {
  if (!globalAdapter || config) {
    // Check if Context7 should be enabled via environment
    const enableContext7 = 
      config?.enableContext7 ?? 
      (typeof window !== 'undefined' && (window as any).__ENABLE_CONTEXT7_MEMORY__) ??
      false;
    
    globalAdapter = new MemoryAdapter({
      ...config,
      enableContext7,
    });
  }
  
  return globalAdapter;
}

/**
 * Reset the global adapter (useful for testing)
 */
export function resetMemoryAdapter(): void {
  globalAdapter = null;
}

