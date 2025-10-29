import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Trash2,
  Edit,
  Activity,
  Globe,
  Lock,
  Unlock,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'error';
  lastTriggered: string;
  totalCalls: number;
  successRate: number;
  authMethod: 'none' | 'bearer' | 'hmac';
}

const WebhookConfigurationManager: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    authMethod: 'none' as 'none' | 'bearer' | 'hmac'
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockWebhooks: WebhookEndpoint[] = [
      {
        id: '1',
        name: 'Voice AI Events',
        url: 'https://example.com/webhooks/voice-ai',
        events: ['call.started', 'call.ended', 'call.analyzed'],
        status: 'active',
        lastTriggered: new Date().toISOString(),
        totalCalls: 1247,
        successRate: 98.5,
        authMethod: 'hmac'
      },
      {
        id: '2',
        name: 'Agent Performance',
        url: 'https://example.com/webhooks/agent-performance',
        events: ['agent.completed', 'agent.transferred'],
        status: 'active',
        lastTriggered: new Date(Date.now() - 3600000).toISOString(),
        totalCalls: 892,
        successRate: 99.2,
        authMethod: 'bearer'
      },
      {
        id: '3',
        name: 'Lead Conversion Tracker',
        url: 'https://example.com/webhooks/conversion',
        events: ['lead.converted'],
        status: 'inactive',
        lastTriggered: new Date(Date.now() - 86400000).toISOString(),
        totalCalls: 156,
        successRate: 95.5,
        authMethod: 'none'
      }
    ];
    
    setWebhooks(mockWebhooks);
    setLoading(false);
  };

  const handleCreateWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const webhook: WebhookEndpoint = {
      id: Date.now().toString(),
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      status: 'active',
      lastTriggered: new Date().toISOString(),
      totalCalls: 0,
      successRate: 100,
      authMethod: newWebhook.authMethod
    };
    
    setWebhooks([webhook, ...webhooks]);
    setShowCreateModal(false);
    setNewWebhook({ name: '', url: '', events: [], authMethod: 'none' });
    toast.success('Webhook created successfully!');
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast.success('Webhook deleted');
  };

  const handleToggleStatus = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' } : w
    ));
    toast.success('Webhook status updated');
  };

  const availableEvents = [
    'call.started',
    'call.ended',
    'call.analyzed',
    'agent.completed',
    'agent.transferred',
    'lead.converted',
    'conversation.created',
    'message.received'
  ];

  const totalWebhooks = webhooks.length;
  const activeWebhooks = webhooks.filter(w => w.status === 'active').length;
  const totalCalls = webhooks.reduce((sum, w) => sum + w.totalCalls, 0);
  const avgSuccessRate = webhooks.length > 0 
    ? webhooks.reduce((sum, w) => sum + w.successRate, 0) / webhooks.length 
    : 0;

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Webhook Configuration</h1>
            <p className="text-muted-foreground">
              Manage webhooks and monitor event delivery
            </p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Webhook
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Webhook className="w-8 h-8 text-blue-500" />
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{totalWebhooks}</div>
          <div className="text-sm text-muted-foreground">Total Webhooks</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-green-500" />
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{activeWebhooks}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Globe className="w-8 h-8 text-purple-500" />
            <CheckCircle className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">{totalCalls.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Calls</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-yellow-500" />
            <TrendingUp className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">Avg Success Rate</div>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Webhook Endpoints</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading webhooks...</p>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-12">
            <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No webhooks configured yet</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="mt-4 btn btn-primary"
            >
              Create Your First Webhook
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 border rounded hover:bg-accent/5 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{webhook.name}</h3>
                      <span className={`px-3 py-1 rounded text-sm ${
                        webhook.status === 'active' ? 'bg-green-500/20 text-green-500' :
                        webhook.status === 'error' ? 'bg-red-500/20 text-red-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {webhook.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      <span className="font-mono">{webhook.url}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {webhook.events.map((event) => (
                        <span key={event} className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs">
                          {event}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Lock className="w-4 h-4 mr-1" />
                        Auth: {webhook.authMethod}
                      </div>
                      <div className="flex items-center">
                        <Activity className="w-4 h-4 mr-1" />
                        {webhook.totalCalls} calls
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {webhook.successRate}% success
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(webhook.lastTriggered).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => handleToggleStatus(webhook.id)}
                      className="btn btn-outline"
                      title={webhook.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {webhook.status === 'active' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                    <button className="btn btn-outline">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="btn btn-outline text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4">Create Webhook</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Webhook Name *</label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded bg-background"
                  placeholder="Voice AI Events"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL *</label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="w-full px-4 py-2 border rounded bg-background"
                  placeholder="https://example.com/webhook"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Events</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-4">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event] });
                          } else {
                            setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(e => e !== event) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Authentication Method</label>
                <select
                  value={newWebhook.authMethod}
                  onChange={(e) => setNewWebhook({ ...newWebhook, authMethod: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded bg-background"
                >
                  <option value="none">None</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="hmac">HMAC Signature</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWebhook}
                className="flex-1 btn btn-primary"
              >
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookConfigurationManager;

