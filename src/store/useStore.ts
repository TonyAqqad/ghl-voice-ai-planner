import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  VoiceAgent,
  Workflow,
  PhoneNumber,
  CustomField,
  CustomValue,
  Integration,
  ComplianceSettings,
  Template,
  AnalyticsSnapshot,
  AppState,
  Notification,
  SpecLock,
} from '../types';
import type { Violation } from '../lib/evaluation/autoCorrector';
import type { PromptSpec } from '../lib/spec/specTypes';

interface AgentGovernanceState {
  agentId: string;
  confidenceThreshold: number;
  lastConfidence: number | null;
  lastEvaluationId?: string;
  isGated: boolean;
  gateReason?: string;
  gatedAt?: string | null;
  autoResumeAt?: string | null;
  consecutiveLow: number;
  updatedAt: string;
}

interface AgentTokenBudget {
  agentId: string;
  dailyCap: number;
  usedTokens: number;
  cacheHits: number;
  resetAt: string;
  updatedAt: string;
}

interface CachedTurn {
  signature: string;
  response: string;
  createdAt: number;
  tokens: number;
  latencyMs: number;
}

interface ObservabilityEvent {
  id: string;
  timestamp: string;
  tokens: number;
  costUsd: number;
  latencyMs: number;
  source: 'live' | 'cache';
  ruleViolations: number;
  conversationId?: string;
}

interface ObservabilityViolation {
  id: string;
  type: Violation['type'];
  severity: Violation['severity'];
  message: string;
  turnId?: string;
  timestamp: string;
  conversationId?: string;
}

interface ObservabilitySummary {
  agentId: string;
  totalTokens: number;
  totalCostUsd: number;
  invocations: number;
  avgLatencyMs: number;
  lastLatencyMs: number;
  lastUpdated: string | null;
  events: ObservabilityEvent[];
  totalRuleViolations: number;
  recentRuleViolations: ObservabilityViolation[];
}

interface SpecHistoryEntry {
  id: string;
  agentId: string;
  promptHash: string;
  savedAt: string;
  summary: string;
  storedSpec: PromptSpec;
}

export interface SpecValidationResult {
  status: 'ok' | 'missing_lock' | 'hash_mismatch' | 'spec_mismatch';
  message: string;
  lock?: SpecLock | null;
  diff?: {
    missingKeys?: string[];
    changedFields?: string[];
  };
}

interface GHLStore {
  governanceDefaults: {
    confidenceThreshold: number;
    autoGateMinutes: number;
    cacheTtlMs: number;
    maxCacheEntries: number;
  };
  governanceState: Record<string, AgentGovernanceState>;
  tokenBudgets: Record<string, AgentTokenBudget>;
  observability: Record<string, ObservabilitySummary>;
  turnCache: Record<string, CachedTurn[]>;
  specLocks: Record<string, SpecLock>;
  specHistory: SpecHistoryEntry[];

  // App State
  appState: AppState;
  
  // Data Collections
  voiceAgents: VoiceAgent[];
  workflows: Workflow[];
  phoneNumbers: PhoneNumber[];
  customFields: CustomField[];
  customValues: CustomValue[];
  integrations: Integration[];
  compliance: ComplianceSettings | null;
  templates: Template[];
  analytics: AnalyticsSnapshot[];
  
  // UI State
  currentModule: string;
  darkMode: boolean;
  sidebarOpen: boolean;
  notifications: Notification[];
  
  // Actions
  setCurrentModule: (module: string) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;

  // Governance & Observability
  ensureAgentGovernance: (agentId: string) => AgentGovernanceState;
  setConfidenceThreshold: (agentId: string, threshold: number) => void;
  recordAgentEvaluation: (agentId: string, confidence: number, evaluationId: string, meta?: { conversationId?: string }) => AgentGovernanceState;
  clearAgentGate: (agentId: string) => void;
  checkAgentGate: (agentId: string) => { isGated: boolean; reason?: string; autoResumeAt?: string | null; threshold: number };

  ensureTokenBudget: (agentId: string, dailyCap?: number) => AgentTokenBudget;
  setTokenBudget: (agentId: string, dailyCap: number) => AgentTokenBudget;
  checkTokenBudget: (agentId: string, estimatedTokens: number) => { allowed: boolean; remaining: number; budget: AgentTokenBudget };
  consumeTokenBudget: (agentId: string, tokens: number) => AgentTokenBudget;
  recordCacheHit: (agentId: string) => void;

  recordInvocationMetrics: (
    agentId: string,
    metrics: { tokens: number; costUsd: number; latencyMs: number; source: 'live' | 'cache'; ruleViolations?: number; conversationId?: string }
  ) => void;
  recordRuleViolations: (agentId: string, conversationId: string, turnId: string, violations: Violation[]) => void;

  getCachedTurn: (agentId: string, signature: string) => CachedTurn | null;
  cacheAgentTurn: (agentId: string, signature: string, entry: Omit<CachedTurn, 'signature'>) => void;
  clearAgentCache: (agentId: string) => void;

  saveSpecLock: (agentId: string, lock: SpecLock) => void;
  getSpecLock: (agentId: string) => SpecLock | null;
  validateSpecLock: (agentId: string, promptHash: string, currentSpec: PromptSpec | null | undefined) => SpecValidationResult;
  
  // Voice Agents
  addVoiceAgent: (agent: VoiceAgent) => void;
  updateVoiceAgent: (id: string, updates: Partial<VoiceAgent>) => void;
  deleteVoiceAgent: (id: string) => void;
  getVoiceAgent: (id: string) => VoiceAgent | undefined;
  
  // Workflows
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  getWorkflow: (id: string) => Workflow | undefined;
  
  // Phone Numbers
  addPhoneNumber: (number: PhoneNumber) => void;
  updatePhoneNumber: (id: string, updates: Partial<PhoneNumber>) => void;
  deletePhoneNumber: (id: string) => void;
  
  // Custom Fields
  addCustomField: (field: CustomField) => void;
  updateCustomField: (id: string, updates: Partial<CustomField>) => void;
  deleteCustomField: (id: string) => void;
  
  // Custom Values
  addCustomValue: (value: CustomValue) => void;
  updateCustomValue: (id: string, updates: Partial<CustomValue>) => void;
  deleteCustomValue: (id: string) => void;
  
  // Integrations
  addIntegration: (integration: Integration) => void;
  updateIntegration: (id: string, updates: Partial<Integration>) => void;
  deleteIntegration: (id: string) => void;
  
  // Compliance
  updateCompliance: (settings: ComplianceSettings) => void;
  
  // Templates
  addTemplate: (template: Template) => void;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  
  // Analytics
  addAnalytics: (snapshot: AnalyticsSnapshot) => void;
  
  // Bulk Operations
  importData: (data: Partial<GHLStore>) => void;
  exportData: () => Partial<GHLStore>;
  clearAllData: () => void;
  
  // API Integration Actions
  deployAgent: (agentConfig: any) => Promise<any>;
  generateAgent: (businessDescription: string, industry: string, businessType?: string) => Promise<any>;
  getAgentCosts: (agentId: string, startDate?: string, endDate?: string) => Promise<any>;
  getAgentAnalytics: (agentId: string, startDate?: string, endDate?: string) => Promise<any>;
  addCustomAction: (agentId: string, customAction: any) => Promise<any>;
  createWorkflow: (workflowConfig: any) => Promise<any>;
  loadTemplates: () => Promise<any>;
  createTemplate: (agentConfig: any, metadata?: any) => Promise<any>;
}

export const useStore = create<GHLStore>()(
  persist(
    (set, get) => {
      const defaults = {
        confidenceThreshold: 70,
        autoGateMinutes: 30,
        cacheTtlMs: 15 * 60 * 1000,
        maxCacheEntries: 25,
      };

      const nowIso = () => new Date().toISOString();

      const nextResetIso = () => {
        const next = new Date();
        next.setHours(24, 0, 0, 0);
        return next.toISOString();
      };

      const ensureGovernance = (agentId: string): AgentGovernanceState => {
        const state = get();
        const existing = state.governanceState[agentId];
        if (existing) {
          if (typeof existing.confidenceThreshold !== 'number') {
            const updated = {
              ...existing,
              confidenceThreshold: state.governanceDefaults?.confidenceThreshold ?? defaults.confidenceThreshold,
              updatedAt: nowIso(),
            };
            set((current) => ({
              governanceState: {
                ...current.governanceState,
                [agentId]: updated,
              },
            }));
            return updated;
          }
          return existing;
        }

        const created: AgentGovernanceState = {
          agentId,
          confidenceThreshold: state.governanceDefaults?.confidenceThreshold ?? defaults.confidenceThreshold,
          lastConfidence: null,
          lastEvaluationId: undefined,
          isGated: false,
          gateReason: undefined,
          gatedAt: null,
          autoResumeAt: null,
          consecutiveLow: 0,
          updatedAt: nowIso(),
        };

        set((current) => ({
          governanceState: {
            ...current.governanceState,
            [agentId]: created,
          },
        }));

        return created;
      };

      const ensureBudget = (agentId: string, dailyCap?: number): AgentTokenBudget => {
        const state = get();
        const existing = state.tokenBudgets[agentId];
        const cap = dailyCap ?? existing?.dailyCap ?? 20000;

        const maybeReset = (budget: AgentTokenBudget): AgentTokenBudget => {
          if (!budget.resetAt || Date.now() > Date.parse(budget.resetAt)) {
            return {
              ...budget,
              usedTokens: 0,
              cacheHits: 0,
              resetAt: nextResetIso(),
              updatedAt: nowIso(),
            };
          }
          return budget;
        };

        if (existing) {
          let updated = existing;
          if (existing.dailyCap !== cap) {
            updated = {
              ...updated,
              dailyCap: cap,
              updatedAt: nowIso(),
            };
          }

          const reset = maybeReset(updated);

          if (
            reset !== existing &&
            (
              reset.dailyCap !== existing.dailyCap ||
              reset.usedTokens !== existing.usedTokens ||
              reset.cacheHits !== existing.cacheHits ||
              reset.resetAt !== existing.resetAt
            )
          ) {
            set((current) => ({
              tokenBudgets: {
                ...current.tokenBudgets,
                [agentId]: reset,
              },
            }));
          }

          return reset;
        }

        const created: AgentTokenBudget = {
          agentId,
          dailyCap: cap,
          usedTokens: 0,
          cacheHits: 0,
          resetAt: nextResetIso(),
          updatedAt: nowIso(),
        };

        set((current) => ({
          tokenBudgets: {
            ...current.tokenBudgets,
            [agentId]: created,
          },
        }));

        return created;
      };

      const ensureObservability = (agentId: string): ObservabilitySummary => {
        const state = get();
        const existing = state.observability[agentId];
        if (existing) return existing;

        const created: ObservabilitySummary = {
          agentId,
          totalTokens: 0,
          totalCostUsd: 0,
          invocations: 0,
          avgLatencyMs: 0,
          lastLatencyMs: 0,
          lastUpdated: null,
          events: [],
          totalRuleViolations: 0,
          recentRuleViolations: [],
        };

        set((current) => ({
          observability: {
            ...current.observability,
            [agentId]: created,
          },
        }));

        return created;
      };

      const getCacheEntries = (agentId: string): CachedTurn[] => {
        const state = get();
        const entries = state.turnCache[agentId] ?? [];
        if (entries.length === 0) return [];
        const ttl = state.governanceDefaults?.cacheTtlMs ?? defaults.cacheTtlMs;
        const cutoff = Date.now() - ttl;
        const fresh = entries.filter((entry) => entry.createdAt >= cutoff);
        if (fresh.length !== entries.length) {
          set((current) => ({
            turnCache: {
              ...current.turnCache,
              [agentId]: fresh,
            },
          }));
        }
        return fresh;
      };

      const storeCacheEntries = (agentId: string, entries: CachedTurn[]) => {
        set((current) => ({
          turnCache: {
            ...current.turnCache,
            [agentId]: entries,
          },
        }));
      };

      const stableSerialize = (value: any): string => {
        const seen = new WeakSet();
        const walk = (input: any): any => {
          if (input && typeof input === 'object') {
            if (seen.has(input)) return null;
            seen.add(input);
            if (Array.isArray(input)) {
              return input.map(walk);
            }
            const keys = Object.keys(input).sort();
            const out: Record<string, any> = {};
            keys.forEach((key) => {
              out[key] = walk(input[key]);
            });
            return out;
          }
          return input;
        };

        try {
          return JSON.stringify(walk(value));
        } catch (error) {
          console.warn('Failed to serialize spec for comparison', error);
          return '';
        }
      };

      const diffSpecs = (baseline: PromptSpec, current: PromptSpec) => {
        const baselineKeys = Object.keys(baseline as Record<string, unknown>);
        const missingKeys = baselineKeys.filter((key) => !Object.prototype.hasOwnProperty.call(current, key));
        const trackedKeys = [
          'required_fields',
          'field_order',
          'disallowed_phrases',
          'question_cadence',
          'max_words_per_turn',
          'block_booking_until_fields',
          'confirmations',
        ];

        const changedFields = trackedKeys.filter((key) => {
          const baseValue = (baseline as Record<string, unknown>)[key];
          const currentValue = (current as Record<string, unknown>)[key];
          return stableSerialize(baseValue) !== stableSerialize(currentValue);
        });

        return {
          missingKeys: missingKeys.length > 0 ? missingKeys : undefined,
          changedFields: changedFields.length > 0 ? changedFields : undefined,
        };
      };

      return {
        governanceDefaults: defaults,
        governanceState: {},
        tokenBudgets: {},
        observability: {},
        turnCache: {},
        specLocks: {},
        specHistory: [],

        // Initial State
        appState: {
        currentModule: 'voice-agents',
        darkMode: false,
        sidebarOpen: true,
        notifications: []
      },
      
      voiceAgents: [
        {
          id: '1',
          name: 'F45 Fitness Agent',
          persona: {
            tone: 'friendly',
            style: 'conversational',
            language: 'en'
          },
          voiceProvider: 'elevenlabs',
          llmProvider: 'openai',
          defaultLanguage: 'en',
          scripts: {
            greeting: 'Hi! This is Alex from F45 Training. I\'m calling because you expressed interest in trying our classes.',
            main: 'I\'d love to help you find the perfect class time. What works best for your schedule?',
            fallback: 'I\'m sorry, I didn\'t catch that. Could you repeat that for me?',
            transfer: 'Let me connect you with one of our fitness experts who can help you better.',
            goodbye: 'Thanks for your time! I\'ll send you a text with our class schedule. Have a great day!'
          },
          intents: [],
          transferRules: [],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'Legal Consultation Agent',
          persona: {
            tone: 'professional',
            style: 'formal',
            language: 'en'
          },
          voiceProvider: 'azure',
          llmProvider: 'anthropic',
          defaultLanguage: 'en',
          scripts: {
            greeting: 'Good day, this is Sarah from Legal Solutions. I\'m calling regarding your consultation request.',
            main: 'I understand you\'re seeking legal advice. What type of legal matter can I help you with today?',
            fallback: 'I apologize, could you please clarify that for me?',
            transfer: 'Let me connect you with one of our qualified attorneys who specializes in your area of need.',
            goodbye: 'Thank you for your time. We\'ll follow up with you shortly. Have a good day.'
          },
          intents: [],
          transferRules: [],
          createdAt: '2024-01-14T14:30:00Z',
          updatedAt: '2024-01-14T14:30:00Z'
        }
      ],
      workflows: [
        {
          id: '1',
          name: 'F45 Lead Qualification',
          description: 'Qualifies leads for F45 fitness classes',
          trigger: {
            type: 'inbound_call',
            conditions: {}
          },
          nodes: [],
          edges: [],
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z'
        },
        {
          id: '2',
          name: 'Legal Consultation Intake',
          description: 'Collects information for legal consultations',
          trigger: {
            type: 'inbound_call',
            conditions: {}
          },
          nodes: [],
          edges: [],
          createdAt: '2024-01-14T13:00:00Z',
          updatedAt: '2024-01-14T13:00:00Z'
        }
      ],
      phoneNumbers: [
        {
          id: '1',
          number: '+1 (555) 123-4567',
          country: 'US',
          capabilities: ['voice', 'sms'],
          status: 'active',
          routingRules: []
        },
        {
          id: '2',
          number: '+1 (555) 987-6543',
          country: 'US',
          capabilities: ['voice'],
          status: 'active',
          routingRules: []
        }
      ],
      customFields: [
        {
          id: '1',
          entity: 'contact',
          fieldKey: 'fitness_goals',
          label: 'Fitness Goals',
          type: 'select',
          required: false,
          options: ['Weight Loss', 'Muscle Gain', 'General Fitness', 'Competition Prep']
        },
        {
          id: '2',
          entity: 'contact',
          fieldKey: 'legal_matter_type',
          label: 'Legal Matter Type',
          type: 'select',
          required: true,
          options: ['Personal Injury', 'Family Law', 'Criminal Defense', 'Business Law', 'Estate Planning']
        }
      ],
      customValues: [
        {
          id: '1',
          key: 'fitness_goals',
          value: 'Weight Loss',
          group: 'fitness',
          description: 'Primary fitness goal'
        }
      ],
      integrations: [
        {
          id: '1',
          provider: 'openai',
          name: 'OpenAI GPT-4',
          status: 'connected',
          config: { apiKey: 'sk-***' },
          lastSync: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          provider: 'elevenlabs',
          name: 'ElevenLabs Voice',
          status: 'connected',
          config: { apiKey: 'eleven_***' },
          lastSync: '2024-01-15T09:30:00Z'
        }
      ],
      compliance: {
        id: '1',
        tcpaChecked: true,
        gdprChecked: true,
        recordingConsent: true,
        dncListMeta: {
          lastUpdated: '2024-01-15T00:00:00Z',
          recordCount: 1250,
          source: 'national_dnc_registry'
        },
        consentScripts: {
          inbound: 'This call may be recorded for quality and training purposes.',
          outbound: 'This call is being made for business purposes. If you wish to be placed on our do-not-call list, please let us know.',
          recording: 'This call is being recorded for quality assurance.'
        }
      },
      templates: [
        {
          id: '1',
          name: 'F45 Fitness Agent Template',
          industry: 'service_business',
          description: 'Complete template for fitness class lead qualification',
          voiceAgent: {},
          workflow: {},
          customFields: [],
          customValues: [],
          playbook: 'Use this template to create fitness class lead qualification agents.'
        }
      ],
      analytics: [
        {
          id: '1',
          date: '2024-01-15',
          calls: 45,
          connected: 38,
          transfers: 12,
          bookings: 8,
          avgHandleSec: 180,
          estCostUSD: 12.50,
          agentId: '1'
        }
      ],
      
      // UI State
      currentModule: 'voice-agents',
      darkMode: false,
      sidebarOpen: true,
      notifications: [],
      
      // Actions
      setCurrentModule: (module) => set({ currentModule: module }),
      toggleDarkMode: () => set((state) => ({ 
        darkMode: !state.darkMode,
        appState: { ...state.appState, darkMode: !state.darkMode }
      })),
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen,
        appState: { ...state.appState, sidebarOpen: !state.sidebarOpen }
      })),
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false
        };
        set((state) => ({
          notifications: [...state.notifications, newNotification],
          appState: {
            ...state.appState,
            notifications: [...state.appState.notifications, newNotification]
          }
        }));
      },
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
        appState: {
          ...state.appState,
          notifications: state.appState.notifications.filter(n => n.id !== id)
        }
      })),
      
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ),
        appState: {
          ...state.appState,
          notifications: state.appState.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        }
      })),

      // Governance & Observability
      ensureAgentGovernance: (agentId) => ensureGovernance(agentId),

      setConfidenceThreshold: (agentId, threshold) => {
        const governance = ensureGovernance(agentId);
        if (governance.confidenceThreshold === threshold) return;

        const updated: AgentGovernanceState = {
          ...governance,
          confidenceThreshold: threshold,
          updatedAt: nowIso(),
        };

        set((state) => ({
          governanceState: {
            ...state.governanceState,
            [agentId]: updated,
          },
        }));
      },

      recordAgentEvaluation: (agentId, confidence, evaluationId, meta) => {
        const governance = ensureGovernance(agentId);
        const threshold = governance.confidenceThreshold ?? get().governanceDefaults?.confidenceThreshold ?? defaults.confidenceThreshold;
        const now = nowIso();
        let isGated = governance.isGated;
        let gateReason = governance.gateReason;
        let autoResumeAt = governance.autoResumeAt;
        let gatedAt = governance.gatedAt;
        let consecutiveLow = governance.consecutiveLow;

        if (confidence < threshold) {
          consecutiveLow += 1;
          isGated = true;
          gateReason = `Confidence ${confidence}% below ${threshold}% threshold`;
          const resumeMs = (get().governanceDefaults?.autoGateMinutes ?? defaults.autoGateMinutes) * 60 * 1000;
          autoResumeAt = new Date(Date.now() + resumeMs).toISOString();
          gatedAt = now;
        } else {
          consecutiveLow = 0;
          if (isGated && confidence >= threshold + 5) {
            isGated = false;
            gateReason = undefined;
            autoResumeAt = null;
            gatedAt = null;
          }
        }

        const updated: AgentGovernanceState = {
          ...governance,
          lastConfidence: confidence,
          lastEvaluationId: evaluationId,
          isGated,
          gateReason,
          autoResumeAt,
          gatedAt,
          consecutiveLow,
          updatedAt: now,
        };

        set((state) => ({
          governanceState: {
            ...state.governanceState,
            [agentId]: updated,
          },
        }));

        return updated;
      },

      clearAgentGate: (agentId) => {
        const governance = ensureGovernance(agentId);
        if (!governance.isGated && !governance.gateReason) return;

        const updated: AgentGovernanceState = {
          ...governance,
          isGated: false,
          gateReason: undefined,
          autoResumeAt: null,
          gatedAt: null,
          consecutiveLow: 0,
          updatedAt: nowIso(),
        };

        set((state) => ({
          governanceState: {
            ...state.governanceState,
            [agentId]: updated,
          },
        }));
      },

      checkAgentGate: (agentId) => {
        const governance = ensureGovernance(agentId);
        if (governance.isGated && governance.autoResumeAt) {
          const resumeAt = Date.parse(governance.autoResumeAt);
          if (!Number.isNaN(resumeAt) && Date.now() > resumeAt) {
            const updated: AgentGovernanceState = {
              ...governance,
              isGated: false,
              gateReason: undefined,
              autoResumeAt: null,
              gatedAt: null,
              consecutiveLow: 0,
              updatedAt: nowIso(),
            };

            set((state) => ({
              governanceState: {
                ...state.governanceState,
                [agentId]: updated,
              },
            }));

            return { isGated: false, reason: undefined, autoResumeAt: null, threshold: updated.confidenceThreshold };
          }
        }

        return {
          isGated: governance.isGated,
          reason: governance.gateReason,
          autoResumeAt: governance.autoResumeAt ?? null,
          threshold: governance.confidenceThreshold,
        };
      },

      ensureTokenBudget: (agentId, dailyCap) => ensureBudget(agentId, dailyCap),

      setTokenBudget: (agentId, dailyCap) => ensureBudget(agentId, dailyCap),

      checkTokenBudget: (agentId, estimatedTokens) => {
        const budget = ensureBudget(agentId);
        const remaining = Math.max(0, budget.dailyCap - budget.usedTokens);
        if (estimatedTokens > remaining) {
          return { allowed: false, remaining, budget };
        }
        return { allowed: true, remaining: remaining - estimatedTokens, budget };
      },

      consumeTokenBudget: (agentId, tokens) => {
        const budget = ensureBudget(agentId);
        const updated: AgentTokenBudget = {
          ...budget,
          usedTokens: Math.max(0, budget.usedTokens + Math.max(0, tokens)),
          updatedAt: nowIso(),
        };

        set((state) => ({
          tokenBudgets: {
            ...state.tokenBudgets,
            [agentId]: updated,
          },
        }));

        return updated;
      },

      recordCacheHit: (agentId) => {
        const budget = ensureBudget(agentId);
        const updated: AgentTokenBudget = {
          ...budget,
          cacheHits: budget.cacheHits + 1,
          updatedAt: nowIso(),
        };

        set((state) => ({
          tokenBudgets: {
            ...state.tokenBudgets,
            [agentId]: updated,
          },
        }));
      },

      recordInvocationMetrics: (agentId, metrics) => {
        const summary = ensureObservability(agentId);
        const now = nowIso();
        const invocations = summary.invocations + 1;
        const tokens = Math.max(0, metrics.tokens);
        const costUsd = Math.max(0, metrics.costUsd);
        const latencyMs = Math.max(0, metrics.latencyMs);
        const avgLatency =
          invocations === 0 ? 0 : ((summary.avgLatencyMs * summary.invocations) + latencyMs) / invocations;

        const event: ObservabilityEvent = {
          id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: now,
          tokens,
          costUsd,
          latencyMs,
          source: metrics.source,
          ruleViolations: metrics.ruleViolations ?? 0,
          conversationId: metrics.conversationId,
        };

        const events = [event, ...summary.events].slice(0, 25);

        const updated: ObservabilitySummary = {
          ...summary,
          totalTokens: summary.totalTokens + tokens,
          totalCostUsd: summary.totalCostUsd + costUsd,
          invocations,
          avgLatencyMs: avgLatency,
          lastLatencyMs: latencyMs,
          lastUpdated: now,
          events,
        };

        set((state) => ({
          observability: {
            ...state.observability,
            [agentId]: updated,
          },
        }));
      },

      recordRuleViolations: (agentId, conversationId, turnId, violations) => {
        if (!violations || violations.length === 0) return;
        const summary = ensureObservability(agentId);
        const now = nowIso();
        const entries: ObservabilityViolation[] = violations.map((violation) => ({
          id: `${turnId}-${violation.type}-${Math.random().toString(36).slice(2, 6)}`,
          type: violation.type,
          severity: violation.severity,
          message: violation.message,
          turnId,
          timestamp: now,
          conversationId,
        }));

        const recent = [...entries, ...summary.recentRuleViolations].slice(0, 25);

        const updated: ObservabilitySummary = {
          ...summary,
          totalRuleViolations: summary.totalRuleViolations + violations.length,
          recentRuleViolations: recent,
          lastUpdated: now,
        };

        set((state) => ({
          observability: {
            ...state.observability,
            [agentId]: updated,
          },
        }));
      },

      getCachedTurn: (agentId, signature) => {
        const entries = getCacheEntries(agentId);
        return entries.find((entry) => entry.signature === signature) ?? null;
      },

      cacheAgentTurn: (agentId, signature, entry) => {
        const entries = getCacheEntries(agentId).filter((cacheEntry) => cacheEntry.signature !== signature);
        const newEntry: CachedTurn = {
          signature,
          response: entry.response,
          createdAt: entry.createdAt,
          tokens: entry.tokens,
          latencyMs: entry.latencyMs,
        };

        const maxEntries = get().governanceDefaults?.maxCacheEntries ?? defaults.maxCacheEntries;
        storeCacheEntries(agentId, [newEntry, ...entries].slice(0, maxEntries));
      },

      clearAgentCache: (agentId) => {
        storeCacheEntries(agentId, []);
      },

      saveSpecLock: (agentId, lock) => {
        const savedAt = lock.savedAt || nowIso();
        const updatedLock: SpecLock = {
          ...lock,
          savedAt,
        };

        set((state) => {
          const specLabel = updatedLock.storedSpec?.niche || updatedLock.storedSpec?.agent_type || 'spec';
          const entry: SpecHistoryEntry = {
            id: `${agentId}-${updatedLock.promptHash}-${Date.now()}`,
            agentId,
            promptHash: updatedLock.promptHash,
            savedAt,
            summary: `Spec saved (${specLabel})`,
            storedSpec: updatedLock.storedSpec,
          };

          const filteredHistory = state.specHistory.filter(
            (item) => !(item.agentId === agentId && item.promptHash === updatedLock.promptHash)
          );

          return {
            specLocks: {
              ...state.specLocks,
              [agentId]: updatedLock,
            },
            specHistory: [entry, ...filteredHistory].slice(0, 25),
          };
        });
      },

      getSpecLock: (agentId) => {
        const lock = get().specLocks[agentId];
        return lock ?? null;
      },

      validateSpecLock: (agentId, promptHash, currentSpec) => {
        const lock = get().specLocks[agentId] ?? null;
        if (!lock) {
          return {
            status: 'missing_lock',
            message: 'No saved spec found for this agent. Save the prompt to lock it.',
            lock,
          };
        }

        if (lock.promptHash !== promptHash) {
          return {
            status: 'hash_mismatch',
            message: 'Prompt hash differs from the saved spec version.',
            lock,
            diff: currentSpec ? diffSpecs(lock.storedSpec, currentSpec) : undefined,
          };
        }

        if (!currentSpec) {
          return {
            status: 'spec_mismatch',
            message: 'Prompt is missing embedded SPEC JSON.',
            lock,
          };
        }

        const storedSignature = stableSerialize(lock.storedSpec);
        const currentSignature = stableSerialize(currentSpec);

        if (storedSignature !== currentSignature) {
          return {
            status: 'spec_mismatch',
            message: 'Stored SPEC and prompt SPEC differ.',
            lock,
            diff: diffSpecs(lock.storedSpec, currentSpec),
          };
        }

        return {
          status: 'ok',
          message: 'Spec lock validated.',
          lock,
        };
      },

      // Voice Agents
      addVoiceAgent: (agent) => set((state) => ({
        voiceAgents: [...state.voiceAgents, agent]
      })),
      
      updateVoiceAgent: (id, updates) => set((state) => ({
        voiceAgents: state.voiceAgents.map(agent =>
          agent.id === id ? { ...agent, ...updates, updatedAt: new Date().toISOString() } : agent
        )
      })),
      
      deleteVoiceAgent: (id) => set((state) => ({
        voiceAgents: state.voiceAgents.filter(agent => agent.id !== id)
      })),
      
      getVoiceAgent: (id) => get().voiceAgents.find(agent => agent.id === id),
      
      // Workflows
      addWorkflow: (workflow) => set((state) => ({
        workflows: [...state.workflows, workflow]
      })),
      
      updateWorkflow: (id, updates) => set((state) => ({
        workflows: state.workflows.map(workflow =>
          workflow.id === id ? { ...workflow, ...updates, updatedAt: new Date().toISOString() } : workflow
        )
      })),
      
      deleteWorkflow: (id) => set((state) => ({
        workflows: state.workflows.filter(workflow => workflow.id !== id)
      })),
      
      getWorkflow: (id) => get().workflows.find(workflow => workflow.id === id),
      
      // Phone Numbers
      addPhoneNumber: (number) => set((state) => ({
        phoneNumbers: [...state.phoneNumbers, number]
      })),
      
      updatePhoneNumber: (id, updates) => set((state) => ({
        phoneNumbers: state.phoneNumbers.map(number =>
          number.id === id ? { ...number, ...updates } : number
        )
      })),
      
      deletePhoneNumber: (id) => set((state) => ({
        phoneNumbers: state.phoneNumbers.filter(number => number.id !== id)
      })),
      
      // Custom Fields
      addCustomField: (field) => set((state) => ({
        customFields: [...state.customFields, field]
      })),
      
      updateCustomField: (id, updates) => set((state) => ({
        customFields: state.customFields.map(field =>
          field.id === id ? { ...field, ...updates } : field
        )
      })),
      
      deleteCustomField: (id) => set((state) => ({
        customFields: state.customFields.filter(field => field.id !== id)
      })),
      
      // Custom Values
      addCustomValue: (value) => set((state) => ({
        customValues: [...state.customValues, value]
      })),
      
      updateCustomValue: (id, updates) => set((state) => ({
        customValues: state.customValues.map(value =>
          value.id === id ? { ...value, ...updates } : value
        )
      })),
      
      deleteCustomValue: (id) => set((state) => ({
        customValues: state.customValues.filter(value => value.id !== id)
      })),
      
      // Integrations
      addIntegration: (integration) => set((state) => ({
        integrations: [...state.integrations, integration]
      })),
      
      updateIntegration: (id, updates) => set((state) => ({
        integrations: state.integrations.map(integration =>
          integration.id === id ? { ...integration, ...updates } : integration
        )
      })),
      
      deleteIntegration: (id) => set((state) => ({
        integrations: state.integrations.filter(integration => integration.id !== id)
      })),
      
      // Compliance
      updateCompliance: (settings) => set({ compliance: settings }),
      
      // Templates
      addTemplate: (template) => set((state) => ({
        templates: [...state.templates, template]
      })),
      
      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map(template =>
          template.id === id ? { ...template, ...updates } : template
        )
      })),
      
      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter(template => template.id !== id)
      })),
      
      // Analytics
      addAnalytics: (snapshot) => set((state) => ({
        analytics: [...state.analytics, snapshot]
      })),
      
      // Bulk Operations
      importData: (data) => set((state) => ({
        ...state,
        ...data
      })),
      
      exportData: () => {
        const state = get();
        return {
          voiceAgents: state.voiceAgents,
          workflows: state.workflows,
          phoneNumbers: state.phoneNumbers,
          customFields: state.customFields,
          customValues: state.customValues,
          integrations: state.integrations,
          compliance: state.compliance,
          templates: state.templates,
          analytics: state.analytics
        };
      },
      
      clearAllData: () => set({
        voiceAgents: [],
        workflows: [],
        phoneNumbers: [],
        customFields: [],
        customValues: [],
        integrations: [],
        compliance: null,
        templates: [],
        analytics: []
      }),
      
      // API Integration Actions
      deployAgent: async (agentConfig) => {
        try {
          const response = await fetch('/api/voice-ai/agents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(agentConfig),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          
          // Add the deployed agent to local state
          if (result.success && result.agent) {
            get().addVoiceAgent(result.agent);
          }
          
          return result;
        } catch (error) {
          console.error('Failed to deploy agent:', error);
          throw error;
        }
      },
      
      generateAgent: async (businessDescription, industry, businessType = 'service') => {
        try {
          const response = await fetch('/api/voice-ai/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessDescription,
              industry,
              businessType
            }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error('Failed to generate agent:', error);
          throw error;
        }
      },
      
      getAgentCosts: async (agentId, startDate, endDate) => {
        try {
          const params = new URLSearchParams();
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          
          const response = await fetch(`/api/voice-ai/agents/${agentId}/costs?${params}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error('Failed to get agent costs:', error);
          throw error;
        }
      },
      
      getAgentAnalytics: async (agentId, startDate, endDate) => {
        try {
          const params = new URLSearchParams();
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          
          const response = await fetch(`/api/voice-ai/agents/${agentId}/analytics?${params}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error('Failed to get agent analytics:', error);
          throw error;
        }
      },
      
      addCustomAction: async (agentId, customAction) => {
        try {
          const response = await fetch(`/api/voice-ai/agents/${agentId}/custom-actions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(customAction),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error('Failed to add custom action:', error);
          throw error;
        }
      },
      
      createWorkflow: async (workflowConfig) => {
        try {
          const response = await fetch('/api/workflows', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(workflowConfig),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          
          // Add the created workflow to local state
          if (result.success && result.workflow) {
            get().addWorkflow(result.workflow);
          }
          
          return result;
        } catch (error) {
          console.error('Failed to create workflow:', error);
          throw error;
        }
      },
      
      loadTemplates: async () => {
        try {
          const response = await fetch('/api/templates');
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const templates = await response.json();
          
          // Update local templates
          set({ templates });
          
          return templates;
        } catch (error) {
          console.error('Failed to load templates:', error);
          throw error;
        }
      },
      
      createTemplate: async (agentConfig, metadata = {}) => {
        try {
          const response = await fetch('/api/templates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ agentConfig, metadata }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const template = await response.json();
          
          // Add the created template to local state
          get().addTemplate(template);
          
          return template;
        } catch (error) {
          console.error('Failed to create template:', error);
          throw error;
        }
      }
    };
  },
    {
      name: 'ghl-voice-ai-planner',
      partialize: (state) => ({
        voiceAgents: state.voiceAgents,
        workflows: state.workflows,
        phoneNumbers: state.phoneNumbers,
        customFields: state.customFields,
        customValues: state.customValues,
        integrations: state.integrations,
        compliance: state.compliance,
        templates: state.templates,
        analytics: state.analytics,
        darkMode: state.darkMode,
        governanceDefaults: state.governanceDefaults,
        governanceState: state.governanceState,
        tokenBudgets: state.tokenBudgets,
        observability: state.observability,
        turnCache: state.turnCache,
        specLocks: state.specLocks,
        specHistory: state.specHistory,
      }),
    }
  )
);


