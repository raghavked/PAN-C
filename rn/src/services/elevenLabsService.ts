import { Platform } from 'react-native';
import { config } from '../config';

const BASE_URL = 'https://api.elevenlabs.io/v1';

type SoundHandle = { stopAsync: () => Promise<void>; unloadAsync: () => Promise<void> };

// ─── Single-play guard ────────────────────────────────────────────────────────
// Prevents duplicate audio streams when the button is spammed
let _isPlaying = false;
let _currentHandle: SoundHandle | null = null;

// ─── Audio session pre-init ───────────────────────────────────────────────────
// Called once at app startup so iOS audio session is ready before the first press
let _audioSessionReady = false;
export async function initAudioSession(): Promise<void> {
  if (Platform.OS === 'web' || _audioSessionReady) return;
  try {
    const { Audio } = await import('expo-av');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,        // Override iOS silent/ringer switch
      staysActiveInBackground: true,     // Keep playing when app is backgrounded
      shouldDuckAndroid: false,          // Don't lower volume for other apps
      playThroughEarpieceAndroid: false, // Use speaker, not earpiece
    });
    _audioSessionReady = true;
    console.log('[elevenLabsService] Audio session pre-initialized');
  } catch (e) {
    console.warn('[elevenLabsService] Audio session pre-init failed:', e);
  }
}

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

  // Re-apply audio mode (belt-and-suspenders in case session was reset)
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,        // Override iOS silent/ringer switch
    staysActiveInBackground: true,     // Keep playing when backgrounded
    shouldDuckAndroid: false,          // Don't duck other audio
    playThroughEarpieceAndroid: false, // Use loudspeaker
  });

  // ── Step 1: Play local siren IMMEDIATELY (zero network delay) ─────────────
  let sirenSound: SoundHandle | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const alertAsset = require('../../assets/alert.wav');
    const { sound: siren } = await Audio.Sound.createAsync(
      alertAsset,
      { shouldPlay: true, isLooping: true, volume: 1.0, isMuted: false }
    );
    await siren.setVolumeAsync(1.0);
    sirenSound = siren;
    _currentHandle = siren; // Update global so disarm works during TTS fetch
    console.log('[elevenLabsService] Local siren started immediately');
  } catch (e) {
    console.warn('[elevenLabsService] Local siren failed, proceeding to TTS:', e);
  }

  // ── Step 2: Fetch ElevenLabs TTS in background, then swap ─────────────
  if (!config.elevenLabsApiKey) {
    // No API key — keep siren looping indefinitely
    return sirenSound;
  }

  try {
    const base64 = await fetchAudioBase64(text);
    const uri = `data:audio/mpeg;base64,${base64}`;

    // Stop the siren before starting TTS
    if (sirenSound) {
      try { await sirenSound.stopAsync(); await sirenSound.unloadAsync(); } catch {}
      sirenSound = null;
    }

    // If audio was stopped while fetching (user disarmed), bail out
    if (!_isPlaying) return null;

    const { sound: tts } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, isLooping: true, volume: 1.0, isMuted: false }
    );
    await tts.setVolumeAsync(1.0);
    _currentHandle = tts;
    console.log('[elevenLabsService] Swapped to ElevenLabs TTS');
    return tts;
  } catch (err) {
    console.error('[elevenLabsService] TTS fetch failed, keeping siren:', err);
    return sirenSound; // Fall back to siren if TTS fails
  }
}

export const elevenLabsService = {
  /**
   * Play the panic alert audio.
   * - Spam-safe: if already playing/loading, returns the existing handle immediately.
   * - Native: plays local siren instantly, then swaps to ElevenLabs TTS when loaded.
   * - Overrides iOS silent switch and Android audio focus.
   */
  async playPanicAlert(language = 'English'): Promise<SoundHandle | null> {
    // ── Spam guard: only one audio stream at a time ────────────────────────
    if (_isPlaying) {
      console.log('[elevenLabsService] Already playing — ignoring duplicate call');
      return _currentHandle;
    }
    _isPlaying = true;
    _currentHandle = null;

    const text =
      language === 'Spanish'
        ? 'AYUDA. MIGRA. Estoy en peligro. Por favor llama a mis contactos de emergencia ahora.'
        : 'HELP. ICE. I am in danger. Please call my emergency contacts now.';

    try {
      let handle: SoundHandle | null;
      if (Platform.OS === 'web') {
        handle = await playWeb(text);
      } else {
        handle = await playNative(text);
      }
      _currentHandle = handle;
      return handle;
    } catch (err) {
      console.error('[elevenLabsService] Failed to play alert:', err);
      _isPlaying = false;
      _currentHandle = null;
      return null;
    }
  },

  /**
   * Stop and unload the current alert audio.
   * Resets the single-play guard so the next panic can play fresh.
   */
  async stopAlert(sound?: SoundHandle | null): Promise<void> {
    _isPlaying = false;
    const target = sound ?? _currentHandle;
    _currentHandle = null;
    if (!target) return;
    try {
      await target.stopAsync();
      await target.unloadAsync();
    } catch (e) {
      console.warn('[elevenLabsService] Error stopping sound:', e);
    }
  },

  /** Expose guard state for debugging */
  get isPlaying() { return _isPlaying; },
};
