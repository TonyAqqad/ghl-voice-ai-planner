import {
  ConversationTurn,
  FieldCapture,
  RubricKey,
  RubricScore,
  SessionEvaluation,
} from './types';

const emailRx = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const phoneRx = /\b(\+?\d[\d\s\-()]{7,}\d)\b/;
// Date/time patterns for class_date__time field
const dateTimeRx = /(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}).*?(\d{1,2}:\d{2}|at\s+\d{1,2}|\d{1,2}\s*(am|pm|AM|PM))/i;

export function extractFieldCaptures(turns: ConversationTurn[]): FieldCapture[] {
  const out: FieldCapture[] = [];

  for (const t of turns) {
    if (t.role !== 'caller') continue;

    if (emailRx.test(t.text)) {
      out.push({
        key: 'email',
        value: t.text.match(emailRx)![0],
        turnId: t.id,
        valid: true,
        source: 'detected',
      });
    }

    if (phoneRx.test(t.text)) {
      out.push({
        key: 'unique_phone_number',
        value: t.text.match(phoneRx)![0],
        turnId: t.id,
        valid: true,
        source: 'detected',
      });
    }

    const name = t.text.match(/\b(my name is|it's|i am|i'm)\s+([a-z]+)(\s+([a-z]+))?/i);
    if (name) {
      out.push({
        key: 'first_name',
        value: name[2],
        turnId: t.id,
        valid: true,
        source: 'detected',
      });
      if (name[4]) {
        out.push({
          key: 'last_name',
          value: name[4],
          turnId: t.id,
          valid: true,
          source: 'detected',
        });
      }
    } else if (/^[A-Z][a-z]{2,}$/.test(t.text.trim())) {
      out.push({
        key: 'first_name',
        value: t.text.trim(),
        turnId: t.id,
        valid: true,
        source: 'detected',
      });
    }

    // Detect class date/time (e.g., "tomorrow at 9am", "Monday 3pm", "Jan 5th at 2pm")
    if (dateTimeRx.test(t.text)) {
      out.push({
        key: 'class_date__time',
        value: t.text.trim(),
        turnId: t.id,
        valid: true,
        source: 'detected',
      });
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
): SessionEvaluation {
  const startedAt = turns[0]?.ts ?? Date.now();
  const endedAt = turns.length > 0 ? turns[turns.length - 1].ts : startedAt;
  const fields = extractFieldCaptures(turns);

  const askedFor = (phrase: RegExp) =>
    turns.some((t) => t.role === 'agent' && phrase.test(t.text));

  const callerGave = (pred: (t: ConversationTurn) => boolean) =>
    turns.some((t) => t.role === 'caller' && pred(t));

  const rubric: RubricScore[] = [
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
    startedAt,
    endedAt,
    collectedFields: fields,
    rubric,
    confidence,
    correctionsApplied: 0,
    version,
  };
}

