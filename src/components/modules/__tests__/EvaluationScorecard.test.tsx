import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EvaluationScorecard from '../EvaluationScorecard';
import type { EvaluationResult, ConversationTurn } from '../../../types/evaluation';

describe('EvaluationScorecard', () => {
  const mockEvaluation: EvaluationResult = {
    pass: true,
    rubricScores: {
      fieldCollection: 4.5,
      bookingRules: 4.0,
      tone: 3.5,
      objectionHandling: 5.0,
      questionCadence: 4.2,
      verification: 3.8
    },
    improvementNotes: [
      'Improve field collection flow',
      'Better handling of booking rules'
    ],
    confidenceScore: 0.85,
    suggestedPromptPatch: { type: 'test_patch' },
    suggestedKbAddition: { title: 'Test KB', reason: 'Testing' }
  };

  const mockConversation: ConversationTurn[] = [
    { speaker: 'user', text: 'Hello', timestamp: Date.now() - 2000 },
    { speaker: 'agent', text: 'Hi, how can I help?', timestamp: Date.now() - 1000 },
    { speaker: 'user', text: 'I need assistance', timestamp: Date.now() }
  ];

  const defaultProps = {
    evaluation: mockEvaluation,
    isOpen: true,
    onClose: vi.fn(),
    conversation: mockConversation,
    agentId: 'agent-123',
    promptId: 'prompt-456',
    reviewId: 'review-789',
    callLogId: 'call-101',
    onSaveCorrection: vi.fn(),
    savingCorrection: false,
    correctionConfirmation: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when open with evaluation', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      expect(screen.getByText('Training Hub Analysis')).toBeInTheDocument();
    });

    it('should not render when evaluation is null', () => {
      render(<EvaluationScorecard {...defaultProps} evaluation={null} />);
      expect(screen.queryByText('Training Hub Analysis')).not.toBeInTheDocument();
    });

    it('should show pass status for passing evaluation', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      expect(screen.getByText('Pass')).toBeInTheDocument();
    });

    it('should show fail status for failing evaluation', () => {
      const failingEval = { ...mockEvaluation, pass: false };
      render(<EvaluationScorecard {...defaultProps} evaluation={failingEval} />);
      expect(screen.getByText('Needs Review')).toBeInTheDocument();
    });

    it('should display confidence score as percentage', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      expect(screen.getByText('85', { exact: false })).toBeInTheDocument();
    });
  });

  describe('Rubric Scores', () => {
    it('should render all rubric scores', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      expect(screen.getByText('Field Collection')).toBeInTheDocument();
      expect(screen.getByText('Booking Rules')).toBeInTheDocument();
      expect(screen.getByText('Tone & Natural Language')).toBeInTheDocument();
    });

    it('should display correct score values', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      expect(screen.getByText('4.5', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('4.0', { exact: false })).toBeInTheDocument();
    });
  });

  describe('Improvement Notes', () => {
    it('should render improvement notes as checkboxes', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should allow checking improvement notes', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      
      await userEvent.click(firstCheckbox);
      expect(firstCheckbox).toBeChecked();
      
      await userEvent.click(firstCheckbox);
      expect(firstCheckbox).not.toBeChecked();
    });

    it('should show message when no improvement notes', () => {
      const evalWithoutNotes = { ...mockEvaluation, improvementNotes: [] };
      render(<EvaluationScorecard {...defaultProps} evaluation={evalWithoutNotes} />);
      expect(screen.getByText(/No outstanding improvements/i)).toBeInTheDocument();
    });
  });

  describe('Conversation Transcript', () => {
    it('should render all conversation turns', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi, how can I help?')).toBeInTheDocument();
      expect(screen.getByText('I need assistance')).toBeInTheDocument();
    });

    it('should show edit button only for agent messages', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      // Should only have 1 edit button for the agent message
      expect(editButtons).toHaveLength(1);
    });

    it('should not show edit button for user messages', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const userMessage = screen.getByText('Hello');
      const parent = userMessage.closest('div');
      expect(parent).not.toContainHTML('Edit');
    });

    it('should show empty state when no conversation', () => {
      render(<EvaluationScorecard {...defaultProps} conversation={[]} />);
      expect(screen.getByText(/No transcript captured/i)).toBeInTheDocument();
    });
  });

  describe('Edit Workflow', () => {
    it('should open edit mode when edit button clicked', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save correction/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should prefill textarea with agent response text', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Hi, how can I help?');
    });

    it('should allow editing the response text', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      const textarea = screen.getByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'New corrected response');
      
      expect(textarea).toHaveValue('New corrected response');
    });

    it('should have prompt storage option selected by default', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      const promptRadio = screen.getByRole('radio', { name: /store inside prompt/i });
      expect(promptRadio).toBeChecked();
    });

    it('should allow switching between prompt and KB storage', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      const kbRadio = screen.getByRole('radio', { name: /add to knowledge base/i });
      await userEvent.click(kbRadio);
      
      expect(kbRadio).toBeChecked();
    });

    it('should allow entering a reason', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      const reasonInput = screen.getByLabelText(/reason/i);
      await userEvent.type(reasonInput, 'Fixed grammar');
      
      expect(reasonInput).toHaveValue('Fixed grammar');
    });

    it('should close edit mode when cancel clicked', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);
      
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error if corrected response is empty', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      const textarea = screen.getByRole('textbox');
      await userEvent.clear(textarea);
      
      const saveButton = screen.getByRole('button', { name: /save correction/i });
      await userEvent.click(saveButton);
      
      expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument();
      expect(defaultProps.onSaveCorrection).not.toHaveBeenCalled();
    });

    it('should show error if corrected response is unchanged', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      const saveButton = screen.getByRole('button', { name: /save correction/i });
      await userEvent.click(saveButton);
      
      expect(screen.getByText(/must differ from the original/i)).toBeInTheDocument();
      expect(defaultProps.onSaveCorrection).not.toHaveBeenCalled();
    });

    it('should call onSaveCorrection with valid data', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      const textarea = screen.getByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Corrected response');
      
      const saveButton = screen.getByRole('button', { name: /save correction/i });
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        expect(defaultProps.onSaveCorrection).toHaveBeenCalledWith({
          messageIndex: 1,
          originalResponse: 'Hi, how can I help?',
          correctedResponse: 'Corrected response',
          storeIn: 'prompt',
          reason: undefined
        });
      });
    });

    it('should include reason in save payload if provided', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      const textarea = screen.getByRole('textbox');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Corrected response');
      
      const reasonInput = screen.getByLabelText(/reason/i);
      await userEvent.type(reasonInput, 'Grammar fix');
      
      const saveButton = screen.getByRole('button', { name: /save correction/i });
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        expect(defaultProps.onSaveCorrection).toHaveBeenCalledWith(
          expect.objectContaining({
            reason: 'Grammar fix'
          })
        );
      });
    });
  });

  describe('Saving State', () => {
    it('should show loading state while saving', () => {
      render(<EvaluationScorecard {...defaultProps} savingCorrection={true} />);
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });

    it('should disable buttons while saving', async () => {
      render(<EvaluationScorecard {...defaultProps} savingCorrection={true} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      await userEvent.click(editButton);
      
      const saveButton = screen.getByRole('button', { name: /saving/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Confirmation Message', () => {
    it('should display confirmation message when provided', () => {
      render(
        <EvaluationScorecard
          {...defaultProps}
          correctionConfirmation="Correction saved successfully!"
        />
      );
      expect(screen.getByText('Correction saved successfully!')).toBeInTheDocument();
    });

    it('should not display confirmation message when null', () => {
      render(<EvaluationScorecard {...defaultProps} correctionConfirmation={null} />);
      expect(screen.queryByText(/saved successfully/i)).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button clicked', async () => {
      render(<EvaluationScorecard {...defaultProps} />);
      const closeButton = screen.getByLabelText(/close/i);
      
      await userEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop clicked', async () => {
      const { container } = render(<EvaluationScorecard {...defaultProps} />);
      const backdrop = container.querySelector('.fixed.inset-0.bg-black') as HTMLElement;
      
      fireEvent.click(backdrop);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Metadata Display', () => {
    it('should display agent ID', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      expect(screen.getByText('agent-123')).toBeInTheDocument();
    });

    it('should display prompt ID', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      expect(screen.getByText('prompt-456')).toBeInTheDocument();
    });

    it('should display review ID', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      expect(screen.getByText('review-789')).toBeInTheDocument();
    });

    it('should display call log ID', () => {
      render(<EvaluationScorecard {...defaultProps} />);
      expect(screen.getByText('call-101')).toBeInTheDocument();
    });

    it('should show dash for missing IDs', () => {
      render(
        <EvaluationScorecard
          {...defaultProps}
          agentId={null}
          promptId={null}
          reviewId={null}
          callLogId={null}
        />
      );
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(4);
    });
  });
});

