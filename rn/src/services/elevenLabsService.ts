import { Platform } from 'react-native';
import { config } from '../config';

const BASE_URL = 'https://api.elevenlabs.io/v1';

type SoundHandle = { stopAsync: () => Promise<void>; unloadAsync: () => Promise<void> };

async function fetchAudioBase64(text: string): Promise<string> {
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

  if (!res.ok) throw new Error(`ElevenLabs API error: ${res.status} ${await res.text()}`);

  const arrayBuffer = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function playWeb(text: string): Promise<SoundHandle | null> {
  // Unlock audio context immediately on user gesture
  const unlock = new (window as any).Audio();
  unlock.play().catch(() => {});

  const base64 = await fetchAudioBase64(text);
  const uri = `data:audio/mpeg;base64,${base64}`;
  const audio = new (window as any).Audio(uri) as HTMLAudioElement;
  audio.loop = true;
  audio.volume = 1.0;
  await audio.play();

  return {
    stopAsync: async () => { audio.pause(); audio.currentTime = 0; },
    unloadAsync: async () => { audio.src = ''; },
  };
}

async function playNative(text: string): Promise<SoundHandle | null> {
  const { Audio } = await import('expo-av');

  // Configure audio session FIRST — before loading any audio
  // playsInSilentModeIOS: true overrides the ringer/silent switch on iOS
  // staysActiveInBackground: true keeps audio alive when app is backgrounded
  // interruptionModeIOS: DO_NOT_MIX ensures we take over from other audio
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });

  const base64 = await fetchAudioBase64(text);
  const uri = `data:audio/mpeg;base64,${base64}`;

  const { sound } = await Audio.Sound.createAsync(
    { uri },
    {
      shouldPlay: true,
      isLooping: true,
      volume: 1.0,        // Maximum volume on the sound object
      isMuted: false,
    }
  );

  // Explicitly set volume to 1.0 after creation as well (belt-and-suspenders)
  await sound.setVolumeAsync(1.0);

  return sound;
}

export const elevenLabsService = {
  async playPanicAlert(language = 'English'): Promise<SoundHandle | null> {
    if (!config.elevenLabsApiKey) {
      console.warn('[elevenLabsService] No API key — skipping voice alert');
      return null;
    }

    const text =
      language === 'Spanish'
        ? 'AYUDA. MIGRA. Estoy en peligro. Por favor llama a mis contactos de emergencia ahora.'
        : 'HELP. ICE. I am in danger. Please call my emergency contacts now.';

    try {
      if (Platform.OS === 'web') {
        return await playWeb(text);
      } else {
        return await playNative(text);
      }
    } catch (err) {
      console.error('[elevenLabsService] Failed to play alert:', err);
      return null;
    }
  },

  async stopAlert(sound: SoundHandle | null): Promise<void> {
    if (!sound) return;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (e) {
      console.warn('[elevenLabsService] Error stopping sound:', e);
    }
  },
};
