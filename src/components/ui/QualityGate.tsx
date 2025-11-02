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

  // Status configuration
  const status = isBlocked
    ? {
        icon: XCircle,
        color: 'red',
        bgClass: 'bg-red-50 dark:bg-red-900/20',
        borderClass: 'border-red-300 dark:border-red-800',
        iconClass: 'text-red-600 dark:text-red-400',
        label: 'BLOCKED',
      }
    : isLowQuality
    ? {
        icon: AlertTriangle,
        color: 'yellow',
        bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderClass: 'border-yellow-300 dark:border-yellow-800',
        iconClass: 'text-yellow-600 dark:text-yellow-400',
        label: 'WARNING',
      }
    : {
        icon: CheckCircle,
        color: 'green',
        bgClass: 'bg-green-50 dark:bg-green-900/20',
        borderClass: 'border-green-300 dark:border-green-800',
        iconClass: 'text-green-600 dark:text-green-400',
        label: 'APPROVED',
      };

  const StatusIcon = status.icon;

  if (!isBlocked && !isLowQuality) {
    // Don't show gate for approved responses
    return null;
  }

  return (
    <div
      className={`rounded-lg border-2 ${status.borderClass} ${status.bgClass} shadow-md animate-scale-in`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-current/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <StatusIcon className={`w-6 h-6 ${status.iconClass} ${isBlocked ? 'animate-pulse' : ''}`} />
              {isBlocked && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">Quality Gate</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${status.iconClass} ${status.bgClass}`}>
                  {status.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Score: {review.score}/100 • Confidence: {review.confidenceScore}/100
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Original Response */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Original Response:
          </label>
          <div className="p-3 rounded bg-muted/50 border border-border">
            <p className="text-sm text-foreground line-through opacity-60">
              "{originalResponse}"
            </p>
          </div>
        </div>

        {/* Issues */}
        {review.issues && review.issues.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              Issues Found:
            </label>
            <ul className="space-y-1.5">
              {review.issues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                  <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Blocked Reasons */}
        {isBlocked && review.blockedReasons && review.blockedReasons.length > 0 && (
          <div className="p-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800">
            <div className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1.5">
              ⛔ Blocked Because:
            </div>
            <ul className="space-y-1">
              {review.blockedReasons.map((reason, idx) => (
                <li key={idx} className="text-xs text-red-700 dark:text-red-300">
                  • {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Fix */}
        {review.suggestedResponse && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-green-500" />
              Suggested Fix:
            </label>
            <div className="p-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium italic">
                "{review.suggestedResponse}"
              </p>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {review.suggestions && review.suggestions.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              💡 Suggestions:
            </label>
            <ul className="space-y-1.5">
              {review.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {isBlocked && (
          <div className="flex gap-2 pt-2 border-t border-current/20">
            {review.suggestedResponse && onUseSuggestion && (
              <button
                onClick={onUseSuggestion}
                className="flex-1 px-4 py-2 rounded-md bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Use Suggested Fix
              </button>
            )}
            {onOverride && (
              <button
                onClick={onOverride}
                className="px-4 py-2 rounded-md bg-gray-600 text-white font-medium text-sm hover:bg-gray-700 transition-colors"
              >
                Override Block
              </button>
            )}
          </div>
        )}

        {/* Observability */}
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            Observability ({review.observability.latencyMs}ms)
          </summary>
          <div className="mt-2 p-2 rounded bg-muted/30 font-mono text-xs">
            <div>Trace: {review.observability.traceId}</div>
            <div>Model: {review.observability.model}</div>
            <div>Tokens: {review.observability.tokensIn + review.observability.tokensOut}</div>
            <div>Rules: {review.observability.rulesChecked.join(', ')}</div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default QualityGate;

