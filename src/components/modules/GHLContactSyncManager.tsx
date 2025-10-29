import React, { useState, useEffect } from 'react';
import { 
  Users, 
  RefreshCw, 
  Download,
  FileText, 
  Upload, 
  Filter, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  BarChart3, 
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
  Download as DownloadIcon,
  Upload as UploadIcon,
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
  ShieldOff as ShieldOffIcon2
} from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  tags: string[];
  customFields: Record<string, any>;
  lastContacted: string;
  leadScore: number;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  ghlId: string;
  syncStatus: 'synced' | 'pending' | 'error' | 'conflict';
  lastSync: string;
  voiceAiCalls: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

interface SyncRule {
  id: string;
  name: string;
  description: string;
  source: string;
  conditions: Record<string, any>;
  actions: string[];
  isActive: boolean;
  lastRun: string;
  successCount: number;
  errorCount: number;
}

const GHLContactSyncManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [syncRules, setSyncRules] = useState<SyncRule[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  // Load contacts from GHL API
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await fetch('https://ghlvoiceai.captureclient.com/api/ghl/contacts');
      if (response.ok) {
        const data = await response.json();
        if (data.contacts) {
          setContacts(data.contacts);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load contacts from API:', error);
    }
    
    // Fallback to sample data if API fails
    setContacts([
      {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+1-555-0123',
        company: 'Tech Solutions Inc',
        source: 'Voice AI Call',
        tags: ['high-priority', 'fitness', 'qualified'],
        customFields: {
          leadScore: 85,
          fitnessGoals: 'Weight Loss',
          experienceLevel: 'Beginner',
          preferredTime: 'Morning'
        },
        lastContacted: '2024-01-15T10:30:00Z',
        leadScore: 85,
        status: 'prospect',
        ghlId: 'ghl_123456',
        syncStatus: 'synced',
        lastSync: '2024-01-15T10:30:00Z',
        voiceAiCalls: 3,
        totalValue: 2500,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@email.com',
        phone: '+1-555-0456',
        company: 'Health & Wellness LLC',
        source: 'Website Form',
        tags: ['legal', 'consultation', 'high-value'],
        customFields: {
          leadScore: 92,
          legalMatter: 'Personal Injury',
          urgency: 'High',
          preferredContact: 'Phone'
        },
        lastContacted: '2024-01-14T14:20:00Z',
        leadScore: 92,
        status: 'lead',
        ghlId: 'ghl_789012',
        syncStatus: 'pending',
        lastSync: '2024-01-14T14:20:00Z',
        voiceAiCalls: 1,
        totalValue: 15000,
        createdAt: '2024-01-12T11:30:00Z',
        updatedAt: '2024-01-14T14:20:00Z'
      }
    ]);
  };

  // Initialize sample sync rules
  useEffect(() => {
    setSyncRules([
      {
        id: '1',
        name: 'Voice AI Lead Sync',
        description: 'Sync leads from Voice AI calls to GHL',
        source: 'voice_ai',
        conditions: {
          leadScore: { min: 70 },
          status: 'lead'
        },
        actions: ['create_contact', 'add_tags', 'update_custom_fields'],
        isActive: true,
        lastRun: '2024-01-15T10:30:00Z',
        successCount: 45,
        errorCount: 2
      },
      {
        id: '2',
        name: 'High-Value Prospect Sync',
        description: 'Immediate sync for high-value prospects',
        source: 'all',
        conditions: {
          leadScore: { min: 90 },
          totalValue: { min: 10000 }
        },
        actions: ['create_contact', 'add_tags', 'create_opportunity', 'assign_owner'],
        isActive: true,
        lastRun: '2024-01-15T09:15:00Z',
        successCount: 12,
        errorCount: 0
      }
    ]);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'sync-rules', label: 'Sync Rules', icon: Workflow },
    { id: 'mapping', label: 'Field Mapping', icon: Settings },
    { id: 'logs', label: 'Sync Logs', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;
    const matchesSource = filterSource === 'all' || contact.source === filterSource;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleSyncAll = () => {
    setIsSyncing(true);
    // Implementation for syncing all contacts
  };

  const handleSyncSelected = () => {
    setIsSyncing(true);
    // Implementation for syncing selected contacts
  };

  const handleCreateSyncRule = () => {
    console.log('Creating new sync rule');
  };

  const handleEditContact = (contact: Contact) => {
    console.log('Editing contact:', contact.firstName);
  };

  const handleDeleteContact = (contactId: string) => {
    console.log('Deleting contact:', contactId);
  };

  const handleBulkAction = (action: string) => {
    console.log('Bulk action:', action, 'on contacts:', selectedContacts);
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Contact Sync Manager</h1>
            <p className="text-muted-foreground">
              Advanced contact synchronization and management for GoHighLevel
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="btn btn-primary"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync All
            </button>
            <button
              onClick={handleSyncSelected}
              disabled={selectedContacts.length === 0 || isSyncing}
              className="btn btn-outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Sync Selected
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
              <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
              <p className="text-2xl font-bold">{contacts.length}</p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Synced</p>
              <p className="text-2xl font-bold">{contacts.filter(c => c.syncStatus === 'synced').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{contacts.filter(c => c.syncStatus === 'pending').length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Errors</p>
              <p className="text-2xl font-bold">{contacts.filter(c => c.syncStatus === 'error').length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
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
                placeholder="Search contacts..."
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
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="customer">Customer</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Sources</option>
              <option value="Voice AI Call">Voice AI Call</option>
              <option value="Website Form">Website Form</option>
              <option value="Social Media">Social Media</option>
              <option value="Referral">Referral</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Contacts</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => handleBulkAction('sync')}
              disabled={selectedContacts.length === 0}
              className="btn btn-outline btn-sm"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Sync Selected
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              disabled={selectedContacts.length === 0}
              className="btn btn-outline btn-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={selectedContacts.length === 0}
              className="btn btn-outline btn-sm text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContacts(filteredContacts.map(c => c.id));
                      } else {
                        setSelectedContacts([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Contact</th>
                <th className="text-left p-2">Company</th>
                <th className="text-left p-2">Source</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Lead Score</th>
                <th className="text-left p-2">Sync Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContacts([...selectedContacts, contact.id]);
                        } else {
                          setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="p-2">
                    <div>
                      <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                      <div className="text-sm text-muted-foreground">{contact.tags.join(', ')}</div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div>
                      <div className="text-sm">{contact.email}</div>
                      <div className="text-sm text-muted-foreground">{contact.phone}</div>
                    </div>
                  </td>
                  <td className="p-2">{contact.company}</td>
                  <td className="p-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {contact.source}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      contact.status === 'lead' ? 'bg-yellow-100 text-yellow-800' :
                      contact.status === 'prospect' ? 'bg-blue-100 text-blue-800' :
                      contact.status === 'customer' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${contact.leadScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{contact.leadScore}</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      {contact.syncStatus === 'synced' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : contact.syncStatus === 'pending' ? (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      ) : contact.syncStatus === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm capitalize">{contact.syncStatus}</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 hover:bg-gray-200 rounded text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Rules */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sync Rules</h2>
          <button
            onClick={handleCreateSyncRule}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </button>
        </div>
        <div className="space-y-4">
          {syncRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Workflow className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{rule.successCount}</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{rule.errorCount}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Sync Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">25 contacts synced successfully</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">New sync rule created: High-Value Lead Sync</p>
              <p className="text-xs text-muted-foreground">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">3 contacts failed to sync - API rate limit exceeded</p>
              <p className="text-xs text-muted-foreground">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHLContactSyncManager;
