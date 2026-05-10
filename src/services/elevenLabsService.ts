/**
 * elevenLabsService.ts
 * ElevenLabs Text-to-Speech — generates the "HELP — ICE / MIGRA" audio alert
 * and any other spoken emergency messages.
 *
 * Required secrets (Replit → Secrets):
 *   VITE_ELEVENLABS_API_KEY     — from elevenlabs.io → Profile → API Keys
 *   VITE_ELEVENLABS_VOICE_ID    — Voice ID to use (default: "Rachel" = 21m00Tcm4TlvDq8ikWAM)
 */

const API_KEY  = import.meta.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const BASE_URL = 'https://api.elevenlabs.io/v1';

export interface TTSOptions {
  text: string;
  voiceId?: string;
  stability?: number;       // 0–1, default 0.5
  similarityBoost?: number; // 0–1, default 0.75
  modelId?: string;         // default 'eleven_monolingual_v1'
}

export const elevenLabsService = {
  /**
   * Convert text to speech and return an audio Blob URL.
   * Play it with: new Audio(url).play()
   */
  async speak(options: TTSOptions): Promise<string> {
    const {
      text,
      voiceId = VOICE_ID,
      stability = 0.5,
      similarityBoost = 0.75,
      modelId = 'eleven_monolingual_v1',
    } = options;

    if (!API_KEY) {
      console.warn('[elevenLabsService] Missing VITE_ELEVENLABS_API_KEY — falling back to Web Audio beep');
      return '';
    }

    const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    });

    if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status}`);

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  /**
   * Play the panic alert audio — "HELP — ICE / MIGRA"
   * Returns the Audio element so the caller can stop it later.
   */
  async playPanicAlert(): Promise<HTMLAudioElement | null> {
    try {
      // Unlock browser autoplay immediately (must happen synchronously near the user gesture)
      const unlock = new Audio();
      unlock.play().catch(() => {});

      const url = await elevenLabsService.speak({
        text: 'Help! ICE. Migra. I need help. Please call my emergency contacts.',
        stability: 0.3,
        similarityBoost: 0.9,
      });

      if (!url) return null;

      const audio = new Audio(url);
      audio.loop = true;
      await audio.play();
      return audio;
    } catch (err) {
      console.error('[elevenLabsService] playPanicAlert error:', err);
      return null;
    }
  },

  /**
   * List available voices from your ElevenLabs account.
   */
  async getVoices() {
    if (!API_KEY) return [];

    const res = await fetch(`${BASE_URL}/voices`, {
      headers: { 'xi-api-key': API_KEY },
    });

    if (!res.ok) throw new Error(`ElevenLabs getVoices failed: ${res.status}`);
    const data = await res.json();
    return data.voices ?? [];
  },
};
