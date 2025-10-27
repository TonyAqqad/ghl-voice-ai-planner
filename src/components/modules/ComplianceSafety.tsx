import React from 'react';
import { AlertTriangle, Settings, Zap } from 'lucide-react';

const ComplianceSafety: React.FC = () => {
  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Compliance Safety</h1>
            <p className="text-muted-foreground">
              Regulatory compliance and safety monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="card p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Compliance Safety</h2>
        <p className="text-muted-foreground mb-4">
          This module is under development. Full functionality will be available soon.
        </p>
        <div className="flex justify-center space-x-2">
          <button className="btn btn-primary">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </button>
          <button className="btn btn-outline">
            <Zap className="w-4 h-4 mr-2" />
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplianceSafety;