export interface ActionTrigger {
  name: string;
  type: string;
  turn: number;
  totalTurns: number;
  timely: boolean;
  success: boolean;
  parameters?: Record<string, unknown>;
}

export interface CollectedField {
  field: string;
  label: string;
  value: string | null;
  collected: boolean;
  icon: string;
}

export interface EvaluationResult {
  pass: boolean;
  rubricScores: Record<string, number>;
  improvementNotes: string[];
  confidenceScore: number;
  suggestedPromptPatch?: Record<string, unknown> | null;
  suggestedKbAddition?: Record<string, unknown> | null;
  actionTriggers?: ActionTrigger[];
  collectedFields?: CollectedField[];
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

