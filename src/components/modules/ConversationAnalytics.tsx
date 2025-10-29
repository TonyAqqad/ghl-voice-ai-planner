import React, { useState } from 'react';
import { BarChart3, TrendingUp, Brain, MessageSquare, DollarSign, Clock, Users, AlertCircle, Download, RefreshCw } from 'lucide-react';

interface ConversationInsight {
  id: string;
  conversationId: string;
  topic: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  insights: string;
  timestamp: string;
}

const ConversationAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');
  const [insights, setInsights] = useState<ConversationInsight[]>([
    {
      id: '1',
      conversationId: 'conv_001',
      topic: 'Product Interest - High Priority',
      sentiment: 'positive',
      keywords: ['interested', 'pricing', 'demo', 'trial'],
      insights: 'Customer showed strong interest in premium features. Follow-up recommended within 24 hours.',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      conversationId: 'conv_002',
      topic: 'Technical Support',
      sentiment: 'neutral',
      keywords: ['issue', 'bug', 'help', 'solution'],
      insights: 'Customer experienced login issues. Resolution provided successfully.',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      conversationId: 'conv_003',
      topic: 'Cancellation Request',
      sentiment: 'negative',
      keywords: ['cancel', 'refund', 'unsatisfied', 'disappointed'],
      insights: 'Customer dissatisfaction detected. Retention team should reach out.',
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ]);

  const totalConversations = 1247;
  const avgSentiment = 3.4; // out of 5
  const topTopics = [
    { name: 'Product Interest', count: 456, trend: '+12%' },
    { name: 'Technical Support', count: 312, trend: '+8%' },
    { name: 'Billing Questions', count: 278, trend: '-3%' },
    { name: 'Feature Requests', count: 201, trend: '+15%' }
  ];

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Conversation Analytics</h1>
            <p className="text-muted-foreground">
              AI-powered conversation insights and analytics
            </p>
          </div>
          <div className="flex space-x-3">
            <select
              className="input"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <button className="btn btn-outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button className="btn btn-outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{totalConversations.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Conversations</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Brain className="w-8 h-8 text-purple-500" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{avgSentiment.toFixed(1)}/5.0</div>
          <div className="text-sm text-muted-foreground">Avg Sentiment</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-500" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">78%</div>
          <div className="text-sm text-muted-foreground">Positive Interactions</div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-500" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">3m 42s</div>
          <div className="text-sm text-muted-foreground">Avg Response Time</div>
        </div>
      </div>

      {/* Top Topics */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Conversation Topics</h2>
        <div className="space-y-4">
          {topTopics.map((topic, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded hover:bg-accent/5 transition">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="font-semibold">{topic.name}</h3>
                  <span className="text-sm text-muted-foreground">{topic.count} conversations</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(topic.count / topTopics[0].count) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className={`ml-4 text-sm font-semibold ${
                topic.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'
              }`}>
                {topic.trend}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">AI-Generated Insights</h2>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="p-4 border rounded hover:bg-accent/5 transition">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{insight.topic}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  insight.sentiment === 'positive' ? 'bg-green-500/20 text-green-500' :
                  insight.sentiment === 'negative' ? 'bg-red-500/20 text-red-500' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {insight.sentiment}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{insight.insights}</p>
              <div className="flex flex-wrap gap-2">
                {insight.keywords.map((keyword, idx) => (
                  <span key={idx} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Conversation ID: {insight.conversationId} | {new Date(insight.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Sentiment Distribution</h2>
          <div className="h-64 flex items-center justify-center bg-muted rounded text-muted-foreground">
            Chart: Sentiment Over Time
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Keyword Cloud</h2>
          <div className="h-64 flex items-center justify-center bg-muted rounded text-muted-foreground">
            Visual: Keyword Cloud
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationAnalytics;