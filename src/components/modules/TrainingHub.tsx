import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { BookOpen, Save, Upload, RefreshCw, Database, Sparkles, CheckCircle, Link2, Copy, Edit2, X, Check, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';
import { useMCP } from '../../hooks/useMCP';
import Button from '../../components/ui/Button';
import { getApiBaseUrl } from '../../utils/apiBase';
import EvaluationScorecard from './EvaluationScorecard';
import MasterAIInsights from './MasterAIInsights';
import { ConversationTurn as LegacyConversationTurn, ManualCorrectionPayload } from '../../types/evaluation';
import {
  SessionEvaluation,
  ConversationTurn as SessionConversationTurn,
} from '../../lib/evaluation/types';
import { 
  evaluateAfterCall, 
  evaluateAfterCallWithSpec, 
  applyManualFix, 
  estimateTokens, 
  scopeId, 
  generatePromptHash 
} from '../../lib/prompt/masterOrchestrator';
import { 
  loadSessions, 
  saveSession, 
  applyManualCorrections,
  saveScopedSession,
  loadScopedSessions,
  applyScopedCorrections,
  getScopedLearnedSnippets
} from '../../lib/evaluation/masterStore';
import { getRelevantLearned, formatLearnedForPrompt, getAgentKBStats } from '../../lib/evaluation/knowledgeBase';
import { extractSpecFromPrompt, embedSpecInPrompt, hasEmbeddedSpec } from '../../lib/spec/specExtract';
import { PromptSpec, DEFAULT_SPEC } from '../../lib/spec/specTypes';
import { buildRequestContext, getTokenStats, formatTurnsForAPI } from '../../lib/runtime/memory';
import { 
  validateAgentResponse, 
  autoCorrectResponse, 
  createCorrectionEntry,
  type Violation 
} from '../../lib/evaluation/autoCorrector';

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

const TrainingHub: React.FC = () => {
  const { voiceAgents, updateVoiceAgent } = useStore();
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

  // New composer state
  const [selectedNiche, setSelectedNiche] = useState<string>('generic');
  const [availableNiches, setAvailableNiches] = useState<Array<{ value: string; label: string }>>(fallbackNiches);
  const [composedPrompt, setComposedPrompt] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const mcp = useMCP();
  // Inline test panel state
  const [testMessage, setTestMessage] = useState<string>('Hello');
  const [testResult, setTestResult] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);

  // Conversation tracking
  const [conversationId, setConversationId] = useState(() => createConversationId());
  const [conversation, setConversation] = useState<SimulatorTurn[]>([]);
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

  const selectedAgent = useMemo(() => voiceAgents.find(a => a.id === selectedId), [voiceAgents, selectedId]);

  // Calculate real-time token usage stats
  const tokenStats = useMemo(() => {
    if (conversation.length === 0) return null;
    
    // Get learned snippets for token calculation
    let learnedSnippets = '';
    if (currentScopeId) {
      const snippets = getScopedLearnedSnippets(currentScopeId, 5);
      if (snippets.length > 0) {
        learnedSnippets = snippets.map(s => `${s.originalQuestion} → ${s.correctedResponse}`).join('\n');
      }
    }
    
    return getTokenStats(conversation, systemPrompt, learnedSnippets);
  }, [conversation, systemPrompt, currentScopeId]);

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
    return session;
  }, [conversation, conversationId, selectedAgent?.id, selectedNiche, currentScopeId, activeSpec]);

  const canEvaluateNow = useMemo(() => {
    const hasCaller = conversation.some((t) => t.role === 'caller');
    const hasAgent = conversation.some((t) => t.role === 'agent');
    return hasCaller && hasAgent;
  }, [conversation]);

  const legacyConversation = useMemo<LegacyConversationTurn[]>(
    () =>
      conversation.map((turn) => ({
        speaker: turn.role === 'caller' ? 'user' : 'agent',
        text: turn.text,
        timestamp: turn.ts,
      })),
    [conversation],
  );

  const handleEvaluateNow = useCallback(() => {
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
      }
    }

    const session = runSessionEvaluation();
    if (session) {
      toast.success('Session evaluated');
    }
  }, [canEvaluateNow, runSessionEvaluation, conversation, conversationId, activeSpec, currentScopeId, selectedAgent?.id]);

  const handleEndCall = useCallback(() => {
    if (conversation.length === 0) {
      toast.error('No conversation to evaluate');
      return;
    }

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

    // Optional: Reset conversation for new call
    // setConversation([]);
    // setConversationId(createConversationId());
  }, [conversation, conversationId, sessions, selectedAgent?.id, selectedNiche, activeSpec, currentScopeId]);

  useEffect(() => {
    if (!selectedAgent && voiceAgents.length > 0) {
      setSelectedId(voiceAgents[0].id);
    }
  }, [selectedAgent, voiceAgents]);

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
    if (!selectedAgent) return;
    // Initialize from agent if present
    setSystemPrompt((selectedAgent as any).systemPrompt || '');
    const kb = (selectedAgent as any).knowledgeBase as string[] | undefined;
    setKnowledge(kb?.join('\n') || '');
  }, [selectedAgent]);

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
          qnaPairs: payload.qnaPairs
        }
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

    if (hasEvaluatedSession) {
      setHasEvaluatedSession(false);
    }

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
      // Retrieve agent-specific learned responses
      if (!selectedAgent?.id) {
        throw new Error('No agent selected');
      }

      // Use scoped learned snippets if we have a currentScopeId, otherwise fallback to legacy KB
      let learnedPrompt = '';
      let learnedCount = 0; // Track number of learned items for logging
      
      if (currentScopeId) {
        // NEW: Scoped learning - isolated per location+agent+prompt
        const scopedSnippets = getScopedLearnedSnippets(currentScopeId, 5);
        learnedCount = scopedSnippets.length;
        
        if (scopedSnippets.length > 0) {
          console.log(`📚 Injecting ${scopedSnippets.length} scoped learned snippets for ${currentScopeId.substring(0, 30)}...`);
          console.log('Scoped snippets:', scopedSnippets);
          
          // Format as compact snippets (≤200 chars each)
          const snippetLines = scopedSnippets.map((s, i) => 
            `• ${s.originalQuestion.substring(0, 100)} → ${s.correctedResponse.substring(0, 100)}`
          ).join('\n');
          
          learnedPrompt = `\n\n<!-- LEARNED_SNIPPETS_START -->\nPrevious corrections to remember:\n${snippetLines}\n<!-- LEARNED_SNIPPETS_END -->`;
        } else {
          console.log(`📚 No scoped learned snippets yet for scope: ${currentScopeId.substring(0, 30)}...`);
        }
      } else {
        // FALLBACK: Legacy agent-wide learning (if no scope set yet)
        const conversationText = updatedConversation.map(m => m.text).join(' ');
        const learnedResponses = getRelevantLearned(
          selectedAgent.id,
          conversationText,
          3,
          selectedNiche
        );
        
        learnedCount = learnedResponses.length;
        learnedPrompt = formatLearnedForPrompt(learnedResponses);
        
        if (learnedResponses.length > 0) {
          console.log(`📚 Injecting ${learnedResponses.length} learned responses (legacy KB) for agent ${selectedAgent.id}`);
        } else {
          const stats = getAgentKBStats(selectedAgent.id);
          console.log(`📚 No relevant learned responses (agent has ${stats.totalCorrections} total corrections)`);
        }
      }

      // Build enhanced system prompt with agent-specific corrections
      const enhancedSystemPrompt = systemPrompt + learnedPrompt;

      const callResponse = await mcp.voiceAgentCall({
        agentId: selectedAgent.id,
        phoneNumber: '+10000000000',
        context: { 
          userMessage: testMessage,
          conversationHistory: conversation.map((m) => ({
            role: m.role === 'caller' ? 'user' : 'assistant',
            content: m.text,
          })),
          systemPromptOverride: enhancedSystemPrompt,
        },
        options: { textOnly: true }
      }, { showToast: false });

      if (!callResponse.success || !callResponse.data) {
        throw new Error(callResponse.error || 'Call simulation failed');
      }

      const agentPayload: any = callResponse.data.data ?? callResponse.data;

      const agentText = (agentPayload?.transcript ?? agentPayload?.response ?? agentPayload?.message ?? '').trim();

      if (!agentText) {
        console.warn('⚠️  Agent returned empty response payload:', agentPayload);
      }

      // Add agent response to conversation
      const agentTs = Date.now();
      const agentTurn: SimulatorTurn = {
        id: `agent-${agentTs}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'agent',
        text: agentText || 'No response',
        ts: agentTs,
      };

      const finalConversation = [...updatedConversation, agentTurn];
      setConversation(finalConversation);
      setTestResult(agentPayload);

      // Track tokens - estimate from conversation length
      const conversationTextForTokens = finalConversation.map(m => m.text).join('\n');
      const contextTokens = estimateTokens(conversationTextForTokens);
      const basePromptTokens = estimateTokens(systemPrompt || '');
      const learnedTokens = estimateTokens(learnedPrompt);
      const totalPromptTokens = basePromptTokens + learnedTokens;
      const callTokens = contextTokens + totalPromptTokens;
      
      console.log('📊 Token Usage Breakdown:');
      console.log(`  • Conversation: ~${contextTokens} tokens (${conversationTextForTokens.length} chars)`);
      console.log(`  • Base Prompt: ~${basePromptTokens} tokens`);
      console.log(`  • Learned KB: ~${learnedTokens} tokens (${learnedCount} corrections)`);
      console.log(`  • Total Prompt: ~${totalPromptTokens} tokens`);
      console.log(`  • Total This Call: ~${callTokens} tokens`);
      
      setLastCallTokens(callTokens);
      setTotalTokens(prev => prev + callTokens);
      
      // Clear input
      setTestMessage('');
      
      // Auto-evaluate if enabled
      if (showEvaluation && evaluationMode === 'perMessage') {
        await evaluateConversation(finalConversation);
      }
      
      toast.success('Response generated');
    } catch (e: any) {
      console.error('Call simulator error:', e);
      toast.error(e.message || 'Dry-run failed');
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

      if (latestSession && latestSession.conversationId === conversationId) {
        const updated = applyManualCorrections(conversationId, {
          fields: latestSession.collectedFields,
        });
        if (updated) {
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
      
      // 2. Extract spec from prompt
      const spec = extractSpecFromPrompt(systemPrompt);
      setActiveSpec(spec);
      
      // 3. Generate scope ID
      const newScopeId = scopeId({
        locationId: locationId,
        agentId: selectedAgent.id,
        promptHash: hash,
      });
      setCurrentScopeId(newScopeId);
      
      // 4. Update the agent in the store with the new system prompt
      updateVoiceAgent(selectedAgent.id, {
        systemPrompt: systemPrompt as any,
        // Store hash and spec in agent config for future reference
        ...(selectedAgent as any).config && {
          config: {
            ...(selectedAgent as any).config,
            promptHash: hash,
            spec: spec,
          }
        }
      });
      
      console.log(`💾 System Prompt saved for agent: ${selectedAgent.name}`);
      console.log(`   • Prompt Hash: ${hash}`);
      console.log(`   • Scope ID: ${newScopeId}`);
      console.log(`   • Spec: ${spec.niche} (${spec.agent_type})`);
      
      toast.success(`System Prompt saved! Agent will use updated prompt on next call.`);
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
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Training Hub</h1>
          <p className="text-muted-foreground">Craft prompts, knowledge, and Q&A (Sandboxed - No GHL API calls)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleLocalSave} disabled={saving} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Save Local
          </Button>
          <Button variant="outline" onClick={handleGeneratePrompt} disabled={genLoading} loading={genLoading}>
            <Sparkles className="w-4 h-4 mr-2" /> Generate Prompt
          </Button>
          <Button variant="outline" onClick={handleSaveState} disabled={saving || !payload}>
            <Database className="w-4 h-4 mr-2" /> Save State
          </Button>
          <Button onClick={handleDeploy} disabled={syncing || !payload} loading={syncing}>
            <Upload className="w-4 h-4 mr-2" /> Deploy Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4 col-span-1">
          <label className="text-sm mb-2 block">Select Agent</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input">
            {voiceAgents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <label className="text-sm mb-2 block mt-4">Industry / Niche</label>
          <select value={selectedNiche} onChange={(e) => setSelectedNiche(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input">
            <option value="generic">Generic</option>
            {availableNiches.map(n => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>

          <div className="mt-4 p-3 rounded bg-muted/30 text-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>Sandboxed Mode: All data stored locally in database</span>
            </div>
          </div>
        </div>

        <div className="card p-4 col-span-2">
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
      </div>

      <div className="mt-6 card p-4">
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
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Health & Connectivity</h2>
            <Button variant="outline" size="sm" onClick={handleHealthCheck} disabled={healthLoading} loading={healthLoading}>
              <RefreshCw className="w-4 h-4 mr-1" /> Check Health
            </Button>
          </div>
          <pre className="text-xs bg-muted/30 p-3 rounded overflow-auto max-h-48">{healthResult ? JSON.stringify(healthResult, null, 2) : 'No results yet.'}</pre>
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
        </div>
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
    </div>
  );
};

export default TrainingHub;
