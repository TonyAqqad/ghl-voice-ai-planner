/**
 * MCP Client Hook
 * React hook for MCP client communication
 * Integrates with Zustand store for MCP state
 */

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiBase';
import toast from 'react-hot-toast';

const API_BASE_URL = getApiBaseUrl();

interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UseMCPOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

export function useMCP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callMCP = useCallback(async <T = any>(
    endpoint: string,
    params: any,
    options: UseMCPOptions = {}
  ): Promise<MCPResponse<T>> => {
    const { onSuccess, onError, showToast = true } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<T>(
        `${API_BASE_URL}/api/mcp${endpoint}`,
        params,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && 'success' in response.data) {
        const mcpResponse = response.data as MCPResponse<T>;

        if (mcpResponse.success) {
          if (showToast) {
            toast.success('MCP operation successful');
          }
          onSuccess?.(mcpResponse.data);
          return mcpResponse;
        } else {
          throw new Error(mcpResponse.error || 'MCP operation failed');
        }
      }

      return {
        success: true,
        data: response.data as T
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(errorMessage);

      if (showToast) {
        toast.error(errorMessage);
      }

      onError?.(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Voice Agent primitives
  const voiceAgentCall = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/voiceAgent/call', params, options);
  }, [callMCP]);

  const voiceAgentGeneratePrompt = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/voiceAgent/generatePrompt', params, options);
  }, [callMCP]);

  // GHL primitives
  const ghlTriggerWorkflow = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/ghl/triggerWorkflow', params, options);
  }, [callMCP]);

  // Webhook primitives
  const webhookOnEvent = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/webhook/onEvent', params, options);
  }, [callMCP]);

  // Contact primitives
  const contactExtractAndUpdate = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/contact/extractAndUpdate', params, options);
  }, [callMCP]);

  // Action primitives
  const actionRetryIfFail = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/action/retryIfFail', params, options);
  }, [callMCP]);

  // Agent primitives
  const agentLog = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/agent/log', params, options);
  }, [callMCP]);

  const agentCheckHealth = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/agent/checkHealth', params, options);
  }, [callMCP]);

  const agentSaveState = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/agent/saveState', params, options);
  }, [callMCP]);

  const agentLoadState = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/agent/loadState', params, options);
  }, [callMCP]);

  // Integration primitives
  const integrationConnect = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/integration/connect', params, options);
  }, [callMCP]);

  // Monitoring primitives
  const agentAutoRecovery = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/agent/autoRecovery', params, options);
  }, [callMCP]);

  const agentAnomalyDetect = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/agent/anomalyDetect', params, options);
  }, [callMCP]);

  const agentFeedbackLoop = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/agent/feedbackLoop', params, options);
  }, [callMCP]);

  const agentSaveCorrection = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/agent/saveCorrection', params, { showToast: false, ...(options || {}) });
  }, [callMCP]);

  const configDriftDetect = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/configDrift/detect', params, options);
  }, [callMCP]);

  const agentLiveTrace = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/agent/liveTrace', params, options);
  }, [callMCP]);

  const getTrace = useCallback(async (traceId: string, options?: UseMCPOptions) => {
    try {
      const response = await axios.get<MCPResponse>(
        `${API_BASE_URL}/api/mcp/agent/getTrace/${traceId}`
      );
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      if (options?.showToast !== false) {
        toast.error(errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const autoPatchDeploy = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/autoPatch/deploy', params, options);
  }, [callMCP]);

  const incidentReportCreate = useCallback((params: any, options?: UseMCPOptions) => {
    return callMCP('/incidentReport/create', params, options);
  }, [callMCP]);

  const getIncidents = useCallback(async (filters: any = {}, options?: UseMCPOptions) => {
    try {
      const response = await axios.get<MCPResponse>(
        `${API_BASE_URL}/api/mcp/incidentReport/getIncidents`,
        { params: filters }
      );
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      if (options?.showToast !== false) {
        toast.error(errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  // Health check
  const checkHealth = useCallback(async (options?: UseMCPOptions) => {
    try {
      const response = await axios.get<MCPResponse>(
        `${API_BASE_URL}/api/mcp/health`
      );
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      if (options?.showToast !== false) {
        toast.error(errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    loading,
    error,
    
    // Core primitives
    voiceAgentCall,
    voiceAgentGeneratePrompt,
    ghlTriggerWorkflow,
    webhookOnEvent,
    contactExtractAndUpdate,
    actionRetryIfFail,
    agentLog,
    agentCheckHealth,
    agentSaveState,
    agentLoadState,
    integrationConnect,
    
    // Monitoring primitives
    agentAutoRecovery,
    agentAnomalyDetect,
    agentFeedbackLoop,
    agentSaveCorrection,
    configDriftDetect,
    agentLiveTrace,
    getTrace,
    autoPatchDeploy,
    incidentReportCreate,
    getIncidents,
    
    // Utility
    checkHealth,
    callMCP // Raw call method for custom endpoints
  };
}

