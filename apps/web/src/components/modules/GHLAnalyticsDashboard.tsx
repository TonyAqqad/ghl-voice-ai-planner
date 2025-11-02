import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Phone, 
  MessageSquare, 
  Mail, 
  DollarSign, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Zap, 
  Bot, 
  Settings, 
  Download, 
  RefreshCw, 
  Filter, 
  Search, 
  Calendar, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Key, 
  Database, 
  Server, 
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
  Mic,
  Headphones,
  Volume2,
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
  Download as DownloadIcon,
  Upload,
  Share2,
  Copy,
  Edit,
  Trash,
  MoreHorizontal as MoreHorizontalIcon,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
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

interface AnalyticsData {
  overview: {
    totalCalls: number;
    answeredCalls: number;
    conversionRate: number;
    averageCallDuration: number;
    totalRevenue: number;
    costPerCall: number;
    costPerConversion: number;
    satisfactionScore: number;
  };
  voiceAgents: Array<{
    id: string;
    name: string;
    calls: number;
    conversions: number;
    conversionRate: number;
    averageDuration: number;
    satisfactionScore: number;
    revenue: number;
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    calls: number;
    conversions: number;
    conversionRate: number;
    cost: number;
    revenue: number;
    roi: number;
  }>;
  timeSeries: Array<{
    date: string;
    calls: number;
    conversions: number;
    revenue: number;
  }>;
  demographics: {
    ageGroups: Array<{ range: string; count: number; percentage: number }>;
    locations: Array<{ city: string; state: string; count: number; percentage: number }>;
    industries: Array<{ industry: string; count: number; percentage: number }>;
  };
  performance: {
    peakHours: Array<{ hour: number; calls: number }>;
    bestDays: Array<{ day: string; calls: number; conversions: number }>;
    seasonalTrends: Array<{ month: string; calls: number; conversions: number }>;
  };
}

const GHLAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);

  // Sample data
  useEffect(() => {
    setAnalyticsData({
      overview: {
        totalCalls: 15420,
        answeredCalls: 10850,
        conversionRate: 0.142,
        averageCallDuration: 195,
        totalRevenue: 125000,
        costPerCall: 2.85,
        costPerConversion: 20.07,
        satisfactionScore: 4.3
      },
      voiceAgents: [
        {
          id: '1',
          name: 'Sarah - Fitness Sales Agent',
          calls: 5200,
          conversions: 780,
          conversionRate: 0.15,
          averageDuration: 180,
          satisfactionScore: 4.4,
          revenue: 45000
        },
        {
          id: '2',
          name: 'David - Legal Consultation Agent',
          calls: 3200,
          conversions: 480,
          conversionRate: 0.15,
          averageDuration: 240,
          satisfactionScore: 4.6,
          revenue: 65000
        },
        {
          id: '3',
          name: 'Emma - Healthcare Agent',
          calls: 2800,
          conversions: 420,
          conversionRate: 0.15,
          averageDuration: 210,
          satisfactionScore: 4.2,
          revenue: 15000
        }
      ],
      campaigns: [
        {
          id: '1',
          name: 'F45 Fitness Lead Generation',
          calls: 5200,
          conversions: 780,
          conversionRate: 0.15,
          cost: 14820,
          revenue: 45000,
          roi: 203.6
        },
        {
          id: '2',
          name: 'Legal Consultation Follow-up',
          calls: 3200,
          conversions: 480,
          conversionRate: 0.15,
          cost: 9120,
          revenue: 65000,
          roi: 612.3
        }
      ],
      timeSeries: [
        { date: '2024-01-01', calls: 450, conversions: 65, revenue: 4200 },
        { date: '2024-01-02', calls: 520, conversions: 78, revenue: 4800 },
        { date: '2024-01-03', calls: 480, conversions: 72, revenue: 4500 },
        { date: '2024-01-04', calls: 550, conversions: 82, revenue: 5200 },
        { date: '2024-01-05', calls: 600, conversions: 90, revenue: 5800 }
      ],
      demographics: {
        ageGroups: [
          { range: '18-25', count: 1200, percentage: 11.1 },
          { range: '26-35', count: 3200, percentage: 29.5 },
          { range: '36-45', count: 2800, percentage: 25.8 },
          { range: '46-55', count: 2200, percentage: 20.3 },
          { range: '56-65', count: 1200, percentage: 11.1 },
          { range: '65+', count: 250, percentage: 2.3 }
        ],
        locations: [
          { city: 'San Francisco', state: 'CA', count: 1800, percentage: 16.6 },
          { city: 'Los Angeles', state: 'CA', count: 1500, percentage: 13.8 },
          { city: 'New York', state: 'NY', count: 1200, percentage: 11.1 },
          { city: 'Chicago', state: 'IL', count: 900, percentage: 8.3 },
          { city: 'Houston', state: 'TX', count: 750, percentage: 6.9 }
        ],
        industries: [
          { industry: 'Fitness & Wellness', count: 3200, percentage: 29.5 },
          { industry: 'Legal Services', count: 2800, percentage: 25.8 },
          { industry: 'Healthcare', count: 1800, percentage: 16.6 },
          { industry: 'Real Estate', count: 1200, percentage: 11.1 },
          { industry: 'Technology', count: 900, percentage: 8.3 }
        ]
      },
      performance: {
        peakHours: [
          { hour: 9, calls: 450 },
          { hour: 10, calls: 520 },
          { hour: 11, calls: 480 },
          { hour: 14, calls: 550 },
          { hour: 15, calls: 600 },
          { hour: 16, calls: 580 }
        ],
        bestDays: [
          { day: 'Monday', calls: 2200, conversions: 330 },
          { day: 'Tuesday', calls: 2400, conversions: 360 },
          { day: 'Wednesday', calls: 2300, conversions: 345 },
          { day: 'Thursday', calls: 2500, conversions: 375 },
          { day: 'Friday', calls: 2000, conversions: 300 }
        ],
        seasonalTrends: [
          { month: 'Jan', calls: 4500, conversions: 675 },
          { month: 'Feb', calls: 4200, conversions: 630 },
          { month: 'Mar', calls: 4800, conversions: 720 },
          { month: 'Apr', calls: 5200, conversions: 780 },
          { month: 'May', calls: 5000, conversions: 750 }
        ]
      }
    });
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'voice-agents', label: 'Voice Agents', icon: Bot },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'demographics', label: 'Demographics', icon: Users },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  const handleExportData = () => {
    console.log('Exporting analytics data');
  };

  const handleRefreshData = () => {
    setIsLoading(true);
    // Implementation for refreshing data
  };

  if (!analyticsData) {
    return (
      <div className="p-6 bg-background min-h-screen text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Advanced analytics and reporting for Voice AI performance
            </p>
          </div>
          <div className="flex space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={handleRefreshData}
              disabled={isLoading}
              className="btn btn-outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportData}
              className="btn btn-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold">{analyticsData.overview.totalCalls.toLocaleString()}</p>
              <p className="text-xs text-green-600">+12% from last month</p>
            </div>
            <Phone className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">{Math.round(analyticsData.overview.conversionRate * 100)}%</p>
              <p className="text-xs text-green-600">+2.3% from last month</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${analyticsData.overview.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-600">+18% from last month</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Satisfaction Score</p>
              <p className="text-2xl font-bold">{analyticsData.overview.satisfactionScore}/5</p>
              <p className="text-xs text-green-600">+0.2 from last month</p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Voice Agents Performance */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Voice Agents Performance</h2>
          <button className="btn btn-outline btn-sm">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Agent</th>
                <th className="text-left p-2">Calls</th>
                <th className="text-left p-2">Conversions</th>
                <th className="text-left p-2">Conversion Rate</th>
                <th className="text-left p-2">Avg Duration</th>
                <th className="text-left p-2">Satisfaction</th>
                <th className="text-left p-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.voiceAgents.map((agent) => (
                <tr key={agent.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                  </td>
                  <td className="p-2">{agent.calls.toLocaleString()}</td>
                  <td className="p-2">{agent.conversions.toLocaleString()}</td>
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${agent.conversionRate * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{Math.round(agent.conversionRate * 100)}%</span>
                    </div>
                  </td>
                  <td className="p-2">{Math.round(agent.averageDuration / 60)}m {agent.averageDuration % 60}s</td>
                  <td className="p-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{agent.satisfactionScore}</span>
                    </div>
                  </td>
                  <td className="p-2">${agent.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Campaign Performance</h2>
          <button className="btn btn-outline btn-sm">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsData.campaigns.map((campaign) => (
            <div key={campaign.id} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">{campaign.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Calls:</span>
                  <span className="font-medium">{campaign.calls.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Conversions:</span>
                  <span className="font-medium">{campaign.conversions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Conversion Rate:</span>
                  <span className="font-medium">{Math.round(campaign.conversionRate * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ROI:</span>
                  <span className="font-medium text-green-600">{campaign.roi.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Revenue:</span>
                  <span className="font-medium">${campaign.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Age Groups</h3>
          <div className="space-y-3">
            {analyticsData.demographics.ageGroups.map((group, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{group.range}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{group.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Top Locations</h3>
          <div className="space-y-3">
            {analyticsData.demographics.locations.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{location.city}, {location.state}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${location.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{location.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Industries</h3>
          <div className="space-y-3">
            {analyticsData.demographics.industries.map((industry, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{industry.industry}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${industry.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{industry.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Peak Hours</h3>
            <div className="space-y-2">
              {analyticsData.performance.peakHours.map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{hour.hour}:00</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${(hour.calls / Math.max(...analyticsData.performance.peakHours.map(h => h.calls))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{hour.calls}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Best Days</h3>
            <div className="space-y-2">
              {analyticsData.performance.bestDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{day.day}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${(day.calls / Math.max(...analyticsData.performance.bestDays.map(d => d.calls))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{day.calls}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHLAnalyticsDashboard;
