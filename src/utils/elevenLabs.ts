/**
 * ElevenLabs Voice AI Integration
 * API utilities for text-to-speech and voice synthesis
 */

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  samples?: any[];
  category?: string;
  fine_tuning?: any;
  labels?: Record<string, string>;
  description?: string;
  preview_url?: string;
}

export interface ElevenLabsSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

/**
 * Get all available voices
 */
export async function getElevenLabsVoices(apiKey?: string): Promise<ElevenLabsVoice[]> {
  try {
    const key = apiKey || import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!key) {
      console.warn('ElevenLabs API key not configured');
      return [];
    }

    const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
      headers: {
        'xi-api-key': key,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error: any) {
    console.error('Failed to fetch ElevenLabs voices:', error);
    return [];
  }
}

/**
 * Get voice details by ID
 */
export async function getElevenLabsVoice(voiceId: string, apiKey?: string): Promise<ElevenLabsVoice | null> {
  try {
    const key = apiKey || import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!key) return null;

    const response = await fetch(`${ELEVENLABS_API_BASE}/voices/${voiceId}`, {
      headers: {
        'xi-api-key': key,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error: any) {
    console.error('Failed to fetch ElevenLabs voice:', error);
    return null;
  }
}

/**
 * Generate speech from text using ElevenLabs
 */
export async function textToSpeech(
  text: string,
  voiceId: string,
  options: {
    apiKey?: string;
    model?: string;
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  } = {}
): Promise<Blob | null> {
  try {
    const key = options.apiKey || import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!key) {
      console.warn('ElevenLabs API key not configured');
      return null;
    }

    const model = options.model || 'eleven_monolingual_v1';
    const settings = {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarity_boost ?? 0.75,
      ...(options.style !== undefined && { style: options.style }),
      ...(options.use_speaker_boost !== undefined && { use_speaker_boost: options.use_speaker_boost })
    };

    const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: settings
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS error: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error: any) {
    console.error('Failed to generate speech:', error);
    return null;
  }
}

/**
 * Generate speech and return as audio URL
 */
export async function textToSpeechURL(
  text: string,
  voiceId: string,
  options: {
    apiKey?: string;
    model?: string;
    stability?: number;
    similarity_boost?: number;
  } = {}
): Promise<string | null> {
  const blob = await textToSpeech(text, voiceId, options);
  if (!blob) return null;

  return URL.createObjectURL(blob);
}

/**
 * Get user's subscription information
 */
export async function getElevenLabsSubscription(apiKey?: string) {
  try {
    const key = apiKey || import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!key) return null;

    const response = await fetch(`${ELEVENLABS_API_BASE}/user/subscription`, {
      headers: {
        'xi-api-key': key,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error: any) {
    console.error('Failed to fetch subscription:', error);
    return null;
  }
}

/**
 * Check if API key is valid
 */
export async function validateElevenLabsKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/user`, {
      headers: {
        'xi-api-key': apiKey,
        'Accept': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Default ElevenLabs voices for quick setup
 */
export const DEFAULT_ELEVENLABS_VOICES = {
  'Rachel': '21m00Tcm4TlvDq8ikWAM', // Professional female
  'Adam': 'pNInz6obpgDQGcFmaJgB',   // Professional male
  'Antoni': 'ErXwobaYiN019PkySvjV',   // Warm male
  'Arnold': 'VR6AewLTigWG4xSOukaG',   // Deep male
  'Bella': 'EXAVITQu4vr4xnSDxMaL',     // Warm female
  'Elli': 'MF3mGyEYCl7XYWbV9V6O',      // Energetic female
  'Josh': 'TxGEqnHWrfWFTfGW9XjX',      // Deep male
  'Michael': 'flq6f7yk4E4fJM5XFYu',   // Professional male
  'Sarah': 'EXAVITQu4vr4xnSDxMaL',      // Calm female
  'Sam': 'yoZ06aMxZJJ28mfdLPOk',        // Young male
};

