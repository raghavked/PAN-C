import { useState, useCallback, useRef } from 'react';

interface PanicState {
  isActive: boolean;
  contactsNotified: number;
  incidentId: string;
  timer: number;
  triggeredAt: Date | null;
}

interface UsePanicReturn extends PanicState {
  triggerPanic: () => Promise<string>;
  disarmPanic: (safePhrase: string) => Promise<boolean>;
  checkIn: () => void;
}

export const usePanic = (): UsePanicReturn => {
  const [panicState, setPanicState] = useState<PanicState>({
    isActive: false,
    contactsNotified: 0,
    incidentId: '',
    timer: 0,
    triggeredAt: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateIncidentId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part1 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `INC-${part1}-${part2}`;
  };

  const triggerPanic = useCallback(async (): Promise<string> => {
    const newIncidentId = generateIncidentId();

    // Update panic state
    setPanicState({
      isActive: true,
      contactsNotified: 4,
      incidentId: newIncidentId,
      timer: 135,
      triggeredAt: new Date(),
    });

    // Attempt to play audio alert using Web Audio API
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const playBeep = (freq: number, startTime: number, duration: number) => {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          oscillator.frequency.setValueAtTime(freq, startTime);
          gainNode.gain.setValueAtTime(0.3, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };
        // Play SOS pattern: 3 short, 3 long, 3 short
        const now = ctx.currentTime;
        [0, 0.3, 0.6].forEach((t) => playBeep(880, now + t, 0.2));
        [1.0, 1.5, 2.0].forEach((t) => playBeep(440, now + t, 0.4));
        [2.6, 2.9, 3.2].forEach((t) => playBeep(880, now + t, 0.2));
      }
    } catch (err) {
      console.warn('Audio playback not available:', err);
    }

    // Attempt geolocation capture
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('📍 Location captured:', position.coords.latitude, position.coords.longitude);
          // TODO: Send to panicService.triggerPanic()
        },
        (err) => {
          console.warn('Location unavailable:', err.message);
        }
      );
    }

    // Log to console (API stub)
    console.log('🚨 PANIC TRIGGERED:', {
      incidentId: newIncidentId,
      timestamp: new Date().toISOString(),
      contactsNotified: 4,
    });

    return newIncidentId;
  }, []);

  const disarmPanic = useCallback(async (safePhrase: string): Promise<boolean> => {
    // In production: verify against API
    // For MVP: accept 'test' or any non-empty phrase
    if (safePhrase.trim().length > 0) {
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setPanicState({
        isActive: false,
        contactsNotified: 0,
        incidentId: '',
        timer: 0,
        triggeredAt: null,
      });

      console.log('✅ Panic disarmed with phrase:', safePhrase);
      return true;
    }

    console.log('❌ Empty safe phrase — disarm rejected');
    return false;
  }, []);

  const checkIn = useCallback(() => {
    setPanicState((prev) => ({
      ...prev,
      timer: 135, // Reset timer on check-in
    }));
    console.log('✅ Check-in recorded');
  }, []);

  return {
    ...panicState,
    triggerPanic,
    disarmPanic,
    checkIn,
  };
};
