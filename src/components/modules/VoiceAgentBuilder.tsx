import React, { useState } from 'react';
import { Bot, Plus, Settings, Play, Save, Trash2, Edit, Copy } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const VoiceAgentBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { voiceAgents, addVoiceAgent } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    persona: {
      tone: 'professional' as const,
      style: 'conversational' as const,
      language: 'en'
    },
    voiceProvider: 'elevenlabs' as const,
    llmProvider: 'openai' as const,
    defaultLanguage: 'en',
    scripts: {
      greeting: '',
      main: '',
      fallback: '',
      transfer: '',
      goodbye: ''
    }
  });

  const handleCreateAgent = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an agent name');
      return;
    }

    const newAgent = {
      id: Date.now().toString(),
      ...formData,
      intents: [],
      transferRules: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addVoiceAgent(newAgent);
    toast.success('Voice agent created successfully!');
    setIsCreating(false);
    setFormData({
      name: '',
      persona: {
        tone: 'professional',
        style: 'conversational',
        language: 'en'
      },
      voiceProvider: 'elevenlabs',
      llmProvider: 'openai',
      defaultLanguage: 'en',
      scripts: {
        greeting: '',
        main: '',
        fallback: '',
        transfer: '',
        goodbye: ''
      }
    });
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Voice Agent Builder</h1>
            <p className="text-muted-foreground">
              Create and configure intelligent voice AI agents for GoHighLevel
          </p>
        </div>
          <button
            onClick={() => setIsCreating(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Agent</span>
          </button>
        </div>
      </div>

      {/* Create Agent Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-2xl mx-4">
            <h2 className="text-xl font-semibold mb-4">Create New Voice Agent</h2>
            
            <div className="space-y-4">
                      <div>
                <label className="block text-sm font-medium mb-2">Agent Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input"
                  placeholder="Enter agent name"
                        />
                      </div>
                      
              <div className="grid grid-cols-2 gap-4">
                      <div>
                  <label className="block text-sm font-medium mb-2">Voice Provider</label>
                          <select
                            value={formData.voiceProvider}
                            onChange={(e) => setFormData({ ...formData, voiceProvider: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input"
                          >
                            <option value="elevenlabs">ElevenLabs</option>
                    <option value="azure">Azure</option>
                    <option value="aws">AWS</option>
                    <option value="google">Google</option>
                          </select>
                        </div>
                        
                        <div>
                  <label className="block text-sm font-medium mb-2">LLM Provider</label>
                          <select
                            value={formData.llmProvider}
                            onChange={(e) => setFormData({ ...formData, llmProvider: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input"
                          >
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                    <option value="azure">Azure</option>
                            <option value="cohere">Cohere</option>
                            <option value="context7">Context7</option>
                          </select>
                      </div>
                    </div>

              <div>
                <label className="block text-sm font-medium mb-2">Greeting Script</label>
                            <textarea
                  value={formData.scripts.greeting}
                              onChange={(e) => setFormData({
                                ...formData,
                    scripts: { ...formData.scripts, greeting: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input h-20"
                  placeholder="Hello! How can I help you today?"
                          />
                        </div>
                        
              <div className="flex justify-end space-x-2">
                      <button
                  onClick={() => setIsCreating(false)}
                  className="btn btn-outline"
                >
                  Cancel
                      </button>
                              <button
                  onClick={handleCreateAgent}
                  className="btn btn-primary"
                >
                  Create Agent
                              </button>
                            </div>
                          </div>
                    </div>
                  </div>
                )}

      {/* Agents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {voiceAgents.map((agent) => (
          <div key={agent.id} className="card p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                    </div>
                              <div>
                  <h3 className="font-semibold text-foreground">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {agent.voiceProvider} • {agent.llmProvider}
                  </p>
                              </div>
                            </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => {
                    // Edit functionality
                    toast.success('Edit functionality coming soon');
                  }}
                  className="p-2 hover:bg-accent rounded-md"
                  title="Edit Agent"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    // Copy functionality
                    const copyAgent = { ...agent, id: `${agent.id}_copy_${Date.now()}`, name: `${agent.name} (Copy)` };
                    addVoiceAgent(copyAgent);
                    toast.success('Agent copied successfully!');
                  }}
                  className="p-2 hover:bg-accent rounded-md"
                  title="Copy Agent"
                >
                  <Copy className="w-4 h-4" />
                              </button>
                <button 
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${agent.name}?`)) {
                      const { deleteVoiceAgent } = useStore.getState();
                      deleteVoiceAgent(agent.id);
                      toast.success('Agent deleted successfully');
                    }
                  }}
                  className="p-2 hover:bg-accent rounded-md text-destructive"
                  title="Delete Agent"
                >
                  <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </div>
                      
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Tone:</span>
                <span className="ml-2 capitalize">{agent.persona?.tone ?? 'professional'}</span>
                        </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Style:</span>
                <span className="ml-2 capitalize">{agent.persona?.style ?? 'conversational'}</span>
                            </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Language:</span>
                <span className="ml-2">{agent.defaultLanguage ?? agent.persona?.language ?? 'en'}</span>
                      </div>
                    </div>
                    
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  navigate(`/voice-testing?agent=${agent.id}`);
                  toast.success(`Testing ${agent.name}`);
                }}
                className="btn btn-outline btn-sm flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Test
              </button>
              <button 
                onClick={() => {
                  navigate(`/voice-agents/${agent.id}`);
                  toast.success('Configure mode');
                }}
                className="btn btn-primary btn-sm flex-1"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </button>
            </div>
                            </div>
                          ))}

        {voiceAgents.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No agents created yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first voice AI agent to get started
            </p>
                  <button
              onClick={() => setIsCreating(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Agent
                  </button>
                </div>
        )}
          </div>
    </div>
  );
};

export default VoiceAgentBuilder;
