import React, { useState } from 'react';
import { Settings, Plus, Trash2, Save, Link2, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

const WorkflowIntegration: React.FC = () => {
  const { workflows, voiceAgents } = useStore();
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [integrations, setIntegrations] = useState<any[]>([]);

  const handleCreateIntegration = () => {
    if (!selectedAgent || !selectedWorkflow) {
      toast.error('Please select both agent and workflow');
      return;
    }
    const agent = voiceAgents.find(a => a.id === selectedAgent);
    const workflow = workflows.find(w => w.id === selectedWorkflow);
    if (agent && workflow) {
      const newIntegration = { id: `int_${Date.now()}`, agent, workflow, status: 'active' };
      setIntegrations(prev => [...prev, newIntegration]);
      toast.success('Integration created');
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Workflow Integration</h1>
            <p className="text-muted-foreground">Connect voice agents with GHL workflows</p>
          </div>
          <button onClick={handleCreateIntegration} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />Create Integration
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Agent</h2>
          <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} className="w-full px-4 py-2 border rounded bg-background">
            <option value="">Select agent...</option>
            {voiceAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">GHL Workflow</h2>
          <select value={selectedWorkflow} onChange={(e) => setSelectedWorkflow(e.target.value)} className="w-full px-4 py-2 border rounded bg-background">
            <option value="">Select workflow...</option>
            {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {integrations.length > 0 && <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Active Integrations</h2>
        <div className="space-y-4">
          {integrations.map(int => <div key={int.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold">{int.agent.name}</span>
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{int.workflow.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">Status: {int.status}</p>
            </div>
            <button onClick={() => setIntegrations(prev => prev.filter(i => i.id !== int.id))} className="btn btn-outline btn-sm">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>)}
        </div>
      </div>}
    </div>
  );
};

export default WorkflowIntegration;
