// Core Data Models for GHL Voice AI Agent Planner

import type { PromptSpec } from '../lib/spec/specTypes';

export interface SpecLock {
  promptHash: string;
  storedSpec: PromptSpec;
  savedAt: string;
  savedBy?: string;
}

export interface VoiceAgent {
  id: string;
  name: string;
  persona: {
    tone: 'professional' | 'friendly' | 'casual' | 'authoritative';
    style: 'conversational' | 'formal' | 'technical' | 'empathetic';
    language: string;
  };
  voiceProvider: 'elevenlabs' | 'azure' | 'aws' | 'google';
  llmProvider: 'openai' | 'anthropic' | 'azure' | 'cohere';
  defaultLanguage: string;
  systemPrompt?: string;
  specLock?: SpecLock;
  scripts: {
    greeting: string;
    main: string;
    fallback: string;
    transfer: string;
    goodbye: string;
  };
  intents: Intent[];
  transferRules: TransferRule[];
  createdAt: string;
  updatedAt: string;
}

export interface Intent {
  id: string;
  name: string;
  keywords: string[];
  confidence: number;
  response: string;
  actions: string[];
}

export interface TransferRule {
  id: string;
  condition: string;
  target: 'human' | 'voicemail' | 'other_agent';
  priority: number;
}

export interface WorkflowNode {
  id: string;
  type: 'prompt' | 'listen' | 'branch' | 'transfer' | 'end' | 'action';
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTrigger {
  type: 'inbound_call' | 'outbound_call' | 'voicemail_detected' | 'human_requested' | 'call_completed';
  conditions?: Record<string, any>;
}

export interface PhoneNumber {
  id: string;
  number: string;
  country: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'pending';
  routingRules: RoutingRule[];
}

export interface RoutingRule {
  id: string;
  name: string;
  condition: string;
  target: string;
  priority: number;
}

export interface IVRMenu {
  id: string;
  name: string;
  options: IVROption[];
  timeout: number;
  maxRetries: number;
}

export interface IVROption {
  key: string;
  label: string;
  action: string;
  target: string;
}

export interface BusinessHours {
  id: string;
  name: string;
  timezone: string;
  schedule: DaySchedule[];
  holidays: Holiday[];
}

export interface DaySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
}

export interface CustomField {
  id: string;
  entity: 'contact' | 'opportunity' | 'company';
  fieldKey: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

export interface CustomValue {
  id: string;
  key: string;
  value: any;
  group: string;
  description?: string;
}

export interface Integration {
  id: string;
  provider: 'openai' | 'elevenlabs' | 'twilio' | 'webhook' | 'zapier';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  lastSync?: string;
}

export interface ComplianceSettings {
  id: string;
  tcpaChecked: boolean;
  gdprChecked: boolean;
  recordingConsent: boolean;
  dncListMeta: {
    lastUpdated: string;
    recordCount: number;
    source: string;
  };
  consentScripts: {
    inbound: string;
    outbound: string;
    recording: string;
  };
}

export interface TestCall {
  id: string;
  agentId: string;
  workflowId: string;
  transcript: TestTranscript[];
  metrics: TestMetrics;
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
}

export interface TestTranscript {
  speaker: 'agent' | 'caller';
  text: string;
  timestamp: string;
  intent?: string;
  confidence?: number;
}

export interface TestMetrics {
  duration: number;
  intentsDetected: number;
  transfers: number;
  errors: number;
  satisfaction: number;
}

export interface Template {
  id: string;
  name: string;
  industry: 'real_estate' | 'healthcare' | 'ecommerce' | 'service_business';
  description: string;
  voiceAgent: Partial<VoiceAgent>;
  workflow: Partial<Workflow>;
  customFields: CustomField[];
  customValues: CustomValue[];
  playbook: string;
}

export interface AnalyticsSnapshot {
  id: string;
  date: string;
  calls: number;
  connected: number;
  transfers: number;
  bookings: number;
  avgHandleSec: number;
  estCostUSD: number;
  agentId: string;
}

export interface ProjectExport {
  id: string;
  name: string;
  version: string;
  exportedAt: string;
  voiceAgents: VoiceAgent[];
  workflows: Workflow[];
  phoneConfig: {
    numbers: PhoneNumber[];
    routingRules: RoutingRule[];
    ivrMenus: IVRMenu[];
    businessHours: BusinessHours[];
  };
  customFields: CustomField[];
  customValues: CustomValue[];
  integrations: Integration[];
  compliance: ComplianceSettings;
  templates: Template[];
  analytics: AnalyticsSnapshot[];
  implementationGuide: string;
}

// UI State Types
export interface AppState {
  currentModule: string;
  darkMode: boolean;
  sidebarOpen: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Form Types
export interface VoiceAgentForm {
  name: string;
  persona: VoiceAgent['persona'];
  voiceProvider: VoiceAgent['voiceProvider'];
  llmProvider: VoiceAgent['llmProvider'];
  defaultLanguage: string;
  scripts: VoiceAgent['scripts'];
}

export interface WorkflowForm {
  name: string;
  description: string;
  trigger: WorkflowTrigger;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// GHL Merge Tags
export interface MergeTag {
  category: 'contact' | 'opportunity' | 'custom_values' | 'system';
  key: string;
  label: string;
  description: string;
  example: string;
}

// Export/Import Types
export interface ExportOptions {
  includeVoiceAgents: boolean;
  includeWorkflows: boolean;
  includePhoneConfig: boolean;
  includeCustomFields: boolean;
  includeIntegrations: boolean;
  includeCompliance: boolean;
  includeTemplates: boolean;
  includeAnalytics: boolean;
  format: 'json' | 'csv' | 'markdown';
}

// Cost Calculation Types
export interface CostBreakdown {
  llmTokens: number;
  ttsMinutes: number;
  voiceMinutes: number;
  totalCost: number;
  currency: string;
}

export interface ROICalculation {
  leadValue: number;
  baselineConversion: number;
  upliftPercentage: number;
  projectedROI: number;
  breakEvenCalls: number;
}


