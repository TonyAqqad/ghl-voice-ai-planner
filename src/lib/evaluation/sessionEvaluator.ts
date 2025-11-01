import {
  ConversationTurn,
  FieldCapture,
  RubricKey,
  RubricScore,
  SessionEvaluation,
} from './types';
import { PromptSpec } from '../spec/specTypes';
import { buildRubricFromSpec } from './rubricFromSpec';

const emailRx = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const phoneRx = /\b(\+?\d[\d\s\-()]{7,}\d)\b/;
// Date/time patterns for class_date__time field
const dateTimeRx = /(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}).*?(\d{1,2}:\d{2}|at\s+\d{1,2}|\d{1,2}\s*(am|pm|AM|PM))/i;

export function extractFieldCaptures(turns: ConversationTurn[]): FieldCapture[] {
  const out: FieldCapture[] = [];
  
  // Track what we've already captured to avoid duplicates
  const capturedKeys = new Set<string>();

  for (const t of turns) {
    if (t.role !== 'caller') continue;

    // Extract email
    if (emailRx.test(t.text) && !capturedKeys.has('email')) {
      out.push({
        key: 'email',
        value: t.text.match(emailRx)![0],
        turnId: t.id,
        valid: true,
        source: 'detected',
      });
      capturedKeys.add('email');
    }

    // Extract phone number
    if (phoneRx.test(t.text) && !capturedKeys.has('unique_phone_number')) {
      out.push({
        key: 'unique_phone_number',
        value: t.text.match(phoneRx)![0],
        turnId: t.id,
        valid: true,
        source: 'detected',
      });
      capturedKeys.add('unique_phone_number');
    }

    // Extract names - improved patterns to handle compound and sequential responses
    const nameWithPrefix = t.text.match(/\b(my name is|it's|i am|i'm)\s+([a-z]+)(\s+([a-z]+))?/i);
    if (nameWithPrefix) {
      if (!capturedKeys.has('first_name')) {
        out.push({
          key: 'first_name',
          value: nameWithPrefix[2],
          turnId: t.id,
          valid: true,
          source: 'detected',
        });
        capturedKeys.add('first_name');
      }
      if (nameWithPrefix[4] && !capturedKeys.has('last_name')) {
        out.push({
          key: 'last_name',
          value: nameWithPrefix[4],
          turnId: t.id,
          valid: true,
          source: 'detected',
        });
        capturedKeys.add('last_name');
      }
    } 
    // Only attempt standalone name extraction if no prefix was found
    else {
      // Extract standalone names - be more flexible with pattern
      const words = t.text.split(/\s+/).map(w => w.trim()).filter(w => w.length > 0);
      // Match any word starting with capital letter followed by at least one letter
      const nameWords = words.filter(w => /^[A-Z][a-zA-Z]+$/.test(w));
      
      if (nameWords.length > 0) {
        // CRITICAL FIX: Check which name field we need FIRST before pushing
        const needsFirstName = !capturedKeys.has('first_name');
        const needsLastName = !capturedKeys.has('last_name');
        
        // If we need first_name, capture it from the first name-like word
        if (needsFirstName) {
          out.push({
            key: 'first_name',
            value: nameWords[0],
            turnId: t.id,
            valid: true,
            source: 'detected',
          });
          capturedKeys.add('first_name');
          
          // If there's a second name-like word in the SAME response and we need last_name
          if (nameWords.length > 1 && needsLastName) {
            out.push({
              key: 'last_name',
              value: nameWords[1],
              turnId: t.id,
              valid: true,
              source: 'detected',
            });
            capturedKeys.add('last_name');
          }
        }
        // If we already have first_name but need last_name, capture from first name-like word
        else if (needsLastName) {
          out.push({
            key: 'last_name',
            value: nameWords[0],
            turnId: t.id,
            valid: true,
            source: 'detected',
          });
          capturedKeys.add('last_name');
        }
      }
    }

    // Detect class date/time (e.g., "tomorrow at 9am", "Monday 3pm", "Monday at 5:30am")
    if (dateTimeRx.test(t.text) && !capturedKeys.has('class_date__time')) {
      out.push({
        key: 'class_date__time',
        value: t.text.trim(),
        turnId: t.id,
        valid: true,
        source: 'detected',
      });
      capturedKeys.add('class_date__time');
    }
  }

  return out;
}

function scoreBoolean(
  pass: boolean,
  evidenceTurnIds: string[],
  key: RubricKey,
  notes?: string,
): RubricScore {
  return {
    key,
    score: pass ? 5 : 2,
    notes,
    evidenceTurnIds,
  };
}

export function evaluateSession(
  conversationId: string,
  turns: ConversationTurn[],
  version = 'v1.1',
  agentId: string = 'unknown',
  niche?: string,
  spec?: PromptSpec | null,
): SessionEvaluation {
  const startedAt = turns[0]?.ts ?? Date.now();
  const endedAt = turns.length > 0 ? turns[turns.length - 1].ts : startedAt;
  const fields = extractFieldCaptures(turns);

  // If spec is provided, use spec-based rubric builder
  let rubric: RubricScore[];
  
  if (spec) {
    console.log('✅ Using spec-based rubric for evaluation');
    rubric = buildRubricFromSpec(spec, turns, fields);
  } else {
    // Fallback to legacy rubric
    console.log('ℹ️ Using legacy rubric (no spec provided)');
    
    const askedFor = (phrase: RegExp) =>
      turns.some((t) => t.role === 'agent' && phrase.test(t.text));

    const callerGave = (pred: (t: ConversationTurn) => boolean) =>
      turns.some((t) => t.role === 'caller' && pred(t));

    rubric = [
      scoreBoolean(
        fields.some((f) => ['first_name', 'unique_phone_number', 'email'].includes(f.key)),
        fields.map((f) => f.turnId),
        'fieldCollection',
        'Captured at least one key contact field',
      ),
      scoreBoolean(
        askedFor(/trial|class|schedule|booking/i) &&
          callerGave((t) => /yes|works|okay|confirm/i.test(t.text)),
        turns.map((t) => t.id),
        'bookingRules',
        'Booking flow reached an affirmative',
      ),
      scoreBoolean(
        askedFor(/first\s*name|email|phone/i),
        turns
          .filter((t) => /first\s*name|email|phone/i.test(t.text))
          .map((t) => t.id),
        'questionCadence',
        'Used guided cadence to collect basics',
      ),
      scoreBoolean(
        askedFor(/confirm|verify|spell|email/i),
        turns.map((t) => t.id),
        'verification',
        'Attempted verification',
      ),
      {
        key: 'tone',
        score: null,
        evidenceTurnIds: turns.map((t) => t.id),
        notes: 'Tone not auto-scored; adjust manually',
      },
    turns.some((t) =>
      /price|too\s+expensive|not\s+interested|busy/i.test(t.text),
    )
      ? scoreBoolean(
          turns.some(
            (t) =>
              t.role === 'agent' &&
              /understand|no\s+problem|we can|option/i.test(t.text),
          ),
          turns.map((t) => t.id),
          'objectionHandling',
          'Handled at least one objection',
        )
      : {
          key: 'objectionHandling',
          score: null,
          evidenceTurnIds: [],
          notes: 'Not tested in this call',
        },
  ];
  }

  const scored = rubric.filter((r) => r.score !== null) as Required<RubricScore>[];
  const confidence =
    scored.length === 0
      ? 0
      : Math.round(
          (scored.reduce((sum, r) => sum + (r.score ?? 0), 0) /
            (scored.length * 5)) *
            100,
        );

  return {
    conversationId,
    agentId,
    niche,
    startedAt,
    endedAt,
    collectedFields: fields,
    rubric,
    confidence,
    correctionsApplied: 0,
    version,
    transcript: turns,
  };
}

