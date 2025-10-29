import React, { useState } from 'react';
import { 
  Lightbulb, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Play,
  Pause,
  X,
  Sparkles,
  Target,
  Activity
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface Suggestion {
  id: string;
  type: 'performance' | 'cost' | 'quality' | 'compliance';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedImprovement: string;
  status: 'pending' | 'applied' | 'rejected';
}

const AIOptimizationSuggestions: React.FC = () => {
  const { voiceAgents } = useStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: 'sugg_1',
      type: 'performance',
      title: 'Reduce Response Time',
      description: 'Optimize LLM token usage by shortening prompts. This could reduce response time by 30%.',
      impact: 'high',
      difficulty: 'easy',
      estimatedImprovement: '30% faster responses',
      status: 'pending'
    },
    {
      id: 'sugg_2',
      type: 'cost',
      title: 'Switch to GPT-3.5-turbo',
      description: 'Consider using GPT-3.5-turbo instead of GPT-4 for non-critical conversations to reduce costs.',
      impact: 'high',
      difficulty: 'easy',
      estimatedImprovement: '50% cost reduction',
      status: 'pending'
    },
    {
      id: 'sugg_3',
      type: 'quality',
      title: 'Add Fallback Scripts',
      description: 'Add more comprehensive fallback responses to handle edge cases in conversations.',
      impact: 'medium',
      difficulty: 'medium',
      estimatedImprovement: '15% better UX',
      status: 'pending'
    },
    {
      id: 'sugg_4',
      type: 'performance',
      title: 'Implement Intent Caching',
      description: 'Cache frequently detected intents to reduce processing time.',
      impact: 'high',
      difficulty: 'hard',
      estimatedImprovement: '25% faster intent detection',
      status: 'pending'
    },
    {
      id: 'sugg_5',
      type: 'compliance',
      title: 'Auto-refresh DNC List',
      description: 'Set up automatic weekly refresh of DNC list to ensure compliance.',
      impact: 'medium',
      difficulty: 'easy',
      estimatedImprovement: '100% compliance maintained',
      status: 'pending'
    }
  ]);

  const handleApply = (id: string) => {
    setSuggestions(suggestions.map(s => 
      s.id === id ? { ...s, status: 'applied' } : s
    ));
    toast.success('Suggestion applied successfully!');
  };

  const handleReject = (id: string) => {
    setSuggestions(suggestions.map(s => 
      s.id === id ? { ...s, status: 'rejected' } : s
    ));
    toast.success('Suggestion rejected');
  };

  const typeColors = {
    performance: 'text-blue-600',
    cost: 'text-green-600',
    quality: 'text-purple-600',
    compliance: 'text-red-600'
  };

  const impactColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const appliedCount = suggestions.filter(s => s.status === 'applied').length;
  const totalImpact = suggestions
    .filter(s => s.status === 'applied')
    .reduce((sum, s) => sum + (s.impact === 'high' ? 10 : s.impact === 'medium' ? 5 : 2), 0);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">AI Optimization Suggestions</h1>
            <p className="text-muted-foreground">
              AI-powered optimization recommendations for your voice agents
            </p>
          </div>
          <button className="btn btn-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate New Suggestions
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Suggestions</p>
              <p className="text-2xl font-bold">{pendingSuggestions.length}</p>
            </div>
            <Lightbulb className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Applied</p>
              <p className="text-2xl font-bold text-green-600">{appliedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Impact</p>
              <p className="text-2xl font-bold text-blue-600">{totalImpact}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Impact</p>
              <p className="text-2xl font-bold text-purple-600">
                {pendingSuggestions.length > 0 ? 'High' : 'N/A'}
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Optimization Suggestions</h2>
        {pendingSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <p className="text-muted-foreground">All suggestions have been reviewed!</p>
            <p className="text-sm text-muted-foreground">Generate new suggestions for more optimizations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[suggestion.type]}`}>
                        {suggestion.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${impactColors[suggestion.impact]}`}>
                        {suggestion.impact} impact
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary">
                        {suggestion.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{suggestion.estimatedImprovement}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span className="text-muted-foreground">{voiceAgents.length} agents affected</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApply(suggestion.id)}
                      className="btn btn-primary btn-sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Apply
                    </button>
                    <button
                      onClick={() => handleReject(suggestion.id)}
                      className="btn btn-outline btn-sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applied Suggestions */}
      {suggestions.filter(s => s.status === 'applied').length > 0 && (
        <div className="card p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Applied Suggestions</h2>
          <div className="space-y-3">
            {suggestions
              .filter(s => s.status === 'applied')
              .map((suggestion) => (
                <div key={suggestion.id} className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">{suggestion.title}</p>
                      <p className="text-sm text-muted-foreground">{suggestion.estimatedImprovement}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Applied
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIOptimizationSuggestions;
