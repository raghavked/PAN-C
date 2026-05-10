/**
 * mongoService.ts
 * Delegates to the shared apiClient which resolves the correct backend URL
 * for tunnel / LAN / production automatically.
 */
import { apiRequest as coreRequest } from '../utils/apiClient';

interface MongoDocument {
  [key: string]: unknown;
}

async function apiRequest(path: string, method: string, body?: MongoDocument) {
  try {
    return await coreRequest(path, method, body);
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
