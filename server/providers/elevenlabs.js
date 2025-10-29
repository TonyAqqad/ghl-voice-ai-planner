/**
 * ElevenLabs Provider Service
 * Handles voice synthesis and voice management
 */

const axios = require('axios');

class ElevenLabsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  /**
   * Get authenticated headers
   */
  getHeaders() {
    return {
      'xi-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get available voices
   */
  async getVoices() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/voices`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data.voices;
    } catch (error) {
      console.error('ElevenLabs getVoices error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get voice details
   */
  async getVoice(voiceId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/voices/${voiceId}`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs getVoice error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(text, voiceId, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: options.modelId || 'eleven_monolingual_v1',
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.5,
            style: options.style || 0.0,
            use_speaker_boost: options.useSpeakerBoost || true
          }
        },
        {
          headers: this.getHeaders(),
          responseType: 'arraybuffer'
        }
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs generateSpeech error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user subscription info
   */
  async getUserSubscription() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/user/subscription`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs getUserSubscription error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  async getUsage() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/user/usage`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs getUsage error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Clone voice from audio sample
   */
  async cloneVoice(name, description, files) {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await axios.post(
        `${this.baseUrl}/voices/add`,
        formData,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs cloneVoice error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete cloned voice
   */
  async deleteVoice(voiceId) {
    try {
      await axios.delete(
        `${this.baseUrl}/voices/${voiceId}`,
        {
          headers: this.getHeaders()
        }
      );

      return { success: true };
    } catch (error) {
      console.error('ElevenLabs deleteVoice error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get voice settings
   */
  async getVoiceSettings(voiceId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/voices/${voiceId}/settings`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs getVoiceSettings error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update voice settings
   */
  async updateVoiceSettings(voiceId, settings) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voices/${voiceId}/settings`,
        settings,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs updateVoiceSettings error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get available models
   */
  async getModels() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/models`,
        {
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs getModels error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Estimate cost for text-to-speech
   */
  estimateCost(text, modelId = 'eleven_monolingual_v1') {
    // Rough estimation based on character count
    const characterCount = text.length;
    const costPerCharacter = 0.0003; // Approximate cost per character
    return characterCount * costPerCharacter;
  }
}

module.exports = ElevenLabsProvider;
