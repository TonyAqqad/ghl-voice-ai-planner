/**
 * Memory API Integration Tests
 * Tests Context7 memory proxy endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock the provider selection
jest.mock('../../providers/llm-utils', () => ({
  selectProvider: jest.fn(() => ({
    provider: {
      callMemory: jest.fn(),
    },
  })),
}));

// Mock telemetry
jest.mock('../../lib/telemetry', () => ({
  logMemoryOperation: jest.fn(),
  logContext7Call: jest.fn(),
  logCacheOperation: jest.fn(),
}));

// Mock memory cache
jest.mock('../../lib/memoryCache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  invalidatePattern: jest.fn(),
  ttlMs: 5 * 60 * 1000,
}));

describe('Memory API Routes', () => {
  let app;
  let memoryRouter;
  let mockProvider;
  let memoryCache;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());

    // Get mocked modules
    const { selectProvider } = require('../../providers/llm-utils');
    mockProvider = selectProvider().provider;
    memoryCache = require('../../lib/memoryCache');

    // Load memory router
    memoryRouter = require('../memory');
    app.use('/api/memory', memoryRouter);
  });

  describe('POST /api/memory/snippets', () => {
    it('returns snippets from Context7 when enabled', async () => {
      // Set environment
      process.env.ENABLE_CONTEXT7_MEMORY = 'true';
      process.env.CONTEXT7_API_KEY = 'test-key';

      // Mock cache miss
      memoryCache.get.mockReturnValue(null);

      // Mock Context7 response
      mockProvider.callMemory.mockResolvedValue({
        items: [
          {
            trigger: 'What are your hours?',
            content: 'We are open Mon-Fri 6am-8pm',
            timestamp: Date.now(),
          },
        ],
      });

      const res = await request(app)
        .post('/api/memory/snippets')
        .send({ scopeId: 'scope:123', limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.source).toBe('context7');
      expect(res.body.snippets).toHaveLength(1);
      expect(res.body.snippets[0].originalQuestion).toBe('What are your hours?');
      expect(mockProvider.callMemory).toHaveBeenCalledWith(
        'retrieve',
        expect.objectContaining({
          scopeId: 'scope:123',
          limit: 5,
        })
      );
    });

    it('returns cached snippets when available', async () => {
      // Set environment
      process.env.ENABLE_CONTEXT7_MEMORY = 'true';

      // Mock cache hit
      const cachedData = {
        snippets: [{ originalQuestion: 'Cached?', correctedResponse: 'Yes!' }],
        count: 1,
      };
      memoryCache.get.mockReturnValue(cachedData);

      const res = await request(app)
        .post('/api/memory/snippets')
        .send({ scopeId: 'scope:123', limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.source).toBe('cache');
      expect(res.body.count).toBe(1);
      expect(mockProvider.callMemory).not.toHaveBeenCalled();
    });

    it('returns empty array when Context7 disabled', async () => {
      process.env.ENABLE_CONTEXT7_MEMORY = 'false';

      const res = await request(app)
        .post('/api/memory/snippets')
        .send({ scopeId: 'scope:123', limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body.source).toBe('disabled');
      expect(res.body.snippets).toEqual([]);
      expect(mockProvider.callMemory).not.toHaveBeenCalled();
    });

    it('returns 503 on Context7 failure', async () => {
      process.env.ENABLE_CONTEXT7_MEMORY = 'true';
      memoryCache.get.mockReturnValue(null);

      // Mock Context7 failure
      mockProvider.callMemory.mockRejectedValue(new Error('API timeout'));

      const res = await request(app)
        .post('/api/memory/snippets')
        .send({ scopeId: 'scope:123' });

      expect(res.status).toBe(503);
      expect(res.body.source).toBe('error');
      expect(res.body.fallback).toBe('localStorage');
      expect(res.body.snippets).toEqual([]);
    });

    it('returns 400 without scopeId', async () => {
      const res = await request(app)
        .post('/api/memory/snippets')
        .send({ limit: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('scopeId required');
    });
  });

  describe('PUT /api/memory/snippets', () => {
    it('saves snippet to Context7 successfully', async () => {
      process.env.ENABLE_CONTEXT7_MEMORY = 'true';
      process.env.CONTEXT7_API_KEY = 'test-key';

      mockProvider.callMemory
        .mockResolvedValueOnce({ items: [] }) // Dedup check returns nothing
        .mockResolvedValueOnce({}); // Store succeeds

      const snippet = {
        id: 'test-id',
        trigger: 'What is your phone?',
        content: '555-1234',
        appliedAt: Date.now(),
        source: 'voice-agent',
        charLength: 8,
        contentHash: 'abc123',
      };

      const res = await request(app)
        .put('/api/memory/snippets')
        .send({ scopeId: 'scope:456', snippet });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('context7');
      expect(memoryCache.invalidatePattern).toHaveBeenCalledWith('snippets:scope:456:');
    });

    it('skips duplicate snippet with same contentHash', async () => {
      process.env.ENABLE_CONTEXT7_MEMORY = 'true';
      process.env.CONTEXT7_API_KEY = 'test-key';

      // Mock dedup check finds existing snippet
      mockProvider.callMemory.mockResolvedValue({
        items: [{ id: 'existing', contentHash: 'abc123' }],
      });

      const snippet = {
        id: 'test-id',
        trigger: 'What is your phone?',
        content: '555-1234',
        appliedAt: Date.now(),
        source: 'voice-agent',
        charLength: 8,
        contentHash: 'abc123',
      };

      const res = await request(app)
        .put('/api/memory/snippets')
        .send({ scopeId: 'scope:456', snippet });

      expect(res.status).toBe(200);
      expect(res.body.deduped).toBe(true);
      // Should only call retrieve (dedup check), not store
      expect(mockProvider.callMemory).toHaveBeenCalledTimes(1);
      expect(mockProvider.callMemory).toHaveBeenCalledWith(
        'retrieve',
        expect.objectContaining({ contentHash: 'abc123' })
      );
    });

    it('returns 202 when Context7 save fails', async () => {
      process.env.ENABLE_CONTEXT7_MEMORY = 'true';
      process.env.CONTEXT7_API_KEY = 'test-key';

      mockProvider.callMemory
        .mockResolvedValueOnce({ items: [] }) // Dedup check
        .mockRejectedValueOnce(new Error('Network error')); // Store fails

      const snippet = {
        id: 'test-id',
        trigger: 'Test',
        content: 'Response',
        appliedAt: Date.now(),
        source: 'voice-agent',
        charLength: 8,
      };

      const res = await request(app)
        .put('/api/memory/snippets')
        .send({ scopeId: 'scope:789', snippet });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.source).toBe('localStorage');
      expect(res.body.warning).toContain('Context7 save failed');
    });

    it('returns 400 without scopeId or snippet', async () => {
      const res1 = await request(app).put('/api/memory/snippets').send({});
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .put('/api/memory/snippets')
        .send({ scopeId: 'scope:123' });
      expect(res2.status).toBe(400);
    });
  });

  describe('GET /api/memory/health', () => {
    it('returns available status when Context7 enabled', async () => {
      process.env.ENABLE_CONTEXT7_MEMORY = 'true';
      process.env.CONTEXT7_API_KEY = 'test-key';

      const res = await request(app).get('/api/memory/health');

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
      expect(res.body.provider).toBe('context7');
    });

    it('returns unavailable when Context7 disabled', async () => {
      process.env.ENABLE_CONTEXT7_MEMORY = 'false';

      const res = await request(app).get('/api/memory/health');

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
      expect(res.body.reason).toContain('disabled');
    });

    it('returns unavailable when no API key', async () => {
      process.env.ENABLE_CONTEXT7_MEMORY = 'true';
      delete process.env.CONTEXT7_API_KEY;

      const res = await request(app).get('/api/memory/health');

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
      expect(res.body.reason).toContain('API key');
    });
  });
});

