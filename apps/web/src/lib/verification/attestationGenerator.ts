/**
 * Attestation Generator - Creates verification receipts
 * 
 * SOLID Principles:
 * - Single Responsibility: Generates attestation data
 * - Dependency Inversion: Depends on abstractions (types)
 * - Open/Closed: Extensible via composition
 * 
 * Purpose: Generate per-turn attestation to prove what the model saw
 */

import {
  TurnAttestation,
  AppliedSnippet,
  TokenBudget,
  AttestationDiagnostic,
  SessionAttestation,
} from './attestationTypes';
import { generatePromptHash } from '../prompt/masterOrchestrator';
import { extractSpecFromPrompt } from '../spec/specExtract';

/**
 * Configuration for attestation generation
 */
export interface AttestationConfig {
  locationId: string;
  agentId: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  snippetsEnabled: boolean;
  guardEnabled: boolean;
}

/**
 * Context assembled for the model
 */
export interface AssembledContext {
  systemPrompt: string;
  specJson: string;
  snippets: AppliedSnippet[];
  contextJson: string;
  summary: string;
  lastTurns: string[];
}

/**
 * Generate a turn attestation
 * This is the core verification receipt
 */
export async function generateTurnAttestation(
  turnId: string,
  config: AttestationConfig,
  assembledContext: AssembledContext
): Promise<TurnAttestation> {
  const timestamp = Date.now();
  
  // Generate prompt hash
  const promptHash = await generatePromptHash(config.systemPrompt);
  
  // Extract and hash SPEC
  const spec = extractSpecFromPrompt(config.systemPrompt);
  const specJson = JSON.stringify(spec);
  const specHash = await generatePromptHash(specJson);
  
  // Generate scopeId
  const scopeId = `scope:${config.locationId}:${config.agentId}:${promptHash}`;
  
  // Calculate token budget
  const tokenBudget = calculateTokenBudget(assembledContext, config.maxTokens);
  
  // Generate diagnostics
  const diagnostics = generateDiagnostics(
    scopeId,
    promptHash,
    specHash,
    assembledContext.snippets,
    tokenBudget,
    config
  );
  
  return {
    turnId,
    timestamp,
    scopeId,
    locationId: config.locationId,
    agentId: config.agentId,
    promptHash,
    specHash,
    snippetsApplied: assembledContext.snippets,
    lastTurnsUsed: assembledContext.lastTurns.length,
    summaryIncluded: assembledContext.summary.length > 0,
    tokenBudget,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    diagnostics,
    snippetsEnabled: config.snippetsEnabled,
    guardEnabled: config.guardEnabled,
  };
}

/**
 * Calculate token budget breakdown
 * Uses simple heuristic: chars / 4 ≈ tokens
 */
function calculateTokenBudget(
  context: AssembledContext,
  maxTokens: number
): TokenBudget {
  const estimate = (text: string) => Math.ceil(text.length / 4);
  
  const systemPromptTokens = estimate(context.systemPrompt);
  const specTokens = estimate(context.specJson);
  const snippetsTokens = context.snippets.reduce(
    (sum, s) => sum + estimate(s.content),
    0
  );
  const contextTokens = estimate(context.contextJson);
  const summaryTokens = estimate(context.summary);
  const lastTurnsTokens = context.lastTurns.reduce(
    (sum, turn) => sum + estimate(turn),
    0
  );
  
  const total =
    systemPromptTokens +
    specTokens +
    snippetsTokens +
    contextTokens +
    summaryTokens +
    lastTurnsTokens;
  
  return {
    total,
    systemPrompt: systemPromptTokens,
    spec: specTokens,
    snippets: snippetsTokens,
    context: contextTokens,
    summary: summaryTokens,
    lastTurns: lastTurnsTokens,
    maxTokens,
    exceeded: total > maxTokens,
  };
}

/**
 * Generate diagnostic warnings/errors
 * Helps identify why training might not be working
 */
function generateDiagnostics(
  scopeId: string,
  promptHash: string,
  specHash: string,
  snippets: AppliedSnippet[],
  tokenBudget: TokenBudget,
  config: AttestationConfig
): AttestationDiagnostic[] {
  const diagnostics: AttestationDiagnostic[] = [];
  
  // Check 1: Token budget exceeded
  if (tokenBudget.exceeded) {
    diagnostics.push({
      level: 'error',
      code: 'TOKEN_BUDGET_EXCEEDED',
      message: `Token budget exceeded: ${tokenBudget.total} / ${tokenBudget.maxTokens}`,
      suggestion: 'Reduce context size or increase maxTokens. Consider truncating conversation history.',
      context: {
        total: tokenBudget.total,
        maxTokens: tokenBudget.maxTokens,
        overflow: tokenBudget.total - tokenBudget.maxTokens,
      },
    });
  }
  
  // Check 2: Snippets enabled but none applied
  if (config.snippetsEnabled && snippets.length === 0) {
    diagnostics.push({
      level: 'warning',
      code: 'NO_SNIPPETS_APPLIED',
      message: 'Learned snippets are enabled but none were applied',
      suggestion: 'Check if snippets exist for this scopeId in storage. May need to approve pending corrections.',
      context: {
        scopeId,
        snippetsEnabled: true,
        snippetsCount: 0,
      },
    });
  }
  
  // Check 3: Too many snippets (>5)
  if (snippets.length > 5) {
    diagnostics.push({
      level: 'warning',
      code: 'TOO_MANY_SNIPPETS',
      message: `${snippets.length} snippets applied (recommended max: 5)`,
      suggestion: 'Limit snippets to top 5 most relevant to avoid token budget issues.',
      context: {
        snippetsCount: snippets.length,
        recommendedMax: 5,
      },
    });
  }
  
  // Check 4: Snippets too long (>200 chars each)
  const longSnippets = snippets.filter(s => s.charLength > 200);
  if (longSnippets.length > 0) {
    diagnostics.push({
      level: 'warning',
      code: 'SNIPPETS_TOO_LONG',
      message: `${longSnippets.length} snippets exceed 200 chars`,
      suggestion: 'Compress snippets to ≤200 chars each for token efficiency.',
      context: {
        longSnippetsCount: longSnippets.length,
        snippetIds: longSnippets.map(s => s.id),
      },
    });
  }
  
  // Check 5: Guard disabled
  if (!config.guardEnabled) {
    diagnostics.push({
      level: 'info',
      code: 'GUARD_DISABLED',
      message: 'Response guard is disabled',
      suggestion: 'Enable guard to enforce one-question cadence and booking rules.',
    });
  }
  
  // Check 6: Prompt hash is too short (security)
  if (promptHash.length < 16) {
    diagnostics.push({
      level: 'warning',
      code: 'WEAK_PROMPT_HASH',
      message: 'Prompt hash is too short, may cause collisions',
      suggestion: 'Use at least 16 characters of SHA-256 hash.',
      context: {
        hashLength: promptHash.length,
        recommendedLength: 16,
      },
    });
  }
  
  return diagnostics;
}

/**
 * Aggregate turn attestations into session attestation
 */
export function aggregateSessionAttestation(
  conversationId: string,
  scopeId: string,
  turnAttestations: TurnAttestation[],
  startedAt: number,
  endedAt: number | null
): SessionAttestation {
  const totalSnippetsApplied = turnAttestations.reduce(
    (sum, turn) => sum + turn.snippetsApplied.length,
    0
  );
  
  const avgTokensPerTurn =
    turnAttestations.length > 0
      ? Math.round(
          turnAttestations.reduce((sum, turn) => sum + turn.tokenBudget.total, 0) /
            turnAttestations.length
        )
      : 0;
  
  const budgetOverflowCount = turnAttestations.filter(
    (turn) => turn.tokenBudget.exceeded
  ).length;
  
  // Aggregate session-level diagnostics
  const sessionDiagnostics: AttestationDiagnostic[] = [];
  
  if (budgetOverflowCount > 0) {
    sessionDiagnostics.push({
      level: 'error',
      code: 'MULTIPLE_BUDGET_OVERFLOWS',
      message: `Token budget exceeded on ${budgetOverflowCount} turns`,
      suggestion: 'Review token budget settings and context size.',
      context: {
        overflowCount: budgetOverflowCount,
        totalTurns: turnAttestations.length,
      },
    });
  }
  
  if (totalSnippetsApplied === 0 && turnAttestations.some(t => t.snippetsEnabled)) {
    sessionDiagnostics.push({
      level: 'warning',
      code: 'NO_SNIPPETS_USED_IN_SESSION',
      message: 'No snippets were applied during entire session',
      suggestion: 'Check if snippets exist for this scopeId or if they were disabled.',
    });
  }
  
  return {
    conversationId,
    startedAt,
    endedAt,
    scopeId,
    turns: turnAttestations,
    sessionDiagnostics,
    totalSnippetsApplied,
    avgTokensPerTurn,
    budgetOverflowCount,
  };
}

/**
 * Verify attestation matches expected values
 * Returns true if attestation proves training is working
 */
export function verifyAttestation(
  attestation: TurnAttestation,
  expected: {
    snippetsExpected: boolean;
    scopeIdExpected: string;
    specHashExpected: string;
  }
): {
  valid: boolean;
  failures: string[];
} {
  const failures: string[] = [];
  
  // Check scopeId matches
  if (attestation.scopeId !== expected.scopeIdExpected) {
    failures.push(
      `scopeId mismatch: got ${attestation.scopeId}, expected ${expected.scopeIdExpected}`
    );
  }
  
  // Check specHash matches
  if (attestation.specHash !== expected.specHashExpected) {
    failures.push(
      `specHash mismatch: got ${attestation.specHash}, expected ${expected.specHashExpected}`
    );
  }
  
  // Check snippets were applied when expected
  if (expected.snippetsExpected && attestation.snippetsApplied.length === 0) {
    failures.push('Expected snippets to be applied but none were found');
  }
  
  // Check token budget
  if (attestation.tokenBudget.exceeded) {
    failures.push('Token budget exceeded, may cause truncation');
  }
  
  return {
    valid: failures.length === 0,
    failures,
  };
}

