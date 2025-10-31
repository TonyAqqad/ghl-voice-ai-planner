import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Sparkles, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

interface PromptPerformance {
  version: string;
  created_at: string;
  avg_confidence: number;
  avg_field_collection: number;
  avg_tone: number;
  call_count: number;
  correction_count: number;
}

interface MasterInsight {
  type: 'improvement' | 'degradation' | 'insight';
  message: string;
  metric: string;
  delta: number;
  confidence: 'high' | 'medium' | 'low';
}

interface MasterAIInsightsProps {
  agentId?: string;
}

const MasterAIInsights: React.FC<MasterAIInsightsProps> = ({ agentId }) => {
  const [performance, setPerformance] = useState<PromptPerformance[]>([]);
  const [insights, setInsights] = useState<MasterInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      fetchPerformance();
    }
  }, [agentId]);

  const fetchPerformance = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/mcp/agent/performance', {
        params: { agentId }
      });

      if (response.data.success) {
        const perfData = response.data.performance || [];
        setPerformance(perfData);
        generateInsights(perfData);
      } else {
        setError(response.data.error || 'Failed to fetch performance');
      }
    } catch (err: any) {
      console.error('Error fetching performance:', err);
      setError(err.response?.data?.error || err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (perfData: PromptPerformance[]) => {
    if (perfData.length < 2) {
      setInsights([
        {
          type: 'insight',
          message: 'Train your agent with more conversations to unlock Master AI insights',
          metric: 'training',
          delta: 0,
          confidence: 'high'
        }
      ]);
      return;
    }

    const latest = perfData[0];
    const previous = perfData[1];
    const generatedInsights: MasterInsight[] = [];

    // Analyze confidence score trend
    const confidenceDelta = latest.avg_confidence - previous.avg_confidence;
    if (Math.abs(confidenceDelta) > 0.05) {
      generatedInsights.push({
        type: confidenceDelta > 0 ? 'improvement' : 'degradation',
        message: confidenceDelta > 0
          ? `Overall confidence improved by ${Math.round(confidenceDelta * 100)}% after ${latest.correction_count} corrections`
          : `Confidence dropped by ${Math.round(Math.abs(confidenceDelta) * 100)}%. Review recent corrections.`,
        metric: 'confidence',
        delta: confidenceDelta,
        confidence: Math.abs(confidenceDelta) > 0.1 ? 'high' : 'medium'
      });
    }

    // Analyze field collection
    const fieldDelta = latest.avg_field_collection - previous.avg_field_collection;
    if (Math.abs(fieldDelta) > 0.3) {
      generatedInsights.push({
        type: fieldDelta > 0 ? 'improvement' : 'degradation',
        message: fieldDelta > 0
          ? `Field collection score improved from ${previous.avg_field_collection.toFixed(1)} to ${latest.avg_field_collection.toFixed(1)}. Agent is getting better at capturing contact info.`
          : `Field collection quality declined. Agent may need reinforcement on collecting all required fields in order.`,
        metric: 'field_collection',
        delta: fieldDelta,
        confidence: 'high'
      });
    }

    // Analyze tone improvements
    const toneDelta = latest.avg_tone - previous.avg_tone;
    if (Math.abs(toneDelta) > 0.3) {
      generatedInsights.push({
        type: toneDelta > 0 ? 'improvement' : 'degradation',
        message: toneDelta > 0
          ? `Conversational tone improved. Agent sounds more natural and human-like.`
          : `Tone quality decreased. Consider reviewing corrections for overly robotic or formal language.`,
        metric: 'tone',
        delta: toneDelta,
        confidence: 'medium'
      });
    }

    // Training velocity insight
    if (latest.call_count > 5) {
      generatedInsights.push({
        type: 'insight',
        message: `Agent has handled ${latest.call_count} conversations at version ${latest.version}. ${latest.correction_count > 0 ? `Applied ${latest.correction_count} corrections.` : 'Consider testing more scenarios to identify improvement areas.'}`,
        metric: 'training',
        delta: 0,
        confidence: 'high'
      });
    }

    // Master template readiness
    if (latest.avg_confidence >= 0.85 && latest.call_count >= 10) {
      generatedInsights.push({
        type: 'improvement',
        message: `🌟 Agent is performing well! Consider promoting to a Master Template for reuse across similar agents.`,
        metric: 'readiness',
        delta: 0,
        confidence: 'high'
      });
    }

    setInsights(generatedInsights.length > 0 ? generatedInsights : [
      {
        type: 'insight',
        message: 'No significant changes detected. Keep training to see insights!',
        metric: 'neutral',
        delta: 0,
        confidence: 'medium'
      }
    ]);
  };

  if (!agentId) {
    return (
      <div className="card p-6 border-border/60 bg-muted/10">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Brain className="w-5 h-5" />
          <p className="text-sm">Select an agent to see Master AI insights</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="text-lg font-semibold">Master AI Analyzing...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-600">Analysis Error</h2>
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Master AI Insights</h2>
          <span className="text-xs text-muted-foreground">Real-time Performance Analysis</span>
        </div>
        <Sparkles className="w-5 h-5 text-amber-500" />
      </div>

      {/* Performance Overview */}
      {performance.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border border-border/60 bg-muted/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Current Confidence</span>
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{Math.round(performance[0].avg_confidence * 100)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Version {performance[0].version} · {performance[0].call_count} calls
            </p>
          </div>
          
          <div className="p-4 rounded-lg border border-border/60 bg-muted/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Field Collection</span>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{performance[0].avg_field_collection.toFixed(1)}/5</p>
            <p className="text-xs text-muted-foreground mt-1">
              {performance.length > 1 && (
                <span className={performance[0].avg_field_collection > performance[1].avg_field_collection ? 'text-green-600' : 'text-red-600'}>
                  {performance[0].avg_field_collection > performance[1].avg_field_collection ? '↑' : '↓'} {Math.abs(performance[0].avg_field_collection - performance[1].avg_field_collection).toFixed(1)} from previous
                </span>
              )}
            </p>
          </div>
          
          <div className="p-4 rounded-lg border border-border/60 bg-muted/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Corrections Applied</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{performance[0].correction_count}</p>
            <p className="text-xs text-muted-foreground mt-1">This version</p>
          </div>
        </div>
      )}

      {/* AI-Generated Insights */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          What the Master AI Sees:
        </h3>
        
        {insights.map((insight, idx) => {
          const Icon = 
            insight.type === 'improvement' ? TrendingUp : 
            insight.type === 'degradation' ? TrendingDown : 
            Brain;
          
          const colorClass =
            insight.type === 'improvement' ? 'border-green-500/50 bg-green-50 dark:bg-green-900/10' :
            insight.type === 'degradation' ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-900/10' :
            'border-blue-500/50 bg-blue-50 dark:bg-blue-900/10';
          
          const iconColor =
            insight.type === 'improvement' ? 'text-green-600' :
            insight.type === 'degradation' ? 'text-amber-600' :
            'text-blue-600';

          return (
            <div key={idx} className={`border rounded-lg p-4 ${colorClass}`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${iconColor} mt-0.5 flex-shrink-0`} />
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed">{insight.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Confidence: <span className="font-medium">{insight.confidence}</span>
                    </span>
                    {insight.delta !== 0 && (
                      <span className={`text-xs font-medium ${insight.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {insight.delta > 0 ? '+' : ''}{(insight.delta * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Timeline */}
      {performance.length > 1 && (
        <div className="mt-6 pt-6 border-t border-border/60">
          <h3 className="text-sm font-semibold text-foreground mb-3">Performance Timeline</h3>
          <div className="space-y-2">
            {performance.slice(0, 5).map((perf, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {format(new Date(perf.created_at), 'MMM d, h:mm a')} · v{perf.version}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-foreground">{Math.round(perf.avg_confidence * 100)}% conf</span>
                  <span className="text-foreground">{perf.avg_field_collection.toFixed(1)} fields</span>
                  <span className="text-muted-foreground">{perf.call_count} calls</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterAIInsights;

