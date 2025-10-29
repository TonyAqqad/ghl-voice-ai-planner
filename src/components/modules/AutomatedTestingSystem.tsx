import React, { useState } from 'react';
import { 
  TestTube, 
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  RefreshCw,
  Download,
  Settings,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface TestSuite {
  id: string;
  name: string;
  agent: string;
  tests: {
    name: string;
    status: 'passed' | 'failed' | 'running' | 'pending';
    duration: number;
    error?: string;
  }[];
  status: 'running' | 'completed' | 'failed';
  completedAt?: string;
}

const AutomatedTestingSystem: React.FC = () => {
  const { voiceAgents } = useStore();
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent to test');
      return;
    }

    const agent = voiceAgents.find(a => a.id === selectedAgent);
    if (!agent) return;

    setIsRunning(true);

    const newSuite: TestSuite = {
      id: `suite_${Date.now()}`,
      name: `Test Suite - ${new Date().toLocaleString()}`,
      agent: agent.name,
      tests: [
        { name: 'Voice Configuration Test', status: 'pending', duration: 0 },
        { name: 'Script Validation Test', status: 'pending', duration: 0 },
        { name: 'Intent Recognition Test', status: 'pending', duration: 0 },
        { name: 'Transfer Rules Test', status: 'pending', duration: 0 },
        { name: 'Compliance Check Test', status: 'pending', duration: 0 }
      ],
      status: 'running'
    };

    setTestSuites([newSuite, ...testSuites]);

    // Simulate test execution
    for (let i = 0; i < newSuite.tests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTestSuites(prev => {
        const updated = prev.map(suite => {
          if (suite.id === newSuite.id) {
            const updatedTests = [...suite.tests];
            updatedTests[i] = {
              ...updatedTests[i],
              status: Math.random() > 0.1 ? 'passed' : 'failed',
              duration: Math.floor(Math.random() * 1000) + 500
            };
            
            const allCompleted = updatedTests.every(t => t.status !== 'pending' && t.status !== 'running');
            return {
              ...suite,
              tests: updatedTests,
              status: allCompleted ? 
                (updatedTests.every(t => t.status === 'passed') ? 'completed' as const : 'failed' as const) : 
                ('running' as const),
              completedAt: allCompleted ? new Date().toISOString() : undefined
            };
          }
          return suite;
        });
        return updated;
      });
    }

    setIsRunning(false);
    toast.success('Test suite completed');
  };

  const completedSuites = testSuites.filter(s => s.status === 'completed').length;
  const failedSuites = testSuites.filter(s => s.status === 'failed').length;
  const totalTests = testSuites.reduce((sum, s) => sum + s.tests.length, 0);
  const passedTests = testSuites.reduce((sum, s) => 
    sum + s.tests.filter(t => t.status === 'passed').length, 0
  );

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Automated Testing System</h1>
            <p className="text-muted-foreground">
              Automated testing and validation system for voice agents
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
              <p className="text-2xl font-bold">{totalTests}</p>
            </div>
            <TestTube className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Passed</p>
              <p className="text-2xl font-bold text-green-600">{passedTests}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedSuites} / {testSuites.length}</p>
            </div>
            <Activity className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Run Tests */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Run Test Suite</h2>
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
              onClick={handleRunTests}
              disabled={!selectedAgent || isRunning}
              className="btn btn-primary w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Running Tests...' : 'Run Test Suite'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Suites */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        {testSuites.length === 0 ? (
          <div className="text-center py-12">
            <TestTube className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No test suites run yet</p>
            <p className="text-sm text-muted-foreground">Run a test suite to see results</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testSuites.map((suite) => (
              <div key={suite.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{suite.name}</h3>
                    <p className="text-sm text-muted-foreground">Agent: {suite.agent}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      suite.status === 'completed' ? 'bg-green-100 text-green-800' :
                      suite.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {suite.status}
                    </span>
                    {suite.completedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(suite.completedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {suite.tests.map((test, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-accent/30 rounded">
                      <div className="flex items-center space-x-3">
                        {test.status === 'passed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {test.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                        {test.status === 'running' && (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {test.status === 'pending' && <Clock className="w-5 h-5 text-muted-foreground" />}
                        <span className="text-sm font-medium">{test.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        {test.status !== 'pending' && (
                          <>
                            <span>{test.duration}ms</span>
                            {test.error && (
                              <span className="text-red-600">{test.error}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomatedTestingSystem;
