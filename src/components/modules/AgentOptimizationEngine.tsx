import React, { useState } from 'react';
import { Zap, TrendingUp, Target, Lightbulb, Edit2, CheckCircle, AlertCircle } from 'lucide-react';
import { MinimalContext, validateMinimalContext, truncateContextValues } from '../../lib/prompt/fieldSet';
import { validateRequiredFields } from '../../lib/prompt/masterOrchestrator';

const AgentOptimizationEngine: React.FC = () => {
  const [suggestions, setSuggestions] = useState([
    { id: '1', category: 'Performance', description: 'Optimize response time', impact: 'High', status: 'pending' },
    { id: '2', category: 'Cost', description: 'Reduce API calls by 20%', impact: 'High', status: 'applied' },
    { id: '3', category: 'Quality', description: 'Improve voice clarity', impact: 'Medium', status: 'pending' },
  ]);

  // Context management for 3-layer architecture
  const [contextData, setContextData] = useState<Partial<MinimalContext>>({
    biz: {
      name: 'F45 Training Downtown',
      address: '123 Main St',
      state: 'CA',
      city: 'Los Angeles'
    },
    agent: {
      class_times: 'M-F: 5am, 6am, 12pm, 5pm, 6pm | Sat-Sun: 8am, 9am',
      location_hours: 'M-F 5am-8pm, Sat-Sun 8am-2pm',
      trial_offer: 'Free trial class + 30-day challenge',
      what_to_bring: 'Water bottle, towel, athletic shoes'
    }
  });
  const [editingContext, setEditingContext] = useState(false);
  const [testResults, setTestResults] = useState<{
    bookingPass: boolean;
    fieldsCollected: Array<{ key: string; value: string; valid: boolean }>;
  } | null>(null);

  const voiceBestPractices = [
    'Speak clearly and ask only one question at a time',
    'Keep responses short and natural — no more than 1–2 sentences',
    'Pause between topic changes (simulate voice pacing)',
    'Avoid stacked questions unless the user explicitly provides multiple answers at once',
    'Always confirm one answer before asking the next',
    'Respond conversationally, not like a chatbot or form',
  ];

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Agent Optimization Engine</h1>
            <p className="text-muted-foreground">AI-powered performance optimization</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <Lightbulb className="w-8 h-8 text-yellow-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Suggestions</p>
          <p className="text-2xl font-bold">{suggestions.length}</p>
        </div>
        <div className="card p-6">
          <Target className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Applied</p>
          <p className="text-2xl font-bold">{suggestions.filter(s => s.status === 'applied').length}</p>
        </div>
        <div className="card p-6">
          <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Avg Impact</p>
          <p className="text-2xl font-bold">+18%</p>
        </div>
        <div className="card p-6">
          <Zap className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Savings</p>
          <p className="text-2xl font-bold">$245</p>
        </div>
      </div>

      {/* Context Preview Card - 3-Layer Architecture */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Context Preview</h2>
          <button
            onClick={() => setEditingContext(!editingContext)}
            className="btn btn-sm btn-outline flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            {editingContext ? 'Done' : 'Edit'}
          </button>
        </div>
        
        {editingContext ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Business Context</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Business Name"
                  value={contextData.biz?.name || ''}
                  onChange={(e) => setContextData({...contextData, biz: {...contextData.biz!, name: e.target.value}})}
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <input
                  placeholder="City"
                  value={contextData.biz?.city || ''}
                  onChange={(e) => setContextData({...contextData, biz: {...contextData.biz!, city: e.target.value}})}
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <input
                  placeholder="State"
                  value={contextData.biz?.state || ''}
                  onChange={(e) => setContextData({...contextData, biz: {...contextData.biz!, state: e.target.value}})}
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <input
                  placeholder="Address"
                  value={contextData.biz?.address || ''}
                  onChange={(e) => setContextData({...contextData, biz: {...contextData.biz!, address: e.target.value}})}
                  className="px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Agent Custom Values</label>
              <div className="space-y-2">
                <input
                  placeholder="Class Times"
                  value={contextData.agent?.class_times || ''}
                  onChange={(e) => setContextData({...contextData, agent: {...contextData.agent!, class_times: e.target.value}})}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <input
                  placeholder="Location Hours"
                  value={contextData.agent?.location_hours || ''}
                  onChange={(e) => setContextData({...contextData, agent: {...contextData.agent!, location_hours: e.target.value}})}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <input
                  placeholder="Trial Offer"
                  value={contextData.agent?.trial_offer || ''}
                  onChange={(e) => setContextData({...contextData, agent: {...contextData.agent!, trial_offer: e.target.value}})}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <input
                  placeholder="What to Bring"
                  value={contextData.agent?.what_to_bring || ''}
                  onChange={(e) => setContextData({...contextData, agent: {...contextData.agent!, what_to_bring: e.target.value}})}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
            <p className="text-xs font-mono text-muted-foreground mb-2">Compact JSON context sent to model:</p>
            <pre className="text-xs font-mono overflow-x-auto">
              {JSON.stringify(truncateContextValues(contextData as MinimalContext, 120), null, 2)}
            </pre>
            {(() => {
              const validation = validateMinimalContext(contextData);
              return !validation.valid && (
                <div className="mt-3 flex items-start gap-2 text-xs text-amber-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Missing fields: {validation.missing.join(', ')}</span>
                </div>
              );
            })()}
          </div>
        )}
        
        {/* Booking Pass Validation */}
        {testResults && (
          <div className="mt-4 p-4 border rounded-md">
            <div className="flex items-center gap-2 mb-2">
              {testResults.bookingPass ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="text-sm font-medium">
                Booking Pass: {testResults.bookingPass ? 'Complete ✓' : 'Failed ✗'}
              </span>
            </div>
            {!testResults.bookingPass && (() => {
              const fieldValidation = validateRequiredFields(testResults.fieldsCollected);
              return (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>All 5 contact fields must be collected & confirmed before booking:</p>
                  <p className="font-mono">first_name, last_name, unique_phone_number, email, class_date__time</p>
                  {fieldValidation.missing.length > 0 && (
                    <p className="text-amber-600">Missing: {fieldValidation.missing.join(', ')}</p>
                  )}
                  {fieldValidation.invalid.length > 0 && (
                    <p className="text-red-600">Invalid: {fieldValidation.invalid.join(', ')}</p>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Optimization Suggestions</h2>
        <div className="space-y-4">
          {suggestions.map(s => (
            <div key={s.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{s.description}</h3>
                  <p className="text-sm text-muted-foreground">{s.category}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {s.impact === 'High' && <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">High Impact</span>}
                  {s.status === 'applied' && <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Applied</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 mt-8 border border-primary/20 bg-gradient-to-br from-purple-50/60 via-white to-blue-50/40 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/10">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Voice AI Best Practices
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          This reusable prompt block is appended to every generated system prompt so agents respect conversational pacing during calls.
        </p>
        <ul className="space-y-2 text-sm leading-relaxed">
          {voiceBestPractices.map((rule) => (
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

export default AgentOptimizationEngine;
