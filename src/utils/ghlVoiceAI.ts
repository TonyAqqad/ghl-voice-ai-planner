/**
 * GHL Voice AI Integration
 * API utilities for creating and managing Voice AI agents in GoHighLevel
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ghlvoiceai.captureclient.com';

/**
 * Get stored tokens
 */
export async function getStoredTokens() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tokens/latest`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to get tokens:', error);
    return null;
  }
}

/**
 * Create Voice AI agent in GHL
 */
export async function createVoiceAgent(agentConfig: {
  name: string;
  description: string;
  voiceProvider: 'elevenlabs' | 'openai';
  llmProvider: 'openai' | 'anthropic';
  language: string;
  scripts?: {
    greeting?: string;
    main?: string;
    fallback?: string;
  };
  intents?: string[];
  transferRules?: any[];
}) {
  try {
    const tokens = await getStoredTokens();
    if (!tokens || tokens.expired) {
      throw new Error('No valid tokens found. Please connect to GHL first.');
    }

    // TODO: Implement GHL Voice AI API call
    // This requires the actual GHL Voice AI API endpoint
    const response = await fetch(`${API_BASE_URL}/api/voice-ai/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...agentConfig,
        access_token: tokens.access_token,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Voice AI agent');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to create Voice AI agent:', error);
    throw error;
  }
}

/**
 * Get Voice AI agents from GHL
 */
export async function getVoiceAgents() {
  try {
    const tokens = await getStoredTokens();
    if (!tokens || tokens.expired) {
      throw new Error('No valid tokens found. Please connect to GHL first.');
    }

    // TODO: Implement GHL Voice AI API call
    const response = await fetch(`${API_BASE_URL}/api/voice-ai/list`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Voice AI agents');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to get Voice AI agents:', error);
    throw error;
  }
}

/**
 * Update Voice AI agent
 */
export async function updateVoiceAgent(agentId: string, updates: any) {
  try {
    const tokens = await getStoredTokens();
    if (!tokens || tokens.expired) {
      throw new Error('No valid tokens found. Please connect to GHL first.');
    }

    const response = await fetch(`${API_BASE_URL}/api/voice-ai/${agentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update Voice AI agent');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to update Voice AI agent:', error);
    throw error;
  }
}

/**
 * Delete Voice AI agent
 */
export async function deleteVoiceAgent(agentId: string) {
  try {
    const tokens = await getStoredTokens();
    if (!tokens || tokens.expired) {
      throw new Error('No valid tokens found. Please connect to GHL first.');
    }

    const response = await fetch(`${API_BASE_URL}/api/voice-ai/${agentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete Voice AI agent');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to delete Voice AI agent:', error);
    throw error;
  }
}

/**
 * Test Voice AI agent
 */
export async function testVoiceAgent(agentId: string, testInput: string) {
  try {
    const tokens = await getStoredTokens();
    if (!tokens || tokens.expired) {
      throw new Error('No valid tokens found. Please connect to GHL first.');
    }

    const response = await fetch(`${API_BASE_URL}/api/voice-ai/${agentId}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify({ input: testInput }),
    });

    if (!response.ok) {
      throw new Error('Failed to test Voice AI agent');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Failed to test Voice AI agent:', error);
    throw error;
  }
}

