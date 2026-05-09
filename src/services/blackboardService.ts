/**
 * blackboardService.ts
 * Blackboard Learn REST API (by Anthology) — used in PAN-C to:
 *   1. Push emergency announcements to enrolled courses/cohorts
 *   2. Deliver know-your-rights educational content via course modules
 *   3. Notify student/community members through their institution's LMS
 *   4. Log incident reports as gradable submissions (for legal aid orgs)
 *
 * Auth: OAuth 2.0 Client Credentials (2-legged)
 * Docs: https://docs.anthology.com/docs/blackboard/rest-apis/start-here
 *
 * Required secrets (Replit → Secrets):
 *   VITE_BLACKBOARD_BASE_URL      — Your Learn instance, e.g. https://yourschool.blackboard.com
 *   VITE_BLACKBOARD_APP_KEY       — Application Key from developer.blackboard.com
 *   VITE_BLACKBOARD_APP_SECRET    — Application Secret from developer.blackboard.com
 *   VITE_BLACKBOARD_COURSE_ID     — Course ID to post emergency announcements to
 *
 * Setup steps:
 *   1. Register at developer.blackboard.com → create an Application → get Key + Secret
 *   2. Install the Application ID on your Learn instance (Admin → REST API Integrations)
 *   3. Add the Key + Secret to Replit Secrets
 */

const BASE_URL    = import.meta.env.VITE_BLACKBOARD_BASE_URL || '';
const APP_KEY     = import.meta.env.VITE_BLACKBOARD_APP_KEY || '';
const APP_SECRET  = import.meta.env.VITE_BLACKBOARD_APP_SECRET || '';
const COURSE_ID   = import.meta.env.VITE_BLACKBOARD_COURSE_ID || '';

const TOKEN_ENDPOINT = `${BASE_URL}/learn/api/public/v1/oauth2/token`;

let cachedToken: { token: string; expiresAt: number } | null = null;

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Fetch an OAuth 2.0 access token using client credentials.
 * Tokens are valid for 1 hour and are cached to avoid redundant requests.
 */
async function getAccessToken(): Promise<string> {
  if (!APP_KEY || !APP_SECRET || !BASE_URL) {
    console.warn('[blackboardService] Missing Blackboard secrets — running in stub mode');
    return 'stub-token';
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const credentials = btoa(`${APP_KEY}:${APP_SECRET}`);

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Blackboard token request failed: ${res.status}`);

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

async function bbRequest(method: string, path: string, body?: unknown) {
  const token = await getAccessToken();

  if (token === 'stub-token') {
    console.log(`[blackboardService] STUB ${method} ${path}`, body);
    return { stub: true };
  }

  const res = await fetch(`${BASE_URL}/learn/api/public/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(`Blackboard API ${method} ${path} failed: ${res.status}`);
  return res.json();
}

// ── Service ───────────────────────────────────────────────────────────────────

export const blackboardService = {
  /**
   * Post an emergency announcement to a Blackboard course.
   * Appears in the course Announcements feed for all enrolled members.
   *
   * Use case: Alert a community cohort that an ICE incident is occurring nearby.
   */
  async postCourseAnnouncement(payload: {
    title: string;
    body: string;
    courseId?: string;
  }) {
    const targetCourse = payload.courseId || COURSE_ID;
    if (!targetCourse) {
      console.warn('[blackboardService] No VITE_BLACKBOARD_COURSE_ID set');
      return { stub: true };
    }

    return bbRequest('POST', `/courses/${targetCourse}/announcements`, {
      title: payload.title,
      body: payload.body,
      availability: { duration: { type: 'Permanent' } },
    });
  },

  /**
   * Send a system-level announcement visible to all users on the Learn instance.
   * Requires system admin privileges for the registered application.
   */
  async postSystemAnnouncement(payload: {
    title: string;
    body: string;
  }) {
    return bbRequest('POST', '/announcements', {
      title: payload.title,
      body: payload.body,
      availability: {
        available: 'Yes',
        duration: { type: 'Permanent' },
      },
    });
  },

  /**
   * Get all users enrolled in the configured course.
   * Used to build the notification recipient list.
   */
  async getCourseMembers(courseId?: string) {
    const target = courseId || COURSE_ID;
    if (!target) return [];
    const data = await bbRequest('GET', `/courses/${target}/users?limit=200`);
    return data.results ?? [];
  },

  /**
   * Send a direct message to a specific Blackboard user.
   * Note: Requires the Messages REST API to be enabled on the Learn instance.
   */
  async sendDirectMessage(payload: {
    recipientUserId: string;
    subject: string;
    body: string;
  }) {
    return bbRequest('POST', '/users/messages', {
      recipientId: payload.recipientUserId,
      subject: payload.subject,
      body: payload.body,
    });
  },

  /**
   * Create a content item (know-your-rights module) in a course.
   * Use this to deploy educational materials to community members.
   */
  async createContentItem(payload: {
    courseId: string;
    parentId: string; // Content folder ID
    title: string;
    body: string;
  }) {
    return bbRequest('POST', `/courses/${payload.courseId}/contents/${payload.parentId}/children`, {
      title: payload.title,
      body: payload.body,
      contentHandler: { id: 'resource/x-bb-document' },
      availability: { available: 'Yes' },
    });
  },

  /**
   * Trigger a panic-context announcement to the course community.
   * Convenience wrapper used by usePanic hook.
   */
  async triggerEmergencyAnnouncement(incidentId: string, location?: string) {
    const locationText = location ? ` near ${location}` : '';
    return blackboardService.postCourseAnnouncement({
      title: `🚨 Community Safety Alert — ${incidentId}`,
      body: `An emergency has been reported${locationText}. If you are safe, please check in. 
             Know your rights: You have the right to remain silent. 
             Do not open the door without a warrant. 
             Contact a lawyer immediately if detained. 
             Incident ID: ${incidentId}`,
    });
  },
};
