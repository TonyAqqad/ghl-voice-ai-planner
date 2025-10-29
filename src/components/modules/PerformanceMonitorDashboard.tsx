import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  Gauge
} from 'lucide-react';

interface Metric {
  name: string;
  value: number | string;
  change: number;
  status: 'up' | 'down' | 'neutral';
  target: number;
}

const PerformanceMonitorDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadMetrics = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockMetrics: Metric[] = [
      { name: 'Average Response Time', value: '245ms', change: -12.5, status: 'up', target: 300 },
      { name: 'Call Success Rate', value: '98.2%', change: 2.1, status: 'up', target: 95 },
      { name: 'Active Agents', value: 12, change: 2, status: 'up', target: 10 },
      { name: 'Daily Call Volume', value: '2,847', change: 15.3, status: 'up', target: 2000 },
      { name: 'Token Usage (Today)', value: '847K', change: -8.2, status: 'down', target: 1000 },
      { name: 'API Uptime', value: '99.98%', change: 0.01, status: 'up', target: 99.9 },
      { name: 'Error Rate', value: '0.18%', change: -0.05, status: 'down', target: 1 },
      { name: 'Conversion Rate', value: '14.6%', change: 3.2, status: 'up', target: 12 },
    ];
    
    setMetrics(mockMetrics);
    setLoading(false);
  };

  const getMetricColor = (status: 'up' | 'down' | 'neutral', change: number) => {
    if (status === 'up') return 'text-green-500';
    if (status === 'down' && change < 0) return 'text-green-500'; // Down in errors is good
    if (status === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  const getMetricIcon = (status: 'up' | 'down' | 'neutral', change: number) => {
    if (status === 'up') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (status === 'down' && change < 0) return <TrendingDown className="w-5 h-5 text-green-500" />;
    if (status === 'down') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Activity className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Performance Monitor</h1>
            <p className="text-muted-foreground">
              Real-time system performance metrics and monitoring
            </p>
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-4 py-2 border rounded bg-background"
          >
            <option value={10}>Refresh: 10s</option>
            <option value={30}>Refresh: 30s</option>
            <option value={60}>Refresh: 60s</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.slice(0, 4).map((metric, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Gauge className="w-8 h-8 text-primary" />
              {getMetricIcon(metric.status, metric.change)}
            </div>
            <div className="text-2xl font-bold mb-2">{metric.value}</div>
            <div className="text-sm text-muted-foreground mb-3">{metric.name}</div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${getMetricColor(metric.status, metric.change)}`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Metrics Table */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">All Performance Metrics</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading metrics...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Metric</th>
                  <th className="text-left py-3 px-4 font-semibold">Value</th>
                  <th className="text-left py-3 px-4 font-semibold">Target</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Change</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, index) => (
                  <tr key={index} className="border-b hover:bg-accent/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span>{metric.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">{metric.value}</td>
                    <td className="py-3 px-4 text-muted-foreground">{metric.target}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        metric.status === 'up' ? 'bg-green-500/20 text-green-500' :
                        metric.status === 'down' ? 'bg-red-500/20 text-red-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {metric.status === 'up' ? 'Excellent' : 
                         metric.status === 'down' ? 'Needs Attention' : 'Normal'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getMetricIcon(metric.status, metric.change)}
                        <span className={`font-semibold ${getMetricColor(metric.status, metric.change)}`}>
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-sm font-semibold">System Health</span>
          </div>
          <div className="text-3xl font-bold text-green-500">Excellent</div>
          <div className="text-sm text-muted-foreground mt-2">
            All systems operational
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <span className="text-sm font-semibold">Alerts</span>
          </div>
          <div className="text-3xl font-bold">2</div>
          <div className="text-sm text-muted-foreground mt-2">
            Minor issues detected
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-blue-500" />
            <span className="text-sm font-semibold">Uptime</span>
          </div>
          <div className="text-3xl font-bold">99.98%</div>
          <div className="text-sm text-muted-foreground mt-2">
            Last 30 days
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitorDashboard;

