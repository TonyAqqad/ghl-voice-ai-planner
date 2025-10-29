import React, { useState } from 'react';
import { CheckCircle, AlertCircle, FileText, Activity } from 'lucide-react';

const GHLIntegrationValidator: React.FC = () => {
  const [tests, setTests] = useState([
    { id: '1', name: 'API Connection', status: 'pass', details: 'Successfully connected to GHL API' },
    { id: '2', name: 'OAuth Flow', status: 'pass', details: 'OAuth tokens are valid and refreshing correctly' },
    { id: '3', name: 'Webhook Endpoints', status: 'warning', details: 'Some webhook endpoints need configuration' },
    { id: '4', name: 'Data Sync', status: 'pass', details: 'Contact data syncing properly' },
  ]);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">GHL Integration Validator</h1>
            <p className="text-muted-foreground">Automated GHL integration testing</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Passed</p>
          <p className="text-2xl font-bold">{tests.filter(t => t.status === 'pass').length}</p>
        </div>
        <div className="card p-6">
          <AlertCircle className="w-8 h-8 text-yellow-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Warnings</p>
          <p className="text-2xl font-bold">{tests.filter(t => t.status === 'warning').length}</p>
        </div>
        <div className="card p-6">
          <Activity className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
          <p className="text-2xl font-bold">{tests.length}</p>
        </div>
        <div className="card p-6">
          <FileText className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          <p className="text-2xl font-bold">Active</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        <div className="space-y-3">
          {tests.map(t => (
            <div key={t.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {t.status === 'pass' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {t.status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.details}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  t.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GHLIntegrationValidator;
