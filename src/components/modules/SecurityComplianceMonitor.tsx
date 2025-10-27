import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Download,
  Upload,
  Save,
  Edit,
  Trash2,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Star,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Smile,
  Frown,
  Meh,
  Award,
  Trophy,
  Medal,
  Crown,
  Flame,
  Lightning,
  Rocket,
  Lock,
  Unlock,
  Key,
  Wrench,
  Cog,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Switch,
  Power,
  PowerOff,
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
  Signal,
  MessageSquare,
  Mic,
  Headphones,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  RotateCcw,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Clock,
  Users,
  Phone,
  Bot,
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  Database,
  Server,
  Globe,
  FileText,
  FileCheck,
  FileX,
  FileAlert,
  FileLock,
  FileShield,
  FileSearch,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  FilePresentation,
  FilePdf,
  FileWord,
  FileExcel,
  FilePowerpoint,
  FileZip,
  FileJson,
  FileXml,
  FileCsv,
  FileHtml,
  FileCss,
  FileJs,
  FileTs,
  FileJsx,
  FileTsx,
  FileVue,
  FileSvelte,
  FileAngular,
  FileReact,
  FileNode,
  FilePython,
  FileJava,
  FileC,
  FileCpp,
  FileCsharp,
  FilePhp,
  FileRuby,
  FileGo,
  FileRust,
  FileSwift,
  FileKotlin,
  FileDart,
  FileScala,
  FileClojure,
  FileHaskell,
  FileElixir,
  FileErlang,
  FileLua,
  FilePerl,
  FileR,
  FileMatlab,
  FileOctave,
  FileJulia,
  FileNim,
  FileCrystal,
  FileZig,
  FileOcaml,
  FileFsharp,
  FileD,
  FileNimrod,
  FilePascal,
  FileDelphi,
  FileFortran,
  FileCobol,
  FileAda,
  FileAssembly,
  FileBash,
  FilePowershell,
  FileBatch,
  FileDocker,
  FileKubernetes,
  FileTerraform,
  FileAnsible,
  FileChef,
  FilePuppet,
  FileVagrant,
  FileJenkins,
  FileTravis,
  FileCircleci,
  FileGitlab,
  FileGithub,
  FileBitbucket,
  FileGit,
  FileGitCommit,
  FileGitBranch,
  FileGitMerge,
  FileGitPullRequest,
  FileGitCompare,
  FileGitCherryPick,
  FileGitRebase,
  FileGitReset,
  FileGitRevert,
  FileGitStash,
  FileGitTag,
  FileGitLog,
  FileGitDiff,
  FileGitPatch,
  FileGitBlame,
  FileGitHistory,
  FileGitGraph,
  FileGitTree,
  FileGitSubmodule,
  FileGitLfs,
  FileGitHooks,
  FileGitAttributes,
  FileGitIgnore,
  FileGitConfig,
  FileGitModules,
  FileGitCredentials,
  FileGitSsh,
  FileGitHttps,
  FileGitProtocol,
  FileGitTransport,
  FileGitPack,
  FileGitIndex,
  FileGitObjects,
  FileGitRefs,
  FileGitHeads,
  FileGitTags,
  FileGitRemotes,
  FileGitOrigin,
  FileGitUpstream,
  FileGitFork,
  FileGitClone,
  FileGitFetch,
  FileGitPull,
  FileGitPush,
  FileGitRemote,
  FileGitAdd,
  FileGitCommitMessage,
  FileGitCommitAmend,
  FileGitCommitSquash,
  FileGitCommitFixup,
  FileGitCommitReword,
  FileGitCommitEdit,
  FileGitCommitDrop,
  FileGitCommitPick,
  FileGitCommitResolve,
  FileGitCommitContinue,
  FileGitCommitAbort,
  FileGitCommitSkip,
  FileGitCommitQuit,
  FileGitCommitBreak,
  FileGitCommitExec,
  FileGitCommitLabel,
  FileGitCommitReset,
  FileGitCommitMerge,
  FileGitCommitNoop,
  FileGitCommitStart,
  FileGitCommitEnd,
  FileGitCommitEmpty,
  FileGitCommitInitial,
  FileGitCommitRoot,
  FileGitCommitDetached,
  FileGitCommitOrphan,
  FileGitCommitUnborn,
  FileGitCommitHead,
  FileGitCommitMaster,
  FileGitCommitMain,
  FileGitCommitDevelop,
  FileGitCommitFeature,
  FileGitCommitBugfix,
  FileGitCommitHotfix,
  FileGitCommitRelease,
  FileGitCommitSupport,
  FileGitCommitVersion,
  FileGitCommitStable,
  FileGitCommitBeta,
  FileGitCommitAlpha,
  FileGitCommitDev,
  FileGitCommitTest,
  FileGitCommitStaging,
  FileGitCommitProduction,
  FileGitCommitLive,
  FileGitCommitProd
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface SecurityAlert {
  id: string;
  type: 'threat' | 'vulnerability' | 'compliance' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
  source: string;
  affectedSystems: string[];
  recommendedActions: string[];
}

interface ComplianceCheck {
  id: string;
  framework: 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'NIST';
  status: 'compliant' | 'non-compliant' | 'partial' | 'pending';
  lastChecked: string;
  score: number;
  issues: string[];
  recommendations: string[];
}

const SecurityComplianceMonitor: React.FC = () => {
  const { } = useStore();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data
  useEffect(() => {
    const sampleAlerts: SecurityAlert[] = [
      {
        id: '1',
        type: 'threat',
        severity: 'high',
        title: 'Suspicious API Activity Detected',
        description: 'Unusual API call patterns detected from IP address 192.168.1.100',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'investigating',
        source: 'API Gateway',
        affectedSystems: ['Voice AI API', 'Webhook Endpoints'],
        recommendedActions: [
          'Block suspicious IP address',
          'Review API access logs',
          'Implement rate limiting'
        ]
      },
      {
        id: '2',
        type: 'compliance',
        severity: 'medium',
        title: 'GDPR Data Retention Policy Violation',
        description: 'Customer data retained beyond allowed period',
        timestamp: '2024-01-15T09:45:00Z',
        status: 'active',
        source: 'Data Audit System',
        affectedSystems: ['Customer Database', 'Analytics System'],
        recommendedActions: [
          'Review data retention policies',
          'Implement automated data purging',
          'Update privacy notices'
        ]
      }
    ];

    const sampleComplianceChecks: ComplianceCheck[] = [
      {
        id: '1',
        framework: 'SOC2',
        status: 'compliant',
        lastChecked: '2024-01-15T08:00:00Z',
        score: 95,
        issues: [],
        recommendations: ['Continue current security practices']
      },
      {
        id: '2',
        framework: 'GDPR',
        status: 'partial',
        lastChecked: '2024-01-15T08:00:00Z',
        score: 78,
        issues: ['Data retention policy needs update', 'Consent management incomplete'],
        recommendations: ['Update data retention schedule', 'Implement consent management system']
      }
    ];

    setAlerts(sampleAlerts);
    setComplianceChecks(sampleComplianceChecks);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.type === filter || alert.severity === filter;
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const startMonitoring = async () => {
    setIsMonitoring(true);
    toast.loading('Starting security monitoring...', { id: 'security-monitoring' });

    // Simulate monitoring process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add new alert
    const newAlert: SecurityAlert = {
      id: Date.now().toString(),
      type: 'threat',
      severity: 'medium',
      title: 'New Security Scan Completed',
      description: 'Automated security scan completed successfully',
      timestamp: new Date().toISOString(),
      status: 'active',
      source: 'Security Scanner',
      affectedSystems: ['All Systems'],
      recommendedActions: ['Review scan results', 'Address any findings']
    };

    setAlerts(prev => [newAlert, ...prev]);

    toast.success('Security monitoring started!', { id: 'security-monitoring' });
    setIsMonitoring(false);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50';
      case 'high': return 'text-orange-500 bg-orange-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-500 bg-red-50';
      case 'investigating': return 'text-yellow-500 bg-yellow-50';
      case 'resolved': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-500 bg-green-50';
      case 'non-compliant': return 'text-red-500 bg-red-50';
      case 'partial': return 'text-yellow-500 bg-yellow-50';
      case 'pending': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Security & Compliance Monitor
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time security monitoring and compliance tracking for voice AI systems
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={startMonitoring}
                disabled={isMonitoring}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMonitoring ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isMonitoring ? 'Monitoring...' : 'Start Monitoring'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.status === 'active').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity === 'critical').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {complianceChecks.length > 0 ? Math.round(complianceChecks.reduce((acc, c) => acc + c.score, 0) / complianceChecks.length) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Frameworks</p>
                <p className="text-2xl font-bold text-blue-600">{complianceChecks.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search security alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="threat">Threats</option>
                <option value="vulnerability">Vulnerabilities</option>
                <option value="compliance">Compliance</option>
                <option value="performance">Performance</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Alerts */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Security Alerts</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getSeverityIcon(alert.severity)}
                        <h3 className="text-lg font-medium text-gray-900">{alert.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{alert.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Source: {alert.source}</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Status */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Compliance Status</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {complianceChecks.map((check) => (
                <div key={check.id} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{check.framework}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getComplianceStatusColor(check.status)}`}>
                      {check.status}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Compliance Score</span>
                      <span className="text-sm font-medium text-gray-900">{check.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${check.score}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Last checked: {new Date(check.lastChecked).toLocaleString()}
                  </div>
                  {check.issues.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Issues:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {check.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert Details Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedAlert.title}</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">{selectedAlert.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Affected Systems:</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {selectedAlert.affectedSystems.map((system, index) => (
                      <li key={index}>{system}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommended Actions:</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {selectedAlert.recommendedActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityComplianceMonitor;