import React, { useState } from 'react';
import { Plug, CheckCircle, XCircle, Settings, Zap, Database, Code, Webhook, MessageSquare } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'pending';
  logo: string;
  category: 'analytics' | 'communication' | 'crm' | 'automation';
}

const IntegrationSetup: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: '1', name: 'GHL API', description: 'GoHighLevel API integration', status: 'connected', logo: 'GHL', category: 'crm' },
    { id: '2', name: 'ElevenLabs', description: 'Voice AI and text-to-speech', status: 'connected', logo: 'ElevenLabs', category: 'automation' },
    { id: '3', name: 'OpenAI', description: 'GPT models for conversations', status: 'connected', logo: 'OpenAI', category: 'automation' },
    { id: '4', name: 'Twilio', description: 'SMS and voice communication', status: 'disconnected', logo: 'Twilio', category: 'communication' },
    { id: '5', name: 'Slack', description: 'Team notifications and alerts', status: 'disconnected', logo: 'Slack', category: 'communication' },
    { id: '6', name: 'Stripe', description: 'Payment processing', status: 'disconnected', logo: 'Stripe', category: 'automation' }
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(int => 
      int.id === id 
        ? { ...int, status: int.status === 'connected' ? 'disconnected' : 'connected' }
        : int
    ));
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Integration Setup</h1>
            <p className="text-muted-foreground">
              Connect and configure external services
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Plug className="w-8 h-8 text-primary" />
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{connectedCount}</div>
          <div className="text-sm text-muted-foreground">Connected</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Database className="w-8 h-8 text-blue-500" />
            <XCircle className="w-5 h-5 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{integrations.length - connectedCount}</div>
          <div className="text-sm text-muted-foreground">Available</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-purple-500" />
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">100%</div>
          <div className="text-sm text-muted-foreground">Uptime</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Webhook className="w-8 h-8 text-orange-500" />
            <Settings className="w-5 h-5 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">24/7</div>
          <div className="text-sm text-muted-foreground">Monitoring</div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {integrations.map((integration) => (
          <div key={integration.id} className="card p-6 hover:border-primary transition">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary">{integration.logo[0]}</span>
              </div>
              <button
                onClick={() => toggleIntegration(integration.id)}
                className={`btn btn-sm ${
                  integration.status === 'connected' ? 'btn-success' : 'btn-outline'
                }`}
              >
                {integration.status === 'connected' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Connect
                  </>
                )}
              </button>
            </div>

            <h3 className="font-semibold mb-1">{integration.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{integration.description}</p>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center">
                <Settings className="w-3 h-3 mr-1" />
                {integration.category}
              </span>
              {integration.status === 'connected' && (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Popular Integrations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border rounded hover:border-primary transition text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="font-semibold text-sm">SMS Gateway</div>
          </button>
          <button className="p-4 border rounded hover:border-primary transition text-center">
            <Database className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <div className="font-semibold text-sm">Database</div>
          </button>
          <button className="p-4 border rounded hover:border-primary transition text-center">
            <Code className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="font-semibold text-sm">Webhooks</div>
          </button>
          <button className="p-4 border rounded hover:border-primary transition text-center">
            <Webhook className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <div className="font-semibold text-sm">Zapier</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSetup;