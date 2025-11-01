/**
 * Master Agent Store - localStorage persistence with optional DB sync
 * Stores session evaluations and manual corrections
 * Now supports scoping per location+agent+prompt hash
 */

import { SessionEvaluation, FieldCapture } from './types';

const STORAGE_KEY = 'ghl-master-sessions';
const SCOPED_STORAGE_KEY_PREFIX = 'ghl-scoped-sessions:';

/**
 * Save a session evaluation to localStorage
 * Keeps last 50 sessions to avoid storage bloat
 */
export function saveSession(session: SessionEvaluation): void {
  const sessions = loadSessions();
  const existing = sessions.findIndex(s => s.conversationId === session.conversationId);
  
  if (existing >= 0) {
    // Update existing session
    sessions[existing] = session;
  } else {
    // Add new session at the beginning
    sessions.unshift(session);
  }
  
  // Keep only last 50 sessions
  const trimmed = sessions.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * Load all sessions from localStorage
 */
export function loadSessions(): SessionEvaluation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load sessions from localStorage:', e);
    return [];
  }
}

/**
 * Apply manual corrections to a session and increment correctionsApplied counter
 * Supports both field corrections and turn-level response corrections
 * 
 * FIX: Always read from storage before incrementing to prevent counter glitches
 */
export function applyManualCorrections(
  conversationId: string,
  corrections: { 
    fields?: FieldCapture[]; 
    turnId?: string; 
    correctedResponse?: string;
  }
): SessionEvaluation | null {
  // CRITICAL FIX: Always read the latest from storage to avoid stale state
  const sessions = loadSessions();
  const session = sessions.find(s => s.conversationId === conversationId);
  
  if (!session) {
    console.warn(`Session ${conversationId} not found for correction`);
    return null;
  }

  // Apply field corrections
  if (corrections.fields) {
    session.collectedFields = corrections.fields;
  }
  
  // Store turn-level corrections (for future KB integration)
  if (corrections.turnId && corrections.correctedResponse) {
    // We'll add a corrections array to session for tracking
    if (!(session as any).corrections) {
      (session as any).corrections = [];
    }
    
    // Find the turn to get original text for KB matching
    const turn = session.transcript?.find((t: any) => t.id === corrections.turnId);
    
    (session as any).corrections.push({
      turnId: corrections.turnId,
      correctedResponse: corrections.correctedResponse,
      originalTurnText: turn?.text || 'Unknown question',
      appliedAt: Date.now()
    });
  }
  
  // Increment corrections counter (using fresh value from storage)
  const previousCount = session.correctionsApplied || 0;
  session.correctionsApplied = previousCount + 1;
  
  console.log(`📝 masterStore: Incrementing corrections for ${conversationId}`);
  console.log(`   • Previous count: ${previousCount}`);
  console.log(`   • New count: ${session.correctionsApplied}`);
  console.log(`   • Correction type: ${corrections.fields ? 'field edit' : 'turn edit'}`);
  
  // Save updated session (atomic write-back)
  saveSession(session);
  
  console.log(`💾 masterStore: Session saved to localStorage`);
  
  // CRITICAL FIX: Return the session we just saved, not a stale copy
  return getSession(conversationId);
}

/**
 * Get a specific session by conversationId
 */
export function getSession(conversationId: string): SessionEvaluation | null {
  const sessions = loadSessions();
  return sessions.find(s => s.conversationId === conversationId) || null;
}

/**
 * Clear all sessions (for debugging/reset)
 */
export function clearAllSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export sessions for backup/analysis
 */
export function exportSessions(): string {
  return JSON.stringify(loadSessions(), null, 2);
}

/**
 * Import sessions from backup
 */
export function importSessions(jsonData: string): boolean {
  try {
    const sessions = JSON.parse(jsonData);
    if (Array.isArray(sessions)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to import sessions:', e);
    return false;
  }
}

// ============================================================================
// SCOPED STORAGE FUNCTIONS (location+agent+prompt isolation)
// ============================================================================

/**
 * Get storage key for a specific scope
 */
function getScopedStorageKey(scopeId: string): string {
  return `${SCOPED_STORAGE_KEY_PREFIX}${scopeId}`;
}

/**
 * Save session to scoped storage
 * Each scope (location+agent+prompt) gets its own localStorage key
 */
export function saveScopedSession(scopeId: string, session: SessionEvaluation): void {
  const key = getScopedStorageKey(scopeId);
  const sessions = loadScopedSessions(scopeId);
  const existing = sessions.findIndex(s => s.conversationId === session.conversationId);
  
  if (existing >= 0) {
    sessions[existing] = session;
  } else {
    sessions.unshift(session);
  }
  
  // Keep only last 30 sessions per scope
  const trimmed = sessions.slice(0, 30);
  localStorage.setItem(key, JSON.stringify(trimmed));
  
  console.log(`💾 Saved session to scope: ${scopeId}`);
}

/**
 * Load all sessions for a specific scope
 */
export function loadScopedSessions(scopeId: string): SessionEvaluation[] {
  try {
    const key = getScopedStorageKey(scopeId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`Failed to load scoped sessions for ${scopeId}:`, e);
    return [];
  }
}

/**
 * Get a specific scoped session
 */
export function getScopedSession(scopeId: string, conversationId: string): SessionEvaluation | null {
  const sessions = loadScopedSessions(scopeId);
  return sessions.find(s => s.conversationId === conversationId) || null;
}

/**
 * Apply manual corrections to a scoped session
 */
export function applyScopedCorrections(
  scopeId: string,
  conversationId: string,
  corrections: {
    fields?: FieldCapture[];
    turnId?: string;
    correctedResponse?: string;
  }
): SessionEvaluation | null {
  // CRITICAL FIX: Always read the latest from scoped storage
  const sessions = loadScopedSessions(scopeId);
  const session = sessions.find(s => s.conversationId === conversationId);
  
  if (!session) {
    console.warn(`Scoped session ${conversationId} not found in ${scopeId}`);
    return null;
  }

  // Apply field corrections
  if (corrections.fields) {
    session.collectedFields = corrections.fields;
  }
  
  // Store turn-level corrections
  if (corrections.turnId && corrections.correctedResponse) {
    if (!(session as any).corrections) {
      (session as any).corrections = [];
    }
    
    const turn = session.transcript?.find((t: any) => t.id === corrections.turnId);
    
    (session as any).corrections.push({
      turnId: corrections.turnId,
      correctedResponse: corrections.correctedResponse,
      originalTurnText: turn?.text || 'Unknown question',
      appliedAt: Date.now()
    });
  }
  
  // Increment corrections counter (using fresh value from storage)
  const previousCount = session.correctionsApplied || 0;
  session.correctionsApplied = previousCount + 1;
  
  console.log(`📝 Scoped correction for ${scopeId}:${conversationId}`);
  console.log(`   • Previous count: ${previousCount}`);
  console.log(`   • New count: ${session.correctionsApplied}`);
  
  // Save updated session (atomic write-back)
  saveScopedSession(scopeId, session);
  
  // CRITICAL FIX: Return fresh copy from storage
  return getScopedSession(scopeId, conversationId);
}

/**
 * Get all learned corrections for a scope (for KB injection)
 */
export function getScopedLearnedSnippets(scopeId: string, limit: number = 5): Array<{
  originalQuestion: string;
  correctedResponse: string;
  appliedAt: number;
}> {
  const sessions = loadScopedSessions(scopeId);
  const allCorrections: Array<{
    originalQuestion: string;
    correctedResponse: string;
    appliedAt: number;
  }> = [];
  
  for (const session of sessions) {
    const corrections = (session as any).corrections || [];
    for (const correction of corrections) {
      allCorrections.push({
        originalQuestion: correction.originalTurnText || 'Unknown',
        correctedResponse: correction.correctedResponse,
        appliedAt: correction.appliedAt,
      });
    }
  }
  
  // Sort by most recent, return top N
  return allCorrections
    .sort((a, b) => b.appliedAt - a.appliedAt)
    .slice(0, limit);
}

/**
 * Clear all scoped sessions for a specific scope
 */
export function clearScopedSessions(scopeId: string): void {
  const key = getScopedStorageKey(scopeId);
  localStorage.removeItem(key);
  console.log(`🗑️ Cleared scoped sessions for: ${scopeId}`);
}

