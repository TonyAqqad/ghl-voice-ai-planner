/**
 * Transcript Evaluation Engine
 * Rule-based scoring against prompt rubrics with OpenAI-ready architecture
 */

const { pool } = require('../../database');
const { getPromptById } = require('../../db/promptStore');
const { getNicheOverlay } = require('../promptLib');

/**
 * Evaluate transcript against prompt rubric
 * @param {String} transcript - Full call transcript
 * @param {Object} promptSpec - The composed prompt spec
 * @param {Object} overlay - Niche overlay with rules
 * @param {Object} options - { useLLM: false, metrics: {} }
 * @returns {Promise<Object>} Evaluation results
 */
async function evaluateTranscript(transcript, promptSpec, overlay, options = {}) {
  const { useLLM = false, metrics = {} } = options;
  
  const evaluation = {
    pass: true,
    rubricScores: {},
    improvementNotes: [],
    suggestedPromptPatch: null,
    suggestedKbAddition: null,
    confidenceScore: 1.0
  };

  // Rule 1: Check required fields order
  const fieldScore = checkFieldsOrder(transcript, overlay.required_fields_order || [], metrics);
  evaluation.rubricScores.fieldCollection = fieldScore.score;
  evaluation.collectedFields = extractFieldValues(transcript, overlay.required_fields_order || [], metrics.fieldsCaptured || []);
  if (fieldScore.score < 4) {
    evaluation.pass = false;
    evaluation.improvementNotes.push(...fieldScore.notes);
    evaluation.suggestedPromptPatch = {
      reinforceReminder: fieldScore.missingFields
    };
  }

  // Rule 2: Check for blocked booking phrases before fields complete
  const bookingScore = checkBlockedPhrases(
    transcript, 
    overlay.blocked_booking_phrases || [], 
    metrics.fieldsCaptured || []
  );
  evaluation.rubricScores.bookingRules = bookingScore.score;
  if (bookingScore.score < 4) {
    evaluation.pass = false;
    evaluation.improvementNotes.push(...bookingScore.notes);
    evaluation.suggestedPromptPatch = {
      ...evaluation.suggestedPromptPatch,
      addBookingGate: true
    };
  }

  // Rule 3: Check tone (basic keyword matching)
  const toneScore = checkTone(transcript);
  evaluation.rubricScores.tone = toneScore.score;
  if (toneScore.score < 3) {
    evaluation.improvementNotes.push(...toneScore.notes);
  }

  // Rule 4: Check escalation/fallback offered when stuck
  const escalationScore = checkEscalation(transcript);
  evaluation.rubricScores.objectionHandling = escalationScore.score;
  if (escalationScore.score < 3) {
    evaluation.improvementNotes.push(...escalationScore.notes);
  }

  // Rule 5: Check for one question per turn
  const questionScore = checkQuestionCadence(transcript);
  evaluation.rubricScores.questionCadence = questionScore.score;
  if (questionScore.score < 3) {
    evaluation.improvementNotes.push(...questionScore.notes);
  }

  // Rule 6: Check if phone was repeated and email spelled
  const verificationScore = checkVerification(transcript, metrics);
  evaluation.rubricScores.verification = verificationScore.score;
  if (verificationScore.score < 4) {
    evaluation.improvementNotes.push(...verificationScore.notes);
  }

  // Rule 7: Check custom action triggers (if any actions are configured)
  const actionScore = checkActionTriggers(transcript, overlay, metrics.actionTriggers || []);
  if (actionScore) {
    evaluation.rubricScores.actionTriggerTiming = actionScore.score;
    evaluation.actionTriggers = actionScore.triggers;
    if (actionScore.score < 4) {
      evaluation.improvementNotes.push(...actionScore.notes);
      evaluation.suggestedPromptPatch = {
        ...evaluation.suggestedPromptPatch,
        reinforceActionTriggers: actionScore.missingActions
      };
    }
  }

  // Calculate confidence score (0.0 to 1.0)
  const scores = Object.values(evaluation.rubricScores);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  evaluation.confidenceScore = Math.min(avgScore / 5.0, 1.0);

  // Suggest KB additions if common questions detected
  const kbSuggestion = detectKbGaps(transcript, overlay);
  if (kbSuggestion) {
    evaluation.suggestedKbAddition = kbSuggestion;
  }

  // If LLM enabled, enhance evaluation (future implementation)
  if (useLLM) {
    console.log('⚠️  LLM-enhanced evaluation requested but not yet implemented');
    // TODO: Use OpenAI to refine scoring and provide more nuanced feedback
  }

  return evaluation;
}

/**
 * Check if required fields were collected in the correct order
 */
function checkFieldsOrder(transcript, requiredFields, metrics) {
  const score = 4; // Default to passing
  const notes = [];
  const missingFields = [];
  
  const transcriptLower = transcript.toLowerCase();
  const capturedFields = metrics.fieldsCaptured || [];
  
  // Check if all required fields were captured
  for (const field of requiredFields) {
    const fieldName = field.split('.').pop(); // Get last part (e.g., "first_name" from "contact.first_name")
    
    if (!capturedFields.includes(field)) {
      missingFields.push(field);
      notes.push(`Missing required field: ${fieldName}`);
    }
  }
  
  if (missingFields.length > 0) {
    return { score: 2, notes, missingFields };
  }
  
  // Check if fields appear in order in transcript (basic heuristic)
  const fieldMentions = requiredFields.map(f => {
    const fieldName = f.split('.').pop().replace('_', ' ');
    const index = transcriptLower.indexOf(fieldName);
    return { field: f, index };
  }).filter(m => m.index !== -1);
  
  // Check if indices are in ascending order
  for (let i = 1; i < fieldMentions.length; i++) {
    if (fieldMentions[i].index < fieldMentions[i - 1].index) {
      notes.push('Fields may not have been collected in the prescribed order');
      return { score: 3, notes, missingFields };
    }
  }
  
  return { score, notes, missingFields };
}

/**
 * Check for blocked booking phrases used before all fields complete
 */
function checkBlockedPhrases(transcript, blockedPhrases, fieldsCaptured) {
  const score = 4;
  const notes = [];
  
  if (blockedPhrases.length === 0) {
    return { score, notes };
  }
  
  // Check if all required fields were captured (F45 requires 4 fields)
  const allFieldsComplete = fieldsCaptured.length >= 4;
  
  const transcriptLower = transcript.toLowerCase();
  
  for (const phrase of blockedPhrases) {
    if (transcriptLower.includes(phrase.toLowerCase()) && !allFieldsComplete) {
      notes.push(`Booking phrase "${phrase}" used before all fields were captured`);
      return { score: 1, notes };
    }
  }
  
  return { score, notes };
}

/**
 * Check for robotic or unnatural language
 */
function checkTone(transcript) {
  const score = 4;
  const notes = [];
  
  const transcriptLower = transcript.toLowerCase();
  
  // Check for robotic phrases
  const roboticPhrases = [
    'processing',
    'computing',
    'please hold while i',
    'one moment while i',
    'let me process that',
    'accessing database'
  ];
  
  for (const phrase of roboticPhrases) {
    if (transcriptLower.includes(phrase)) {
      notes.push(`Avoid robotic language: "${phrase}"`);
      return { score: 2, notes };
    }
  }
  
  // Check for overly formal language
  const formalPhrases = [
    'good day sir',
    'good day madam',
    'i shall',
    'kindly provide',
    'as per'
  ];
  
  for (const phrase of formalPhrases) {
    if (transcriptLower.includes(phrase)) {
      notes.push(`Tone too formal. Use more conversational language.`);
      return { score: 3, notes };
    }
  }
  
  return { score, notes };
}

/**
 * Check if agent offered escalation or callback when stuck
 */
function checkEscalation(transcript) {
  const score = 4;
  const notes = [];
  
  const transcriptLower = transcript.toLowerCase();
  
  // Check if agent seemed stuck or unable to help
  const stuckIndicators = [
    "i don't know",
    "i'm not sure",
    "i can't help with that",
    "that's not something i can",
    "i'm unable to"
  ];
  
  const hasStuckIndicator = stuckIndicators.some(ind => transcriptLower.includes(ind));
  
  if (hasStuckIndicator) {
    // Check if escalation was offered
    const escalationOffered = transcriptLower.includes('transfer') || 
                              transcriptLower.includes('callback') ||
                              transcriptLower.includes('call you back') ||
                              transcriptLower.includes('speak with someone') ||
                              transcriptLower.includes('manager') ||
                              transcriptLower.includes('supervisor');
    
    if (!escalationOffered) {
      notes.push('Agent should offer escalation or callback when unable to help');
      return { score: 2, notes };
    }
  }
  
  return { score, notes };
}

/**
 * Check if agent asked one question at a time
 */
function checkQuestionCadence(transcript) {
  const score = 4;
  const notes = [];
  
  // Split transcript into turns (simple heuristic: split by periods or question marks)
  const turns = transcript.split(/[.?!]\s+/).filter(t => t.trim().length > 0);
  
  for (const turn of turns) {
    // Count question marks in a single turn
    const questionCount = (turn.match(/\?/g) || []).length;
    
    if (questionCount > 1) {
      notes.push('Agent asked multiple questions in a single turn. Ask one question at a time.');
      return { score: 2, notes };
    }
  }
  
  return { score, notes };
}

/**
 * Check if phone number was repeated and email was spelled out
 */
function checkVerification(transcript, metrics) {
  const score = 4;
  const notes = [];
  
  const transcriptLower = transcript.toLowerCase();
  const capturedFields = metrics.fieldsCaptured || [];
  
  // If phone was captured, check if it was repeated back
  if (capturedFields.includes('contact.unique_phone_number')) {
    const phoneRepeated = transcriptLower.includes('let me repeat that') ||
                          transcriptLower.includes('so that\'s') ||
                          transcriptLower.includes('just to confirm');
    
    if (!phoneRepeated) {
      notes.push('Phone number should be repeated back to caller for confirmation');
      return { score: 3, notes };
    }
  }
  
  // If email was captured, check if it was spelled out
  if (capturedFields.includes('contact.email')) {
    const emailSpelled = transcriptLower.includes('spell that') ||
                        transcriptLower.includes('that\'s') ||
                        transcriptLower.includes('dot com') ||
                        transcriptLower.includes('at gmail') ||
                        transcriptLower.includes('at yahoo');
    
    if (!emailSpelled) {
      notes.push('Email should be spelled out and confirmed');
      return { score: 3, notes };
    }
  }
  
  return { score, notes };
}

/**
 * Detect gaps in knowledge base coverage based on transcript
 */
function detectKbGaps(transcript, overlay) {
  const transcriptLower = transcript.toLowerCase();
  
  // Common questions that might need KB articles
  const kbPatterns = [
    { keywords: ['cancel', 'cancellation'], title: 'Cancellation Policy', outline: ['How to cancel', 'Refund policy', 'Rescheduling options'] },
    { keywords: ['price', 'cost', 'how much'], title: 'Pricing Information', outline: ['Membership tiers', 'Trial class pricing', 'Payment methods'] },
    { keywords: ['parking', 'where to park'], title: 'Parking & Directions', outline: ['Parking locations', 'Public transit options', 'Driving directions'] },
    { keywords: ['what to bring', 'what should i'], title: 'What to Bring', outline: ['Required items', 'Optional equipment', 'Dress code'] }
  ];
  
  for (const pattern of kbPatterns) {
    const matchesKeyword = pattern.keywords.some(kw => transcriptLower.includes(kw));
    
    if (matchesKeyword) {
      // Check if this topic is already in KB suggestions
      const alreadyCovered = overlay.kb_suggestions?.some(kb => 
        kb.title.toLowerCase().includes(pattern.keywords[0])
      );
      
      if (!alreadyCovered) {
        return {
          title: pattern.title,
          outline: pattern.outline,
          reason: `Caller asked about ${pattern.keywords[0]}`
        };
      }
    }
  }
  
  return null;
}

/**
 * Check if custom actions were triggered at the right time
 */
function checkActionTriggers(transcript, overlay, actionTriggers = []) {
  // If no custom actions configured, skip this check
  const expectedActions = overlay?.custom_actions_templates || [];
  if (expectedActions.length === 0) {
    return null; // No actions to evaluate
  }

  const score = {
    score: 5.0,
    notes: [],
    triggers: [],
    missingActions: []
  };

  // Parse transcript to find conversation turns
  const turns = transcript.split('\n').filter(line => line.trim());
  const totalTurns = turns.length;

  // Track which actions were triggered
  const triggeredActionNames = new Set(actionTriggers.map(a => a.action_name));

  // Check each expected action
  expectedActions.forEach(expectedAction => {
    const actionName = expectedAction.name;
    const trigger = actionTriggers.find(t => t.action_name === actionName);

    if (trigger) {
      // Action was triggered - check if timing was correct
      score.triggers.push({
        name: actionName,
        type: expectedAction.description || 'Custom Action',
        turn: trigger.conversation_turn,
        totalTurns: totalTurns,
        timely: trigger.was_timely !== false,
        success: trigger.success,
        parameters: trigger.parameters
      });

      // Penalize if triggered too early
      if (trigger.conversation_turn < 3 && actionName.includes('upsert') && !trigger.was_timely) {
        score.score -= 0.5;
        score.notes.push(`${actionName} triggered too early (turn ${trigger.conversation_turn}) - should wait for more info`);
      }

      // Penalize if triggered too late
      if (trigger.conversation_turn > totalTurns * 0.8) {
        score.score -= 0.5;
        score.notes.push(`${actionName} triggered late (turn ${trigger.conversation_turn}/${totalTurns})`);
      }

      // Check if it failed
      if (!trigger.success) {
        score.score -= 1.0;
        score.notes.push(`${actionName} failed: ${trigger.error_message || 'Unknown error'}`);
      }
    } else {
      // Action was NOT triggered - check if it should have been
      const shouldTrigger = shouldActionHaveTriggered(actionName, transcript, overlay);
      
      if (shouldTrigger.should) {
        score.score -= 1.5;
        score.notes.push(`Missing action trigger: ${actionName} should have been called ${shouldTrigger.reason}`);
        score.missingActions.push(actionName);
      }
    }
  });

  // Cap score at 5.0 and floor at 0
  score.score = Math.max(0, Math.min(5.0, score.score));

  return score;
}

/**
 * Determine if an action should have been triggered based on conversation
 */
function shouldActionHaveTriggered(actionName, transcript, overlay) {
  const transcriptLower = transcript.toLowerCase();
  
  // Contact creation/upsert should happen if fields were collected
  if (actionName.includes('upsert') || actionName.includes('contact')) {
    const hasName = /(?:name|i'm|i am)\s+\w+/i.test(transcript);
    const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(transcript);
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(transcript);
    
    if (hasName && hasPhone) {
      return {
        should: true,
        reason: 'after collecting name and phone'
      };
    }
  }

  // Scheduling should happen if booking was discussed
  if (actionName.includes('schedule') || actionName.includes('book')) {
    const bookingKeywords = ['book', 'schedule', 'appointment', 'class', 'when can', 'what time'];
    const hasBookingIntent = bookingKeywords.some(kw => transcriptLower.includes(kw));
    
    if (hasBookingIntent) {
      return {
        should: true,
        reason: 'after booking intent was expressed'
      };
    }
  }

  // Workflow trigger should happen if specific conditions met
  if (actionName.includes('workflow') || actionName.includes('trigger')) {
    // Check for completion keywords
    const completionKeywords = ['all set', 'confirmed', 'looking forward', 'see you'];
    const hasCompletion = completionKeywords.some(kw => transcriptLower.includes(kw));
    
    if (hasCompletion) {
      return {
        should: true,
        reason: 'at conversation completion'
      };
    }
  }

  return { should: false, reason: '' };
}

/**
 * Extract actual field values from the transcript
 */
function extractFieldValues(transcript, requiredFields, fieldsCaptured) {
  const fields = [];
  
  // Define expected fields and their extraction patterns
  const fieldPatterns = {
    'contact.first_name': {
      label: 'First Name',
      pattern: /(?:first name|my name is|i'm|i am|this is|call me)\s+([A-Z][a-z]+)/i,
      icon: 'user'
    },
    'contact.last_name': {
      label: 'Last Name',
      pattern: /(?:last name|surname)\s+(?:is\s+)?([A-Z][a-z]+)|([A-Z][a-z]+)\s+is my last name/i,
      icon: 'user'
    },
    'contact.unique_phone_number': {
      label: 'Phone Number',
      pattern: /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/,
      icon: 'phone'
    },
    'contact.phone': {
      label: 'Phone Number',
      pattern: /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/,
      icon: 'phone'
    },
    'contact.email': {
      label: 'Email',
      pattern: /([\w.-]+@[\w.-]+\.\w+)/i,
      icon: 'mail'
    }
  };

  // Check each required field
  requiredFields.forEach(field => {
    const pattern = fieldPatterns[field];
    if (!pattern) {
      // Unknown field type, just track if captured
      fields.push({
        field: field,
        label: field.split('.').pop().replace(/_/g, ' '),
        value: null,
        collected: fieldsCaptured.includes(field),
        icon: 'check'
      });
      return;
    }

    const match = transcript.match(pattern.pattern);
    const value = match ? (match[1] || match[2] || match[0]).trim() : null;
    
    fields.push({
      field: field,
      label: pattern.label,
      value: value,
      collected: fieldsCaptured.includes(field) || (value !== null),
      icon: pattern.icon
    });
  });

  return fields;
}

module.exports = { evaluateTranscript };

