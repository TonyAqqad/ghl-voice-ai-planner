/**
 * Master Agent Store - localStorage persistence with optional DB sync
 * Stores session evaluations and manual corrections
 */

import { SessionEvaluation, FieldCapture } from './types';

const STORAGE_KEY = 'ghl-master-sessions';

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
 */
export function applyManualCorrections(
  conversationId: string,
  corrections: { 
    fields?: FieldCapture[]; 
    turnId?: string; 
    correctedResponse?: string;
  }
): SessionEvaluation | null {
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
    (session as any).corrections.push({
      turnId: corrections.turnId,
      correctedResponse: corrections.correctedResponse,
      appliedAt: Date.now()
    });
  }
  
  // Increment corrections counter
  session.correctionsApplied = (session.correctionsApplied || 0) + 1;
  
  // Save updated session
  saveSession(session);
  
  return session;
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

