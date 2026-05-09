/**
 * twilioService.ts
 * Twilio REST API — sends real SMS alerts to emergency contacts
 * when the panic button is pressed, and all-clear messages when disarmed.
 *
 * ⚠️  SECURITY NOTE:
 * Twilio credentials in VITE_ variables are visible in the browser bundle.
 * This is Option A (get it working fast). For production, move to a backend
 * server (Option B) so credentials are never exposed client-side.
 * Mitigate risk by: using a restricted Twilio subaccount, enabling Geo
 * Permissions to limit to expected countries, and rotating keys regularly.
 *
 * Required secrets (Replit → Secrets):
 *   VITE_TWILIO_ACCOUNT_SID    — from console.twilio.com → Account Info
 *   VITE_TWILIO_AUTH_TOKEN     — from console.twilio.com → Account Info
 *   VITE_TWILIO_PHONE_NUMBER   — your Twilio "From" number, e.g. +15551234567
 *
 * Setup:
 *   1. Sign up at twilio.com → get a free phone number
 *   2. Copy Account SID and Auth Token from the Console dashboard
 *   3. Add all three values to Replit Secrets
 */

const ACCOUNT_SID  = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const AUTH_TOKEN   = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const FROM_NUMBER  = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';

const TWILIO_BASE  = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;

function isConfigured(): boolean {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
    console.warn('[twilioService] Missing Twilio secrets — SMS will not be sent');
    return false;
  }
  return true;
}

export interface SMSContact {
  name: string;
  phone: string; // E.164 format: +15551234567
}

export interface SMSResult {
  to: string;
  sid?: string;
  status: 'sent' | 'failed' | 'stub';
  error?: string;
}

/**
 * Send a single SMS via Twilio REST API.
 * Uses Basic Auth (AccountSID:AuthToken) as required by Twilio.
 */
async function sendSMS(to: string, body: string): Promise<SMSResult> {
  if (!isConfigured()) {
    console.log(`[twilioService] STUB SMS to ${to}: ${body}`);
    return { to, status: 'stub' };
  }

  try {
    const credentials = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);
    const params = new URLSearchParams({ To: to, From: FROM_NUMBER, Body: body });

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
  /**
   * Send panic alert SMS to all emergency contacts in parallel.
   * Returns results for each contact so failures can be surfaced in the UI.
   */
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

  /**
   * Send all-clear SMS to all contacts when panic is disarmed.
   */
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

  /**
   * Send a check-in confirmation SMS — "I'm still okay, timer reset."
   */
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

  /**
   * Send a test SMS to a single number to verify credentials are working.
   */
  async sendTestSMS(toPhone: string): Promise<SMSResult> {
    return sendSMS(
      toPhone,
      '✅ PAN-C test message — your Twilio integration is working correctly.'
    );
  },
};
