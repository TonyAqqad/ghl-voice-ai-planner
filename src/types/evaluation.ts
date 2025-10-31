export interface EvaluationResult {
  pass: boolean;
  rubricScores: Record<string, number>;
  improvementNotes: string[];
  confidenceScore: number;
  suggestedPromptPatch?: Record<string, unknown> | null;
  suggestedKbAddition?: Record<string, unknown> | null;
}

export interface EvaluationScorecardProps {
  evaluation: EvaluationResult | null;
  isOpen: boolean;
  onClose: () => void;
}

