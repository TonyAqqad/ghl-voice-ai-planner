import React, { useState } from 'react';
import { Sparkles, Plus, Download, Edit2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MinimalContext, validateMinimalContext, truncateContextValues } from '../../lib/prompt/fieldSet';
import { validateRequiredFields } from '../../lib/prompt/masterOrchestrator';

const AITemplateGenerator: React.FC = () => {
  const [templates, setTemplates] = useState([
    { id: '1', name: 'Lead Qualification Bot', industry: 'Sales', status: 'ready' },
    { id: '2', name: 'Support Assistant', industry: 'Customer Service', status: 'generating' },
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
  const [testFieldCaptures, setTestFieldCaptures] = useState<Array<{ key: string; value: string; valid: boolean }>>([]);

  const voiceBestPractices = [
    'Speak clearly and ask only one question at a time',
    'Keep responses short and natural — no more than 1–2 sentences',
    'Pause between topic changes (simulate voice pacing)',
    'Avoid stacked questions unless the user explicitly provides multiple answers at once',
    'Always confirm one answer before asking the next',
    'Respond conversationally, not like a chatbot or form',
  ];

  const handleGenerate = () => {
    toast.success('Generating AI template...');
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">AI Template Generator</h1>
            <p className="text-muted-foreground">AI-powered template generation</p>
          </div>
          <button onClick={handleGenerate} className="btn btn-primary">
            <Sparkles className="w-4 h-4 mr-2" />Generate
          </button>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generated Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{t.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  t.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {t.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Industry: {t.industry}</p>
              {t.status === 'ready' && (
                <button className="btn btn-primary btn-sm w-full">
                  <Download className="w-4 h-4 mr-1" />Use Template
                </button>
              )}
            </div>
          ))}
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
        
        {testFieldCaptures.length > 0 && (() => {
          const fieldValidation = validateRequiredFields(testFieldCaptures);
          return (
            <div className="mt-4 p-3 border rounded-md">
              <div className="flex items-center gap-2 mb-2">
                {fieldValidation.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                <span className="text-sm font-medium">
                  Field Collection Status: {fieldValidation.valid ? 'Complete' : 'Incomplete'}
                </span>
              </div>
              {!fieldValidation.valid && (
                <p className="text-xs text-muted-foreground">
                  Missing: {fieldValidation.missing.join(', ')} • Invalid: {fieldValidation.invalid.join(', ') || 'none'}
                </p>
              )}
            </div>
          );
        })()}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="space-y-3 text-sm">
          <p>• Describe your use case and industry</p>
          <p>• AI generates a complete voice agent template</p>
          <p>• Review and customize the generated script</p>
          <p>• Deploy with one click</p>
        </div>
      </div>

      <div className="card p-6 mt-8 border border-primary/20 bg-gradient-to-br from-amber-50/70 via-white to-blue-50/40 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Voice AI Best Practices
          </h2>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">Master Prompt Add-On</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Every generated system prompt now includes the following voice-optimized block to keep conversations human on simulated calls. You can copy or edit it directly inside your prompt.
        </p>
        <div className="rounded-lg border border-primary/30 bg-background/80 p-4 text-sm leading-relaxed shadow-sm">
          <p className="font-semibold text-primary mb-3">## CONVERSATION RULES (PHONE-LIKE):</p>
          <ul className="space-y-2">
            {voiceBestPractices.map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AITemplateGenerator;
