import { config } from '../config';

function isConfigured(): boolean {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
    console.warn('[twilioService] Missing Twilio secrets — SMS will not be sent');
    return false;
  }
  return true;
}

export interface SMSContact {
  name: string;
  phone: string;
}

export interface SMSResult {
  to: string;
  sid?: string;
  status: 'sent' | 'failed' | 'stub';
  error?: string;
}

async function sendSMS(to: string, body: string): Promise<SMSResult> {
  if (!isConfigured()) {
    console.log(`[twilioService] STUB SMS to ${to}: ${body}`);
    return { to, status: 'stub' };
  }

  try {
    const TWILIO_BASE = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`;
    const credentials = btoa(`${config.twilioAccountSid}:${config.twilioAuthToken}`);
    const params = new URLSearchParams({ To: to, From: config.twilioPhoneNumber, Body: body });

    const res = await fetch(TWILIO_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`[twilioService] SMS to ${to} failed:`, data.message);
      return { to, status: 'failed', error: data.message };
    }

    console.log(`[twilioService] SMS sent to ${to} — SID: ${data.sid}`);
    return { to, sid: data.sid, status: 'sent' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[twilioService] SMS to ${to} threw:`, message);
    return { to, status: 'failed', error: message };
  }
}

export const twilioService = {
  async sendPanicAlerts(payload: {
    contacts: SMSContact[];
    incidentId: string;
    userName: string;
    location?: { lat: number; lng: number };
  }): Promise<SMSResult[]> {
    const locationText = payload.location
      ? `\nGPS: ${payload.location.lat}, ${payload.location.lng}`
      : '';

    const message =
      `🚨 EMERGENCY ALERT 🚨\n` +
      `${payload.userName} may be in danger and needs help NOW.\n` +
      `Incident ID: ${payload.incidentId}${locationText}\n` +
      `Call or go to them immediately. Do NOT ignore this message.`;

    const results = await Promise.all(
      payload.contacts.map((contact) => sendSMS(contact.phone, message))
    );

    const sent = results.filter((r) => r.status === 'sent').length;
    console.log(`[twilioService] Panic alerts: ${sent}/${payload.contacts.length} sent`);
    return results;
  },

  async sendAllClearAlerts(payload: {
    contacts: SMSContact[];
    incidentId: string;
    userName: string;
  }): Promise<SMSResult[]> {
    const message =
      `✅ ALL CLEAR — ${payload.userName} is safe.\n` +
      `The emergency alert (Incident ${payload.incidentId}) has been cancelled.\n` +
      `No further action needed. Thank you for being there.`;

    return Promise.all(
      payload.contacts.map((contact) => sendSMS(contact.phone, message))
    );
  },

  async sendCheckInAlert(payload: {
    contacts: SMSContact[];
    userName: string;
    incidentId: string;
  }): Promise<SMSResult[]> {
    const message =
      `🟡 CHECK-IN — ${payload.userName} has checked in and is okay for now.\n` +
      `Incident ${payload.incidentId} is still active. Stay alert.`;

    return Promise.all(
      payload.contacts.map((contact) => sendSMS(contact.phone, message))
    );
  },

  async sendTestSMS(toPhone: string): Promise<SMSResult> {
    return sendSMS(toPhone, '✅ PAN-C test message — your Twilio integration is working correctly.');
  },
};
