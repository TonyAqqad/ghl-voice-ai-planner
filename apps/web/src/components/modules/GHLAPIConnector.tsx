import React, { useState, useEffect } from 'react';
import { ghlApiClient } from '../../utils/ghlApi';
import { 
  Database, 
  Key, 
  Shield, 
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
  Wrench, 
  Cog, 
  Sliders, 
  ToggleLeft, 
  ToggleRight, 
  Power, 
  PowerOff, 
  Wifi, 
  Signal, 
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
  Upload,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Play,
  Pause,
  Save,
  Zap,
  Workflow
} from 'lucide-react';

interface GHLConnection {
  id: string;
  name: string;
  subAccountId: string;
  apiKey: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  permissions: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    remaining: number;
    resetTime: string;
  };
  endpoints: {
    contacts: boolean;
    opportunities: boolean;
    appointments: boolean;
    workflows: boolean;
    campaigns: boolean;
    voiceAi: boolean;
  };
  webhooks: Array<{
    id: string;
    url: string;
    events: string[];
    status: 'active' | 'inactive';
  }>;
}

interface GHLData {
  contacts: {
    total: number;
    newToday: number;
    lastSync: string;
  };
  opportunities: {
    total: number;
    newToday: number;
    lastSync: string;
  };
  appointments: {
    total: number;
    newToday: number;
    lastSync: string;
  };
  workflows: {
    total: number;
    active: number;
    lastSync: string;
  };
  campaigns: {
    total: number;
    active: number;
    lastSync: string;
  };
}

const GHLAPIConnector: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [connections, setConnections] = useState<GHLConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<GHLConnection | null>(null);
  const [ghlData, setGhlData] = useState<GHLData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sample data
  useEffect(() => {
    setConnections([
      {
        id: '1',
        name: 'Main Agency Account',
        subAccountId: 'sub_123456',
        apiKey: 'ghl_***',
        status: 'connected',
        lastSync: '2024-01-15T10:30:00Z',
        permissions: [
          'contacts:read',
          'contacts:write',
          'opportunities:read',
          'opportunities:write',
          'appointments:read',
          'appointments:write',
          'workflows:read',
          'workflows:write',
          'campaigns:read',
          'campaigns:write',
          'voice_ai:read',
          'voice_ai:write'
        ],
        rateLimits: {
          requestsPerMinute: 1000,
          requestsPerDay: 100000,
          remaining: 850,
          resetTime: '2024-01-15T11:00:00Z'
        },
        endpoints: {
          contacts: true,
          opportunities: true,
          appointments: true,
          workflows: true,
          campaigns: true,
          voiceAi: true
        },
        webhooks: [
          {
            id: '1',
            url: 'https://api.gohighlevel.com/webhooks/voice-ai',
            events: ['contact.created', 'contact.updated', 'call.completed'],
            status: 'active'
          }
        ]
      }
    ]);

    setGhlData({
      contacts: {
        total: 15420,
        newToday: 45,
        lastSync: '2024-01-15T10:30:00Z'
      },
      opportunities: {
        total: 2340,
        newToday: 12,
        lastSync: '2024-01-15T10:30:00Z'
      },
      appointments: {
        total: 890,
        newToday: 8,
        lastSync: '2024-01-15T10:30:00Z'
      },
      workflows: {
        total: 25,
        active: 18,
        lastSync: '2024-01-15T10:30:00Z'
      },
      campaigns: {
        total: 12,
        active: 8,
        lastSync: '2024-01-15T10:30:00Z'
      }
    });
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'connections', label: 'Connections', icon: Database },
    { id: 'data', label: 'Data Sync', icon: RefreshCw },
    { id: 'webhooks', label: 'Webhooks', icon: Link },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'logs', label: 'Logs', icon: FileText }
  ];

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const authUrl = await ghlApiClient.initializeAuth();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initialize GHL OAuth:', error);
      setIsConnecting(false);
    }
  };

  const handleSync = (connectionId: string) => {
    setIsSyncing(true);
    // Implementation for syncing data
  };

  const handleTestConnection = async (connection: GHLConnection) => {
    try {
      const isConnected = await ghlApiClient.testConnection();
      if (isConnected) {
        console.log('Connection test successful:', connection.name);
      } else {
        console.log('Connection test failed:', connection.name);
      }
    } catch (error) {
      console.error('Connection test error:', error);
    }
  };

  const handleDisconnect = (connectionId: string) => {
    console.log('Disconnecting:', connectionId);
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL API Connector</h1>
            <p className="text-muted-foreground">
              Connect and manage your GoHighLevel API integrations
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleConnect}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Account
            </button>
            <button className="btn btn-outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Connected Accounts</p>
              <p className="text-2xl font-bold">{connections.length}</p>
            </div>
            <Database className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Connections</p>
              <p className="text-2xl font-bold">{connections.filter(c => c.status === 'connected').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
              <p className="text-2xl font-bold">
                {ghlData ? new Date(ghlData.contacts.lastSync).toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Connections List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {connections.map((connection) => (
          <div key={connection.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{connection.name}</h3>
                  <p className="text-sm text-muted-foreground">Sub Account: {connection.subAccountId}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  connection.status === 'connected' 
                    ? 'bg-green-100 text-green-800' 
                    : connection.status === 'disconnected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {connection.status}
                </span>
                <div className="relative group">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                    <div className="py-1">
                      <button
                        onClick={() => handleTestConnection(connection)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Test Connection
                      </button>
                      <button
                        onClick={() => handleSync(connection.id)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync Data
                      </button>
                      <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDisconnect(connection.id)}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <PowerOff className="w-4 h-4 mr-2" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* API Key */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Key className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">API Key</span>
              </div>
              <div className="flex items-center space-x-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{connection.apiKey}</code>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Rate Limits */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Rate Limits</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {connection.rateLimits.remaining} / {connection.rateLimits.requestsPerMinute} requests remaining
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${(connection.rateLimits.remaining / connection.rateLimits.requestsPerMinute) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Endpoints */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Server className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Available Endpoints</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(connection.endpoints).map(([endpoint, available]) => (
                  <div key={endpoint} className="flex items-center space-x-2">
                    {available ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs capitalize">{endpoint.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Sync */}
            <div className="text-sm text-muted-foreground">
              Last sync: {new Date(connection.lastSync).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Data Overview */}
      {ghlData && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Data Overview</h2>
            <button
              onClick={() => handleSync(connections[0]?.id)}
              className="btn btn-outline btn-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{ghlData.contacts.total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Contacts</div>
              <div className="text-xs text-green-600">+{ghlData.contacts.newToday} today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{ghlData.opportunities.total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Opportunities</div>
              <div className="text-xs text-green-600">+{ghlData.opportunities.newToday} today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{ghlData.appointments.total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Appointments</div>
              <div className="text-xs text-green-600">+{ghlData.appointments.newToday} today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{ghlData.workflows.total}</div>
              <div className="text-sm text-muted-foreground">Workflows</div>
              <div className="text-xs text-blue-600">{ghlData.workflows.active} active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{ghlData.campaigns.total}</div>
              <div className="text-sm text-muted-foreground">Campaigns</div>
              <div className="text-xs text-blue-600">{ghlData.campaigns.active} active</div>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Webhooks</h2>
          <button className="btn btn-outline btn-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </button>
        </div>
        <div className="space-y-4">
          {connections.flatMap(c => c.webhooks).map((webhook, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Link className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{webhook.url}</p>
                  <p className="text-xs text-muted-foreground">
                    Events: {webhook.events.join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  webhook.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {webhook.status}
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
              <p className="text-sm font-medium">Data sync completed successfully</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">New connection established</p>
              <p className="text-xs text-muted-foreground">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Link className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Webhook configuration updated</p>
              <p className="text-xs text-muted-foreground">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHLAPIConnector;
