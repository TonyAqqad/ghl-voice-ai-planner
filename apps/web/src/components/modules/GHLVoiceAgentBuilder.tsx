import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Phone, 
  Settings, 
  Zap, 
  Play, 
  Pause, 
  Save, 
  Download, 
  Upload,
  Plus,
  Trash2,
  Edit3,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  BarChart3,
  Globe,
  Mic,
  Headphones,
  Volume2,
  MessageSquare,
  Calendar,
  Tag,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Wrench,
  Cog,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Power,
  PowerOff,
  Wifi,
  Signal,
  Database,
  Server,
  FileText,
  FileCheck,
  FileX,
  FileLock,
  FileSearch,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  FileJson,
  File,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Heart,
  Star,
  Award,
  Trophy,
  Medal,
  Crown,
  Flame,
  Rocket,
  Shield,
  CheckSquare,
  Square,
  Circle,
  Dot,
  Minus,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Move,
  GripVertical,
  GripHorizontal,
  MoreHorizontal,
  MoreVertical,
  Menu,
  XCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  QuestionMarkCircle,
  Lightbulb,
  BookOpen,
  Book,
  Bookmark,
  BookmarkCheck,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Timer,
  Stopwatch,
  Hourglass,
  History,
  Archive,
  Inbox,
  Outbox,
  Send,
  Reply,
  Forward,
  Share,
  Link,
  Link2,
  Unlink,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Key as KeyIcon,
  Shield as ShieldIcon,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldOff,
  CheckCircle2,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  HelpCircle as HelpCircleIcon,
  QuestionMarkCircle as QuestionMarkCircleIcon,
  Lightbulb as LightbulbIcon,
  BookOpen as BookOpenIcon,
  Book as BookIcon,
  Bookmark as BookmarkIcon,
  BookmarkCheck as BookmarkCheckIcon,
  Calendar as CalendarIcon2,
  Clock as ClockIcon2,
  Timer as TimerIcon,
  Stopwatch as StopwatchIcon,
  Hourglass as HourglassIcon,
  History as HistoryIcon,
  Archive as ArchiveIcon,
  Inbox as InboxIcon,
  Outbox as OutboxIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Share as ShareIcon,
  Link as LinkIcon,
  Link2 as Link2Icon,
  Unlink as UnlinkIcon,
  Lock as LockIcon2,
  Unlock as UnlockIcon2,
  Key as KeyIcon2,
  Shield as ShieldIcon2,
  ShieldCheck as ShieldCheckIcon,
  ShieldAlert as ShieldAlertIcon,
  ShieldX as ShieldXIcon,
  ShieldOff as ShieldOffIcon
} from 'lucide-react';

interface GHLVoiceAgent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  voiceSettings: {
    provider: 'elevenlabs' | 'azure' | 'google' | 'aws';
    voiceId: string;
    voiceName: string;
    speed: number;
    pitch: number;
    stability: number;
    clarity: number;
  };
  conversationSettings: {
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'claude-2';
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    conversationMemory: boolean;
    contextWindow: number;
  };
  ghlIntegration: {
    webhookUrl: string;
    apiKey: string;
    subAccountId: string;
    phoneNumber: string;
    workflowId: string;
    customFields: Array<{
      fieldName: string;
      fieldValue: string;
      isRequired: boolean;
    }>;
    tags: string[];
    followUpActions: Array<{
      trigger: string;
      action: string;
      delay: number;
    }>;
  };
  scripts: {
    greeting: string;
    main: string;
    fallback: string;
    transfer: string;
    goodbye: string;
    hold: string;
    error: string;
  };
  intents: Array<{
    name: string;
    description: string;
    phrases: string[];
    responses: string[];
    actions: string[];
  }>;
  transferRules: Array<{
    condition: string;
    department: string;
    phoneNumber: string;
    message: string;
  }>;
  compliance: {
    tcpaCompliant: boolean;
    gdprCompliant: boolean;
    recordingConsent: boolean;
    dncListCheck: boolean;
    consentScript: string;
  };
  analytics: {
    totalCalls: number;
    successfulCalls: number;
    averageDuration: number;
    conversionRate: number;
    costPerCall: number;
    lastCall: string;
  };
  createdAt: string;
  updatedAt: string;
}

const GHLVoiceAgentBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [agents, setAgents] = useState<GHLVoiceAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<GHLVoiceAgent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Sample data
  useEffect(() => {
    setAgents([
      {
        id: '1',
        name: 'F45 Fitness Sales Agent',
        description: 'High-converting sales agent for F45 fitness classes',
        status: 'active',
        voiceSettings: {
          provider: 'elevenlabs',
          voiceId: 'voice_001',
          voiceName: 'Sarah',
          speed: 1.0,
          pitch: 1.0,
          stability: 0.8,
          clarity: 0.9
        },
        conversationSettings: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are a friendly, energetic sales agent for F45 Training. Your goal is to book fitness class appointments and convert leads into members.',
          conversationMemory: true,
          contextWindow: 10
        },
        ghlIntegration: {
          webhookUrl: 'https://api.gohighlevel.com/webhooks/voice-ai',
          apiKey: 'ghl_***',
          subAccountId: 'sub_123',
          phoneNumber: '+1 (555) 123-4567',
          workflowId: 'wf_456',
          customFields: [
            { fieldName: 'fitness_goals', fieldValue: 'Weight Loss', isRequired: true },
            { fieldName: 'experience_level', fieldValue: 'Beginner', isRequired: false }
          ],
          tags: ['fitness', 'sales', 'high-priority'],
          followUpActions: [
            { trigger: 'appointment_booked', action: 'send_confirmation_email', delay: 0 },
            { trigger: 'no_show', action: 'reschedule_call', delay: 24 }
          ]
        },
        scripts: {
          greeting: 'Hi! This is Sarah from F45 Training. I\'m calling because you expressed interest in trying our high-intensity fitness classes.',
          main: 'I\'d love to help you find the perfect class time. What works best for your schedule?',
          fallback: 'I\'m sorry, I didn\'t catch that. Could you repeat that for me?',
          transfer: 'Let me connect you with one of our fitness experts who can help you better.',
          goodbye: 'Thanks for your time! I\'ll send you a text with our class schedule. Have a great day!',
          hold: 'Please hold while I check our availability for you.',
          error: 'I apologize, but I\'m having trouble processing that. Let me transfer you to a human representative.'
        },
        intents: [
          {
            name: 'book_appointment',
            description: 'Customer wants to book a fitness class',
            phrases: ['book a class', 'schedule appointment', 'when can I come in'],
            responses: ['Great! Let me check our availability for you.'],
            actions: ['check_calendar', 'book_appointment']
          },
          {
            name: 'pricing_inquiry',
            description: 'Customer asks about pricing',
            phrases: ['how much does it cost', 'what are your prices', 'membership fees'],
            responses: ['Our classes start at $15 per class, but we have great membership packages available.'],
            actions: ['explain_pricing', 'offer_discount']
          }
        ],
        transferRules: [
          {
            condition: 'complex_question',
            department: 'Sales',
            phoneNumber: '+1 (555) 123-4568',
            message: 'Transferring you to our sales team for more detailed information.'
          }
        ],
        compliance: {
          tcpaCompliant: true,
          gdprCompliant: true,
          recordingConsent: true,
          dncListCheck: true,
          consentScript: 'This call may be recorded for quality and training purposes.'
        },
        analytics: {
          totalCalls: 1250,
          successfulCalls: 1100,
          averageDuration: 180,
          conversionRate: 0.35,
          costPerCall: 0.85,
          lastCall: '2024-01-15T10:30:00Z'
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ]);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'voice', label: 'Voice Settings', icon: Mic },
    { id: 'conversation', label: 'Conversation', icon: MessageSquare },
    { id: 'ghl', label: 'GHL Integration', icon: Database },
    { id: 'scripts', label: 'Scripts', icon: FileText },
    { id: 'intents', label: 'Intents', icon: Brain },
    { id: 'transfer', label: 'Transfer Rules', icon: Phone },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'testing', label: 'Testing', icon: Play }
  ];

  const handleCreateAgent = () => {
    setIsCreating(true);
    // Implementation for creating new agent
  };

  const handleEditAgent = (agent: GHLVoiceAgent) => {
    setSelectedAgent(agent);
    setIsEditing(true);
  };

  const handleTestAgent = (agent: GHLVoiceAgent) => {
    setSelectedAgent(agent);
    setIsTesting(true);
  };

  const handleDeployAgent = async (agent: GHLVoiceAgent) => {
    try {
      console.log('Deploying agent:', agent.name);
      
      // Get tokens from backend
      const response = await fetch('https://ghlvoiceai.captureclient.com/api/tokens/latest');
      const tokens = await response.json();
      
      if (!tokens || tokens.expired) {
        alert('Please connect to GHL first via the GHL API Connector');
        return;
      }

      // Prepare deployment payload
      const deploymentPayload = {
        name: agent.name,
        description: agent.description,
        voiceSettings: agent.voiceSettings,
        conversationSettings: agent.conversationSettings,
        ghlIntegration: agent.ghlIntegration,
        scripts: agent.scripts,
        intents: agent.intents,
        transferRules: agent.transferRules,
        compliance: agent.compliance,
        access_token: tokens.access_token,
        locationId: tokens.locationId
      };

      // Deploy via backend API
      const deployResponse = await fetch('https://ghlvoiceai.captureclient.com/api/voice-ai/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deploymentPayload)
      });

      if (!deployResponse.ok) {
        throw new Error('Failed to deploy agent');
      }

      const result = await deployResponse.json();
      alert(`Agent deployed successfully! Deployment ID: ${result.deploymentId}`);
      
      // Refresh agent status
      setAgents(prev => prev.map(a => 
        a.id === agent.id ? { ...a, status: 'active' } : a
      ));
    } catch (error: any) {
      console.error('Deployment error:', error);
      alert(`Failed to deploy agent: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Voice Agent Builder</h1>
            <p className="text-muted-foreground">
              Build and deploy Voice AI agents directly into GoHighLevel
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreateAgent}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </button>
            <button className="btn btn-outline">
              <Download className="w-4 h-4 mr-2" />
              Import
            </button>
            <button className="btn btn-outline">
              <Upload className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {agents.map((agent) => (
          <div key={agent.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  agent.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : agent.status === 'inactive'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {agent.status}
                </span>
                <div className="relative group">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                    <div className="py-1">
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleTestAgent(agent)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Test
                      </button>
                      <button
                        onClick={() => handleDeployAgent(agent)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Deploy
                      </button>
                      <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </button>
                      <button className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{agent.analytics.totalCalls}</div>
                <div className="text-xs text-muted-foreground">Total Calls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.round(agent.analytics.conversionRate * 100)}%</div>
                <div className="text-xs text-muted-foreground">Conversion</div>
              </div>
            </div>

            {/* GHL Integration Status */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>GHL Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-green-600" />
                <span>{agent.ghlIntegration.phoneNumber}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleEditAgent(agent)}
                className="flex-1 btn btn-outline btn-sm"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleTestAgent(agent)}
                className="flex-1 btn btn-primary btn-sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Test
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold">{agents.length}</p>
            </div>
            <Bot className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
              <p className="text-2xl font-bold">{agents.filter(a => a.status === 'active').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold">{agents.reduce((sum, agent) => sum + agent.analytics.totalCalls, 0)}</p>
            </div>
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Conversion</p>
              <p className="text-2xl font-bold">
                {Math.round(agents.reduce((sum, agent) => sum + agent.analytics.conversionRate, 0) / agents.length * 100)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* GHL Integration Status */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">GoHighLevel Integration</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600">Connected</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">API Connection</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Phone Numbers</p>
              <p className="text-xs text-muted-foreground">2 Active</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium">Workflows</p>
              <p className="text-xs text-muted-foreground">5 Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">F45 Fitness Sales Agent deployed successfully</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">New call completed - 3:45 duration</p>
              <p className="text-xs text-muted-foreground">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Settings className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Voice settings updated for Legal Agent</p>
              <p className="text-xs text-muted-foreground">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHLVoiceAgentBuilder;
