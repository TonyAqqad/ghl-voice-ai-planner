import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Phone, 
  TrendingUp, 
  Users, 
  Clock, 
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  Radio
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Skeleton, CardSkeleton } from '../ui/LoadingStates';
import { toast } from 'react-hot-toast';

interface LiveAgent {
  id: string;
  name: string;
  status: 'on-call' | 'idle' | 'busy' | 'offline';
  currentCall?: {
    duration: string;
    contact: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
  metrics: {
    callsToday: number;
    avgDuration: number;
    successRate: number;
  };
}

const RealTimeAgentMonitor: React.FC = () => {
  const { voiceAgents } = useStore();
  const [liveAgents, setLiveAgents] = useState<LiveAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // WebSocket connection for real-time updates
  const wsUrl = process.env.NODE_ENV === 'production' 
    ? 'wss://ghlvoiceai.captureclient.com/ws'
    : 'ws://localhost:10000/ws';
    
  const { isConnected, lastMessage } = useWebSocket({
    url: wsUrl,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    onMessage: (data) => {
      if (data.type === 'agent-update') {
        setLiveAgents(prev => 
          prev.map(agent => 
            agent.id === data.agentId 
              ? { ...agent, ...data.update }
              : agent
          )
        );
        toast.success(`Update: ${data.agentName}`);
      }
    },
    onOpen: () => toast.success('Live monitoring connected'),
    onError: () => toast.error('Connection lost, attempting to reconnect...'),
    autoConnect: true
  });

  useEffect(() => {
    // Simulate loading live agent data
    const loadAgents = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockAgents: LiveAgent[] = [
        {
          id: '1',
          name: 'Sales Agent - Main',
          status: 'on-call',
          currentCall: {
            duration: '4:32',
            contact: 'John Doe',
            sentiment: 'positive'
          },
          metrics: {
            callsToday: 47,
            avgDuration: 245,
            successRate: 87.5
          }
        },
        {
          id: '2',
          name: 'Support Agent',
          status: 'idle',
          metrics: {
            callsToday: 32,
            avgDuration: 180,
            successRate: 92.3
          }
        },
        {
          id: '3',
          name: 'Lead Qualification',
          status: 'on-call',
          currentCall: {
            duration: '2:15',
            contact: 'Jane Smith',
            sentiment: 'neutral'
          },
          metrics: {
            callsToday: 58,
            avgDuration: 195,
            successRate: 81.2
          }
        },
        {
          id: '4',
          name: 'Appointment Setter',
          status: 'busy',
          metrics: {
            callsToday: 41,
            avgDuration: 320,
            successRate: 94.7
          }
        },
      ];

      setLiveAgents(mockAgents);
      setIsLoading(false);
    };

    loadAgents();
  }, []);

  const getStatusColor = (status: LiveAgent['status']) => {
    switch (status) {
      case 'on-call': return 'text-green-500';
      case 'busy': return 'text-orange-500';
      case 'idle': return 'text-blue-500';
      case 'offline': return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: LiveAgent['status']) => {
    switch (status) {
      case 'on-call': return <Phone className="w-4 h-4" />;
      case 'busy': return <Clock className="w-4 h-4" />;
      case 'idle': return <CheckCircle className="w-4 h-4" />;
      case 'offline': return <AlertCircle className="w-4 h-4" />;
    }
  };

  const activeCalls = liveAgents.filter(a => a.status === 'on-call').length;
  const totalCalls = liveAgents.reduce((sum, a) => sum + a.metrics.callsToday, 0);
  const avgSuccessRate = liveAgents.length > 0
    ? liveAgents.reduce((sum, a) => sum + a.metrics.successRate, 0) / liveAgents.length
    : 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold gradient-text">Real-Time Agent Monitor</h1>
              {isConnected ? (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-3 py-1 bg-red-500/10 text-red-500 rounded-full">
                  <Radio className="w-4 h-4" />
                  <span className="text-sm font-medium">Disconnected</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground">
              Monitor your voice AI agents in real-time across all locations
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Active Calls</span>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">{activeCalls}</p>
          <p className="text-xs text-muted-foreground mt-1">
            of {liveAgents.length} agents
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Calls Today</span>
            <Phone className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">{totalCalls.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            across all agents
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Success Rate</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            average performance
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-green-500">Operational</p>
          <p className="text-xs text-muted-foreground mt-1">
            all systems normal
          </p>
        </div>
      </div>

      {/* Agents List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {liveAgents.map((agent) => (
          <div 
            key={agent.id} 
            className={`card p-6 hover:shadow-lg transition-all duration-200 cursor-pointer ${
              selectedAgent === agent.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedAgent(agent.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  agent.status === 'on-call' ? 'bg-green-500/10' :
                  agent.status === 'busy' ? 'bg-orange-500/10' :
                  agent.status === 'idle' ? 'bg-blue-500/10' :
                  'bg-gray-500/10'
                }`}>
                  <div className={getStatusColor(agent.status)}>
                    {getStatusIcon(agent.status)}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                agent.status === 'on-call' ? 'bg-green-500/10 text-green-500' :
                agent.status === 'busy' ? 'bg-orange-500/10 text-orange-500' :
                agent.status === 'idle' ? 'bg-blue-500/10 text-blue-500' :
                'bg-gray-500/10 text-gray-500'
              }`}>
                {agent.status.replace('-', ' ')}
              </div>
            </div>

            {/* Current Call Info */}
            {agent.currentCall && (
              <div className="mb-4 p-3 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">On Call</p>
                    <p className="font-medium">{agent.currentCall.contact}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-mono text-sm">{agent.currentCall.duration}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs font-medium">Sentiment:</span>
                  <span className={`text-xs ${
                    agent.currentCall.sentiment === 'positive' ? 'text-green-500' :
                    agent.currentCall.sentiment === 'negative' ? 'text-red-500' :
                    'text-yellow-500'
                  }`}>
                    {agent.currentCall.sentiment}
                  </span>
                </div>
              </div>
            )}

            {/* Metrics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Calls Today</span>
                <span className="font-medium">{agent.metrics.callsToday}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Duration</span>
                <span className="font-medium">{agent.metrics.avgDuration}s</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium">{agent.metrics.successRate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealTimeAgentMonitor;

