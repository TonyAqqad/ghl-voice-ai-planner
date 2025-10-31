import React, { useState } from 'react';
import { Brain, BookOpen, TrendingUp, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { useCorrections } from '../../hooks/useCorrections';
import { format } from 'date-fns';

const AgentLearningSystem: React.FC = () => {
  const { corrections, stats, loading, error, refresh } = useCorrections();
  const [selectedCorrection, setSelectedCorrection] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-6 bg-background min-h-screen text-foreground flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading corrections data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-background min-h-screen text-foreground">
        <div className="card p-6 border-red-500">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Agent Learning System</h1>
          <p className="text-muted-foreground">Real-time corrections and improvements</p>
        </div>
        <button onClick={refresh} className="btn btn-primary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <Brain className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Total Corrections</p>
          <p className="text-2xl font-bold">{stats?.total_corrections || 0}</p>
        </div>
        <div className="card p-6">
          <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Prompt Updates</p>
          <p className="text-2xl font-bold">{stats?.prompt_updates || 0}</p>
        </div>
        <div className="card p-6">
          <BookOpen className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">KB Additions</p>
          <p className="text-2xl font-bold">{stats?.kb_additions || 0}</p>
        </div>
        <div className="card p-6">
          <Sparkles className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Agents Improved</p>
          <p className="text-2xl font-bold">{stats?.agents_improved || 0}</p>
        </div>
      </div>

      {/* Corrections List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Corrections</h2>
        {corrections.length === 0 ? (
          <p className="text-muted-foreground">No corrections saved yet. Edit agent responses in Training Hub to start learning.</p>
        ) : (
          <div className="space-y-4">
            {corrections.map((correction) => (
              <div key={correction.id} className="border rounded-lg p-4 hover:bg-accent/50 transition cursor-pointer"
                   onClick={() => setSelectedCorrection(selectedCorrection === correction.id ? null : correction.id)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">Correction #{correction.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(correction.created_at), 'MMM d, yyyy h:mm a')} · 
                      Applied to <span className="font-medium">{correction.store_in === 'prompt' ? 'System Prompt' : 'Knowledge Base'}</span> · 
                      Version {correction.prompt_version}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    correction.store_in === 'prompt' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  }`}>
                    {correction.store_in.toUpperCase()}
                  </span>
                </div>
                
                {correction.reason && (
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Reason:</span> {correction.reason}
                  </p>
                )}
                
                {selectedCorrection === correction.id && (
                  <div className="mt-4 space-y-3 border-t pt-3">
                    <div>
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Original:</p>
                      <p className="text-sm bg-red-50 dark:bg-red-900/10 p-2 rounded">{correction.original_response}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Corrected:</p>
                      <p className="text-sm bg-green-50 dark:bg-green-900/10 p-2 rounded">{correction.corrected_response}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Best Practices (keep existing) */}
      <div className="card p-6 mt-8 bg-gradient-to-br from-blue-50/60 via-white to-purple-50/40 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/10 border border-primary/20">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Voice AI Best Practices
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          These conversation rules are embedded into every master prompt so agents sound human on voice calls.
        </p>
        <ul className="space-y-2 text-sm leading-relaxed">
          {['Speak clearly and ask only one question at a time',
            'Keep responses short and natural — no more than 1–2 sentences',
            'Pause between topic changes (simulate voice pacing)',
            'Avoid stacked questions unless the user explicitly provides multiple answers at once',
            'Always confirm one answer before asking the next',
            'Respond conversationally, not like a chatbot or form'
          ].map((rule) => (
            <li key={rule} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AgentLearningSystem;
