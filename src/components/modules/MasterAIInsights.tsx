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
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { FieldCapture, RubricScore, SessionEvaluation, ContactFieldKey } from '../../lib/evaluation/types';
import { applyManualCorrections } from '../../lib/evaluation/masterStore';
import { PromptSpec } from '../../lib/spec/specTypes';

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
  activeSpec?: PromptSpec | null;
  onUpdate?: (updated: SessionEvaluation) => void;
}

const MasterAIInsights: React.FC<MasterAIInsightsProps> = ({ sessions, currentSession, activeSpec, onUpdate }) => {
  const orderedSessions = useMemo(() => {
    if (!currentSession) return sessions;
    const rest = sessions.filter((s) => s.conversationId !== currentSession.conversationId);
    return [currentSession, ...rest];
  }, [sessions, currentSession, currentSession?.correctionsApplied]);

  const latest = orderedSessions[0] ?? null;
  const previous = orderedSessions[1] ?? null;

  // Deduplicate collected fields - keep only the latest valid value per key
  const dedupedFields = useMemo(() => {
    if (!latest?.collectedFields) return [];
    
    const fieldMap = new Map<string, FieldCapture>();
    
    // Iterate in reverse order to get the latest value
    for (let i = latest.collectedFields.length - 1; i >= 0; i--) {
      const field = latest.collectedFields[i];
      if (!fieldMap.has(field.key)) {
        fieldMap.set(field.key, field);
      }
    }
    
    // Return in original order (based on first occurrence)
    const result: FieldCapture[] = [];
    latest.collectedFields.forEach(field => {
      if (fieldMap.get(field.key) === field) {
        result.push(field);
      }
    });
    
    return result;
  }, [latest?.collectedFields]);

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
      console.log(`🔄 MasterAIInsights re-rendered`);
      console.log(`   • Conversation ID: ${latest.conversationId}`);
      console.log(`   • Corrections Applied: ${latest.correctionsApplied ?? 0}`);
      console.log(`   • Fields Collected: ${latest.collectedFields.length}`);
      console.log(`   • Confidence: ${latest.confidence}%`);
    }
  }, [latest?.correctionsApplied, latest?.conversationId]);

  // State for editing field chips
  const [editingFieldIndex, setEditingFieldIndex] = React.useState<number | null>(null);
  const [editedFieldValue, setEditedFieldValue] = React.useState('');
  const [editedFieldKey, setEditedFieldKey] = React.useState<ContactFieldKey | ''>('');
  
  // State for adding new field
  const [isAddingField, setIsAddingField] = React.useState(false);
  const [newFieldKey, setNewFieldKey] = React.useState<ContactFieldKey | ''>('');
  const [newFieldValue, setNewFieldValue] = React.useState('');

  // State for transcript feedback
  const [transcriptFeedback, setTranscriptFeedback] = React.useState<Record<string, 'up' | 'down' | null>>({});
  const [editingTurnId, setEditingTurnId] = React.useState<string | null>(null);
  const [editedTurnText, setEditedTurnText] = React.useState('');

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

  const handleAddFieldStart = () => {
    // Find first missing field to pre-select
    const existingKeys = latest.collectedFields.map(f => f.key);
    const missingField = FIELD_OPTIONS.find(opt => !existingKeys.includes(opt));
    
    setIsAddingField(true);
    setNewFieldKey(missingField || '');
    setNewFieldValue('');
  };

  const handleAddFieldSave = () => {
    if (!newFieldKey || !newFieldValue.trim()) {
      toast.error('Please select a field type and enter a value');
      return;
    }

    // Check if field already exists
    const existingField = latest.collectedFields.find(f => f.key === newFieldKey);
    if (existingField) {
      toast.error(`Field "${newFieldKey}" already exists. Edit it instead.`);
      return;
    }

    // Create new field capture
    const newField: FieldCapture = {
      key: newFieldKey,
      value: newFieldValue.trim(),
      turnId: 'manual-add',
      valid: true,
      source: 'manual' as const,
    };

    // Add to existing fields
    const updatedFields = [...latest.collectedFields, newField];

    // Save to masterStore - this increments correctionsApplied
    const updated = applyManualCorrections(latest.conversationId, {
      fields: updatedFields,
    });

    if (updated) {
      console.log(`✅ Field added! Corrections Applied: ${updated.correctionsApplied}`);
      onUpdate?.(updated);
      toast.success(`Field "${newFieldKey}" added! (${updated.correctionsApplied} corrections applied)`);
    } else {
      console.error('❌ Failed to add field - session not found');
      toast.error('Failed to add field - session not found');
    }

    // Reset add state
    setIsAddingField(false);
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const handleAddFieldCancel = () => {
    setIsAddingField(false);
    setNewFieldKey('');
    setNewFieldValue('');
  };

  // Transcript feedback handlers
  const handleTranscriptThumbsUp = (turnId: string) => {
    setTranscriptFeedback(prev => ({
      ...prev,
      [turnId]: prev[turnId] === 'up' ? null : 'up'
    }));
    
    const turn = latest.transcript?.find((t: any) => t.id === turnId);
    console.log(`👍 Positive feedback for turn ${turnId}:`, turn?.text?.substring(0, 50));
    
    // Add glow effect using new haptics
    const button = document.querySelector(`[data-transcript-thumbs-up="${turnId}"]`);
    if (button) {
      button.classList.add('glow-ok', 'live');
      setTimeout(() => button.classList.remove('live'), 600);
    }
    
    toast.success('Marked as good response!', { className: 'pulse' });
  };

  const handleTranscriptThumbsDown = (turnId: string) => {
    setTranscriptFeedback(prev => ({
      ...prev,
      [turnId]: prev[turnId] === 'down' ? null : 'down'
    }));
    
    // Add glow effect for thumbs down
    const button = document.querySelector(`[data-transcript-thumbs-down="${turnId}"]`);
    if (button) {
      button.classList.add('glow-err', 'live');
      setTimeout(() => button.classList.remove('live'), 600);
    }
    
    // If thumbs down is active, open edit interface
    if (transcriptFeedback[turnId] !== 'down') {
      const turn = latest.transcript?.find((t: any) => t.id === turnId);
      if (turn) {
        setEditingTurnId(turnId);
        setEditedTurnText(turn.text);
        console.log(`👎 Negative feedback for turn ${turnId} - opening edit interface`);
        toast('Edit the response to teach the agent the correct answer', { icon: '📝', className: 'fadein' });
      }
    }
  };

  const handleSaveTranscriptEdit = () => {
    if (!editingTurnId) return;

    // Apply the correction through masterStore
    const updated = applyManualCorrections(latest.conversationId, {
      turnId: editingTurnId,
      correctedResponse: editedTurnText,
    });

    if (updated) {
      console.log(`✅ Transcript correction saved! Corrections Applied: ${updated.correctionsApplied}`);
      onUpdate?.(updated);
      toast.success(`Correction saved! (${updated.correctionsApplied} corrections applied)`);
    } else {
      console.error('❌ Failed to save transcript correction - session not found');
      toast.error('Failed to save correction - session not found');
    }

    // Reset edit state
    setEditingTurnId(null);
    setEditedTurnText('');
  };

  const handleCancelTranscriptEdit = () => {
    setEditingTurnId(null);
    setEditedTurnText('');
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
        className="group relative inline-flex items-center gap-1 fadein"
        style={{ animationDelay: `${idx * 30}ms` }}
      >
        <span
          className={`chip tap cursor-pointer ${
            field.valid
              ? 'ok'
              : 'warn'
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Field Collection</h3>
            <button
              onClick={handleAddFieldStart}
              disabled={isAddingField || editingFieldIndex !== null}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary border border-primary/50 rounded-md hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Add a missing contact field"
            >
              <Plus className="w-3 h-3" />
              Add Field
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {dedupedFields.length > 0 && dedupedFields.map(renderFieldChip)}
            
            {/* Add new field form */}
            {isAddingField && (
              <div className="flex items-center gap-2 px-3 py-2 border-2 border-primary rounded-lg bg-primary/5">
                <Plus className="w-4 h-4 text-primary" />
                <select
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value as ContactFieldKey)}
                  className="text-xs border rounded px-2 py-1 bg-background"
                >
                  <option value="">Select field...</option>
                  {FIELD_OPTIONS.filter(opt => !dedupedFields.some(f => f.key === opt)).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="text-xs border rounded px-2 py-1 min-w-[120px] bg-background"
                  placeholder="Enter value..."
                  autoFocus
                />
                <button onClick={handleAddFieldSave} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded">
                  <Check className="w-3 h-3 text-green-600" />
                </button>
                <button onClick={handleAddFieldCancel} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </div>
            )}
            
            {dedupedFields.length === 0 && !isAddingField && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> No fields detected yet. Click "Add Field" to add one manually.
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Rubric Scores</h3>
          <div className="space-y-2">
            {latest.rubric.map(renderRubricRow)}
          </div>
          
          {/* Spec Footer - Shows current grading rules */}
          {activeSpec && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Spec in Effect</p>
                  <div className="text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• <strong>Niche:</strong> {activeSpec.niche}</p>
                    <p>• <strong>Cadence:</strong> {activeSpec.question_cadence} (max {activeSpec.max_words_per_turn} words/turn)</p>
                    <p>• <strong>Booking Blocked:</strong> {activeSpec.block_booking_until_fields ? 'Yes' : 'No'} (until all fields collected)</p>
                    <p>• <strong>Confirmations:</strong> {activeSpec.confirmations.repeat_phone ? 'Phone repeat' : ''}{activeSpec.confirmations.repeat_phone && activeSpec.confirmations.spell_email ? ', ' : ''}{activeSpec.confirmations.spell_email ? 'Email spell-back' : ''}</p>
                    <p>• <strong>Required Fields:</strong> {activeSpec.required_fields.length} ({activeSpec.required_fields.join(', ')})</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transcript Review with Feedback */}
        {latest.transcript && latest.transcript.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Conversation Transcript</h3>
              <span className="text-xs text-muted-foreground">
                ({latest.transcript.length} turns)
              </span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto p-3 bg-muted/30 rounded-lg">
              {latest.transcript.map((turn: any, idx: number) => {
                const isEditing = editingTurnId === turn.id;
                const isAgent = turn.role === 'agent';

                return (
                  <div 
                    key={turn.id || idx} 
                    className={`flex ${isAgent ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    {isEditing ? (
                      // Edit Mode
                      <div className="w-full space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-primary animate-scale-in">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Editing {isAgent ? 'Agent' : 'Caller'} Response
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={handleSaveTranscriptEdit}
                              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded haptic-light"
                              title="Save correction"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              onClick={handleCancelTranscriptEdit}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded haptic-light"
                              title="Cancel"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                        
                        <textarea
                          value={editedTurnText}
                          onChange={(e) => setEditedTurnText(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm min-h-[60px] transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="Edit the correct response..."
                          autoFocus
                        />
                        
                        <div className="text-xs text-muted-foreground">
                          💡 Tip: This correction will be saved to the agent's knowledge base for future reference
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="relative group max-w-[85%]">
                        <div 
                          className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                            isAgent
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100' 
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs opacity-60 font-medium">
                              {isAgent ? '🤖 Agent' : '👤 Caller'}
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Feedback buttons - only for agent messages */}
                              {isAgent && (
                                <>
                                  <button
                                    onClick={() => handleTranscriptThumbsUp(turn.id)}
                                    data-transcript-thumbs-up={turn.id}
                                    className={`tap transition-all duration-200 p-1 rounded ${
                                      transcriptFeedback[turn.id] === 'up'
                                        ? 'bg-green-500 text-white scale-110'
                                        : 'opacity-0 group-hover:opacity-100 hover:bg-green-100 dark:hover:bg-green-900/50'
                                    }`}
                                    title="Good response"
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleTranscriptThumbsDown(turn.id)}
                                    data-transcript-thumbs-down={turn.id}
                                    className={`tap transition-all duration-200 p-1 rounded ${
                                      transcriptFeedback[turn.id] === 'down'
                                        ? 'bg-red-500 text-white scale-110'
                                        : 'opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/50'
                                    }`}
                                    title="Needs improvement"
                                  >
                                    <ThumbsDown className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setEditingTurnId(turn.id);
                                  setEditedTurnText(turn.text);
                                }}
                                className="tap opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 dark:hover:bg-black/30 rounded"
                                title="Edit message"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap">{turn.text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💬 Review and provide feedback on each agent response to improve future interactions
            </p>
          </div>
        )}

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

