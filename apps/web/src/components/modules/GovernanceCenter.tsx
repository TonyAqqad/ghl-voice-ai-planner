import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  Gauge,
  Zap,
  RefreshCw,
  ClipboardCopy,
  PackageCheck,
  AlertTriangle,
  Timer,
  Activity,
  Wallet,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import { useStore } from '../../store/useStore';
import { lintSpec } from '../../lib/spec/specLinter';

interface BundleState {
  status: 'idle' | 'valid' | 'error';
  lintErrors: string[];
  json?: string;
  generatedAt?: string;
}

const formatTokens = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
};

const GovernanceCenter: React.FC = () => {
  const {
    voiceAgents,
    governanceState,
    tokenBudgets,
    observability,
    setTokenBudget,
    resetTokenBudget,
    clearAgentGate,
    specLocks,
  } = useStore((state) => ({
    voiceAgents: state.voiceAgents,
    governanceState: state.governanceState,
    tokenBudgets: state.tokenBudgets,
    observability: state.observability,
    setTokenBudget: state.setTokenBudget,
    resetTokenBudget: state.resetTokenBudget,
    clearAgentGate: state.clearAgentGate,
    specLocks: state.specLocks,
  }));

  useEffect(() => {
    const storeApi = useStore.getState();
    voiceAgents.forEach((agent) => {
      storeApi.ensureAgentGovernance(agent.id);
      storeApi.ensureTokenBudget(agent.id);
      storeApi.checkAgentGate(agent.id);
    });
  }, [voiceAgents]);

  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
  const [bundleState, setBundleState] = useState<Record<string, BundleState>>({});

  const handleBudgetInput = (agentId: string, value: string) => {
    setBudgetDrafts((prev) => ({ ...prev, [agentId]: value }));
  };

  const commitBudget = (agentId: string) => {
    const rawValue = budgetDrafts[agentId];
    if (!rawValue) return;

    const parsed = Number(rawValue.replace(/[,\s]/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Enter a valid daily token cap');
      return;
    }

    setTokenBudget(agentId, Math.floor(parsed));
    toast.success('Token budget updated');
  };

  const handleClearGate = (agentId: string) => {
    clearAgentGate(agentId);
    toast.success('Confidence gate cleared');
  };

  const handleGenerateBundle = (agentId: string) => {
    const storeApi = useStore.getState();
    const agent = storeApi.getVoiceAgent(agentId);
    if (!agent) {
      toast.error('Agent not found');
      return;
    }

    const governance = storeApi.ensureAgentGovernance(agentId);
    const budget = storeApi.ensureTokenBudget(agentId);
    const metrics = storeApi.observability[agentId];
    const lock = storeApi.getSpecLock(agentId);
    const specValidation = lock
      ? storeApi.validateSpecLock(agentId, lock.promptHash, lock.storedSpec)
      : { status: 'missing_lock', message: 'Spec lock not found', lock: null };

    const lintErrors: string[] = [];

    if (!agent.scripts.greeting?.trim()) lintErrors.push('Greeting script is missing');
    if (!agent.scripts.main?.trim()) lintErrors.push('Main script is missing');
    if (!agent.scripts.fallback?.trim()) lintErrors.push('Fallback script is missing');
    if (governance.isGated) lintErrors.push('Confidence gate active. Resolve evaluation issues before deployment.');
    if (budget.usedTokens >= budget.dailyCap) lintErrors.push('Token budget exhausted. Increase cap before deployment.');
    if (!lock) lintErrors.push('Spec lock missing. Save prompt to lock before deployment.');
    if (specValidation.status && specValidation.status !== 'ok') lintErrors.push(`Spec drift: ${specValidation.message}`);

    // Spec linter
    if (lock?.storedSpec) {
      try {
        const issues = lintSpec(lock.storedSpec)
        for (const i of issues) lintErrors.push(i.message)
      } catch { /* ignore linter failure */ }
    }

    const bundle = {
      agent: {
        id: agent.id,
        name: agent.name,
        persona: agent.persona,
        scripts: agent.scripts,
        voiceProvider: agent.voiceProvider,
        llmProvider: agent.llmProvider,
      },
      governance: {
        confidenceThreshold: governance.confidenceThreshold,
        lastConfidence: governance.lastConfidence,
        isGated: governance.isGated,
        gateReason: governance.gateReason,
      },
      tokenBudget: {
        dailyCap: budget.dailyCap,
        usedTokens: budget.usedTokens,
        cacheHits: budget.cacheHits,
        resetAt: budget.resetAt,
      },
      specLock: lock
        ? {
            promptHash: lock.promptHash,
            savedAt: lock.savedAt,
            status: specValidation.status,
          }
        : null,
      observability: metrics
        ? {
            totalTokens: metrics.totalTokens,
            totalCostUsd: metrics.totalCostUsd,
            avgLatencyMs: metrics.avgLatencyMs,
            totalRuleViolations: metrics.totalRuleViolations,
            recentEvents: metrics.events.slice(0, 5),
          }
        : null,
      generatedAt: new Date().toISOString(),
    };

    const status: BundleState['status'] = lintErrors.length === 0 ? 'valid' : 'error';

    setBundleState((prev) => ({
      ...prev,
      [agentId]: {
        status,
        lintErrors,
        json: JSON.stringify(bundle, null, 2),
        generatedAt: bundle.generatedAt,
      },
    }));

    if (status === 'valid') {
      toast.success('Deployment bundle ready. Review and copy to GHL.');
    } else {
      toast.error('Bundle validation failed. Resolve lint items.');
    }
  };

  const handleCopyBundle = async (agentId: string) => {
    const state = bundleState[agentId];
    if (!state?.json || state.lintErrors.length > 0) {
      toast.error('Generate a passing bundle before copying.');
      return;
    }

    try {
      await navigator.clipboard.writeText(state.json);
      toast.success('Bundle copied to clipboard');
    } catch (error) {
      console.error('Clipboard copy failed', error);
      toast.error('Clipboard copy failed. Check browser permissions.');
    }
  };

  const agentsData = useMemo(
    () =>
      voiceAgents.map((agent) => {
        const governance = governanceState[agent.id];
        const budget = tokenBudgets[agent.id];
        const metrics = observability[agent.id];
        const specLock = specLocks[agent.id];
        const specStatus = specLock
          ? useStore.getState().validateSpecLock(agent.id, specLock.promptHash, specLock.storedSpec)
          : { status: 'missing_lock', message: 'Spec lock not found', lock: null };
        const usagePercent = budget
          ? Math.min(100, Math.round((budget.usedTokens / Math.max(1, budget.dailyCap)) * 100))
          : 0;
        const remainingTokens = budget ? Math.max(0, budget.dailyCap - budget.usedTokens) : 0;
        const lastEvent = metrics?.events[0];

        return {
          agent,
          governance,
          budget,
          metrics,
          specLock,
          specStatus,
          usagePercent,
          remainingTokens,
          lastEvent,
        };
      }),
    [voiceAgents, governanceState, tokenBudgets, observability, specLocks]
  );

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Governance & Observability</h1>
        <p className="text-muted-foreground max-w-3xl">
          Monitor agent confidence, enforce token budgets, review rule violations, and ship deploy-ready bundles directly to GoHighLevel.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {agentsData.map(({ agent, governance, budget, metrics, specLock, specStatus, usagePercent, remainingTokens, lastEvent }) => {
          const bundle = bundleState[agent.id];
          const budgetDraft = budgetDrafts[agent.id] ?? '';
          const confidence = governance?.lastConfidence ?? null;
          const threshold = governance?.confidenceThreshold ?? useStore.getState().governanceDefaults.confidenceThreshold;
          const confidenceDelta = confidence !== null ? confidence - threshold : null;
          const gated = Boolean(governance?.isGated);

          return (
            <div key={agent.id} className="card p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    {agent.name}
                    {gated && <ShieldAlert className="w-4 h-4 text-amber-600" />}
                  </h2>
                <p className="text-sm text-muted-foreground">
                  Confidence {confidence !== null ? `${confidence}%` : '—'} • Threshold {threshold}%
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`chip ${specStatus?.status === 'ok' ? 'ok' : specStatus?.status === 'missing_lock' ? 'err' : 'warn'} text-xs`}
                    title={specStatus?.message}
                  >
                    {specStatus?.status === 'ok' ? 'Spec lock in sync' : specStatus?.message ?? 'Spec status unknown'}
                  </span>
                  {specLock && (
                    <span className="chip info text-xs" title={`Saved ${new Date(specLock.savedAt).toLocaleString()}`}>
                      Hash #{specLock.promptHash.slice(0, 6)}
                    </span>
                  )}
                </div>
              </div>
                <div className={clsx('px-3 py-1 rounded-full text-xs font-semibold uppercase', gated ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>
                  {gated ? 'Gated' : 'Active'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Gauge className="w-4 h-4" />
                    Confidence Guard
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last evaluation</span>
                    <span>{governance?.updatedAt ? new Date(governance.updatedAt).toLocaleString() : '—'}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all', gated ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${Math.max(4, Math.min(100, confidence ?? 0))}%` }}
                    />
                  </div>
                  {confidenceDelta !== null && (
                    <p className={clsx('text-xs font-medium', confidenceDelta < 0 ? 'text-amber-600' : 'text-emerald-600')}>
                      {confidenceDelta < 0 ? `${Math.abs(confidenceDelta)}% below gate` : `${confidenceDelta}% above gate`}
                    </p>
                  )}
                  {gated && (
                    <button
                      className="btn btn-outline w-full"
                      onClick={() => handleClearGate(agent.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear Gate for Review
                    </button>
                  )}
                  {governance?.gateReason && (
                    <p className="text-xs text-amber-600">{governance.gateReason}</p>
                  )}
                </div>

                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Wallet className="w-4 h-4" />
                    Token Budget
                  </div>
                  <div className="text-xs flex justify-between text-muted-foreground">
                    <span>Daily cap</span>
                    <span>{budget ? formatTokens(budget.dailyCap) : '—'} tokens</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all', usagePercent > 85 ? 'bg-amber-500' : 'bg-blue-500')}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <div className="text-xs flex justify-between text-muted-foreground">
                    <span>Used</span>
                    <span>{budget ? formatTokens(budget.usedTokens) : '—'} tokens ({usagePercent}% )</span>
                  </div>
                  <div className="text-xs flex justify-between text-muted-foreground">
                    <span>Remaining today</span>
                    <span>{formatTokens(remainingTokens)} tokens</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={budgetDraft}
                      onChange={(e) => handleBudgetInput(agent.id, e.target.value)}
                      placeholder={budget ? budget.dailyCap.toString() : '500000'}
                      className="flex-1 px-3 py-2 border rounded bg-background text-sm"
                    />
                    <button className="btn btn-primary" onClick={() => commitBudget(agent.id)}>
                      <Zap className="w-4 h-4 mr-1" />
                      Set
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => {
                        resetTokenBudget(agent.id);
                        setBudgetDrafts((prev) => ({ ...prev, [agent.id]: '' }));
                        toast.success('Token budget reset for new conversation');
                      }}
                      title="Reset token budget for new conversation"
                    >
                      Reset
                    </button>
                  </div>
                  {budget && (
                    <p className="text-[11px] text-muted-foreground text-right">Cache hits: {budget.cacheHits}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Activity className="w-4 h-4" />
                    Observability Snapshot
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Total tokens</p>
                      <p className="text-lg font-semibold">{formatTokens(metrics?.totalTokens)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spend (USD)</p>
                      <p className="text-lg font-semibold">{metrics ? `$${metrics.totalCostUsd.toFixed(4)}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg latency</p>
                      <p className="text-lg font-semibold">{metrics ? `${Math.round(metrics.avgLatencyMs)} ms` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rule violations</p>
                      <p className="text-lg font-semibold flex items-center gap-1">
                        {metrics?.totalRuleViolations ?? 0}
                        {metrics && metrics.totalRuleViolations > 0 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      </p>
                    </div>
                  </div>
                  {lastEvent && (
                    <div className="text-[11px] text-muted-foreground border-t border-border/60 pt-2">
                      Last call: {new Date(lastEvent.timestamp).toLocaleTimeString()} • {lastEvent.tokens} tokens • {lastEvent.latencyMs.toFixed(0)} ms • {lastEvent.source === 'cache' ? 'cache hit' : 'live'}
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="w-4 h-4" />
                    Deployment Guard
                  </div>
                <p className="text-xs text-muted-foreground">
                  Generate a validated configuration bundle before pushing to GoHighLevel.
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span>Spec lock</span>
                  {specLock ? (
                    <span className="font-mono">#{specLock.promptHash.slice(0, 6)}</span>
                  ) : (
                    <span className="text-amber-600">Not locked</span>
                  )}
                </div>
                {specStatus && specStatus.status !== 'ok' && (
                  <div className="spec-alert mt-2 text-xs">
                    {specStatus.message}
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="btn btn-outline flex-1" onClick={() => handleGenerateBundle(agent.id)}>
                    <PackageCheck className="w-4 h-4 mr-2" />
                    Generate Bundle
                  </button>
                    <button
                      className="btn btn-primary flex-1"
                      onClick={() => handleCopyBundle(agent.id)}
                      disabled={!bundle || bundle.lintErrors.length > 0}
                    >
                      <ClipboardCopy className="w-4 h-4 mr-2" />
                      Copy to GHL
                    </button>
                  </div>
                  {bundle && (
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Timer className="w-3 h-3" />
                        <span>Generated {bundle.generatedAt ? new Date(bundle.generatedAt).toLocaleTimeString() : 'just now'}</span>
                      </div>
                      {bundle.lintErrors.length > 0 ? (
                        <div className="text-amber-600 space-y-1">
                          <p className="font-semibold flex items-center gap-1 text-xs">
                            <AlertTriangle className="w-3 h-3" /> Lint issues blocking deployment
                          </p>
                          <ul className="list-disc list-inside text-[11px]">
                            {bundle.lintErrors.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-emerald-600 text-xs flex items-center gap-1">
                          <PackageCheck className="w-3 h-3" /> Bundle passes lint and is ready to publish
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {metrics?.recentRuleViolations?.length ? (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    Recent Rule Violations
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground max-h-32 overflow-y-auto">
                    {metrics.recentRuleViolations.slice(0, 5).map((violation) => (
                      <li key={violation.id} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">●</span>
                        <span>
                          <span className="font-semibold text-foreground">[{violation.severity}] {violation.type}</span>
                          <span className="ml-1">{violation.message}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GovernanceCenter;
