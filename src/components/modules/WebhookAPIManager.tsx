import React, { useState } from 'react';
import { Webhook, Plus, Activity, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

const WebhookAPIManager: React.FC = () => {
  const [webhooks, setWebhooks] = useState([
    { id: '1', name: 'Call Start', url: 'https://api.example.com/webhook/call-start', events: 1523, status: 'active' },
    { id: '2', name: 'Call End', url: 'https://api.example.com/webhook/call-end', events: 1489, status: 'active' },
    { id: '3', name: 'Contact Update', url: 'https://api.example.com/webhook/contact-update', events: 234, status: 'paused' },
  ]);

  const handleCreate = () => {
    toast.success('Webhook endpoint created');
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Webhook API Manager</h1>
            <p className="text-muted-foreground">Advanced webhook and API management</p>
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />Create Webhook
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <Webhook className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Webhooks</p>
          <p className="text-2xl font-bold">{webhooks.length}</p>
        </div>
        <div className="card p-6">
          <Activity className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Total Events</p>
          <p className="text-2xl font-bold">{webhooks.reduce((sum, w) => sum + w.events, 0)}</p>
        </div>
        <div className="card p-6">
          <Activity className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Active</p>
          <p className="text-2xl font-bold">{webhooks.filter(w => w.status === 'active').length}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Webhook Endpoints</h2>
        <div className="space-y-4">
          {webhooks.map(w => (
            <div key={w.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{w.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{w.url}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  w.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {w.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{w.events} events processed</span>
                <button className="btn btn-outline btn-sm">
                  <Settings className="w-4 h-4 mr-1" />Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebhookAPIManager;
