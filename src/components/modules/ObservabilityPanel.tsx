import React from 'react'

type Props = {
  tokens?: { prompt?: number; completion?: number; total?: number }
  latencyMs?: number
  ruleViolations?: number
}

export default function ObservabilityPanel({ tokens, latencyMs, ruleViolations }: Props) {
  const total = tokens?.total ?? ((tokens?.prompt || 0) + (tokens?.completion || 0))
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
      <div className="text-xs font-semibold text-gray-600 mb-2">Observability</div>
      <div className="flex items-center gap-4 text-sm">
        <div title="Total tokens" className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
          <span>{total} tokens</span>
        </div>
        <div title="Latency" className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>{latencyMs ?? 0} ms</span>
        </div>
        <div title="Spec / rule violations" className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          <span>{ruleViolations ?? 0} rule issues</span>
        </div>
      </div>
    </div>
  )
}

