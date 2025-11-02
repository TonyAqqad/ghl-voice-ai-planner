/**
 * Observability Dashboard Component
 * 
 * Audit-grade observability showing:
 * - Per-turn traces with tokens, latency, cost
 * - Session rollup stats
 * - Rules checked
 * - Model usage
 */

import React, { useState } from 'react';
import {
  Activity,
  Clock,
  DollarSign,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';
import { ObservabilityEvent } from '../../hooks/useMasterAIManager';

interface ObservabilityDashboardProps {
  events: ObservabilityEvent[];
  summary: {
    totalTokens: number;
    totalCost: number;
    avgLatency: number;
    eventCount: number;
    sessionDurationMs: number;
  };
}

const ObservabilityDashboard: React.FC<ObservabilityDashboardProps> = ({
  events,
  summary,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  if (events.length === 0) {
    return null;
  }

  // Group events by type
  const eventsByType = events.reduce((acc, event) => {
    if (!acc[event.eventType]) {
      acc[event.eventType] = [];
    }
    acc[event.eventType].push(event);
    return acc;
  }, {} as Record<string, ObservabilityEvent[]>);

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Observability Dashboard</span>
          <span className="text-xs text-muted-foreground">
            {events.length} events • {formatCost(summary.totalCost)}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 border-t border-border space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Tokens</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {summary.totalTokens.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Cost</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatCost(summary.totalCost)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Avg Latency</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {summary.avgLatency.toFixed(0)}ms
              </div>
            </div>

            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Session</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatDuration(summary.sessionDurationMs)}
              </div>
            </div>
          </div>

          {/* Events by Type */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Events by Type</h3>
            <div className="space-y-2">
              {Object.entries(eventsByType).map(([type, typeEvents]) => {
                const totalCost = typeEvents.reduce((sum, e) => sum + e.costUsd, 0);
                const avgLatency = typeEvents.reduce((sum, e) => sum + e.latencyMs, 0) / typeEvents.length;

                return (
                  <div
                    key={type}
                    className="p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({typeEvents.length} events)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatCost(totalCost)}</span>
                        <span>{avgLatency.toFixed(0)}ms avg</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event List */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Event Timeline</h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {events.map((event, idx) => {
                const isSelected = selectedEvent === event.traceId;
                return (
                  <div key={idx}>
                    <button
                      onClick={() => setSelectedEvent(isSelected ? null : event.traceId)}
                      className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            Turn {event.turnIndex}
                          </span>
                          <span className="text-xs capitalize text-foreground">
                            {event.eventType.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            event.outcome === 'success' || event.outcome === 'approved'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : event.outcome === 'blocked' || event.outcome === 'gated'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                          }`}>
                            {event.outcome}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{event.tokensIn + event.tokensOut} tokens</span>
                          <span>{event.latencyMs}ms</span>
                          <span>{formatCost(event.costUsd)}</span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="mt-1.5 p-3 rounded bg-muted/50 border border-border text-xs animate-fade-in">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Trace ID:</span>
                            <div className="font-mono text-muted-foreground break-all">{event.traceId}</div>
                          </div>
                          <div>
                            <span className="font-medium">Model:</span>
                            <div className="text-muted-foreground">{event.model}</div>
                          </div>
                          <div>
                            <span className="font-medium">Timestamp:</span>
                            <div className="text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Conversation:</span>
                            <div className="font-mono text-muted-foreground">{event.conversationId}</div>
                          </div>
                        </div>
                        {event.rulesChecked && event.rulesChecked.length > 0 && (
                          <div className="mt-2">
                            <span className="font-medium">Rules Checked:</span>
                            <div className="text-muted-foreground">
                              {event.rulesChecked.join(', ')}
                            </div>
                          </div>
                        )}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2">
                            <span className="font-medium">Metadata:</span>
                            <pre className="mt-1 p-2 rounded bg-muted text-muted-foreground font-mono overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservabilityDashboard;

