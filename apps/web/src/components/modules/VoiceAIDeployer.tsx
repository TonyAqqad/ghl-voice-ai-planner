import React, { useState } from 'react';
import { 
  Zap, 
  Play, 
  Pause, 
  Trash2, 
  Edit3, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Rocket,
  Activity,
  Settings,
  Phone,
  Bot,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface Deployment {
  id: string;
  agentName: string;
  environment: 'development' | 'staging' | 'production';
  status: 'active' | 'paused' | 'stopped';
  calls: number;
  successRate: number;
  deployedAt: string;
}

const VoiceAIDeployer: React.FC = () => {
  const { voiceAgents } = useStore();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('production');
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent to deploy');
      return;
    }

    setIsDeploying(true);
    
    try {
      // Simulate deployment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDeployment: Deployment = {
        id: `dep_${Date.now()}`,
        agentName: voiceAgents.find(a => a.id === selectedAgent)?.name || 'Unknown',
        environment,
        status: 'active',
        calls: 0,
        successRate: 98,
        deployedAt: new Date().toISOString()
      };
      
      setDeployments([newDeployment, ...deployments]);
      toast.success('Agent deployed successfully!');
    } catch (error) {
      toast.error('Failed to deploy agent');
    } finally {
      setIsDeploying(false);
    }
  };

  const handlePause = (id: string) => {
    setDeployments(deployments.map(d => 
      d.id === id ? { ...d, status: d.status === 'active' ? 'paused' : 'active' } : d
    ));
    toast.success('Deployment status updated');
  };

  const handleDelete = (id: string) => {
    setDeployments(deployments.filter(d => d.id !== id));
    toast.success('Deployment deleted');
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Voice AI Deployer</h1>
        <p className="text-muted-foreground">
          Deploy and manage voice AI agents across environments
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Deployments</p>
              <p className="text-2xl font-bold">{deployments.length}</p>
            </div>
            <Rocket className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{deployments.filter(d => d.status === 'active').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold">{deployments.reduce((sum, d) => sum + d.calls, 0)}</p>
            </div>
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Success</p>
              <p className="text-2xl font-bold">
                {deployments.length > 0 
                  ? Math.round(deployments.reduce((sum, d) => sum + d.successRate, 0) / deployments.length)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Deploy New Agent */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Deploy New Agent</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-4 py-2 border rounded bg-background"
            >
              <option value="">Choose an agent...</option>
              {voiceAgents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="w-full px-4 py-2 border rounded bg-background"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleDeploy}
              disabled={!selectedAgent || isDeploying}
              className="btn btn-primary w-full"
            >
              <Rocket className="w-4 h-4 mr-2" />
              {isDeploying ? 'Deploying...' : 'Deploy Agent'}
            </button>
          </div>
        </div>
      </div>

      {/* Deployments List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Active Deployments</h2>
        {deployments.length === 0 ? (
          <div className="text-center py-12">
            <Rocket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No deployments yet</p>
            <p className="text-sm text-muted-foreground">Deploy your first agent to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{deployment.agentName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        deployment.environment === 'production' 
                          ? 'bg-red-100 text-red-800'
                          : deployment.environment === 'staging'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {deployment.environment}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        deployment.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : deployment.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {deployment.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Calls</p>
                        <p className="font-semibold">{deployment.calls}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-semibold">{deployment.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deployed</p>
                        <p className="font-semibold">{new Date(deployment.deployedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePause(deployment.id)}
                      className="btn btn-outline btn-sm"
                    >
                      {deployment.status === 'active' ? (
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
                      onClick={() => handleDelete(deployment.id)}
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
    </div>
  );
};

export default VoiceAIDeployer;
