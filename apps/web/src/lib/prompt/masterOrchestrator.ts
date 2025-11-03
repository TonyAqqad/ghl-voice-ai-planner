/**
 * Master Orchestrator - 3-Layer Architecture Entry Point
 * 
 * Coordinates:
 * 1. Master composes Client/Voice agent prompt
 * 2. Client runs conversation
 * 3. Master evaluates after-call
 * 4. Runtime context compilation with attestation (Step C verification)
 */

import { MinimalContext, truncateContextValues, CONTACT_KEYS } from './fieldSet';
import { ConversationTurn, SessionEvaluation } from '../evaluation/types';
import { evaluateSession } from '../evaluation/sessionEvaluator';
import { applyManualCorrections as storeManualCorrections, saveSession, getScopedLearnedSnippets } from '../evaluation/masterStore';
import { PromptSpec } from '../spec/specTypes';
import { extractSpecFromPrompt } from '../spec/specExtract';
import { TurnAttestation, AppliedSnippet } from '../verification/attestationTypes';
import { generateTurnAttestation, AssembledContext, AttestationConfig } from '../verification/attestationGenerator';
import { attestationStore } from '../verification/attestationStore';
import { getMemoryAdapter, type MemorySource } from '../verification/memoryAdapter';
import { useStore } from '../../store/useStore';

const SPEC_BLOCK_REGEX = /<!--\s*SPEC_JSON_START\s*-->[\s\S]*?<!--\s*SPEC_JSON_END\s*-->/gi;

function stripSpecFromPrompt(prompt: string): string {
  if (!prompt) return '';
  return prompt.replace(SPEC_BLOCK_REGEX, '').trim();
}

/**
 * Compose compact client prompt (≤600 tokens)
 * 
 * Structure:
 * 1. VOICE RULES (bullet points, not prose)
 * 2. REQUIRED FIELD ORDER
 * 3. CONTEXT (one-line JSON, truncated)
 * 4. NICHE OVERLAY (optional fitness-specific phrasing)
 */
export function composeClientPrompt({
  niche,
  minimalContext,
}: {
  niche: string;
  minimalContext: MinimalContext;
}): { system_prompt: string; meta: any } {
  
  // Truncate long values to keep context compact
  const context = truncateContextValues(minimalContext);
  
  // Build compact JSON context (one line)
  const contextJSON = JSON.stringify(context);
  
  // Build system prompt with strict structure
  const systemPrompt = `VOICE RULES:
• Ask 1 question per turn
• Respond in 1-2 sentences max
• Confirm information before moving to next question
• NO booking until ALL contact fields collected & confirmed

REQUIRED FIELD ORDER (must collect in sequence):
1. first_name
2. last_name
3. unique_phone_number
4. email
5. class_date__time

After collecting & confirming all 5 fields, proceed with booking.

CONTEXT: ${contextJSON}

${getNicheOverlay(niche)}

Remember: Keep responses brief, confirm each piece of information, and follow the field collection order strictly.`;

  return {
    system_prompt: systemPrompt,
    meta: {
      niche,
      contextSize: contextJSON.length,
      estimatedTokens: Math.ceil(systemPrompt.length / 4),
    }
  };
}

/**
 * Get niche-specific overlay text (keep very brief)
 */
function getNicheOverlay(niche: string): string {
  switch (niche) {
    case 'fitness_gym':
    case 'f45':
      return 'TONE: Energetic and motivating. Emphasize transformation and community. Build excitement about the trial class experience.';
    case 'martial_arts':
      return 'TONE: Respectful and disciplined. Emphasize personal growth and skill development. Build confidence in the training program.';
    case 'dental':
      return 'TONE: Professional and reassuring. Emphasize comfort and care. Build trust in the practice.';
    case 'med_spa':
    case 'medspa':
      return 'TONE: Professional and welcoming. Emphasize results and consultation process. Build excitement about treatments.';
    default:
      return 'TONE: Professional and friendly. Focus on understanding needs and providing helpful information.';
  }
}

/**
 * Evaluate conversation after call ends
 * Wrapper around existing sessionEvaluator with v2.0 version tag
 */
export function evaluateAfterCall(
  conversationId: string,
  turns: ConversationTurn[],
  agentId: string,
  niche?: string
): SessionEvaluation {
  // Use existing evaluator with new version and agent context
  const evaluation = evaluateSession(conversationId, turns, 'v2.0', agentId, niche);
  
  // Auto-save to masterStore
  saveSession(evaluation);
  
  return evaluation;
}

/**
 * Apply manual fix/correction to a response
 * Stores locally and optionally syncs to DB if feature flag enabled
 */
export async function applyManualFix({
  conversationId,
  turnId,
  correctedResponse,
  agentId,
  niche,
}: {
  conversationId: string;
  turnId: string;
  correctedResponse: string;
  agentId?: string;
  niche?: string;
}): Promise<SessionEvaluation | null> {
  
  // 1. Update masterStore locally (primary storage)
  const updated = storeManualCorrections(conversationId, {
    turnId,
    correctedResponse,
  });
  
  if (!updated) {
    console.warn(`Failed to apply correction: session ${conversationId} not found`);
    return null;
  }
  
  // 2. Optional DB sync (if window.__SAVE_CORRECTIONS_TO_DB__ === true)
  if (typeof window !== 'undefined' && (window as any).__SAVE_CORRECTIONS_TO_DB__) {
    try {
      const response = await fetch('/api/mcp/master/applyFix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agentId || 'system',
          niche: niche || 'default',
          conversationId,
          patch: { turnId, correctedResponse, timestamp: Date.now() },
        }),
      });
      
      if (!response.ok) {
        console.warn('DB sync returned non-OK status (non-fatal):', response.status);
      }
    } catch (e) {
      console.warn('DB sync failed (non-fatal):', e);
      // Don't throw - local storage succeeded, DB sync is optional
    }
  }
  
  return updated;
}

/**
 * Validate that all required contact fields are collected
 * Returns validation result with missing fields
 */
export function validateRequiredFields(
  collectedFields: Array<{ key: string; value: string; valid: boolean }>
): {
  valid: boolean;
  missing: string[];
  invalid: string[];
} {
  const missing: string[] = [];
  const invalid: string[] = [];
  
  CONTACT_KEYS.forEach(requiredKey => {
    const field = collectedFields.find(f => f.key === requiredKey);
    if (!field) {
      missing.push(requiredKey);
    } else if (!field.valid) {
      invalid.push(requiredKey);
    }
  });
  
  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}

/**
 * Estimate token count for context (simple heuristic: chars / 4)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Generate scope ID for location + agent + prompt version
 * Used to isolate learning, corrections, and sessions per unique configuration
 */
export function scopeId({
  locationId,
  agentId,
  promptHash,
}: {
  locationId: string;
  agentId: string;
  promptHash: string;
}): string {
  return `scope:${locationId}:${agentId}:${promptHash}`;
}

/**
 * Generate prompt hash (SHA-256 hex string, first 16 chars)
 * Uses Web Crypto API for consistent hashing
 */
export async function generatePromptHash(prompt: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback for non-browser environments - simple hash
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(prompt);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 16); // First 16 chars
  } catch (error) {
    console.error('Failed to generate prompt hash:', error);
    // Fallback
    return Date.now().toString(16).substring(0, 16);
  }
}

/**
 * Evaluate conversation after call ends (with spec support)
 * Wrapper around existing sessionEvaluator with optional spec parameter
 */
export function evaluateAfterCallWithSpec(
  conversationId: string,
  turns: ConversationTurn[],
  agentId: string,
  spec: PromptSpec | null,
  niche?: string
): SessionEvaluation {
  // Use evaluator with spec if provided
  const evaluation = evaluateSession(conversationId, turns, 'v2.0', agentId, niche, spec);
  
  // Auto-save to masterStore
  saveSession(evaluation);
  
  return evaluation;
}

// ============================================================================
// STEP C: RUNTIME CONTEXT COMPILATION WITH ATTESTATION
// ============================================================================

/**
 * Request parameters for runtime context compilation
 */
export interface RuntimeContextRequest {
  locationId: string;
  agentId: string;
  systemPrompt: string;
  contextJson: string;
  conversationSummary?: string;
  lastTurns?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  snippetsEnabled?: boolean;
  guardEnabled?: boolean;
  turnId: string;
  snippetScopeHash?: string;
}

/**
 * Compiled runtime context with attestation
 * This is the core of Step C - proving what the model saw
 */
export interface CompiledRuntimeContext {
  /** Final messages array to send to model */
  messages: Array<{ role: string; content: string }>;
  /** Attestation receipt proving what was assembled */
  attestation: TurnAttestation;
  /** Scope identifier */
  scopeId: string;
  /** Scope id used to resolve learned snippets (may differ when running ablations) */
  snippetScopeId: string;
  /** Prompt hash */
  promptHash: string;
  /** SPEC hash */
  specHash: string;
  /** Copy of effective prompt (for debugging) */
  effectivePrompt: string;
  /** System prompt applied to the model after spec stripping */
  systemPromptForModel: string;
}

/**
 * Compile runtime context with attestation
 * 
 * This is the CORE FUNCTION for Step C verification:
 * 1. Generates scopeId from location + agent + prompt hash
 * 2. Extracts SPEC and computes specHash
 * 3. Loads learned snippets for this scope (if enabled)
 * 4. Assembles messages in STRICT ORDER: SYSTEM → SPEC → SNIPPETS → CONTEXT → SUMMARY → LAST_TURNS
 * 5. Generates attestation receipt proving what the model saw
 * 6. Stores attestation for audit/debugging
 * 
 * SOLID Principles:
 * - Single Responsibility: Assembles context and generates attestation
 * - Open/Closed: Extensible via configuration parameters
 * - Dependency Inversion: Depends on attestation abstractions
 */
export async function compileRuntimeContext(
  request: RuntimeContextRequest
): Promise<CompiledRuntimeContext> {
  const {
    locationId,
    agentId,
    systemPrompt,
    contextJson,
    conversationSummary = '',
    lastTurns = [],
    model = 'gpt-4o-mini',
    temperature = 0.7,
  maxTokens = 4096,
  snippetsEnabled = true,
  guardEnabled = true,
  turnId,
  snippetScopeHash,
} = request;
  
  // Step 1: Generate prompt hash and runtime/snippet scope identifiers
  const promptHash = await generatePromptHash(systemPrompt);
  const runtimeScopeId = scopeId({ locationId, agentId, promptHash });
  const snippetHash = snippetScopeHash || promptHash;
  const snippetScopeId = scopeId({ locationId, agentId, promptHash: snippetHash });
  const systemPromptForModel = stripSpecFromPrompt(systemPrompt);
  
  console.log(`📊 compileRuntimeContext`);
  console.log(`   • runtime scopeId: ${runtimeScopeId}`);
  console.log(`   • snippet scopeId: ${snippetScopeId}`);
  console.log(`   • promptHash: ${promptHash}`);
  
  // Step 2: Extract SPEC and compute specHash
  const spec = extractSpecFromPrompt(systemPrompt);
  const specJson = JSON.stringify(spec);
  const specHash = await generatePromptHash(specJson);
  
  console.log(`📊 specHash=${specHash}, niche=${spec.niche}`);
  
  // Step 3: Load learned snippets for this scope (if enabled)
  // Uses hybrid approach: tries Context7 first, falls back to localStorage
  const learnedSnippets: AppliedSnippet[] = [];
  let memorySource: MemorySource = 'localStorage';
  
  // Check both request flag and global store flag
  const storeSnippetsEnabled = useStore.getState().snippetsEnabled;
  const effectiveSnippetsEnabled = snippetsEnabled && storeSnippetsEnabled;
  
  if (effectiveSnippetsEnabled) {
    try {
      // Use memory adapter (Context7 + localStorage hybrid)
      const memoryAdapter = getMemoryAdapter();
      const result = await memoryAdapter.getSnippets(snippetScopeId, 5);
      
      memorySource = result.source;
      const rawSnippets = result.data;
      
      for (const raw of rawSnippets) {
        learnedSnippets.push({
          id: `snippet-${raw.appliedAt}`,
          trigger: raw.originalQuestion,
          content: raw.correctedResponse,
          charLength: raw.correctedResponse.length,
          appliedAt: raw.appliedAt,
          source: 'voice-agent', // Default source
        });
      }
      
      console.log(`📊 Loaded ${learnedSnippets.length} learned snippets from ${snippetScopeId}`);
      console.log(`   • Memory source: ${memorySource}`);
      
      if (result.error) {
        console.warn(`   ⚠️ Memory warning: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to load snippets from memory adapter:', error);
      // Gracefully degrade - continue without snippets
      console.log('   • Continuing without snippets (safe degradation)');
    }
  }
  
  // Step 4: Assemble messages in STRICT ORDER
  // Order matters! Snippets MUST come before conversation to be effective
  const messages: Array<{ role: string; content: string }> = [];
  
  // 4.1: SPEC (embedded JSON for grader alignment)
  if (spec && specJson) {
    messages.push({
      role: 'system',
      content: `<!-- SPEC FOR EVALUATION -->\n${specJson}`,
    });
  }
  
  // 4.2: LEARNED SNIPPETS (corrections and improvements)
  if (learnedSnippets.length > 0) {
    const snippetsContent = learnedSnippets
      .map(
        (s, idx) =>
          `LEARNED CORRECTION ${idx + 1}:\nQ: ${s.trigger}\nA: ${s.content}`
      )
      .join('\n\n');
    
    messages.push({
      role: 'system',
      content: `<!-- LEARNED IMPROVEMENTS -->\n${snippetsContent}`,
    });
  }
  
  // 4.3: CONTEXT (business/location data)
  if (contextJson) {
    messages.push({
      role: 'system',
      content: `<!-- CONTEXT DATA -->\n${contextJson}`,
    });
  }
  
  // 4.4: CONVERSATION SUMMARY (if exists)
  if (conversationSummary) {
    messages.push({
      role: 'system',
      content: `<!-- CONVERSATION SUMMARY -->\n${conversationSummary}`,
    });
  }
  
  // 4.5: LAST N TURNS (recent conversation)
  for (const turn of lastTurns) {
    // Assume turn is formatted as "USER: ... \n ASSISTANT: ..."
    // Parse and add as separate messages
    if (turn.includes('USER:') && turn.includes('ASSISTANT:')) {
      const parts = turn.split('ASSISTANT:');
      const userPart = parts[0].replace('USER:', '').trim();
      const assistantPart = parts[1].trim();
      
      messages.push({ role: 'user', content: userPart });
      messages.push({ role: 'assistant', content: assistantPart });
    } else {
      // Fallback: treat as user message
      messages.push({ role: 'user', content: turn });
    }
  }
  
  // Step 5: Generate attestation
  const assembledContext: AssembledContext = {
    systemPrompt: systemPromptForModel,
    specJson,
    snippets: learnedSnippets,
    contextJson,
    summary: conversationSummary,
    lastTurns,
  };
  
  const config: AttestationConfig = {
    locationId,
    agentId,
    systemPrompt: systemPromptForModel,
    model,
    temperature,
    maxTokens,
    snippetsEnabled,
    guardEnabled,
  };
  
  const attestation = await generateTurnAttestation(
    turnId,
    config,
    assembledContext
  );
  
  // Step 6: Store attestation for audit
  attestation.snippetScopeId = snippetScopeId;
  attestation.memorySource = memorySource; // Track where snippets came from
  attestationStore.saveTurnAttestation(attestation);
  
  console.log(`✅ Attestation generated and stored for turn ${turnId}`);
  console.log(`   • Runtime scopeId: ${attestation.scopeId}`);
  console.log(`   • Snippet scopeId: ${snippetScopeId}`);
  console.log(`   • Snippets applied: ${attestation.snippetsApplied.length}`);
  console.log(`   • Token budget: ${attestation.tokenBudget.total} / ${attestation.tokenBudget.maxTokens}`);
  console.log(`   • Diagnostics: ${attestation.diagnostics.length}`);
  
  // Step 7: Build effective prompt (for copy/debug)
  const effectivePrompt = [
    `[SYSTEM]\n${systemPromptForModel}`,
    ...messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`),
  ].join('\n\n---\n\n');
  
  return {
    messages,
    attestation,
    scopeId: attestation.scopeId,
    snippetScopeId,
    promptHash,
    specHash,
    effectivePrompt,
    systemPromptForModel,
  };
}

/**
 * Response guard - enforces SPEC rules even if model forgets
 * 
 * Guards:
 * 1. One question per turn (max 2 sentences)
 * 2. Block booking until all required fields collected & confirmed
 * 3. No AI self-reference ("I'm an AI")
 * 4. No backend mentions ("GHL", "CRM")
 * 5. Optional: Require Context7 memory for specific scopes
 */
export interface GuardOptions {
  memorySource?: MemorySource;
  requireContext7?: boolean;
  scopeId?: string;
}

export function guardResponse(
  spec: PromptSpec,
  collectedFields: Array<{ key: string; value: string; valid: boolean }>,
  candidateResponse: string,
  options?: GuardOptions
): {
  approved: boolean;
  reason?: string;
  blockedViolation?: string;
  modifiedResponse?: string;
  fixedResponse?: string;
} {
  // Guard 0: Context7 memory requirement (opt-in per scope)
  if (options?.requireContext7 && options?.memorySource !== 'context7') {
    return {
      approved: false,
      reason: 'Context7 memory required but unavailable for this scope',
      blockedViolation: 'CONTEXT7_REQUIRED',
      fixedResponse: "I'm currently undergoing maintenance to improve my responses. Please try again in a few minutes.",
    };
  }
  // Guard 1: Check for AI self-reference (CRITICAL VIOLATION)
  const aiSelfRefPattern = /(i'm an ai|i am an ai|as an ai|as a language model)/i;
  if (aiSelfRefPattern.test(candidateResponse)) {
    return {
      approved: false,
      reason: 'AI self-reference detected (critical violation)',
      blockedViolation: 'AI_SELF_REFERENCE',
    };
  }
  
  // Guard 2: Check for backend mentions (CRITICAL VIOLATION)
  const backendPattern = /(ghl|go high level|crm system|backend|database)/i;
  if (backendPattern.test(candidateResponse)) {
    return {
      approved: false,
      reason: 'Backend system mention detected (critical violation)',
      blockedViolation: 'BACKEND_MENTION',
    };
  }
  
  // Guard 3: Check for booking attempt before fields collected
  const bookingPattern = /(booked|scheduled|reserved|confirmed your appointment)/i;
  const requiredFields = spec.required_fields || [];
  const missingFields = requiredFields.filter(
    (field) => !collectedFields.find((f) => f.key === field && f.valid)
  );
  
  if (bookingPattern.test(candidateResponse) && missingFields.length > 0) {
    return {
      approved: false,
      reason: `Attempted booking with missing fields: ${missingFields.join(', ')}`,
      blockedViolation: 'EARLY_BOOKING',
    };
  }
  
  // Guard 4: Check for multiple questions (warn but allow)
  const questionCount = (candidateResponse.match(/\?/g) || []).length;
  if (questionCount > 1) {
    // Trim to first question
    const firstQuestionEnd = candidateResponse.indexOf('?') + 1;
    const modifiedResponse = candidateResponse.substring(0, firstQuestionEnd);
    
    return {
      approved: true,
      reason: 'Multiple questions detected, trimmed to first question',
      modifiedResponse,
    };
  }
  
  // Guard 5: Check response length (warn but allow)
  const sentences = candidateResponse.split(/[.!?]/).filter((s) => s.trim().length > 0);
  if (sentences.length > 2) {
    // Trim to first 2 sentences
    const firstTwoSentences = sentences.slice(0, 2).join('. ') + '.';
    
    return {
      approved: true,
      reason: 'Response too long, trimmed to 2 sentences',
      modifiedResponse: firstTwoSentences,
    };
  }
  
  // All guards passed
  return {
    approved: true,
  };
}

