import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Phone,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MonitoringData {
  activeCalls: number;
  queueSize: number;
  avgWaitTime: number;
  serviceLevel: number;
  agentsAvailable: number;
  agentsOnCalls: number;
}

const RealTimeMonitoring: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [data, setData] = useState<MonitoringData>({
    activeCalls: 12,
    queueSize: 3,
    avgWaitTime: 45,
    serviceLevel: 94.5,
    agentsAvailable: 8,
    agentsOnCalls: 4
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      interval = setInterval(() => {
        setData(prev => ({
          activeCalls: prev.activeCalls + Math.floor(Math.random() * 3) - 1,
          queueSize: Math.max(0, prev.queueSize + Math.floor(Math.random() * 2) - 1),
          avgWaitTime: Math.max(0, prev.avgWaitTime + Math.floor(Math.random() * 5) - 2),
          serviceLevel: Math.min(100, prev.serviceLevel + (Math.random() - 0.5) * 2),
          agentsAvailable: prev.agentsAvailable,
          agentsOnCalls: prev.agentsOnCalls
        }));
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const metrics = [
    { label: 'Active Calls', value: data.activeCalls, icon: Phone, color: 'text-blue-600' },
    { label: 'Queue Size', value: data.queueSize, icon: Users, color: 'text-orange-600' },
    { label: 'Avg Wait Time', value: `${data.avgWaitTime}s`, icon: Clock, color: 'text-yellow-600' },
    { label: 'Service Level', value: `${data.serviceLevel.toFixed(1)}%`, icon: CheckCircle, color: 'text-green-600' }
  ];

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Real-Time Monitoring</h1>
            <p className="text-muted-foreground">
              Live performance monitoring and analytics
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setIsMonitoring(!isMonitoring);
                toast.success(isMonitoring ? 'Monitoring paused' : 'Monitoring resumed');
              }}
              className="btn btn-outline"
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              )}
            </button>
            <button
              onClick={() => {
                setData({
                  activeCalls: Math.floor(Math.random() * 20),
                  queueSize: Math.floor(Math.random() * 5),
                  avgWaitTime: Math.floor(Math.random() * 120),
                  serviceLevel: 85 + Math.random() * 15,
                  agentsAvailable: 8,
                  agentsOnCalls: 4
                });
                toast.success('Data refreshed');
              }}
              className="btn btn-primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`card p-4 mb-6 ${isMonitoring ? 'bg-green-500/10 border-green-500' : 'bg-yellow-500/10 border-yellow-500'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <div>
            <p className="font-semibold">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isMonitoring ? 'Receiving real-time updates' : 'Updates paused'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => (
          <div key={idx} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <metric.icon className={`w-8 h-8 ${metric.color}`} />
              {isMonitoring && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-3xl font-bold">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Agent Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Agent Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Available</span>
              </div>
              <span className="text-2xl font-bold">{data.agentsAvailable}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">On Calls</span>
              </div>
              <span className="text-2xl font-bold">{data.agentsOnCalls}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CPU Usage</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm font-semibold">45%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Memory Usage</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '62%' }}></div>
                </div>
                <span className="text-sm font-semibold">62%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Response</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold">Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { time: 'Just now', event: 'New call started', icon: Phone, color: 'text-blue-600' },
            { time: '2 min ago', event: 'Call completed successfully', icon: CheckCircle, color: 'text-green-600' },
            { time: '5 min ago', event: 'Agent status updated', icon: Users, color: 'text-purple-600' },
            { time: '8 min ago', event: 'Queue processed', icon: Zap, color: 'text-yellow-600' },
            { time: '12 min ago', event: 'System check completed', icon: Activity, color: 'text-green-600' }
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center space-x-3 pb-3 border-b last:border-0">
              <activity.icon className={`w-5 h-5 ${activity.color}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.event}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitoring;
