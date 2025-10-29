/**
 * Voice Testing & Preview Utility
 * Test and preview voices before deploying
 */

import { generateSpeech, VoiceOption, getAllVoices } from './voiceProviders';
import { toast } from 'react-hot-toast';

export interface VoiceTestResult {
  provider: string;
  voiceId: string;
  voiceName: string;
  audioUrl: string;
  duration: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  feedback: string;
}

/**
 * Test a voice with sample text
 */
export async function testVoice(
  provider: 'elevenlabs' | 'openai',
  voiceId: string,
  text: string = 'Hello! This is a test of the voice AI system. How does this sound?'
): Promise<VoiceTestResult | null> {
  try {
    const startTime = Date.now();
    
    const audioBlob = await generateSpeech({
      text,
      provider,
      voiceId
    });
    
    if (!audioBlob) {
      toast.error('Failed to generate test audio');
      return null;
    }
    
    const audioUrl = URL.createObjectURL(audioBlob);
    const duration = Date.now() - startTime;
    
    // Simulate quality assessment
    const quality = duration < 1000 ? 'excellent' : duration < 3000 ? 'good' : 'fair';
    
    // Get voice name
    const voices = await getAllVoices();
    const voice = voices.find(v => v.id === voiceId);
    const voiceName = voice?.name || voiceId;
    
    const result: VoiceTestResult = {
      provider,
      voiceId,
      voiceName,
      audioUrl,
      duration,
      quality,
      feedback: `Generated in ${duration}ms with ${quality} quality`
    };
    
    return result;
  } catch (error: any) {
    console.error('Voice test failed:', error);
    toast.error(`Voice test failed: ${error.message}`);
    return null;
  }
}

/**
 * Test multiple voices with the same text
 */
export async function compareVoices(
  providers: Array<{ provider: 'elevenlabs' | 'openai'; voiceId: string }>,
  text: string = 'Hello! How does this voice sound to you?'
): Promise<VoiceTestResult[]> {
  const results: VoiceTestResult[] = [];
  
  for (const config of providers) {
    const result = await testVoice(config.provider, config.voiceId, text);
    if (result) {
      results.push(result);
    }
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

/**
 * Play audio preview
 */
export function playAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Audio playback failed'));
    
    audio.play();
  });
}

/**
 * Stop all audio playback
 */
export function stopAllAudio() {
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

/**
 * Get recommended voice based on use case
 */
export function getRecommendedVoice(useCase: 'professional' | 'friendly' | 'energetic' | 'calm' | 'authoritative'): VoiceOption {
  const recommendations = {
    professional: { provider: 'elevenlabs' as const, voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
    friendly: { provider: 'openai' as const, voiceId: 'fable', name: 'Fable' },
    energetic: { provider: 'openai' as const, voiceId: 'nova', name: 'Nova' },
    calm: { provider: 'elevenlabs' as const, voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    authoritative: { provider: 'openai' as const, voiceId: 'onyx', name: 'Onyx' }
  };
  
  const rec = recommendations[useCase];
  return {
    id: rec.voiceId,
    name: rec.name,
    provider: rec.provider,
    voiceId: rec.voiceId,
    description: `Recommended for ${useCase} conversations`
  };
}

/**
 * Batch test multiple voices
 */
export async function batchTestVoices(
  testTexts: string[],
  voices: VoiceOption[]
): Promise<Map<string, VoiceTestResult[]>> {
  const results = new Map<string, VoiceTestResult[]>();
  
  for (const voice of voices) {
    const voiceResults: VoiceTestResult[] = [];
    
    for (const text of testTexts) {
      const result = await testVoice(voice.provider, voice.voiceId, text);
      if (result) {
        voiceResults.push(result);
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    results.set(voice.id, voiceResults);
  }
  
  return results;
}

