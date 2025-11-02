import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Users,
  Phone,
  Lock,
  Globe,
  Clock,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'react-hot-toast';

interface ComplianceIssue {
  category: 'TCPA' | 'GDPR' | 'DNC' | 'Recording' | 'Consent';
  severity: 'critical' | 'warning' | 'info';
  issue: string;
  recommendation: string;
  affectedAgents: number;
}

const ComplianceChecker: React.FC = () => {
  const { compliance, voiceAgents } = useStore();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(new Date().toISOString());

  const [issues, setIssues] = useState<ComplianceIssue[]>([
    {
      category: 'TCPA',
      severity: 'warning',
      issue: 'Some agents missing TCPA compliance scripts',
      recommendation: 'Add TCPA compliance scripts to all outbound calling agents',
      affectedAgents: 3
    },
    {
      category: 'GDPR',
      severity: 'info',
      issue: 'Data retention policy not configured',
      recommendation: 'Configure GDPR-compliant data retention policies',
      affectedAgents: 0
    },
    {
      category: 'Recording',
      severity: 'critical',
      issue: 'Recording consent not verified for agent: F45 Fitness Agent',
      recommendation: 'Add recording consent prompt before recording starts',
      affectedAgents: 1
    },
    {
      category: 'DNC',
      severity: 'info',
      issue: 'DNC list last updated 7 days ago',
      recommendation: 'Update DNC list weekly to maintain compliance',
      affectedAgents: 0
    }
  ]);

  const handleRunCheck = async () => {
    setIsChecking(true);
    toast.success('Running compliance check...');
    
    // Simulate checking
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLastCheck(new Date().toISOString());
    setIsChecking(false);
    toast.success('Compliance check complete');
  };

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  const complianceScore = 100 - (criticalCount * 10) - (warningCount * 5);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Compliance Checker</h1>
            <p className="text-muted-foreground">
              Automated compliance monitoring and risk assessment
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleRunCheck}
              disabled={isChecking}
              className="btn btn-primary"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Run Check'}
            </button>
            <button className="btn btn-outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
              <p className={`text-3xl font-bold ${complianceScore >= 90 ? 'text-green-600' : complianceScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {complianceScore}%
              </p>
            </div>
            {complianceScore >= 90 && <CheckCircle className="w-8 h-8 text-green-600" />}
            {complianceScore < 90 && <AlertCircle className="w-8 h-8 text-yellow-600" />}
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Info Items</p>
              <p className="text-2xl font-bold text-blue-600">{infoCount}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-primary" />
            TCPA Compliance
          </h3>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm">Mostly Compliant</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {compliance?.tcpaChecked ? '✅ TCPA checks enabled' : '⚠️ TCPA checks disabled'}
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-primary" />
            GDPR Compliance
          </h3>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm">Compliant</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {compliance?.gdprChecked ? '✅ GDPR compliance active' : '⚠️ GDPR not configured'}
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-primary" />
            DNC List
          </h3>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm">Up to Date</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {compliance?.dncListMeta ? 
              `${compliance.dncListMeta.recordCount.toLocaleString()} records` : 
              'No DNC list configured'}
          </p>
        </div>
      </div>

      {/* Issues List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Compliance Issues</h2>
        {issues.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <p className="text-muted-foreground">No compliance issues found!</p>
            <p className="text-sm text-muted-foreground">All systems are compliant</p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue, idx) => (
              <div key={idx} className={`border-l-4 p-4 rounded ${
                issue.severity === 'critical' ? 'border-red-500 bg-red-500/10' :
                issue.severity === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
                'border-blue-500 bg-blue-500/10'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className={`w-4 h-4 ${
                        issue.severity === 'critical' ? 'text-red-600' :
                        issue.severity === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {issue.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{issue.issue}</p>
                    <p className="text-sm text-muted-foreground mb-2">{issue.recommendation}</p>
                    {issue.affectedAgents > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Affects {issue.affectedAgents} agent{issue.affectedAgents !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <button className="btn btn-outline btn-sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Fix
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceChecker;
