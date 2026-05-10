import { useState, useCallback } from 'react';
import { mongoService } from '../services/mongoService';
import { elevenLabsService } from '../services/elevenLabsService';
import { backboardService } from '../services/backboardService';
import { geminiService } from '../services/geminiService';
import { solanaService } from '../services/solanaService';
import { twilioService } from '../services/twilioService';
import { contactsApi } from '../services/api';

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


const generateIncidentId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const p1 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `INC-${p1}-${p2}`;
};

let activeAudio: HTMLAudioElement | null = null;

export const usePanic = (): UsePanicReturn => {
  const [panicState, setPanicState] = useState<PanicState>({
    isActive: false,
    contactsNotified: 0,
    incidentId: '',
    timer: 0,
    triggeredAt: null,
    rightsReminder: '',
  });

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

    // 2. Capture geolocation
    let location: { lat: number; lng: number } | undefined;
    if (navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            resolve();
          },
          () => resolve(),
          { timeout: 3000 }
        );
      });
    }

    // 3. Play ElevenLabs AI voice alert (falls back to Web Audio beep if no key)
    elevenLabsService.playPanicAlert().then((audio) => {
      activeAudio = audio;
    });

    // 4. Log incident to MongoDB
    mongoService.createIncident({
      incidentId: newIncidentId,
      userId: 'user-alex-001', // Replace with real auth user ID
      timestamp: now.toISOString(),
      location,
      status: 'active',
      contactsNotified: MOCK_CONTACTS.length,
    }).catch((e) => console.warn('[usePanic] MongoDB log failed:', e));

    // 5. Save incident to Backboard long-term memory for future AI context
    backboardService.saveIncidentMemory({
      incidentId: newIncidentId,
      outcome: 'active',
      date: now.toISOString(),
      notes: location ? `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : undefined,
    }).catch((e) => console.warn('[usePanic] Backboard memory save failed:', e));

    // 6. Log incident hash to Solana (tamper-proof record)
    const memo = solanaService.buildIncidentMemo({
      incidentId: newIncidentId,
      userId: 'hashed-user-001', // Always hash PII before on-chain logging
      timestamp: now.toISOString(),
      status: 'active',
    });
    console.log('[usePanic] Solana memo ready for on-chain logging:', memo);

    // 7. Send real SMS alerts to all emergency contacts via Twilio
    contactsApi.getAll().then(({ contacts }) => {
      const smsContacts = contacts.filter(c => c.phone).map(c => ({ name: c.name, phone: c.phone }));
      return twilioService.sendPanicAlerts({
        contacts: smsContacts,
        incidentId: newIncidentId,
        userName: 'Alex',
        location,
      });
    }).catch((e) => console.warn('[usePanic] Twilio SMS failed:', e));

    // 8. Fetch Gemini rights reminder in background
    geminiService.getRightsReminder('English').then((reminder) => {
      setPanicState((prev) => ({ ...prev, rightsReminder: reminder }));
    }).catch((e) => console.warn('[usePanic] Gemini rights reminder failed:', e));

    console.log('🚨 PANIC TRIGGERED:', { incidentId: newIncidentId, timestamp: now.toISOString() });
    return newIncidentId;
  }, []);

  const disarmPanic = useCallback(async (safePhrase: string): Promise<boolean> => {
    if (!safePhrase.trim()) return false;

    // Stop audio
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }

    const { incidentId } = panicState;
    const now = new Date();

    // Update MongoDB incident status
    mongoService.updateIncident(incidentId, {
      status: 'disarmed',
      disarmedAt: now.toISOString(),
    }).catch((e) => console.warn('[usePanic] MongoDB disarm update failed:', e));

    // Update Backboard long-term memory with disarm outcome
    backboardService.saveIncidentMemory({
      incidentId,
      outcome: 'disarmed — person is safe',
      date: now.toISOString(),
    }).catch((e) => console.warn('[usePanic] Backboard disarm memory failed:', e));

    // Send all-clear SMS to all contacts via Twilio
    contactsApi.getAll().then(({ contacts }) => {
      const smsContacts = contacts.filter(c => c.phone).map(c => ({ name: c.name, phone: c.phone }));
      return twilioService.sendAllClearAlerts({ contacts: smsContacts, incidentId, userName: 'Alex' });
    }).catch((e) => console.warn('[usePanic] Twilio all-clear SMS failed:', e));

    // Log disarm to Solana
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
    // Send check-in SMS so contacts know the person is still okay
    contactsApi.getAll().then(({ contacts }) => {
      const smsContacts = contacts.filter(c => c.phone).map(c => ({ name: c.name, phone: c.phone }));
      return twilioService.sendCheckInAlert({ contacts: smsContacts, userName: 'Alex', incidentId: panicState.incidentId });
    }).catch((e) => console.warn('[usePanic] Twilio check-in SMS failed:', e));
    console.log('✅ Check-in recorded');
  }, [panicState.incidentId]);

  return { ...panicState, triggerPanic, disarmPanic, checkIn };
};
