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

module.exports = { evaluateTranscript };

