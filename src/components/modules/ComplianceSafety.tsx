import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Shield, FileText } from 'lucide-react';

const ComplianceSafety: React.FC = () => {
  const [checks, setChecks] = useState([
    { id: '1', name: 'TCPA Compliance', status: 'pass', lastChecked: '2024-01-15' },
    { id: '2', name: 'GDPR Compliance', status: 'pass', lastChecked: '2024-01-15' },
    { id: '3', name: 'Data Security', status: 'warning', lastChecked: '2024-01-14' },
  ]);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Compliance Safety</h1>
            <p className="text-muted-foreground">Regulatory compliance and safety monitoring</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Passed Checks</p>
          <p className="text-2xl font-bold">{checks.filter(c => c.status === 'pass').length}/{checks.length}</p>
        </div>
        <div className="card p-6">
          <Shield className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
          <p className="text-2xl font-bold">95%</p>
        </div>
        <div className="card p-6">
          <AlertTriangle className="w-8 h-8 text-yellow-600 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Warnings</p>
          <p className="text-2xl font-bold">{checks.filter(c => c.status === 'warning').length}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Compliance Checks</h2>
        <div className="space-y-3">
          {checks.map(c => (
            <div key={c.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {c.status === 'pass' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {c.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-muted-foreground">Last checked: {c.lastChecked}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  c.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {c.status === 'pass' ? 'Compliant' : 'Warning'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceSafety;
