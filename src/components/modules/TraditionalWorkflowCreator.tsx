import React, { useState } from 'react';
import { 
  Settings,
  Plus,
  Trash2,
  Edit3,
  Play,
  Pause,
  Save,
  CheckCircle,
  AlertCircle,
  Workflow,
  Zap,
  Filter
} from 'lucide-react';
import { useStore, Workflow as WorkflowType } from '../../store/useStore';
import { toast } from 'react-hot-toast';

const TraditionalWorkflowCreator: React.FC = () => {
  const { workflows, addWorkflow, deleteWorkflow, updateWorkflow } = useStore();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'inbound_call' as 'inbound_call' | 'outbound_call' | 'webhook'
  });

  const handleCreate = () => {
    const newWorkflow: WorkflowType = {
      id: `wf_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      trigger: { type: formData.trigger, conditions: {} },
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addWorkflow(newWorkflow);
    toast.success('Workflow created successfully');
    setFormData({ name: '', description: '', trigger: 'inbound_call' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflow(id);
      toast.success('Workflow deleted');
    }
  };

  const handleActivate = (workflow: WorkflowType) => {
    updateWorkflow(workflow.id, { ...workflow, updatedAt: new Date().toISOString() });
    toast.success('Workflow activated');
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Traditional Workflow Creator</h1>
            <p className="text-muted-foreground">
              Create GHL native workflows for automation
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
              <p className="text-2xl font-bold">{workflows.length}</p>
            </div>
            <Workflow className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">{workflows.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trigger Types</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Actions</p>
              <p className="text-2xl font-bold">5.2</p>
            </div>
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Create Form */}
      {isEditing && (
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Workflow</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Workflow Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Lead Qualification Workflow"
                className="w-full px-4 py-2 border rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this workflow does..."
                rows={3}
                className="w-full px-4 py-2 border rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Trigger Type</label>
              <select
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value as any })}
                className="w-full px-4 py-2 border rounded bg-background"
              >
                <option value="inbound_call">Inbound Call</option>
                <option value="outbound_call">Outbound Call</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  handleCreate();
                  setIsEditing(false);
                }}
                className="btn btn-primary flex-1"
                disabled={!formData.name.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Create Workflow
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ name: '', description: '', trigger: 'inbound_call' });
                }}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflows List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Workflows</h2>
        {workflows.length === 0 && !isEditing ? (
          <div className="text-center py-12">
            <Workflow className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No workflows yet</p>
            <p className="text-sm text-muted-foreground">Create your first workflow to get started</p>
          </div>
        ) : workflows.length > 0 ? (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{workflow.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.trigger.type === 'inbound_call' ? 'bg-blue-100 text-blue-800' :
                        workflow.trigger.type === 'outbound_call' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {workflow.trigger.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{workflow.nodes.length} actions</span>
                      <span>Created: {new Date(workflow.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleActivate(workflow)}
                      className="btn btn-outline btn-sm"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Activate
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
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
        ) : null}
      </div>
    </div>
  );
};

export default TraditionalWorkflowCreator;
