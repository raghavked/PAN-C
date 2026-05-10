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
import { mongoService } from '../services/mongoService';
import { backboardService } from '../services/backboardService';
import { solanaService } from '../services/solanaService';
import { twilioService } from '../services/twilioService';
import { geminiService } from '../services/geminiService';

const MOCK_CONTACTS = [
  { name: 'Maria Garcia',   phone: '+15551234567', email: 'maria@example.com' },
  { name: 'Carlos Lopez',   phone: '+15559876543', email: 'carlos@example.com' },
  { name: 'Ana Rodriguez',  phone: '+15554567890', email: 'ana@example.com' },
  { name: 'RAICES Hotline', phone: '+18885877777', email: 'legal@raices.org' },
];

const TIMER_START = 135;

const generateIncidentId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const p1 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `INC-${p1}-${p2}`;
};

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
    const newIncidentId = generateIncidentId();
    incidentIdRef.current = newIncidentId;
    const now = new Date();

    setState({
      isActive: true,
      contactsNotified: MOCK_CONTACTS.length,
      incidentId: newIncidentId,
      timer: TIMER_START,
      triggeredAt: now,
      rightsReminder: '',
    });

    // Capture location — native only
    let location: { lat: number; lng: number } | undefined;
    if (Platform.OS !== 'web') {
      try {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
      } catch (e) {
        console.warn('[PanicContext] Location unavailable:', e);
      }
    } else {
      // Web: use browser Geolocation API
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {
        console.warn('[PanicContext] Browser geolocation unavailable');
      }
    }

    // Play voice alert (native only — guarded inside service)
    elevenLabsService.playPanicAlert().then((sound) => {
      soundRef.current = sound;
    }).catch((e) => console.warn('[PanicContext] ElevenLabs failed:', e));

    // Log to MongoDB
    mongoService.createIncident({
      incidentId: newIncidentId,
      userId: 'user-alex-001',
      timestamp: now.toISOString(),
      location,
      status: 'active',
      contactsNotified: MOCK_CONTACTS.length,
    }).catch((e) => console.warn('[PanicContext] MongoDB log failed:', e));

    // Save to Backboard memory
    backboardService.saveIncidentMemory({
      incidentId: newIncidentId,
      outcome: 'active',
      date: now.toISOString(),
      notes: location ? `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : undefined,
    }).catch((e) => console.warn('[PanicContext] Backboard failed:', e));

    // Log Solana memo
    console.log('[PanicContext] Solana memo:', solanaService.buildIncidentMemo({
      incidentId: newIncidentId,
      userId: 'hashed-user-001',
      timestamp: now.toISOString(),
      status: 'active',
    }));

    // Send SMS alerts
    twilioService.sendPanicAlerts({
      contacts: MOCK_CONTACTS,
      incidentId: newIncidentId,
      userName: 'Alex',
      location,
    }).catch((e) => console.warn('[PanicContext] Twilio SMS failed:', e));

    // Fetch Gemini rights reminder
    geminiService.getRightsReminder('English').then((reminder) => {
      setState((prev) => ({ ...prev, rightsReminder: reminder }));
    }).catch((e) => console.warn('[PanicContext] Gemini failed:', e));

    console.log('🚨 PANIC TRIGGERED:', { incidentId: newIncidentId, timestamp: now.toISOString() });
    return newIncidentId;
  }, []);

  const disarmPanic = useCallback(async (safePhrase: string): Promise<boolean> => {
    if (!safePhrase.trim()) return false;

    if (soundRef.current) {
      await elevenLabsService.stopAlert(soundRef.current);
      soundRef.current = null;
    }

    const incidentId = incidentIdRef.current;
    const now = new Date();

    mongoService.updateIncident(incidentId, {
      status: 'disarmed',
      disarmedAt: now.toISOString(),
    }).catch((e) => console.warn('[PanicContext] MongoDB disarm failed:', e));

    backboardService.saveIncidentMemory({
      incidentId,
      outcome: 'disarmed — person is safe',
      date: now.toISOString(),
    }).catch((e) => console.warn('[PanicContext] Backboard disarm failed:', e));

    twilioService.sendAllClearAlerts({
      contacts: MOCK_CONTACTS,
      incidentId,
      userName: 'Alex',
    }).catch((e) => console.warn('[PanicContext] Twilio all-clear failed:', e));

    console.log('[PanicContext] Solana disarm memo:', solanaService.buildIncidentMemo({
      incidentId,
      userId: 'hashed-user-001',
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

    console.log('✅ Panic disarmed');
    return true;
  }, []);

  const checkIn = useCallback(() => {
    setState((prev) => ({ ...prev, timer: TIMER_START }));
    twilioService.sendCheckInAlert({
      contacts: MOCK_CONTACTS,
      userName: 'Alex',
      incidentId: incidentIdRef.current,
    }).catch((e) => console.warn('[PanicContext] Twilio check-in failed:', e));
    console.log('✅ Check-in recorded');
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
