import React, { useState, useEffect } from 'react';
import { Mic, Play, Volume2, Loader2, CheckCircle, XCircle, Settings } from 'lucide-react';
import { getAllVoices, generateSpeech, playAudio, Voice } from '../../utils/voiceProviders';
import { toast } from 'react-hot-toast';

const VoiceTestingStudio: React.FC = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<'elevenlabs' | 'openai'>('elevenlabs');
  const [testText, setTestText] = useState('Hello! This is a test of the voice AI system. How does this sound to you?');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const allVoices = await getAllVoices();
      setVoices(allVoices);
      
      // Set default voice
      if (allVoices.length > 0) {
        setSelectedVoice(allVoices[0].id);
        setSelectedProvider(allVoices[0].provider);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
      toast.error('Failed to load voices');
    }
  };

  const handleTest = async () => {
    if (!selectedVoice || !testText.trim()) {
      toast.error('Please select a voice and enter test text');
      return;
    }

    setIsGenerating(true);
    
    try {
      const voice = voices.find(v => v.id === selectedVoice);
      if (!voice) return;

      const audioBlob = await generateSpeech({
        text: testText,
        provider: voice.provider,
        voiceId: voice.voiceId || voice.id,
        stability: 0.5,
        similarity_boost: 0.75,
        speed: 1.0
      });

      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        toast.success('Audio generated successfully!');
        
        // Add to test results
        setTestResults(prev => [{
          id: Date.now(),
          voice: voice.name,
          provider: voice.provider,
          text: testText,
          timestamp: new Date().toISOString()
        }, ...prev]);
      }
    } catch (error: any) {
      toast.error(`Failed to generate audio: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = () => {
    if (audioUrl) {
      playAudio(audioUrl);
    }
  };

  const selectedVoiceData = voices.find(v => v.id === selectedVoice);

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Voice Testing Studio</h1>
            <p className="text-muted-foreground">
              Test and preview voices before deploying
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          
          {/* Provider Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Voice Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value as 'elevenlabs' | 'openai');
                // Update voice selection to first voice of provider
                const providerVoices = voices.filter(v => v.provider === e.target.value);
                if (providerVoices.length > 0) {
                  setSelectedVoice(providerVoices[0].id);
                }
              }}
              className="w-full px-4 py-2 border rounded bg-background"
            >
              <option value="elevenlabs">ElevenLabs</option>
              <option value="openai">OpenAI TTS</option>
            </select>
          </div>

          {/* Voice Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Voice</label>
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                const voice = voices.find(v => v.id === e.target.value);
                if (voice) setSelectedProvider(voice.provider);
              }}
              className="w-full px-4 py-2 border rounded bg-background"
            >
              {voices.filter(v => v.provider === selectedProvider).map(voice => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} ({voice.provider})
                </option>
              ))}
            </select>
            {selectedVoiceData && (
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedVoiceData.description || 'No description available'}
              </p>
            )}
          </div>

          {/* Test Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Test Text</label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={5}
              className="w-full px-4 py-2 border rounded bg-background"
              placeholder="Enter text to test..."
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleTest}
            disabled={isGenerating || !selectedVoice || !testText.trim()}
            className="w-full btn btn-primary flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Generate & Test
              </>
            )}
          </button>

          {/* Audio Player */}
          {audioUrl && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlay}
                  className="btn btn-primary flex items-center"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play Audio
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Audio Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test History */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Test History</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tests yet</p>
                <p className="text-sm">Generate audio to see history</p>
              </div>
            ) : (
              testResults.map((result) => (
                <div key={result.id} className="p-4 border rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">{result.voice}</div>
                      <div className="text-sm text-muted-foreground">{result.provider}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {result.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Test Templates */}
      <div className="card p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Quick Test Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Greeting', text: 'Hello! Welcome to our Voice AI platform. How can I help you today?' },
            { name: 'Sales Pitch', text: 'Thank you for your interest! I\'d love to tell you about our amazing product that can transform your business.' },
            { name: 'Support', text: 'I\'m here to help you with any questions or concerns. Let\'s find the best solution for you.' }
          ].map((template, index) => (
            <button
              key={index}
              onClick={() => setTestText(template.text)}
              className="p-4 border rounded hover:border-primary transition text-left"
            >
              <div className="font-semibold mb-1">{template.name}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {template.text}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceTestingStudio;

