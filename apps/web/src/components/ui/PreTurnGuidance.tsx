/**
 * Pre-Turn Guidance Component
 * 
 * Shows Master AI's recommended response before agent generates
 * with beautiful icons, reasoning, and confidence indicators
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { PreTurnGuidance as PreTurnGuidanceType } from '../../hooks/useMasterAIManager';

interface PreTurnGuidanceProps {
  guidance: PreTurnGuidanceType;
  onUseResponse?: (response: string) => void;
}

const PreTurnGuidance: React.FC<PreTurnGuidanceProps> = ({ guidance, onUseResponse }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(guidance.recommendedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    if (onUseResponse) {
      onUseResponse(guidance.recommendedResponse);
    }
  };

  // Confidence color
  const confidenceColor = guidance.confidence >= 0.9
    ? 'text-green-600 dark:text-green-400'
    : guidance.confidence >= 0.7
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-orange-600 dark:text-orange-400';

  const confidenceBg = guidance.confidence >= 0.9
    ? 'bg-green-100 dark:bg-green-900/20'
    : guidance.confidence >= 0.7
    ? 'bg-yellow-100 dark:bg-yellow-900/20'
    : 'bg-orange-100 dark:bg-orange-900/20';

  return (
    <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 shadow-sm animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-primary/20">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="font-semibold text-foreground">Master AI Guidance</span>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${confidenceColor} ${confidenceBg}`}>
              {Math.round(guidance.confidence * 100)}% confident
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Recommended Response */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Recommended Response
              </label>
              <div className="flex gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded hover:bg-white/50 dark:hover:bg-black/30 transition-colors"
                  title="Copy response"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {onUseResponse && (
                  <button
                    onClick={handleUse}
                    className="px-3 py-1 text-xs font-medium rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Use This
                  </button>
                )}
              </div>
            </div>
            <div className="p-3 rounded-md bg-white dark:bg-gray-800 border border-primary/20 shadow-sm">
              <p className="text-sm text-foreground font-medium italic">
                "{guidance.recommendedResponse}"
              </p>
            </div>
          </div>

          {/* Field to Collect */}
          {guidance.fieldToCollect && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Collecting: <span className="font-medium text-foreground">{guidance.fieldToCollect}</span>
              </span>
            </div>
          )}

          {/* Reasoning */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Reasoning
            </label>
            <ul className="space-y-1.5">
              {guidance.reasoning.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Alternative Responses */}
          {guidance.alternativeResponses && guidance.alternativeResponses.length > 0 && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Alternatives
              </label>
              <div className="space-y-1.5">
                {guidance.alternativeResponses.map((alt, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-white/50 dark:bg-gray-800/50 border border-border text-xs text-muted-foreground"
                  >
                    "{alt}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observability (collapsed) */}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              Observability ({guidance.observability.latencyMs}ms)
            </summary>
            <div className="mt-2 p-2 rounded bg-muted/30 font-mono text-xs">
              <div>Trace: {guidance.observability.traceId}</div>
              <div>Model: {guidance.observability.model}</div>
              <div>Tokens: {guidance.observability.tokensIn + guidance.observability.tokensOut}</div>
              <div>Rules: {guidance.observability.rulesChecked.join(', ')}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default PreTurnGuidance;

