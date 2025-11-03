/**
 * Diagnostics System - Detect why training isn't working
 * 
 * SOLID Principles:
 * - Single Responsibility: Diagnose training issues
 * - Open/Closed: Extensible with new diagnostic checks
 * 
 * Purpose: Surface root causes when training doesn't apply
 */

import {
  TurnAttestation,
  AttestationDiagnostic,
  VerificationResult,
} from './attestationTypes';
import { attestationStore } from './attestationStore';
import { extractSpecFromPrompt } from '../spec/specExtract';
import { generatePromptHash } from '../prompt/masterOrchestrator';

/**
 * Diagnostic report for a scope
 */
export interface DiagnosticReport {
  scopeId: string;
  timestamp: number;
  checks: {
    scopeIdValid: boolean;
    specHashConsistent: boolean;
    snippetsBeingApplied: boolean;
    tokenBudgetHealthy: boolean;
    injectionOrderCorrect: boolean;
    guardActive: boolean;
  };
  issues: AttestationDiagnostic[];
  recommendations: string[];
  overallHealth: 'healthy' | 'warning' | 'critical';
}

/**
 * Run comprehensive diagnostics on a scope
 * Checks all attestations for this scope and surfaces issues
 */
export async function runScopeDiagnostics(
  scopeId: string,
  expectedPromptHash?: string,
  expectedSpecHash?: string
): Promise<DiagnosticReport> {
  console.log(`🔍 Running diagnostics for scope: ${scopeId}`);
  
  const attestations = attestationStore.getTurnAttestationsByScope(scopeId, 100);
  const issues: AttestationDiagnostic[] = [];
  const recommendations: string[] = [];
  
  const timestamp = Date.now();
  
  // Check 1: scopeId is properly formatted
  const scopeIdValid = validateScopeIdFormat(scopeId);
  if (!scopeIdValid) {
    issues.push({
      level: 'error',
      code: 'INVALID_SCOPE_ID',
      message: `scopeId format invalid: ${scopeId}`,
      suggestion: 'scopeId must be in format: scope:locationId:agentId:promptHash',
    });
    recommendations.push('Fix scopeId generation in compileRuntimeContext');
  }
  
  // Check 2: SPEC hash is consistent across attestations
  const specHashes = attestations.map((a) => a.specHash);
  const uniqueSpecHashes = [...new Set(specHashes)];
  const specHashConsistent = uniqueSpecHashes.length <= 1;
  
  if (!specHashConsistent) {
    issues.push({
      level: 'warning',
      code: 'SPEC_HASH_MISMATCH',
      message: `Multiple SPEC hashes detected: ${uniqueSpecHashes.join(', ')}`,
      suggestion: 'SPEC may have changed mid-session. Ensure grader uses same SPEC as runtime.',
      context: {
        uniqueHashes: uniqueSpecHashes,
        count: uniqueSpecHashes.length,
      },
    });
    recommendations.push(
      'Verify SPEC JSON is embedded consistently in system prompt'
    );
  }
  
  if (expectedSpecHash && uniqueSpecHashes[0] !== expectedSpecHash) {
    issues.push({
      level: 'error',
      code: 'SPEC_HASH_MISMATCH_WITH_EXPECTED',
      message: `SPEC hash mismatch: got ${uniqueSpecHashes[0]}, expected ${expectedSpecHash}`,
      suggestion: 'Runtime and grader are using different SPECs!',
    });
    recommendations.push('Regenerate SPEC hash and ensure consistency');
  }
  
  // Check 3: Snippets are being applied (if enabled)
  const snippetsEnabledCount = attestations.filter((a) => a.snippetsEnabled).length;
  const snippetsAppliedCount = attestations.filter(
    (a) => a.snippetsEnabled && a.snippetsApplied.length > 0
  ).length;
  
  const snippetsBeingApplied =
    snippetsEnabledCount === 0 || snippetsAppliedCount > 0;
  
  if (snippetsEnabledCount > 0 && snippetsAppliedCount === 0) {
    issues.push({
      level: 'error',
      code: 'SNIPPETS_NOT_APPLIED',
      message: `Snippets enabled but never applied (${snippetsEnabledCount} turns)`,
      suggestion: 'Check if snippets exist in storage for this scopeId. May need to approve corrections.',
      context: {
        snippetsEnabledCount,
        snippetsAppliedCount: 0,
      },
    });
    recommendations.push(
      'Review masterStore.getScopedLearnedSnippets() - may be empty'
    );
    recommendations.push('Check if corrections have been approved and applied');
  }
  
  // Check 4: Token budget is healthy (not consistently exceeded)
  const budgetExceededCount = attestations.filter(
    (a) => a.tokenBudget.exceeded
  ).length;
  const budgetExceededRatio = budgetExceededCount / attestations.length;
  const tokenBudgetHealthy = budgetExceededRatio < 0.2; // <20% is acceptable
  
  if (!tokenBudgetHealthy) {
    issues.push({
      level: 'error',
      code: 'TOKEN_BUDGET_FREQUENTLY_EXCEEDED',
      message: `Token budget exceeded in ${budgetExceededCount}/${attestations.length} turns (${Math.round(budgetExceededRatio * 100)}%)`,
      suggestion: 'Reduce context size or increase maxTokens. Snippets may be truncated.',
      context: {
        exceededCount: budgetExceededCount,
        totalTurns: attestations.length,
        ratio: budgetExceededRatio,
      },
    });
    recommendations.push('Increase maxTokens to 8192 or reduce conversation history');
    recommendations.push('Limit snippets to top 3 most relevant (instead of 5)');
  }
  
  // Check 5: Injection order is correct (snippets before lastTurns)
  // This is implicit in compileRuntimeContext, but we can check token distribution
  const avgSnippetTokens =
    attestations.length > 0
      ? attestations.reduce((sum, a) => sum + a.tokenBudget.snippets, 0) /
        attestations.length
      : 0;
  const avgLastTurnsTokens =
    attestations.length > 0
      ? attestations.reduce((sum, a) => sum + a.tokenBudget.lastTurns, 0) /
        attestations.length
      : 0;
  
  // If snippets are enabled but using 0 tokens, injection may be failing
  const injectionOrderCorrect =
    !snippetsEnabledCount || avgSnippetTokens > 0;
  
  if (snippetsEnabledCount > 0 && avgSnippetTokens === 0) {
    issues.push({
      level: 'error',
      code: 'SNIPPET_INJECTION_FAILED',
      message: 'Snippets enabled but consuming 0 tokens - injection may be failing',
      suggestion: 'Check compileRuntimeContext message assembly order',
      context: {
        avgSnippetTokens,
        avgLastTurnsTokens,
      },
    });
    recommendations.push(
      'Verify snippets are added to messages array BEFORE lastTurns'
    );
  }
  
  // Check 6: Guard is active (if expected)
  const guardActiveCount = attestations.filter((a) => a.guardEnabled).length;
  const guardActive = guardActiveCount > attestations.length * 0.5; // >50%
  
  if (!guardActive) {
    issues.push({
      level: 'warning',
      code: 'GUARD_MOSTLY_DISABLED',
      message: `Guard enabled in only ${guardActiveCount}/${attestations.length} turns`,
      suggestion: 'Enable guard to enforce SPEC rules (one-question, no early booking)',
    });
    recommendations.push('Set guardEnabled: true in RuntimeContextRequest');
  }
  
  // Determine overall health
  const errorCount = issues.filter((i) => i.level === 'error').length;
  const warningCount = issues.filter((i) => i.level === 'warning').length;
  
  let overallHealth: 'healthy' | 'warning' | 'critical';
  if (errorCount > 0) {
    overallHealth = 'critical';
  } else if (warningCount > 0) {
    overallHealth = 'warning';
  } else {
    overallHealth = 'healthy';
  }
  
  console.log(`🔍 Diagnostics complete: ${overallHealth.toUpperCase()}`);
  console.log(`   Errors: ${errorCount}, Warnings: ${warningCount}`);
  
  return {
    scopeId,
    timestamp,
    checks: {
      scopeIdValid,
      specHashConsistent,
      snippetsBeingApplied,
      tokenBudgetHealthy,
      injectionOrderCorrect,
      guardActive,
    },
    issues,
    recommendations: [...new Set(recommendations)], // Deduplicate
    overallHealth,
  };
}

/**
 * Verify a single attestation meets expected criteria
 */
export function verifyAttestation(
  attestation: TurnAttestation,
  expected: {
    scopeId: string;
    specHash: string;
    snippetsExpected: boolean;
  }
): VerificationResult {
  const timestamp = Date.now();
  const checks = {
    scopeIdValid: attestation.scopeId === expected.scopeId,
    specHashMatch: attestation.specHash === expected.specHash,
    snippetsApplied:
      !expected.snippetsExpected || attestation.snippetsApplied.length > 0,
    tokenBudgetOK: !attestation.tokenBudget.exceeded,
    guardActive: attestation.guardEnabled,
  };
  
  const failures: Array<{ check: string; reason: string; fix: string }> = [];
  
  if (!checks.scopeIdValid) {
    failures.push({
      check: 'scopeId',
      reason: `Expected ${expected.scopeId}, got ${attestation.scopeId}`,
      fix: 'Verify locationId, agentId, and promptHash are correct',
    });
  }
  
  if (!checks.specHashMatch) {
    failures.push({
      check: 'specHash',
      reason: `Expected ${expected.specHash}, got ${attestation.specHash}`,
      fix: 'Ensure SPEC JSON is identical between runtime and grader',
    });
  }
  
  if (!checks.snippetsApplied) {
    failures.push({
      check: 'snippetsApplied',
      reason: 'Expected snippets but none were applied',
      fix: 'Check if snippets exist in storage and snippetsEnabled=true',
    });
  }
  
  if (!checks.tokenBudgetOK) {
    failures.push({
      check: 'tokenBudget',
      reason: `Token budget exceeded: ${attestation.tokenBudget.total} / ${attestation.tokenBudget.maxTokens}`,
      fix: 'Increase maxTokens or reduce context size',
    });
  }
  
  if (!checks.guardActive) {
    failures.push({
      check: 'guard',
      reason: 'Response guard is disabled',
      fix: 'Enable guard to enforce SPEC rules',
    });
  }
  
  const passed = failures.length === 0;
  
  return {
    passed,
    timestamp,
    checks,
    message: passed
      ? '✅ Attestation verification passed'
      : `❌ Attestation verification failed: ${failures.length} issue(s)`,
    failures,
  };
}

/**
 * Validate scopeId format
 */
function validateScopeIdFormat(scopeId: string): boolean {
  // Expected format: scope:locationId:agentId:promptHash
  const parts = scopeId.split(':');
  if (parts.length !== 4) return false;
  if (parts[0] !== 'scope') return false;
  if (!parts[1] || parts[1].length === 0) return false; // locationId
  if (!parts[2] || parts[2].length === 0) return false; // agentId
  if (!parts[3] || parts[3].length < 8) return false; // promptHash (at least 8 chars)
  return true;
}

/**
 * Compare two attestations and surface differences
 */
export function compareAttestations(
  a: TurnAttestation,
  b: TurnAttestation
): {
  scopeIdMatch: boolean;
  specHashMatch: boolean;
  snippetDelta: number;
  tokenDelta: number;
  differences: string[];
} {
  const differences: string[] = [];
  
  const scopeIdMatch = a.scopeId === b.scopeId;
  if (!scopeIdMatch) {
    differences.push(
      `scopeId mismatch: ${a.scopeId} vs ${b.scopeId}`
    );
  }
  
  const specHashMatch = a.specHash === b.specHash;
  if (!specHashMatch) {
    differences.push(
      `specHash mismatch: ${a.specHash} vs ${b.specHash}`
    );
  }
  
  const snippetDelta = a.snippetsApplied.length - b.snippetsApplied.length;
  if (snippetDelta !== 0) {
    differences.push(
      `Snippet count delta: ${snippetDelta > 0 ? '+' : ''}${snippetDelta}`
    );
  }
  
  const tokenDelta = a.tokenBudget.total - b.tokenBudget.total;
  if (Math.abs(tokenDelta) > 10) {
    // Ignore tiny differences
    differences.push(
      `Token delta: ${tokenDelta > 0 ? '+' : ''}${tokenDelta}`
    );
  }
  
  return {
    scopeIdMatch,
    specHashMatch,
    snippetDelta,
    tokenDelta,
    differences,
  };
}

/**
 * Generate diagnostic report summary as markdown
 */
export function formatDiagnosticReport(report: DiagnosticReport): string {
  const healthEmoji = {
    healthy: '✅',
    warning: '⚠️',
    critical: '❌',
  };
  
  let md = `# Diagnostic Report\n\n`;
  md += `**Scope:** \`${report.scopeId}\`\n`;
  md += `**Status:** ${healthEmoji[report.overallHealth]} ${report.overallHealth.toUpperCase()}\n`;
  md += `**Timestamp:** ${new Date(report.timestamp).toISOString()}\n\n`;
  
  md += `## Checks\n\n`;
  for (const [check, passed] of Object.entries(report.checks)) {
    md += `- ${passed ? '✅' : '❌'} ${check}\n`;
  }
  
  if (report.issues.length > 0) {
    md += `\n## Issues\n\n`;
    for (const issue of report.issues) {
      const emoji = { info: 'ℹ️', warning: '⚠️', error: '❌' };
      md += `### ${emoji[issue.level]} ${issue.code}\n`;
      md += `**Message:** ${issue.message}\n`;
      if (issue.suggestion) {
        md += `**Suggestion:** ${issue.suggestion}\n`;
      }
      md += `\n`;
    }
  }
  
  if (report.recommendations.length > 0) {
    md += `## Recommendations\n\n`;
    for (let i = 0; i < report.recommendations.length; i++) {
      md += `${i + 1}. ${report.recommendations[i]}\n`;
    }
  }
  
  return md;
}

