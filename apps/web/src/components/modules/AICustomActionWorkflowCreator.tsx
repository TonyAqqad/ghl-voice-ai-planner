import React, { useState } from 'react';
import { Bot, Plus, Play, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AICustomActionWorkflowCreator: React.FC = () => {
  const [actions, setActions] = useState([
    { id: '1', name: 'Create Task', webhook: 'https://api.ghl.com/tasks', status: 'active' },
    { id: '2', name: 'Send Email', webhook: 'https://api.ghl.com/emails', status: 'active' },
    { id: '3', name: 'Update Contact', webhook: 'https://api.ghl.com/contacts', status: 'pending' },
  ]);

  const handleCreate = () => {
    toast.success('Custom action created');
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">AI Custom Action Workflow Creator</h1>
            <p className="text-muted-foreground">Real-time webhook action creation</p>
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />Create Action
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Custom Actions</h2>
        <div className="space-y-4">
          {actions.map(a => (
            <div key={a.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{a.name}</h3>
                  <p className="text-sm text-muted-foreground">{a.webhook}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  a.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {a.status}
                </span>
              </div>
              <div className="flex space-x-2">
                <button className="btn btn-outline btn-sm">
                  <Settings className="w-4 h-4 mr-1" />Configure
                </button>
                {a.status === 'active' && (
                  <button className="btn btn-primary btn-sm">
                    <Play className="w-4 h-4 mr-1" />Test
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AICustomActionWorkflowCreator;
