import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, 
  Activity, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Phone, 
  Zap,
  Globe,
  Clock,
  BarChart3,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeployedAgent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'paused';
  calls: number;
  conversions: number;
  averageDuration: number;
  conversionRate: number;
  lastActive: string;
  voice: string;
  location: string;
}

const AgentDeploymentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<DeployedAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      // In production, fetch from backend
      const mockAgents: DeployedAgent[] = [
        {
          id: '1',
          name: 'Solar Sales Agent',
          status: 'active',
          calls: 1247,
          conversions: 89,
          averageDuration: 245,
          conversionRate: 7.1,
          lastActive: new Date().toISOString(),
          voice: 'Rachel (ElevenLabs)',
          location: 'Main Location'
        },
        {
          id: '2',
          name: 'Lead Qualification Agent',
          status: 'active',
          calls: 892,
          conversions: 134,
          averageDuration: 180,
          conversionRate: 15.0,
          lastActive: new Date(Date.now() - 300000).toISOString(),
          voice: 'Adam (OpenAI)',
          location: 'Secondary Location'
        },
        {
          id: '3',
          name: 'Support Agent',
          status: 'paused',
          calls: 456,
          conversions: 67,
          averageDuration: 320,
          conversionRate: 14.7,
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          voice: 'Elli (ElevenLabs)',
          location: 'Support Location'
        },
      ];
      setAgents(mockAgents);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load agents:', error);
      toast.error('Failed to load deployed agents');
      setLoading(false);
    }
  };

  const handleToggleAgent = async (agentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      setAgents(agents.map(agent => 
        agent.id === agentId ? { ...agent, status: newStatus as any } : agent
      ));
      toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      toast.error('Failed to update agent status');
    }
  };

  const totalCalls = agents.reduce((sum, agent) => sum + agent.calls, 0);
  const totalConversions = agents.reduce((sum, agent) => sum + agent.conversions, 0);
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const overallConversionRate = totalCalls > 0 ? (totalConversions / totalCalls) * 100 : 0;

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Agent Deployment Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and manage your deployed Voice AI agents
            </p>
          </div>
          <button 
            onClick={() => navigate('/ghl-deployer')}
            className="btn btn-primary flex items-center"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Deploy New Agent
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-green-500" />
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{activeAgents}</div>
          <div className="text-sm text-muted-foreground">Active Agents</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Phone className="w-8 h-8 text-blue-500" />
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{totalCalls.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Calls</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-500" />
            <CheckCircle className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Conversions</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-yellow-500" />
            <TrendingUp className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold">{overallConversionRate.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">Conversion Rate</div>
        </div>
      </div>

      {/* Agents List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Deployed Agents</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <Rocket className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No agents deployed yet</p>
            <button className="mt-4 btn btn-primary">
              Deploy Your First Agent
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                className="p-4 border rounded hover:bg-accent/5 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <span className={`px-3 py-1 rounded text-sm ${
                        agent.status === 'active' ? 'bg-green-500/20 text-green-500' :
                        agent.status === 'paused' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Calls</div>
                        <div className="font-semibold">{agent.calls.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Conversions</div>
                        <div className="font-semibold">{agent.conversions.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Duration</div>
                        <div className="font-semibold">{Math.floor(agent.averageDuration / 60)}m {agent.averageDuration % 60}s</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                        <div className="font-semibold text-green-500">{agent.conversionRate.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 mr-1" />
                        {agent.voice}
                      </div>
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-1" />
                        {agent.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(agent.lastActive).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => handleToggleAgent(agent.id, agent.status)}
                      className="btn btn-outline"
                      title={agent.status === 'active' ? 'Pause Agent' : 'Activate Agent'}
                    >
                      {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="btn btn-outline">
                      <Settings className="w-4 h-4" />
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

export default AgentDeploymentDashboard;

