/**
 * Attestation Types - Verification & Validation Infrastructure
 * 
 * SOLID Principles:
 * - Single Responsibility: Each interface has one clear purpose
 * - Interface Segregation: Small, focused interfaces
 * 
 * Purpose: Define the shape of attestation data to prove what the model saw
 */

/**
 * Learned snippet that was applied to the model's context
 */
export interface AppliedSnippet {
  /** Unique identifier for the snippet */
  id: string;
  /** Trigger condition or original question */
  trigger: string;
  /** The learned response or correction */
  content: string;
  /** Character length of the snippet */
  charLength: number;
  /** When this snippet was learned/applied */
  appliedAt: number;
  /** Source of the snippet (voice-agent, owner, niche, global) */
  source: 'voice-agent' | 'owner' | 'niche' | 'global';
}

/**
 * Token budget tracking for the request
 */
export interface TokenBudget {
  /** Total tokens in the request */
  total: number;
  /** Tokens used by system prompt */
  systemPrompt: number;
  /** Tokens used by SPEC JSON */
  spec: number;
  /** Tokens used by learned snippets */
  snippets: number;
  /** Tokens used by context JSON */
  context: number;
  /** Tokens used by conversation summary */
  summary: number;
  /** Tokens used by last N turns */
  lastTurns: number;
  /** Maximum allowed tokens */
  maxTokens: number;
  /** Whether budget was exceeded */
  exceeded: boolean;
}

/**
 * Diagnostic information about why training might not be applied
 */
export interface AttestationDiagnostic {
  /** Severity level */
  level: 'info' | 'warning' | 'error';
  /** Diagnostic code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Suggested fix */
  suggestion?: string;
  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Per-turn attestation - proof of what the model saw
 * This is the "receipt" for each request to the model
 */
export interface TurnAttestation {
  /** Unique identifier for this turn */
  turnId: string;
  /** Timestamp when attestation was generated */
  timestamp: number;
  
  // === Scope & Versioning ===
  /** Scope identifier: scope:locationId:agentId:promptHash */
  scopeId: string;
  /** Location/franchise identifier */
  locationId: string;
  /** Agent identifier */
  agentId: string;
  /** Hash of the system prompt (first 16 chars of SHA-256) */
  promptHash: string;
  /** Hash of the SPEC JSON (first 16 chars of SHA-256) */
  specHash: string;
  /** Scope used specifically for snippet lookup (may differ during ablations) */
  snippetScopeId?: string;
  
  // === What Was Applied ===
  /** Learned snippets that were injected (empty array if none) */
  snippetsApplied: AppliedSnippet[];
  /** Number of conversation turns included */
  lastTurnsUsed: number;
  /** Whether conversation summary was included */
  summaryIncluded: boolean;
  
  // === Token Budget ===
  /** Token budget breakdown */
  tokenBudget: TokenBudget;
  
  // === Model Configuration ===
  /** Model used (e.g., gpt-4o-mini) */
  model: string;
  /** Temperature setting */
  temperature: number;
  /** Max tokens setting */
  maxTokens: number;
  
  // === Diagnostics ===
  /** Any diagnostic warnings or errors */
  diagnostics: AttestationDiagnostic[];
  
  // === Flags ===
  /** Whether learned snippets feature is enabled */
  snippetsEnabled: boolean;
  /** Whether response guard is active */
  guardEnabled: boolean;
  /** Memory source used for snippet retrieval */
  memorySource?: 'localStorage' | 'context7' | 'hybrid';
}

/**
 * Session-level attestation summary
 * Aggregates attestation data across multiple turns
 */
export interface SessionAttestation {
  /** Session/conversation identifier */
  conversationId: string;
  /** When session started */
  startedAt: number;
  /** When session ended (null if ongoing) */
  endedAt: number | null;
  
  /** Scope identifier for this session */
  scopeId: string;
  
  /** Per-turn attestations */
  turns: TurnAttestation[];
  
  /** Session-level diagnostics */
  sessionDiagnostics: AttestationDiagnostic[];
  
  /** Total snippets applied across all turns */
  totalSnippetsApplied: number;
  /** Average token usage per turn */
  avgTokensPerTurn: number;
  /** Number of budget overflows */
  budgetOverflowCount: number;
}

/**
 * Attestation comparison for A/B testing
 * Compares two attestations (with/without snippets)
 */
export interface AttestationComparison {
  /** Attestation with snippets enabled */
  withSnippets: TurnAttestation;
  /** Attestation with snippets disabled */
  withoutSnippets: TurnAttestation;
  /** Differences detected */
  differences: {
    snippetCount: number;
    tokenDelta: number;
    diagnosticDelta: number;
  };
  /** Timestamp of comparison */
  comparedAt: number;
}

/**
 * Verification result - proves training is working
 */
export interface VerificationResult {
  /** Whether verification passed */
  passed: boolean;
  /** Verification timestamp */
  timestamp: number;
  /** Checks performed */
  checks: {
    /** scopeId is properly generated */
    scopeIdValid: boolean;
    /** SPEC hash matches between grader and runtime */
    specHashMatch: boolean;
    /** Snippets were applied when expected */
    snippetsApplied: boolean;
    /** Token budget is within limits */
    tokenBudgetOK: boolean;
    /** Response guard is active */
    guardActive: boolean;
  };
  /** Overall verification message */
  message: string;
  /** Failed checks with details */
  failures: Array<{
    check: string;
    reason: string;
    fix: string;
  }>;
}

