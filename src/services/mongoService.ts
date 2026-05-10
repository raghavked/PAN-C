/**
 * mongoService.ts
 * MongoDB Atlas — stores incidents, contacts, and documents.
 *
 * ⚠️  The Atlas Data API was permanently shut down on September 30, 2025.
 *
 * Current architecture (2025/2026):
 *   - The mongodb+srv:// connection string is used SERVER-SIDE ONLY
 *     in your Node.js/Express backend (never in the browser bundle).
 *   - This service calls your backend REST API, which uses the
 *     official MongoDB Node.js driver (v6+) to talk to Atlas.
 *
 * Required secrets:
 *   Backend server (.env — NOT exposed to browser):
 *     MONGODB_URI        — mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/
 *                          Get from: cloud.mongodb.com → cluster → Connect
 *                          → Drivers → Node.js v5.5 or later
 *     MONGODB_DATABASE   — e.g. "pan_c"
 *
 *   Client-side (Replit Secrets / VITE_ prefix):
 *     VITE_API_URL       — URL of your backend, e.g. https://pan-c-api.replit.app/api
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface MongoDocument {
  [key: string]: unknown;
}

async function apiRequest(path: string, method: string, body?: MongoDocument) {
  if (!API_URL) {
    console.warn('[mongoService] Missing VITE_API_URL — running in stub mode');
    return { document: null, documents: [], insertedId: 'stub-id' };
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`);
  return res.json();
}

// ── Incidents ──────────────────────────────────────────────────────────────

export const mongoService = {
  /** Insert a new panic incident record */
  async createIncident(incident: MongoDocument) {
    return apiRequest('/incidents', 'POST', incident);
  },

  /** Update incident status (e.g. disarmed) */
  async updateIncident(incidentId: string, update: MongoDocument) {
    return apiRequest(`/incidents/${incidentId}`, 'PATCH', update);
  },

  /** Fetch a single incident by ID */
  async getIncident(incidentId: string) {
    return apiRequest(`/incidents/${incidentId}`, 'GET');
  },

  // ── Contacts ──────────────────────────────────────────────────────────────

  /** Save or update an emergency contact */
  async upsertContact(userId: string, contact: MongoDocument) {
    return apiRequest(`/contacts/${userId}`, 'PUT', contact);
  },

  /** Get all contacts for a user */
  async getContacts(userId: string) {
    return apiRequest(`/contacts/${userId}`, 'GET');
  },

  // ── Documents ─────────────────────────────────────────────────────────────

  /** Store document metadata (not the file itself — use S3/GridFS for files) */
  async saveDocument(userId: string, doc: MongoDocument) {
    return apiRequest('/documents', 'POST', { userId, ...doc, createdAt: new Date().toISOString() });
  },

  /** Get all documents for a user */
  async getDocuments(userId: string) {
    return apiRequest(`/documents/${userId}`, 'GET');
  },
};
