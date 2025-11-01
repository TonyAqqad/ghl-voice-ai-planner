/**
 * Master Orchestrator - 3-Layer Architecture Entry Point
 * 
 * Coordinates:
 * 1. Master composes Client/Voice agent prompt
 * 2. Client runs conversation
 * 3. Master evaluates after-call
 */

import { MinimalContext, truncateContextValues, CONTACT_KEYS } from './fieldSet';
import { ConversationTurn, SessionEvaluation } from '../evaluation/types';
import { evaluateSession } from '../evaluation/sessionEvaluator';
import { applyManualCorrections as storeManualCorrections, saveSession } from '../evaluation/masterStore';
import { PromptSpec } from '../spec/specTypes';
import { extractSpecFromPrompt } from '../spec/specExtract';

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

