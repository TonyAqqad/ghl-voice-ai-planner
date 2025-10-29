import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Phone,
  Users,
  Clock,
  Target,
  Filter,
  Download,
  Calendar,
  Activity
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const AnalyticsDashboard: React.FC = () => {
  const { voiceAgents, analytics } = useStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState('calls');

  const stats = {
    totalCalls: 1523,
    successfulCalls: 1420,
    avgCallDuration: 245,
    totalCost: 1285.50,
    conversionRate: 32.5,
    avgWaitTime: 15,
    agentsActive: 4
  };

  const metrics = [
    { label: 'Total Calls', value: stats.totalCalls, icon: Phone, color: 'text-blue-600', change: '+12%' },
    { label: 'Success Rate', value: `${((stats.successfulCalls / stats.totalCalls) * 100).toFixed(1)}%`, icon: Target, color: 'text-green-600', change: '+3.2%' },
    { label: 'Avg Duration', value: `${stats.avgCallDuration}s`, icon: Clock, color: 'text-purple-600', change: '-5s' },
    { label: 'Total Cost', value: `$${stats.totalCost.toFixed(2)}`, icon: DollarSign, color: 'text-orange-600', change: '-8%' },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'text-green-600', change: '+2.1%' },
    { label: 'Avg Wait', value: `${stats.avgWaitTime}s`, icon: Activity, color: 'text-yellow-600', change: '-2s' }
  ];

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Performance metrics, cost analysis, and insights
            </p>
          </div>
          <div className="flex space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border rounded bg-background"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button className="btn btn-outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {metrics.map((metric, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
              {metric.change.startsWith('+') ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className={`text-xs font-medium mt-1 ${
              metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {metric.change}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Call Volume Trend</h2>
          <div className="h-64 flex items-end justify-center space-x-2">
            {[65, 72, 68, 85, 78, 90, 95].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-primary rounded-t transition-all"
                  style={{ height: `${height}%`, minHeight: '20px' }}
                ></div>
                <span className="text-xs text-muted-foreground mt-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Cost Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Voice AI</span>
                <span className="text-sm font-bold">${(stats.totalCost * 0.6).toFixed(2)}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="h-2 bg-blue-600 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">LLM API</span>
                <span className="text-sm font-bold">${(stats.totalCost * 0.3).toFixed(2)}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="h-2 bg-green-600 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Phone</span>
                <span className="text-sm font-bold">${(stats.totalCost * 0.1).toFixed(2)}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="h-2 bg-purple-600 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Top Performing Agents</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Agent</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Calls</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Success</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Conversion</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Cost</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">ROI</th>
              </tr>
            </thead>
            <tbody>
              {voiceAgents.map((agent) => (
                <tr key={agent.id} className="border-b hover:bg-accent/30">
                  <td className="py-3 px-4">
                    <div className="font-medium">{agent.name}</div>
                  </td>
                  <td className="text-right py-3 px-4 text-sm">{agent.analytics.totalCalls}</td>
                  <td className="text-right py-3 px-4 text-sm">{agent.analytics.successfulCalls}</td>
                  <td className="text-right py-3 px-4 text-sm font-semibold">
                    {Math.round(agent.analytics.conversionRate * 100)}%
                  </td>
                  <td className="text-right py-3 px-4 text-sm">${agent.analytics.costPerCall.toFixed(2)}</td>
                  <td className="text-right py-3 px-4">
                    <span className="text-green-600 font-semibold">+{Math.floor(Math.random() * 100)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
