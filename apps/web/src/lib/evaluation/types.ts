export type ContactFieldKey =
  | 'first_name'
  | 'last_name'
  | 'unique_phone_number'
  | 'email'
  | 'class_date__time';

export interface ConversationTurn {
  id: string;
  role: 'agent' | 'caller';
  text: string;
  ts: number;
}

export interface FieldCapture {
  key: ContactFieldKey;
  value: string;
  turnId: string;
  valid: boolean;
  source: 'detected' | 'manual';
}

export type RubricKey =
  | 'fieldCollection'
  | 'bookingRules'
  | 'tone'
  | 'objectionHandling'
  | 'questionCadence'
  | 'verification';

export interface RubricScore {
  key: RubricKey;
  score: number | null;
  notes?: string;
  evidenceTurnIds: string[];
}

export interface SessionEvaluation {
  conversationId: string;
  agentId: string;
  niche?: string;
  startedAt: number;
  endedAt: number;
  collectedFields: FieldCapture[];
  rubric: RubricScore[];
  confidence: number;
  correctionsApplied: number;
  version: string;
  transcript?: ConversationTurn[];
}

