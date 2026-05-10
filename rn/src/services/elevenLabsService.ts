/**
 * elevenLabsService.ts (React Native / Expo version)
 * ElevenLabs Text-to-Speech — plays AI voice panic alert via expo-av
 *
 * Required env vars (add to .env or Expo EAS secrets):
 *   EXPO_PUBLIC_ELEVENLABS_API_KEY
 *   EXPO_PUBLIC_ELEVENLABS_VOICE_ID  (default: Rachel = 21m00Tcm4TlvDq8ikWAM)
 */

import { Audio } from 'expo-av';

const API_KEY  = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
const VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const BASE_URL = 'https://api.elevenlabs.io/v1';

export const elevenLabsService = {
  async playPanicAlert(language = 'English'): Promise<Audio.Sound | null> {
    const text = language === 'Spanish'
      ? 'AYUDA. MIGRA. Estoy en peligro. Por favor llama a mis contactos de emergencia ahora.'
      : 'HELP. ICE. I am in danger. Please call my emergency contacts now.';

    if (!API_KEY) {
      console.warn('[elevenLabsService] No API key — skipping voice alert');
      return null;
    }

    try {
      // expo-av v15 compatible AudioMode (removed shouldDuckAndroid, playThroughEarpieceAndroid)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const res = await fetch(`${BASE_URL}/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.3, similarity_boost: 0.9 },
        }),
      });

      if (!res.ok) throw new Error(`ElevenLabs API error: ${res.status}`);

      // Convert response to base64 data URI for expo-av
      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const uri = `data:audio/mpeg;base64,${base64}`;

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      return sound;
    } catch (err) {
      console.error('[elevenLabsService] Failed to play alert:', err);
      return null;
    }
  },

  async stopAlert(sound: Audio.Sound | null): Promise<void> {
    if (!sound) return;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (e) {
      console.warn('[elevenLabsService] Error stopping sound:', e);
    }
  },
};
