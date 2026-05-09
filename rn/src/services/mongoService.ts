/**
 * mongoService.ts
 * MongoDB Atlas Data API — stores incidents, contacts, and documents.
 *
 * Required secrets (Replit → Secrets):
 *   VITE_MONGODB_DATA_API_URL   — e.g. https://data.mongodb-api.com/app/<App-ID>/endpoint/data/v1
 *   VITE_MONGODB_API_KEY        — Data API key from Atlas UI → App Services → API Keys
 *   VITE_MONGODB_DATABASE       — e.g. "pan_c"
 *   VITE_MONGODB_DATA_SOURCE    — e.g. "Cluster0"
 */

const BASE_URL = process.env.EXPO_PUBLIC_MONGODB_DATA_API_URL;
const API_KEY  = process.env.EXPO_PUBLIC_MONGODB_API_KEY;
const DATABASE = process.env.EXPO_PUBLIC_MONGODB_DATABASE || 'pan_c';
const DATA_SRC = process.env.EXPO_PUBLIC_MONGODB_DATA_SOURCE || 'Cluster0';

interface MongoDocument {
  [key: string]: unknown;
}

async function mongoRequest(action: string, collection: string, body: MongoDocument) {
  if (!BASE_URL || !API_KEY) {
    console.warn('[mongoService] Missing VITE_MONGODB_DATA_API_URL or VITE_MONGODB_API_KEY — using stub');
    return { document: null, documents: [], insertedId: 'stub-id' };
  }

  const res = await fetch(`${BASE_URL}/action/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_KEY,
    },
    body: JSON.stringify({
      dataSource: DATA_SRC,
      database: DATABASE,
      collection,
      ...body,
    }),
  });

  if (!res.ok) throw new Error(`MongoDB ${action} failed: ${res.status}`);
  return res.json();
}

// ── Incidents ──────────────────────────────────────────────────────────────

export const mongoService = {
  /** Insert a new panic incident record */
  async createIncident(incident: MongoDocument) {
    return mongoRequest('insertOne', 'incidents', { document: incident });
  },

  /** Update incident status (e.g. disarmed) */
  async updateIncident(incidentId: string, update: MongoDocument) {
    return mongoRequest('updateOne', 'incidents', {
      filter: { incidentId },
      update: { $set: update },
    });
  },

  /** Fetch a single incident by ID */
  async getIncident(incidentId: string) {
    return mongoRequest('findOne', 'incidents', {
      filter: { incidentId },
    });
  },

  // ── Contacts ──────────────────────────────────────────────────────────────

  /** Save or update an emergency contact */
  async upsertContact(userId: string, contact: MongoDocument) {
    return mongoRequest('updateOne', 'contacts', {
      filter: { userId, 'contact.id': contact['id'] },
      update: { $set: { userId, contact } },
      upsert: true,
    });
  },

  /** Get all contacts for a user */
  async getContacts(userId: string) {
    return mongoRequest('find', 'contacts', {
      filter: { userId },
    });
  },

  // ── Documents ─────────────────────────────────────────────────────────────

  /** Store document metadata (not the file itself — use S3/Supabase for files) */
  async saveDocument(userId: string, doc: MongoDocument) {
    return mongoRequest('insertOne', 'documents', {
      document: { userId, ...doc, createdAt: new Date().toISOString() },
    });
  },

  /** Get all documents for a user */
  async getDocuments(userId: string) {
    return mongoRequest('find', 'documents', {
      filter: { userId },
    });
  },
};
