import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  Zap, 
  Play, 
  Pause, 
  Save, 
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
  Phone, 
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
  Bot,
  Mic,
  Headphones,
  Volume2,
  Settings,
  Download,
  Upload
} from 'lucide-react';

interface GHLWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  trigger: {
    type: 'transcript_generated' | 'call_status' | 'contact_created' | 'appointment_status' | 'form_submitted' | 'custom_date_reminder';
    conditions: Record<string, any>;
  };
  actions: Array<{
    id: string;
    type: 'send_email' | 'send_sms' | 'add_tag' | 'update_field' | 'create_opportunity' | 'webhook' | 'voice_ai_call' | 'wait';
    config: Record<string, any>;
    order: number;
  }>;
  voiceAiIntegration: {
    agentId: string;
    agentName: string;
    customActions: Array<{
      triggerPhrases: string[];
      webhookUrl: string;
      headers: Record<string, string>;
      body: Record<string, any>;
      responseMapping: Record<string, string>;
    }>;
  };
  analytics: {
    totalRuns: number;
    successfulRuns: number;
    averageExecutionTime: number;
    lastRun: string;
    errorRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

const GHLWorkflowIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [workflows, setWorkflows] = useState<GHLWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<GHLWorkflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Sample data
  useEffect(() => {
    setWorkflows([
      {
        id: '1',
        name: 'Voice AI Lead Qualification',
        description: 'Automatically qualifies leads after Voice AI calls',
        status: 'active',
        trigger: {
          type: 'transcript_generated',
          conditions: {
            callType: 'voice_ai',
            duration: { min: 30 },
            keywords: ['interested', 'schedule', 'appointment']
          }
        },
        actions: [
          {
            id: '1',
            type: 'add_tag',
            config: {
              tagName: 'Voice AI Qualified',
              tagColor: 'green'
            },
            order: 1
          },
          {
            id: '2',
            type: 'update_field',
            config: {
              fieldName: 'lead_score',
              fieldValue: '85',
              fieldType: 'number'
            },
            order: 2
          },
          {
            id: '3',
            type: 'send_email',
            config: {
              templateId: 'voice_ai_followup',
              subject: 'Thanks for your interest!',
              to: '{{contact.email}}'
            },
            order: 3
          },
          {
            id: '4',
            type: 'create_opportunity',
            config: {
              pipelineId: 'sales_pipeline',
              stageId: 'qualified',
              value: '{{contact.estimated_value}}',
              source: 'Voice AI'
            },
            order: 4
          }
        ],
        voiceAiIntegration: {
          agentId: 'agent_1',
          agentName: 'F45 Fitness Sales Agent',
          customActions: [
            {
              triggerPhrases: ['check availability', 'when can I come in', 'schedule'],
              webhookUrl: 'https://api.gohighlevel.com/webhooks/check-availability',
              headers: {
                'Authorization': 'Bearer {{api_key}}',
                'Content-Type': 'application/json'
              },
              body: {
                contactId: '{{contact.id}}',
                requestedDate: '{{extracted_date}}',
                classType: '{{extracted_class_type}}'
              },
              responseMapping: {
                'available_slots': 'available_times',
                'next_available': 'next_class'
              }
            }
          ]
        },
        analytics: {
          totalRuns: 450,
          successfulRuns: 420,
          averageExecutionTime: 2.5,
          lastRun: '2024-01-15T10:30:00Z',
          errorRate: 0.067
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Appointment Confirmation',
        description: 'Sends confirmation after appointment booking',
        status: 'active',
        trigger: {
          type: 'appointment_status',
          conditions: {
            status: 'booked',
            appointmentType: 'fitness_class'
          }
        },
        actions: [
          {
            id: '1',
            type: 'send_sms',
            config: {
              message: 'Your F45 class is confirmed for {{appointment.date}} at {{appointment.time}}. See you there!',
              to: '{{contact.phone}}'
            },
            order: 1
          },
          {
            id: '2',
            type: 'send_email',
            config: {
              templateId: 'appointment_confirmation',
              subject: 'Class Confirmed - {{appointment.date}}',
              to: '{{contact.email}}'
            },
            order: 2
          }
        ],
        voiceAiIntegration: {
          agentId: 'agent_1',
          agentName: 'F45 Fitness Sales Agent',
          customActions: []
        },
        analytics: {
          totalRuns: 1200,
          successfulRuns: 1180,
          averageExecutionTime: 1.2,
          lastRun: '2024-01-15T09:45:00Z',
          errorRate: 0.017
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T09:45:00Z'
      }
    ]);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'triggers', label: 'Triggers', icon: Zap },
    { id: 'actions', label: 'Actions', icon: Workflow },
    { id: 'voice-ai', label: 'Voice AI', icon: Bot },
    { id: 'testing', label: 'Testing', icon: Play },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const triggerTypes = [
    { id: 'transcript_generated', label: 'Transcript Generated', icon: FileText, description: 'When Voice AI call transcript is ready' },
    { id: 'call_status', label: 'Call Status', icon: Phone, description: 'When call status changes' },
    { id: 'contact_created', label: 'Contact Created', icon: Users, description: 'When new contact is added' },
    { id: 'appointment_status', label: 'Appointment Status', icon: Calendar, description: 'When appointment status changes' },
    { id: 'form_submitted', label: 'Form Submitted', icon: FileCheck, description: 'When form is submitted' },
    { id: 'custom_date_reminder', label: 'Custom Date Reminder', icon: Clock, description: 'Based on custom date field' }
  ];

  const actionTypes = [
    { id: 'send_email', label: 'Send Email', icon: Send, description: 'Send email to contact' },
    { id: 'send_sms', label: 'Send SMS', icon: MessageSquare, description: 'Send SMS to contact' },
    { id: 'add_tag', label: 'Add Tag', icon: Tag, description: 'Add tag to contact' },
    { id: 'update_field', label: 'Update Field', icon: Edit3, description: 'Update contact field' },
    { id: 'create_opportunity', label: 'Create Opportunity', icon: Target, description: 'Create new opportunity' },
    { id: 'webhook', label: 'Webhook', icon: Link, description: 'Send webhook request' },
    { id: 'voice_ai_call', label: 'Voice AI Call', icon: Bot, description: 'Trigger Voice AI call' },
    { id: 'wait', label: 'Wait', icon: Clock, description: 'Wait for specified time' }
  ];

  const handleCreateWorkflow = () => {
    setIsCreating(true);
  };

  const handleEditWorkflow = (workflow: GHLWorkflow) => {
    setSelectedWorkflow(workflow);
    setIsEditing(true);
  };

  const handleTestWorkflow = (workflow: GHLWorkflow) => {
    setSelectedWorkflow(workflow);
    setIsTesting(true);
  };

  const handleDeployWorkflow = (workflow: GHLWorkflow) => {
    console.log('Deploying workflow:', workflow.name);
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Workflow Integration</h1>
            <p className="text-muted-foreground">
              Create and manage Voice AI workflows in GoHighLevel
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreateWorkflow}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
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

      {/* Workflow List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Workflow className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{workflow.name}</h3>
                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  workflow.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : workflow.status === 'inactive'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {workflow.status}
                </span>
                <div className="relative group">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                    <div className="py-1">
                      <button
                        onClick={() => handleEditWorkflow(workflow)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleTestWorkflow(workflow)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Test
                      </button>
                      <button
                        onClick={() => handleDeployWorkflow(workflow)}
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

            {/* Trigger Info */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Trigger</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {triggerTypes.find(t => t.id === workflow.trigger.type)?.label}
              </div>
            </div>

            {/* Actions Count */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Workflow className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Actions</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Voice AI Integration */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Bot className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Voice AI</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {workflow.voiceAiIntegration.agentName}
              </div>
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{workflow.analytics.totalRuns}</div>
                <div className="text-xs text-muted-foreground">Total Runs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {Math.round((1 - workflow.analytics.errorRate) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleEditWorkflow(workflow)}
                className="flex-1 btn btn-outline btn-sm"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleTestWorkflow(workflow)}
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
              <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
              <p className="text-2xl font-bold">{workflows.length}</p>
            </div>
            <Workflow className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Workflows</p>
              <p className="text-2xl font-bold">{workflows.filter(w => w.status === 'active').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
              <p className="text-2xl font-bold">{workflows.reduce((sum, w) => sum + w.analytics.totalRuns, 0)}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Success Rate</p>
              <p className="text-2xl font-bold">
                {Math.round(workflows.reduce((sum, w) => sum + (1 - w.analytics.errorRate), 0) / workflows.length * 100)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Voice AI Custom Actions */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Voice AI Custom Actions</h2>
          <button className="btn btn-outline btn-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Action
          </button>
        </div>
        <div className="space-y-4">
          {workflows.flatMap(w => w.voiceAiIntegration.customActions).map((action, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Real-time Webhook</p>
                  <p className="text-xs text-muted-foreground">
                    Triggers: {action.triggerPhrases.join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Active
                </span>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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
              <p className="text-sm font-medium">Voice AI Lead Qualification workflow executed successfully</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Workflow className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">New workflow created: Appointment Follow-up</p>
              <p className="text-xs text-muted-foreground">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Voice AI custom action updated</p>
              <p className="text-xs text-muted-foreground">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHLWorkflowIntegration;
