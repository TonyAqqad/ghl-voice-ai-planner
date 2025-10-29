// src/utils/voiceProviders.ts
import * as elevenLabs from './elevenLabs';
import * as openaiTTS from './openaiTTS';

export type VoiceProviderType = 'elevenlabs' | 'openai';
export type ElevenLabsVoiceId = string;
export type OpenAIVoiceName = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface VoiceProvider {
  textToSpeech(text: string, voiceId: ElevenLabsVoiceId | OpenAIVoiceName, modelId?: string): Promise<ArrayBuffer | Buffer>;
  getVoices?(): Promise<any[]>;
}

export interface Voice {
  id: string;
  name: string;
  provider: 'elevenlabs' | 'openai';
  voiceId?: string;
  description?: string;
}

const elevenLabsProvider: VoiceProvider = {
  textToSpeech: async (text, voiceId, modelId) => {
    if (typeof voiceId !== 'string') {
      throw new Error('ElevenLabs requires a string voiceId');
    }
    const blob = await elevenLabs.textToSpeech(text, voiceId, { model: modelId });
    if (!blob) {
      throw new Error('Failed to generate speech');
    }
    return await blob.arrayBuffer();
  },
  getVoices: elevenLabs.getElevenLabsVoices,
};

const openaiProvider: VoiceProvider = {
  textToSpeech: async (text, voice) => {
    if (typeof voice !== 'string' || !['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voice)) {
      throw new Error('OpenAI TTS requires a valid voice name (alloy, echo, fable, onyx, nova, shimmer)');
    }
    const blob = await openaiTTS.openaiTextToSpeech(text, { voice: voice as OpenAIVoiceName });
    if (!blob) {
      throw new Error('Failed to generate speech');
    }
    return await blob.arrayBuffer();
  },
};

export const getVoiceProvider = (providerType: VoiceProviderType): VoiceProvider => {
  switch (providerType) {
    case 'elevenlabs':
      return elevenLabsProvider;
    case 'openai':
      return openaiProvider;
    default:
      throw new Error(`Unknown voice provider: ${providerType}`);
  }
};

export const getAllVoices = async (): Promise<Voice[]> => {
  const voices: Voice[] = [];
  
  // ElevenLabs voices
  try {
    const elevenLabsVoices = await elevenLabs.getElevenLabsVoices();
    elevenLabsVoices.forEach((voice: any) => {
      voices.push({
        id: voice.voice_id,
        name: voice.name,
        provider: 'elevenlabs',
        voiceId: voice.voice_id,
        description: voice.description,
      });
    });
  } catch (error) {
    console.warn('Failed to load ElevenLabs voices:', error);
  }
  
  // OpenAI voices
  try {
    const openaiVoices = await openaiTTS.getOpenAIVoices();
    openaiVoices.forEach((voice: any) => {
      voices.push({
        id: `openai-${voice.id}`,
        name: voice.name,
        provider: 'openai',
        voiceId: voice.id,
        description: voice.description,
      });
    });
  } catch (error) {
    console.warn('Failed to load OpenAI voices:', error);
  }
  
  return voices;
};

export const generateSpeech = async (options: {
  text: string;
  provider: VoiceProviderType;
  voiceId: string;
  stability?: number;
  similarity_boost?: number;
  speed?: number;
  modelId?: string;
}): Promise<Blob | null> => {
  const { text, provider, voiceId, modelId } = options;
  const voiceProvider = getVoiceProvider(provider);
  
  try {
    const audioBuffer = await voiceProvider.textToSpeech(text, voiceId, modelId);
    return new Blob([audioBuffer], { type: 'audio/mpeg' });
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};

export const playAudio = (audioUrl: string): void => {
  const audio = new Audio(audioUrl);
  audio.play().catch(error => {
    console.error('Error playing audio:', error);
  });
};

export const testVoice = async (options: {
  text: string;
  provider: VoiceProviderType;
  voiceId: string;
}): Promise<{ audioUrl: string; duration: number }> => {
  try {
    const audioBlob = await generateSpeech({
      text: options.text,
      provider: options.provider,
      voiceId: options.voiceId,
    });
    
    if (!audioBlob) {
      throw new Error('Failed to generate audio');
    }
    
    const audioUrl = URL.createObjectURL(audioBlob);
    const duration = audioBlob.size / 1000; // Approximate
    
    return { audioUrl, duration };
  } catch (error) {
    console.error('Error testing voice:', error);
    throw error;
  }
};
