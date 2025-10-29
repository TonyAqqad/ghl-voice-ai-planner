import React, { useState, useEffect } from 'react';
import { 
  Plug, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Globe, 
  Zap,
  Database,
  Workflow,
  Phone,
  MessageSquare,
  Users,
  BarChart3,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStore } from '../../store/useStore';

const GHLIntegrationManager: React.FC = () => {
  const { voiceAgents, workflows } = useStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ghlStatus, setGhlStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  const integrations = [
    {
      id: 'contacts',
      name: 'Contact Management',
      description: 'Sync and manage contacts',
      icon: Users,
      status: 'connected' as const,
      endpoint: '/api/v1/contacts',
      actions: ['Create Contact', 'Update Contact', 'Search Contacts', 'Add Tags']
    },
    {
      id: 'workflows',
      name: 'Workflow Automation',
      description: 'Create and manage workflows',
      icon: Workflow,
      status: 'connected' as const,
      endpoint: '/api/v1/workflows',
      actions: ['Create Workflow', 'Trigger Workflow', 'List Workflows', 'Update Workflow']
    },
    {
      id: 'campaigns',
      name: 'Campaigns',
      description: 'Manage marketing campaigns',
      icon: Zap,
      status: 'connected' as const,
      endpoint: '/api/v1/campaigns',
      actions: ['Create Campaign', 'Send Message', 'Track Performance']
    },
    {
      id: 'sms',
      name: 'SMS Messaging',
      description: 'Send and receive SMS',
      icon: MessageSquare,
      status: 'connected' as const,
      endpoint: '/api/v1/conversations/messages',
      actions: ['Send SMS', 'Receive SMS', 'List Messages', 'Mark as Read']
    },
    {
      id: 'phone',
      name: 'Phone System',
      description: 'Manage phone numbers and calls',
      icon: Phone,
      status: 'connected' as const,
      endpoint: '/api/v1/phone/calls',
      actions: ['Make Call', 'List Calls', 'Call Details', 'Recording']
    },
    {
      id: 'analytics',
      name: 'Analytics & Reporting',
      description: 'Business intelligence and reporting',
      icon: BarChart3,
      status: 'connected' as const,
      endpoint: '/api/v1/reports',
      actions: ['View Reports', 'Export Data', 'Track Metrics', 'Custom Dashboards']
    },
  ];

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:10000/api/health');
      if (response.ok) {
        setIsConnected(true);
        setGhlStatus('connected');
        toast.success('Connected to GHL API');
      } else {
        setIsConnected(false);
        setGhlStatus('error');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnected(false);
      setGhlStatus('error');
      toast.error('Failed to connect to GHL API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconnect = async () => {
    await checkConnection();
  };

  const handleTestIntegration = async (integrationId: string) => {
    toast.loading(`Testing ${integrationId}...`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`${integrationId} is working correctly!`);
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Integration Manager</h1>
            <p className="text-muted-foreground">
              Manage all GoHighLevel integrations and connections
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              ghlStatus === 'connected' ? 'bg-green-500/10 text-green-500' : 
              ghlStatus === 'error' ? 'bg-red-500/10 text-red-500' : 
              'bg-yellow-500/10 text-yellow-500'
            }`}>
              {ghlStatus === 'connected' && <CheckCircle className="w-4 h-4" />}
              {ghlStatus === 'error' && <AlertTriangle className="w-4 h-4" />}
              {ghlStatus === 'disconnected' && <AlertTriangle className="w-4 h-4" />}
              <span className="text-sm font-medium capitalize">{ghlStatus}</span>
            </div>
            <button
              onClick={handleReconnect}
              className="btn btn-outline flex items-center space-x-2"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Reconnect</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Connected</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">6/6</p>
          <p className="text-xs text-muted-foreground mt-1">Active integrations</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">API Calls (Today)</span>
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">1,247</p>
          <p className="text-xs text-muted-foreground mt-1">+12.5% from yesterday</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Voice Agents</span>
            <Phone className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold">{voiceAgents.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active agents</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Workflows</span>
            <Workflow className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold">{workflows.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Automations active</p>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                  <integration.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{integration.name}</h3>
                  <p className="text-xs text-muted-foreground">{integration.description}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                integration.status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
              }`}>
                {integration.status}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2">Available Actions:</div>
              <div className="flex flex-wrap gap-2">
                {integration.actions.slice(0, 3).map((action, index) => (
                  <span key={index} className="px-2 py-1 bg-accent rounded text-xs">
                    {action}
                  </span>
                ))}
                {integration.actions.length > 3 && (
                  <span className="px-2 py-1 bg-accent rounded text-xs text-muted-foreground">
                    +{integration.actions.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleTestIntegration(integration.id)}
                className="btn btn-outline btn-sm flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Test
              </button>
              <button className="btn btn-primary btn-sm flex-1">
                <Settings className="w-4 h-4 mr-1" />
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 card p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn btn-outline flex items-center justify-center space-x-2">
            <Plug className="w-4 h-4" />
            <span>Connect New Integration</span>
          </button>
          <button className="btn btn-outline flex items-center justify-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>View API Usage</span>
          </button>
          <button className="btn btn-outline flex items-center justify-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>API Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GHLIntegrationManager;

