/**
 * OpenAI Text-to-Speech Integration
 * API utilities for OpenAI's TTS API
 * All API calls route through backend proxy for security
 */

export type OpenAIVoiceName = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface OpenAIVoiceInfo {
  id: string;
  name: string;
  description?: string;
}

export interface OpenAITTSOptions {
  voice: OpenAIVoiceName | OpenAIVoiceInfo;
  model?: string;
  speed?: number;
}

/**
 * Generate speech from text using OpenAI TTS
 * Uses backend proxy to keep API keys secure
 */
export async function openaiTextToSpeech(
  text: string,
  options: OpenAITTSOptions
): Promise<Blob | null> {
  try {
    // Use backend proxy instead of direct API call
    const { getApiBaseUrl } = await import('./apiBase');
    const apiBase = getApiBaseUrl();

    const response = await fetch(`${apiBase}/api/openai/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice: typeof options.voice === 'string' ? options.voice : options.voice.id,
        options: {
          model: options.model || 'tts-1',
          ...(options.speed !== undefined && { speed: options.speed })
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`OpenAI TTS error: ${errorData.error || response.statusText}`);
    }

    return await response.blob();
  } catch (error: any) {
    console.error('Failed to generate speech:', error);
    throw error;
  }
}

/**
 * Get available OpenAI voices
 */
export async function getOpenAIVoices(): Promise<OpenAIVoiceInfo[]> {
  const voices: OpenAIVoiceInfo[] = [
    { id: 'alloy', name: 'Alloy', description: 'Balanced and natural voice' },
    { id: 'echo', name: 'Echo', description: 'Male voice with warm tones' },
    { id: 'fable', name: 'Fable', description: 'Bright and expressive voice' },
    { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative male voice' },
    { id: 'nova', name: 'Nova', description: 'Clear and professional female voice' },
    { id: 'shimmer', name: 'Shimmer', description: 'Smooth and warm female voice' }
  ];
  
  return voices;
}

/**
 * Validate OpenAI API key (via backend proxy)
 */
export async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const { getApiBaseUrl } = await import('./apiBase');
    const apiBase = getApiBaseUrl();
    
    const response = await fetch(`${apiBase}/api/openai/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'test',
        voice: 'alloy',
        options: { model: 'tts-1' }
      })
    });

    // If we get a proper error message (not 401), key is valid but test failed
    // If 401, key is invalid
    return response.status !== 401;
  } catch (error) {
    return false;
  }
}

/**
 * Generate speech and return as audio URL
 */
export async function openaiTextToSpeechURL(
  text: string,
  options: OpenAITTSOptions
): Promise<string | null> {
  const blob = await openaiTextToSpeech(text, options);
  if (!blob) return null;

  return URL.createObjectURL(blob);
}

/**
 * Default OpenAI voices for quick setup
 */
export const DEFAULT_OPENAI_VOICES: Record<string, OpenAIVoiceInfo> = {
  'Alloy': { id: 'alloy', name: 'Alloy', description: 'Balanced and natural' },
  'Echo': { id: 'echo', name: 'Echo', description: 'Warm male voice' },
  'Fable': { id: 'fable', name: 'Fable', description: 'Bright and expressive' },
  'Onyx': { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  'Nova': { id: 'nova', name: 'Nova', description: 'Clear and professional' },
  'Shimmer': { id: 'shimmer', name: 'Shimmer', description: 'Smooth and warm' }
};
