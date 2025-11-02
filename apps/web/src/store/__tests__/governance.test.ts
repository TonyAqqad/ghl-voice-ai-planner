import { act } from '@testing-library/react';
import { useStore } from '../useStore';

describe('governance store', () => {
  beforeEach(() => {
    act(() => {
      useStore.setState(() => ({
        governanceState: {},
        tokenBudgets: {},
        observability: {},
        turnCache: {},
      }));
    });
  });

  it('gates an agent when confidence falls below threshold', () => {
    const store = useStore.getState();
    store.ensureAgentGovernance('agent-1');

    const evaluation = store.recordAgentEvaluation('agent-1', 45, 'eval-low');
    expect(evaluation.isGated).toBe(true);

    const status = store.checkAgentGate('agent-1');
    expect(status.isGated).toBe(true);
    expect(status.reason).toContain('Confidence');
  });

  it('clears the gate when confidence recovers', () => {
    const store = useStore.getState();
    store.ensureAgentGovernance('agent-2');

    store.recordAgentEvaluation('agent-2', 40, 'eval-low');
    const afterRecover = store.recordAgentEvaluation('agent-2', 82, 'eval-high');

    expect(afterRecover.isGated).toBe(false);
    const status = store.checkAgentGate('agent-2');
    expect(status.isGated).toBe(false);
  });

  it('enforces per-agent token budgets', () => {
    const store = useStore.getState();
    store.setTokenBudget('agent-3', 1000);
    const ok = store.checkTokenBudget('agent-3', 400);
    expect(ok.allowed).toBe(true);

    store.consumeTokenBudget('agent-3', 850);
    const blocked = store.checkTokenBudget('agent-3', 200);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBeLessThan(100);
  });

  it('records observability metrics and cache hits', () => {
    const store = useStore.getState();
    store.ensureAgentGovernance('agent-4');
    store.ensureTokenBudget('agent-4', 2000);

    store.recordInvocationMetrics('agent-4', {
      tokens: 250,
      costUsd: 0.15,
      latencyMs: 320,
      source: 'live',
      conversationId: 'conv-123',
    });

    store.recordCacheHit('agent-4');

    const metrics = store.observability['agent-4'];
    expect(metrics.totalTokens).toBe(250);
    expect(metrics.events[0].source).toBe('live');
    expect(store.tokenBudgets['agent-4'].cacheHits).toBe(1);
  });
});
