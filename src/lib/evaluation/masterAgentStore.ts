import { FieldCapture, RubricScore, SessionEvaluation } from './types';

const KEY = 'ghl-master-agent-sessions';

const isBrowser = typeof window !== 'undefined';

function safeParse(value: string | null): SessionEvaluation[] {
  if (!value) return [];
  try {
    return JSON.parse(value) as SessionEvaluation[];
  } catch {
    return [];
  }
}

export function loadSessions(): SessionEvaluation[] {
  if (!isBrowser) return [];
  return safeParse(window.localStorage.getItem(KEY));
}

export function saveSession(e: SessionEvaluation) {
  if (!isBrowser) return;
  const all = loadSessions().filter((s) => s.conversationId !== e.conversationId);
  all.unshift(e);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function applyManualCorrections(
  conversationId: string,
  updates: { rubric?: RubricScore[]; fields?: FieldCapture[] } = {},
) {
  if (!isBrowser) return;
  const all = loadSessions();
  const index = all.findIndex((s) => s.conversationId === conversationId);
  if (index === -1) return;

  if (updates.rubric) {
    all[index].rubric = updates.rubric;
  }

  if (updates.fields) {
    all[index].collectedFields = updates.fields;
  }

  all[index].correctionsApplied = (all[index].correctionsApplied ?? 0) + 1;
  window.localStorage.setItem(KEY, JSON.stringify(all));
  return all[index];
}

