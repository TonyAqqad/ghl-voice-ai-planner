import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Award,
  Zap
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface Benchmark {
  name: string;
  current: number;
  previous: number;
  target: number;
  status: 'meeting' | 'below' | 'above';
  change: number;
}

const PerformanceBenchmarking: React.FC = () => {
  const { voiceAgents } = useStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const benchmarks: Benchmark[] = [
    {
      name: 'Call Answer Rate',
      current: 94.2,
      previous: 92.8,
      target: 95,
      status: 'meeting',
      change: 1.4
    },
    {
      name: 'Average Handle Time',
      current: 3.2,
      previous: 3.8,
      target: 3.0,
      status: 'above',
      change: -15.8
    },
    {
      name: 'Customer Satisfaction',
      current: 4.6,
      previous: 4.4,
      target: 4.5,
      status: 'meeting',
      change: 4.5
    },
    {
      name: 'First Call Resolution',
      current: 78.5,
      previous: 75.2,
      target: 80,
      status: 'below',
      change: 4.4
    },
    {
      name: 'Transfer Rate',
      current: 12.3,
      previous: 15.1,
      target: 10,
      status: 'above',
      change: -18.5
    },
    {
      name: 'Cost per Call',
      current: 0.85,
      previous: 0.92,
      target: 0.80,
      status: 'above',
      change: -7.6
    }
  ];

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Performance Benchmarking</h1>
            <p className="text-muted-foreground">
              Compare performance against targets and industry benchmarks
            </p>
          </div>
          <div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border rounded bg-background"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Meeting Targets</p>
              <p className="text-2xl font-bold">
                {benchmarks.filter(b => b.status === 'meeting').length}/{benchmarks.length}
              </p>
            </div>
            <Award className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Change</p>
              <p className="text-2xl font-bold text-green-600">+2.1%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Above Target</p>
              <p className="text-2xl font-bold text-blue-600">
                {benchmarks.filter(b => b.status === 'above').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Needs Attention</p>
              <p className="text-2xl font-bold text-yellow-600">
                {benchmarks.filter(b => b.status === 'below').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Benchmarks */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Benchmarks</h2>
        <div className="space-y-4">
          {benchmarks.map((benchmark, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{benchmark.name}</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current: </span>
                      <span className="font-medium">{benchmark.current}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Previous: </span>
                      <span className="font-medium">{benchmark.previous}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target: </span>
                      <span className="font-medium">{benchmark.target}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {benchmark.change > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`text-sm font-semibold ${benchmark.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(benchmark.change).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${
                    benchmark.status === 'meeting' ? 'bg-green-500' :
                    benchmark.status === 'above' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(100, (benchmark.current / benchmark.target) * 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-full font-medium ${
                  benchmark.status === 'meeting' ? 'bg-green-100 text-green-800' :
                  benchmark.status === 'above' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {benchmark.status === 'meeting' ? '✓ Meeting Target' :
                   benchmark.status === 'above' ? '✓ Above Target' :
                   '⚠ Below Target'}
                </span>
                <span className="text-muted-foreground">
                  Target: {benchmark.target}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceBenchmarking;
