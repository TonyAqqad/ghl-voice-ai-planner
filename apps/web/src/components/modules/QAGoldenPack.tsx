import React, { useState } from 'react';
import { 
  Bug, 
  CheckCircle,
  XCircle,
  Play,
  Download,
  FileText,
  Settings,
  TrendingUp,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface TestCase {
  id: string;
  category: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'pending';
  duration: number;
}

const QAGoldenPack: React.FC = () => {
  const { voiceAgents } = useStore();
  const [selectedAgent, setSelectedAgent] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const goldenTests = [
    { category: 'Voice', name: 'Voice Quality Test', description: 'Test voice clarity and naturalness' },
    { category: 'Intent', name: 'Intent Detection Accuracy', description: 'Verify intent recognition accuracy' },
    { category: 'Script', name: 'Script Flow Test', description: 'Test all conversation flows' },
    { category: 'Transfer', name: 'Transfer Rules Test', description: 'Verify transfer logic' },
    { category: 'Compliance', name: 'TCPA Compliance Check', description: 'Validate compliance scripts' },
    { category: 'Performance', name: 'Response Time Test', description: 'Measure response latency' }
  ];

  const handleRunAll = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    setIsRunning(true);
    
    // Simulate running tests
    const newTests: TestCase[] = goldenTests.map((test, idx) => ({
      id: `test_${idx}`,
      category: test.category,
      name: test.name,
      description: test.description,
      status: 'pending' as const,
      duration: 0
    }));
    
    setTestCases(newTests);

    for (let i = 0; i < newTests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestCases(prev => {
        const updated = [...prev];
        updated[i] = {
          ...updated[i],
          status: Math.random() > 0.2 ? 'pass' : 'fail',
          duration: Math.floor(Math.random() * 500) + 200
        };
        return updated;
      });
    }

    setIsRunning(false);
    toast.success('QA Golden Pack tests completed');
  };

  const passCount = testCases.filter(t => t.status === 'pass').length;
  const failCount = testCases.filter(t => t.status === 'fail').length;
  const successRate = testCases.length > 0 ? (passCount / testCases.length) * 100 : 0;

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">QA Golden Pack</h1>
            <p className="text-muted-foreground">
              Comprehensive testing and QA framework for voice agents
            </p>
          </div>
        </div>
      </div>

      {/* Run Tests */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Run Golden Pack Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              disabled={isRunning}
              className="w-full px-4 py-2 border rounded bg-background"
            >
              <option value="">Choose an agent...</option>
              {voiceAgents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRunAll}
              disabled={!selectedAgent || isRunning}
              className="btn btn-primary w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {testCases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{testCases.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">{passCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">{successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        {testCases.length === 0 ? (
          <div className="text-center py-12">
            <Bug className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tests run yet</p>
            <p className="text-sm text-muted-foreground">Run the Golden Pack tests to see results</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testCases.map((test, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4 flex-1">
                  {test.status === 'pass' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {test.status === 'fail' && <XCircle className="w-5 h-5 text-red-600" />}
                  {test.status === 'pending' && <Clock className="w-5 h-5 text-muted-foreground" />}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold">{test.name}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary">
                        {test.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  {test.status !== 'pending' && (
                    <>
                      <span className="text-muted-foreground">{test.duration}ms</span>
                      {test.status === 'pass' ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Pass
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Fail
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QAGoldenPack;
