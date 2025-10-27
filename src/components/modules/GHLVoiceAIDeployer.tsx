import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Play, 
  Pause, 
  Stop, 
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
  Zap, 
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
  MoreHorizontal as MoreHorizontalIcon,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus as PlusIcon,
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
  QuestionMarkCircle as QuestionMarkCircleIcon3,
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
  MoreVertical as MoreVerticalIcon,
  MoreHorizontal as MoreHorizontalIcon2,
  ChevronUp as ChevronUpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  Plus as PlusIcon2,
  Minus as MinusIcon,
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

interface Deployment {
  id: string;
  name: string;
  description: string;
  voiceAgent: {
    id: string;
    name: string;
    version: string;
  };
  environment: 'development' | 'staging' | 'production';
  status: 'deploying' | 'active' | 'paused' | 'error' | 'stopped';
  phoneNumbers: string[];
  webhooks: Array<{
    url: string;
    events: string[];
    status: 'active' | 'inactive';
  }>;
  configuration: {
    maxConcurrentCalls: number;
    callTimeout: number;
    retryAttempts: number;
    fallbackNumber: string;
  };
  metrics: {
    totalCalls: number;
    activeCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageCallDuration: number;
    uptime: number;
  };
  health: {
    status: 'healthy' | 'warning' | 'critical';
    lastCheck: string;
    issues: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const GHLVoiceAIDeployer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedDeployments, setSelectedDeployments] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEnvironment, setFilterEnvironment] = useState('all');

  // Sample data
  useEffect(() => {
    setDeployments([
      {
        id: '1',
        name: 'F45 Fitness Sales Agent - Production',
        description: 'Production deployment of F45 fitness sales agent',
        voiceAgent: {
          id: 'agent_1',
          name: 'Sarah - Fitness Sales Agent',
          version: 'v2.1.0'
        },
        environment: 'production',
        status: 'active',
        phoneNumbers: ['+1-555-0123', '+1-555-0124'],
        webhooks: [
          {
            url: 'https://api.gohighlevel.com/webhooks/voice-ai',
            events: ['call.started', 'call.ended', 'transcript.ready'],
            status: 'active'
          }
        ],
        configuration: {
          maxConcurrentCalls: 50,
          callTimeout: 300,
          retryAttempts: 3,
          fallbackNumber: '+1-555-0000'
        },
        metrics: {
          totalCalls: 1250,
          activeCalls: 3,
          successfulCalls: 1180,
          failedCalls: 70,
          averageCallDuration: 180,
          uptime: 99.8
        },
        health: {
          status: 'healthy',
          lastCheck: '2024-01-15T10:30:00Z',
          issues: []
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Legal Consultation Agent - Staging',
        description: 'Staging deployment for legal consultation agent testing',
        voiceAgent: {
          id: 'agent_2',
          name: 'David - Legal Consultation Agent',
          version: 'v1.5.2'
        },
        environment: 'staging',
        status: 'paused',
        phoneNumbers: ['+1-555-0456'],
        webhooks: [
          {
            url: 'https://staging-api.gohighlevel.com/webhooks/voice-ai',
            events: ['call.started', 'call.ended'],
            status: 'active'
          }
        ],
        configuration: {
          maxConcurrentCalls: 10,
          callTimeout: 600,
          retryAttempts: 2,
          fallbackNumber: '+1-555-0001'
        },
        metrics: {
          totalCalls: 300,
          activeCalls: 0,
          successfulCalls: 280,
          failedCalls: 20,
          averageCallDuration: 240,
          uptime: 98.5
        },
        health: {
          status: 'warning',
          lastCheck: '2024-01-15T10:25:00Z',
          issues: ['High memory usage detected']
        },
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-14T15:20:00Z'
      }
    ]);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'deployments', label: 'Deployments', icon: Rocket },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'health', label: 'Health', icon: Shield }
  ];

  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = deployment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || deployment.status === filterStatus;
    const matchesEnvironment = filterEnvironment === 'all' || deployment.environment === filterEnvironment;
    
    return matchesSearch && matchesStatus && matchesEnvironment;
  });

  const handleDeploy = (deployment: Deployment) => {
    setIsDeploying(true);
    console.log('Deploying:', deployment.name);
  };

  const handlePause = (deployment: Deployment) => {
    console.log('Pausing:', deployment.name);
  };

  const handleStop = (deployment: Deployment) => {
    console.log('Stopping:', deployment.name);
  };

  const handleRestart = (deployment: Deployment) => {
    console.log('Restarting:', deployment.name);
  };

  const handleEdit = (deployment: Deployment) => {
    console.log('Editing:', deployment.name);
  };

  const handleDelete = (deployment: Deployment) => {
    console.log('Deleting:', deployment.name);
  };

  const handleBulkAction = (action: string) => {
    console.log('Bulk action:', action, 'on deployments:', selectedDeployments);
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Voice AI Deployer</h1>
            <p className="text-muted-foreground">
              Deploy and manage Voice AI agents in GoHighLevel environments
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => console.log('Create deployment')}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Deploy Agent
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
              <p className="text-sm font-medium text-muted-foreground">Total Deployments</p>
              <p className="text-2xl font-bold">{deployments.length}</p>
            </div>
            <Rocket className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{deployments.filter(d => d.status === 'active').length}</p>
            </div>
            <Play className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold">{deployments.reduce((sum, d) => sum + d.metrics.totalCalls, 0)}</p>
            </div>
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Uptime</p>
              <p className="text-2xl font-bold">
                {Math.round(deployments.reduce((sum, d) => sum + d.metrics.uptime, 0) / deployments.length)}%
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
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
                placeholder="Search deployments..."
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
              <option value="deploying">Deploying</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="error">Error</option>
              <option value="stopped">Stopped</option>
            </select>
            <select
              value={filterEnvironment}
              onChange={(e) => setFilterEnvironment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Environments</option>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deployments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {filteredDeployments.map((deployment) => (
          <div key={deployment.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{deployment.name}</h3>
                  <p className="text-sm text-muted-foreground">{deployment.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  deployment.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : deployment.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800'
                    : deployment.status === 'deploying'
                    ? 'bg-blue-100 text-blue-800'
                    : deployment.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {deployment.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  deployment.environment === 'production' 
                    ? 'bg-red-100 text-red-800' 
                    : deployment.environment === 'staging'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {deployment.environment}
                </span>
                <div className="relative group">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                    <div className="py-1">
                      <button
                        onClick={() => handleEdit(deployment)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      {deployment.status === 'active' ? (
                        <button
                          onClick={() => handlePause(deployment)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </button>
                      ) : deployment.status === 'paused' ? (
                        <button
                          onClick={() => handleDeploy(deployment)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleRestart(deployment)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restart
                      </button>
                      <button
                        onClick={() => handleDelete(deployment)}
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
              <div className="text-sm text-muted-foreground">
                {deployment.voiceAgent.name} ({deployment.voiceAgent.version})
              </div>
            </div>

            {/* Phone Numbers */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Phone className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Phone Numbers</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {deployment.phoneNumbers.join(', ')}
              </div>
            </div>

            {/* Health Status */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Health Status</span>
              </div>
              <div className="flex items-center space-x-2">
                {deployment.health.status === 'healthy' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : deployment.health.status === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium capitalize ${
                  deployment.health.status === 'healthy' ? 'text-green-600' :
                  deployment.health.status === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {deployment.health.status}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{deployment.metrics.totalCalls}</div>
                <div className="text-xs text-muted-foreground">Total Calls</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{deployment.metrics.uptime}%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {deployment.status === 'active' ? (
                <button
                  onClick={() => handlePause(deployment)}
                  className="flex-1 btn btn-outline btn-sm"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </button>
              ) : deployment.status === 'paused' ? (
                <button
                  onClick={() => handleDeploy(deployment)}
                  className="flex-1 btn btn-primary btn-sm"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={() => handleDeploy(deployment)}
                  className="flex-1 btn btn-primary btn-sm"
                >
                  <Rocket className="w-4 h-4 mr-1" />
                  Deploy
                </button>
              )}
              <button
                onClick={() => handleEdit(deployment)}
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
        <h2 className="text-xl font-semibold mb-4">Recent Deployment Activity</h2>
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
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Pause className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Legal Consultation Agent paused for maintenance</p>
              <p className="text-xs text-muted-foreground">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Rocket className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">New deployment created: Healthcare Agent v1.0</p>
              <p className="text-xs text-muted-foreground">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHLVoiceAIDeployer;
