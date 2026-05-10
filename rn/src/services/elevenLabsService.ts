import { Audio } from 'expo-av';
import { config } from '../config';

const BASE_URL = 'https://api.elevenlabs.io/v1';

export const elevenLabsService = {
  async playPanicAlert(language = 'English'): Promise<Audio.Sound | null> {
    const text = language === 'Spanish'
      ? 'AYUDA. MIGRA. Estoy en peligro. Por favor llama a mis contactos de emergencia ahora.'
      : 'HELP. ICE. I am in danger. Please call my emergency contacts now.';

    if (!config.elevenLabsApiKey) {
      console.warn('[elevenLabsService] No API key — skipping voice alert');
      return null;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const res = await fetch(`${BASE_URL}/text-to-speech/${config.elevenLabsVoiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': config.elevenLabsApiKey,
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
