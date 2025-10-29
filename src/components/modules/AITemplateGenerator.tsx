import React, { useState } from 'react';
import { Sparkles, Plus, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AITemplateGenerator: React.FC = () => {
  const [templates, setTemplates] = useState([
    { id: '1', name: 'Lead Qualification Bot', industry: 'Sales', status: 'ready' },
    { id: '2', name: 'Support Assistant', industry: 'Customer Service', status: 'generating' },
  ]);

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

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="space-y-3 text-sm">
          <p>• Describe your use case and industry</p>
          <p>• AI generates a complete voice agent template</p>
          <p>• Review and customize the generated script</p>
          <p>• Deploy with one click</p>
        </div>
      </div>
    </div>
  );
};

export default AITemplateGenerator;
