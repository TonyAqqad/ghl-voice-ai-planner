/**
 * Quality Gate Component
 * 
 * Shows blocked responses with issues, suggestions, and quick fixes
 * Beautiful visual design with clear action buttons
 */

import React from 'react';
import {
  XCircle,
  AlertTriangle,
  CheckCircle,
  Shield,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { QualityReview } from '../../hooks/useMasterAIManager';

type DiffSegment = {
  text: string;
  type: 'same' | 'added' | 'removed';
};

const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

const tokenize = (text: string) => {
  const normalized = normalizeText(text);
  return normalized.length === 0 ? [] : normalized.split(' ');
};

const buildWordDiff = (original: string, suggestion: string): {
  originalSegments: DiffSegment[];
  suggestionSegments: DiffSegment[];
} => {
  const originalTokens = tokenize(original);
  const suggestionTokens = tokenize(suggestion);
  const m = originalTokens.length;
  const n = suggestionTokens.length;

  const lcs: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (originalTokens[i - 1] === suggestionTokens[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  type Operation = { type: 'equal' | 'add' | 'remove'; token: string };
  const operations: Operation[] = [];

  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (originalTokens[i - 1] === suggestionTokens[j - 1]) {
      operations.push({ type: 'equal', token: originalTokens[i - 1] });
      i -= 1;
      j -= 1;
    } else if (lcs[i - 1][j] >= lcs[i][j - 1]) {
      operations.push({ type: 'remove', token: originalTokens[i - 1] });
      i -= 1;
    } else {
      operations.push({ type: 'add', token: suggestionTokens[j - 1] });
      j -= 1;
    }
  }

  while (i > 0) {
    operations.push({ type: 'remove', token: originalTokens[i - 1] });
    i -= 1;
  }

  while (j > 0) {
    operations.push({ type: 'add', token: suggestionTokens[j - 1] });
    j -= 1;
  }

  operations.reverse();

  const originalSegments: DiffSegment[] = operations
    .filter(op => op.type !== 'add')
    .map(op => ({
      text: op.token,
      type: op.type === 'equal' ? 'same' : 'removed',
    }));

  const suggestionSegments: DiffSegment[] = operations
    .filter(op => op.type !== 'remove')
    .map(op => ({
      text: op.token,
      type: op.type === 'equal' ? 'same' : 'added',
    }));

  return { originalSegments, suggestionSegments };
};

interface QualityGateProps {
  review: QualityReview;
  originalResponse: string;
  onUseSuggestion?: () => void;
  onOverride?: () => void;
}

const QualityGate: React.FC<QualityGateProps> = ({
  review,
  originalResponse,
  onUseSuggestion,
  onOverride,
}) => {
  const isBlocked = !review.approved;
  const isLowQuality = review.score < 70;
  const normalizedOriginal = normalizeText(originalResponse);
  const normalizedSuggestion = normalizeText(review.suggestedResponse || '');
  const hasSuggestion = Boolean(review.suggestedResponse);
  const hasMeaningfulSuggestion =
    hasSuggestion &&
    normalizedOriginal.length > 0 &&
    normalizedSuggestion.length > 0 &&
    normalizedOriginal !== normalizedSuggestion;
  const diff = hasMeaningfulSuggestion
    ? buildWordDiff(normalizedOriginal, normalizedSuggestion)
    : null;

  // Status configuration
  const status = isBlocked
    ? {
        icon: XCircle,
        containerBorder: 'border-rose-200 dark:border-rose-900/50',
        headerBg: 'bg-rose-50/70 dark:bg-rose-900/20',
        iconClass: 'text-rose-600 dark:text-rose-300',
        badgeClass:
          'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
        label: 'Blocked',
      }
    : isLowQuality
    ? {
        icon: AlertTriangle,
        containerBorder: 'border-amber-200 dark:border-amber-900/40',
        headerBg: 'bg-amber-50/80 dark:bg-amber-900/20',
        iconClass: 'text-amber-600 dark:text-amber-300',
        badgeClass:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
        label: 'Needs attention',
      }
    : {
        icon: CheckCircle,
        containerBorder: 'border-emerald-200 dark:border-emerald-900/40',
        headerBg: 'bg-emerald-50/70 dark:bg-emerald-900/20',
        iconClass: 'text-emerald-600 dark:text-emerald-300',
        badgeClass:
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
        label: 'Approved',
      };

  const StatusIcon = status.icon;

  if (!isBlocked && !isLowQuality) {
    // Don't show gate for approved responses
    return null;
  }

  return (
    <div
      className={`rounded-xl border ${status.containerBorder} bg-background/95 shadow-sm animate-scale-in`}
    >
      <div className={`flex items-start justify-between px-4 py-3 border-b ${status.headerBg}`}>
        <div className="flex items-start gap-3">
          <StatusIcon
            className={`w-5 h-5 mt-0.5 ${status.iconClass} ${
              isBlocked ? 'animate-pulse' : ''
            }`}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Quality Gate
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.badgeClass}`}
              >
                {status.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>Score {review.score}/100</span>
              <span>Confidence {review.confidenceScore}/100</span>
              {review.observability?.latencyMs != null && (
                <span>{review.observability.latencyMs.toFixed(0)}ms</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isBlocked && hasSuggestion && !hasMeaningfulSuggestion && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
            Master AI flagged the response but suggested the exact same phrasing.
            This usually means the prompt rules and gate checks are out of sync.
            Review the issues below or override to continue.
          </div>
        )}

        {diff && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <XCircle className="h-3.5 w-3.5" />
                Agent response
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {diff.originalSegments.length === 0 ? (
                  <span className="text-muted-foreground italic">
                    No response captured.
                  </span>
                ) : (
                  diff.originalSegments.map((segment, idx) => (
                    <React.Fragment key={`${segment.type}-${idx}-${segment.text}`}>
                      {idx > 0 && ' '}
                      <span
                        className={
                          segment.type === 'same'
                            ? ''
                            : 'rounded px-1 py-0.5 line-through decoration-rose-500/70 decoration-2 bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200'
                        }
                      >
                        {segment.text}
                      </span>
                    </React.Fragment>
                  ))
                )}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/40 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Suggested fix
              </div>
              <p className="mt-2 text-sm leading-relaxed text-emerald-800 dark:text-emerald-100">
                {diff.suggestionSegments.length === 0 ? (
                  <span className="text-muted-foreground italic">
                    No suggestion provided.
                  </span>
                ) : (
                  diff.suggestionSegments.map((segment, idx) => (
                    <React.Fragment key={`${segment.type}-${idx}-${segment.text}`}>
                      {idx > 0 && ' '}
                      <span
                        className={
                          segment.type === 'same'
                            ? ''
                            : 'rounded px-1 py-0.5 bg-emerald-200 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100'
                        }
                      >
                        {segment.text}
                      </span>
                    </React.Fragment>
                  ))
                )}
              </p>
            </div>
          </div>
        )}

        {!diff && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <XCircle className="h-3.5 w-3.5" />
              Agent response
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {normalizedOriginal ? (
                normalizedOriginal
              ) : (
                <span className="text-muted-foreground italic">
                  No response captured.
                </span>
              )}
            </p>
          </div>
        )}

        {review.issues && review.issues.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              Issues detected
            </div>
            <div className="space-y-1.5">
              {review.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-100"
                >
                  {issue}
                </div>
              ))}
            </div>
          </div>
        )}

        {isBlocked &&
          review.blockedReasons &&
          review.blockedReasons.length > 0 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
              <div className="font-semibold uppercase tracking-wide">
                Blocked because
              </div>
              <ul className="mt-1 space-y-0.5">
                {review.blockedReasons.map((reason, idx) => (
                  <li key={idx}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}

        {review.warnings && review.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
            <div className="font-semibold uppercase tracking-wide">
              Warnings
            </div>
            <ul className="mt-1 space-y-0.5">
              {review.warnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {review.suggestions && review.suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ArrowRight className="h-3.5 w-3.5" />
              Suggested next steps
            </div>
            <ul className="space-y-1.5">
              {review.suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isBlocked && (hasMeaningfulSuggestion || onOverride) && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {hasMeaningfulSuggestion && onUseSuggestion && (
              <button
                onClick={onUseSuggestion}
                className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <CheckCircle className="w-4 h-4" />
                Use Suggested Fix
              </button>
            )}
            {onOverride && (
              <button
                onClick={onOverride}
                className="rounded-md bg-slate-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                Override Block
              </button>
            )}
          </div>
        )}

        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer py-1 text-[11px] uppercase tracking-wide hover:text-foreground">
            Observability (trace {review.observability.traceId})
          </summary>
          <div className="mt-2 space-y-1 rounded border border-border bg-muted/30 p-2 font-mono text-[11px]">
            <div>Model: {review.observability.model}</div>
            <div>
              Tokens: {review.observability.tokensIn + review.observability.tokensOut}
            </div>
            <div>Latency: {review.observability.latencyMs.toFixed(0)}ms</div>
            <div>Rules: {review.observability.rulesChecked.join(', ')}</div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default QualityGate;

