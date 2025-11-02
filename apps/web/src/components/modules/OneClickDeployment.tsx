import React, { useState } from 'react';
import { 
  Rocket, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Zap,
  Settings,
  Activity,
  Globe,
  Shield,
  Play
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface DeploymentProgress {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string;
}

const OneClickDeployment: React.FC = () => {
  const { voiceAgents } = useStore();
  const [selectedAgent, setSelectedAgent] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'staging'>('production');
  const [isDeploying, setIsDeploying] = useState(false);
  const [progress, setProgress] = useState<DeploymentProgress[]>([]);

  const deploymentSteps = [
    { name: 'Validate Configuration', message: 'Checking agent configuration...' },
    { name: 'Build Assets', message: 'Building voice and configuration assets...' },
    { name: 'Connect to GHL', message: 'Establishing connection to GoHighLevel...' },
    { name: 'Upload Configurations', message: 'Uploading agent configurations...' },
    { name: 'Configure Webhooks', message: 'Setting up webhook endpoints...' },
    { name: 'Activate Agent', message: 'Activating voice AI agent...' },
    { name: 'Finalize Deployment', message: 'Completing deployment...' }
  ];

  const handleDeploy = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent to deploy');
      return;
    }

    setIsDeploying(true);
    setProgress(deploymentSteps.map(step => ({ 
      step: step.name, 
      status: 'pending' as const, 
      message: step.message 
    })));

    // Simulate deployment process
    for (let i = 0; i < deploymentSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProgress(prev => {
        const updated = [...prev];
        updated[i] = { 
          step: updated[i].step, 
          status: 'completed' as const, 
          message: `✅ ${deploymentSteps[i].name} completed successfully` 
        };
        if (i < prev.length - 1) {
          updated[i + 1].status = 'running';
        }
        return updated;
      });
    }

    setIsDeploying(false);
    toast.success('Agent deployed successfully!');
  };

  const agent = voiceAgents.find(a => a.id === selectedAgent);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">One-Click Deployment</h1>
        <p className="text-muted-foreground">
          Deploy voice agents to production with a single click
        </p>
      </div>

      {/* Selection */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Deployment Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              disabled={isDeploying}
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
              disabled={isDeploying}
              className="w-full px-4 py-2 border rounded bg-background"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
            </select>
          </div>
        </div>

        {agent && (
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">{agent.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Voice Provider: </span>
                <span className="font-medium">{agent.voiceProvider}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Language: </span>
                <span className="font-medium">{agent.defaultLanguage}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleDeploy}
          disabled={!selectedAgent || isDeploying}
          className="btn btn-primary w-full"
        >
          <Rocket className="w-4 h-4 mr-2" />
          {isDeploying ? 'Deploying...' : 'Deploy to Production'}
        </button>
      </div>

      {/* Deployment Progress */}
      {isDeploying && progress.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Deployment Progress</h2>
          <div className="space-y-3">
            {progress.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {item.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {item.status === 'running' && (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {item.status === 'pending' && (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.step}</p>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <Rocket className="w-8 h-8 text-primary" />
            <div className="text-right">
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Total Deployments</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="text-right">
              <p className="text-2xl font-bold">98.5%</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div className="text-right">
              <p className="text-2xl font-bold">45s</p>
              <p className="text-xs text-muted-foreground">Avg Deploy Time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneClickDeployment;
