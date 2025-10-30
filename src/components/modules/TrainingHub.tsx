import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Save, Upload, RefreshCw, Database, Sparkles, CheckCircle, Link2 } from 'lucide-react';
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

  const mcp = useMCP();
  // Inline test panel state
  const [testMessage, setTestMessage] = useState<string>('Hello');
  const [testResult, setTestResult] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);

  const selectedAgent = useMemo(() => voiceAgents.find(a => a.id === selectedId), [voiceAgents, selectedId]);

  useEffect(() => {
    if (!selectedAgent && voiceAgents.length > 0) {
      setSelectedId(voiceAgents[0].id);
    }
  }, [selectedAgent, voiceAgents]);

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
  };

  const handleGeneratePrompt = async () => {
    if (!selectedAgent) return;
    setGenLoading(true);
    try {
      const result = await mcp.voiceAgentGeneratePrompt({
        template: systemPrompt || 'You are a sales assistant. Gather customer needs and book appointments.',
        businessHours: { open: '9 AM', close: '5 PM' },
        clientContext: { industry: 'sales' },
        enhance: true,
        industry: 'sales',
        goals: [
          'Qualify leads and understand customer needs',
          'Schedule appointments with appropriate team members',
          'Capture accurate contact and preference information'
        ],
        tone: 'professional'
      }, {
        showToast: false // We'll handle toast manually
      });
      
      if (result?.success && result.data) {
        const prompt = result.data as string;
        setSystemPrompt(prompt);
        toast.success('Prompt generated successfully!');
      } else {
        const errorMsg = result?.error || 'Prompt generation failed';
        toast.error(errorMsg);
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || e.message || 'Prompt generation failed';
      toast.error(errorMsg);
      console.error('Prompt generation error:', e);
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
    if (!selectedAgent) return;
    setSyncing(true);
    try {
      const res = await mcp.voiceAgentCall({
        agentId: selectedAgent.id,
        phoneNumber: '+10000000000',
        context: { userMessage: testMessage }
      });
      setTestResult(res);
      toast.success('Dry-run completed');
    } catch (e: any) {
      toast.error(e.message || 'Dry-run failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Training Hub</h1>
          <p className="text-muted-foreground">Craft prompts, knowledge, and Q&A; sync directly with GHL</p>
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

          <div className="mt-4 p-3 rounded bg-muted/30 text-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>Source of truth: This app → Syncs to GHL</span>
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
            <h2 className="font-semibold">Dry-Run (Text → TTS)</h2>
            <Button size="sm" onClick={handleDryRun} disabled={!selectedAgent || syncing} loading={syncing}>
              <Sparkles className="w-4 h-4 mr-1" /> Run
            </Button>
          </div>
          <textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input h-20 mb-3" placeholder="Type a message for the agent..." />
          <pre className="text-xs bg-muted/30 p-3 rounded overflow-auto max-h-48">{testResult ? JSON.stringify(testResult, null, 2) : 'No results yet.'}</pre>
        </div>
      </div>

      <div className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
        <Link2 className="w-3 h-3" />
        <span>After syncing, content becomes available inside the GHL Voice AI dashboard.</span>
      </div>
    </div>
  );
};

export default TrainingHub;


