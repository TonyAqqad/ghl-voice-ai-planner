import React, { useState } from 'react';
import { TrendingUp, Activity, Target, Calendar } from 'lucide-react';

const PredictiveAnalytics: React.FC = () => {
  const predictions = [
    { metric: 'Call Volume', current: 1523, predicted: 1850, change: '+21.5%' },
    { metric: 'Conversion Rate', current: 32.5, predicted: 35.2, change: '+8.3%' },
    { metric: 'Revenue', current: 25430, predicted: 28900, change: '+13.6%' },
    { metric: 'Cost per Call', current: 0.85, predicted: 0.78, change: '-8.2%' },
  ];

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Predictive Analytics</h1>
            <p className="text-muted-foreground">AI-powered forecasting and predictions</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Next 30 Days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {predictions.map((pred, idx) => (
          <div key={idx} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{pred.metric}</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current</span>
                <span className="font-semibold">{pred.current.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Predicted</span>
                <span className="font-bold text-primary">{pred.predicted.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t">
                <span className={`text-sm font-medium ${pred.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {pred.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Insights</h2>
        <ul className="space-y-3">
          <li className="flex items-start space-x-3">
            <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">Call volume is trending up</p>
              <p className="text-sm text-muted-foreground">Expect 21.5% increase in the next 30 days</p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <Target className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Optimize agent configurations</p>
              <p className="text-sm text-muted-foreground">Predicted conversion rate improvement of 8.3%</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
