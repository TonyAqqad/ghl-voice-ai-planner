import React, { useState } from 'react';
import { Download, FileText, Code, Database, Settings, CheckCircle } from 'lucide-react';

interface ExportableItem {
  id: string;
  name: string;
  type: 'agent' | 'workflow' | 'webhook' | 'config' | 'data';
  size: string;
  lastExported?: string;
}

const ExportCenter: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml' | 'csv'>('json');

  const exportableItems: ExportableItem[] = [
    { id: '1', name: 'Solar Sales Agent', type: 'agent', size: '2.4 KB', lastExported: '2024-01-15T10:30:00Z' },
    { id: '2', name: 'Lead Qualification Workflow', type: 'workflow', size: '15.8 KB' },
    { id: '3', name: 'Call Started Webhook', type: 'webhook', size: '856 B', lastExported: '2024-01-14T08:00:00Z' },
    { id: '4', name: 'GHL Integration Config', type: 'config', size: '4.2 KB' },
    { id: '5', name: 'Contact Data Export', type: 'data', size: '125.6 KB' }
  ];

  const handleExport = (itemIds: string[]) => {
    // In production, this would trigger actual export
    console.log('Exporting items:', itemIds, 'format:', exportFormat);
    alert(`Exporting ${itemIds.length} items in ${exportFormat.toUpperCase()} format...`);
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItems(exportableItems.map(item => item.id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'agent': return <FileText />;
      case 'workflow': return <Settings />;
      case 'webhook': return <Database />;
      case 'config': return <Code />;
      case 'data': return <Database />;
      default: return <FileText />;
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Export Center</h1>
            <p className="text-muted-foreground">
              Export configurations and data in multiple formats
            </p>
          </div>
          <div className="flex space-x-3">
            <select
              className="input"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button className="card p-6 hover:border-primary transition">
          <FileText className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-semibold mb-1">Agent Configurations</h3>
          <p className="text-sm text-muted-foreground">Export voice agent settings</p>
        </button>
        <button className="card p-6 hover:border-primary transition">
          <Code className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="font-semibold mb-1">API Configurations</h3>
          <p className="text-sm text-muted-foreground">Export API settings</p>
        </button>
        <button className="card p-6 hover:border-primary transition">
          <Database className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-semibold mb-1">Data & Analytics</h3>
          <p className="text-sm text-muted-foreground">Export conversation data</p>
        </button>
      </div>

      {/* Available Exports */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Available for Export</h2>
          <div className="flex space-x-2">
            <button onClick={selectAll} className="btn btn-sm btn-outline">
              Select All
            </button>
            <button
              onClick={() => handleExport(selectedItems)}
              disabled={selectedItems.length === 0}
              className="btn btn-sm btn-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedItems.length})
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {exportableItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-4 p-4 border rounded hover:bg-accent/5 transition cursor-pointer"
              onClick={() => toggleSelection(item.id)}
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => toggleSelection(item.id)}
                className="w-5 h-5"
              />
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.size}
                  </p>
                </div>
              </div>
              {item.lastExported && (
                <div className="text-xs text-muted-foreground">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Exported {new Date(item.lastExported).toLocaleDateString()}
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport([item.id]);
                }}
                className="btn btn-sm btn-outline"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Export History */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Export History</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded text-sm">
            <span>Agent Configurations - JSON</span>
            <span className="text-muted-foreground">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded text-sm">
            <span>Workflow Configurations - YAML</span>
            <span className="text-muted-foreground">Yesterday</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded text-sm">
            <span>Contact Data - CSV</span>
            <span className="text-muted-foreground">3 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter;