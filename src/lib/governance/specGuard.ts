
export type SpecGuardConfig = {
  disallowedPhrases?: string[]
  requiredFieldOrder?: string[]
}

export type SpecLintIssue = {
  type: 'phrase' | 'order' | 'schema'
  message: string
  path?: string
}

export type SpecValidation = {
  storedHash?: string
  runtimeHash?: string
  drift: boolean
  issues: SpecLintIssue[]
}

// Attempts to extract a SPEC JSON block from a prompt string.
export function extractSpecFromPrompt(prompt: string): any | null {
  if (!prompt) return null
  // Prefer fenced JSON blocks
  const fence = prompt.match(/```(?:json)?\n([\s\S]*?)```/i)
  if (fence && fence[1]) {
    try { return JSON.parse(fence[1]) } catch {}
  }
  // Fallback: best-effort root object extraction
  const firstBrace = prompt.indexOf('{')
  const lastBrace = prompt.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = prompt.slice(firstBrace, lastBrace + 1)
    try { return JSON.parse(candidate) } catch {}
  }
  return null
}

export function stableStringify(obj: any): string {
  const seen = new WeakSet()
  const sorter = (value: any): any => {
    if (value && typeof value === 'object') {
      if (seen.has(value)) return
      seen.add(value)
      if (Array.isArray(value)) return value.map(sorter)
      return Object.keys(value).sort().reduce((acc: any, k) => {
        acc[k] = sorter(value[k])
        return acc
      }, {})
    }
    return value
  }
  return JSON.stringify(sorter(obj))
}

export function computeSpecHash(spec: any): string {
  const json = typeof spec === 'string' ? spec : stableStringify(spec)
  // Lightweight DJB2 hash for browser environments (not cryptographically secure)
  let h = 5381
  for (let i = 0; i < json.length; i++) {
    h = ((h << 5) + h) + json.charCodeAt(i)
    h |= 0
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export function lintSpec(spec: any, cfg: SpecGuardConfig): SpecLintIssue[] {
  const issues: SpecLintIssue[] = []
  const jsonStr = typeof spec === 'string' ? spec : JSON.stringify(spec)

  // Disallowed phrases search
  for (const phrase of cfg.disallowedPhrases || []) {
    if (jsonStr.toLowerCase().includes(phrase.toLowerCase())) {
      issues.push({ type: 'phrase', message: `Disallowed phrase found: "${phrase}"` })
    }
  }

  // Required field order (top-level)
  if (cfg.requiredFieldOrder && typeof spec === 'object' && spec) {
    const actual = Object.keys(spec)
    const required = cfg.requiredFieldOrder
    const orderMismatch = required.some((k, idx) => actual[idx] !== k)
    if (orderMismatch) {
      issues.push({ type: 'order', message: `Top-level field order should be: ${required.join(' -> ')}` })
    }
  }

  return issues
}

export function validateRuntimeSpec(storedSpec: any | null, runtimeSpec: any | null, cfg: SpecGuardConfig): SpecValidation {
  const issues: SpecLintIssue[] = []

  const storedHash = storedSpec ? computeSpecHash(storedSpec) : undefined
  const runtimeHash = runtimeSpec ? computeSpecHash(runtimeSpec) : undefined
  const drift = Boolean(storedHash && runtimeHash && storedHash !== runtimeHash)

  // Lint runtime spec; if missing, emit schema issue
  if (!runtimeSpec) {
    issues.push({ type: 'schema', message: 'Runtime SPEC missing or not parseable from prompt.' })
  } else {
    issues.push(...lintSpec(runtimeSpec, cfg))
  }

  return { storedHash, runtimeHash, drift, issues }
}

// LocalStorage helpers for quick persistence without backend changes
const LS_SPEC_KEY = 'specGuard:storedSpec'

export function readStoredSpec(): any | null {
  try {
    const raw = localStorage.getItem(LS_SPEC_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function writeStoredSpec(spec: any): void {
  try { localStorage.setItem(LS_SPEC_KEY, JSON.stringify(spec)) } catch {}
}
