import React, { useState } from 'react';
import { Cpu, Activity, Target, Zap } from 'lucide-react';

const MLPerformanceOptimization: React.FC = () => {
  const [metrics, setMetrics] = useState({
    accuracy: 94.5,
    latency: 245,
    throughput: 120,
    cpuUsage: 68,
  });

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">ML Performance Optimization</h1>
            <p className="text-muted-foreground">Real-time machine learning optimization</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Accuracy</span>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold">{metrics.accuracy}%</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Latency</span>
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">{metrics.latency}ms</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Throughput</span>
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold">{metrics.throughput}/s</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">CPU Usage</span>
            <Cpu className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold">{metrics.cpuUsage}%</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Model Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold">Intent Classification Model</p>
              <p className="text-sm text-muted-foreground">v2.3.1 - Active</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Optimized</span>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold">Sentiment Analysis Model</p>
              <p className="text-sm text-muted-foreground">v1.8.4 - Active</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLPerformanceOptimization;
