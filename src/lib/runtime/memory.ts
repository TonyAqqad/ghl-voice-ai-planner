/**
 * Runtime Memory Management
 * 
 * Maintains rolling summary and builds token-efficient context for 4o-mini
 * Target: Keep request context under 800 tokens for cost optimization
 */

import { ConversationTurn } from '../evaluation/types';

/**
 * Rolling summary configuration
 */
const MAX_SUMMARY_TOKENS = 120;
const MAX_RECENT_TURNS = 6;
const MAX_CONTEXT_VALUE_LENGTH = 120;

/**
 * Generate a rolling summary of conversation history
 * Compresses older turns into a brief summary
 */
export function generateRollingSummary(turns: ConversationTurn[]): string {
  if (turns.length <= MAX_RECENT_TURNS) {
    return ''; // No summary needed for short conversations
  }

  const olderTurns = turns.slice(0, turns.length - MAX_RECENT_TURNS);
  
  // Extract key information from older turns
  const collectedInfo: string[] = [];
  
  for (const turn of olderTurns) {
    if (turn.role === 'caller') {
      // Look for key information patterns
      if (/\b[A-Z][a-z]+\b/.test(turn.text)) {
        collectedInfo.push('name provided');
      }
      if (/@/.test(turn.text)) {
        collectedInfo.push('email given');
      }
      if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(turn.text)) {
        collectedInfo.push('phone confirmed');
      }
      if (/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)/i.test(turn.text)) {
        collectedInfo.push('date discussed');
      }
    }
  }

  const uniqueInfo = [...new Set(collectedInfo)];
  
  if (uniqueInfo.length === 0) {
    return 'Earlier: General greeting and introduction.';
  }

  return `Earlier: ${uniqueInfo.join(', ')}.`;
}

/**
 * Get recent turns for context (last N turns only)
 */
export function getRecentTurns(turns: ConversationTurn[], limit: number = MAX_RECENT_TURNS): ConversationTurn[] {
  return turns.slice(-limit);
}

/**
 * Truncate long context values to save tokens
 */
export function truncateContextValue(value: string, maxLength: number = MAX_CONTEXT_VALUE_LENGTH): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.substring(0, maxLength - 3) + '...';
}

/**
 * Truncate all values in a context object
 */
export function truncateContext(context: Record<string, any>): Record<string, any> {
  const truncated: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'string') {
      truncated[key] = truncateContextValue(value);
    } else if (typeof value === 'object' && value !== null) {
      truncated[key] = truncateContext(value);
    } else {
      truncated[key] = value;
    }
  }
  
  return truncated;
}

/**
 * Build token-efficient request context
 * Structure: [system_prompt] + [spec_line] + [summary] + [recent_turns] + [context] + [learned]
 */
export function buildRequestContext({
  systemPrompt,
  specLine,
  conversation,
  contextData,
  learnedSnippets,
}: {
  systemPrompt: string;
  specLine?: string;
  conversation: ConversationTurn[];
  contextData?: Record<string, any>;
  learnedSnippets?: string;
}): {
  enhancedPrompt: string;
  recentTurns: ConversationTurn[];
  estimatedTokens: number;
} {
  const parts: string[] = [];
  
  // 1. System prompt (already compact)
  parts.push(systemPrompt);
  
  // 2. Spec line (if provided)
  if (specLine) {
    parts.push(specLine);
  }
  
  // 3. Rolling summary (if conversation is long)
  const summary = generateRollingSummary(conversation);
  if (summary) {
    parts.push(`\n[CONTEXT: ${summary}]`);
  }
  
  // 4. Context data (truncated)
  if (contextData) {
    const truncated = truncateContext(contextData);
    const contextJson = JSON.stringify(truncated);
    if (contextJson.length <= 300) { // Only include if small enough
      parts.push(`\nContext: ${contextJson}`);
    }
  }
  
  // 5. Learned snippets (already limited to 5)
  if (learnedSnippets) {
    parts.push(learnedSnippets);
  }
  
  const enhancedPrompt = parts.join('\n');
  const recentTurns = getRecentTurns(conversation);
  
  // Estimate tokens (chars / 4 heuristic)
  const promptTokens = Math.ceil(enhancedPrompt.length / 4);
  const turnsTokens = Math.ceil(recentTurns.reduce((sum, t) => sum + t.text.length, 0) / 4);
  const estimatedTokens = promptTokens + turnsTokens;
  
  return {
    enhancedPrompt,
    recentTurns,
    estimatedTokens,
  };
}

/**
 * Estimate tokens for text (chars / 4 heuristic)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Format conversation turns for API (recent only)
 */
export function formatTurnsForAPI(turns: ConversationTurn[]): Array<{ role: string; content: string }> {
  const recentTurns = getRecentTurns(turns);
  
  return recentTurns.map(turn => ({
    role: turn.role === 'caller' ? 'user' : 'assistant',
    content: turn.text,
  }));
}

/**
 * Get token usage stats for display
 */
export function getTokenStats(conversation: ConversationTurn[], systemPrompt: string, learnedSnippets: string = ''): {
  conversationTokens: number;
  promptTokens: number;
  learnedTokens: number;
  totalTokens: number;
  costEstimate: number; // USD for gpt-4o-mini
} {
  const conversationText = conversation.map(t => t.text).join(' ');
  const conversationTokens = estimateTokens(conversationText);
  const promptTokens = estimateTokens(systemPrompt);
  const learnedTokens = estimateTokens(learnedSnippets);
  const totalTokens = conversationTokens + promptTokens + learnedTokens;
  
  // gpt-4o-mini pricing: $0.000150 per 1K input tokens, $0.000600 per 1K output tokens
  // Assume 50% input, 50% output for simplicity
  const inputCost = (totalTokens / 1000) * 0.000150;
  const outputCost = (totalTokens / 1000) * 0.000600;
  const costEstimate = inputCost + outputCost;
  
  return {
    conversationTokens,
    promptTokens,
    learnedTokens,
    totalTokens,
    costEstimate,
  };
}

