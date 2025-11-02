import React, { useState } from 'react';
import { 
  Upload, 
  Download, 
  Bot, 
  Sparkles, 
  Dumbbell,
  Heart,
  Utensils,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from 'react-hot-toast';
import f45Template from '../templates/f45-training-agent.json';
import gracieBarraTemplate from '../templates/gracie-barra-agent.json';
import restaurantTemplate from '../templates/restaurant-agent.json';

interface Template {
  id: string;
  name: string;
  industry: string;
  description: string;
  icon: React.ElementType;
  config: any;
  stats: {
    knowledgeItems: number;
    customActions: number;
    intents: number;
    webhookCount: number;
  };
}

const TemplateImporter: React.FC = () => {
  const { addVoiceAgent } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const templates: Template[] = [
    {
      id: 'f45-training',
      name: 'F45 Training',
      industry: 'Fitness',
      description: 'Energetic voice agent for F45 Training fitness studios - handles class bookings, membership inquiries, and sales',
      icon: Dumbbell,
      config: f45Template,
      stats: {
        knowledgeItems: 8,
        customActions: 1,
        intents: 4,
        webhookCount: 1
      }
    },
    {
      id: 'gracie-barra',
      name: 'Gracie Barra Jiu-Jitsu',
      industry: 'Martial Arts',
      description: 'Professional voice agent for Gracie Barra BJJ academies - trial class bookings, belt program info, and academy inquiries',
      icon: Heart,
      config: gracieBarraTemplate,
      stats: {
        knowledgeItems: 9,
        customActions: 1,
        intents: 5,
        webhookCount: 1
      }
    },
    {
      id: 'restaurant',
      name: 'Restaurant Voice Agent',
      industry: 'Food & Restaurant',
      description: 'Smart restaurant agent with live menu lookup, order placement, reservations, and delivery coordination',
      icon: Utensils,
      config: restaurantTemplate,
      stats: {
        knowledgeItems: 15,
        customActions: 3,
        intents: 5,
        webhookCount: 3
      }
    }
  ];

  const handleImport = async (template: Template) => {
    setIsImporting(true);
    
    try {
      // Convert template to voice agent format
      const agent = {
        id: `${template.id}_${Date.now()}`,
        name: template.config.name || template.name,
        persona: template.config.persona || { tone: 'professional', style: 'conversational', language: 'en' },
        voiceProvider: template.config.voiceProvider || 'elevenlabs',
        llmProvider: template.config.llmProvider || 'openai',
        defaultLanguage: template.config.defaultLanguage || 'en',
        scripts: template.config.scripts || { greeting: '', main: '', fallback: '', transfer: '', goodbye: '' },
        intents: template.config.intents || [],
        transferRules: template.config.transferRules || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      addVoiceAgent(agent);
      toast.success(`Successfully imported ${template.name} agent!`);
      setIsImporting(false);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Failed to import template: ${error.message}`);
      setIsImporting(false);
    }
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Expert Agent Templates</h1>
        <p className="text-muted-foreground">
          Import production-ready Voice AI agents with expert prompts, knowledge bases, and live webhooks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <div key={template.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.industry}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Knowledge Items</span>
                  <span className="font-semibold">{template.stats.knowledgeItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Custom Actions</span>
                  <span className="font-semibold">{template.stats.customActions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Intents</span>
                  <span className="font-semibold">{template.stats.intents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Live Webhooks</span>
                  <span className="font-semibold text-green-600">{template.stats.webhookCount}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handlePreview(template)}
                  className="btn btn-outline flex-1 btn-sm"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Preview
                </button>
                <button
                  onClick={() => handleImport(template)}
                  disabled={isImporting}
                  className="btn btn-primary flex-1 btn-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Import
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Template Preview: {selectedTemplate.name}</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-outline btn-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">System Prompt</h3>
                <p className="text-sm bg-primary/5 p-3 rounded">
                  {selectedTemplate.config.systemPrompt}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Knowledge Base Summary</h3>
                <ul className="text-sm space-y-1">
                  <li>• {selectedTemplate.config.knowledgeBase[Object.keys(selectedTemplate.config.knowledgeBase)[0]]?.length || 0} training programs/styles</li>
                  <li>• Full pricing structure</li>
                  <li>• Complete class schedules</li>
                  <li>• Location & contact information</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Custom Actions (Live Webhooks)</h3>
                <div className="space-y-2">
                  {selectedTemplate.config.customActions?.map((action: any, idx: number) => (
                    <div key={idx} className="bg-primary/5 p-3 rounded">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{action.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Triggers: {action.triggerPhrases?.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handleImport(selectedTemplate);
                    setShowPreview(false);
                  }}
                  className="btn btn-primary flex-1"
                  disabled={isImporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import This Template'}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateImporter;

