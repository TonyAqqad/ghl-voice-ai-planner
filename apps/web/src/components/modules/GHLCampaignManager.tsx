import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Key, 
  Database, 
  Server, 
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
  Calendar, 
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
  Phone,
  MessageSquare,
  Mail,
  PhoneCall,
  Video,
  Image,
  File,
  Folder,
  FolderOpen,
  Building2,
  Car,
  Home,
  Stethoscope,
  GraduationCap,
  ShoppingCart,
  CreditCard,
  Briefcase,
  Utensils,
  Coffee,
  Dumbbell,
  Scissors,
  Wrench,
  Hammer,
  Paintbrush,
  Camera,
  Music,
  Gamepad2,
  Plane,
  Hotel,
  MapPin,
  Globe,
  Tag,
  Zap,
  Workflow,
  Cpu,
  HardDrive,
  Wifi,
  Signal,
  Power,
  PowerOff,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Cog,
  Wrench as WrenchIcon,
  Settings as SettingsIcon,
  Download,
  Upload,
  Share2,
  Copy as CopyIcon,
  Edit,
  Trash,
  MoreVertical as MoreVerticalIcon,
  MoreHorizontal as MoreHorizontalIcon,
  ChevronUp,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  X as XIcon,
  Check as CheckIcon,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon2,
  HelpCircle as HelpCircleIcon2,
  QuestionMarkCircle as QuestionMarkCircleIcon2,
  Lightbulb as LightbulbIcon2,
  BookOpen as BookOpenIcon2,
  Book as BookIcon2,
  Bookmark as BookmarkIcon2,
  BookmarkCheck as BookmarkCheckIcon2,
  Calendar as CalendarIcon3,
  Clock as ClockIcon3,
  Timer as TimerIcon2,
  Stopwatch as StopwatchIcon2,
  Hourglass as HourglassIcon2,
  History as HistoryIcon2,
  Archive as ArchiveIcon2,
  Inbox as InboxIcon2,
  Outbox as OutboxIcon2,
  Send as SendIcon2,
  Reply as ReplyIcon2,
  Forward as ForwardIcon2,
  Share as ShareIcon2,
  Link as LinkIcon2,
  Link2 as Link2Icon2,
  Unlink as UnlinkIcon2,
  Lock as LockIcon3,
  Unlock as UnlockIcon3,
  Key as KeyIcon3,
  Shield as ShieldIcon3,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldOff,
  CheckCircle2,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon3,
  HelpCircle as HelpCircleIcon3,
  QuestionMarkCircle as QuestionMarkQuestionIcon3,
  Lightbulb as LightbulbIcon3,
  BookOpen as BookOpenIcon3,
  Book as BookIcon3,
  Bookmark as BookmarkIcon3,
  BookmarkCheck as BookmarkCheckIcon3,
  Calendar as CalendarIcon4,
  Clock as ClockIcon4,
  Timer as TimerIcon3,
  Stopwatch as StopwatchIcon3,
  Hourglass as HourglassIcon3,
  History as HistoryIcon3,
  Archive as ArchiveIcon3,
  Inbox as InboxIcon3,
  Outbox as OutboxIcon3,
  Send as SendIcon3,
  Reply as ReplyIcon3,
  Forward as ForwardIcon3,
  Share as ShareIcon3,
  Link as LinkIcon3,
  Link2 as Link2Icon3,
  Unlink as UnlinkIcon3,
  Lock as LockIcon4,
  Unlock as UnlockIcon4,
  Key as KeyIcon4,
  Shield as ShieldIcon4,
  ShieldCheck as ShieldCheckIcon2,
  ShieldAlert as ShieldAlertIcon2,
  ShieldX as ShieldXIcon2,
  ShieldOff as ShieldOffIcon2,
  BarChart3,
  Users,
  DollarSign,
  Clock,
  RefreshCw,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Copy as CopyIcon2,
  Edit as EditIcon,
  Trash as TrashIcon,
  MoreVertical as MoreVerticalIcon2,
  MoreHorizontal as MoreHorizontalIcon2,
  ChevronUp as ChevronUpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon2,
  ChevronDown as ChevronDownIcon2,
  Plus as PlusIcon2,
  Minus as MinusIcon2,
  X as XIcon2,
  Check as CheckIcon2,
  AlertTriangle as AlertTriangleIcon2,
  Info as InfoIcon4,
  HelpCircle as HelpCircleIcon4,
  QuestionMarkCircle as QuestionMarkCircleIcon4,
  Lightbulb as LightbulbIcon4,
  BookOpen as BookOpenIcon4,
  Book as BookIcon4,
  Bookmark as BookmarkIcon4,
  BookmarkCheck as BookmarkCheckIcon4,
  Calendar as CalendarIcon5,
  Clock as ClockIcon5,
  Timer as TimerIcon4,
  Stopwatch as StopwatchIcon4,
  Hourglass as HourglassIcon4,
  History as HistoryIcon4,
  Archive as ArchiveIcon4,
  Inbox as InboxIcon4,
  Outbox as OutboxIcon4,
  Send as SendIcon4,
  Reply as ReplyIcon4,
  Forward as ForwardIcon4,
  Share as ShareIcon4,
  Link as LinkIcon4,
  Link2 as Link2Icon4,
  Unlink as UnlinkIcon4,
  Lock as LockIcon5,
  Unlock as UnlockIcon5,
  Key as KeyIcon5,
  Shield as ShieldIcon5,
  ShieldCheck as ShieldCheckIcon3,
  ShieldAlert as ShieldAlertIcon3,
  ShieldX as ShieldXIcon3,
  ShieldOff as ShieldOffIcon3
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'voice_ai' | 'email' | 'sms' | 'mixed';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  voiceAgent: {
    id: string;
    name: string;
    voiceSettings: any;
  };
  targetAudience: {
    segments: string[];
    filters: Record<string, any>;
    estimatedSize: number;
  };
  schedule: {
    startDate: string;
    endDate: string;
    timezone: string;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  };
  budget: {
    total: number;
    spent: number;
    dailyLimit: number;
    currency: string;
  };
  metrics: {
    totalCalls: number;
    answeredCalls: number;
    conversionRate: number;
    costPerCall: number;
    costPerConversion: number;
    averageCallDuration: number;
    satisfactionScore: number;
  };
  createdAt: string;
  updatedAt: string;
}

const GHLCampaignManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Sample data
  useEffect(() => {
    setCampaigns([
      {
        id: '1',
        name: 'F45 Fitness Lead Generation',
        description: 'Voice AI campaign targeting fitness enthusiasts for F45 classes',
        type: 'voice_ai',
        status: 'active',
        voiceAgent: {
          id: 'agent_1',
          name: 'Sarah - Fitness Sales Agent',
          voiceSettings: {
            provider: 'elevenlabs',
            voiceId: 'voice_001',
            speed: 1.0,
            pitch: 1.0
          }
        },
        targetAudience: {
          segments: ['fitness_interested', 'high_income', 'local_area'],
          filters: {
            age: { min: 25, max: 45 },
            income: { min: 50000 },
            location: 'San Francisco Bay Area'
          },
          estimatedSize: 2500
        },
        schedule: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-03-31T23:59:59Z',
          timezone: 'America/Los_Angeles',
          frequency: 'daily'
        },
        budget: {
          total: 10000,
          spent: 3250,
          dailyLimit: 100,
          currency: 'USD'
        },
        metrics: {
          totalCalls: 1250,
          answeredCalls: 875,
          conversionRate: 0.12,
          costPerCall: 2.60,
          costPerConversion: 21.67,
          averageCallDuration: 180,
          satisfactionScore: 4.2
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Legal Consultation Follow-up',
        description: 'Follow-up campaign for legal consultation leads',
        type: 'mixed',
        status: 'paused',
        voiceAgent: {
          id: 'agent_2',
          name: 'David - Legal Consultation Agent',
          voiceSettings: {
            provider: 'azure',
            voiceId: 'voice_002',
            speed: 0.9,
            pitch: 0.8
          }
        },
        targetAudience: {
          segments: ['legal_leads', 'high_value'],
          filters: {
            leadScore: { min: 80 },
            legalMatter: 'personal_injury'
          },
          estimatedSize: 450
        },
        schedule: {
          startDate: '2024-01-10T00:00:00Z',
          endDate: '2024-02-10T23:59:59Z',
          timezone: 'America/New_York',
          frequency: 'weekly'
        },
        budget: {
          total: 5000,
          spent: 1200,
          dailyLimit: 50,
          currency: 'USD'
        },
        metrics: {
          totalCalls: 300,
          answeredCalls: 210,
          conversionRate: 0.18,
          costPerCall: 4.00,
          costPerConversion: 22.22,
          averageCallDuration: 240,
          satisfactionScore: 4.5
        },
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-14T15:20:00Z'
      }
    ]);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    const matchesType = filterType === 'all' || campaign.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateCampaign = () => {
    setIsCreating(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    console.log('Editing campaign:', campaign.name);
  };

  const handleStartCampaign = (campaignId: string) => {
    console.log('Starting campaign:', campaignId);
  };

  const handlePauseCampaign = (campaignId: string) => {
    console.log('Pausing campaign:', campaignId);
  };

  const handleStopCampaign = (campaignId: string) => {
    console.log('Stopping campaign:', campaignId);
  };

  const handleDuplicateCampaign = (campaign: Campaign) => {
    console.log('Duplicating campaign:', campaign.name);
  };

  const handleDeleteCampaign = (campaignId: string) => {
    console.log('Deleting campaign:', campaignId);
  };

  const handleBulkAction = (action: string) => {
    console.log('Bulk action:', action, 'on campaigns:', selectedCampaigns);
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Campaign Manager</h1>
            <p className="text-muted-foreground">
              Advanced campaign management for Voice AI and multi-channel marketing
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreateCampaign}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </button>
            <button className="btn btn-outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button className="btn btn-outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.length}</p>
            </div>
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</p>
            </div>
            <Play className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold">{campaigns.reduce((sum, c) => sum + c.metrics.totalCalls, 0)}</p>
            </div>
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Conversion</p>
              <p className="text-2xl font-bold">
                {Math.round(campaigns.reduce((sum, c) => sum + c.metrics.conversionRate, 0) / campaigns.length * 100)}%
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="voice_ai">Voice AI</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {filteredCampaigns.map((campaign) => (
          <div key={campaign.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{campaign.name}</h3>
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  campaign.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : campaign.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800'
                    : campaign.status === 'draft'
                    ? 'bg-gray-100 text-gray-800'
                    : campaign.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {campaign.status}
                </span>
                <div className="relative group">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                    <div className="py-1">
                      <button
                        onClick={() => handleEditCampaign(campaign)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicateCampaign(campaign)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </button>
                      {campaign.status === 'active' ? (
                        <button
                          onClick={() => handlePauseCampaign(campaign.id)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </button>
                      ) : campaign.status === 'paused' ? (
                        <button
                          onClick={() => handleStartCampaign(campaign.id)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Agent Info */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Bot className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Voice Agent</span>
              </div>
              <div className="text-sm text-muted-foreground">{campaign.voiceAgent.name}</div>
            </div>

            {/* Target Audience */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Target Audience</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {campaign.targetAudience.estimatedSize.toLocaleString()} contacts
              </div>
            </div>

            {/* Budget Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">
                  ${campaign.budget.spent.toLocaleString()} / ${campaign.budget.total.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(campaign.budget.spent / campaign.budget.total) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{campaign.metrics.totalCalls}</div>
                <div className="text-xs text-muted-foreground">Total Calls</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {Math.round(campaign.metrics.conversionRate * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Conversion</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {campaign.status === 'active' ? (
                <button
                  onClick={() => handlePauseCampaign(campaign.id)}
                  className="flex-1 btn btn-outline btn-sm"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </button>
              ) : campaign.status === 'paused' ? (
                <button
                  onClick={() => handleStartCampaign(campaign.id)}
                  className="flex-1 btn btn-primary btn-sm"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={() => handleStartCampaign(campaign.id)}
                  className="flex-1 btn btn-primary btn-sm"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </button>
              )}
              <button
                onClick={() => handleEditCampaign(campaign)}
                className="flex-1 btn btn-outline btn-sm"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Play className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">F45 Fitness Lead Generation campaign started</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">New campaign created: Healthcare Follow-up</p>
              <p className="text-xs text-muted-foreground">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Pause className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Legal Consultation Follow-up campaign paused</p>
              <p className="text-xs text-muted-foreground">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHLCampaignManager;
