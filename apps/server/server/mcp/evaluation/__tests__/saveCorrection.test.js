const { describe, it, expect, vi, beforeEach } = require('vitest');

// Mock dependencies
const mockPool = {
  query: vi.fn()
};

const mockGetPromptById = vi.fn();
const mockGetAgentPrompt = vi.fn();
const mockSaveAgentPrompt = vi.fn();

// Mock modules before requiring the handler
vi.mock('../../database', () => ({
  pool: mockPool
}));

vi.mock('../../../db/promptStore', () => ({
  getPromptById: mockGetPromptById,
  getAgentPrompt: mockGetAgentPrompt,
  saveAgentPrompt: mockSaveAgentPrompt
}));

describe('saveCorrection Endpoint', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup request and response mocks
    req = {
      body: {
        agentId: 'agent-123',
        promptId: 'prompt-456',
        callLogId: 'call-789',
        reviewId: 'review-101',
        originalResponse: 'Original agent response',
        correctedResponse: 'Corrected agent response',
        storeIn: 'prompt',
        reason: 'Fixed grammar issue',
        metadata: { source: 'training_hub' }
      }
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  describe('Input Validation', () => {
    it('should return 400 if agentId is missing', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      req.body.agentId = null;
      
      await saveCorrectionEndpoint(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'agentId is required'
      });
    });

    it('should return 400 if originalResponse is missing', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      req.body.originalResponse = null;
      
      await saveCorrectionEndpoint(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Both originalResponse and correctedResponse are required'
      });
    });

    it('should return 400 if correctedResponse is missing', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      req.body.correctedResponse = '';
      
      await saveCorrectionEndpoint(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Both originalResponse and correctedResponse are required'
      });
    });

    it('should return 400 if storeIn is invalid', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      req.body.storeIn = 'invalid';
      
      await saveCorrectionEndpoint(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'storeIn must be "prompt" or "kb"'
      });
    });

    it('should accept "kb" as valid storeIn value', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      req.body.storeIn = 'kb';
      
      mockGetPromptById.mockResolvedValue({
        id: 'prompt-456',
        system_prompt: 'Test prompt',
        kb_refs: [],
        actions: {},
        version: '1.0',
        niche: 'generic'
      });
      
      mockSaveAgentPrompt.mockResolvedValue({
        id: 'new-prompt-789',
        version: '1.1'
      });
      
      mockPool.query.mockResolvedValue({ rows: [{ id: 'correction-123' }] });
      
      await saveCorrectionEndpoint(req, res);
      
      expect(res.status).not.toHaveBeenCalledWith(400);
    });
  });

  describe('Prompt Retrieval', () => {
    it('should return 404 if prompt not found by promptId', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      mockGetPromptById.mockResolvedValue(null);
      
      await saveCorrectionEndpoint(req, res);
      
      expect(mockGetPromptById).toHaveBeenCalledWith('prompt-456');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Prompt not found for provided agentId/promptId'
      });
    });

    it('should fallback to getAgentPrompt if promptId is null', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      req.body.promptId = null;
      
      mockGetAgentPrompt.mockResolvedValue({
        id: 'prompt-latest',
        system_prompt: 'Test prompt',
        kb_refs: [],
        actions: {},
        version: '1.0',
        niche: 'generic'
      });
      
      mockSaveAgentPrompt.mockResolvedValue({
        id: 'new-prompt-789',
        version: '1.1'
      });
      
      mockPool.query.mockResolvedValue({ rows: [{ id: 'correction-123' }] });
      
      await saveCorrectionEndpoint(req, res);
      
      expect(mockGetAgentPrompt).toHaveBeenCalledWith('agent-123');
      expect(mockGetPromptById).not.toHaveBeenCalled();
    });
  });

  describe('Version Bumping', () => {
    it('should increment numeric version by 0.1', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      
      mockGetPromptById.mockResolvedValue({
        id: 'prompt-456',
        system_prompt: 'Test prompt',
        kb_refs: [],
        actions: {},
        version: '2.3',
        niche: 'generic'
      });
      
      mockSaveAgentPrompt.mockResolvedValue({
        id: 'new-prompt-789',
        version: '2.4'
      });
      
      mockPool.query.mockResolvedValue({ rows: [{ id: 'correction-123' }] });
      
      await saveCorrectionEndpoint(req, res);
      
      expect(mockSaveAgentPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '2.4'
        }),
        'agent-123',
        null
      );
    });
  });

  describe('Prompt Storage', () => {
    it('should append correction block to system_prompt when storeIn is "prompt"', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      
      const existingPrompt = 'Existing system prompt';
      mockGetPromptById.mockResolvedValue({
        id: 'prompt-456',
        system_prompt: existingPrompt,
        kb_refs: [],
        actions: { custom_actions: [], eval_rubric: [] },
        version: '1.0',
        niche: 'generic',
        kit_id: null
      });
      
      mockSaveAgentPrompt.mockResolvedValue({
        id: 'new-prompt-789',
        version: '1.1'
      });
      
      mockPool.query.mockResolvedValue({ rows: [{ id: 'correction-123', metadata: '{}' }] });
      
      await saveCorrectionEndpoint(req, res);
      
      const savedPromptCall = mockSaveAgentPrompt.mock.calls[0][0];
      expect(savedPromptCall.system_prompt).toContain(existingPrompt);
      expect(savedPromptCall.system_prompt).toContain('Original');
      expect(savedPromptCall.system_prompt).toContain('Preferred');
      expect(savedPromptCall.system_prompt).toContain(req.body.originalResponse);
      expect(savedPromptCall.system_prompt).toContain(req.body.correctedResponse);
    });

    it('should add KB entry when storeIn is "kb"', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      req.body.storeIn = 'kb';
      
      mockGetPromptById.mockResolvedValue({
        id: 'prompt-456',
        system_prompt: 'Test prompt',
        kb_refs: [{ id: 'existing-kb', title: 'Existing KB' }],
        actions: { custom_actions: [], eval_rubric: [] },
        version: '1.0',
        niche: 'generic',
        kit_id: null
      });
      
      mockSaveAgentPrompt.mockResolvedValue({
        id: 'new-prompt-789',
        version: '1.1'
      });
      
      mockPool.query.mockResolvedValue({ rows: [{ id: 'correction-123', metadata: '{}' }] });
      
      await saveCorrectionEndpoint(req, res);
      
      const savedPromptCall = mockSaveAgentPrompt.mock.calls[0][0];
      expect(savedPromptCall.kb_stubs).toHaveLength(2);
      expect(savedPromptCall.kb_stubs[1].id).toMatch(/^manual-/);
      expect(savedPromptCall.kb_stubs[1].title).toContain('Manual Correction');
      expect(savedPromptCall.kb_stubs[1].outline).toBeInstanceOf(Array);
    });
  });

  describe('Database Logging', () => {
    it('should insert correction record into agent_response_corrections', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      
      mockGetPromptById.mockResolvedValue({
        id: 'prompt-456',
        system_prompt: 'Test',
        kb_refs: [],
        actions: {},
        version: '1.0',
        niche: 'generic'
      });
      
      mockSaveAgentPrompt.mockResolvedValue({
        id: 'new-prompt-789',
        version: '1.1'
      });
      
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'correction-123', metadata: '{}' }] })
                     .mockResolvedValueOnce({ rows: [] });
      
      await saveCorrectionEndpoint(req, res);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agent_response_corrections'),
        expect.arrayContaining([
          'agent-123',
          'call-789',
          'new-prompt-789',
          'review-101',
          'Original agent response',
          expect.any(String), // originalHash
          'Corrected agent response',
          expect.any(String), // correctedHash
          'prompt',
          'Fixed grammar issue',
          expect.any(String), // confirmationMessage
          expect.any(String)  // metadata JSON
        ])
      );
    });

    it('should insert log entry into agent_logs', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      
      mockGetPromptById.mockResolvedValue({
        id: 'prompt-456',
        system_prompt: 'Test',
        kb_refs: [],
        actions: {},
        version: '1.0',
        niche: 'generic'
      });
      
      mockSaveAgentPrompt.mockResolvedValue({
        id: 'new-prompt-789',
        version: '1.1'
      });
      
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'correction-123', metadata: '{}' }] })
                     .mockResolvedValueOnce({ rows: [] });
      
      await saveCorrectionEndpoint(req, res);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agent_logs'),
        expect.arrayContaining([
          'agent-123',
          'manual_response_correction',
          expect.any(String), // payload JSON
          expect.any(String), // context JSON
          'success'
        ])
      );
    });
  });

  describe('Response Format', () => {
    it('should return success response with confirmation message', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      
      mockGetPromptById.mockResolvedValue({
        id: 'prompt-456',
        system_prompt: 'Test',
        kb_refs: [],
        actions: {},
        version: '1.0',
        niche: 'generic'
      });
      
      mockSaveAgentPrompt.mockResolvedValue({
        id: 'new-prompt-789',
        version: '1.1'
      });
      
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'correction-123', metadata: '{}' }] })
                     .mockResolvedValueOnce({ rows: [] });
      
      await saveCorrectionEndpoint(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          confirmationMessage: expect.stringContaining('version 1.1'),
          promptId: 'new-prompt-789',
          promptVersion: '1.1',
          correction: expect.objectContaining({
            id: 'correction-123'
          })
        })
      );
    });

    it('should return different confirmation for KB storage', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      req.body.storeIn = 'kb';
      
      mockGetPromptById.mockResolvedValue({
        id: 'prompt-456',
        system_prompt: 'Test',
        kb_refs: [],
        actions: {},
        version: '1.0',
        niche: 'generic'
      });
      
      mockSaveAgentPrompt.mockResolvedValue({
        id: 'new-prompt-789',
        version: '1.1'
      });
      
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'correction-123', metadata: '{}' }] })
                     .mockResolvedValueOnce({ rows: [] });
      
      await saveCorrectionEndpoint(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          confirmationMessage: expect.stringContaining('knowledge base')
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database errors', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      
      mockGetPromptById.mockRejectedValue(new Error('Database connection failed'));
      
      await saveCorrectionEndpoint(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed'
      });
    });

    it('should handle missing metadata gracefully', async () => {
      const { saveCorrectionEndpoint } = await import('../index.js');
      req.body.metadata = null;
      
      mockGetPromptById.mockResolvedValue({
        id: 'prompt-456',
        system_prompt: 'Test',
        kb_refs: [],
        actions: {},
        version: '1.0',
        niche: 'generic'
      });
      
      mockSaveAgentPrompt.mockResolvedValue({
        id: 'new-prompt-789',
        version: '1.1'
      });
      
      mockPool.query.mockResolvedValue({ rows: [{ id: 'correction-123', metadata: '{}' }] });
      
      await saveCorrectionEndpoint(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });
});

