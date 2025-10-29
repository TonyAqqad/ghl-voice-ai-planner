import React, { useState } from 'react';
import { Workflow, Play, Pause, Settings, CheckCircle } from 'lucide-react';

const WorkflowOrchestrationEngine: React.FC = () => {
  const [workflows, setWorkflows] = useState([
    { id: '1', name: 'Lead Qualification', status: 'active', executions: 245, success: 232 },
    { id: '2', name: 'Follow-up Automation', status: 'active', executions: 189, success: 178 },
    { id: '3', name: 'Data Sync', status: 'paused', executions: 456, success: 445 },
  ]);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Workflow Orchestration Engine</h1>
            <p className="text-muted-foreground">Advanced automation and orchestration</p>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Orchestrated Workflows</h2>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {workflows.filter(w => w.status === 'active').length} Active
          </span>
        </div>
        <div className="space-y-4">
          {workflows.map(w => (
            <div key={w.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{w.name}</h3>
                  <p className="text-sm text-muted-foreground">{w.executions} total executions</p>
                </div>
                <div className="flex items-center space-x-2">
                  {w.status === 'active' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {w.status === 'active' && <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>}
                  {w.status === 'paused' && <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Paused</span>}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-semibold">{((w.success / w.executions) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="h-2 bg-green-600 rounded-full" 
                    style={{ width: `${(w.success / w.executions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowOrchestrationEngine;
