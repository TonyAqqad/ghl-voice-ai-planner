import React, { useState } from 'react';
import { Brain, BookOpen, TrendingUp, Sparkles } from 'lucide-react';

const AgentLearningSystem: React.FC = () => {
  const [learningStats, setLearningStats] = useState({
    totalLearning: 1523,
    improvements: 28,
    avgLearning: 4.2,
    adaptions: 45,
  });

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Agent Learning System</h1>
            <p className="text-muted-foreground">Intelligent learning and adaptation</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <Brain className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Total Learning</p>
          <p className="text-2xl font-bold">{learningStats.totalLearning}</p>
        </div>
        <div className="card p-6">
          <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Improvements</p>
          <p className="text-2xl font-bold">{learningStats.improvements}</p>
        </div>
        <div className="card p-6">
          <BookOpen className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Avg Learning</p>
          <p className="text-2xl font-bold">{learningStats.avgLearning}</p>
        </div>
        <div className="card p-6">
          <Sparkles className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Adaptions</p>
          <p className="text-2xl font-bold">{learningStats.adaptions}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Learning Insights</h2>
        <div className="space-y-4">
          <div className="border-l-2 border-primary pl-4">
            <p className="font-semibold">Conversation patterns detected</p>
            <p className="text-sm text-muted-foreground">System identified 5 new conversation patterns and adapted responses</p>
          </div>
          <div className="border-l-2 border-green-600 pl-4">
            <p className="font-semibold">Success rate improved</p>
            <p className="text-sm text-muted-foreground">Learning system contributed to 18% increase in success rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentLearningSystem;
