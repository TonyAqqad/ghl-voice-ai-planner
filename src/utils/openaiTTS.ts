/**
 * OpenAI Text-to-Speech Integration
 * API utilities for OpenAI's TTS API
 */

const OPENAI_API_BASE = 'https://api.openai.com/v1';

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface OpenAITTSOptions {
  voice: OpenAIVoice;
  model?: string;
  speed?: number;
}

export interface OpenAIVoice {
  id: string;
  name: string;
  description?: string;
}

/**
 * Generate speech from text using OpenAI TTS
 */
export async function openaiTextToSpeech(
  text: string,
  options: OpenAITTSOptions
): Promise<Blob | null> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not configured');
      return null;
    }

    const response = await fetch(`${OPENAI_API_BASE}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'tts-1',
        input: text,
        voice: options.voice,
        ...(options.speed !== undefined && { speed: options.speed })
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS error: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error: any) {
    console.error('Failed to generate speech:', error);
    return null;
  }
}

/**
 * Get available OpenAI voices
 */
export async function getOpenAIVoices(): Promise<OpenAIVoice[]> {
  const voices: OpenAIVoice[] = [
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
 * Validate OpenAI API key
 */
export async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${OPENAI_API_BASE}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.ok;
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
export const DEFAULT_OPENAI_VOICES: Record<string, OpenAIVoice> = {
  'Alloy': { id: 'alloy', name: 'Alloy', description: 'Balanced and natural' },
  'Echo': { id: 'echo', name: 'Echo', description: 'Warm male voice' },
  'Fable': { id: 'fable', name: 'Fable', description: 'Bright and expressive' },
  'Onyx': { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  'Nova': { id: 'nova', name: 'Nova', description: 'Clear and professional' },
  'Shimmer': { id: 'shimmer', name: 'Shimmer', description: 'Smooth and warm' }
};
