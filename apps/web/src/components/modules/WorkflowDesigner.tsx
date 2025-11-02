import React, { useState } from 'react';
import { Workflow, Plus, Play, Save, Settings, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

const WorkflowDesigner: React.FC = () => {
  const { darkMode, workflows, addWorkflow } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: {
      type: 'inbound_call' as const,
      conditions: {}
    }
  });

  const handleCreateWorkflow = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    const newWorkflow = {
      id: Date.now().toString(),
      ...formData,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addWorkflow(newWorkflow);
    toast.success('Workflow created successfully!');
    setIsCreating(false);
    setFormData({
      name: '',
      description: '',
      trigger: {
        type: 'inbound_call',
        conditions: {}
      }
    });
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Workflow Designer</h1>
            <p className="text-muted-foreground">
              Design intelligent call flows and automation workflows
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      {/* Create Workflow Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Create New Workflow</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Workflow Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input"
                  placeholder="Enter workflow name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input h-20"
                  placeholder="Describe this workflow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Trigger Type</label>
                <select
                  value={formData.trigger.type}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    trigger: { ...formData.trigger, type: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input"
                >
                  <option value="inbound_call">Inbound Call</option>
                  <option value="outbound_call">Outbound Call</option>
                  <option value="voicemail_detected">Voicemail Detected</option>
                  <option value="human_requested">Human Requested</option>
                  <option value="call_completed">Call Completed</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  className="btn btn-primary"
                >
                  Create Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="card p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                  <Workflow className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{workflow.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {workflow.trigger.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button className="p-2 hover:bg-accent rounded-md">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-accent rounded-md text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {workflow.description || 'No description provided'}
            </p>

            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span>Nodes: {workflow.nodes.length}</span>
              <span>Edges: {workflow.edges.length}</span>
            </div>

            <div className="flex space-x-2">
              <button className="btn btn-outline btn-sm flex-1">
                <Play className="w-4 h-4 mr-2" />
                Test
              </button>
              <button className="btn btn-primary btn-sm flex-1">
                <Settings className="w-4 h-4 mr-2" />
                Design
              </button>
            </div>
          </div>
        ))}

        {workflows.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Workflow className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No workflows created yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first workflow to start automating call flows
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Workflow
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowDesigner;