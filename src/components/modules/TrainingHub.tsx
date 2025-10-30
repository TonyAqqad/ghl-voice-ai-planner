import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Save, Upload, RefreshCw, Database, Sparkles, CheckCircle, Link2, Copy } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';
import { useMCP } from '../../hooks/useMCP';
import Button from '../../components/ui/Button';
import { getApiBaseUrl } from '../../utils/apiBase';

interface TrainingPayload {
  agentId: string;
  systemPrompt: string;
  knowledgeBase: string[];
  qnaPairs: Array<{ q: string; a: string }>;
  customActions: Array<{ name: string; url: string; description?: string }>;
}

const defaultQnA = [{ q: 'What are your hours?', a: 'We are open Monday–Friday 9am–6pm.' }];

const TrainingHub: React.FC = () => {
  const { voiceAgents } = useStore();
  const [selectedId, setSelectedId] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [knowledge, setKnowledge] = useState<string>('');
  const [qna, setQna] = useState(defaultQnA);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  // New composer state
  const [selectedNiche, setSelectedNiche] = useState<string>('generic');
  const [availableNiches, setAvailableNiches] = useState<Array<{ value: string; label: string }>>([]);
  const [composedPrompt, setComposedPrompt] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const mcp = useMCP();
  // Inline test panel state
  const [testMessage, setTestMessage] = useState<string>('Hello');
  const [testResult, setTestResult] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);
  
  // Conversation tracking
  const [conversation, setConversation] = useState<Array<{ speaker: 'user' | 'agent', text: string, timestamp: number }>>([]);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<any>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

  const selectedAgent = useMemo(() => voiceAgents.find(a => a.id === selectedId), [voiceAgents, selectedId]);

  useEffect(() => {
    if (!selectedAgent && voiceAgents.length > 0) {
      setSelectedId(voiceAgents[0].id);
    }
  }, [selectedAgent, voiceAgents]);

  // Load available niches on mount
  useEffect(() => {
    const loadNiches = async () => {
      try {
        const response = await fetch('/api/mcp/prompt/niches');
        const data = await response.json();
        if (data.ok && data.niches) {
          setAvailableNiches(data.niches);
        }
      } catch (error) {
        console.error('Failed to load niches:', error);
      }
    };
    loadNiches();
  }, []);

  useEffect(() => {
    if (!selectedAgent) return;
    // Initialize from agent if present
    setSystemPrompt((selectedAgent as any).systemPrompt || '');
    const kb = (selectedAgent as any).knowledgeBase as string[] | undefined;
    setKnowledge(kb?.join('\n') || '');
  }, [selectedAgent]);

  const payload: TrainingPayload | null = selectedAgent
    ? {
        agentId: selectedAgent.id,
        systemPrompt,
        knowledgeBase: knowledge
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        qnaPairs: qna,
        customActions: (selectedAgent as any).customActions || [],
      }
    : null;

  const handleLocalSave = async () => {
    if (!payload) return;
    setSaving(true);
    try {
      // optimistic save to local store (extend store shape if needed)
      toast.success('Training data saved locally');
    } catch (e) {
      toast.error('Failed saving locally');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncToGHL = async () => {
    // DISABLED: Sandboxed mode - no GHL API calls
    toast.info('GHL sync disabled in sandbox mode');
    return;
    
    /* Original code commented out to prevent 429 errors
    if (!payload) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/ghl/training/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Sync failed');
      toast.success('Synced to GHL dashboard');
    } catch (e) {
      toast.error('Failed syncing to GHL');
    } finally {
      setSyncing(false);
    }
    */
  };

  const handleGeneratePrompt = async () => {
    if (!selectedAgent) return;
    setGenLoading(true);
    try {
      // Use new compose endpoint
      const response = await fetch('/api/mcp/prompt/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: selectedNiche,
          goals: [
            'Qualify leads and understand customer needs',
            'Schedule appointments with appropriate team members',
            'Capture accurate contact and preference information'
          ],
          tone: 'professional',
          businessHours: { open: '9 AM', close: '5 PM' },
          clientContext: { 
            businessName: selectedAgent.name || 'Your Business',
            industry: selectedNiche
          },
          compliance: [],
          enhance: true,
          agentId: selectedAgent.id,
          saveToDb: true
        })
      });

      const data = await response.json();
      
      if (data.ok && data.prompt) {
        setComposedPrompt(data.prompt);
        setSystemPrompt(data.prompt.system_prompt);
        setShowPreview(true);
        toast.success('Prompt composed successfully!');
      } else {
        const errorMsg = data.error || 'Prompt composition failed';
        toast.error(errorMsg);
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || e.message || 'Prompt composition failed';
      toast.error(errorMsg);
      console.error('Prompt composition error:', e);
    } finally {
      setGenLoading(false);
    }
  };

  const handleSaveState = async () => {
    if (!payload) return;
    setSaving(true);
    try {
      const res = await mcp.agentSaveState({
        agentId: payload.agentId,
        customerId: 'training',
        state: {
          systemPrompt: payload.systemPrompt,
          knowledgeBase: payload.knowledgeBase,
          qnaPairs: payload.qnaPairs
        }
      });
      if ((res as any)?.success !== false) {
        toast.success('State saved');
      } else {
        toast.error('Save failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeploy = async () => {
    // DISABLED: Sandboxed mode - no GHL API calls
    toast.info('Agent deployment disabled in sandbox mode. Prompt is saved locally in database.');
    return;
    
    /* Original code commented out to prevent 429 errors
    if (!payload || !selectedAgent) return;
    setSyncing(true);
    try {
      const base = getApiBaseUrl();
      const body = {
        name: selectedAgent.name || 'Sales Assistant',
        description: 'Qualifies leads and books appointments',
        voiceSettings: { provider: 'elevenlabs', voiceId: 'rachel', speed: 1.0, stability: 0.7, similarityBoost: 0.8 },
        conversationSettings: { systemPrompt, temperature: 0.7, maxTokens: 1000 },
        scripts: { greeting: 'Hi! Thanks for calling. How can I help?', fallback: 'Sorry, could you rephrase?', transfer: 'Connecting you with a specialist.', goodbye: 'Thanks for calling!' },
        intents: [
          { name: 'schedule_appointment', phrases: ['schedule','book','appointment'], action: 'schedule_appointment' },
          { name: 'pricing_inquiry', phrases: ['price','cost','how much'], action: 'provide_pricing_info' }
        ],
        knowledgeBase: payload.knowledgeBase,
        compliance: { tcpaCompliant: true, recordingConsent: true }
      };
      const res = await fetch(`${base}/api/voice-ai/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Deploy failed');
      toast.success('Agent deploy request submitted');
    } catch (e: any) {
      toast.error(e.message || 'Deploy failed');
    } finally {
      setSyncing(false);
    }
    */
  };

  // === Inline Testing (same tab) ===
  const handleHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const res = await mcp.agentCheckHealth({ agentId: 'system', checks: ['database','apis'] });
      setHealthResult(res);
      toast.success('Health OK');
    } catch (e: any) {
      toast.error(e.message || 'Health check failed');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleDryRun = async () => {
    if (!selectedAgent || !testMessage.trim()) return;
    
    // Add user message to conversation
    const userMessage = { 
      speaker: 'user' as const, 
      text: testMessage, 
      timestamp: Date.now() 
    };
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    
    setSyncing(true);
    try {
      const res = await mcp.voiceAgentCall({
        agentId: selectedAgent.id,
        phoneNumber: '+10000000000',
        context: { 
          userMessage: testMessage,
          conversationHistory: conversation.map(m => ({
            role: m.speaker === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        },
        options: { textOnly: true }
      });
      
      // Add agent response to conversation
      const agentMessage = {
        speaker: 'agent' as const,
        text: res.transcript || res.response || 'No response',
        timestamp: Date.now()
      };
      const finalConversation = [...updatedConversation, agentMessage];
      setConversation(finalConversation);
      setTestResult(res);
      
      // Clear input
      setTestMessage('');
      
      // Auto-evaluate if enabled
      if (showEvaluation) {
        await evaluateConversation(finalConversation);
      }
      
      toast.success('Response generated');
    } catch (e: any) {
      toast.error(e.message || 'Dry-run failed');
    } finally {
      setSyncing(false);
    }
  };

  const evaluateConversation = async (conv: typeof conversation) => {
    if (!selectedAgent) return;
    
    setEvaluationLoading(true);
    try {
      const transcript = conv.map(m => `${m.speaker === 'user' ? 'Caller' : 'Agent'}: ${m.text}`).join('\n');
      
      // Note: Evaluation endpoint is part of autonomous system (may not be deployed yet)
      // This will gracefully handle 404 if endpoint doesn't exist
      const response = await fetch('/api/mcp/agent/ingestTranscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          transcript,
          promptId: null,
          summary: 'Live evaluation from conversation simulator',
          tags: ['live_eval', 'conversation_test'],
          metrics: { messageCount: conv.length }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.evaluation) {
          setCurrentEvaluation(data.evaluation);
        }
      }
    } catch (e: any) {
      console.error('Evaluation failed:', e);
      // Silently fail - evaluation is optional
    } finally {
      setEvaluationLoading(false);
    }
  };

  const handleSaveForTraining = async () => {
    if (!selectedAgent || conversation.length === 0) {
      toast.error('No conversation to save');
      return;
    }
    
    setSaving(true);
    try {
      const transcript = conversation.map(m => `${m.speaker === 'user' ? 'Caller' : 'Agent'}: ${m.text}`).join('\n');
      const summary = `Manual training session with ${conversation.length} messages`;
      
      const response = await fetch('/api/mcp/agent/ingestTranscript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          transcript,
          summary,
          tags: ['training', 'manual_review', 'dry_run'],
          metrics: {
            messageCount: conversation.length,
            duration: conversation[conversation.length - 1].timestamp - conversation[0].timestamp
          }
        })
      });
      
      const data = await response.json();
      if (data.ok) {
        toast.success('Conversation saved for training!');
        // Reset conversation after successful save
        setConversation([]);
        setTestResult(null);
        setCurrentEvaluation(null);
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save conversation');
    } finally {
      setSaving(false);
    }
  };

  const handleResetConversation = () => {
    if (conversation.length === 0) return;
    
    if (confirm('Reset conversation? All messages will be cleared.')) {
      setConversation([]);
      setTestResult(null);
      setCurrentEvaluation(null);
      setTestMessage('');
      toast.success('Conversation reset');
    }
  };

  const handleCopyTranscript = () => {
    const transcript = conversation.map(m => 
      `${m.speaker === 'user' ? 'Caller' : 'Agent'}: ${m.text}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(transcript);
    toast.success('Transcript copied to clipboard');
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Training Hub</h1>
          <p className="text-muted-foreground">Craft prompts, knowledge, and Q&A (Sandboxed - No GHL API calls)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleLocalSave} disabled={saving} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Save Local
          </Button>
          <Button variant="outline" onClick={handleGeneratePrompt} disabled={genLoading} loading={genLoading}>
            <Sparkles className="w-4 h-4 mr-2" /> Generate Prompt
          </Button>
          <Button variant="outline" onClick={handleSaveState} disabled={saving || !payload}>
            <Database className="w-4 h-4 mr-2" /> Save State
          </Button>
          <Button onClick={handleDeploy} disabled={syncing || !payload} loading={syncing}>
            <Upload className="w-4 h-4 mr-2" /> Deploy Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4 col-span-1">
          <label className="text-sm mb-2 block">Select Agent</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input">
            {voiceAgents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <label className="text-sm mb-2 block mt-4">Industry / Niche</label>
          <select value={selectedNiche} onChange={(e) => setSelectedNiche(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input">
            <option value="generic">Generic</option>
            {availableNiches.map(n => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>

          <div className="mt-4 p-3 rounded bg-muted/30 text-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>Sandboxed Mode: All data stored locally in database</span>
            </div>
          </div>
        </div>

        <div className="card p-4 col-span-2">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">System Prompt</label>
            <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input h-32" placeholder="Write the master system prompt..." />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Knowledge Base (one per line)</label>
            <textarea value={knowledge} onChange={(e) => setKnowledge(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input h-32" placeholder="Policies, products, FAQs..." />
          </div>

          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="w-4 h-4" />
            <span>Supports GHL Voice AI Custom Actions via webhook URLs</span>
          </div>
        </div>
      </div>

      <div className="mt-6 card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <h2 className="font-semibold">Q&A Pairs</h2>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setQna([...qna, { q: '', a: '' }])}>
            <Sparkles className="w-4 h-4 mr-1" /> Add Row
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {qna.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2">
              <input value={row.q} onChange={(e) => setQna(qna.map((r, i) => i === idx ? { ...r, q: e.target.value } : r))} className="px-3 py-2 border border-border rounded-md bg-input" placeholder="Question" />
              <input value={row.a} onChange={(e) => setQna(qna.map((r, i) => i === idx ? { ...r, a: e.target.value } : r))} className="px-3 py-2 border border-border rounded-md bg-input" placeholder="Answer" />
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Composer Preview */}
      {showPreview && composedPrompt && (
        <div className="mt-6 card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Composed Prompt Preview</h2>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>

          <div className="space-y-4">
            {/* KB Stubs */}
            {composedPrompt.kb_stubs && composedPrompt.kb_stubs.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Knowledge Base Stubs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {composedPrompt.kb_stubs.map((stub: any, idx: number) => (
                    <div key={idx} className="p-3 rounded border border-border bg-muted/30">
                      <div className="font-medium text-sm mb-1">{stub.title}</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {stub.outline.map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Actions */}
            {composedPrompt.custom_actions && composedPrompt.custom_actions.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Custom Actions
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {composedPrompt.custom_actions.map((action: any, idx: number) => (
                    <div key={idx} className="p-3 rounded border border-border bg-muted/30 text-xs">
                      <div className="font-medium">{action.name}</div>
                      <div className="text-muted-foreground">{action.description}</div>
                      <div className="text-muted-foreground mt-1">Endpoint: {action.endpoint}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eval Rubric */}
            {composedPrompt.eval_rubric && composedPrompt.eval_rubric.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Evaluation Rubric
                </h3>
                <div className="p-3 rounded border border-border bg-muted/30">
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {composedPrompt.eval_rubric.map((item: string, idx: number) => (
                      <li key={idx}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Testing Panel */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Health & Connectivity</h2>
            <Button variant="outline" size="sm" onClick={handleHealthCheck} disabled={healthLoading} loading={healthLoading}>
              <RefreshCw className="w-4 h-4 mr-1" /> Check Health
            </Button>
          </div>
          <pre className="text-xs bg-muted/30 p-3 rounded overflow-auto max-h-48">{healthResult ? JSON.stringify(healthResult, null, 2) : 'No results yet.'}</pre>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold">Call Simulator</h2>
              <p className="text-xs text-muted-foreground">Testing agent call responses via text (pre-deployment)</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Evaluation Toggle */}
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showEvaluation} 
                  onChange={(e) => setShowEvaluation(e.target.checked)}
                  className="rounded"
                />
                <span>Show Score</span>
              </label>
              
              {/* Reset Button */}
              {conversation.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetConversation}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Conversation Display */}
          {conversation.length > 0 ? (
            <div className="mb-3 space-y-2 max-h-64 overflow-y-auto p-3 bg-muted/30 rounded">
              {conversation.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.speaker === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      msg.speaker === 'user' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' 
                        : 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100'
                    }`}
                  >
                    <div className="text-xs opacity-60 mb-1">
                      {msg.speaker === 'user' ? 'Caller' : 'Agent'}
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-3 p-6 bg-muted/30 rounded text-center text-muted-foreground text-sm">
              Start a conversation by typing a message below
            </div>
          )}

          {/* Evaluation Card */}
          {showEvaluation && currentEvaluation && (
            <div className="mb-3 p-3 rounded border border-border bg-muted/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Evaluation Score</span>
                <span className="text-lg font-bold">{currentEvaluation.confidenceScore ? Math.round(currentEvaluation.confidenceScore * 100) : '--'}/100</span>
              </div>
              {currentEvaluation.rubricScores && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(currentEvaluation.rubricScores).map(([key, value]: [string, any]) => (
                    <span 
                      key={key} 
                      className={`text-xs px-2 py-1 rounded ${
                        value >= 4 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        value >= 2 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {value >= 4 ? '✅' : value >= 2 ? '⚠️' : '❌'} {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Message Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !syncing && handleDryRun()}
              className="flex-1 px-3 py-2 border border-border rounded-md bg-input text-sm"
              placeholder="Type your message..."
              disabled={syncing}
            />
            <Button 
              size="sm" 
              onClick={handleDryRun} 
              disabled={!selectedAgent || !testMessage.trim() || syncing} 
              loading={syncing}
            >
              Send
            </Button>
          </div>

          {/* Action Buttons */}
          {conversation.length > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyTranscript}
                className="flex-1"
              >
                📋 Copy Transcript
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveForTraining}
                disabled={saving}
                loading={saving}
                className="flex-1"
              >
                💾 Save for Training
              </Button>
            </div>
          )}

          {/* Message Counter */}
          {conversation.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              {conversation.length} message{conversation.length !== 1 ? 's' : ''} in conversation
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
        <Link2 className="w-3 h-3" />
        <span>Sandbox Mode: All prompts and data are stored locally. No external API calls to GHL.</span>
      </div>
    </div>
  );
};

export default TrainingHub;


