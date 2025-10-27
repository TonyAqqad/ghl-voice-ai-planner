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
  Notification
} from '../types';

interface GHLStore {
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
}

export const useStore = create<GHLStore>()(
  persist(
    (set, get) => ({
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
      })
    }),
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
        darkMode: state.darkMode
      })
    }
  )
);


