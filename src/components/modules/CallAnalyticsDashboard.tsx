import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Phone,
  Clock,
  DollarSign,
  Users,
  Target,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

interface CallMetric {
  id: string;
  date: string;
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: number;
  cost: number;
  conversions: number;
}

const CallAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<CallMetric[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockMetrics: CallMetric[] = [
      { id: '1', date: '2024-01-15', totalCalls: 247, answeredCalls: 189, missedCalls: 58, avgDuration: 245, cost: 89.25, conversions: 23 },
      { id: '2', date: '2024-01-14', totalCalls: 198, answeredCalls: 156, missedCalls: 42, avgDuration: 230, cost: 72.10, conversions: 18 },
      { id: '3', date: '2024-01-13', totalCalls: 312, answeredCalls: 245, missedCalls: 67, avgDuration: 268, cost: 112.40, conversions: 34 },
    ];
    
    setMetrics(mockMetrics);
    setLoading(false);
  };

  const totalCalls = metrics.reduce((sum, m) => sum + m.totalCalls, 0);
  const totalAnswered = metrics.reduce((sum, m) => sum + m.answeredCalls, 0);
  const totalMissed = metrics.reduce((sum, m) => sum + m.missedCalls, 0);
  const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
  const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
  const answerRate = totalCalls > 0 ? (totalAnswered / totalCalls) * 100 : 0;
  const conversionRate = totalCalls > 0 ? (totalConversions / totalCalls) * 100 : 0;
  const avgDuration = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.avgDuration, 0) / metrics.length : 0;

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Call Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Deep insights into your Voice AI call performance
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
              className="px-4 py-2 border rounded bg-background"
            >
              <option value="day">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <button className="btn btn-outline flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Phone className="w-8 h-8 text-blue-500" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{totalCalls}</div>
          <div className="text-sm text-muted-foreground">Total Calls</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{answerRate.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">Answer Rate</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-purple-500" />
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">Conversion Rate</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-yellow-500" />
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Total Cost</div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium">Average Duration</span>
          </div>
          <div className="text-3xl font-bold mb-2">
            {Math.floor(avgDuration / 60)}m {avgDuration % 60}s
          </div>
          <div className="text-sm text-muted-foreground">
            Across all answered calls
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-6 h-6 text-purple-500" />
            <span className="text-sm font-medium">Conversions</span>
          </div>
          <div className="text-3xl font-bold mb-2">{totalConversions}</div>
          <div className="text-sm text-muted-foreground">
            Successfully converted leads
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-6 h-6 text-red-500" />
            <span className="text-sm font-medium">Missed Calls</span>
          </div>
          <div className="text-3xl font-bold mb-2">{totalMissed}</div>
          <div className="text-sm text-muted-foreground">
            Calls that went unanswered
          </div>
        </div>
      </div>

      {/* Call History Table */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Daily Call Metrics</h2>
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
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Total</th>
                  <th className="text-left py-3 px-4 font-semibold">Answered</th>
                  <th className="text-left py-3 px-4 font-semibold">Missed</th>
                  <th className="text-left py-3 px-4 font-semibold">Avg Duration</th>
                  <th className="text-left py-3 px-4 font-semibold">Cost</th>
                  <th className="text-left py-3 px-4 font-semibold">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.id} className="border-b hover:bg-accent/5">
                    <td className="py-3 px-4">{new Date(metric.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{metric.totalCalls}</td>
                    <td className="py-3 px-4 text-green-500">{metric.answeredCalls}</td>
                    <td className="py-3 px-4 text-red-500">{metric.missedCalls}</td>
                    <td className="py-3 px-4">{Math.floor(metric.avgDuration / 60)}m {metric.avgDuration % 60}s</td>
                    <td className="py-3 px-4">${metric.cost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-purple-500">{metric.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallAnalyticsDashboard;

