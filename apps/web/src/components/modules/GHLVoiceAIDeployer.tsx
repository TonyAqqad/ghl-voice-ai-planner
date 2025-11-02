import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Bot,
  Phone,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3,
  Search,
  Download,
  RotateCcw,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import { useStore } from '../../store/useStore';

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
  const { voiceAgents, deployAgent, updateVoiceAgent, deleteVoiceAgent } = useStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedDeployments, setSelectedDeployments] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEnvironment, setFilterEnvironment] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newDeployment, setNewDeployment] = useState({
    name: '',
    description: '',
    voiceAgentId: '',
    voiceAgentName: '',
    environment: 'production' as 'development' | 'staging' | 'production',
    phoneNumbers: '',
    webhookUrl: '',
  });
  const [aiGeneration, setAiGeneration] = useState({
    businessDescription: '',
    industry: '',
    businessType: 'service',
  });

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

  const handleDeploy = async (deployment: Deployment) => {
    setIsDeploying(true);
    try {
      // Find the voice agent in our store
      const agent = voiceAgents.find(a => a.id === deployment.voiceAgent.id);
      if (!agent) {
        alert('Voice agent not found');
        return;
      }

      // Deploy to GHL using our backend API
      const result = await deployAgent({
        name: agent.name,
        description: agent.description || deployment.description,
        voiceSettings: agent.voiceSettings,
        conversationSettings: agent.conversationSettings,
        scripts: agent.scripts,
        intents: agent.intents,
        customActions: agent.customActions,
        knowledgeBase: agent.knowledgeBase,
        transferRules: agent.transferRules,
        compliance: agent.compliance,
        ghlIntegration: agent.ghlIntegration
      });

      if (result.success) {
        alert('Agent deployed successfully to GHL!');
        // Update local deployment status
        setDeployments(prev => prev.map(d => 
          d.id === deployment.id 
            ? { ...d, status: 'active', updatedAt: new Date().toISOString() }
            : d
        ));
      } else {
        alert(`Failed to deploy: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to deploy:', error);
      alert('Failed to deploy agent');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCreateDeployment = async () => {
    if (!newDeployment.name.trim() || !newDeployment.voiceAgentName.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsDeploying(true);
    try {
      // Create a basic voice agent configuration
      const agentConfig = {
        name: newDeployment.voiceAgentName,
        description: newDeployment.description,
        voiceSettings: {
          provider: 'elevenlabs',
          voiceId: 'Adam',
          voiceName: 'Adam - Professional',
          speed: 1.0,
          stability: 0.5,
          similarityBoost: 0.75
        },
        conversationSettings: {
          systemPrompt: `You are a helpful voice assistant for ${newDeployment.name}.`,
          temperature: 0.7,
          maxTokens: 1000,
          model: 'gpt-4'
        },
        scripts: {
          greeting: 'Hello! How can I help you today?',
          main: 'I can assist you with your needs.',
          fallback: 'Sorry, could you repeat that?',
          transfer: 'Let me transfer you to a human agent.',
          goodbye: 'Thank you for calling. Have a great day!'
        },
        intents: [],
        customActions: [],
        knowledgeBase: [],
        transferRules: [],
        compliance: {
          tcpaCompliant: true,
          recordingConsent: true,
          gdprCompliant: true,
          dataRetentionDays: 90
        },
        ghlIntegration: {
          customFields: [],
          tags: ['voice-ai-contact'],
          appointmentType: 'General Inquiry',
          calendarId: 'default'
        }
      };

      // Deploy to GHL
      const result = await deployAgent(agentConfig);

      if (result.success) {
        // Create local deployment record
        const deployment: Deployment = {
          id: result.agentId || `dep_${Date.now()}`,
          name: newDeployment.name,
          description: newDeployment.description,
          voiceAgent: {
            id: result.agentId || 'new_agent',
            name: newDeployment.voiceAgentName,
            version: 'v1.0.0'
          },
          environment: newDeployment.environment,
          status: 'active',
          phoneNumbers: newDeployment.phoneNumbers.split(',').map(p => p.trim()),
          webhooks: newDeployment.webhookUrl ? [{
            url: newDeployment.webhookUrl,
            events: ['call.started', 'call.ended'],
            status: 'active'
          }] : [],
          configuration: {
            maxConcurrentCalls: 50,
            callTimeout: 300,
            retryAttempts: 3,
            fallbackNumber: '+1-555-0000'
          },
          metrics: {
            totalCalls: 0,
            activeCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            averageCallDuration: 0,
            uptime: 100
          },
          health: {
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            issues: []
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setDeployments(prev => [deployment, ...prev]);
        setShowCreateModal(false);
        setNewDeployment({
          name: '',
          description: '',
          voiceAgentId: '',
          voiceAgentName: '',
          environment: 'production',
          phoneNumbers: '',
          webhookUrl: '',
        });
        alert('Agent deployed successfully to GHL!');
      } else {
        alert(`Failed to deploy: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to deploy:', error);
      alert('Failed to deploy agent');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiGeneration.businessDescription.trim()) {
      alert('Please provide a business description');
      return;
    }

    setIsGenerating(true);
    try {
      const { generateAgent } = useStore.getState();
      const result = await generateAgent(
        aiGeneration.businessDescription,
        aiGeneration.industry,
        aiGeneration.businessType
      );

      if (result.success) {
        // Pre-fill the deployment form with generated agent
        setNewDeployment({
          name: `${aiGeneration.industry} Voice Agent`,
          description: aiGeneration.businessDescription,
          voiceAgentId: result.agentId,
          voiceAgentName: result.agentConfig.name,
          environment: 'production',
          phoneNumbers: '',
          webhookUrl: '',
        });
        setShowGenerateModal(false);
        setShowCreateModal(true);
        alert('Agent generated successfully! Review and deploy.');
      } else {
        alert(`Failed to generate agent: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to generate agent:', error);
      alert('Failed to generate agent');
    } finally {
      setIsGenerating(false);
    }
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
              onClick={() => setShowGenerateModal(true)}
              className="btn btn-secondary"
            >
              <Bot className="w-4 h-4 mr-2" />
              Generate with AI
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
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

      {/* Create Deployment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Deploy New Voice AI Agent</h2>
              <p className="text-muted-foreground mt-1">Configure and deploy your Voice AI agent</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Deployment Name *</label>
                <input
                  type="text"
                  className="input w-full"
                  value={newDeployment.name}
                  onChange={(e) => setNewDeployment({ ...newDeployment, name: e.target.value })}
                  placeholder="e.g., Solar Sales Agent - Production"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="input w-full h-24 resize-y"
                  value={newDeployment.description}
                  onChange={(e) => setNewDeployment({ ...newDeployment, description: e.target.value })}
                  placeholder="Describe the purpose of this deployment..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Voice Agent Name *</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={newDeployment.voiceAgentName}
                    onChange={(e) => setNewDeployment({ ...newDeployment, voiceAgentName: e.target.value })}
                    placeholder="e.g., Sarah - Sales Agent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Environment *</label>
                  <select
                    className="input w-full"
                    value={newDeployment.environment}
                    onChange={(e) => setNewDeployment({ ...newDeployment, environment: e.target.value as any })}
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Numbers</label>
                <input
                  type="text"
                  className="input w-full"
                  value={newDeployment.phoneNumbers}
                  onChange={(e) => setNewDeployment({ ...newDeployment, phoneNumbers: e.target.value })}
                  placeholder="+1-555-0123, +1-555-0124"
                />
                <p className="text-xs text-muted-foreground mt-1">Separate multiple numbers with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Webhook URL</label>
                <input
                  type="url"
                  className="input w-full"
                  value={newDeployment.webhookUrl}
                  onChange={(e) => setNewDeployment({ ...newDeployment, webhookUrl: e.target.value })}
                  placeholder="https://api.gohighlevel.com/webhooks/voice-ai"
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-outline"
                disabled={isDeploying}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDeployment}
                className="btn btn-primary"
                disabled={isDeploying || !newDeployment.name.trim() || !newDeployment.voiceAgentName.trim()}
              >
                {isDeploying ? 'Deploying...' : 'Deploy Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Generate Voice Agent with AI</h2>
              <p className="text-muted-foreground mt-1">Describe your business and let AI create a custom voice agent</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business Description *</label>
                <textarea
                  className="input w-full h-32 resize-y"
                  value={aiGeneration.businessDescription}
                  onChange={(e) => setAiGeneration({ ...aiGeneration, businessDescription: e.target.value })}
                  placeholder="Describe your business, services, target customers, and what you want the voice agent to help with..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific about your business type, services offered, and customer interactions
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Industry *</label>
                  <select
                    className="input w-full"
                    value={aiGeneration.industry}
                    onChange={(e) => setAiGeneration({ ...aiGeneration, industry: e.target.value })}
                  >
                    <option value="">Select Industry</option>
                    <option value="fitness">Fitness & Wellness</option>
                    <option value="restaurant">Restaurant & Food</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="legal">Legal Services</option>
                    <option value="real-estate">Real Estate</option>
                    <option value="automotive">Automotive</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="professional-services">Professional Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Business Type</label>
                  <select
                    className="input w-full"
                    value={aiGeneration.businessType}
                    onChange={(e) => setAiGeneration({ ...aiGeneration, businessType: e.target.value })}
                  >
                    <option value="service">Service Business</option>
                    <option value="retail">Retail Store</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="fitness-studio">Fitness Studio</option>
                    <option value="professional">Professional Practice</option>
                    <option value="ecommerce">E-commerce</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What AI will generate:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Custom system prompt tailored to your business</li>
                  <li>• Professional conversation scripts</li>
                  <li>• Relevant intents and responses</li>
                  <li>• Knowledge base with FAQs</li>
                  <li>• Voice settings optimized for your industry</li>
                  <li>• GHL integration configuration</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="btn btn-outline"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateWithAI}
                className="btn btn-primary"
                disabled={isGenerating || !aiGeneration.businessDescription.trim() || !aiGeneration.industry}
              >
                {isGenerating ? 'Generating...' : 'Generate Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GHLVoiceAIDeployer;
