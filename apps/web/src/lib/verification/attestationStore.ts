/**
 * Attestation Store - Persist verification receipts
 * 
 * SOLID Principles:
 * - Single Responsibility: Store and retrieve attestations
 * - Dependency Inversion: Interface-based storage
 * 
 * Purpose: Persist attestation data for audit and debugging
 */

import {
  TurnAttestation,
  SessionAttestation,
  AttestationComparison,
} from './attestationTypes';

const ATTESTATION_KEY_PREFIX = 'ghl-attestation:';
const SESSION_ATTESTATION_KEY_PREFIX = 'ghl-session-attestation:';
const COMPARISON_KEY_PREFIX = 'ghl-attestation-comparison:';

/**
 * Storage interface for attestations
 * Can be swapped for different storage backends
 */
export interface IAttestationStorage {
  saveTurnAttestation(attestation: TurnAttestation): void;
  getTurnAttestation(turnId: string): TurnAttestation | null;
  getTurnAttestationsByScope(scopeId: string, limit?: number): TurnAttestation[];
  
  saveSessionAttestation(attestation: SessionAttestation): void;
  getSessionAttestation(conversationId: string): SessionAttestation | null;
  
  saveComparison(comparison: AttestationComparison): void;
  getComparison(turnId: string): AttestationComparison | null;
  
  clearAll(): void;
}

/**
 * LocalStorage implementation of attestation storage
 */
export class LocalStorageAttestationStore implements IAttestationStorage {
  saveTurnAttestation(attestation: TurnAttestation): void {
    const key = `${ATTESTATION_KEY_PREFIX}${attestation.turnId}`;
    try {
      localStorage.setItem(key, JSON.stringify(attestation));
      
      // Also maintain a scoped index for efficient lookups
      this.addToScopeIndex(attestation.scopeId, attestation.turnId);
    } catch (e) {
      console.error('Failed to save turn attestation:', e);
    }
  }

  getTurnAttestation(turnId: string): TurnAttestation | null {
    const key = `${ATTESTATION_KEY_PREFIX}${turnId}`;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to load turn attestation:', e);
      return null;
    }
  }

  getTurnAttestationsByScope(scopeId: string, limit: number = 50): TurnAttestation[] {
    const turnIds = this.getScopeIndex(scopeId);
    const attestations: TurnAttestation[] = [];
    
    for (const turnId of turnIds.slice(0, limit)) {
      const attestation = this.getTurnAttestation(turnId);
      if (attestation) {
        attestations.push(attestation);
      }
    }
    
    // Sort by timestamp descending (most recent first)
    return attestations.sort((a, b) => b.timestamp - a.timestamp);
  }

  saveSessionAttestation(attestation: SessionAttestation): void {
    const key = `${SESSION_ATTESTATION_KEY_PREFIX}${attestation.conversationId}`;
    try {
      localStorage.setItem(key, JSON.stringify(attestation));
    } catch (e) {
      console.error('Failed to save session attestation:', e);
    }
  }

  getSessionAttestation(conversationId: string): SessionAttestation | null {
    const key = `${SESSION_ATTESTATION_KEY_PREFIX}${conversationId}`;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to load session attestation:', e);
      return null;
    }
  }

  saveComparison(comparison: AttestationComparison): void {
    const key = `${COMPARISON_KEY_PREFIX}${comparison.withSnippets.turnId}`;
    try {
      localStorage.setItem(key, JSON.stringify(comparison));
    } catch (e) {
      console.error('Failed to save attestation comparison:', e);
    }
  }

  getComparison(turnId: string): AttestationComparison | null {
    const key = `${COMPARISON_KEY_PREFIX}${turnId}`;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to load attestation comparison:', e);
      return null;
    }
  }

  clearAll(): void {
    const keys = Object.keys(localStorage);
    const attestationKeys = keys.filter(
      (k) =>
        k.startsWith(ATTESTATION_KEY_PREFIX) ||
        k.startsWith(SESSION_ATTESTATION_KEY_PREFIX) ||
        k.startsWith(COMPARISON_KEY_PREFIX)
    );
    
    attestationKeys.forEach((key) => localStorage.removeItem(key));
    
    // Also clear scope indexes
    const scopeIndexKeys = keys.filter((k) => k.startsWith('ghl-scope-index:'));
    scopeIndexKeys.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Maintain a scope index for efficient lookups
   * Maps scopeId -> [turnId1, turnId2, ...]
   */
  private addToScopeIndex(scopeId: string, turnId: string): void {
    const key = `ghl-scope-index:${scopeId}`;
    try {
      const raw = localStorage.getItem(key);
      const index: string[] = raw ? JSON.parse(raw) : [];
      
      // Add turnId if not already in index
      if (!index.includes(turnId)) {
        index.unshift(turnId); // Add at beginning (most recent first)
        
        // Keep only last 100 per scope
        const trimmed = index.slice(0, 100);
        localStorage.setItem(key, JSON.stringify(trimmed));
      }
    } catch (e) {
      console.error('Failed to update scope index:', e);
    }
  }

  private getScopeIndex(scopeId: string): string[] {
    const key = `ghl-scope-index:${scopeId}`;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load scope index:', e);
      return [];
    }
  }
}

/**
 * Global singleton instance
 */
export const attestationStore: IAttestationStorage = new LocalStorageAttestationStore();

/**
 * Get attestation statistics for a scope
 */
export function getAttestationStats(scopeId: string): {
  totalTurns: number;
  totalSnippetsApplied: number;
  avgTokensPerTurn: number;
  budgetOverflowCount: number;
} {
  const attestations = attestationStore.getTurnAttestationsByScope(scopeId);
  
  const totalTurns = attestations.length;
  const totalSnippetsApplied = attestations.reduce(
    (sum, a) => sum + a.snippetsApplied.length,
    0
  );
  const avgTokensPerTurn =
    totalTurns > 0
      ? Math.round(
          attestations.reduce((sum, a) => sum + a.tokenBudget.total, 0) / totalTurns
        )
      : 0;
  const budgetOverflowCount = attestations.filter(
    (a) => a.tokenBudget.exceeded
  ).length;
  
  return {
    totalTurns,
    totalSnippetsApplied,
    avgTokensPerTurn,
    budgetOverflowCount,
  };
}

/**
 * Export attestations for debugging
 */
export function exportAttestations(scopeId: string): string {
  const attestations = attestationStore.getTurnAttestationsByScope(scopeId, 1000);
  return JSON.stringify(attestations, null, 2);
}

