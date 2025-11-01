/**
 * Dynamic Rubric Builder
 * 
 * Builds rubric tests from PromptSpec to ensure agent behavior matches prompt rules
 */

import { PromptSpec } from '../spec/specTypes';
import { RubricScore, ConversationTurn, FieldCapture } from './types';

/**
 * Build rubric tests from spec
 * Returns dynamic rubric scores based on the spec requirements
 */
export function buildRubricFromSpec(
  spec: PromptSpec,
  turns: ConversationTurn[],
  collectedFields: FieldCapture[]
): RubricScore[] {
  const rubric: RubricScore[] = [];

  // 1. Field Collection Score
  rubric.push(evaluateFieldCollection(spec, collectedFields));

  // 2. Booking Rules Score
  rubric.push(evaluateBookingRules(spec, turns, collectedFields));

  // 3. Question Cadence Score
  rubric.push(evaluateQuestionCadence(spec, turns));

  // 4. Verification Score
  rubric.push(evaluateVerification(spec, turns));

  // 5. Objection Handling (N/A unless objection detected)
  rubric.push(evaluateObjectionHandling(turns));

  return rubric;
}

/**
 * Evaluate field collection against spec requirements
 */
function evaluateFieldCollection(spec: PromptSpec, collectedFields: FieldCapture[]): RubricScore {
  const requiredKeys = spec.required_fields;
  const collectedKeys = new Set(collectedFields.map(f => f.key));
  
  const missingFields = requiredKeys.filter(key => !collectedKeys.has(key));
  const collectedCount = requiredKeys.filter(key => collectedKeys.has(key)).length;
  
  let score = (collectedCount / requiredKeys.length) * 5;
  
  // Bonus for following field_order
  let orderScore = 0;
  const orderedFields = collectedFields.filter(f => requiredKeys.includes(f.key as any));
  for (let i = 0; i < orderedFields.length; i++) {
    const expectedKey = spec.field_order[i];
    if (orderedFields[i].key === expectedKey) {
      orderScore += 1;
    }
  }
  
  if (orderedFields.length > 0) {
    score += (orderScore / orderedFields.length) * 0.5; // Small bonus for order
  }

  const notes = missingFields.length > 0
    ? `Missing required fields: ${missingFields.join(', ')}`
    : `All ${requiredKeys.length} required fields collected`;

  return {
    key: 'fieldCollection',
    score: Math.min(5, score),
    maxScore: 5,
    notes,
  };
}

/**
 * Evaluate booking rules - no booking language before all fields collected
 */
function evaluateBookingRules(
  spec: PromptSpec,
  turns: ConversationTurn[],
  collectedFields: FieldCapture[]
): RubricScore {
  if (!spec.block_booking_until_fields) {
    return {
      key: 'bookingRules',
      score: null,
      maxScore: 5,
      notes: 'N/A - booking rules not enforced',
    };
  }

  const requiredKeys = spec.required_fields;
  const disallowedPhrases = spec.disallowed_phrases || [];
  
  let violations: string[] = [];
  let allFieldsCollectedIndex = -1;

  // Find when all fields are collected
  for (let i = 0; i < turns.length; i++) {
    const turnFieldCount = collectedFields.filter(f => {
      const turnIndex = turns.findIndex(t => t.id === f.turnId);
      return turnIndex !== -1 && turnIndex <= i;
    }).length;

    if (turnFieldCount >= requiredKeys.length) {
      allFieldsCollectedIndex = i;
      break;
    }
  }

  // Check for early booking language
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.role !== 'agent') continue;

    const text = turn.text.toLowerCase();
    
    // If we haven't collected all fields yet
    if (allFieldsCollectedIndex === -1 || i < allFieldsCollectedIndex) {
      // Check for disallowed phrases
      for (const phrase of disallowedPhrases) {
        if (text.includes(phrase.toLowerCase())) {
          violations.push(`Early booking language detected: "${phrase}"`);
          break;
        }
      }
      
      // Check for generic booking words
      if (/\b(book|booked|booking|schedule|scheduled|scheduling)\b/i.test(text)) {
        violations.push(`Booking language used before all fields collected (turn ${i + 1})`);
      }
    }
  }

  const score = violations.length === 0 ? 5 : Math.max(0, 5 - violations.length);
  const notes = violations.length === 0
    ? 'No early booking language detected'
    : violations.join('; ');

  return {
    key: 'bookingRules',
    score,
    maxScore: 5,
    notes,
  };
}

/**
 * Evaluate question cadence - one question at a time, max words
 */
function evaluateQuestionCadence(spec: PromptSpec, turns: ConversationTurn[]): RubricScore {
  const maxWords = spec.max_words_per_turn || 30;
  let violations: string[] = [];

  const agentTurns = turns.filter(t => t.role === 'agent');

  for (const turn of agentTurns) {
    const text = turn.text;
    const wordCount = text.split(/\s+/).length;
    const questionCount = (text.match(/\?/g) || []).length;

    if (questionCount > 1) {
      violations.push(`Multiple questions in one turn (${questionCount} questions)`);
    }

    if (wordCount > maxWords) {
      violations.push(`Turn exceeds ${maxWords} words (${wordCount} words)`);
    }
  }

  const score = violations.length === 0 ? 5 : Math.max(0, 5 - violations.length * 0.5);
  const notes = violations.length === 0
    ? `Cadence respected: 1 question per turn, ≤${maxWords} words`
    : violations.slice(0, 2).join('; ');

  return {
    key: 'questionCadence',
    score,
    maxScore: 5,
    notes,
  };
}

/**
 * Evaluate verification steps - phone repeat, email spell-back
 */
function evaluateVerification(spec: PromptSpec, turns: ConversationTurn[]): RubricScore {
  const { repeat_phone, spell_email } = spec.confirmations;
  
  if (!repeat_phone && !spell_email) {
    return {
      key: 'verification',
      score: null,
      maxScore: 5,
      notes: 'N/A - no verification rules in spec',
    };
  }

  let phoneRepeated = false;
  let emailSpelled = false;

  for (const turn of turns) {
    if (turn.role !== 'agent') continue;
    const text = turn.text.toLowerCase();

    // Check for phone repeat
    if (repeat_phone && !phoneRepeated) {
      if (
        /repeat.*phone|confirm.*phone|phone.*correct|verify.*phone/i.test(text) ||
        /\d{3}.*\d{3}.*\d{4}/.test(turn.text) // Agent reading back phone
      ) {
        phoneRepeated = true;
      }
    }

    // Check for email spell-back
    if (spell_email && !emailSpelled) {
      if (
        /spell.*email|confirm.*email|email.*correct|verify.*email/i.test(text) ||
        /\b[a-z]\s+[a-z]\s+[a-z]/i.test(turn.text) // Agent spelling letters
      ) {
        emailSpelled = true;
      }
    }
  }

  const required = (repeat_phone ? 1 : 0) + (spell_email ? 1 : 0);
  const completed = (phoneRepeated ? 1 : 0) + (emailSpelled ? 1 : 0);
  const score = (completed / required) * 5;

  const missing: string[] = [];
  if (repeat_phone && !phoneRepeated) missing.push('phone repeat');
  if (spell_email && !emailSpelled) missing.push('email spell-back');

  const notes = missing.length === 0
    ? 'All verification steps completed'
    : `Missing: ${missing.join(', ')}`;

  return {
    key: 'verification',
    score,
    maxScore: 5,
    notes,
  };
}

/**
 * Evaluate objection handling - N/A unless objection detected
 */
function evaluateObjectionHandling(turns: ConversationTurn[]): RubricScore {
  const objectionKeywords = [
    'too expensive',
    'too much',
    'can\'t afford',
    'not interested',
    'not right now',
    'maybe later',
    'need to think',
    'busy',
    'no time'
  ];

  let objectionDetected = false;
  let handledWell = false;

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.role !== 'caller') continue;

    const text = turn.text.toLowerCase();
    for (const keyword of objectionKeywords) {
      if (text.includes(keyword)) {
        objectionDetected = true;

        // Check agent's response
        const nextAgentTurn = turns.slice(i + 1).find(t => t.role === 'agent');
        if (nextAgentTurn) {
          const response = nextAgentTurn.text.toLowerCase();
          // Good handling: acknowledges, empathizes, offers solution
          if (
            /understand|appreciate|hear you|makes sense/i.test(response) &&
            !/(just|simply|only)/i.test(response) // Avoid minimizing
          ) {
            handledWell = true;
          }
        }
        break;
      }
    }
    if (objectionDetected) break;
  }

  if (!objectionDetected) {
    return {
      key: 'objectionHandling',
      score: null,
      maxScore: 5,
      notes: 'N/A - no objections raised',
    };
  }

  const score = handledWell ? 5 : 2;
  const notes = handledWell
    ? 'Objection handled with empathy'
    : 'Objection detected but not handled effectively';

  return {
    key: 'objectionHandling',
    score,
    maxScore: 5,
    notes,
  };
}

