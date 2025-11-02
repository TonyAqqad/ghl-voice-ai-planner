import React, { useState } from 'react';
import { Heart, TrendingUp, AlertTriangle, Meh } from 'lucide-react';

const ConversationSentimentAnalysis: React.FC = () => {
  const [sentiment, setSentiment] = useState({
    positive: 68,
    neutral: 25,
    negative: 7,
  });

  const recentSentiments = [
    { id: '1', text: 'Thank you so much for your help!', score: 0.95, label: 'positive' },
    { id: '2', text: 'I need more information', score: 0.45, label: 'neutral' },
    { id: '3', text: 'This is very frustrating', score: -0.8, label: 'negative' },
  ];

  const getSentimentIcon = (label: string) => {
    switch(label) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'negative': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Meh className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Sentiment Analysis</h1>
            <p className="text-muted-foreground">AI-powered emotion detection and analysis</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Positive</p>
            <Heart className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{sentiment.positive}%</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Neutral</p>
            <Meh className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{sentiment.neutral}%</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Negative</p>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{sentiment.negative}%</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Sentiments</h2>
        <div className="space-y-3">
          {recentSentiments.map(s => (
            <div key={s.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="flex-1">{s.text}</p>
                {getSentimentIcon(s.label)}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${
                  s.label === 'positive' ? 'text-green-600' :
                  s.label === 'negative' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {s.label}
                </span>
                <span className="text-xs text-muted-foreground">Score: {s.score.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversationSentimentAnalysis;
