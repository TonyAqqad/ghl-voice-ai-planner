/**
 * Turn Analysis Note Component
 * 
 * Beautiful, animated component showing Master AI's analysis of each turn
 * with polished icons, color-coding, and smooth interactions
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Target,
  Sparkles,
  MessageSquare,
  Shield,
  Zap,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { TurnAnalysis } from '../../lib/evaluation/turnAnalyzer';

interface TurnAnalysisNoteProps {
  analysis: TurnAnalysis;
  collapsed?: boolean;
}

const TurnAnalysisNote: React.FC<TurnAnalysisNoteProps> = ({
  analysis,
  collapsed: initialCollapsed = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const { compliance, fieldProgress, intentMatch, redFlags, suggestions, wouldHaveSaid, tone } = analysis;

  // Determine overall status color and icon
  const getStatusConfig = () => {
    if (redFlags.length > 0) {
      return {
        color: 'red',
        icon: XCircle,
        bgClass: 'bg-red-50 dark:bg-red-900/20',
        borderClass: 'border-red-200 dark:border-red-800',
        iconClass: 'text-red-600 dark:text-red-400',
        label: 'Issues Detected',
      };
    } else if (compliance.score >= 0.9) {
      return {
        color: 'green',
        icon: CheckCircle2,
        bgClass: 'bg-green-50 dark:bg-green-900/20',
        borderClass: 'border-green-200 dark:border-green-800',
        iconClass: 'text-green-600 dark:text-green-400',
        label: 'Excellent',
      };
    } else if (compliance.score >= 0.7) {
      return {
        color: 'yellow',
        icon: AlertTriangle,
        bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderClass: 'border-yellow-200 dark:border-yellow-800',
        iconClass: 'text-yellow-600 dark:text-yellow-400',
        label: 'Good',
      };
    } else {
      return {
        color: 'orange',
        icon: AlertTriangle,
        bgClass: 'bg-orange-50 dark:bg-orange-900/20',
        borderClass: 'border-orange-200 dark:border-orange-800',
        iconClass: 'text-orange-600 dark:text-orange-400',
        label: 'Needs Review',
      };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <div
      className={`mt-2 rounded-lg border ${status.borderClass} ${status.bgClass} transition-all duration-300 animate-fade-in`}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <StatusIcon
              className={`w-5 h-5 ${status.iconClass} transition-transform duration-300 ${
                redFlags.length > 0 ? 'animate-pulse' : ''
              }`}
            />
            {redFlags.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary/60" />
            <span className="text-sm font-semibold text-foreground">Master AI Analysis</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.iconClass} ${status.bgClass}`}>
              {status.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round(compliance.score * 100)}% compliance
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {fieldProgress.collected.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Database className="w-3 h-3" />
              <span>
                {fieldProgress.currentStep}/{fieldProgress.totalSteps}
              </span>
            </div>
          )}
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <div className="h-px bg-border" />

          {/* Compliance Section */}
          {(compliance.passed.length > 0 || compliance.violations.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Compliance Check</span>
              </div>
              <div className="pl-6 space-y-1">
                {compliance.passed.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
                {compliance.violations.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Field Progress */}
          {fieldProgress.collected.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-foreground">Field Collection Progress</span>
              </div>
              <div className="pl-6">
                <div className="flex flex-wrap gap-1.5">
                  {fieldProgress.collected.map((field, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {field}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Intent Match */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-foreground">Intent Analysis</span>
            </div>
            <div className="pl-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Detected: <span className="font-medium text-foreground">{intentMatch.detected}</span></span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${intentMatch.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">{Math.round(intentMatch.confidence * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Red Flags */}
          {redFlags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Red Flags</span>
              </div>
              <div className="pl-6 space-y-1">
                {redFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 font-medium"
                  >
                    <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-foreground">Suggestions</span>
              </div>
              <div className="pl-6 space-y-1">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What Master AI Would Have Said */}
          {wouldHaveSaid && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-foreground">Alternative Suggestion</span>
              </div>
              <div className="pl-6">
                <div className="px-3 py-2 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 italic">"{wouldHaveSaid}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TurnAnalysisNote;

