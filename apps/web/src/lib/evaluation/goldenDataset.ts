import { SessionEvaluation, ConversationTurn, FieldCapture, RubricScore } from './types';
import { evaluateAfterCallWithSpec, evaluateAfterCall } from '../prompt/masterOrchestrator';
import type { PromptSpec } from '../spec/specTypes';

const GOLD_STORAGE_KEY = 'ghl-golden-datasets';

export interface GoldenSample {
  id: string;
  agentId: string;
  niche?: string;
  promptHash: string;
  title: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  transcript: ConversationTurn[];
  expected: {
    collectedFields: FieldCapture[];
    rubric: RubricScore[];
    confidence: number;
  };
  originalEvaluation: SessionEvaluation;
}

export interface ReplaySummary {
  sample: GoldenSample;
  evaluation: SessionEvaluation;
  deltas: {
    confidence: number;
    missingFields: string[];
    degradedRubrics: string[];
  };
}

function loadAllSamples(): GoldenSample[] {
  try {
    const raw = localStorage.getItem(GOLD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Failed to load golden dataset:', error);
    return [];
  }
}

function persistSamples(samples: GoldenSample[]) {
  localStorage.setItem(GOLD_STORAGE_KEY, JSON.stringify(samples));
}

export function saveGoldenSample(sample: GoldenSample) {
  const all = loadAllSamples();
  const existingIndex = all.findIndex((s) => s.id === sample.id);
  if (existingIndex >= 0) {
    all[existingIndex] = sample;
  } else {
    all.unshift(sample);
  }
  persistSamples(all.slice(0, 200));
}

export function deleteGoldenSample(id: string) {
  const all = loadAllSamples();
  persistSamples(all.filter((sample) => sample.id !== id));
}

export function listGoldenSamples(filter?: {
  agentId?: string;
  promptHash?: string;
  niche?: string;
}): GoldenSample[] {
  const all = loadAllSamples();
  if (!filter) return all;
  return all.filter((sample) => {
    if (filter.agentId && sample.agentId !== filter.agentId) return false;
    if (filter.promptHash && sample.promptHash !== filter.promptHash) return false;
    if (filter.niche && sample.niche !== filter.niche) return false;
    return true;
  });
}

export function replayGoldenSample(
  sample: GoldenSample,
  options: {
    spec?: PromptSpec | null;
    agentId?: string;
    niche?: string;
  } = {}
): ReplaySummary {
  let evaluation: SessionEvaluation;
  if (options.spec) {
    evaluation = evaluateAfterCallWithSpec(
      `replay-${sample.id}`,
      sample.transcript,
      options.agentId || sample.agentId,
      options.spec,
      options.niche || sample.niche
    );
  } else {
    evaluation = evaluateAfterCall(
      `replay-${sample.id}`,
      sample.transcript,
      options.agentId || sample.agentId,
      options.niche || sample.niche
    );
  }

  const expectedFields = sample.expected.collectedFields.filter((field) => field.valid);
  const replayFields = evaluation.collectedFields.filter((field) => field.valid);
  const missingFields = expectedFields
    .map((field) => field.key)
    .filter((key) => !replayFields.some((field) => field.key === key));

  const degradedRubrics = sample.expected.rubric
    .filter((expectedRubric) => {
      const replayRubric = evaluation.rubric.find((r) => r.key === expectedRubric.key);
      if (!replayRubric) return true;
      if (typeof expectedRubric.score === 'number' && typeof replayRubric.score === 'number') {
        return replayRubric.score < expectedRubric.score;
      }
      return false;
    })
    .map((rubric) => rubric.key);

  return {
    sample,
    evaluation,
    deltas: {
      confidence: evaluation.confidence - sample.expected.confidence,
      missingFields,
      degradedRubrics,
    },
  };
}

export function replayGoldenDataset(
  filter: {
    agentId: string;
    promptHash: string;
    niche?: string;
  },
  options: {
    spec?: PromptSpec | null;
  } = {}
): ReplaySummary[] {
  const samples = listGoldenSamples(filter);
  return samples.map((sample) =>
    replayGoldenSample(sample, {
      spec: options.spec,
      agentId: filter.agentId,
      niche: filter.niche || sample.niche,
    })
  );
}

