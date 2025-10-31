import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/apiBase';

export interface Correction {
  id: string;
  agent_id: string;
  original_response: string;
  corrected_response: string;
  reason: string;
  store_in: 'prompt' | 'kb';
  prompt_version: string;
  created_at: string;
  call_date: string;
  transcript: string;
}

export interface CorrectionStats {
  total_corrections: number;
  agents_improved: number;
  prompt_updates: number;
  kb_additions: number;
}

export const useCorrections = (agentId?: string) => {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [stats, setStats] = useState<CorrectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const url = `${getApiBaseUrl()}/api/mcp/agent/corrections${agentId ? `?agentId=${agentId}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCorrections(data.corrections);
        setStats(data.stats);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch corrections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, [agentId]);

  return { corrections, stats, loading, error, refresh: fetchCorrections };
};

