import React, { useState } from 'react';
import { 
  Brain, 
  Zap, 
  Play,
  Pause,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  Activity,
  Settings,
  TrendingUp
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: string[];
  actions: string[];
  status: 'active' | 'paused';
  lastExecuted: string;
  executionCount: number;
  successRate: number;
}

const IntelligentAutomationEngine: React.FC = () => {
  const { voiceAgents, workflows } = useStore();
  const [automations, setAutomations] = useState<AutomationRule[]>([
    {
      id: 'auto_1',
      name: 'Auto-Transfer on High Intent',
      description: 'Transfer calls when high-value intent is detected',
      trigger: 'Intent detected',
      conditions: ['Intent confidence > 90%', 'Customer is qualified'],
      actions: ['Transfer to sales', 'Create opportunity', 'Send notification'],
      status: 'active',
      lastExecuted: new Date().toISOString(),
      executionCount: 142,
      successRate: 98.5
    },
    {
      id: 'auto_2',
      name: 'Follow-up SMS After Call',
      description: 'Send SMS with appointment details after booking',
      trigger: 'Appointment booked',
      conditions: ['Call duration > 2min', 'Appointment confirmed'],
      actions: ['Send confirmation SMS', 'Add to calendar', 'Update CRM'],
      status: 'active',
      lastExecuted: new Date(Date.now() - 3600000).toISOString(),
      executionCount: 89,
      successRate: 97.8
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: '',
    conditions: [''],
    actions: ['']
  });

  const handleCreate = () => {
    const newAutomation: AutomationRule = {
      id: `auto_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger,
      conditions: formData.conditions.filter(c => c.trim()),
      actions: formData.actions.filter(a => a.trim()),
      status: 'active',
      lastExecuted: '',
      executionCount: 0,
      successRate: 100
    };
    setAutomations([newAutomation, ...automations]);
    setShowCreateModal(false);
    resetForm();
    toast.success('Automation created successfully');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: '',
      conditions: [''],
      actions: ['']
    });
  };

  const handleToggle = (id: string) => {
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a
    ));
  };

  const handleDelete = (id: string) => {
    setAutomations(automations.filter(a => a.id !== id));
    toast.success('Automation deleted');
  };

  const activeCount = automations.filter(a => a.status === 'active').length;
  const totalExecutions = automations.reduce((sum, a) => sum + a.executionCount, 0);
  const avgSuccessRate = automations.length > 0 
    ? (automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length).toFixed(1)
    : 0;

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Intelligent Automation Engine</h1>
            <p className="text-muted-foreground">
              AI-powered automation and workflow orchestration
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Automation
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Automations</p>
              <p className="text-2xl font-bold">{automations.length}</p>
            </div>
            <Brain className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
              <p className="text-2xl font-bold">{totalExecutions}</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Success Rate</p>
              <p className="text-2xl font-bold">{avgSuccessRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Automations List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Automation Rules</h2>
        {automations.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No automations yet</p>
            <p className="text-sm text-muted-foreground">Create your first automation to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {automations.map((automation) => (
              <div key={automation.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{automation.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        automation.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {automation.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{automation.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Trigger</p>
                        <p className="text-sm">{automation.trigger}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Executions</p>
                        <p className="text-sm font-semibold">{automation.executionCount}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Success Rate</p>
                        <p className="text-sm font-semibold">{automation.successRate}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Conditions:</p>
                        <ul className="text-sm">
                          {automation.conditions.map((c, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Actions:</p>
                        <ul className="text-sm">
                          {automation.actions.map((a, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <Zap className="w-3 h-3 text-yellow-600" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggle(automation.id)}
                      className="btn btn-outline btn-sm"
                    >
                      {automation.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(automation.id)}
                      className="btn btn-outline btn-sm text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4">Create Automation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Auto-transfer on high intent"
                  className="w-full px-4 py-2 border rounded bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the automation..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Trigger</label>
                <input
                  type="text"
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  placeholder="e.g., Intent detected"
                  className="w-full px-4 py-2 border rounded bg-background"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="btn btn-primary flex-1"
                >
                  Create Automation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentAutomationEngine;
