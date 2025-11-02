import { evaluateSession } from './sessionEvaluator';
import type {
  ConversationTurn,
  FieldCapture,
  RubricScore,
  SessionEvaluation,
} from './types';
import type { PromptSpec } from '../spec/specTypes';

const STORAGE_KEY = 'ghl-voice-ai-golden-dataset';
const GLOBAL_FALLBACK_KEY = '__GHL_GOLDEN_DATASET__';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function serialize(samples: GoldenSample[]): string {
  return JSON.stringify(samples);
}

function deserialize(raw: string | null): GoldenSample[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GoldenSample[];
  } catch {
    console.warn('Golden dataset storage corrupted, resetting.');
    return [];
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function readAll(): GoldenSample[] {
  if (isBrowser()) {
    return deserialize(window.localStorage.getItem(STORAGE_KEY));
  }

  const globalStore = globalThis as Record<string, unknown>;
  if (!Array.isArray(globalStore[GLOBAL_FALLBACK_KEY])) {
    globalStore[GLOBAL_FALLBACK_KEY] = [];
  }
  return clone(globalStore[GLOBAL_FALLBACK_KEY] as GoldenSample[]);
}

function writeAll(samples: GoldenSample[]): void {
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, serialize(samples));
    return;
  }

  const globalStore = globalThis as Record<string, unknown>;
  globalStore[GLOBAL_FALLBACK_KEY] = clone(samples);
}

export interface GoldenSample {
  id: string;
  agentId: string;
  niche: string;
  promptHash: string;
  title: string;
  notes?: string;
  createdAt: string;
  transcript: ConversationTurn[];
  expected: {
    collectedFields: FieldCapture[];
    rubric: RubricScore[];
    confidence: number;
  };
  originalEvaluation?: SessionEvaluation;
}

export interface GoldenSampleQuery {
  agentId?: string;
  promptHash?: string;
  niche?: string;
  ids?: string[];
}

export type ReplayStatus = 'pass' | 'warn' | 'fail';

export interface ReplaySummary {
  sampleId: string;
  title: string;
  notes?: string;
  runAt: string;
  promptHash: string;
  niche: string;
  expectedConfidence: number;
  actualConfidence: number;
  confidenceDelta: number;
  missingFields: string[];
  newFields: string[];
  rubricChanges: Array<{
    key: RubricScore['key'];
    expected: RubricScore['score'];
    actual: RubricScore['score'] | null;
  }>;
  status: ReplayStatus;
  evaluation: SessionEvaluation;
}

export function saveGoldenSample(sample: GoldenSample): void {
  const samples = readAll();
  const index = samples.findIndex((s) => s.id === sample.id);
  const payload = clone(sample);

  if (index >= 0) {
    samples[index] = payload;
  } else {
    samples.unshift(payload);
  }

  writeAll(samples);
}

export function listGoldenSamples(query: GoldenSampleQuery = {}): GoldenSample[] {
  const samples = readAll();
  const { agentId, promptHash, niche, ids } = query;

  return samples
    .filter((sample) => {
      if (agentId && sample.agentId !== agentId) return false;
      if (promptHash && sample.promptHash !== promptHash) return false;
      if (niche && sample.niche !== niche) return false;
      if (ids && ids.length > 0 && !ids.includes(sample.id)) return false;
      return true;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function deleteGoldenSample(id: string): void {
  const samples = readAll();
  const next = samples.filter((sample) => sample.id !== id);

  if (next.length !== samples.length) {
    writeAll(next);
  }
}

function diffFields(
  expected: FieldCapture[],
  actual: FieldCapture[]
): { missing: string[]; added: string[] } {
  const expectedKeys = new Set(expected.map((f) => f.key));
  const actualKeys = new Set(actual.map((f) => f.key));

  const missing = Array.from(expectedKeys).filter((key) => !actualKeys.has(key));
  const added = Array.from(actualKeys).filter((key) => !expectedKeys.has(key));

  return { missing, added };
}

function diffRubric(
  expected: RubricScore[],
  actual: RubricScore[]
): Array<{ key: RubricScore['key']; expected: number | null; actual: number | null }> {
  const actualMap = new Map(actual.map((score) => [score.key, score.score ?? null]));

  return expected
    .map((score) => {
      const actualScore = actualMap.has(score.key) ? actualMap.get(score.key)! : null;
      return {
        key: score.key,
        expected: score.score ?? null,
        actual: actualScore,
      };
    })
    .filter((entry) => entry.expected !== entry.actual);
}

function evaluateSample(
  sample: GoldenSample,
  spec?: PromptSpec | null
): SessionEvaluation {
  const conversationId = `${sample.id}-replay-${Date.now()}`;
  return evaluateSession(
    conversationId,
    sample.transcript,
    'gold-replay',
    sample.agentId,
    sample.niche,
    spec ?? null
  );
}

function scoreStatus(
  missingFields: string[],
  rubricChanges: ReplaySummary['rubricChanges'],
  confidenceDelta: number
): ReplayStatus {
  if (missingFields.length > 0) {
    return 'fail';
  }

  const regressions = rubricChanges.filter((change) => {
    if (change.expected == null) return false;
    if (change.actual == null) return true;
    return change.actual < change.expected;
  });

  if (regressions.length > 0) {
    return 'warn';
  }

  if (confidenceDelta < -5) {
    return 'warn';
  }

  return 'pass';
}

export function replayGoldenDataset(
  query: GoldenSampleQuery,
  options: { spec?: PromptSpec | null } = {}
): ReplaySummary[] {
  const samples = listGoldenSamples(query);
  const spec = options.spec ?? null;
  const runAt = new Date().toISOString();

  return samples.map((sample) => {
    const evaluation = evaluateSample(sample, spec);
    const fieldDiff = diffFields(sample.expected.collectedFields, evaluation.collectedFields);
    const rubricChanges = diffRubric(sample.expected.rubric, evaluation.rubric);
    const confidenceDelta = Math.round((evaluation.confidence - sample.expected.confidence) * 10) / 10;

    return {
      sampleId: sample.id,
      title: sample.title,
      notes: sample.notes,
      runAt,
      promptHash: sample.promptHash,
      niche: sample.niche,
      expectedConfidence: sample.expected.confidence,
      actualConfidence: evaluation.confidence,
      confidenceDelta,
      missingFields: fieldDiff.missing,
      newFields: fieldDiff.added,
      rubricChanges,
      status: scoreStatus(fieldDiff.missing, rubricChanges, confidenceDelta),
      evaluation,
    };
  });
}
