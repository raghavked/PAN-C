/**
 * blackbirdService.ts
 * Blackbird.io iPaaS — orchestrates multi-step notification workflows:
 * SMS via Twilio, email via SendGrid, push notifications, and legal org alerts,
 * all triggered from a single Blackbird "Bird" (workflow).
 *
 * Required secrets (Replit → Secrets):
 *   VITE_BLACKBIRD_API_KEY      — from app.blackbird.io → Settings → API Keys
 *   VITE_BLACKBIRD_ORG_ID       — your Blackbird organization ID
 *   VITE_BLACKBIRD_PANIC_BIRD   — the Bird (workflow) ID for panic notifications
 *   VITE_BLACKBIRD_DISARM_BIRD  — the Bird ID for disarm/all-clear notifications
 */

const API_KEY    = import.meta.env.VITE_BLACKBIRD_API_KEY;
const ORG_ID     = import.meta.env.VITE_BLACKBIRD_ORG_ID;
const PANIC_BIRD = import.meta.env.VITE_BLACKBIRD_PANIC_BIRD;
const DISARM_BIRD = import.meta.env.VITE_BLACKBIRD_DISARM_BIRD;
const BASE_URL   = 'https://api.blackbird.io/v1';

interface BlackbirdTriggerPayload {
  [key: string]: unknown;
}

async function triggerBird(birdId: string, payload: BlackbirdTriggerPayload) {
  if (!API_KEY || !ORG_ID || !birdId) {
    console.warn('[blackbirdService] Missing Blackbird secrets — skipping workflow trigger');
    return { triggered: false, stub: true };
  }

  const res = await fetch(`${BASE_URL}/organizations/${ORG_ID}/birds/${birdId}/trigger`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Blackbird trigger failed: ${res.status}`);
  return res.json();
}

export const blackbirdService = {
  /**
   * Trigger the panic notification Bird.
   * This Bird should be configured in Blackbird.io to:
   *   1. Send SMS via Twilio to all emergency contacts
   *   2. Send email via SendGrid with incident details
   *   3. Post to a legal org Slack/webhook
   *   4. Log the incident to MongoDB (via Blackbird MongoDB connector)
   */
  async triggerPanicWorkflow(payload: {
    incidentId: string;
    userName: string;
    contacts: { name: string; phone: string; email: string }[];
    location?: { lat: number; lng: number };
    timestamp: string;
    alertMessage: string;
  }) {
    return triggerBird(PANIC_BIRD, payload);
  },

  /**
   * Trigger the all-clear Bird when panic is disarmed.
   * Sends "I'm safe" messages to all notified contacts.
   */
  async triggerDisarmWorkflow(payload: {
    incidentId: string;
    userName: string;
    contacts: { name: string; phone: string; email: string }[];
    timestamp: string;
  }) {
    return triggerBird(DISARM_BIRD, payload);
  },

  /**
   * List recent Bird execution logs for debugging.
   */
  async getRecentRuns(birdId: string, limit = 10) {
    if (!API_KEY || !ORG_ID) return [];

    const res = await fetch(
      `${BASE_URL}/organizations/${ORG_ID}/birds/${birdId}/runs?limit=${limit}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );

    if (!res.ok) throw new Error(`Blackbird getRuns failed: ${res.status}`);
    const data = await res.json();
    return data.runs ?? [];
  },
};
