import React, { useState, useEffect } from 'react';
import { History, GitBranch, Clock, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

interface PromptVersion {
  id: string;
  version: string;
  agent_id: string;
  system_prompt: string;
  created_at: string;
  niche: string;
}

interface PromptVersionHistoryProps {
  agentId?: string;
}

const PromptVersionHistory: React.FC<PromptVersionHistoryProps> = ({ agentId }) => {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [agentId]);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = agentId ? { agentId } : {};
      const response = await axios.get('/api/mcp/prompt/versions', { params });
      
      if (response.data.success) {
        setVersions(response.data.versions || []);
      } else {
        setError(response.data.error || 'Failed to fetch versions');
      }
    } catch (err: any) {
      console.error('Error fetching prompt versions:', err);
      setError(err.response?.data?.error || err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleVersion = (versionId: string) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  const extractCorrections = (prompt: string): string[] => {
    const corrections: string[] = [];
    const regex = /### Manual Correction (.*?)\n(?:Original.*?:\n(.*?)\n\nPreferred.*?:\n(.*?)(?=\n\n###|\n\n$|$))/gs;
    let match;
    
    while ((match = regex.exec(prompt)) !== null) {
      corrections.push(match[1]); // timestamp
    }
    
    return corrections;
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary animate-spin" />
          <h2 className="text-lg font-semibold">Loading Prompt History...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-600">Error Loading History</h2>
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Prompt Version History</h2>
        </div>
        <p className="text-sm text-muted-foreground">No prompt versions yet. Start training your agent to see version history.</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Prompt Version History</h2>
          <span className="text-xs text-muted-foreground">({versions.length} versions)</span>
        </div>
        <button
          onClick={fetchVersions}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Clock className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {versions.map((version, idx) => {
          const isLatest = idx === 0;
          const corrections = extractCorrections(version.system_prompt);
          const isExpanded = expandedVersion === version.id;

          return (
            <div
              key={version.id}
              className={`border rounded-lg p-4 ${
                isLatest 
                  ? 'border-green-500/50 bg-green-50 dark:bg-green-900/10' 
                  : 'border-border/60 bg-muted/10'
              }`}
            >
              <div 
                className="flex items-start justify-between cursor-pointer"
                onClick={() => toggleVersion(version.id)}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded ${
                    isLatest ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'
                  }`}>
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">Version {version.version}</p>
                      {isLatest && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')} ·
                      {corrections.length > 0 ? (
                        <span className="ml-1 font-medium">{corrections.length} correction{corrections.length > 1 ? 's' : ''} applied</span>
                      ) : (
                        <span className="ml-1">Base prompt</span>
                      )}
                    </p>
                  </div>
                </div>
                <button className="p-1">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="space-y-3">
                    {corrections.length > 0 ? (
                      <>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Applied Corrections:</p>
                        <ul className="space-y-1 text-sm">
                          {corrections.map((correction, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{correction}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Original prompt template (no corrections yet)</p>
                    )}
                    
                    <details className="mt-3">
                      <summary className="text-xs text-primary cursor-pointer hover:underline">
                        View full prompt
                      </summary>
                      <pre className="mt-2 text-xs bg-background p-3 rounded border border-border/60 overflow-x-auto max-h-64 overflow-y-auto">
                        {version.system_prompt}
                      </pre>
                    </details>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PromptVersionHistory;

