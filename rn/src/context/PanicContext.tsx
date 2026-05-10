import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { elevenLabsService } from '../services/elevenLabsService';
import { backboardService } from '../services/backboardService';
import { solanaService } from '../services/solanaService';
import { geminiService } from '../services/geminiService';
import { api } from '../utils/apiClient';
import { useAuth } from './AuthContext';

const TIMER_START = 135;

interface PanicState {
  isActive: boolean;
  contactsNotified: number;
  incidentId: string;
  timer: number;
  triggeredAt: Date | null;
  rightsReminder: string;
}

export interface PanicContextValue extends PanicState {
  triggerPanic: () => Promise<string>;
  disarmPanic: (safePhrase: string) => Promise<boolean>;
  checkIn: () => void;
}

export const PanicContext = createContext<PanicContextValue | null>(null);

export const PanicProvider = ({ children }: { children: ReactNode }) => {
  const { user, safePhrase: storedPhrase } = useAuth();

  const [state, setState] = useState<PanicState>({
    isActive: false,
    contactsNotified: 0,
    incidentId: '',
    timer: 0,
    triggeredAt: null,
    rightsReminder: '',
  });

  const soundRef = useRef<{ stopAsync: () => Promise<void>; unloadAsync: () => Promise<void> } | null>(null);
  const incidentIdRef = useRef('');

  useEffect(() => {
    if (!state.isActive) return;
    const id = setInterval(() => {
      setState((prev) => ({ ...prev, timer: Math.max(0, prev.timer - 1) }));
    }, 1000);
    return () => clearInterval(id);
  }, [state.isActive]);

  const triggerPanic = useCallback(async (): Promise<string> => {
    const now = new Date();

    let latitude: number | undefined;
    let longitude: number | undefined;
    let address: string | undefined;

    if (Platform.OS !== 'web') {
      try {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        }
      } catch (e) {
        console.warn('[PanicContext] Location unavailable:', e);
      }
    } else {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        console.warn('[PanicContext] Browser geolocation unavailable');
      }
    }

    setState({
      isActive: true,
      contactsNotified: 0,
      incidentId: 'TRIGGERING...',
      timer: TIMER_START,
      triggeredAt: now,
      rightsReminder: '',
    });

    try {
      const result = await api.post<{
        incidentId: string;
        contactsNotified: { contactName: string }[];
        sentCount: number;
        audioBase64?: string;
      }>('/panic/trigger', { latitude, longitude, address });

      const newIncidentId = result.incidentId;
      incidentIdRef.current = newIncidentId;

      setState((prev) => ({
        ...prev,
        incidentId: newIncidentId,
        contactsNotified: result.sentCount ?? result.contactsNotified?.length ?? 0,
      }));

      elevenLabsService.playPanicAlert().then((sound) => {
        soundRef.current = sound;
      }).catch((e) => console.warn('[PanicContext] ElevenLabs failed:', e));

      backboardService.saveIncidentMemory({
        incidentId: newIncidentId,
        outcome: 'active',
        date: now.toISOString(),
        notes: latitude ? `Location: ${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : undefined,
      }).catch(() => {});

      console.log('[PanicContext] Solana memo:', solanaService.buildIncidentMemo({
        incidentId: newIncidentId,
        userId: user?.email ?? 'unknown',
        timestamp: now.toISOString(),
        status: 'active',
      }));

      geminiService.getRightsReminder('English').then((reminder) => {
        setState((prev) => ({ ...prev, rightsReminder: reminder }));
      }).catch(() => {});

      console.log('PANIC TRIGGERED:', { incidentId: newIncidentId });
      return newIncidentId;
    } catch (e) {
      console.error('[PanicContext] Trigger API failed:', e);
      const fallbackId = `INC-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      incidentIdRef.current = fallbackId;
      setState((prev) => ({ ...prev, incidentId: fallbackId }));
      return fallbackId;
    }
  }, [user]);

  const disarmPanic = useCallback(async (safePhrase: string): Promise<boolean> => {
    if (!safePhrase.trim()) return false;

    const localPhrase = storedPhrase;
    if (localPhrase && safePhrase.trim().toLowerCase() !== localPhrase.toLowerCase()) {
      console.warn('[PanicContext] Incorrect safe phrase');
      return false;
    }

    if (soundRef.current) {
      await elevenLabsService.stopAlert(soundRef.current);
      soundRef.current = null;
    }

    const incidentId = incidentIdRef.current;
    const now = new Date();

    try {
      await api.post('/panic/disarm', { incidentId, safePhrase: safePhrase.trim() });
    } catch (e) {
      console.warn('[PanicContext] Disarm API call failed (proceeding locally):', e);
    }

    backboardService.saveIncidentMemory({
      incidentId,
      outcome: 'disarmed — person is safe',
      date: now.toISOString(),
    }).catch(() => {});

    console.log('[PanicContext] Solana disarm memo:', solanaService.buildIncidentMemo({
      incidentId,
      userId: user?.email ?? 'unknown',
      timestamp: now.toISOString(),
      status: 'disarmed',
    }));

    setState({
      isActive: false,
      contactsNotified: 0,
      incidentId: '',
      timer: 0,
      triggeredAt: null,
      rightsReminder: '',
    });

    console.log('Panic disarmed');
    return true;
  }, [user, storedPhrase]);

  const checkIn = useCallback(() => {
    setState((prev) => ({ ...prev, timer: TIMER_START }));
    api.post('/checkin/checkin', {}).catch(() => {});
    console.log('Check-in recorded');
  }, []);

  return (
    <PanicContext.Provider value={{ ...state, triggerPanic, disarmPanic, checkIn }}>
      {children}
    </PanicContext.Provider>
  );
};

export const usePanicContext = (): PanicContextValue => {
  const ctx = useContext(PanicContext);
  if (!ctx) throw new Error('usePanicContext must be used within <PanicProvider>');
  return ctx;
};
