/**
 * Memory Adapter Tests
 * Tests hybrid localStorage + Context7 memory system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryAdapter, resetMemoryAdapter } from '../memoryAdapter';
import type { MemorySnippet } from '../memoryAdapter';

// Mock fetch for Context7 API calls
global.fetch = vi.fn();

describe('MemoryAdapter', () => {
  let adapter: MemoryAdapter;

  beforeEach(() => {
    // Reset adapter and mocks before each test
    resetMemoryAdapter();
    vi.clearAllMocks();
    
    // Mock localStorage
    const store: Record<string, string> = {};
    Storage.prototype.getItem = vi.fn((key) => store[key] || null);
    Storage.prototype.setItem = vi.fn((key, value) => {
      store[key] = value;
    });
    Storage.prototype.clear = vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSnippets', () => {
    it('uses Context7 when enabled and available', async () => {
      // Mock successful Context7 response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          snippets: [
            {
              originalQuestion: 'What are your hours?',
              correctedResponse: 'We are open Mon-Fri 6am-8pm',
              appliedAt: Date.now(),
            },
          ],
          source: 'context7',
          count: 1,
        }),
      });

      adapter = new MemoryAdapter({
        enableContext7: true,
        fallbackToLocalStorage: true,
      });

      const result = await adapter.getSnippets('scope:123', 5);

      expect(result.source).toBe('context7');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].originalQuestion).toBe('What are your hours?');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/memory/snippets'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('falls back to localStorage when Context7 fails', async () => {
      // Mock Context7 error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Setup localStorage with some snippets
      const mockSnippets = [
        {
          originalQuestion: 'What is your address?',
          correctedResponse: '123 Main St',
          appliedAt: Date.now(),
        },
      ];
      localStorage.setItem(
        'scoped-snippets:scope:123',
        JSON.stringify(mockSnippets)
      );

      adapter = new MemoryAdapter({
        enableContext7: true,
        fallbackToLocalStorage: true,
      });

      const result = await adapter.getSnippets('scope:123', 5);

      expect(result.source).toBe('localStorage');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].originalQuestion).toBe('What is your address?');
    });

    it('uses localStorage when Context7 disabled', async () => {
      // Setup localStorage
      const mockSnippets = [
        {
          originalQuestion: 'Test question',
          correctedResponse: 'Test answer',
          appliedAt: Date.now(),
        },
      ];
      localStorage.setItem(
        'scoped-snippets:scope:456',
        JSON.stringify(mockSnippets)
      );

      adapter = new MemoryAdapter({
        enableContext7: false,
        fallbackToLocalStorage: true,
      });

      const result = await adapter.getSnippets('scope:456', 5);

      expect(result.source).toBe('localStorage');
      expect(result.data).toHaveLength(1);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns empty array when both sources fail', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      adapter = new MemoryAdapter({
        enableContext7: true,
        fallbackToLocalStorage: false,
      });

      const result = await adapter.getSnippets('scope:789', 5);

      expect(result.source).toBe('context7');
      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
    });
  });

  describe('saveSnippet', () => {
    it('saves to both Context7 and localStorage (hybrid)', async () => {
      // Mock successful Context7 save
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          source: 'context7',
          snippetId: 'test-id',
        }),
      });

      adapter = new MemoryAdapter({
        enableContext7: true,
        fallbackToLocalStorage: true,
      });

      const result = await adapter.saveSnippet(
        'scope:123',
        'conv-1',
        {
          turnId: 'turn-5',
          correctedResponse: 'We are open Mon-Fri 6am-8pm!',
        }
      );

      expect(result.source).toBe('hybrid');
      expect(result.data).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/memory/snippets'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('saves to localStorage only when Context7 fails', async () => {
      // Mock Context7 save failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      adapter = new MemoryAdapter({
        enableContext7: true,
        fallbackToLocalStorage: true,
      });

      const result = await adapter.saveSnippet(
        'scope:123',
        'conv-1',
        {
          turnId: 'turn-5',
          correctedResponse: 'Test response',
        }
      );

      expect(result.source).toBe('localStorage');
      expect(result.data).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('only saves to localStorage when Context7 disabled', async () => {
      adapter = new MemoryAdapter({
        enableContext7: false,
        fallbackToLocalStorage: true,
      });

      const result = await adapter.saveSnippet(
        'scope:456',
        'conv-2',
        {
          turnId: 'turn-3',
          correctedResponse: 'Another response',
        }
      );

      expect(result.source).toBe('localStorage');
      expect(result.data).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('reports Context7 as available when enabled and accessible', async () => {
      // Mock successful health check
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ available: true }),
      });

      adapter = new MemoryAdapter({
        enableContext7: true,
      });

      const health = await adapter.healthCheck();

      expect(health.localStorage).toBe(true);
      expect(health.context7).toBe(true);
    });

    it('reports Context7 as unavailable when disabled', async () => {
      adapter = new MemoryAdapter({
        enableContext7: false,
      });

      const health = await adapter.healthCheck();

      expect(health.localStorage).toBe(true);
      expect(health.context7).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('reports Context7 as unavailable when health check fails', async () => {
      // Mock health check failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection refused'));

      adapter = new MemoryAdapter({
        enableContext7: true,
      });

      const health = await adapter.healthCheck();

      expect(health.localStorage).toBe(true);
      expect(health.context7).toBe(false);
    });
  });
});

