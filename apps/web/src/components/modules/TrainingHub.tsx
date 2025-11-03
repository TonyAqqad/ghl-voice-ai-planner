import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { BookOpen, Save, Upload, RefreshCw, Database, Sparkles, CheckCircle, Link2, Copy, Edit2, X, Check, AlertTriangle, ThumbsUp, ThumbsDown, History, BarChart3, Award, Layers, Shield, ChevronDown, FileText } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';
import { useMCP } from '../../hooks/useMCP';
import Button from '../../components/ui/Button';
import { getApiBaseUrl } from '../../utils/apiBase';
import EvaluationScorecard from './EvaluationScorecard';
import MasterAIInsights from './MasterAIInsights';
import TurnAnalysisNote from '../ui/TurnAnalysisNote';
import type { VoiceAgent } from '../../types';
import { ConversationTurn as LegacyConversationTurn, ManualCorrectionPayload } from '../../types/evaluation';
import {
  SessionEvaluation,
  ConversationTurn as SessionConversationTurn,
} from '../../lib/evaluation/types';
import { analyzeTurnWithAPI, TurnAnalysis } from '../../lib/evaluation/turnAnalyzer';
import { useMasterAIManager } from '../../hooks/useMasterAIManager';
import type { QualityReview } from '../../hooks/useMasterAIManager';
import { useHaptics } from '../../hooks/useHaptics';
import PreTurnGuidance from '../ui/PreTurnGuidance';
import QualityGate from '../ui/QualityGate';
import ObservabilityDashboard from '../ui/ObservabilityDashboard';
import {
  evaluateAfterCall,
  evaluateAfterCallWithSpec,
  applyManualFix,
  estimateTokens,
  scopeId,
  generatePromptHash,
  compileRuntimeContext,
  guardResponse,
} from '../../lib/prompt/masterOrchestrator';
import {
  loadSessions,
  saveSession,
  applyManualCorrections,
  saveScopedSession,
  loadScopedSessions,
  applyScopedCorrections,
} from '../../lib/evaluation/masterStore';
import { extractSpecFromPrompt, embedSpecInPrompt } from '../../lib/spec/specExtract';
import { PromptSpec, DEFAULT_SPEC } from '../../lib/spec/specTypes';
import { generateRollingSummary, getRecentTurns, truncateContext } from '../../lib/runtime/memory';
import type { TurnAttestation } from '../../lib/verification/attestationTypes';
import { 
  validateAgentResponse, 
  autoCorrectResponse, 
  createCorrectionEntry,
  type Violation 
} from '../../lib/evaluation/autoCorrector';
import { lintSpec, formatLintIssues, type SpecLintIssue } from '../../lib/spec/specLinter';
import { saveGoldenSample, listGoldenSamples, replayGoldenDataset, deleteGoldenSample, type GoldenSample, type ReplaySummary } from '../../lib/evaluation/goldenDataset';

interface TrainingPayload {
  agentId: string;
  systemPrompt: string;
  knowledgeBase: string[];
  qnaPairs: Array<{ q: string; a: string }>;
  customActions: Array<{ name: string; url: string; description?: string }>;
}

const defaultQnA = [{ q: 'What are your hours?', a: 'We are open Monday–Friday 9am–6pm.' }];

const createConversationId = () => `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type SimulatorTurn = SessionConversationTurn;

type StoreStateSnapshot = ReturnType<typeof useStore.getState>;
type SpecValidationStatus = ReturnType<StoreStateSnapshot['validateSpecLock']>;
type GuardEvent = {
  status: 'ok' | 'modified' | 'blocked';
  message?: string;
  violation?: string;
};

interface CallReviewResult {
  approved: boolean;
  score: number;
  confidenceScore: number;
  summary: string;
  issues: string[];
  suggestions: string[];
  blockedReasons: string[];
  keyMoments: string[];
  handoffRecommended: boolean;
  suggestedTranscript: string | null;
}

interface QualityReviewSnapshot {
  review: QualityReview;
  originalResponse: string;
  finalResponse: string;
  suggestionApplied: boolean;
  correctedManually?: boolean;
}
const createTurnSignature = (
  agentId: string,
  turns: SimulatorTurn[],
  prompt: string,
  scopeId?: string | null
) => {
  const normalizedPrompt = prompt.replace(/\s+/g, ' ').trim();
  const recent = turns
    .slice(-6)
    .map((turn) => `${turn.role}:${turn.text.trim()}`)
    .join('|');
  const basis = `${agentId}|${scopeId ?? 'global'}|${normalizedPrompt}|${recent}`;
  let hash = 0;
  for (let i = 0; i < basis.length; i += 1) {
    hash = (hash << 5) - hash + basis.charCodeAt(i);
    hash |= 0;
  }
  return `sig-${Math.abs(hash).toString(16)}`;
};

const fallbackNiches = [
  { value: 'fitness_gym', label: 'F45 Training / Fitness Gym' },
  { value: 'martial_arts', label: 'Martial Arts' },
  { value: 'roofing', label: 'Roofing & Contractors' },
  { value: 'medspa', label: 'Medical Spa' },
  { value: 'dental', label: 'Dental Practice' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'solar', label: 'Solar Installation' },
  { value: 'plumbing', label: 'Plumbing Services' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'saas_onboarding', label: 'SaaS Onboarding' }
];

const inferCollectedFieldsFromConversation = (
  turns: SimulatorTurn[]
): Array<{ key: string; value: string; valid: boolean }> => {
  const results: Record<string, { value: string; valid: boolean }> = {};
  const phoneRegex = /\b(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b/;
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

  for (const turn of turns) {
    if (turn.role !== 'caller') continue;
    const text = turn.text.trim();

    if (!results.first_name) {
      const nameMatch = text.match(/\bmy name is\s+([A-Za-z]+)/i);
      if (nameMatch) {
        results.first_name = { value: nameMatch[1], valid: true };
      } else if (/^[A-Za-z]+$/.test(text) && text.length <= 20) {
        results.first_name = { value: text, valid: true };
      }
    }

    if (!results.last_name) {
      const lastMatch = text.match(/\b(last name|surname)\s+(is|=)\s+([A-Za-z]+)/i);
      if (lastMatch) {
        results.last_name = { value: lastMatch[3], valid: true };
      }
    }

    if (!results.unique_phone_number) {
      const phoneMatch = text.match(phoneRegex);
      if (phoneMatch) {
        results.unique_phone_number = { value: phoneMatch[0], valid: true };
      }
    }

    if (!results.email) {
      const emailMatch = text.match(emailRegex);
      if (emailMatch) {
        results.email = { value: emailMatch[0], valid: true };
      }
    }

    if (!results.class_date__time) {
      if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|next week|next|this)\b/i.test(text)) {
        results.class_date__time = { value: text, valid: true };
      }
    }
  }

  return Object.entries(results).map(([key, value]) => ({
    key,
    value: value.value,
    valid: value.valid,
  }));
};

const TrainingHub: React.FC = () => {
  const { voiceAgents, updateVoiceAgent, specHistory, governanceState, clearAgentGate } = useStore((state) => ({
    voiceAgents: state.voiceAgents,
    updateVoiceAgent: state.updateVoiceAgent,
    specHistory: state.specHistory,
    governanceState: state.governanceState,
    clearAgentGate: state.clearAgentGate,
  }));
  const [selectedId, setSelectedId] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [knowledge, setKnowledge] = useState<string>('');
  const [qna, setQna] = useState(defaultQnA);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);
  
  // Scoping state: location + agent + prompt version
  const [locationId, setLocationId] = useState<string>('default-location');
  const [promptHash, setPromptHash] = useState<string>('');
  const [activeSpec, setActiveSpec] = useState<PromptSpec | null>(null);
  const [currentScopeId, setCurrentScopeId] = useState<string>('');
  const selectedAgent = useMemo(
    () => voiceAgents.find((a) => a.id === selectedId),
    [voiceAgents, selectedId]
  );
  const selectedAgentId = selectedAgent?.id ?? '';
  useEffect(() => {
    setCallReview(null);
    setCallReviewError(null);
    setCallReviewLoading(false);
    setQualityReviewHistory({});
  }, [selectedAgentId]);
  
  // Spec drift and linting
  const [specLintIssues, setSpecLintIssues] = useState<SpecLintIssue[]>([]);
  const [showSpecLinter, setShowSpecLinter] = useState(false);
  const [specValidation, setSpecValidation] = useState<SpecValidationStatus | null>(null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  // New composer state
  const [selectedNiche, setSelectedNiche] = useState<string>('generic');
  const [availableNiches, setAvailableNiches] = useState<Array<{ value: string; label: string }>>(fallbackNiches);
  const [composedPrompt, setComposedPrompt] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { trigger: triggerHaptic } = useHaptics();
  const previousQualityBlocked = useRef<boolean | null>(null);
  const previousConfidenceGate = useRef<boolean | null>(null);
  const previousGateState = useRef<boolean | null>(null);
  const pendingAgentOverrideRef = useRef<string | null>(null);
  const [callReview, setCallReview] = useState<CallReviewResult | null>(null);
  const [callReviewLoading, setCallReviewLoading] = useState(false);
  const [callReviewError, setCallReviewError] = useState<string | null>(null);
  const [qualityReviewHistory, setQualityReviewHistory] = useState<Record<string, QualityReviewSnapshot>>({});

  // Master AI Manager state
  const [enableMasterAI, setEnableMasterAI] = useState(false);
  const [enablePreTurnGuidance, setEnablePreTurnGuidance] = useState(false);
  const [enableQualityGates, setEnableQualityGates] = useState(false);
  const [showObservability, setShowObservability] = useState(false);
  
  // UI Collapsible Sections state
  const [expandedSections, setExpandedSections] = useState({
    preTurnGuidance: false,
    qualityGate: false,
    transcript: false,
    insightsDetails: false,
    observability: false,
  });
  
  // Diagnostic state for Master AI sync
  const [guidanceMismatch, setGuidanceMismatch] = useState(false);
  
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const mcp = useMCP();
  
  // Inline test panel state
  const [testMessage, setTestMessage] = useState<string>('Hello');
  const [testResult, setTestResult] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);

  // Conversation tracking
  const [conversationId, setConversationId] = useState(() => createConversationId());
  const [conversation, setConversation] = useState<SimulatorTurn[]>([]);
  const [turnAnalyses, setTurnAnalyses] = useState<Record<string, TurnAnalysis>>({});
  const [analyzingTurn, setAnalyzingTurn] = useState(false);
  const [runtimeAttestation, setRuntimeAttestation] = useState<TurnAttestation | null>(null);
  const [effectivePrompt, setEffectivePrompt] = useState<string>('');
  const [useLearnedSnippets, setUseLearnedSnippets] = useState<boolean>(true);
  const [snippetScopeHashOverride, setSnippetScopeHashOverride] = useState<string>('');
  const [lastGuardEvent, setLastGuardEvent] = useState<GuardEvent | null>(null);
  const [evaluationMode, setEvaluationMode] = useState<'perMessage' | 'postCall'>('postCall');
  const [sessions, setSessions] = useState<SessionEvaluation[]>(() => loadSessions());
  const [latestSession, setLatestSession] = useState<SessionEvaluation | null>(
    sessions[0] ?? null,
  );
  const [hasEvaluatedSession, setHasEvaluatedSession] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<any>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [evaluationContext, setEvaluationContext] = useState<{ callLogId: string | null; reviewId: string | null; promptId: string | null } | null>(null);
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [correctionConfirmation, setCorrectionConfirmation] = useState<string | null>(null);
  
  // Message editing state
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [masterAgentContext, setMasterAgentContext] = useState<string>('');

  // Feedback state (thumbs up/down for each message)
  const [messageFeedback, setMessageFeedback] = useState<Record<number, 'up' | 'down' | null>>({});

  // Token tracking
  const [totalTokens, setTotalTokens] = useState(0);
  const [lastCallTokens, setLastCallTokens] = useState(0);

  const [ignoreConfidenceGate, setIgnoreConfidenceGate] = useState(false);
  const gateSnapshot = useMemo(
    () => (selectedAgentId ? governanceState[selectedAgentId] ?? null : null),
    [governanceState, selectedAgentId]
  );
  const [goldenSamples, setGoldenSamples] = useState<GoldenSample[]>([]);
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [goldTitle, setGoldTitle] = useState('');
  const [goldNotes, setGoldNotes] = useState('');
  const [replayResults, setReplayResults] = useState<ReplaySummary[] | null>(null);
  const [replayRunning, setReplayRunning] = useState(false);
  const [replayFetchedAt, setReplayFetchedAt] = useState<string | null>(null);

  const refreshGoldenSamples = useCallback(() => {
    if (!selectedAgentId || !promptHash) {
      setGoldenSamples([]);
      return;
    }
    try {
      const samples = listGoldenSamples({ agentId: selectedAgentId, promptHash });
      setGoldenSamples(samples);
    } catch (error) {
      console.error('Failed to load golden dataset:', error);
      setGoldenSamples([]);
    }
  }, [selectedAgentId, promptHash]);

  const gateCardClasses = gateSnapshot?.isGated
    ? 'border-amber-500/60 bg-amber-500/10'
    : 'border-emerald-500/40 bg-emerald-500/8';
  const gateModeLabel =
    gateSnapshot?.operatingMode === 'qualification_only' ? 'Qualification-only' : 'Full booking';
  const gateResumeAt = gateSnapshot?.autoResumeAt
    ? new Date(gateSnapshot.autoResumeAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  const gateStatusChipClass = gateSnapshot?.isGated
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200';
  const gateStatusLabel = gateSnapshot?.isGated ? 'Gate Active' : 'Gate Clear';
  const gateStatusMeta =
    gateSnapshot?.isGated && gateSnapshot?.gateReason
      ? gateSnapshot.gateReason
      : gateSnapshot?.isGated
      ? 'Manual review required'
      : 'Sandbox ready';
  const gateConfidence = gateSnapshot?.lastConfidence;
  
  // Calculate real-time token usage stats (moved here to avoid "used before initialization" error)
  const tokenStats = useMemo(() => {
    if (!runtimeAttestation) return null;
    const { tokenBudget } = runtimeAttestation;
    const promptTokens = tokenBudget.systemPrompt + tokenBudget.spec;
    const learnedTokens = tokenBudget.snippets;
    const conversationTokens = tokenBudget.lastTurns;
    const totalTokens = tokenBudget.total;
    const costEstimate = (totalTokens / 1000) * 0.00075;

    return {
      promptTokens,
      learnedTokens,
      conversationTokens,
      totalTokens,
      costEstimate,
    };
  }, [runtimeAttestation]);

  useEffect(() => {
    if (conversation.length === 0) {
      setCallReview(null);
      setCallReviewError(null);
      setCallReviewLoading(false);
      setQualityReviewHistory({});
    }
  }, [conversation.length]);

  // Master AI Manager Hook (initialized after selectedAgent is defined)
  const masterAI = useMasterAIManager({
    agentId: selectedId,
    niche: selectedNiche,
    systemPrompt: systemPrompt,
    llmProvider: selectedAgent?.llmProvider || 'openai',
    enablePreTurnGuidance: enableMasterAI && enablePreTurnGuidance,
    enableQualityGates: enableMasterAI && enableQualityGates,
    enableInterventions: enableMasterAI,
    enableLearning: enableMasterAI,
    goldenDatasetMode: false, // TODO: hook up to golden dataset mode when active
  });
  
  const agentSpecHistory = useMemo(
    () => specHistory.filter((entry) => entry.agentId === selectedId).slice(0, timelineExpanded ? 12 : 5),
    [specHistory, selectedId, timelineExpanded]
  );
  const formatRelative = useCallback((iso: string) => {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 60_000) return 'just now';
    const minutes = Math.round(diffMs / 60_000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }, []);
  const evaluationActivity = useMemo(() => {
    if (!latestSession || !selectedAgent) return null;
    if (latestSession.agentId && latestSession.agentId !== selectedAgent.id) return null;
    const endedAt = latestSession.endedAt || latestSession.startedAt;
    return {
      id: latestSession.conversationId,
      summary: `Evaluation • ${latestSession.confidence}% confidence`,
      savedAt: new Date(endedAt || Date.now()).toISOString(),
    };
  }, [latestSession, selectedAgent]);
  const observabilitySummary = useMemo(() => {
    if (!enableMasterAI || !showObservability || !masterAI.getObservabilitySummary) {
      return null;
    }
    try {
      return masterAI.getObservabilitySummary();
    } catch (error) {
      console.warn('Failed to read observability summary', error);
      return null;
    }
  }, [enableMasterAI, masterAI, showObservability]);
  
  // Status summary calculations (moved here after observabilitySummary is defined)
  const statusTokenSummary = tokenStats
    ? `~${tokenStats.totalTokens.toLocaleString()}t`
    : observabilitySummary
    ? `~${Math.round(observabilitySummary.totalTokens).toLocaleString()}t`
    : '—';
  const statusCostSummary = observabilitySummary
    ? `$${observabilitySummary.totalCost.toFixed(3)}`
    : tokenStats
    ? `$${tokenStats.costEstimate.toFixed(3)}`
    : '—';
  const statusLatencySummary =
    observabilitySummary && observabilitySummary.avgLatency > 0
      ? `${Math.round(observabilitySummary.avgLatency)}ms`
      : '—';

  useEffect(() => {
    const qualityBlocked = Boolean(masterAI.qualityReview && !masterAI.qualityReview.approved);
    if (previousQualityBlocked.current === null) {
      previousQualityBlocked.current = qualityBlocked;
      return;
    }
    if (previousQualityBlocked.current !== qualityBlocked) {
      triggerHaptic(qualityBlocked ? 'quality-blocked' : 'quality-approved');
    }
    previousQualityBlocked.current = qualityBlocked;
  }, [masterAI.qualityReview, triggerHaptic]);

  useEffect(() => {
    if (gateSnapshot?.isGated == null) return;
    if (previousGateState.current === null) {
      previousGateState.current = gateSnapshot.isGated;
      return;
    }
    if (previousGateState.current !== gateSnapshot.isGated) {
      triggerHaptic('gate-flip');
    }
    previousGateState.current = gateSnapshot.isGated;
  }, [gateSnapshot?.isGated, triggerHaptic]);

  useEffect(() => {
    if (typeof masterAI.confidenceGateActive === 'undefined') return;
    if (previousConfidenceGate.current === null) {
      previousConfidenceGate.current = masterAI.confidenceGateActive;
      return;
    }
    if (previousConfidenceGate.current !== masterAI.confidenceGateActive) {
      triggerHaptic(masterAI.confidenceGateActive ? 'confidence-armed' : 'confidence-cleared');
    }
    previousConfidenceGate.current = masterAI.confidenceGateActive;
  }, [masterAI.confidenceGateActive, triggerHaptic]);

  const runSessionEvaluation = useCallback(() => {
    if (conversation.length === 0) return null;

    // Use spec-based evaluation if we have an active spec and scope
    let session: SessionEvaluation;
    
    if (currentScopeId && activeSpec) {
      // NEW: Spec-based, scoped evaluation
      console.log(`🎯 Evaluating with spec: ${activeSpec.niche} (scope: ${currentScopeId.substring(0, 30)}...)`);
      session = evaluateAfterCallWithSpec(
        conversationId,
        conversation,
        selectedAgent?.id || 'unknown',
        activeSpec,
        selectedNiche
      );
      
      // Save to scoped storage
      saveScopedSession(currentScopeId, session);
    } else {
      // FALLBACK: Legacy evaluation without spec
      console.log(`ℹ️ Evaluating without spec (legacy mode)`);
      session = evaluateAfterCall(
        conversationId, 
        conversation,
        selectedAgent?.id || 'unknown',
        selectedNiche
      );
    }
    
    setSessions((prev) => [session, ...prev.filter((s) => s.conversationId !== session.conversationId)]);
    setLatestSession(session);
   setHasEvaluatedSession(true);
   useStore.getState().recordAgentEvaluation(
      session.agentId,
      session.confidence,
      session.conversationId,
      { conversationId: session.conversationId, sandbox: true }
    );
    return session;
  }, [conversation, conversationId, selectedAgent?.id, selectedNiche, currentScopeId, activeSpec]);

  const performPostCallReview = useCallback(
    async (transcript: SimulatorTurn[]): Promise<CallReviewResult | null> => {
      if (evaluationMode !== 'postCall') {
        return null;
      }
      if (!selectedAgent || transcript.length === 0) {
        return null;
      }

      setCallReviewLoading(true);
      setCallReviewError(null);
      setCallReview(null);

      const traceId = `postcall-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      try {
        const response = await fetch('/api/mcp/master/reviewCall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: selectedAgent.id,
            niche: selectedNiche,
            systemPrompt,
            conversation: transcript.map((turn) => ({
              role: turn.role,
              text: turn.text,
            })),
            qualityThreshold: 70,
            confidenceThreshold: 70,
            llmProvider: selectedAgent.llmProvider || 'openai',
            traceId,
          }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) {
          const message =
            data?.error || `Post-call review failed (status ${response.status})`;
          throw new Error(message);
        }

        const review = data.review as CallReviewResult;
        setCallReview(review);
        return review;
      } catch (error: any) {
        const message = error?.message || 'Failed to run post-call review';
        setCallReviewError(message);
        toast.error(message, { icon: '⚠️' });
        return null;
      } finally {
        setCallReviewLoading(false);
      }
    },
    [evaluationMode, selectedAgent, selectedNiche, systemPrompt],
  );

  const canEvaluateNow = useMemo(() => {
    const hasCaller = conversation.some((t) => t.role === 'caller');
    const hasAgent = conversation.some((t) => t.role === 'agent');
    return hasCaller && hasAgent;
  }, [conversation]);

  const latestAgentTurn = useMemo(() => {
    for (let i = conversation.length - 1; i >= 0; i -= 1) {
      if (conversation[i].role === 'agent') {
        return conversation[i];
      }
    }
    return null;
  }, [conversation]);

  const hasAgentReviewData = useMemo(
    () => conversation.some((turn) => turn.role === 'agent' && qualityReviewHistory[turn.id]),
    [conversation, qualityReviewHistory],
  );

  const legacyConversation = useMemo<LegacyConversationTurn[]>(
    () =>
      conversation.map((turn) => ({
        speaker: turn.role === 'caller' ? 'user' : 'agent',
        text: turn.text,
        timestamp: turn.ts,
      })),
    [conversation],
  );

  const handleEvaluateNow = useCallback(async () => {
    if (!canEvaluateNow) return;

    // 🔥 POST-CALL AUTO-CORRECTION: Analyze entire transcript for violations
    const allViolations: Array<{ turn: SimulatorTurn; violations: Violation[] }> = [];
    let totalCorrections = 0;

    if (activeSpec && currentScopeId && selectedAgent?.id) {
      console.log('🔍 Master Agent analyzing transcript for violations...');

      // Scan all agent responses in the transcript
      conversation.forEach((turn, idx) => {
        if (turn.role === 'agent') {
          const historyUpToThisTurn = conversation.slice(0, idx);
          const violations = validateAgentResponse(
            turn.text,
            turn.id,
            activeSpec,
            historyUpToThisTurn
          );

          if (violations.length > 0) {
            allViolations.push({ turn, violations });

            // Generate and store correction for each violation
            const correctionResult = autoCorrectResponse(violations, historyUpToThisTurn, activeSpec);
            
            if (correctionResult.correctedResponse) {
              // Store in knowledge base
              applyScopedCorrections(currentScopeId, conversationId, {
                turnId: turn.id,
                correctedResponse: correctionResult.correctedResponse,
              });

              totalCorrections++;
              
              console.log(`  📝 Turn ${idx + 1}: ${violations.length} violation(s) - Auto-corrected`);
              violations.forEach(v => console.log(`     • [${v.severity}] ${v.type}: ${v.message}`));
            }
          }
        }
      });

      if (allViolations.length > 0) {
        console.log(`✅ Master Agent found ${allViolations.length} agent responses with violations`);
        console.log(`   Applied ${totalCorrections} auto-corrections to knowledge base`);

        // Show summary
        toast.success(
          `🎓 Master Agent: ${allViolations.length} violation${allViolations.length !== 1 ? 's' : ''} found, ${totalCorrections} correction${totalCorrections !== 1 ? 's' : ''} applied to KB`,
          { duration: 5000, className: 'pulse' }
        );

        if (selectedAgent?.id) {
          const storeApi = useStore.getState();
          allViolations.forEach(({ turn, violations }) => {
            storeApi.recordRuleViolations(selectedAgent.id, conversationId, turn.id, violations);
          });
        }
      }
    }

    const session = runSessionEvaluation();
    if (session) {
      toast.success('Session evaluated');
      if (evaluationMode === 'postCall') {
        await performPostCallReview(conversation);
      }
    }
  }, [
    canEvaluateNow,
    runSessionEvaluation,
    conversation,
    conversationId,
    activeSpec,
    currentScopeId,
    selectedAgent?.id,
    evaluationMode,
    performPostCallReview,
  ]);

  const handleEndCall = useCallback(async () => {
    if (conversation.length === 0) {
      toast.error('No conversation to evaluate');
      return;
    }

    // 🔥 POST-CALL AUTO-CORRECTION: Analyze entire transcript for violations
    const allViolations: Array<{ turn: SimulatorTurn; violations: Violation[] }> = [];
    let totalCorrections = 0;

    if (!activeSpec || !currentScopeId) {
      console.warn('⚠️ Master Agent Review skipped - No PromptSpec loaded');
      console.warn('   Click "Save Prompt" to enable automatic violation detection and correction');
      toast(
        <div className="space-y-1">
          <p className="font-semibold text-sm">⚠️ Self-Healing Disabled</p>
          <p className="text-xs text-muted-foreground">Click "Save Prompt" above to enable automatic corrections</p>
        </div>,
        { duration: 4000, icon: '🔒' }
      );
    } else if (activeSpec && currentScopeId && selectedAgent?.id) {
      console.log('🔍 Master Agent analyzing transcript for violations...');

      // Scan all agent responses in the transcript
      conversation.forEach((turn, idx) => {
        if (turn.role === 'agent') {
          const historyUpToThisTurn = conversation.slice(0, idx);
          const violations = validateAgentResponse(
            turn.text,
            turn.id,
            activeSpec,
            historyUpToThisTurn
          );

          if (violations.length > 0) {
            allViolations.push({ turn, violations });

            // Generate and store correction for each violation
            const correctionResult = autoCorrectResponse(violations, historyUpToThisTurn, activeSpec);
            
            if (correctionResult.correctedResponse) {
              // Store in knowledge base
              applyScopedCorrections(currentScopeId, conversationId, {
                turnId: turn.id,
                correctedResponse: correctionResult.correctedResponse,
              });

              totalCorrections++;
              
              console.log(`  📝 Turn ${idx + 1}: ${violations.length} violation(s) - Auto-corrected`);
              violations.forEach(v => console.log(`     • [${v.severity}] ${v.type}: ${v.message}`));
            }
          }
        }
      });

      if (allViolations.length > 0) {
        console.log(`✅ Master Agent found ${allViolations.length} agent responses with violations`);
        console.log(`   Applied ${totalCorrections} auto-corrections to knowledge base`);

        // Show detailed summary toast
        toast(
          <div className="space-y-2">
            <p className="font-semibold text-sm">🤖 Master Agent Review Complete</p>
            <p className="text-xs text-muted-foreground">
              Found {allViolations.length} response{allViolations.length !== 1 ? 's' : ''} needing correction
            </p>
            <ul className="text-[10px] space-y-1 text-muted-foreground mt-1">
              {allViolations.slice(0, 3).map((item, idx) => (
                <li key={idx}>• {item.violations[0].type}: {item.violations[0].message.substring(0, 60)}...</li>
              ))}
              {allViolations.length > 3 && (
                <li className="text-primary">+ {allViolations.length - 3} more...</li>
              )}
            </ul>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">
              ✓ {totalCorrections} correction{totalCorrections !== 1 ? 's' : ''} saved to agent KB
            </p>
          </div>,
          {
            duration: 8000,
            className: 'pulse',
            icon: '🎓',
          }
        );

        if (selectedAgent?.id) {
          const storeApi = useStore.getState();
          allViolations.forEach(({ turn, violations }) => {
            storeApi.recordRuleViolations(selectedAgent.id, conversationId, turn.id, violations);
          });
        }
      } else {
        console.log('✅ Master Agent review: No violations detected - excellent performance!');
        toast.success('🎉 Perfect call! No corrections needed', {
          duration: 3000,
          className: 'pulse',
        });
      }
    }

    // Use spec-based evaluation if we have an active spec and scope
    let result: SessionEvaluation;
    
    if (currentScopeId && activeSpec) {
      // NEW: Spec-based, scoped evaluation
      console.log(`🎯 End Call - Evaluating with spec: ${activeSpec.niche} (scope: ${currentScopeId.substring(0, 30)}...)`);
      result = evaluateAfterCallWithSpec(
        conversationId,
        conversation,
        selectedAgent?.id || 'unknown',
        activeSpec,
        selectedNiche
      );
      
      // Save to scoped storage
      saveScopedSession(currentScopeId, result);
      toast.success(`Call ended - Evaluation complete (${result.confidence}% confidence)`);
    } else {
      // FALLBACK: Legacy evaluation
      console.log(`ℹ️ End Call - Evaluating without spec (legacy mode)`);
      result = evaluateAfterCall(
        conversationId, 
        conversation,
        selectedAgent?.id || 'unknown',
        selectedNiche
      );
      saveSession(result);
      toast.success('Call ended - Master AI evaluation complete');
    }
    
    setSessions([result, ...sessions.filter((s) => s.conversationId !== result.conversationId)]);
    setLatestSession(result);
    setHasEvaluatedSession(true);
    await performPostCallReview(conversation);

    // Optional: Reset conversation for new call
    // setConversation([]);
    // setConversationId(createConversationId());
  }, [
    conversation,
    conversationId,
    sessions,
    selectedAgent?.id,
    selectedNiche,
    activeSpec,
    currentScopeId,
    performPostCallReview,
  ]);

  useEffect(() => {
    if (!selectedAgent && voiceAgents.length > 0) {
      setSelectedId(voiceAgents[0].id);
    }
  }, [selectedAgent, voiceAgents]);

  useEffect(() => {
    refreshGoldenSamples();
  }, [refreshGoldenSamples]);

  useEffect(() => {
    if (!selectedAgentId) {
      setGoldenSamples([]);
    }
    setGoldTitle('');
    setGoldNotes('');
    setShowGoldModal(false);
    setReplayResults(null);
    setReplayFetchedAt(null);
  }, [selectedAgentId, promptHash]);

  // Load available niches on mount
  useEffect(() => {
    const loadNiches = async () => {
      try {
        const response = await fetch('/api/mcp/prompt/niches');
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }
        const data = await response.json();
        if (data.ok && data.niches) {
          setAvailableNiches(data.niches);
        }
      } catch (error) {
        console.error('Failed to load niches:', error);
        toast.error('Failed to load niches from server, using fallback list.');
        setAvailableNiches(fallbackNiches);
      }
    };
    loadNiches();
  }, []);

  useEffect(() => {
    if (!selectedAgent) {
      setSystemPrompt('');
      setKnowledge('');
      setPromptHash('');
      setSpecValidation(null);
      return;
    }

    setSystemPrompt((selectedAgent as VoiceAgent).systemPrompt || '');
    const kb = (selectedAgent as any).knowledgeBase as string[] | undefined;
    setKnowledge(kb?.join('\n') || '');

    const storeApi = useStore.getState();
    const lock = storeApi.getSpecLock(selectedAgent.id);
    if (lock) {
      setPromptHash(lock.promptHash);
      setSpecValidation(storeApi.validateSpecLock(selectedAgent.id, lock.promptHash, lock.storedSpec));
    } else {
      setPromptHash('');
      setSpecValidation({
        status: 'missing_lock',
        message: 'No saved spec found – save prompt to lock behaviour.',
        lock: null,
      });
    }
  }, [selectedAgent]);

  useEffect(() => {
    let cancelled = false;

    if (!systemPrompt) {
      setActiveSpec(DEFAULT_SPEC); // Always use DEFAULT_SPEC instead of null
      setSpecLintIssues([]);
      setPromptHash('');
      return;
    }

    const draftSpec = extractSpecFromPrompt(systemPrompt);
    setActiveSpec(draftSpec); // extractSpecFromPrompt returns DEFAULT_SPEC if no markers found
    setSpecLintIssues(lintSpec(draftSpec, systemPrompt));

    const computeHash = async () => {
      const hash = await generatePromptHash(systemPrompt);
      if (cancelled) return;
      setPromptHash(hash);
      if (selectedAgent) {
        const validation = useStore.getState().validateSpecLock(selectedAgent.id, hash, draftSpec);
        setSpecValidation(validation);
      }
    };

    computeHash();

    return () => {
      cancelled = true;
    };
  }, [systemPrompt, selectedAgent]);

  useEffect(() => {
    if (!selectedAgent) return;
    const specToCheck = activeSpec ?? extractSpecFromPrompt(systemPrompt);
    const validation = useStore.getState().validateSpecLock(selectedAgent.id, promptHash || '', specToCheck);
    setSpecValidation(validation);
  }, [specHistory, selectedAgent, activeSpec, systemPrompt, promptHash]);

  useEffect(() => {
    if (!showEvaluation) {
      setScorecardOpen(false);
    } else if (showEvaluation && currentEvaluation && evaluationMode === 'perMessage') {
      setScorecardOpen(true);
    }
  }, [showEvaluation, currentEvaluation, evaluationMode]);

  const payload: TrainingPayload | null = selectedAgent
    ? {
        agentId: selectedAgent.id,
        systemPrompt,
        knowledgeBase: knowledge
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        qnaPairs: qna,
        customActions: (selectedAgent as any).customActions || [],
      }
    : null;

  const handleLocalSave = async () => {
    if (!payload) return;
    setSaving(true);
    try {
      // optimistic save to local store (extend store shape if needed)
      toast.success('Training data saved locally');
    } catch (e) {
      toast.error('Failed saving locally');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncToGHL = async () => {
    // DISABLED: Sandboxed mode - no GHL API calls
    toast('GHL sync disabled in sandbox mode');
    return;
    
    /* Original code commented out to prevent 429 errors
    if (!payload) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/ghl/training/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Sync failed');
      toast.success('Synced to GHL dashboard');
    } catch (e) {
      toast.error('Failed syncing to GHL');
    } finally {
      setSyncing(false);
    }
    */
  };

  const handleGeneratePrompt = async () => {
    if (!selectedAgent) return;
    setGenLoading(true);
    try {
      // Use new compose endpoint
      const response = await fetch('/api/mcp/prompt/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: selectedNiche,
          goals: [
            'Qualify leads and understand customer needs',
            'Schedule appointments with appropriate team members',
            'Capture accurate contact and preference information'
          ],
          tone: 'professional',
          businessHours: { open: '9 AM', close: '5 PM' },
          clientContext: { 
            businessName: selectedAgent.name || 'Your Business',
            industry: selectedNiche
          },
          compliance: [],
          enhance: true,
          agentId: selectedAgent.id,
          saveToDb: true
        })
      });

      const data = await response.json();
      
      if (data.ok && data.prompt) {
        setComposedPrompt(data.prompt);
        setSystemPrompt(data.prompt.system_prompt);
        setShowPreview(true);
        toast.success('Prompt composed successfully!');
      } else {
        const errorMsg = data.error || 'Prompt composition failed';
        toast.error(errorMsg);
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || e.message || 'Prompt composition failed';
      toast.error(errorMsg);
      console.error('Prompt composition error:', e);
    } finally {
      setGenLoading(false);
    }
  };

  const handleSaveState = async () => {
    if (!payload) return;
    setSaving(true);
    try {
      const res = await mcp.agentSaveState({
        agentId: payload.agentId,
        customerId: 'training',
        state: {
          systemPrompt: payload.systemPrompt,
          knowledgeBase: payload.knowledgeBase,
          qnaPairs: payload.qnaPairs,
        },
      });
      if ((res as any)?.success !== false) {
        toast.success('State saved');
      } else {
        toast.error('Save failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGoldenSample = () => {
    if (!selectedAgentId || !selectedAgent) {
      toast.error('Select an agent before saving a golden sample');
      return;
    }
    if (!latestSession || conversation.length === 0) {
      toast.error('Run a simulated call and evaluation before saving a gold sample');
      return;
    }
    if (!promptHash) {
      toast.error('Save the prompt first to lock a version before saving gold samples');
      return;
    }

    const id = `gold-${Date.now()}`;
    const sample: GoldenSample = {
      id,
      agentId: selectedAgentId,
      niche: selectedNiche,
      promptHash,
      title: goldTitle.trim() || `Sample ${new Date().toLocaleString()}`,
      notes: goldNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      transcript: conversation.map((turn) => ({ ...turn })),
      expected: {
        collectedFields: latestSession.collectedFields,
        rubric: latestSession.rubric,
        confidence: latestSession.confidence,
      },
      originalEvaluation: latestSession,
    };

    try {
      saveGoldenSample(sample);
      toast.success('Saved to golden dataset');
      setGoldTitle('');
      setGoldNotes('');
      setShowGoldModal(false);
      refreshGoldenSamples();
    } catch (error) {
      console.error('Failed to save golden sample:', error);
      toast.error('Could not save golden sample');
    }
  };

  const handleReplayGoldenDataset = async () => {
    if (!selectedAgentId) {
      toast.error('Select an agent before replaying');
      return;
    }
    if (!promptHash) {
      toast.error('Save the prompt to lock a hash before replaying');
      return;
    }
    setReplayRunning(true);
    try {
      const results = replayGoldenDataset(
        {
          agentId: selectedAgentId,
          promptHash,
          niche: selectedNiche,
        },
        { spec: activeSpec }
      );
      setReplayResults(results);
      setReplayFetchedAt(new Date().toISOString());
      toast.success(`Replayed ${results.length} golden sample${results.length === 1 ? '' : 's'}`);
    } catch (error) {
      console.error('Failed to replay golden dataset:', error);
      toast.error('Golden dataset replay failed');
    } finally {
      setReplayRunning(false);
    }
  };

  const handleDeleteGoldenSample = (id: string) => {
    deleteGoldenSample(id);
    refreshGoldenSamples();
    toast.success('Removed golden sample');
  };

  const handleDeploy = async () => {
    // DISABLED: Sandboxed mode - no GHL API calls
    toast('Agent deployment disabled in sandbox mode. Prompt is saved locally in database.');
    return;
    
    /* Original code commented out to prevent 429 errors
    if (!payload || !selectedAgent) return;
    setSyncing(true);
    try {
      const base = getApiBaseUrl();
      const body = {
        name: selectedAgent.name || 'Sales Assistant',
        description: 'Qualifies leads and books appointments',
        voiceSettings: { provider: 'elevenlabs', voiceId: 'rachel', speed: 1.0, stability: 0.7, similarityBoost: 0.8 },
        conversationSettings: { systemPrompt, temperature: 0.7, maxTokens: 1000 },
        scripts: { greeting: 'Hi! Thanks for calling. How can I help?', fallback: 'Sorry, could you rephrase?', transfer: 'Connecting you with a specialist.', goodbye: 'Thanks for calling!' },
        intents: [
          { name: 'schedule_appointment', phrases: ['schedule','book','appointment'], action: 'schedule_appointment' },
          { name: 'pricing_inquiry', phrases: ['price','cost','how much'], action: 'provide_pricing_info' }
        ],
        knowledgeBase: payload.knowledgeBase,
        compliance: { tcpaCompliant: true, recordingConsent: true }
      };
      const res = await fetch(`${base}/api/voice-ai/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Deploy failed');
      toast.success('Agent deploy request submitted');
    } catch (e: any) {
      toast.error(e.message || 'Deploy failed');
    } finally {
      setSyncing(false);
    }
    */
  };

  // === Inline Testing (same tab) ===
  const handleHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const res = await mcp.agentCheckHealth({ agentId: 'system', checks: ['database','apis'] });
      setHealthResult(res);
      toast.success('Health OK');
    } catch (e: any) {
      toast.error(e.message || 'Health check failed');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleDryRun = async () => {
    if (!selectedAgent || !testMessage.trim()) return;

    const storeApi = useStore.getState();
    if (!ignoreConfidenceGate) {
      const gateStatus = storeApi.checkAgentGate(selectedAgent.id);
      if (gateStatus.isGated) {
        const resumeText = gateStatus.autoResumeAt
          ? ` (auto-resumes ${new Date(gateStatus.autoResumeAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
          : '';
        toast.error(`Confidence gate active: ${gateStatus.reason || 'Awaiting manual review'}${resumeText}`);
        return;
      }
    } else if (gateSnapshot?.isGated) {
      storeApi.clearAgentGate(selectedAgent.id);
      toast('Confidence gate bypassed for sandbox run', { icon: '🛠️', duration: 2500 });
    }

    if (hasEvaluatedSession) {
      setHasEvaluatedSession(false);
    }

    // Snapshot conversation state before mutation (for rollback on error)
    const previousConversation = [...conversation];
    const previousTotalTokens = totalTokens;
    const previousLastCallTokens = lastCallTokens;

    const callerTs = Date.now();
    const callerTurn: SimulatorTurn = {
      id: `caller-${callerTs}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'caller',
      text: testMessage,
      ts: callerTs,
    };

    const updatedConversation = [...conversation, callerTurn];
    setConversation(updatedConversation);

    setSyncing(true);
    try {
      if (!selectedAgent?.id) {
        throw new Error('No agent selected');
      }

      const runHash = await generatePromptHash(systemPrompt);
      setPromptHash(runHash);
      const runtimeSpec = extractSpecFromPrompt(systemPrompt);
      const specCheck = storeApi.validateSpecLock(selectedAgent.id, runHash, runtimeSpec);
      setSpecValidation(specCheck);

      if (specCheck.status !== 'ok') {
        setSyncing(false);
        toast.error(specCheck.message, {
          icon: '⚠️',
          duration: 5000,
          className: 'pulse',
        });
        return;
      }

      const snippetHashForRun = useLearnedSnippets ? (snippetScopeHashOverride || '') : '';
      const contextPayload = truncateContext({
        sandbox: true,
        locationId,
        agentId: selectedAgent.id,
        niche: selectedNiche,
        conversationLength: updatedConversation.length,
        lastCallerMessage: testMessage,
        snippetScopeHash: snippetHashForRun || 'current',
      });
      const contextJson = JSON.stringify(contextPayload);
      const conversationSummary = generateRollingSummary(updatedConversation);
      const lastTurns = getRecentTurns(updatedConversation, 8).map(
        (turn) => `${turn.role === 'caller' ? 'USER' : 'ASSISTANT'}: ${turn.text}`
      );

      const compiled = await compileRuntimeContext({
        locationId,
        agentId: selectedAgent.id,
        systemPrompt,
        contextJson,
        conversationSummary,
        lastTurns,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 4096,
        snippetsEnabled: useLearnedSnippets,
        guardEnabled: true,
        turnId: callerTurn.id,
        snippetScopeHash: useLearnedSnippets ? (snippetScopeHashOverride || undefined) : undefined,
      });

      setRuntimeAttestation(compiled.attestation);
      setEffectivePrompt(compiled.effectivePrompt);

      const signature = createTurnSignature(
        selectedAgent.id,
        updatedConversation,
        compiled.systemPromptForModel,
        compiled.snippetScopeId
      );

      const estimatedCallTokens = compiled.attestation.tokenBudget.total + 150;
      const budgetCheck = storeApi.checkTokenBudget(selectedAgent.id, estimatedCallTokens);
      if (!budgetCheck.allowed) {
        setSyncing(false);
        toast.error(
          `Token budget exceeded for ${selectedAgent.name}. Remaining ${budgetCheck.remaining.toLocaleString()} tokens.`,
          { duration: 5000 }
        );
        return;
      }

      const cachedTurn = storeApi.getCachedTurn(selectedAgent.id, signature);
      if (cachedTurn) {
        const agentTs = Date.now();
        const agentTurn: SimulatorTurn = {
          id: `agent-${agentTs}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'agent',
          text: cachedTurn.response,
          ts: agentTs,
        };

        const finalConversation = [...updatedConversation, agentTurn];
        setConversation(finalConversation);
        setTestResult({ cached: true, response: cachedTurn.response });
        setLastCallTokens(0);
        storeApi.recordCacheHit(selectedAgent.id);
        storeApi.recordInvocationMetrics(selectedAgent.id, {
          tokens: 0,
          costUsd: 0,
          latencyMs: cachedTurn.latencyMs,
          source: 'cache',
          conversationId,
        });
        storeApi.recordTurnTrace(selectedAgent.id, {
          traceId: `${conversationId}-${agentTurn.id}`,
          agentId: selectedAgent.id,
          conversationId,
          turnId: agentTurn.id,
          timestamp: new Date(agentTurn.ts).toISOString(),
          tokens: {
            prompt: compiled.attestation.tokenBudget.total,
            completion: 0,
            total: compiled.attestation.tokenBudget.total,
          },
          model: 'cache-hit',
          latencyMs: cachedTurn.latencyMs,
          rulesChecked: ['cache-hit'],
          source: 'sandbox',
          metadata: {
            attestation: compiled.attestation,
            cacheHit: true,
          },
        });
        setRuntimeAttestation((prev) =>
          prev ? { ...prev, model: 'cache-hit' } : compiled.attestation
        );
        setSyncing(false);
        toast.success('Served from cache');
        setTestMessage('');

        if (showEvaluation && evaluationMode === 'perMessage') {
          await evaluateConversation(finalConversation);
        }
        return;
      }

      // 🤖 Master AI: Get Pre-Turn Guidance (if enabled)
      if (enableMasterAI && enablePreTurnGuidance) {
        try {
          const guidance = await masterAI.getPreTurnGuidance({
            conversation: updatedConversation.map(t => ({ role: t.role, text: t.text })),
            fieldsCollected: [], // TODO: track fields collected
            conversationId,
          });
          if (guidance) {
            console.log('🎯 Pre-Turn Guidance Payload:', {
              systemPrompt: systemPrompt.substring(0, 100) + '...',
              conversation: updatedConversation.map(t => `${t.role}: ${t.text.substring(0, 30)}...`),
              llmProvider: selectedAgent?.llmProvider || 'openai',
              temperature: 0.3,
              guidance: guidance.recommendedResponse.substring(0, 50) + '...',
              confidence: guidance.confidence,
            });
            // Auto-expand guidance when it arrives
            setExpandedSections(prev => ({ ...prev, preTurnGuidance: true }));
          }
        } catch (guidanceError) {
          console.warn('Pre-turn guidance failed:', guidanceError);
          // Non-fatal, continue
        }
      }

      const callStart = performance.now();

      const callResponse = await mcp.voiceAgentCall(
        {
          agentId: selectedAgent.id,
          phoneNumber: '+10000000000',
          context: {
            userMessage: testMessage,
            conversationHistory: compiled.messages,
            systemPromptOverride: compiled.systemPromptForModel || 'You are a helpful voice assistant that follows the provided business rules.',
          },
          options: { textOnly: true },
        },
        { showToast: false }
      );

      if (!callResponse.success || !callResponse.data) {
        throw new Error(callResponse.error || 'Call simulation failed');
      }

      const latencyMs = performance.now() - callStart;
      const agentPayload: any = callResponse.data.data ?? callResponse.data;
      const agentText = (agentPayload?.transcript ?? agentPayload?.response ?? agentPayload?.message ?? '').trim();

      if (!agentText) {
        console.warn('⚠️  Agent returned empty response payload:', agentPayload);
      }

      const rawAgentResponse = agentText || 'No response';
      const agentTs = Date.now();
      let agentResponseText = rawAgentResponse;
      if (pendingAgentOverrideRef.current) {
        agentResponseText = pendingAgentOverrideRef.current;
        pendingAgentOverrideRef.current = null;
      }

      let qualityReviewResult: QualityReview | null = null;
      let suggestionApplied = false;
      let guardStatus: GuardEvent = { status: 'ok' };
      try {
        const guardFields = inferCollectedFieldsFromConversation(updatedConversation);
        const guardOutcome = guardResponse(runtimeSpec, guardFields, agentResponseText);

        if (!guardOutcome.approved) {
          guardStatus = {
            status: guardOutcome.modifiedResponse ? 'modified' : 'blocked',
            message: guardOutcome.reason,
            violation: guardOutcome.blockedViolation || undefined,
          };

          if (guardOutcome.modifiedResponse) {
            agentResponseText = guardOutcome.modifiedResponse;
            toast('Runtime guard adjusted the response', { icon: '🛡️', duration: 2500 });
          } else {
            agentResponseText = 'Thanks! Before we continue, I just need to confirm a couple more details first.';
            toast.error(guardOutcome.reason || 'Runtime guard blocked this response', { icon: '🛡️' });
          }
        } else if (guardOutcome.modifiedResponse) {
          guardStatus = {
            status: 'modified',
            message: guardOutcome.reason,
            violation: guardOutcome.blockedViolation || undefined,
          };
          agentResponseText = guardOutcome.modifiedResponse;
          toast('Runtime guard trimmed the response', { icon: '🛡️', duration: 2000 });
        }
      } catch (guardError) {
        console.warn('Runtime guard check failed:', guardError);
      }
      setLastGuardEvent(guardStatus);

      // 🛡️ Master AI: Quality Gate Review (if enabled)
      if (enableMasterAI && enableQualityGates) {
        try {
          const review = await masterAI.reviewResponse({
            response: agentResponseText,
            conversation: updatedConversation.map(t => ({ role: t.role, text: t.text })),
            conversationId,
          });

          qualityReviewResult = review;
          
          console.log('🔍 Quality Review Payload:', {
            systemPrompt: systemPrompt.substring(0, 100) + '...',
            conversation: [...updatedConversation, { role: 'agent', text: agentResponseText }].map(t => `${t.role}: ${t.text.substring(0, 30)}...`),
            response: agentResponseText.substring(0, 50) + '...',
            llmProvider: selectedAgent?.llmProvider || 'openai',
            temperature: 0.2,
            review: {
              approved: review.approved,
              score: review.score,
              confidenceScore: review.confidenceScore,
              issues: review.issues,
              blockedReasons: review.blockedReasons,
            },
          });

          // Check for system prompt hash mismatch (critical)
          const guidanceHash = masterAI.guidance?.observability?.systemPromptHash;
          const reviewHash = review.observability?.systemPromptHash;

          if (guidanceHash && reviewHash && guidanceHash !== reviewHash) {
            console.error('❌ CRITICAL: System prompt changed between guidance and review!');
            console.error('  Guidance hash:', guidanceHash);
            console.error('  Review hash:', reviewHash);
            console.error('  This guarantees mismatched results. Review your prompt management.');
            setGuidanceMismatch(true);
          } else if (guidanceHash && reviewHash) {
            console.log('✅ System prompt hash verified:', guidanceHash, '===', reviewHash);
          }

          // Calculate similarity between guidance and actual response
          const calculateSimilarity = (str1: string, str2: string): number => {
            const s1 = str1.toLowerCase().trim();
            const s2 = str2.toLowerCase().trim();

            // Levenshtein distance
            const matrix: number[][] = [];
            for (let i = 0; i <= s1.length; i++) {
              matrix[i] = [i];
            }
            for (let j = 0; j <= s2.length; j++) {
              matrix[0][j] = j;
            }

            for (let i = 1; i <= s1.length; i++) {
              for (let j = 1; j <= s2.length; j++) {
                if (s1[i - 1] === s2[j - 1]) {
                  matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                  matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                  );
                }
              }
            }

            const distance = matrix[s1.length][s2.length];
            const maxLen = Math.max(s1.length, s2.length);
            return maxLen === 0 ? 1 : 1 - (distance / maxLen);
          };

          // Check for guidance/gate mismatch using semantic similarity
          const similarity = masterAI.guidance?.recommendedResponse
            ? calculateSimilarity(agentResponseText, masterAI.guidance.recommendedResponse)
            : 0;

          const SIMILARITY_THRESHOLD = 0.7; // 70% similarity threshold

          if (
            !review.approved &&
            masterAI.guidance?.recommendedResponse &&
            similarity > SIMILARITY_THRESHOLD
          ) {
            setGuidanceMismatch(true);
            console.warn('⚠️ MISMATCH DETECTED: Guidance approved, but gate blocked!');
            console.warn('  Guidance recommended:', masterAI.guidance.recommendedResponse.substring(0, 100));
            console.warn('  Agent responded:', agentResponseText.substring(0, 100));
            console.warn('  Similarity score:', (similarity * 100).toFixed(1) + '%', '(threshold: 70%)');
            console.warn('  Blocked reasons:', review.blockedReasons);
            console.warn('  This may indicate spec drift or conflicting rules in your system prompt');
            if (guidanceHash && reviewHash) {
              console.warn('  System prompt hashes:', { guidanceHash, reviewHash, match: guidanceHash === reviewHash });
            }
          } else if (!guidanceHash || !reviewHash || guidanceHash === reviewHash) {
            setGuidanceMismatch(false);
          }

          // Log similarity for debugging (when guidance exists)
          if (masterAI.guidance?.recommendedResponse && similarity > 0.3) {
            console.log('📊 Response similarity:', (similarity * 100).toFixed(1) + '%', {
              guidance: masterAI.guidance.recommendedResponse.substring(0, 50) + '...',
              actual: agentResponseText.substring(0, 50) + '...',
              threshold: '70%',
              wouldTriggerMismatch: similarity > SIMILARITY_THRESHOLD && !review.approved,
            });
          }

          if (!review.approved && review.suggestedResponse) {
            console.warn('🛡️ Quality gate BLOCKED response:', review.blockedReasons);
            console.log('✅ Using suggested fix:', review.suggestedResponse);
            
            // Use the suggested fix instead
            agentResponseText = review.suggestedResponse;
            suggestionApplied = true;
            
            // Log intervention
            const intervention = await masterAI.intervene({
              response: agentText || 'No response',
              issues: review.issues,
              turnId: `agent-${agentTs}`,
            });
            
            if (intervention) {
              console.log('🔧 Intervention applied:', intervention.id);
            }
            
            toast.success('Master AI fixed response', { icon: '🛡️' });
          } else if (!review.approved) {
            console.warn('🛡️ Quality gate blocked, no fix available');
            toast.error('Response blocked by quality gate', { icon: '⛔' });
          } else {
            console.log('✅ Quality gate: APPROVED (score:', review.score, ')');
          }
        } catch (reviewError) {
          console.warn('Quality gate review failed:', reviewError);
          // Non-fatal, continue with original response
        }
      }

      const agentTurnId = `agent-${agentTs}-${Math.random().toString(36).slice(2, 6)}`;
      const agentTurn: SimulatorTurn = {
        id: agentTurnId,
        role: 'agent',
        text: agentResponseText,
        ts: agentTs,
      };

      const finalConversation = [...updatedConversation, agentTurn];
      setConversation(finalConversation);
      setTestResult(agentPayload);
      
      // Auto-hide pre-turn guidance once agent responds
      if (enablePreTurnGuidance) {
        setExpandedSections(prev => ({ ...prev, preTurnGuidance: false }));
      }

      const promptTokenEstimate = compiled.attestation.tokenBudget.total;
      const completionTokensEstimate = estimateTokens(agentResponseText);
      const callTokens = promptTokenEstimate + completionTokensEstimate;
      const costUsd = (callTokens / 1000) * 0.00075;

      console.log('📊 Token Usage Breakdown:');
      console.log(`  • Prompt Context: ~${promptTokenEstimate} tokens`);
      console.log(`  • Completion (est): ~${completionTokensEstimate} tokens`);
      console.log(`  • Total This Call: ~${callTokens} tokens`);

      setLastCallTokens(callTokens);
      setTotalTokens((prev) => prev + callTokens);

      if (qualityReviewResult) {
        setQualityReviewHistory((prev) => ({
          ...prev,
          [agentTurnId]: {
            review: qualityReviewResult,
            originalResponse: rawAgentResponse,
            finalResponse: agentResponseText,
            suggestionApplied,
          },
        }));
      }

      storeApi.consumeTokenBudget(selectedAgent.id, callTokens);
      storeApi.recordInvocationMetrics(selectedAgent.id, {
        tokens: callTokens,
        costUsd,
        latencyMs,
        source: 'live',
        conversationId,
      });
      const rulesChecked: string[] = ['confidence-gate'];
      if (specValidation?.status === 'ok') {
        rulesChecked.push('spec-lock');
      }
      if (enableMasterAI) {
        if (enableQualityGates) rulesChecked.push('quality-gate');
        if (enablePreTurnGuidance) rulesChecked.push('pre-turn-guidance');
      }
      storeApi.recordTurnTrace(selectedAgent.id, {
        traceId: `${conversationId}-${agentTurn.id}`,
        agentId: selectedAgent.id,
        conversationId,
        turnId: agentTurn.id,
        timestamp: new Date(agentTurn.ts).toISOString(),
        tokens: {
          prompt: promptTokenEstimate,
          completion: completionTokensEstimate,
          total: callTokens,
        },
        model: agentPayload?.model ?? 'sandbox-sim',
        latencyMs,
        rulesChecked,
        source: 'sandbox',
        metadata: {
          attestation: compiled.attestation,
          guard: guardStatus,
        },
      });
      storeApi.cacheAgentTurn(selectedAgent.id, signature, {
        response: agentTurn.text,
        createdAt: Date.now(),
        tokens: callTokens,
        latencyMs,
      });

      setRuntimeAttestation((prev) =>
        prev ? { ...prev, model: agentPayload?.model ?? prev.model } : compiled.attestation
      );

      setTestMessage('');

      if (showEvaluation && evaluationMode === 'perMessage') {
        await evaluateConversation(finalConversation);
      }

      // Analyze this turn with Master AI
      setAnalyzingTurn(true);
      try {
        const analysis = await analyzeTurnWithAPI({
          agentId: selectedAgent.id,
          conversation: finalConversation.map(turn => ({ role: turn.role, text: turn.text })),
          lastAgentResponse: agentTurn.text,
          promptSpec: runtimeSpec,
          systemPrompt: compiled.systemPromptForModel,
          niche: selectedNiche,
        });
        
        setTurnAnalyses(prev => ({
          ...prev,
          [agentTurn.id]: analysis,
        }));
        
        console.log('🤖 Turn analysis complete:', analysis);
      } catch (analysisError) {
        console.warn('Turn analysis failed:', analysisError);
        // Non-fatal, continue
      } finally {
        setAnalyzingTurn(false);
      }

      toast.success('Response generated');
    } catch (e: any) {
      console.error('Call simulator error:', e);
      toast.error(e.message || 'Dry-run failed');
      
      // ROLLBACK: Restore conversation state on error
      console.log('🔄 Rolling back conversation state due to error');
      setConversation(previousConversation);
      setTotalTokens(previousTotalTokens);
      setLastCallTokens(previousLastCallTokens);
      setRuntimeAttestation(null);
      setEffectivePrompt('');
      setLastGuardEvent(null);
    } finally {
      setSyncing(false);
    }
  };

  const evaluateConversation = async (conv: typeof conversation) => {
    if (!selectedAgent || evaluationMode !== 'perMessage') return;
    
    setEvaluationLoading(true);
    try {
      const transcript = conv
        .map((m) => `${m.role === 'caller' ? 'Caller' : 'Agent'}: ${m.text}`)
        .join('\n');
      
      // Note: Evaluation endpoint is part of autonomous system (may not be deployed yet)
      // This will gracefully handle 404 if endpoint doesn't exist
      const response = await fetch('/api/mcp/agent/ingestTranscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          transcript,
          promptId: null,
          summary: 'Live evaluation from conversation simulator',
          tags: ['live_eval', 'conversation_test'],
          metrics: { messageCount: conv.length }
        })
      });
      
      const data = await response.json().catch(() => null);

      if (response.ok && data) {
        const evaluationPayload = data.evaluation || null;
        if ((data.ok || data.success) && evaluationPayload) {
          setCurrentEvaluation(evaluationPayload);
          setEvaluationContext({
            callLogId: data.callLog?.id ?? null,
            reviewId: data.reviewId ?? data.callLog?.review_id ?? null,
            promptId: data.promptId ?? data.callLog?.prompt_id ?? null
          });
          setCorrectionConfirmation(null);
          if (showEvaluation) {
            setScorecardOpen(true);
          }
        } else {
          setEvaluationContext(null);
        }
      }
    } catch (e: any) {
      console.error('Evaluation failed:', e);
      // Silently fail - evaluation is optional
      setEvaluationContext(null);
    } finally {
      setEvaluationLoading(false);
    }
  };

  const applyAgentResponseOverride = useCallback(
    async (responseText: string): Promise<boolean> => {
      if (conversation.length === 0) return false;

      const updatedConversation = [...conversation];
      let targetIndex = -1;
      for (let i = updatedConversation.length - 1; i >= 0; i -= 1) {
        if (updatedConversation[i].role === 'agent') {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex === -1) {
        return false;
      }

      const targetTurn = updatedConversation[targetIndex];
      updatedConversation[targetIndex] = {
        ...targetTurn,
        text: responseText,
        edited: true,
      };

      pendingAgentOverrideRef.current = null;
      setConversation(updatedConversation);
      setQualityReviewHistory((prev) => {
        if (!targetTurn.id || !prev[targetTurn.id]) {
          return prev;
        }
        return {
          ...prev,
          [targetTurn.id]: {
            ...prev[targetTurn.id],
            finalResponse: responseText,
            correctedManually: true,
          },
        };
      });

      if (targetTurn.id) {
        setTurnAnalyses((prev) => {
          if (!prev[targetTurn.id]) return prev;
          const next = { ...prev };
          delete next[targetTurn.id];
          return next;
        });
      }

      triggerHaptic('quality-approved');
      toast.success('Agent response updated');

      if (showEvaluation && evaluationMode === 'perMessage') {
        evaluateConversation(updatedConversation);
      }

      if (enableMasterAI && enableQualityGates) {
        try {
          await masterAI.reviewResponse({
            response: responseText,
            conversation: updatedConversation.map((t) => ({ role: t.role, text: t.text })),
            conversationId,
          });
        } catch (err) {
          console.warn('Failed to refresh quality review after applying override:', err);
        }
      }

      return true;
    },
    [
      conversation,
      triggerHaptic,
      showEvaluation,
      evaluationMode,
      evaluateConversation,
      enableMasterAI,
      enableQualityGates,
      masterAI,
      conversationId,
    ]
  );

  const handleApplyAgentResponse = useCallback(
    async (responseText: string) => {
      const applied = await applyAgentResponseOverride(responseText);
      if (!applied) {
        pendingAgentOverrideRef.current = responseText;
        triggerHaptic('guidance-apply');
        toast.success('Will use this response for the next agent turn');
      }
    },
    [applyAgentResponseOverride, triggerHaptic]
  );

  const handleSaveCorrection = useCallback(async (payload: ManualCorrectionPayload) => {
    if (!selectedAgent) {
      throw new Error('Please select an agent before saving corrections.');
    }

    if (!evaluationContext) {
      throw new Error('No evaluation context found. Run a scored test before saving corrections.');
    }

    setSavingCorrection(true);
    setCorrectionConfirmation(null);

    try {
      const requestBody = {
        agentId: selectedAgent.id,
        promptId: evaluationContext.promptId,
        callLogId: evaluationContext.callLogId,
        reviewId: evaluationContext.reviewId,
        originalResponse: payload.originalResponse,
        correctedResponse: payload.correctedResponse,
        storeIn: payload.storeIn,
        reason: payload.reason,
        metadata: {
          messageIndex: payload.messageIndex,
          conversationSnapshot: conversation,
          triggeredFrom: 'training_hub'
        }
      };

      const response = await mcp.agentSaveCorrection(requestBody, { showToast: false });

      if (!response.success) {
        throw new Error(response.error || 'Failed to save correction.');
      }

      const confirmationMessage = (response as any).confirmationMessage || 'Correction saved successfully.';
      const updatedPromptId = (response as any).promptId || evaluationContext.promptId;

      setConversation(prev =>
        prev.map((message, index) =>
          index === payload.messageIndex
            ? { ...message, text: payload.correctedResponse }
            : message
        )
      );

      setEvaluationContext(prev => (prev ? { ...prev, promptId: updatedPromptId } : prev));
      setCorrectionConfirmation(confirmationMessage);
      toast.success(confirmationMessage);

      // FIX: Persist turn-level correction to master store with turnId
      if (latestSession && latestSession.conversationId === conversationId) {
        // Find the turn ID from the conversation
        const correctedTurn = conversation[payload.messageIndex];
        const turnId = payload.turnId || correctedTurn?.id;
        
        const updated = applyManualCorrections(conversationId, {
          fields: latestSession.collectedFields,
          turnId: turnId,
          correctedResponse: payload.correctedResponse,
        });
        
        if (updated) {
          console.log(`✅ Manual correction persisted to master store (turnId: ${turnId})`);
          setLatestSession(updated);
          setSessions(prev => [updated, ...prev.filter(s => s.conversationId !== updated.conversationId)]);
        }
      }
    } catch (error: any) {
      const message = error?.message || 'Failed to save correction.';
      toast.error(message);
      throw error;
    } finally {
      setSavingCorrection(false);
    }
  }, [selectedAgent, evaluationContext, conversation, latestSession, conversationId, mcp]);

  const handleSaveForTraining = async () => {
    if (!selectedAgent || conversation.length === 0) {
      toast.error('No conversation to save');
      return;
    }
    
    setSaving(true);
    try {
      // Run evaluation if not already done
      let session = latestSession;
      if (!hasEvaluatedSession || !session || session.conversationId !== conversationId) {
        session = runSessionEvaluation();
      }
      
      if (session) {
        // Save using new masterStore
        saveSession(session);
        
        // Show success with field collection stats
        const fieldsCollected = session.collectedFields.length;
        const allFieldsCollected = fieldsCollected === 5;
        
        toast.success(
          `Saved! ${fieldsCollected}/5 contact fields collected${allFieldsCollected ? ' ✓' : ' ⚠️'}`
        );
        
        // Optional: Try legacy endpoint for backward compatibility (non-blocking)
        try {
          const transcript = conversation
            .map((m) => `${m.role === 'caller' ? 'Caller' : 'Agent'}: ${m.text}`)
            .join('\n');
          
          await fetch('/api/mcp/agent/ingestTranscript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId: selectedAgent.id,
              transcript,
              summary: `Training session - ${fieldsCollected}/5 fields`,
              tags: ['training', 'manual_review', 'dry_run'],
            })
          }).catch(() => {}); // Silently fail if endpoint doesn't exist
        } catch {}
        
        // Reset conversation after successful save
        setConversation([]);
        setQualityReviewHistory({});
        setRuntimeAttestation(null);
        setEffectivePrompt('');
        setLastGuardEvent(null);
        setMessageFeedback({});
        setCallReview(null);
        setCallReviewError(null);
        setCallReviewLoading(false);
        setConversationId(createConversationId());
        setHasEvaluatedSession(false);
        setTestResult(null);
        setCurrentEvaluation(null);
        setScorecardOpen(false);
        setEvaluationContext(null);
        setCorrectionConfirmation(null);
      } else {
        toast.error('Failed to evaluate conversation');
      }
    } catch (e: any) {
      console.error('Save for training error:', e);
      toast.error(e.message || 'Failed to save conversation');
    } finally {
      setSaving(false);
    }
  };

  const handleResetConversation = () => {
    if (conversation.length === 0) return;

    const shouldReset = window.confirm('Retry conversation? The current transcript will be saved and a new session started.');
    if (!shouldReset) return;

    if (evaluationMode === 'postCall' && !hasEvaluatedSession) {
      runSessionEvaluation();
    }

    setConversation([]);
    setQualityReviewHistory({});
    setRuntimeAttestation(null);
    setEffectivePrompt('');
    setLastGuardEvent(null);
    setMessageFeedback({});
    setCallReview(null);
    setCallReviewError(null);
    setCallReviewLoading(false);
    setConversationId(createConversationId());
    setHasEvaluatedSession(false);
    setTestResult(null);
    setCurrentEvaluation(null);
    setTestMessage('');
    setScorecardOpen(false);
    setEvaluationContext(null);
    setCorrectionConfirmation(null);
    toast.success('Ready for a fresh run!');
  };

  const handleCopyTranscript = () => {
    const transcript = conversation
      .map((m) => `${m.role === 'caller' ? 'Caller' : 'Agent'}: ${m.text}`)
      .join('\n\n');

    navigator.clipboard.writeText(transcript);
    toast.success('Transcript copied to clipboard');
  };

  const handleStartEdit = (index: number) => {
    setEditingMessageIndex(index);
    setEditedText(conversation[index].text);
    setMasterAgentContext('');
  };

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
    setEditedText('');
    setMasterAgentContext('');
  };

  const handleSaveEdit = async () => {
    if (editingMessageIndex === null) return;
    
    const originalMessage = conversation[editingMessageIndex];
    
    // Update the conversation locally
    const updatedConversation = conversation.map((msg, idx) =>
      idx === editingMessageIndex ? { ...msg, text: editedText } : msg
    );
    setConversation(updatedConversation);
    if (originalMessage.role === 'agent') {
      setQualityReviewHistory((prev) => {
        if (!originalMessage.id || !prev[originalMessage.id]) {
          return prev;
        }
        return {
          ...prev,
          [originalMessage.id]: {
            ...prev[originalMessage.id],
            finalResponse: editedText,
            correctedManually: true,
          },
        };
      });
    }

    // CRITICAL FIX: Ensure session exists before applying corrections
    try {
      // Run evaluation if not already done to create the session
      let session = latestSession;
      if (!hasEvaluatedSession || !session || session.conversationId !== conversationId) {
        session = runSessionEvaluation();
        if (!session) {
          toast.error('Failed to evaluate session before saving correction');
          handleCancelEdit();
          return;
        }
      }

      // Apply correction - use scoped if available, otherwise fallback
      let result: SessionEvaluation | null;
      
      if (currentScopeId) {
        // NEW: Scoped correction (isolated per location+agent+prompt)
        console.log(`📝 Applying scoped correction to ${currentScopeId.substring(0, 30)}...`);
        result = applyScopedCorrections(
          currentScopeId,
          conversationId,
          {
            turnId: originalMessage.id,
            correctedResponse: editedText,
          }
        );
        
        if (result) {
          toast.success(`Saved for Training (scoped) • ${result.correctionsApplied} corrections`);
        }
      } else {
        // FALLBACK: Legacy correction (agent-wide)
        console.log(`📝 Applying legacy correction (agent-wide)`);
        result = await applyManualFix({
          conversationId,
          turnId: originalMessage.id,
          correctedResponse: editedText,
          agentId: selectedAgent?.id,
          niche: selectedNiche,
        });
        
        if (result) {
          toast.success(`Saved for Training • ${result.correctionsApplied} corrections applied`);
        }
      }

      if (result) {
        // Update local session state to show incremented corrections counter
        setLatestSession(result);
        setSessions((prev) => 
          prev.map(s => s.conversationId === result.conversationId ? result : s)
        );
      } else {
        toast.error('Session not found - evaluation may have failed');
      }
    } catch (error: any) {
      console.error('Failed to save correction:', error);
      toast.error(error.message || 'Failed to save correction');
    }

    // Reset edit state
    handleCancelEdit();
  };

  // Handle system prompt save
  const handleSaveSystemPrompt = async () => {
    if (!selectedAgent) {
      toast.error('No agent selected');
      return;
    }

    setPromptSaving(true);
    try {
      // 1. Generate prompt hash for scoping
      const hash = await generatePromptHash(systemPrompt);
      setPromptHash(hash);

      const spec = extractSpecFromPrompt(systemPrompt);

      const lintIssues = lintSpec(spec, systemPrompt);
      setSpecLintIssues(lintIssues);

      if (lintIssues.length > 0) {
        const errors = lintIssues.filter(i => i.severity === 'error');
        if (errors.length > 0) {
          console.warn(`⚠️ Spec has ${errors.length} error(s):`, errors.map(e => e.message));
          toast(
            <div>
              <p className="font-semibold text-sm">⚠️ Spec Validation Issues</p>
              <p className="text-xs mt-1">{errors.length} error(s) found. Click "View Issues" to see details.</p>
            </div>,
            { duration: 5000, className: 'warn' }
          );
        }
      } else {
        console.log('✅ Spec validation passed - no lint issues');
      }
      
      // 4. Generate scope ID
      const newScopeId = scopeId({
        locationId: locationId,
        agentId: selectedAgent.id,
        promptHash: hash,
      });
      setCurrentScopeId(newScopeId);

      const savedAt = new Date().toISOString();

      updateVoiceAgent(selectedAgent.id, {
        systemPrompt,
        specLock: {
          promptHash: hash,
          storedSpec: spec,
          savedAt,
        },
      } as Partial<VoiceAgent>);

      useStore.getState().saveSpecLock(selectedAgent.id, {
        promptHash: hash,
        storedSpec: spec,
        savedAt,
      });

      const validation = useStore.getState().validateSpecLock(selectedAgent.id, hash, spec);
      setSpecValidation(validation);
      
      console.log(`💾 System Prompt saved for agent: ${selectedAgent.name}`);
      console.log(`   • Prompt Hash: ${hash}`);
      console.log(`   • Scope ID: ${newScopeId}`);
      console.log(`   • Spec: ${spec ? `${spec.niche} (${spec.agent_type})` : 'No spec found'}`);
      
      toast.success(`System Prompt saved! Self-healing enabled ✅`);
      toast(`Scope ID: ${newScopeId.substring(0, 30)}...`, { icon: '🔐', duration: 3000 });
    } catch (error: any) {
      console.error('Failed to save system prompt:', error);
      toast.error('Failed to save system prompt');
    } finally {
      setPromptSaving(false);
    }
  };

  // Handle thumbs up feedback
  const handleThumbsUp = (messageIndex: number) => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageIndex]: prev[messageIndex] === 'up' ? null : 'up'
    }));
    
    const message = conversation[messageIndex];
    console.log(`👍 Positive feedback for message ${messageIndex}:`, message.text.substring(0, 50));
    
    // Add glow effect using new haptics
    const button = document.querySelector(`[data-thumbs-up="${messageIndex}"]`);
    if (button) {
      button.classList.add('glow-ok', 'live');
      setTimeout(() => button.classList.remove('live'), 600);
    }
    
    toast.success('Marked as good response!', { className: 'pulse' });
  };

  // Handle thumbs down feedback - opens edit interface
  const handleThumbsDown = (messageIndex: number) => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageIndex]: prev[messageIndex] === 'down' ? null : 'down'
    }));
    
    // Add glow effect for thumbs down
    const button = document.querySelector(`[data-thumbs-down="${messageIndex}"]`);
    if (button) {
      button.classList.add('glow-err', 'live');
      setTimeout(() => button.classList.remove('live'), 600);
    }
    
    // If thumbs down is active, open edit interface
    if (messageFeedback[messageIndex] !== 'down') {
      const message = conversation[messageIndex];
      setEditingMessageIndex(messageIndex);
      setEditedText(message.text);
      console.log(`👎 Negative feedback for message ${messageIndex} - opening edit interface`);
      toast('Edit the message to teach the agent the correct response', { icon: '📝', className: 'fadein' });
    }
  };

  return (
    <div className="bg-background text-foreground">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-8 lg:px-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold gradient-text">Training Hub</h1>
            <p className="text-sm text-muted-foreground">
              Craft prompts, knowledge, and Q&amp;A (Sandboxed – no GHL API calls)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleLocalSave} disabled={saving} loading={saving}>
              <Save className="w-4 h-4 mr-2" /> Save Local
            </Button>
            <Button variant="outline" onClick={handleGeneratePrompt} disabled={genLoading} loading={genLoading}>
              <Sparkles className="w-4 h-4 mr-2" /> Generate Prompt
            </Button>
            <Button variant="outline" onClick={handleSaveState} disabled={saving || !payload}>
              <Database className="w-4 h-4 mr-2" /> Save State
            </Button>
            <Button
              onClick={handleDeploy}
              disabled={syncing || !payload || (specValidation && specValidation.status !== 'ok')}
              loading={syncing}
              title={specValidation && specValidation.status !== 'ok' ? 'Resolve spec drift before deploying' : undefined}
            >
              <Upload className="w-4 h-4 mr-2" /> Deploy Agent
            </Button>
          </div>
        </header>

        <section className="rounded-2xl border border-border/60 bg-muted/10 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="flex min-w-[220px] flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Agent</span>
                <select
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    triggerHaptic('agent-switch');
                  }}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {voiceAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex min-w-[200px] flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Industry / Niche</span>
                <select
                  value={selectedNiche}
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="generic">Generic</option>
                  {availableNiches.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 font-medium text-foreground shadow-sm">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                {statusTokenSummary}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 font-medium text-foreground shadow-sm">
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
                {statusLatencySummary}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 font-medium text-foreground shadow-sm">
                <Database className="h-3.5 w-3.5 text-primary" />
                {statusCostSummary}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${gateStatusChipClass}`}>
                <Shield className="h-3.5 w-3.5" />
                {gateStatusLabel}
              </span>
              {gateConfidence != null && (
                <span className="text-[11px] text-muted-foreground">
                  Last confidence {gateConfidence}%
                </span>
              )}
              {gateStatusMeta && <span className="text-[11px] text-muted-foreground">{gateStatusMeta}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3 text-muted-foreground" />
              <span>Sandboxed mode · data stored locally</span>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-border/60 bg-background/95 p-6 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">System Prompt</label>
              <div className="flex items-center gap-2">
                <div className={`text-xs px-2 py-1 rounded ${estimateTokens(systemPrompt) > 1000 ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold' : 'text-muted-foreground'}`}>
                  ~{estimateTokens(systemPrompt)} tokens
                  {estimateTokens(systemPrompt) > 1000 && ' ⚠️ High'}
                </div>
              <Button 
                size="sm" 
                onClick={handleSaveSystemPrompt} 
                disabled={promptSaving || !selectedAgent}
                loading={promptSaving}
                className="btn-primary tap hover-raise"
              >
                <Save className="w-3 h-3 mr-1" />
                Save Prompt
              </Button>
              </div>
            </div>
            <textarea 
              value={systemPrompt} 
              onChange={(e) => setSystemPrompt(e.target.value)} 
              className="w-full px-3 py-2 border border-border rounded-md bg-input h-32 transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary" 
              placeholder="Write the master system prompt..." 
            />
            
            {/* Spec Status & Drift Guard */}
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {specValidation?.status === 'ok' ? (
                  <div className="chip ok glow-soft" title={specValidation.message}>
                    ✅ Spec Locked & Verified
                  </div>
                ) : specValidation?.status === 'missing_lock' ? (
                  <div className="chip err pulse" title={specValidation?.message}>
                    ⚠️ Spec Not Locked
                  </div>
                ) : specValidation?.status === 'hash_mismatch' ? (
                  <div className="chip warn pulse" title={specValidation?.message}>
                    ⚠️ Prompt Hash Drift
                  </div>
                ) : specValidation?.status === 'spec_mismatch' ? (
                  <div className="chip warn pulse" title={specValidation?.message}>
                    ⚠️ Spec JSON Drift
                  </div>
                ) : (
                  <div className="chip info fadein">Spec status pending…</div>
                )}

                {specValidation?.diff?.changedFields && specValidation.diff.changedFields.length > 0 && (
                  <div className="chip warn fadein" title="Spec fields out of sync">
                    Δ {specValidation.diff.changedFields.join(', ')}
                  </div>
                )}

                {specLintIssues.length > 0 && (
                  <button
                    onClick={() => setShowSpecLinter(!showSpecLinter)}
                    className="chip tap text-xs"
                    title="View spec validation issues"
                  >
                    {specLintIssues.some(i => i.severity === 'error') ? '❌' : '⚠️'} {specLintIssues.length} issue{specLintIssues.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>

              {specValidation && specValidation.status !== 'ok' && (
                <div className="spec-alert fadein">
                  <p className="font-medium">{specValidation.message}</p>
                  {specValidation.diff?.changedFields && (
                    <p className="text-xs text-amber-300">
                      Changed fields: {specValidation.diff.changedFields.join(', ')}
                    </p>
                  )}
                  {specValidation.diff?.missingKeys && (
                    <p className="text-xs text-amber-300">
                      Missing keys: {specValidation.diff.missingKeys.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {showSpecLinter && (
                <div className="spec-lint-panel fadein">
                  {specLintIssues.length > 0 ? (
                    <pre className="text-[11px] whitespace-pre-wrap">{formatLintIssues(specLintIssues)}</pre>
                  ) : (
                    <span className="text-xs text-emerald-300">No lint issues detected.</span>
                  )}
                </div>
              )}

              <div className="border-t border-border/40 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <History className="w-4 h-4" /> Spec Activity Timeline
                  </span>
                  {agentSpecHistory.length > 5 && (
                    <button
                      className="tap text-xs text-primary"
                      onClick={() => setTimelineExpanded((prev) => !prev)}
                    >
                      {timelineExpanded ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </div>
                <ul className="spec-timeline space-y-2">
                  {evaluationActivity && (
                    <li key={evaluationActivity.id} className="spec-timeline__item">
                      <span className="timeline-dot success" />
                      <div>
                        <p className="text-sm font-medium">{evaluationActivity.summary}</p>
                        <p className="text-xs text-muted-foreground">{formatRelative(evaluationActivity.savedAt)}</p>
                      </div>
                    </li>
                  )}
                  {agentSpecHistory.length === 0 ? (
                    <li className="spec-timeline__empty text-xs text-muted-foreground">
                      No spec saves yet.
                    </li>
                  ) : (
                    agentSpecHistory.map((entry) => (
                      <li key={entry.id} className="spec-timeline__item">
                        <span className="timeline-dot" />
                        <div>
                          <p className="text-sm font-medium">{entry.summary}</p>
                          <p className="text-xs text-muted-foreground">{formatRelative(entry.savedAt)}</p>
                        </div>
                        <span className="timeline-hash">#{entry.promptHash.slice(0, 6)}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-4 border-t border-border/40 pt-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Award className="w-4 h-4 text-primary" /> Golden Dataset
                  {goldenSamples.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {goldenSamples.length} sample{goldenSamples.length === 1 ? '' : 's'}
                    </span>
                  )}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={showGoldModal ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (!selectedAgentId) {
                        toast.error('Select an agent first');
                        return;
                      }
                      setShowGoldModal((prev) => !prev);
                    }}
                    disabled={!selectedAgentId}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save Sample
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReplayGoldenDataset}
                    disabled={replayRunning || goldenSamples.length === 0}
                    loading={replayRunning}
                    title={goldenSamples.length === 0 ? 'Add golden samples first' : undefined}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Replay All
                  </Button>
                </div>
              </div>

              {showGoldModal && (
                <div className="rounded-lg border border-border/40 bg-background/70 p-3 space-y-2 animate-fade-in">
                  <input
                    value={goldTitle}
                    onChange={(e) => setGoldTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm"
                    placeholder="Sample title (e.g., Perfect qualification call)"
                  />
                  <textarea
                    value={goldNotes}
                    onChange={(e) => setGoldNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm h-20"
                    placeholder="Optional notes about why this transcript is golden..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowGoldModal(false);
                        setGoldTitle('');
                        setGoldNotes('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveGoldenSample}
                      disabled={!latestSession || conversation.length === 0}
                    >
                      Save to Dataset
                    </Button>
                  </div>
                </div>
              )}

              {goldenSamples.length === 0 ? (
                <div className="text-xs text-muted-foreground border border-dashed border-border/50 rounded-md p-3">
                  No golden samples yet. Capture exemplary transcripts to build a regression harness before publishing.
                </div>
              ) : (
                <ul className="space-y-2">
                  {goldenSamples.map((sample) => (
                    <li
                      key={sample.id}
                      className="rounded-md border border-border/40 bg-muted/20 p-2 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{sample.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelative(sample.createdAt)} • Confidence {sample.expected.confidence}%
                          </p>
                        </div>
                        <button
                          className="tap text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                          onClick={() => handleDeleteGoldenSample(sample.id)}
                          title="Remove sample"
                        >
                          <X className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                      {sample.notes && (
                        <p className="text-xs text-muted-foreground/80">{sample.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {replayResults && (
                <div className="rounded-md border border-border/40 bg-background/80 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Last replay {replayFetchedAt ? formatRelative(replayFetchedAt) : 'just now'}
                    </span>
                    <span>
                      {replayResults.filter((r) => r.deltas.confidence >= 0 && r.deltas.missingFields.length === 0).length}/{replayResults.length} passing
                    </span>
                  </div>
                  <div className="space-y-2">
                    {replayResults.map((result) => {
                      const isPass = result.deltas.confidence >= 0 && result.deltas.missingFields.length === 0 && result.deltas.degradedRubrics.length === 0;
                      const isWarn = result.deltas.confidence >= 0 && (result.deltas.missingFields.length > 0 || result.deltas.degradedRubrics.length > 0);
                      const isFail = result.deltas.confidence < 0;
                      
                      return (
                        <div
                          key={result.sample.id}
                          className="flex flex-col gap-1 rounded border border-border/40 p-2 text-xs bg-muted/10"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">{result.sample.title}</span>
                            <span
                              className={`chip ${
                                isPass
                                  ? 'ok'
                                  : isWarn
                                  ? 'warn'
                                  : 'err'
                              }`}
                            >
                              {isPass
                                ? 'Pass'
                                : isWarn
                                ? 'Warn'
                                : 'Fail'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                            <span>
                              Δ {result.deltas.confidence >= 0 ? '+' : ''}
                              {result.deltas.confidence}%
                            </span>
                            {result.deltas.missingFields.length > 0 && (
                              <span className="text-amber-500">
                                Missing: {result.deltas.missingFields.join(', ')}
                              </span>
                            )}
                            {result.deltas.degradedRubrics.length > 0 && (
                              <span className="text-amber-500">
                                Rubric drift:{' '}
                                {result.deltas.degradedRubrics.join(', ')}
                              </span>
                            )}
                          </div>
                          {result.evaluation.collectedFields.some((f: any) => !result.sample.expected.collectedFields.some((ef: any) => ef.key === f.key)) && (
                            <span className="text-emerald-500">
                              New: {result.evaluation.collectedFields.filter((f: any) => !result.sample.expected.collectedFields.some((ef: any) => ef.key === f.key)).map((f: any) => f.key).join(', ')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {estimateTokens(systemPrompt) > 1000 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 animate-fade-in">
                <AlertTriangle className="w-3 h-3" />
                Large prompt detected. Consider using "Compose Prompt" for compact 200-300 token prompts.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Knowledge Base (one per line)</label>
            <textarea value={knowledge} onChange={(e) => setKnowledge(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input h-32" placeholder="Policies, products, FAQs..." />
          </div>

          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="w-4 h-4" />
            <span>Supports GHL Voice AI Custom Actions via webhook URLs</span>
          </div>
        </div>

      <div className="rounded-2xl border border-border/60 bg-background/95 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <h2 className="font-semibold">Q&A Pairs</h2>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setQna([...qna, { q: '', a: '' }])}>
            <Sparkles className="w-4 h-4 mr-1" /> Add Row
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {qna.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2">
              <input value={row.q} onChange={(e) => setQna(qna.map((r, i) => i === idx ? { ...r, q: e.target.value } : r))} className="px-3 py-2 border border-border rounded-md bg-input" placeholder="Question" />
              <input value={row.a} onChange={(e) => setQna(qna.map((r, i) => i === idx ? { ...r, a: e.target.value } : r))} className="px-3 py-2 border border-border rounded-md bg-input" placeholder="Answer" />
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Composer Preview */}
      {showPreview && composedPrompt && (
        <div className="mt-6 card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Composed Prompt Preview</h2>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>

          <div className="space-y-4">
            {/* KB Stubs */}
            {composedPrompt.kb_stubs && composedPrompt.kb_stubs.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Knowledge Base Stubs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {composedPrompt.kb_stubs.map((stub: any, idx: number) => (
                    <div key={idx} className="p-3 rounded border border-border bg-muted/30">
                      <div className="font-medium text-sm mb-1">{stub.title}</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {stub.outline.map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Actions */}
            {composedPrompt.custom_actions && composedPrompt.custom_actions.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Custom Actions
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {composedPrompt.custom_actions.map((action: any, idx: number) => (
                    <div key={idx} className="p-3 rounded border border-border bg-muted/30 text-xs">
                      <div className="font-medium">{action.name}</div>
                      <div className="text-muted-foreground">{action.description}</div>
                      <div className="text-muted-foreground mt-1">Endpoint: {action.endpoint}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eval Rubric */}
            {composedPrompt.eval_rubric && composedPrompt.eval_rubric.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Evaluation Rubric
                </h3>
                <div className="p-3 rounded border border-border bg-muted/30">
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {composedPrompt.eval_rubric.map((item: string, idx: number) => (
                      <li key={idx}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Master AI Insights */}
      <div className="mt-6 fadein">
        <MasterAIInsights 
          sessions={sessions} 
          currentSession={latestSession ?? undefined}
          activeSpec={activeSpec ?? undefined}
          onUpdate={(updated) => {
            console.log(`🔄 Updating session ${updated.conversationId} with ${updated.correctionsApplied} corrections`);
            setLatestSession(updated);
            setSessions(prev => prev.map(s => s.conversationId === updated.conversationId ? updated : s));
          }}
        />
      </div>

      {/* Inline Testing Panel */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          {/* Master AI Controls */}
          <div className="p-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/10 dark:to-blue-900/10 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-5 h-5 ${enableMasterAI ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                <span className="font-semibold text-foreground">Master AI Orchestration</span>
                {enableMasterAI && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                    ACTIVE
                  </span>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableMasterAI}
                  onChange={(e) => setEnableMasterAI(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-foreground">Enable</span>
              </label>
            </div>
            
            {enableMasterAI && (
              <div className="space-y-2 pl-7 animate-fade-in">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePreTurnGuidance}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setEnablePreTurnGuidance(next);
                      if (next) triggerHaptic('guidance-expand');
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-muted-foreground">Pre-Turn Guidance</span>
                  <span className="text-xs text-muted-foreground italic">(shows recommended responses)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableQualityGates}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setEnableQualityGates(next);
                      if (next) triggerHaptic('gate-flip');
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-muted-foreground">Quality Gates</span>
                  <span className="text-xs text-muted-foreground italic">(blocks/fixes low-quality responses)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showObservability}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setShowObservability(next);
                      if (next) triggerHaptic('observability-expand');
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-muted-foreground">Show Observability</span>
                  <span className="text-xs text-muted-foreground italic">(audit logs, tokens, costs)</span>
                </label>
              </div>
            )}
          </div>

          {/* Pre-Turn Guidance Panel */}
          {enableMasterAI && enablePreTurnGuidance && masterAI.guidance && (
            expandedSections.preTurnGuidance ? (
              <PreTurnGuidance
                guidance={masterAI.guidance}
                onUseResponse={(response) => {
                  void handleApplyAgentResponse(response);
                  // Auto-hide guidance after using suggested response
                  setExpandedSections(prev => ({ ...prev, preTurnGuidance: false }));
                }}
              />
            ) : (
              <div
                className="mb-4 p-3 border border-primary/30 rounded-lg bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all"
                onClick={() => toggleSection('preTurnGuidance')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Master AI Guidance Available</span>
                    <span className="text-xs text-muted-foreground">
                      (Confidence: {masterAI.guidance.confidence}%)
                    </span>
                  </div>
                  <span className="text-xs text-primary">Click to expand</span>
                </div>
              </div>
            )
          )}

          {/* Runtime Attestation & Controls */}
          <div className="p-4 rounded-2xl border border-border bg-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Runtime Context</p>
                <p className="text-sm font-semibold text-foreground">
                  {runtimeAttestation ? runtimeAttestation.scopeId : 'No sandbox run yet'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!effectivePrompt) return;
                    navigator.clipboard.writeText(effectivePrompt);
                    toast.success('Effective prompt copied');
                  }}
                  disabled={!effectivePrompt}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Effective Prompt
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLearnedSnippets}
                  onChange={(e) => setUseLearnedSnippets(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-foreground">Use Learned Snippets</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Prompt Hash</span>
                <select
                  value={snippetScopeHashOverride}
                  onChange={(e) => setSnippetScopeHashOverride(e.target.value)}
                  className="px-2 py-1 rounded border border-border bg-input text-sm"
                >
                  <option value="">{promptHash ? `Current (${promptHash})` : 'Current draft'}</option>
                  {agentSpecHistory.map((entry) => (
                    <option key={entry.id} value={entry.promptHash}>
                      {entry.promptHash} • {formatRelative(entry.savedAt)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {runtimeAttestation ? (
              <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    Scope:&nbsp;
                    <span className="text-foreground">{runtimeAttestation.scopeId}</span>
                  </div>
                  <div>
                    Snippet Scope:&nbsp;
                    <span className="text-foreground">
                      {runtimeAttestation.snippetScopeId || runtimeAttestation.scopeId}
                    </span>
                  </div>
                  <div>
                    Prompt Hash:&nbsp;
                    <span className="text-foreground">{runtimeAttestation.promptHash}</span>
                  </div>
                  <div>
                    Spec Hash:&nbsp;
                    <span className="text-foreground">{runtimeAttestation.specHash}</span>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    Prompt Tokens:&nbsp;
                    <span className="text-foreground">
                      {runtimeAttestation.tokenBudget.systemPrompt + runtimeAttestation.tokenBudget.spec}
                    </span>
                  </div>
                  <div>
                    Learned Tokens:&nbsp;
                    <span className="text-foreground">{runtimeAttestation.tokenBudget.snippets}</span>
                  </div>
                  <div>
                    Diagnostics:&nbsp;
                    <span className="text-foreground">{runtimeAttestation.diagnostics.length}</span>
                  </div>
                  <div>
                    Snippets Applied:&nbsp;
                    <span className="text-foreground">{runtimeAttestation.snippetsApplied.length}</span>
                  </div>
                </div>

                {lastGuardEvent && (
                  <div>
                    Guard:&nbsp;
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                        lastGuardEvent.status === 'blocked'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                          : lastGuardEvent.status === 'modified'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                      }`}
                    >
                      {lastGuardEvent.status.toUpperCase()}
                      {lastGuardEvent.message && <span className="text-[11px]">{lastGuardEvent.message}</span>}
                    </span>
                  </div>
                )}

                {runtimeAttestation.snippetsApplied.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Applied Snippets</p>
                    <ul className="mt-1 space-y-1">
                      {runtimeAttestation.snippetsApplied.map((snippet) => (
                        <li
                          key={snippet.id}
                          className="rounded bg-muted/40 px-2 py-1 text-foreground"
                        >
                          <span className="font-medium">Q:</span> {snippet.trigger}{' '}
                          <span className="font-medium">→</span> {snippet.content}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Run the sandbox simulator to generate an attestation receipt.
              </p>
            )}
          </div>

          {/* Observability Dashboard */}
          {enableMasterAI && showObservability && masterAI.observabilityEvents.length > 0 && observabilitySummary && (
            <ObservabilityDashboard
              events={masterAI.observabilityEvents}
              summary={observabilitySummary}
            />
          )}

          {/* Confidence Gate Warning */}
          {masterAI.confidenceGateActive && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 shadow-sm animate-pulse">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-300">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Confidence Gate Active</span>
              </div>
              <p className="mt-1 text-sm text-red-600/90 dark:text-red-300">
                Agent performance is below the configured threshold. Review the latest interactions or override to continue testing.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  masterAI.clearConfidenceGate();
                  triggerHaptic('confidence-cleared');
                }}
                className="mt-3 border-red-500/40 text-red-600 hover:bg-red-500/10"
              >
                Clear Gate (Sandbox Only)
              </Button>
            </div>
          )}

          <div className={`p-3 rounded-2xl border ${gateCardClasses} transition-colors`}>
            {selectedAgentId ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      {gateSnapshot?.isGated ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Confidence gate active</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Confidence gate clear</span>
                        </>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Mode: {gateModeLabel}
                    </span>
                    {gateSnapshot?.lastConfidence != null && (
                      <span className="text-xs text-muted-foreground">
                        Last confidence: {gateSnapshot.lastConfidence}%
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Threshold: {gateSnapshot?.confidenceThreshold ?? '--'}%
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ignoreConfidenceGate}
                        onChange={(e) => setIgnoreConfidenceGate(e.target.checked)}
                        className="rounded"
                      />
                      <span>Bypass for sandbox</span>
                    </label>
                    {gateSnapshot?.isGated && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!selectedAgentId) return;
                          clearAgentGate(selectedAgentId);
                          triggerHaptic('confidence-cleared');
                          toast.success('Confidence gate reset for testing');
                        }}
                      >
                        Reset Gate
                      </Button>
                    )}
                  </div>
                </div>
                {(gateSnapshot?.gateReason || gateResumeAt) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <Layers className="w-3 h-3" />
                    <span>
                      {gateSnapshot?.gateReason || 'No active gate reason'}
                      {gateResumeAt ? ` • auto-resumes ${gateResumeAt}` : ''}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                Select an agent to view confidence gate status.
              </span>
            )}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold">Call Simulator</h2>
              <p className="text-xs text-muted-foreground">Testing agent call responses via text (pre-deployment)</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Evaluation Toggle */}
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showEvaluation} 
                  onChange={(e) => setShowEvaluation(e.target.checked)}
                  className="rounded"
                />
                <span>Show Score</span>
              </label>

              <select
                value={evaluationMode}
                onChange={(e) => setEvaluationMode(e.target.value as 'perMessage' | 'postCall')}
                className="text-xs px-2 py-1 border border-border rounded bg-input"
              >
                <option value="postCall">Post-call</option>
                <option value="perMessage">Per-message</option>
              </select>
              
              {/* Reset Button */}
              {conversation.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetConversation}
                  className="btn-ghost tap text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry
                </Button>
              )}
            </div>
          </div>

          {/* Conversation Display */}
          {conversation.length > 0 ? (
            <div className="mb-3 space-y-2 max-h-64 overflow-y-auto p-3 bg-muted/30 rounded">
              {conversation.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'caller' ? 'justify-start' : 'justify-end'}`}
                >
                  {editingMessageIndex === idx ? (
                    // Edit Mode
                    <div className="w-full space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-primary fadein">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Editing {msg.role === 'caller' ? 'Caller' : 'Agent'} Message
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                            title="Save"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                      
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm min-h-[60px]"
                        placeholder="Edit message..."
                        autoFocus
                      />
                      
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          Context for Master Agent (optional)
                        </label>
                        <textarea
                          value={masterAgentContext}
                          onChange={(e) => setMasterAgentContext(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm min-h-[40px]"
                          placeholder="Why was this changed? What should the agent learn from this?"
                        />
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        💡 Tip: The context helps the master agent understand why this change improves the response
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="relative group">
                      <div 
                        className={`max-w-[80%] px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          msg.role === 'caller'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs opacity-60">
                            {msg.role === 'caller' ? 'Caller' : 'Agent'}
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Feedback buttons - only for agent messages */}
                            {msg.role === 'agent' && (
                              <>
                                <button
                                  onClick={() => handleThumbsUp(idx)}
                                  data-thumbs-up={idx}
                                  className={`tap transition-all duration-200 p-1 rounded ${
                                    messageFeedback[idx] === 'up'
                                      ? 'bg-green-500 text-white scale-110'
                                      : 'opacity-0 group-hover:opacity-100 hover:bg-green-100 dark:hover:bg-green-900/50'
                                  }`}
                                  title="Good response"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleThumbsDown(idx)}
                                  data-thumbs-down={idx}
                                  className={`tap transition-all duration-200 p-1 rounded ${
                                    messageFeedback[idx] === 'down'
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
                              onClick={() => handleStartEdit(idx)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 dark:hover:bg-black/30 rounded"
                              title="Edit message"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        {msg.text}
                      </div>
                      
                      {/* Master AI Turn Analysis - Only for agent messages */}
                      {msg.role === 'agent' && turnAnalyses[msg.id] && (
                        <div className="mt-2 ml-4">
                          <TurnAnalysisNote 
                            analysis={turnAnalyses[msg.id]} 
                            collapsed={true}
                          />
                        </div>
                      )}
                      
                      {/* Loading indicator while analyzing */}
                      {msg.role === 'agent' && analyzingTurn && idx === conversation.length - 1 && !turnAnalyses[msg.id] && (
                        <div className="mt-2 ml-4 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-muted-foreground animate-pulse">
                          🤖 Master AI analyzing...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-3 p-6 bg-muted/30 rounded text-center text-muted-foreground text-sm">
              Start a conversation by typing a message below
            </div>
          )}

          {/* Evaluation Card */}
          {showEvaluation && currentEvaluation && (
            <div className="mb-3 p-3 rounded border border-border bg-muted/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Evaluation Score</span>
                <span className="text-lg font-bold">{currentEvaluation.confidenceScore ? Math.round(currentEvaluation.confidenceScore * 100) : '--'}/100</span>
              </div>
              {currentEvaluation.rubricScores && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(currentEvaluation.rubricScores).map(([key, value]: [string, any]) => {
                    const numeric = typeof value === 'number' ? value : null;
                    const badgeClass =
                      numeric === null
                        ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300'
                        : numeric >= 4
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : numeric >= 2
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                    const glyph =
                      numeric === null ? 'ℹ️' : numeric >= 4 ? '✅' : numeric >= 2 ? '⚠️' : '❌';

                    return (
                      <span key={key} className={`text-xs px-2 py-1 rounded ${badgeClass}`}>
                        {glyph} {key.replace(/([A-Z])/g, ' $1').trim()} {numeric === null ? '(N/A)' : numeric.toFixed(1)}
                      </span>
                    );
                  })}
                </div>
              )}
              
              {/* Contact Fields Collected Summary */}
              {currentEvaluation.collectedFields && currentEvaluation.collectedFields.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Contact Fields</span>
                    <span className="text-xs font-semibold text-foreground">
                      {currentEvaluation.collectedFields.filter((f: any) => f.collected).length} of {currentEvaluation.collectedFields.length} collected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentEvaluation.collectedFields.map((field: any, idx: number) => (
                      <span 
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded ${
                          field.collected 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400'
                        }`}
                        title={field.value || 'Not collected'}
                      >
                        {field.collected ? '✓' : '○'} {field.label}{field.value ? ': ' + field.value : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {evaluationLoading ? 'Refreshing score...' : 'Click for detailed rubric & checklist'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScorecardOpen(true)}
                >
                  View Details
                </Button>
              </div>
            </div>
          )}

          {/* Post-call Review */}
          {showEvaluation &&
            evaluationMode === 'postCall' &&
            (callReviewLoading || callReview || callReviewError) && (
              <div className="mb-3 rounded border border-border bg-muted/10 p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Post-call Review
                      </span>
                      {callReview && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            callReview.approved
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                          }`}
                        >
                          {callReview.approved ? 'Approved' : 'Needs attention'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {callReview?.summary ||
                        (callReviewLoading
                          ? 'Running transcript review…'
                          : 'Run a call to generate a transcript review.')}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground min-w-[80px]">
                    {callReviewLoading && (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Reviewing…
                      </span>
                    )}
                    {callReview && !callReviewLoading && (
                      <>
                        <span className="block text-lg font-bold text-foreground">
                          {Math.round(callReview.score)}
                          <span className="text-xs text-muted-foreground">/100</span>
                        </span>
                        <span className="block text-[10px] tracking-wide">
                          Confidence {Math.round(callReview.confidenceScore)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {callReviewError && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{callReviewError}</span>
                  </div>
                )}

                {callReview && (
                  <div className="space-y-3 mt-2">
                    {callReview.keyMoments.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Key Moments
                        </span>
                        <ul className="mt-1 space-y-1">
                          {callReview.keyMoments.slice(0, 3).map((moment, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-foreground"
                            >
                              <History className="mt-0.5 h-3 w-3 text-primary" />
                              <span>{moment}</span>
                            </li>
                          ))}
                        </ul>
                        {callReview.keyMoments.length > 3 && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            +{callReview.keyMoments.length - 3} more moments captured
                          </p>
                        )}
                      </div>
                    )}

                    {callReview.issues.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Issues
                        </span>
                        <ul className="mt-1 space-y-1">
                          {callReview.issues.slice(0, 4).map((issue, idx) => (
                            <li
                              key={`${issue}-${idx}`}
                              className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300"
                            >
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {callReview.suggestions.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Suggestions
                        </span>
                        <ul className="mt-1 space-y-1">
                          {callReview.suggestions.slice(0, 4).map((suggestion, idx) => (
                            <li
                              key={`${suggestion}-${idx}`}
                              className="flex items-start gap-2 text-xs text-foreground"
                            >
                              <ThumbsUp className="mt-0.5 h-3 w-3 text-emerald-500 dark:text-emerald-300" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {callReview.blockedReasons.length > 0 && (
                      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          <Shield className="h-3 w-3" />
                          Gate Reasons
                        </div>
                        <ul className="mt-1 space-y-1 text-xs text-amber-700 dark:text-amber-200">
                          {callReview.blockedReasons.map((reason, idx) => (
                            <li key={`${reason}-${idx}`}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {callReview.handoffRecommended && (
                      <div className="flex items-center gap-2 rounded border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-700 dark:text-sky-300">
                        <Link2 className="h-3 w-3" />
                        Escalation recommended for this call.
                      </div>
                    )}

                    {callReview.suggestedTranscript && (
                      <details className="rounded border border-border/40 bg-muted/30 px-3 py-2 text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          Suggested transcript fix
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap text-foreground">
                          {callReview.suggestedTranscript}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Quality Gate Review */}
          {enableMasterAI && enableQualityGates && masterAI.qualityReview && !masterAI.qualityReview.approved && latestAgentTurn && (
            <div className="mb-4 rounded-lg border border-orange-500/50 bg-background/95 shadow-sm overflow-hidden transition-all duration-200">
              {/* ALWAYS: Minimal alert */}
              <div className="bg-orange-50 dark:bg-orange-950/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900 dark:text-orange-200">
                    Response {masterAI.qualityReview.score < 50 ? 'blocked' : 'needs review'} — Score: {masterAI.qualityReview.score}/100
                  </span>
                </div>
                <button
                  onClick={() => toggleSection('qualityGate')}
                  className="text-xs font-medium text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 transition-colors px-3 py-1 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30"
                >
                  {expandedSections.qualityGate ? 'Hide Details' : 'View Details'}
                </button>
              </div>

              {/* EXPANDABLE: Full review details */}
              {expandedSections.qualityGate && (
                <div className="p-4 border-t border-orange-200/50 dark:border-orange-800/50">
                  <QualityGate
                    review={masterAI.qualityReview}
                    originalResponse={latestAgentTurn?.text || ''}
                    onUseSuggestion={() => {
                      if (masterAI.qualityReview?.suggestedResponse) {
                        void handleApplyAgentResponse(masterAI.qualityReview.suggestedResponse);
                        // Auto-dismiss quality gate after using suggestion
                        setExpandedSections(prev => ({ ...prev, qualityGate: false }));
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Guidance/Gate Mismatch Banner */}
          {guidanceMismatch && (
            <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                    ⚠️ Spec Drift Detected
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                    Pre-Turn Guidance recommended a response that Quality Gate blocked. Check console for diagnostic logs including system prompt hash verification.
                  </p>
                  <div className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                    <p><strong>Recommended Action:</strong> Review the blocked reasons in the Quality Gate above. Check browser console for hash mismatch errors.</p>
                    <p><strong>Common Causes:</strong> System prompt changed between calls (hash mismatch), different temperature settings (Guidance: 0.3, Review: 0.2), or ambiguous prompt wording.</p>
                    <p><strong>Diagnostics:</strong> Open browser console and look for "✅ System prompt hash verified" (good) or "❌ CRITICAL: System prompt changed" (bad).</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !syncing && handleDryRun()}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm"
                placeholder="Type your message..."
                disabled={syncing}
              />
              <div className="text-xs text-muted-foreground mt-1">
                ~{estimateTokens(testMessage)} tokens
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={handleDryRun} 
              disabled={!selectedAgent || !testMessage.trim() || syncing} 
              loading={syncing}
              className="btn-primary tap hover-raise"
            >
              Send
            </Button>
          </div>

          {/* Action Buttons */}
          {conversation.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                onClick={handleEvaluateNow}
                disabled={!canEvaluateNow || evaluationMode !== 'postCall'}
                className="flex-1 btn-primary tap hover-raise"
                data-testid="evaluate-now"
              >
                ⚡ Evaluate Now
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleEndCall}
                disabled={conversation.length === 0}
                className="flex-1 btn-primary tap hover-raise"
                data-testid="end-call"
              >
                📞 End Call
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyTranscript}
                className="flex-1 btn-ghost tap"
              >
                📋 Copy Transcript
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveForTraining}
                disabled={saving}
                loading={saving}
                className="flex-1 btn-primary tap hover-raise"
              >
                💾 Save for Training
              </Button>
            </div>
          )}

          {/* Message Counter & Token Usage */}
          {conversation.length > 0 && tokenStats && (
            <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 fadein">
              <div className="flex justify-center items-center gap-4 text-xs">
                <span className="text-muted-foreground">
                  {conversation.length} message{conversation.length !== 1 ? 's' : ''}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-foreground font-medium" title={`Conversation: ${tokenStats.conversationTokens} | Prompt: ${tokenStats.promptTokens} | Learned: ${tokenStats.learnedTokens}`}>
                  📊 ~{tokenStats.totalTokens.toLocaleString()} tokens
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-foreground font-medium" title="Estimated cost for gpt-4o-mini">
                  💰 ${tokenStats.costEstimate.toFixed(6)}
                </span>
                {tokenStats.totalTokens > 800 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium token-pulse">
                      ⚠️ High token usage
                    </span>
                  </>
                )}
              </div>
              <div className="mt-1 text-[10px] text-center text-muted-foreground">
                Breakdown: Prompt {tokenStats.promptTokens}t | Conversation {tokenStats.conversationTokens}t | Learned {tokenStats.learnedTokens}t
              </div>
            </div>
          )}

          {showEvaluation &&
            evaluationMode === 'postCall' &&
            conversation.length > 0 && (
              <div className="mt-3 rounded-lg border border-border/40 bg-background/95 shadow-sm overflow-hidden transition-all duration-200">
                {/* ALWAYS VISIBLE: Summary Strip */}
                <button
                  onClick={() => toggleSection('transcript')}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-foreground">Post-Call Transcript</h3>
                      <p className="text-xs text-muted-foreground">
                        {conversation.length} turns · {Object.keys(qualityReviewHistory).length} reviews
                        {(() => {
                          const reviews = Object.values(qualityReviewHistory);
                          if (reviews.length > 0) {
                            const avgConfidence = Math.round(
                              reviews.reduce((sum, r) => sum + r.review.confidenceScore, 0) / reviews.length
                            );
                            return ` · Avg confidence: ${avgConfidence}%`;
                          }
                          return '';
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAgentReviewData ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {Object.keys(qualityReviewHistory).length} reviews
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Pending
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        expandedSections.transcript ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* EXPANDABLE: Full transcript */}
                {expandedSections.transcript && (
                  <div className="border-t border-border/40 p-5 space-y-3 max-h-[600px] overflow-y-auto bg-muted/5">
                  {conversation.map((turn, index) => {
                    const isAgent = turn.role === 'agent';
                    const snapshot = isAgent ? qualityReviewHistory[turn.id] : null;
                    const statusConfig = snapshot
                      ? snapshot.review.approved
                        ? {
                            label: 'Approved',
                            className:
                              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
                          }
                        : {
                            label: 'Blocked',
                            className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
                          }
                      : {
                          label: 'Review pending',
                          className: 'bg-muted text-muted-foreground',
                        };

                    return (
                      <div
                        key={turn.id || `${turn.role}-${index}`}
                        className="rounded-lg border border-border/60 bg-muted/10 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              isAgent
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isAgent ? 'A' : 'C'}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {isAgent ? 'Agent' : 'Caller'}
                              </span>
                              {turn.edited && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                  Edited
                                </span>
                              )}
                            </div>
                            <div className="rounded-lg border border-border/40 bg-background/80 px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                              {turn.text}
                            </div>
                            {isAgent && (
                              snapshot ? (
                                <div className="rounded-lg border border-border/50 bg-background/95 p-3 text-xs shadow-inner space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="font-semibold text-foreground">Master AI Review</span>
                                    </div>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusConfig.className}`}
                                    >
                                      {statusConfig.label}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                                    <span>Score {snapshot.review.score}/100</span>
                                    <span>Confidence {snapshot.review.confidenceScore}/100</span>
                                    <span>
                                      Rules checked: {snapshot.review.observability?.rulesChecked?.length ?? 0}
                                    </span>
                                  </div>

                                  <div className="grid gap-2">
                                    <div>
                                      <span className="text-[11px] font-semibold text-muted-foreground">
                                        Original response
                                      </span>
                                      <div className="mt-1 rounded border border-border/40 bg-muted/20 px-3 py-2 text-foreground whitespace-pre-wrap">
                                        {snapshot.originalResponse}
                                      </div>
                                    </div>

                                    <div>
                                      <span className="text-[11px] font-semibold text-muted-foreground">
                                        Final sent to caller
                                      </span>
                                      <div className="mt-1 rounded border border-border/40 bg-muted/20 px-3 py-2 text-foreground whitespace-pre-wrap">
                                        {snapshot.finalResponse}
                                      </div>
                                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                        {snapshot.correctedManually && (
                                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                                            <Edit2 className="h-3 w-3" />
                                            Manually corrected
                                          </span>
                                        )}
                                        {!snapshot.correctedManually && snapshot.suggestionApplied && (
                                          <span className="inline-flex items-center gap-1 text-primary">
                                            <Sparkles className="h-3 w-3" />
                                            Master AI applied fix
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {snapshot.review.suggestedResponse &&
                                      snapshot.review.suggestedResponse !== snapshot.finalResponse && (
                                        <div>
                                          <span className="text-[11px] font-semibold text-muted-foreground">
                                            Suggested fix
                                          </span>
                                          <div className="mt-1 rounded border border-primary/30 bg-primary/10 px-3 py-2 text-foreground whitespace-pre-wrap">
                                            {snapshot.review.suggestedResponse}
                                          </div>
                                        </div>
                                      )}

                                    {snapshot.review.issues.length > 0 && (
                                      <div>
                                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                          Issues noted
                                        </span>
                                        <ul className="mt-1 space-y-1">
                                          {snapshot.review.issues.map((issue, idxIssue) => (
                                            <li
                                              key={`${turn.id}-issue-${idxIssue}`}
                                              className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-300"
                                            >
                                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                              <span>{issue}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {snapshot.review.suggestions.length > 0 && (
                                      <div>
                                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                          Coaching
                                        </span>
                                        <ul className="mt-1 space-y-1">
                                          {snapshot.review.suggestions.map((suggestion, idxSuggestion) => (
                                            <li
                                              key={`${turn.id}-suggestion-${idxSuggestion}`}
                                              className="flex items-start gap-2 text-xs text-foreground"
                                            >
                                              <ThumbsUp className="mt-0.5 h-3 w-3 text-emerald-500 dark:text-emerald-300" />
                                              <span>{suggestion}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {snapshot.review.blockedReasons.length > 0 && (
                                      <div className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                                        <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                                          <Shield className="h-3 w-3" />
                                          Blocked because
                                        </div>
                                        <ul className="mt-1 space-y-1 text-xs text-amber-800 dark:text-amber-200">
                                          {snapshot.review.blockedReasons.map((reason, idxReason) => (
                                            <li key={`${turn.id}-blocked-${idxReason}`}>{reason}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-lg border border-dashed border-border/60 bg-muted/5 px-3 py-2 text-[11px] text-muted-foreground">
                                  Master AI review not captured for this response.
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      <div className="mt-6 max-w-3xl rounded-2xl border border-border bg-background/95 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-sm">Health &amp; Connectivity</h2>
            <p className="text-xs text-muted-foreground">Run quick diagnostics on database + API availability.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHealthCheck}
            disabled={healthLoading}
            loading={healthLoading}
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Check Health
          </Button>
        </div>
        <pre className="text-xs bg-muted/30 p-3 rounded-lg overflow-auto max-h-40">
          {healthResult ? JSON.stringify(healthResult, null, 2) : 'No results yet.'}
        </pre>
      </div>

      <div className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
        <Link2 className="w-3 h-3" />
        <span>Sandbox Mode: All prompts and data are stored locally. No external API calls to GHL.</span>
      </div>

      <EvaluationScorecard
        evaluation={currentEvaluation}
        isOpen={Boolean(scorecardOpen && currentEvaluation)}
        onClose={() => setScorecardOpen(false)}
        conversation={legacyConversation}
        agentId={selectedAgent?.id || null}
        promptId={evaluationContext?.promptId || null}
        reviewId={evaluationContext?.reviewId || null}
        callLogId={evaluationContext?.callLogId || null}
        onSaveCorrection={handleSaveCorrection}
        savingCorrection={savingCorrection}
        correctionConfirmation={correctionConfirmation}
      />
      </main>
    </div>
  );
};

export default TrainingHub;
