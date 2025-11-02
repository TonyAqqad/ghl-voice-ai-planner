import React, { useState } from 'react';
import { 
  TestTube, 
  Play, 
  Pause, 
  RotateCcw,
  Mic,
  Volume2,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface TestCall {
  id: string;
  agent: string;
  duration: number;
  status: 'running' | 'completed' | 'failed';
  transcript: string[];
  startedAt: string;
}

const TestingSimulator: React.FC = () => {
  const { voiceAgents } = useStore();
  const [selectedAgent, setSelectedAgent] = useState('');
  const [testCalls, setTestCalls] = useState<TestCall[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCall, setCurrentCall] = useState<TestCall | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);

  const startTestCall = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    setIsRunning(true);
    const agent = voiceAgents.find(a => a.id === selectedAgent);
    
    const newCall: TestCall = {
      id: `test_${Date.now()}`,
      agent: agent?.name || 'Unknown',
      duration: 0,
      status: 'running',
      transcript: [],
      startedAt: new Date().toISOString()
    };

    setCurrentCall(newCall);
    setTranscript([`Call started with ${agent?.name}...`]);

    // Simulate call progression
    setTimeout(() => {
      setTranscript([...transcript, 'Agent: Hello! How can I assist you today?']);
    }, 1000);

    setTimeout(() => {
      setTranscript([...transcript, 'Agent: Hello! How can I assist you today?', 'You: I need help with booking']);
    }, 2000);

    setTimeout(() => {
      setTranscript([...transcript, 'Agent: Hello! How can I assist you today?', 'You: I need help with booking', 'Agent: I can help you with that. When would you like to schedule?']);
    }, 3000);

    setTimeout(() => {
      setIsRunning(false);
      newCall.status = 'completed';
      newCall.transcript = transcript;
      newCall.duration = 3;
      setTestCalls([newCall, ...testCalls]);
      setCurrentCall(null);
      setTranscript([]);
      toast.success('Test call completed');
    }, 4000);
  };

  const reset = () => {
    setIsRunning(false);
    setCurrentCall(null);
    setTranscript([]);
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Testing Simulator</h1>
        <p className="text-muted-foreground">
          Test voice agents with simulated calls
        </p>
      </div>

      {/* Test Controls */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Run Test Call</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
          <div className="flex items-end space-x-2">
            <button
              onClick={startTestCall}
              disabled={!selectedAgent || isRunning}
              className="btn btn-primary flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Test Call
            </button>
            {isRunning && (
              <button
                onClick={reset}
                className="btn btn-outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Call Simulator */}
      {isRunning && currentCall && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold">Test Call in Progress</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              <Clock className="w-4 h-4 inline mr-1" />
              {currentCall.duration}s
            </span>
          </div>
          <div className="bg-background rounded-lg p-4 min-h-[200px]">
            {transcript.map((line, idx) => (
              <div key={idx} className="mb-2 text-sm">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test History */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Test History</h2>
        {testCalls.length === 0 ? (
          <div className="text-center py-12">
            <TestTube className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No test calls yet</p>
            <p className="text-sm text-muted-foreground">Run a test call to see results here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testCalls.map((call) => (
              <div key={call.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold">{call.agent}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      call.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {call.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span><Clock className="w-4 h-4 inline mr-1" />{call.duration}s</span>
                    <span>{new Date(call.startedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-background rounded p-3">
                  {call.transcript.slice(0, 3).map((line, idx) => (
                    <div key={idx} className="text-sm mb-1">{line}</div>
                  ))}
                  {call.transcript.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{call.transcript.length - 3} more lines...
                    </div>
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

export default TestingSimulator;
