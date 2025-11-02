/**
 * Master AI Manager Hook
 * 
 * Central orchestration hook that manages voice agents with:
 * - Pre-turn guidance
 * - Quality gates
 * - Real-time intervention
 * - Continuous learning
 * - Golden dataset compatibility
 * - Confidence gating integration
 * - Audit-grade observability
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { PromptSpec } from '../lib/spec/specTypes';
import { estimateTokens } from '../lib/prompt/masterOrchestrator';

export interface PreTurnGuidance {
  recommendedResponse: string;
  reasoning: string[];
  confidence: number;
  fieldToCollect?: string;
  alternativeResponses: string[];
  observability: {
    traceId: string;
    tokensIn: number;
    tokensOut: number;
    model: string;
    latencyMs: number;
    rulesChecked: string[];
  };
}

export interface QualityReview {
  approved: boolean;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
  confidenceScore: number; // Master AI confidence in this response
  blockedReasons?: string[];
  suggestedResponse?: string;
  observability: {
    traceId: string;
    tokensIn: number;
    tokensOut: number;
    model: string;
    latencyMs: number;
    rulesChecked: string[];
  };
}

export interface Intervention {
  id: string;
  turnId: string;
  timestamp: string;
  issue: string;
  originalResponse: string;
  correctedResponse: string;
  reasoning: string;
  autoApplied: boolean;
  observability: {
    traceId: string;
    tokensUsed: number;
    latencyMs: number;
  };
}

export interface LearnedPattern {
  id: string;
  pattern: string; // "When X happens"
  action: string;  // "Agent should Y"
  confidence: number;
  examples: string[];
  agentId: string;
  niche: string;
  createdAt: string;
  appliedCount: number;
}

export interface MasterAIConfig {
  agentId: string;
  niche: string;
  systemPrompt: string;
  qualityThreshold?: number; // Default 70
  confidenceThreshold?: number; // Default 70 (for gating)
  enablePreTurnGuidance?: boolean;
  enableQualityGates?: boolean;
  enableInterventions?: boolean;
  enableLearning?: boolean;
  goldenDatasetMode?: boolean; // Special mode for golden dataset testing
}

export interface ObservabilityEvent {
  traceId: string;
  timestamp: string;
  eventType: 'guidance' | 'review' | 'intervention' | 'learning' | 'gate_triggered';
  agentId: string;
  conversationId: string;
  turnIndex: number;
  tokensIn: number;
  tokensOut: number;
  model: string;
  latencyMs: number;
  costUsd: number;
  rulesChecked: string[];
  outcome: string;
  metadata: Record<string, any>;
}

export function useMasterAIManager(config: MasterAIConfig) {
  const {
    agentId,
    niche,
    systemPrompt,
    qualityThreshold = 70,
    confidenceThreshold = 70,
    enablePreTurnGuidance = true,
    enableQualityGates = true,
    enableInterventions = true,
    enableLearning = true,
    goldenDatasetMode = false,
  } = config;

  // State
  const [guidance, setGuidance] = useState<PreTurnGuidance | null>(null);
  const [qualityReview, setQualityReview] = useState<QualityReview | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [learnedPatterns, setLearnedPatterns] = useState<LearnedPattern[]>([]);
  const [observabilityEvents, setObservabilityEvents] = useState<ObservabilityEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidenceGateActive, setConfidenceGateActive] = useState(false);

  // Refs for tracking
  const turnCountRef = useRef(0);
  const sessionStartRef = useRef(Date.now());

  /**
   * Generate a unique trace ID for observability
   */
  const generateTraceId = useCallback(() => {
    return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }, []);

  /**
   * Log observability event
   */
  const logObservability = useCallback((event: ObservabilityEvent) => {
    setObservabilityEvents(prev => [...prev, event]);
    console.log('📊 Observability:', event);
  }, []);

  /**
   * Get pre-turn guidance from Master AI
   * Shows recommended response before agent generates
   */
  const getPreTurnGuidance = useCallback(async (context: {
    conversation: Array<{ role: string; text: string }>;
    fieldsCollected: string[];
    conversationId: string;
  }): Promise<PreTurnGuidance | null> => {
    if (!enablePreTurnGuidance) return null;

    setIsProcessing(true);
    const traceId = generateTraceId();
    const startTime = performance.now();

    try {
      const response = await fetch('/api/mcp/master/preTurnGuidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          niche,
          systemPrompt,
          conversation: context.conversation,
          fieldsCollected: context.fieldsCollected,
          goldenDatasetMode,
          traceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Pre-turn guidance failed');
      }

      const data = await response.json();
      const latencyMs = performance.now() - startTime;

      const guidanceData: PreTurnGuidance = {
        ...data.guidance,
        observability: {
          traceId,
          tokensIn: estimateTokens(JSON.stringify(context)),
          tokensOut: estimateTokens(data.guidance.recommendedResponse),
          model: data.model || 'gpt-4o-mini',
          latencyMs,
          rulesChecked: data.rulesChecked || [],
        },
      };

      setGuidance(guidanceData);

      // Log observability
      logObservability({
        traceId,
        timestamp: new Date().toISOString(),
        eventType: 'guidance',
        agentId,
        conversationId: context.conversationId,
        turnIndex: turnCountRef.current,
        tokensIn: guidanceData.observability.tokensIn,
        tokensOut: guidanceData.observability.tokensOut,
        model: guidanceData.observability.model,
        latencyMs,
        costUsd: ((guidanceData.observability.tokensIn + guidanceData.observability.tokensOut) / 1000) * 0.00015,
        rulesChecked: guidanceData.observability.rulesChecked,
        outcome: 'success',
        metadata: { confidence: guidanceData.confidence },
      });

      turnCountRef.current += 1;
      return guidanceData;
    } catch (error) {
      console.error('❌ Pre-turn guidance error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [agentId, niche, systemPrompt, enablePreTurnGuidance, goldenDatasetMode, generateTraceId, logObservability]);

  /**
   * Review agent response with quality gates
   * Blocks/modifies responses below threshold
   */
  const reviewResponse = useCallback(async (context: {
    response: string;
    conversation: Array<{ role: string; text: string }>;
    conversationId: string;
  }): Promise<QualityReview> => {
    if (!enableQualityGates) {
      // Pass-through mode
      return {
        approved: true,
        score: 100,
        issues: [],
        suggestions: [],
        confidenceScore: 100,
        observability: {
          traceId: generateTraceId(),
          tokensIn: 0,
          tokensOut: 0,
          model: 'bypass',
          latencyMs: 0,
          rulesChecked: [],
        },
      };
    }

    setIsProcessing(true);
    const traceId = generateTraceId();
    const startTime = performance.now();

    try {
      const response = await fetch('/api/mcp/master/reviewResponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          niche,
          systemPrompt,
          response: context.response,
          conversation: context.conversation,
          qualityThreshold,
          confidenceThreshold,
          goldenDatasetMode,
          traceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Response review failed');
      }

      const data = await response.json();
      const latencyMs = performance.now() - startTime;

      const review: QualityReview = {
        ...data.review,
        observability: {
          traceId,
          tokensIn: estimateTokens(context.response + JSON.stringify(context.conversation)),
          tokensOut: estimateTokens(JSON.stringify(data.review)),
          model: data.model || 'gpt-4o-mini',
          latencyMs,
          rulesChecked: data.rulesChecked || [],
        },
      };

      setQualityReview(review);

      // Check if confidence gate should be triggered
      if (review.confidenceScore < confidenceThreshold && !goldenDatasetMode) {
        setConfidenceGateActive(true);
        
        // Log gate trigger
        logObservability({
          traceId: generateTraceId(),
          timestamp: new Date().toISOString(),
          eventType: 'gate_triggered',
          agentId,
          conversationId: context.conversationId,
          turnIndex: turnCountRef.current,
          tokensIn: 0,
          tokensOut: 0,
          model: 'gate',
          latencyMs: 0,
          costUsd: 0,
          rulesChecked: ['confidence_threshold'],
          outcome: 'gated',
          metadata: {
            confidenceScore: review.confidenceScore,
            threshold: confidenceThreshold,
          },
        });
      }

      // Log observability
      logObservability({
        traceId,
        timestamp: new Date().toISOString(),
        eventType: 'review',
        agentId,
        conversationId: context.conversationId,
        turnIndex: turnCountRef.current,
        tokensIn: review.observability.tokensIn,
        tokensOut: review.observability.tokensOut,
        model: review.observability.model,
        latencyMs,
        costUsd: ((review.observability.tokensIn + review.observability.tokensOut) / 1000) * 0.00015,
        rulesChecked: review.observability.rulesChecked,
        outcome: review.approved ? 'approved' : 'blocked',
        metadata: {
          score: review.score,
          confidenceScore: review.confidenceScore,
          issues: review.issues,
        },
      });

      return review;
    } catch (error) {
      console.error('❌ Response review error:', error);
      // Fail open - approve by default if review fails
      return {
        approved: true,
        score: 50,
        issues: ['Review system error'],
        suggestions: [],
        confidenceScore: 50,
        observability: {
          traceId,
          tokensIn: 0,
          tokensOut: 0,
          model: 'error',
          latencyMs: performance.now() - startTime,
          rulesChecked: [],
        },
      };
    } finally {
      setIsProcessing(false);
    }
  }, [agentId, niche, systemPrompt, qualityThreshold, confidenceThreshold, enableQualityGates, goldenDatasetMode, generateTraceId, logObservability]);

  /**
   * Apply automatic intervention to fix response
   */
  const intervene = useCallback(async (context: {
    response: string;
    issues: string[];
    turnId: string;
  }): Promise<Intervention | null> => {
    if (!enableInterventions) return null;

    const traceId = generateTraceId();
    const startTime = performance.now();

    try {
      const response = await fetch('/api/mcp/master/intervene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          niche,
          originalResponse: context.response,
          issues: context.issues,
          systemPrompt,
          traceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Intervention failed');
      }

      const data = await response.json();
      const latencyMs = performance.now() - startTime;

      const intervention: Intervention = {
        id: `intervention-${Date.now()}`,
        turnId: context.turnId,
        timestamp: new Date().toISOString(),
        issue: context.issues.join(', '),
        originalResponse: context.response,
        correctedResponse: data.correctedResponse,
        reasoning: data.reasoning,
        autoApplied: data.autoApplied || false,
        observability: {
          traceId,
          tokensUsed: estimateTokens(context.response + data.correctedResponse),
          latencyMs,
        },
      };

      setInterventions(prev => [...prev, intervention]);

      // Log observability
      logObservability({
        traceId,
        timestamp: intervention.timestamp,
        eventType: 'intervention',
        agentId,
        conversationId: context.turnId.split('-')[0] || 'unknown',
        turnIndex: turnCountRef.current,
        tokensIn: estimateTokens(context.response),
        tokensOut: estimateTokens(data.correctedResponse),
        model: data.model || 'gpt-4o-mini',
        latencyMs,
        costUsd: (intervention.observability.tokensUsed / 1000) * 0.00015,
        rulesChecked: ['intervention_rules'],
        outcome: 'corrected',
        metadata: {
          issues: context.issues,
          autoApplied: intervention.autoApplied,
        },
      });

      return intervention;
    } catch (error) {
      console.error('❌ Intervention error:', error);
      return null;
    }
  }, [agentId, niche, systemPrompt, enableInterventions, generateTraceId, logObservability]);

  /**
   * Learn from interaction and generate patterns
   */
  const learnFromInteraction = useCallback(async (context: {
    conversation: Array<{ role: string; text: string }>;
    outcome: 'success' | 'failure';
    conversationId: string;
  }): Promise<LearnedPattern[]> => {
    if (!enableLearning || goldenDatasetMode) return [];

    const traceId = generateTraceId();
    
    try {
      const response = await fetch('/api/mcp/master/learnPattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          niche,
          conversation: context.conversation,
          outcome: context.outcome,
          interventions,
          traceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Learning failed');
      }

      const data = await response.json();
      const newPatterns = data.patterns || [];

      setLearnedPatterns(prev => [...prev, ...newPatterns]);

      // Log observability
      logObservability({
        traceId,
        timestamp: new Date().toISOString(),
        eventType: 'learning',
        agentId,
        conversationId: context.conversationId,
        turnIndex: turnCountRef.current,
        tokensIn: estimateTokens(JSON.stringify(context.conversation)),
        tokensOut: estimateTokens(JSON.stringify(newPatterns)),
        model: data.model || 'gpt-4o',
        latencyMs: data.latencyMs || 0,
        costUsd: data.costUsd || 0,
        rulesChecked: ['pattern_extraction'],
        outcome: 'learned',
        metadata: {
          patternsLearned: newPatterns.length,
          outcome: context.outcome,
        },
      });

      return newPatterns;
    } catch (error) {
      console.error('❌ Learning error:', error);
      return [];
    }
  }, [agentId, niche, interventions, enableLearning, goldenDatasetMode, generateTraceId, logObservability]);

  /**
   * Get observability summary for current session
   */
  const getObservabilitySummary = useCallback(() => {
    const totalTokens = observabilityEvents.reduce((sum, e) => sum + e.tokensIn + e.tokensOut, 0);
    const totalCost = observabilityEvents.reduce((sum, e) => sum + e.costUsd, 0);
    const avgLatency = observabilityEvents.length > 0
      ? observabilityEvents.reduce((sum, e) => sum + e.latencyMs, 0) / observabilityEvents.length
      : 0;

    return {
      totalTokens,
      totalCost,
      avgLatency,
      eventCount: observabilityEvents.length,
      events: observabilityEvents,
      sessionDurationMs: Date.now() - sessionStartRef.current,
    };
  }, [observabilityEvents]);

  /**
   * Clear confidence gate (for testing or manual override)
   */
  const clearConfidenceGate = useCallback(() => {
    setConfidenceGateActive(false);
  }, []);

  /**
   * Reset hook state (for new conversation)
   */
  const reset = useCallback(() => {
    setGuidance(null);
    setQualityReview(null);
    setInterventions([]);
    setObservabilityEvents([]);
    setConfidenceGateActive(false);
    turnCountRef.current = 0;
    sessionStartRef.current = Date.now();
  }, []);

  return {
    // State
    guidance,
    qualityReview,
    interventions,
    learnedPatterns,
    isProcessing,
    confidenceGateActive,
    
    // Functions
    getPreTurnGuidance,
    reviewResponse,
    intervene,
    learnFromInteraction,
    getObservabilitySummary,
    clearConfidenceGate,
    reset,
    
    // Observability
    observabilityEvents,
  };
}

