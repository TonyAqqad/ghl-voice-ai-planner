import React, { useState } from 'react';
import { ExternalLink, Code, FileText, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

const GHLIntegrationHelper: React.FC = () => {
  const [mergeTags] = useState([
    { tag: '{{Contact.Name}}', description: 'Contact\'s first name' },
    { tag: '{{Contact.Email}}', description: 'Contact\'s email address' },
    { tag: '{{Contact.Phone}}', description: 'Contact\'s phone number' },
    { tag: '{{Contact.Company}}', description: 'Contact\'s company name' },
  ]);

  const handleCopy = (tag: string) => {
    navigator.clipboard.writeText(tag);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Integration Helper</h1>
            <p className="text-muted-foreground">GHL merge tags and integration patterns</p>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Merge Tags</h2>
        <div className="space-y-3">
          {mergeTags.map((mt, idx) => (
            <div key={idx} className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <code className="text-sm font-mono bg-primary/10 px-2 py-1 rounded">{mt.tag}</code>
                <p className="text-sm text-muted-foreground mt-1">{mt.description}</p>
              </div>
              <button onClick={() => handleCopy(mt.tag)} className="btn btn-outline btn-sm">
                <Copy className="w-4 h-4 mr-1" />Copy
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Integration Examples</h2>
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg">
            <h3 className="font-semibold mb-2">Contact Sync</h3>
            <p className="text-sm text-muted-foreground">Sync contacts from GHL to your voice agents automatically</p>
          </div>
          <div className="p-4 bg-primary/5 rounded-lg">
            <h3 className="font-semibold mb-2">Workflow Triggers</h3>
            <p className="text-sm text-muted-foreground">Trigger GHL workflows based on voice agent interactions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GHLIntegrationHelper;
