// PAN!C API Client — connects frontend to Express backend
// In dev: Vite proxies /api → http://localhost:3001 (see vite.config.ts)
// In production (Replit deploy): set VITE_API_URL to your Replit backend URL
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('panic_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  requiresAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const authApi = {
  signup: (data: { email: string; password: string; fullName: string; phone: string }) =>
    request<{ user: User; token: string; refreshToken: string }>('POST', '/auth/signup', data, false),
  login: (data: { email: string; password: string }) =>
    request<{ user: User; token: string; refreshToken: string }>('POST', '/auth/login', data, false),
  logout: () => request<{ message: string }>('POST', '/auth/logout'),
  refresh: (refreshToken: string) =>
    request<{ token: string; refreshToken: string }>('POST', '/auth/refresh', { refreshToken }, false),
  me: () => request<{ user: User }>('GET', '/auth/me'),
  updateProfile: (data: Partial<User>) => request<{ message: string }>('PUT', '/auth/profile', data),
};

// Contacts
export const contactsApi = {
  getAll: () => request<{ contacts: Contact[] }>('GET', '/contacts'),
  create: (data: Omit<Contact, '_id' | 'userEmail' | 'createdAt' | 'lastNotified'>) =>
    request<{ contact: Contact }>('POST', '/contacts', data),
  update: (id: string, data: Partial<Contact>) =>
    request<{ message: string }>('PUT', `/contacts/${id}`, data),
  delete: (id: string) => request<{ message: string }>('DELETE', `/contacts/${id}`),
};

// Documents
export const documentsApi = {
  getAll: () => request<{ documents: Document[] }>('GET', '/documents'),
  upload: (data: { type: string; fileName: string; fileDataBase64: string; mimeType: string; expiresAt?: string }) =>
    request<{ document: Document }>('POST', '/documents', data),
  update: (id: string, data: Partial<Document>) =>
    request<{ message: string }>('PUT', `/documents/${id}`, data),
  delete: (id: string) => request<{ message: string }>('DELETE', `/documents/${id}`),
  share: (id: string) => request<{ shareableLink: string; shareUrl: string; expiresAt: string }>('POST', `/documents/${id}/share`),
  downloadUrl: (id: string) => `${BASE_URL}/documents/${id}/download`,
};

// Check-In
export const checkinApi = {
  getStatus: () => request<{ settings: CheckInSettings; minutesRemaining: number; isOverdue: boolean }>('GET', '/checkin/status'),
  updateSettings: (data: Partial<CheckInSettings>) => request<{ message: string }>('PUT', '/checkin/settings', data),
  checkIn: (location?: { latitude: number; longitude: number }) =>
    request<{ message: string; nextDueAt: string; status: string }>('POST', '/checkin/checkin', location),
  snooze: (minutes?: number) => request<{ message: string; nextDueAt: string }>('POST', '/checkin/snooze', { minutes }),
  getHistory: (limit?: number) => request<{ history: CheckInHistory[] }>('GET', `/checkin/history?limit=${limit || 20}`),
};

// Panic
export const panicApi = {
  trigger: (location?: { latitude: number; longitude: number; address?: string }) =>
    request<{ incidentId: string; contactsNotified: unknown[]; audioBase64: string | null; status: string }>('POST', '/panic/trigger', location),
  disarm: (incidentId: string, safePhrase: string) =>
    request<{ message: string }>('POST', '/panic/disarm', { incidentId, safePhrase }),
  getIncidents: () => request<{ incidents: Incident[] }>('GET', '/panic/incidents'),
  setSafePhrase: (safePhrase: string) =>
    request<{ message: string }>('POST', '/panic/safephrase', { safePhrase }),
};

// Chat
export const chatApi = {
  sendMessage: (message: string) =>
    request<{ message: ChatMessage }>('POST', '/chat/message', { message }),
  getHistory: (limit?: number) =>
    request<{ messages: ChatMessage[] }>('GET', `/chat/history?limit=${limit || 50}`),
  clearHistory: () => request<{ message: string }>('DELETE', '/chat/history'),
};

// Types
export interface User {
  _id?: string;
  email: string;
  fullName: string;
  phone: string;
  settings?: {
    theme: 'dark' | 'light';
    language: string;
    notifications: boolean;
  };
}

export interface Contact {
  _id?: string;
  userEmail?: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  notifyVia: { sms: boolean; email: boolean; push: boolean };
  canSeeDocuments: boolean;
  canSeeLocation: boolean;
  isPrimary: boolean;
  createdAt?: string;
  lastNotified?: string | null;
}

export interface Document {
  _id?: string;
  userEmail?: string;
  type: string;
  fileName: string;
  uploadedAt?: string;
  expiresAt?: string | null;
  isSharedWithContacts?: boolean;
  shareableLink?: string | null;
  shareableExpiresAt?: string | null;
  fileSize?: number;
  mimeType?: string;
}

export interface CheckInSettings {
  intervalMinutes: number;
  activeHours: { start: string; end: string };
  reminders: { minutesBefore: number }[];
  nextDueAt?: string;
  lastCheckedInAt?: string | null;
  isActive: boolean;
  escalationLevel?: number;
}

export interface CheckInHistory {
  _id?: string;
  checkedInAt: string;
  status: 'on_time' | 'late' | 'missed';
  location?: { latitude: number; longitude: number };
}

export interface Incident {
  _id?: string;
  incidentId: string;
  triggeredAt: string;
  location?: { latitude: number; longitude: number; address?: string };
  contactsNotified: unknown[];
  status: 'active' | 'disarmed' | 'escalated';
  disarmedAt?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
