import React, { useState } from 'react';
import { Zap, TrendingUp, Target, Lightbulb } from 'lucide-react';

const AgentOptimizationEngine: React.FC = () => {
  const [suggestions, setSuggestions] = useState([
    { id: '1', category: 'Performance', description: 'Optimize response time', impact: 'High', status: 'pending' },
    { id: '2', category: 'Cost', description: 'Reduce API calls by 20%', impact: 'High', status: 'applied' },
    { id: '3', category: 'Quality', description: 'Improve voice clarity', impact: 'Medium', status: 'pending' },
  ]);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Agent Optimization Engine</h1>
            <p className="text-muted-foreground">AI-powered performance optimization</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <Lightbulb className="w-8 h-8 text-yellow-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Suggestions</p>
          <p className="text-2xl font-bold">{suggestions.length}</p>
        </div>
        <div className="card p-6">
          <Target className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Applied</p>
          <p className="text-2xl font-bold">{suggestions.filter(s => s.status === 'applied').length}</p>
        </div>
        <div className="card p-6">
          <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Avg Impact</p>
          <p className="text-2xl font-bold">+18%</p>
        </div>
        <div className="card p-6">
          <Zap className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Savings</p>
          <p className="text-2xl font-bold">$245</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Optimization Suggestions</h2>
        <div className="space-y-4">
          {suggestions.map(s => (
            <div key={s.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{s.description}</h3>
                  <p className="text-sm text-muted-foreground">{s.category}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {s.impact === 'High' && <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">High Impact</span>}
                  {s.status === 'applied' && <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Applied</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentOptimizationEngine;
