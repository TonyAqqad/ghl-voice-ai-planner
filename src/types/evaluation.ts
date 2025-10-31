export interface EvaluationResult {
  pass: boolean;
  rubricScores: Record<string, number>;
  improvementNotes: string[];
  confidenceScore: number;
  suggestedPromptPatch?: Record<string, unknown> | null;
  suggestedKbAddition?: Record<string, unknown> | null;
}

export type ConversationSpeaker = 'user' | 'agent' | string;

export interface ConversationTurn {
  speaker: ConversationSpeaker;
  text: string;
  timestamp: number;
}

export interface ManualCorrectionPayload {
  messageIndex: number;
  originalResponse: string;
  correctedResponse: string;
  storeIn: 'prompt' | 'kb';
  reason?: string;
}

export interface EvaluationScorecardProps {
  evaluation: EvaluationResult | null;
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationTurn[];
  agentId: string | null;
  promptId: string | null;
  reviewId: string | null;
  callLogId: string | null;
  onSaveCorrection: (payload: ManualCorrectionPayload) => Promise<void>;
  savingCorrection: boolean;
  correctionConfirmation: string | null;
}

