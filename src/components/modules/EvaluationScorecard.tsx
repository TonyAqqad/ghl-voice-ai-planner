import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  ClipboardList,
  ClipboardCheck,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { EvaluationResult, EvaluationScorecardProps } from '../../types/evaluation';

const RUBRIC_LABELS: Record<string, string> = {
  fieldCollection: 'Field Collection',
  bookingRules: 'Booking Rules',
  tone: 'Tone & Natural Language',
  objectionHandling: 'Objection Handling',
  questionCadence: 'Question Cadence',
  verification: 'Contact Verification'
};

const RUBRIC_ORDER = [
  'fieldCollection',
  'bookingRules',
  'tone',
  'objectionHandling',
  'questionCadence',
  'verification'
];

type ScoreStatus = 'success' | 'warning' | 'error';

const getScoreStatus = (score?: number): ScoreStatus => {
  if (typeof score !== 'number') return 'warning';
  if (score >= 4) return 'success';
  if (score >= 2) return 'warning';
  return 'error';
};

const statusStyles: Record<ScoreStatus, string> = {
  success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
};

const statusIcon: Record<ScoreStatus, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4" />, 
  warning: <AlertTriangle className="w-4 h-4" />, 
  error: <AlertTriangle className="w-4 h-4" />
};

const EvaluationScorecard: React.FC<EvaluationScorecardProps> = ({ evaluation, isOpen, onClose }) => {
  const [checkedNotes, setCheckedNotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (evaluation?.improvementNotes?.length) {
      const nextState: Record<string, boolean> = {};
      evaluation.improvementNotes.forEach((note) => {
        nextState[note] = checkedNotes[note] ?? false;
      });
      setCheckedNotes(nextState);
    } else {
      setCheckedNotes({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation]);

  const confidencePercent = useMemo(() => {
    if (!evaluation) return 0;
    return Math.round(Math.max(0, Math.min(1, evaluation.confidenceScore || 0)) * 100);
  }, [evaluation]);

  const rubricEntries = useMemo(() => {
    if (!evaluation?.rubricScores) return [] as Array<{ key: string; score?: number }>;
    const ordered = RUBRIC_ORDER.filter((key) => key in evaluation.rubricScores);
    const unordered = Object.keys(evaluation.rubricScores).filter((k) => !ordered.includes(k));
    const finalOrder = [...ordered, ...unordered];
    return finalOrder.map((key) => ({ key, score: evaluation.rubricScores[key] }));
  }, [evaluation]);

  const handleToggleNote = (note: string) => {
    setCheckedNotes((prev) => ({ ...prev, [note]: !prev[note] }));
  };

  if (!evaluation) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur transition-opacity duration-300 z-[95] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[28rem] max-w-full bg-card border-l border-border shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Evaluation Scorecard</p>
              <h2 className="text-lg font-semibold text-foreground">Training Hub Analysis</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition"
              aria-label="Close scorecard"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Status Banner */}
            <div
              className={`rounded-xl p-5 border ${
                evaluation.pass
                  ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10'
                  : 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      evaluation.pass
                        ? 'bg-green-200/80 dark:bg-green-800/60 text-green-900 dark:text-green-100'
                        : 'bg-red-200/80 dark:bg-red-800/60 text-red-900 dark:text-red-100'
                    }`}
                  >
                    {evaluation.pass ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Overall Result
                    </p>
                    <h3 className="text-xl font-bold text-foreground">
                      {evaluation.pass ? 'Pass' : 'Needs Review'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confidence {confidencePercent}% · Auto-patch {evaluation.pass ? 'eligible' : 'pending human review'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Confidence</p>
                  <p className="text-3xl font-semibold text-foreground">{confidencePercent}<span className="text-base font-normal">%</span></p>
                </div>
              </div>
            </div>

            {/* Rubric Scores */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Rubric Breakdown</h3>
              </div>
              <div className="space-y-3">
                {rubricEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No rubric scores available.</p>
                ) : (
                  rubricEntries.map(({ key, score }) => {
                    const status = getScoreStatus(score);
                    return (
                      <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60 bg-muted/10">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-9 h-9 rounded-full ${statusStyles[status]}`}>
                            {statusIcon[status]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {RUBRIC_LABELS[key] || key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-xs text-muted-foreground">Target ≥ 4 / 5</p>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-semibold text-foreground">{typeof score === 'number' ? score.toFixed(1) : '--'}</span>
                          <span className="text-xs text-muted-foreground">/ 5</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Improvement Checklist */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Improvements Needed</h3>
                <span className="text-xs text-muted-foreground">{evaluation.improvementNotes?.length || 0} items</span>
              </div>
              {evaluation.improvementNotes?.length ? (
                <div className="space-y-2">
                  {evaluation.improvementNotes.map((note) => (
                    <label
                      key={note}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-muted/10 cursor-pointer hover:border-primary/40 transition"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                        checked={checkedNotes[note] || false}
                        onChange={() => handleToggleNote(note)}
                      />
                      <span className={`text-sm ${checkedNotes[note] ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {note}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 border border-border/60 rounded-lg bg-muted/10 text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  No outstanding improvements detected for this conversation.
                </div>
              )}
            </section>

            {/* Suggested Prompt Patch */}
            {evaluation.suggestedPromptPatch && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Suggested Prompt Updates</h3>
                </div>
                <pre className="text-xs bg-muted/20 border border-border/60 rounded-lg p-4 overflow-x-auto">
                  {JSON.stringify(evaluation.suggestedPromptPatch, null, 2)}
                </pre>
              </section>
            )}

            {/* Suggested KB Addition */}
            {evaluation.suggestedKbAddition && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Knowledge Base Recommendation</h3>
                </div>
                <div className="p-4 border border-border/60 rounded-lg bg-muted/10 space-y-2 text-sm">
                  {'title' in evaluation.suggestedKbAddition && (
                    <p className="font-medium text-foreground">{String(evaluation.suggestedKbAddition.title)}</p>
                  )}
                  {'reason' in evaluation.suggestedKbAddition && (
                    <p className="text-muted-foreground">Reason: {String(evaluation.suggestedKbAddition.reason)}</p>
                  )}
                  {'outline' in evaluation.suggestedKbAddition && Array.isArray(evaluation.suggestedKbAddition.outline) && (
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {evaluation.suggestedKbAddition.outline.map((item: unknown, idx: number) => (
                        <li key={idx}>{String(item)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {/* Metadata */}
            <section>
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <Info className="w-3 h-3" />
                <span>Evaluations auto-save to MCP review queue for quality tracking.</span>
              </div>
            </section>
          </div>
        </div>
      </aside>
    </>
  );
};

export default EvaluationScorecard;

