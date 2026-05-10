/**
 * mongoService.ts
 * Calls your backend REST API which uses the MongoDB Node.js driver server-side.
 * MONGODB_URI and MONGODB_DATABASE are server-side only — never in the app bundle.
 *
 * Required env var (mobile app):
 *   EXPO_PUBLIC_API_URL — URL of your backend, e.g. https://pan-c-api.railway.app/api
 *   (Falls back to localhost:3000 for local development)
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface MongoDocument {
  [key: string]: unknown;
}

async function apiRequest(path: string, method: string, body?: MongoDocument) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`);
    return res.json();
  } catch (e) {
    console.warn(`[mongoService] ${method} ${path} failed (stub mode):`, e);
    return { document: null, documents: [], insertedId: 'stub-id' };
  }
}

export const mongoService = {
  async createIncident(incident: MongoDocument) {
    return apiRequest('/incidents', 'POST', incident);
  },
  async updateIncident(incidentId: string, update: MongoDocument) {
    return apiRequest(`/incidents/${incidentId}`, 'PATCH', update);
  },
  async getIncident(incidentId: string) {
    return apiRequest(`/incidents/${incidentId}`, 'GET');
  },
  async upsertContact(userId: string, contact: MongoDocument) {
    return apiRequest(`/contacts/${userId}`, 'PUT', contact);
  },
  async getContacts(userId: string) {
    return apiRequest(`/contacts/${userId}`, 'GET');
  },
  async saveDocument(userId: string, doc: MongoDocument) {
    return apiRequest('/documents', 'POST', { userId, ...doc, createdAt: new Date().toISOString() });
  },
  async getDocuments(userId: string) {
    return apiRequest(`/documents/${userId}`, 'GET');
  },
};
