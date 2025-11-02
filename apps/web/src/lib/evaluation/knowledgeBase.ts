/**
 * Agent-Scoped Learned Responses Knowledge Base
 * Each agent has isolated corrections that don't leak to other agents
 */

import { SessionEvaluation } from './types';
import { loadSessions } from './masterStore';

export interface LearnedResponse {
  question: string;
  correctResponse: string;
  timestamp: number;
  conversationId: string;
  agentId: string;
  niche?: string;
}

/**
 * Get all learned responses for a SPECIFIC agent only
 * @param agentId - Required: only return corrections for this agent
 * @param niche - Optional: further filter by niche
 */
export function getAgentLearnedResponses(
  agentId: string,
  niche?: string
): LearnedResponse[] {
  const sessions = loadSessions();
  const learned: LearnedResponse[] = [];

  for (const session of sessions) {
    // CRITICAL: Only include corrections from the SAME agent
    if (session.agentId !== agentId) continue;
    
    // Optional: Further filter by niche if provided
    if (niche && session.niche !== niche) continue;

    // Only include sessions with corrections
    if (!session.correctionsApplied || session.correctionsApplied === 0) continue;

    // Extract turn-level corrections
    const corrections = (session as any).corrections || [];
    for (const correction of corrections) {
      learned.push({
        question: correction.originalTurnText || 'Unknown question',
        correctResponse: correction.correctedResponse,
        timestamp: correction.appliedAt,
        conversationId: session.conversationId,
        agentId: session.agentId,
        niche: session.niche,
      });
    }

    // Extract field corrections (manually corrected fields)
    const manualFields = session.collectedFields.filter(f => f.source === 'manual');
    if (manualFields.length > 0) {
      learned.push({
        question: 'Field collection guidance',
        correctResponse: `Correct field format: ${manualFields.map(f => `${f.key}="${f.value}"`).join(', ')}`,
        timestamp: session.endedAt,
        conversationId: session.conversationId,
        agentId: session.agentId,
        niche: session.niche,
      });
    }
  }

  // Sort by most recent first
  return learned.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get relevant learned responses based on conversation context
 * Uses keyword matching to find similar past corrections
 */
export function getRelevantLearned(
  agentId: string,
  conversationText: string,
  maxResults = 3,
  niche?: string
): LearnedResponse[] {
  const allLearned = getAgentLearnedResponses(agentId, niche);
  
  if (allLearned.length === 0) return [];

  // Simple relevance scoring based on keyword overlap
  const conversationWords = conversationText.toLowerCase().split(/\s+/);
  
  const scored = allLearned.map(item => {
    const questionWords = item.question.toLowerCase().split(/\s+/);
    
    const overlap = questionWords.filter(word => 
      conversationWords.includes(word) && word.length > 3
    ).length;

    return { item, score: overlap };
  });

  // Return top N most relevant (or all recent if no relevance match)
  const relevant = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .filter(s => s.score > 0);

  // If no relevant matches, return most recent corrections (up to maxResults)
  if (relevant.length === 0) {
    return allLearned.slice(0, Math.min(maxResults, allLearned.length));
  }

  return relevant.map(s => s.item);
}

/**
 * Format learned responses as prompt injection
 */
export function formatLearnedForPrompt(learned: LearnedResponse[]): string {
  if (learned.length === 0) return '';

  const examples = learned
    .map((item, idx) => 
      `${idx + 1}. Context: "${item.question.substring(0, 100)}..."\n   ` +
      `Correct approach: "${item.correctResponse.substring(0, 150)}..."`
    )
    .join('\n\n');

  return `\n\n--- LEARNED FROM YOUR PAST CORRECTIONS ---\n${examples}\n\nReference these when similar situations arise.\n---\n`;
}

/**
 * Get stats about agent's knowledge base
 */
export function getAgentKBStats(agentId: string): {
  totalCorrections: number;
  totalSessions: number;
  lastCorrectionDate: Date | null;
} {
  const sessions = loadSessions().filter(s => s.agentId === agentId);
  const totalCorrections = sessions.reduce((sum, s) => sum + (s.correctionsApplied || 0), 0);
  
  const allLearned = getAgentLearnedResponses(agentId);
  const lastTimestamp = allLearned.length > 0 ? allLearned[0].timestamp : null;

  return {
    totalCorrections,
    totalSessions: sessions.length,
    lastCorrectionDate: lastTimestamp ? new Date(lastTimestamp) : null,
  };
}

