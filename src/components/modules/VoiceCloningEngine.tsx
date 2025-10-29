import React, { useState } from 'react';
import { Mic, Upload, Play, Download, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

const VoiceCloningEngine: React.FC = () => {
  const [voices, setVoices] = useState([
    { id: '1', name: 'Professional Male', samples: 5, status: 'ready' },
    { id: '2', name: 'Friendly Female', samples: 3, status: 'training' },
  ]);

  const handleUpload = () => {
    toast.success('Upload audio samples to clone voice');
  };

  const handleClone = (voiceId: string) => {
    toast.success('Voice cloning started');
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Voice Cloning Engine</h1>
            <p className="text-muted-foreground">Create custom voice models for your agents</p>
          </div>
          <button onClick={handleUpload} className="btn btn-primary">
            <Upload className="w-4 h-4 mr-2" />Upload Samples
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {voices.map(voice => (
          <div key={voice.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{voice.name}</h3>
                <p className="text-sm text-muted-foreground">{voice.samples} audio samples</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                voice.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {voice.status}
              </span>
            </div>
            <div className="flex space-x-2">
              <button className="btn btn-outline flex-1 btn-sm">
                <Play className="w-4 h-4 mr-1" />Test
              </button>
              {voice.status === 'ready' && (
                <button className="btn btn-primary flex-1 btn-sm">
                  <Download className="w-4 h-4 mr-1" />Use
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Requirements</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Upload at least 5 clear audio samples (10-30 seconds each)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>High quality audio with minimal background noise</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Voice should be consistent across all samples</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Training typically takes 15-30 minutes</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceCloningEngine;
