/**
 * Auto-Corrector: Self-Healing Agent System
 * Automatically detects violations and generates corrections
 */

import type { PromptSpec } from '../spec/specTypes';
import type { ConversationTurn } from './types';

export interface Violation {
  type: 'cadence' | 'word_count' | 'field_order' | 'disallowed_phrase' | 'multiple_fields';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  originalText: string;
  suggestedFix: string;
  turnId: string;
}

export interface AutoCorrectionResult {
  hasViolations: boolean;
  violations: Violation[];
  correctedResponse?: string;
  appliedAutomatically: boolean;
}

/**
 * Validates an agent response against the PromptSpec
 */
export function validateAgentResponse(
  response: string,
  turnId: string,
  spec: PromptSpec | null,
  conversationHistory: ConversationTurn[]
): Violation[] {
  if (!spec) return [];

  const violations: Violation[] = [];

  // 1. Check word count
  const wordCount = response.split(/\s+/).length;
  if (wordCount > spec.max_words_per_turn) {
    violations.push({
      type: 'word_count',
      severity: 'high',
      message: `Response has ${wordCount} words (max: ${spec.max_words_per_turn})`,
      originalText: response,
      suggestedFix: generateConciseVersion(response, spec.max_words_per_turn),
      turnId,
    });
  }

  // 2. Check for multiple questions (cadence violation)
  const questionCount = (response.match(/\?/g) || []).length;
  if (questionCount > 1 && spec.question_cadence === 'one_at_a_time') {
    violations.push({
      type: 'cadence',
      severity: 'critical',
      message: `Asking ${questionCount} questions at once (should be one at a time)`,
      originalText: response,
      suggestedFix: generateSingleQuestionVersion(response, conversationHistory, spec),
      turnId,
    });
  }

  // 3. Check for multiple fields requested in one turn
  const fieldsRequested = countFieldsRequested(response, spec);
  if (fieldsRequested > 1) {
    violations.push({
      type: 'multiple_fields',
      severity: 'critical',
      message: `Requesting ${fieldsRequested} fields at once (should ask for one field at a time)`,
      originalText: response,
      suggestedFix: generateSingleFieldRequest(response, conversationHistory, spec),
      turnId,
    });
  }

  // 4. Check for disallowed phrases
  for (const phrase of spec.disallowed_phrases || []) {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push({
        type: 'disallowed_phrase',
        severity: 'medium',
        message: `Contains disallowed phrase: "${phrase}"`,
        originalText: response,
        suggestedFix: response.replace(new RegExp(phrase, 'gi'), '[avoid this phrase]'),
        turnId,
      });
    }
  }

  return violations;
}

/**
 * Automatically corrects a response based on violations
 */
export function autoCorrectResponse(
  violations: Violation[],
  conversationHistory: ConversationTurn[],
  spec: PromptSpec | null
): AutoCorrectionResult {
  if (violations.length === 0) {
    return {
      hasViolations: false,
      violations: [],
      appliedAutomatically: false,
    };
  }

  // Sort by severity (critical first)
  const sortedViolations = violations.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  // Use the suggested fix from the most critical violation
  const primaryViolation = sortedViolations[0];
  const correctedResponse = primaryViolation.suggestedFix;

  return {
    hasViolations: true,
    violations: sortedViolations,
    correctedResponse,
    appliedAutomatically: true,
  };
}

/**
 * Generates a concise version of a response
 */
function generateConciseVersion(response: string, maxWords: number): string {
  const sentences = response.split(/[.!?]+/).filter(s => s.trim());
  
  // Try to keep the first sentence that asks a question
  for (const sentence of sentences) {
    if (sentence.includes('?') && sentence.split(/\s+/).length <= maxWords) {
      return sentence.trim() + '?';
    }
  }

  // Fallback: truncate to max words
  const words = response.split(/\s+/).slice(0, maxWords);
  return words.join(' ') + '...';
}

/**
 * Generates a single-question version from a multi-question response
 */
function generateSingleQuestionVersion(
  response: string,
  history: ConversationTurn[],
  spec: PromptSpec
): string {
  // Extract all collected fields so far
  const collectedFields = extractCollectedFields(history);
  
  // Determine the next field to ask for based on field_order
  const nextField = spec.field_order.find(field => !collectedFields.has(field));
  
  if (!nextField) {
    return "Great! I have all the information I need. Let me confirm your booking.";
  }

  // Generate a focused question for the next field
  return generateFieldQuestion(nextField);
}

/**
 * Generates a single field request
 */
function generateSingleFieldRequest(
  response: string,
  history: ConversationTurn[],
  spec: PromptSpec
): string {
  const collectedFields = extractCollectedFields(history);
  const nextField = spec.field_order.find(field => !collectedFields.has(field));
  
  if (!nextField) {
    return "Perfect! I have everything I need.";
  }

  return generateFieldQuestion(nextField);
}

/**
 * Counts how many fields are being requested in a response
 */
function countFieldsRequested(response: string, spec: PromptSpec): number {
  let count = 0;
  const lowerResponse = response.toLowerCase();

  // Check for each field keyword
  const fieldKeywords: Record<string, string[]> = {
    first_name: ['first name', 'your name', 'what\'s your name', 'may i have your name'],
    last_name: ['last name', 'surname', 'family name'],
    unique_phone_number: ['phone', 'number', 'contact number', 'mobile'],
    email: ['email', 'email address'],
    class_date__time: ['date', 'time', 'when', 'schedule'],
  };

  for (const [field, keywords] of Object.entries(fieldKeywords)) {
    if (spec.required_fields.includes(field as any)) {
      if (keywords.some(keyword => lowerResponse.includes(keyword))) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Extracts fields that have already been collected from conversation history
 */
function extractCollectedFields(history: ConversationTurn[]): Set<string> {
  const collected = new Set<string>();

  for (const turn of history) {
    if (turn.role === 'caller') {
      const text = turn.text.toLowerCase();
      
      // Simple pattern matching for collected data
      if (text.match(/^[a-z]+$/i) && text.split(/\s+/).length === 1) {
        collected.add('first_name');
      }
      if (text.includes('@')) {
        collected.add('email');
      }
      if (text.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)) {
        collected.add('unique_phone_number');
      }
      if (text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)) {
        collected.add('class_date__time');
      }
    }
  }

  return collected;
}

/**
 * Generates a focused question for a specific field
 */
function generateFieldQuestion(field: string): string {
  const questions: Record<string, string> = {
    first_name: "What's your first name?",
    last_name: "And your last name?",
    unique_phone_number: "What's the best phone number to reach you?",
    email: "What email should I send the confirmation to?",
    class_date__time: "What date and time works best for you?",
  };

  return questions[field] || `Could you provide your ${field.replace(/_/g, ' ')}?`;
}

/**
 * Creates a correction object for storage in the knowledge base
 */
export function createCorrectionEntry(
  violation: Violation,
  correctedText: string,
  agentId: string,
  conversationId: string
): {
  agentId: string;
  conversationId: string;
  turnId: string;
  originalResponse: string;
  correctedResponse: string;
  reason: string;
  violationType: string;
  timestamp: number;
} {
  return {
    agentId,
    conversationId,
    turnId: violation.turnId,
    originalResponse: violation.originalText,
    correctedResponse: correctedText,
    reason: violation.message,
    violationType: violation.type,
    timestamp: Date.now(),
  };
}

