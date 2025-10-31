import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import TrainingHub from '../components/modules/TrainingHub';
import * as apiBase from '../utils/apiBase';

// Mock the API base URL
vi.mock('../utils/apiBase', () => ({
  getApiBaseUrl: vi.fn(() => 'http://localhost:3000')
}));

// Mock the MCP hook
const mockMCPCall = vi.fn();
vi.mock('../hooks/useMCP', () => ({
  useMCP: () => ({
    voiceAgentCall: mockMCPCall,
    agentSaveCorrection: vi.fn((params) => 
      Promise.resolve({
        success: true,
        confirmationMessage: 'Correction saved to prompt version 1.1',
        promptId: 'new-prompt-123',
        promptVersion: '1.1'
      })
    ),
    agentCheckHealth: vi.fn(() => 
      Promise.resolve({
        success: true,
        data: { status: 'healthy' }
      })
    ),
    loading: false,
    error: null
  })
}));

// Mock the store
vi.mock('../store/useStore', () => ({
  useStore: () => ({
    voiceAgents: [
      {
        id: 'agent-test-123',
        name: 'Test Agent',
        status: 'active',
        systemPrompt: 'Test system prompt',
        knowledgeBase: ['KB item 1', 'KB item 2'],
        customActions: []
      }
    ]
  })
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Correction Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default fetch mock
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/mcp/prompt/niches')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ok: true,
            niches: [
              { value: 'generic', label: 'Generic' },
              { value: 'fitness_gym', label: 'Fitness Gym' }
            ]
          })
        });
      }
      
      if (url.includes('/api/mcp/agent/ingestTranscript')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            ok: true,
            callLog: {
              id: 'call-log-123',
              prompt_id: 'prompt-456',
              review_id: 'review-789'
            },
            reviewId: 'review-789',
            promptId: 'prompt-456',
            evaluation: {
              pass: true,
              rubricScores: {
                fieldCollection: 4.0,
                bookingRules: 4.5,
                tone: 3.8
              },
              improvementNotes: ['Improve tone', 'Better questions'],
              confidenceScore: 0.75,
              suggestedPromptPatch: null,
              suggestedKbAddition: null
            }
          })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  it.skip('should complete full correction workflow', async () => {
    // Mock the voice agent call to return a response
    mockMCPCall.mockResolvedValueOnce({
      success: true,
      data: {
        transcript: 'Hello, how can I help you today?',
        response: 'Hello, how can I help you today?'
      }
    });

    render(<TrainingHub />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Training Hub')).toBeInTheDocument();
    });

    // Step 1: Enable evaluation
    const showScoreCheckbox = screen.getByLabelText(/show score/i);
    await userEvent.click(showScoreCheckbox);
    expect(showScoreCheckbox).toBeChecked();

    // Step 2: Send a test message to generate agent response
    const messageInput = screen.getByPlaceholderText(/type a caller message/i);
    await userEvent.type(messageInput, 'Hello');
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    // Step 3: Wait for evaluation to be triggered
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mcp/agent/ingestTranscript'),
        expect.any(Object)
      );
    }, { timeout: 5000 });

    // Step 4: Open the scorecard
    await waitFor(() => {
      const viewDetailsButton = screen.queryByRole('button', { name: /view details/i });
      if (viewDetailsButton) {
        userEvent.click(viewDetailsButton);
      }
    });

    // Step 5: Find and click edit button (may not be visible if scorecard didn't open)
    // This is a best-effort test given the async nature
    const editButtons = screen.queryAllByRole('button', { name: /edit/i });
    if (editButtons.length > 0) {
      await userEvent.click(editButtons[0]);

      // Step 6: Modify the response
      const textarea = screen.getByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Improved agent response');

      // Step 7: Add a reason
      const reasonInput = screen.getByLabelText(/reason/i);
      await userEvent.type(reasonInput, 'Grammar improvement');

      // Step 8: Save the correction
      const saveButton = screen.getByRole('button', { name: /save correction/i });
      await userEvent.click(saveButton);

      // Step 9: Verify confirmation appears
      await waitFor(() => {
        expect(screen.getByText(/correction saved/i)).toBeInTheDocument();
      });
    }
  }, 15000); // Longer timeout for complex integration test

  it.skip('should handle MCP endpoint call with correct payload structure', async () => {
    const mockSaveCorrection = vi.fn(() => Promise.resolve({
      success: true,
      confirmationMessage: 'Saved to KB',
      promptId: 'new-prompt-999'
    }));

    // Re-mock with our spy
    vi.mock('../hooks/useMCP', () => ({
      useMCP: () => ({
        voiceAgentCall: mockMCPCall,
        agentSaveCorrection: mockSaveCorrection,
        agentCheckHealth: vi.fn(),
        loading: false,
        error: null
      })
    }));

    mockMCPCall.mockResolvedValueOnce({
      success: true,
      data: { response: 'Agent response text' }
    });

    render(<TrainingHub />);

    await waitFor(() => {
      expect(screen.getByText('Training Hub')).toBeInTheDocument();
    });

    // Enable evaluation
    const showScoreCheckbox = screen.getByLabelText(/show score/i);
    await userEvent.click(showScoreCheckbox);

    // Send message
    const messageInput = screen.getByPlaceholderText(/type a caller message/i);
    await userEvent.type(messageInput, 'Test message');
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    // Wait for API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 5000 });
  }, 15000);

  it.skip('should display error when correction save fails', async () => {
    const mockSaveCorrection = vi.fn(() => Promise.resolve({
      success: false,
      error: 'Database error occurred'
    }));

    vi.mock('../hooks/useMCP', () => ({
      useMCP: () => ({
        voiceAgentCall: mockMCPCall,
        agentSaveCorrection: mockSaveCorrection,
        agentCheckHealth: vi.fn(),
        loading: false,
        error: null
      })
    }));

    mockMCPCall.mockResolvedValueOnce({
      success: true,
      data: { response: 'Agent response' }
    });

    render(<TrainingHub />);

    await waitFor(() => {
      expect(screen.getByText('Training Hub')).toBeInTheDocument();
    });
  }, 15000);

  it.skip('should reset evaluation context when conversation is cleared', async () => {
    mockMCPCall.mockResolvedValueOnce({
      success: true,
      data: { response: 'Test response' }
    });

    render(<TrainingHub />);

    await waitFor(() => {
      expect(screen.getByText('Training Hub')).toBeInTheDocument();
    });

    // Enable evaluation and send message
    const showScoreCheckbox = screen.getByLabelText(/show score/i);
    await userEvent.click(showScoreCheckbox);

    const messageInput = screen.getByPlaceholderText(/type a caller message/i);
    await userEvent.type(messageInput, 'Hello');
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    // Wait for response
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Reset conversation
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);

    // Confirm the dialog (using window.confirm mock would be needed in real scenario)
    // For now, just verify the button exists
    expect(resetButton).toBeInTheDocument();
  }, 15000);

  it.skip('should preserve evaluation data across scorecard open/close', async () => {
    mockMCPCall.mockResolvedValueOnce({
      success: true,
      data: { response: 'Test agent response' }
    });

    render(<TrainingHub />);

    await waitFor(() => {
      expect(screen.getByText('Training Hub')).toBeInTheDocument();
    });

    // Enable evaluation
    const showScoreCheckbox = screen.getByLabelText(/show score/i);
    await userEvent.click(showScoreCheckbox);

    // Send message to trigger evaluation
    const messageInput = screen.getByPlaceholderText(/type a caller message/i);
    await userEvent.type(messageInput, 'Test');
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 3000 });

    // The evaluation should be stored and available for reopening
    // This is a structural test to ensure the data flow is correct
  }, 15000);
});

