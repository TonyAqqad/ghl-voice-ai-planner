import React, { useState } from 'react';
import { TestTube, TrendingUp, Users, CheckCircle, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ABTestingFramework: React.FC = () => {
  const [tests, setTests] = useState([
    { id: '1', name: 'Script A vs B', variantA: 'Formal', variantB: 'Casual', participants: 450, winner: null, conversionA: 32.5, conversionB: 35.2 },
    { id: '2', name: 'Voice Tone', variantA: 'Energetic', variantB: 'Calm', participants: 320, winner: 'A', conversionA: 28.3, conversionB: 26.1 },
  ]);

  const handleStartTest = (testId: string) => {
    toast.success('Test started');
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">A/B Testing Framework</h1>
            <p className="text-muted-foreground">Test and optimize agent performance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <TestTube className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Active Tests</p>
          <p className="text-2xl font-bold">{tests.filter(t => !t.winner).length}</p>
        </div>
        <div className="card p-6">
          <Users className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Participants</p>
          <p className="text-2xl font-bold">770</p>
        </div>
        <div className="card p-6">
          <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Avg Lift</p>
          <p className="text-2xl font-bold">+12.3%</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Test Campaigns</h2>
        <div className="space-y-4">
          {tests.map(test => (
            <div key={test.id} className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{test.name}</h3>
                {test.winner ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Complete
                  </span>
                ) : (
                  <button onClick={() => handleStartTest(test.id)} className="btn btn-primary btn-sm">
                    <Play className="w-4 h-4 mr-1" />Start
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-2">Variant A: {test.variantA}</p>
                  <div className="h-2 bg-secondary rounded-full mb-1">
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${test.conversionA}%` }}></div>
                  </div>
                  <p className="text-sm text-muted-foreground">{test.conversionA}% conversion</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Variant B: {test.variantB}</p>
                  <div className="h-2 bg-secondary rounded-full mb-1">
                    <div className="h-2 bg-green-600 rounded-full" style={{ width: `${test.conversionB}%` }}></div>
                  </div>
                  <p className="text-sm text-muted-foreground">{test.conversionB}% conversion</p>
                </div>
              </div>
              {test.winner && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Winner: Variant {test.winner} ({test.conversionA > test.conversionB ? test.conversionA : test.conversionB}% conversion)</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ABTestingFramework;
