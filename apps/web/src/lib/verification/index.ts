/**
 * Verification Infrastructure - Step C Exports
 * 
 * SOLID Principles:
 * - Interface Segregation: Export focused, single-purpose modules
 * - Dependency Inversion: All modules depend on abstractions
 * 
 * Purpose: Central export point for verification/validation system
 */

// === Types ===
export type {
  TurnAttestation,
  AppliedSnippet,
  TokenBudget,
  AttestationDiagnostic,
  SessionAttestation,
  AttestationComparison,
  VerificationResult,
} from './attestationTypes';

// === Attestation Generation ===
export {
  generateTurnAttestation,
  aggregateSessionAttestation,
  verifyAttestation as verifyAttestationData,
} from './attestationGenerator';
export type {
  AttestationConfig,
  AssembledContext,
} from './attestationGenerator';

// === Attestation Storage ===
export {
  attestationStore,
  getAttestationStats,
  exportAttestations,
} from './attestationStore';
export type { IAttestationStorage } from './attestationStore';

// === A/B Testing ===
export {
  runABTest,
  runSessionABTest,
  replaySessionWithABTest,
  scoreResponseByRubric,
} from './abTesting';
export type {
  ABTestConfig,
  ABTestResult,
} from './abTesting';

// === Diagnostics ===
export {
  runScopeDiagnostics,
  verifyAttestation,
  compareAttestations,
  formatDiagnosticReport,
} from './diagnostics';
export type {
  DiagnosticReport,
} from './diagnostics';

// === Runtime Context Compilation (from masterOrchestrator) ===
export {
  compileRuntimeContext,
  guardResponse,
  scopeId,
  generatePromptHash,
} from '../prompt/masterOrchestrator';
export type {
  RuntimeContextRequest,
  CompiledRuntimeContext,
} from '../prompt/masterOrchestrator';

// === Memory Adapter (Context7 + localStorage hybrid) ===
export {
  getMemoryAdapter,
  resetMemoryAdapter,
  MemoryAdapter,
} from './memoryAdapter';
export type {
  MemorySource,
  MemorySnippet,
  MemoryAdapterConfig,
  MemoryResult,
} from './memoryAdapter';

/**
 * Quick Start Guide:
 * 
 * 1. Compile runtime context with attestation:
 * ```typescript
 * import { compileRuntimeContext } from '@/lib/verification';
 * 
 * const request = {
 *   locationId: 'LOC123',
 *   agentId: 'AGENT456',
 *   systemPrompt: myPrompt,
 *   contextJson: JSON.stringify(context),
 *   turnId: 'turn-1',
 *   snippetsEnabled: true,
 *   guardEnabled: true,
 * };
 * 
 * const compiled = await compileRuntimeContext(request);
 * 
 * // compiled.attestation contains verification receipt
 * // compiled.messages contains messages to send to model
 * // compiled.scopeId is the unique scope identifier
 * ```
 * 
 * 2. Guard the response before displaying:
 * ```typescript
 * import { guardResponse } from '@/lib/verification';
 * 
 * const result = guardResponse(spec, collectedFields, modelResponse);
 * 
 * if (!result.approved) {
 *   console.error('Blocked:', result.blockedViolation);
 *   // Handle blocked response
 * } else if (result.modifiedResponse) {
 *   // Use modified response instead
 *   display(result.modifiedResponse);
 * } else {
 *   display(modelResponse);
 * }
 * ```
 * 
 * 3. Display attestation in UI:
 * ```typescript
 * import { AttestationPanel } from '@/components/ui/AttestationPanel';
 * 
 * <AttestationPanel
 *   attestation={compiled.attestation}
 *   effectivePrompt={compiled.effectivePrompt}
 *   onCopyPrompt={() => navigator.clipboard.writeText(compiled.effectivePrompt)}
 * />
 * ```
 * 
 * 4. Run A/B test to verify training:
 * ```typescript
 * import { runABTest } from '@/lib/verification';
 * 
 * const result = await runABTest({
 *   request,
 *   modelCall: async (messages) => {
 *     const response = await openai.chat.completions.create({
 *       model: 'gpt-4o-mini',
 *       messages,
 *     });
 *     return response.choices[0].message.content;
 *   },
 *   evaluateResponse: (response) => scoreResponseByRubric(response, criteria),
 * });
 * 
 * console.log('Score Delta:', result.scoreDelta);
 * console.log('Improved?', result.improved);
 * ```
 * 
 * 5. Run diagnostics:
 * ```typescript
 * import { runScopeDiagnostics } from '@/lib/verification';
 * 
 * const report = await runScopeDiagnostics(scopeId);
 * 
 * console.log('Health:', report.overallHealth);
 * console.log('Issues:', report.issues);
 * console.log('Recommendations:', report.recommendations);
 * ```
 */

