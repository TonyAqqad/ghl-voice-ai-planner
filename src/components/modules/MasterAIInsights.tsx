import React, { useMemo } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Sparkles,
  BarChart3,
  AlertTriangle,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { FieldCapture, RubricScore, SessionEvaluation, ContactFieldKey } from '../../lib/evaluation/types';
import { applyManualCorrections } from '../../lib/evaluation/masterStore';

const FIELD_OPTIONS: ContactFieldKey[] = ['first_name', 'last_name', 'unique_phone_number', 'email', 'class_date__time'];

interface MasterInsight {
  type: 'improvement' | 'degradation' | 'insight';
  message: string;
  metric: string;
  delta: number;
  confidence: 'high' | 'medium' | 'low';
}

interface MasterAIInsightsProps {
  sessions: SessionEvaluation[];
  currentSession?: SessionEvaluation | null;
  onUpdate?: (updated: SessionEvaluation) => void;
}

const MasterAIInsights: React.FC<MasterAIInsightsProps> = ({ sessions, currentSession, onUpdate }) => {
  const orderedSessions = useMemo(() => {
    if (!currentSession) return sessions;
    const rest = sessions.filter((s) => s.conversationId !== currentSession.conversationId);
    return [currentSession, ...rest];
  }, [sessions, currentSession, currentSession?.correctionsApplied]);

  const latest = orderedSessions[0] ?? null;
  const previous = orderedSessions[1] ?? null;

  const insights = useMemo<MasterInsight[]>(() => {
    if (!latest) {
      return [
        {
          type: 'insight',
          message: 'Run an evaluation to see Master AI insights.',
          metric: 'training',
          delta: 0,
          confidence: 'high',
        },
      ];
    }

    if (!previous) {
      return [
        {
          type: 'insight',
          message: 'Keep training this agent to unlock comparative insights.',
          metric: 'training',
          delta: 0,
          confidence: 'high',
        },
      ];
    }

    const generated: MasterInsight[] = [];

    const confidenceDelta = latest.confidence - previous.confidence;
    if (Math.abs(confidenceDelta) >= 5) {
      generated.push({
        type: confidenceDelta >= 0 ? 'improvement' : 'degradation',
        message:
          confidenceDelta >= 0
            ? `Overall confidence improved by ${confidenceDelta.toFixed(0)} points`:
            `Confidence dropped by ${Math.abs(confidenceDelta).toFixed(0)} points. Review recent responses.`,
        metric: 'confidence',
        delta: confidenceDelta / 100,
        confidence: Math.abs(confidenceDelta) >= 10 ? 'high' : 'medium',
      });
    }

    const latestFieldCount = latest.collectedFields.length;
    const previousFieldCount = previous.collectedFields.length;
    const fieldDelta = latestFieldCount - previousFieldCount;
    if (fieldDelta !== 0) {
      generated.push({
        type: fieldDelta > 0 ? 'improvement' : 'degradation',
        message:
          fieldDelta > 0
            ? `Captured ${fieldDelta} more contact field${fieldDelta === 1 ? '' : 's'} than previous session.`
            : `Captured ${Math.abs(fieldDelta)} fewer contact field${Math.abs(fieldDelta) === 1 ? '' : 's'} this time.`,
        metric: 'fieldCollection',
        delta: fieldDelta / Math.max(previousFieldCount || 1, 1),
        confidence: 'medium',
      });
    }

    const latestObjection = latest.rubric.find((r) => r.key === 'objectionHandling');
    const previousObjection = previous.rubric.find((r) => r.key === 'objectionHandling');
    if (latestObjection && previousObjection && latestObjection.score !== previousObjection.score) {
      generated.push({
        type: latestObjection.score !== null && (latestObjection.score ?? 0) > (previousObjection.score ?? 0)
          ? 'improvement'
          : 'degradation',
        message:
          latestObjection.score !== null && previousObjection.score !== null
            ? `Objection handling moved from ${previousObjection.score} → ${latestObjection.score}.`
            : 'Objection handling rubric changed this session.',
        metric: 'objectionHandling',
        delta: 0,
        confidence: 'medium',
      });
    }

    return generated.length > 0
      ? generated
      : [
          {
            type: 'insight',
            message: 'No major changes detected. Continue refining prompts and corrections.',
            metric: 'neutral',
            delta: 0,
            confidence: 'medium',
          },
        ];
  }, [latest, previous]);

  if (!latest) {
    return (
      <div className="card p-6 border-dashed border-border/60 bg-muted/10 text-sm text-muted-foreground flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          <span>Run Evaluate Now or finish a call to see Master AI insights.</span>
        </div>
      </div>
    );
  }

  const performanceTimeline = orderedSessions.slice(0, 5);

  // Debug logging for corrections counter
  React.useEffect(() => {
    if (latest) {
      console.log(`🔄 MasterAIInsights re-rendered: ${latest.conversationId}, corrections: ${latest.correctionsApplied}`);
    }
  }, [latest?.correctionsApplied, latest?.conversationId]);

  // State for editing field chips
  const [editingFieldIndex, setEditingFieldIndex] = React.useState<number | null>(null);
  const [editedFieldValue, setEditedFieldValue] = React.useState('');
  const [editedFieldKey, setEditedFieldKey] = React.useState<ContactFieldKey | ''>('');

  const handleFieldEdit = (field: FieldCapture, idx: number) => {
    setEditingFieldIndex(idx);
    setEditedFieldValue(field.value);
    setEditedFieldKey(field.key);
  };

  const handleFieldSave = () => {
    if (editingFieldIndex === null || !editedFieldKey) return;

    // Update the field in the session
    const updatedFields = [...latest.collectedFields];
    updatedFields[editingFieldIndex] = {
      ...updatedFields[editingFieldIndex],
      key: editedFieldKey,
      value: editedFieldValue,
      source: 'manual' as const,
    };

    // Save to masterStore - this increments correctionsApplied
    const updated = applyManualCorrections(latest.conversationId, {
      fields: updatedFields,
    });

    if (updated) {
      console.log(`✅ Field correction saved! Corrections Applied: ${updated.correctionsApplied}`);
      onUpdate?.(updated);
      toast.success(`Field corrected! (${updated.correctionsApplied} corrections applied)`);
    } else {
      console.error('❌ Failed to apply field correction - session not found');
      toast.error('Failed to save correction - session not found');
    }

    setEditingFieldIndex(null);
    setEditedFieldValue('');
    setEditedFieldKey('');
  };

  const handleFieldCancel = () => {
    setEditingFieldIndex(null);
    setEditedFieldValue('');
    setEditedFieldKey('');
  };

  const renderFieldChip = (field: FieldCapture, idx: number) => {
    const isEditing = editingFieldIndex === idx;

    if (isEditing) {
      return (
        <div key={`${field.turnId}-${field.key}-${idx}`} className="flex items-center gap-2 px-3 py-2 border border-primary rounded-lg bg-background">
          <select
            value={editedFieldKey}
            onChange={(e) => setEditedFieldKey(e.target.value as ContactFieldKey)}
            className="text-xs border rounded px-2 py-1"
          >
            {FIELD_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <input
            type="text"
            value={editedFieldValue}
            onChange={(e) => setEditedFieldValue(e.target.value)}
            className="text-xs border rounded px-2 py-1 min-w-[120px]"
            placeholder="Field value..."
          />
          <button onClick={handleFieldSave} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded">
            <Check className="w-3 h-3 text-green-600" />
          </button>
          <button onClick={handleFieldCancel} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
            <X className="w-3 h-3 text-red-600" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={`${field.turnId}-${field.key}-${idx}`}
        data-testid={`field-chip-${field.key}`}
        className="group relative inline-flex items-center gap-1"
      >
        <span
          className={`px-2 py-1 text-xs rounded-full border cursor-pointer transition-all ${
            field.valid
              ? 'border-green-500/60 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 hover:border-green-600 hover:shadow-sm'
              : 'border-amber-500/60 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 hover:border-amber-600 hover:shadow-sm'
          }`}
          title={`Click to edit • Captured on turn ${field.turnId}`}
          onClick={() => handleFieldEdit(field, idx)}
        >
          {field.valid ? '✅' : '⚠️'} {field.key}: {field.value}
        </span>
        <button
          onClick={() => handleFieldEdit(field, idx)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
          title="Edit field"
        >
          <Edit2 className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    );
  };

  const renderRubricRow = (score: RubricScore) => (
    <div key={score.key} data-testid={`rubric-row-${score.key}`} className="grid grid-cols-5 gap-2 text-xs items-center">
      <span className="col-span-2 font-medium capitalize">{score.key.replace(/([A-Z])/g, ' $1')}</span>
      <span className="col-span-1 text-center font-semibold">
        {score.score === null ? 'N/A' : score.score.toFixed(1)}
      </span>
      <span className="col-span-2 text-muted-foreground line-clamp-2">
        {score.notes || '—'}
      </span>
    </div>
  );

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Master AI Insights</h2>
          <span className="text-xs text-muted-foreground">Session Intelligence</span>
        </div>
        <Sparkles className="w-5 h-5 text-amber-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-border/60 bg-muted/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Current Confidence</span>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold" data-testid="master-confidence">{latest.confidence}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(latest.endedAt), 'MMM d, h:mm a')} · {latest.version}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-border/60 bg-muted/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Fields Captured</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold">{latest.collectedFields.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {latest.collectedFields.filter((f) => f.valid).length} validated
          </p>
        </div>

        <div className="p-4 rounded-lg border border-border/60 bg-muted/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Corrections Applied</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p 
            className="text-2xl font-bold" 
            data-testid="corrections-applied"
            key={`corrections-${latest.conversationId}-${latest.correctionsApplied}`}
          >
            {latest.correctionsApplied ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Manual adjustments to date</p>
        </div>
      </div>

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

      <div className="mt-6 pt-6 border-t border-border/60 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Field Collection</h3>
          <div className="flex flex-wrap gap-2">
            {latest.collectedFields.length > 0 ? (
              latest.collectedFields.map(renderFieldChip)
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> No fields detected yet.
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Rubric Scores</h3>
          <div className="space-y-2">
            {latest.rubric.map(renderRubricRow)}
          </div>
        </div>

        {performanceTimeline.length > 1 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Performance Timeline</h3>
            <div className="space-y-2">
              {performanceTimeline.map((session) => (
                <div key={session.conversationId} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {format(new Date(session.endedAt), 'MMM d, h:mm a')} · {session.version}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground">{session.confidence}% conf</span>
                    <span className="text-foreground">{session.collectedFields.length} fields</span>
                    <span className="text-muted-foreground">
                      {session.correctionsApplied ?? 0} corrections
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterAIInsights;

