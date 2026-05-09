import { useState, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { mongoService } from '../services/mongoService';
import { elevenLabsService } from '../services/elevenLabsService';
import { backboardService } from '../services/backboardService';
import { geminiService } from '../services/geminiService';
import { solanaService } from '../services/solanaService';
import { twilioService } from '../services/twilioService';

interface PanicState {
  isActive: boolean;
  contactsNotified: number;
  incidentId: string;
  timer: number;
  triggeredAt: Date | null;
  rightsReminder: string;
}

interface UsePanicReturn extends PanicState {
  triggerPanic: () => Promise<string>;
  disarmPanic: (safePhrase: string) => Promise<boolean>;
  checkIn: () => void;
}

// Mock contacts — replace with real data from MongoDB contacts collection
const MOCK_CONTACTS = [
  { name: 'Maria Garcia',  phone: '+15551234567', email: 'maria@example.com' },
  { name: 'Carlos Lopez',  phone: '+15559876543', email: 'carlos@example.com' },
  { name: 'Ana Rodriguez', phone: '+15554567890', email: 'ana@example.com' },
  { name: 'RAICES Hotline', phone: '+18885877777', email: 'legal@raices.org' },
];

const generateIncidentId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const p1 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `INC-${p1}-${p2}`;
};

export const usePanic = (): UsePanicReturn => {
  const [panicState, setPanicState] = useState<PanicState>({
    isActive: false,
    contactsNotified: 0,
    incidentId: '',
    timer: 0,
    triggeredAt: null,
    rightsReminder: '',
  });

  const soundRef = useRef<Audio.Sound | null>(null);

  const triggerPanic = useCallback(async (): Promise<string> => {
    const newIncidentId = generateIncidentId();
    const now = new Date();

    // 1. Set local state immediately (fast UI response)
    setPanicState({
      isActive: true,
      contactsNotified: MOCK_CONTACTS.length,
      incidentId: newIncidentId,
      timer: 135,
      triggeredAt: now,
      rightsReminder: '',
    });

    // 2. Capture location via expo-location
    let location: { lat: number; lng: number } | undefined;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch (e) {
      console.warn('[usePanic] Location unavailable:', e);
    }

    // 3. Play ElevenLabs AI voice alert
    elevenLabsService.playPanicAlert().then((sound) => {
      soundRef.current = sound;
    }).catch((e) => console.warn('[usePanic] ElevenLabs failed:', e));

    // 4. Log incident to MongoDB
    mongoService.createIncident({
      incidentId: newIncidentId,
      userId: 'user-alex-001',
      timestamp: now.toISOString(),
      location,
      status: 'active',
      contactsNotified: MOCK_CONTACTS.length,
    }).catch((e) => console.warn('[usePanic] MongoDB log failed:', e));

    // 5. Save to Backboard long-term memory
    backboardService.saveIncidentMemory({
      incidentId: newIncidentId,
      outcome: 'active',
      date: now.toISOString(),
      notes: location ? `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : undefined,
    }).catch((e) => console.warn('[usePanic] Backboard memory failed:', e));

    // 6. Log to Solana
    const memo = solanaService.buildIncidentMemo({
      incidentId: newIncidentId,
      userId: 'hashed-user-001',
      timestamp: now.toISOString(),
      status: 'active',
    });
    console.log('[usePanic] Solana memo:', memo);

    // 7. Send SMS to all contacts via Twilio
    twilioService.sendPanicAlerts({
      contacts: MOCK_CONTACTS,
      incidentId: newIncidentId,
      userName: 'Alex',
      location,
    }).catch((e) => console.warn('[usePanic] Twilio SMS failed:', e));

    // 8. Fetch Gemini rights reminder
    geminiService.getRightsReminder('English').then((reminder) => {
      setPanicState((prev) => ({ ...prev, rightsReminder: reminder }));
    }).catch((e) => console.warn('[usePanic] Gemini failed:', e));

    console.log('🚨 PANIC TRIGGERED:', { incidentId: newIncidentId, timestamp: now.toISOString() });
    return newIncidentId;
  }, []);

  const disarmPanic = useCallback(async (safePhrase: string): Promise<boolean> => {
    if (!safePhrase.trim()) return false;

    // Stop audio
    if (soundRef.current) {
      await elevenLabsService.stopAlert(soundRef.current);
      soundRef.current = null;
    }

    const { incidentId } = panicState;
    const now = new Date();

    mongoService.updateIncident(incidentId, {
      status: 'disarmed',
      disarmedAt: now.toISOString(),
    }).catch((e) => console.warn('[usePanic] MongoDB disarm failed:', e));

    backboardService.saveIncidentMemory({
      incidentId,
      outcome: 'disarmed — person is safe',
      date: now.toISOString(),
    }).catch((e) => console.warn('[usePanic] Backboard disarm failed:', e));

    twilioService.sendAllClearAlerts({
      contacts: MOCK_CONTACTS,
      incidentId,
      userName: 'Alex',
    }).catch((e) => console.warn('[usePanic] Twilio all-clear failed:', e));

    const memo = solanaService.buildIncidentMemo({
      incidentId,
      userId: 'hashed-user-001',
      timestamp: now.toISOString(),
      status: 'disarmed',
    });
    console.log('[usePanic] Solana disarm memo:', memo);

    setPanicState({
      isActive: false,
      contactsNotified: 0,
      incidentId: '',
      timer: 0,
      triggeredAt: null,
      rightsReminder: '',
    });

    console.log('✅ Panic disarmed');
    return true;
  }, [panicState]);

  const checkIn = useCallback(() => {
    setPanicState((prev) => ({ ...prev, timer: 135 }));
    twilioService.sendCheckInAlert({
      contacts: MOCK_CONTACTS,
      userName: 'Alex',
      incidentId: panicState.incidentId,
    }).catch((e) => console.warn('[usePanic] Twilio check-in failed:', e));
    console.log('✅ Check-in recorded');
  }, [panicState.incidentId]);

  return { ...panicState, triggerPanic, disarmPanic, checkIn };
};
