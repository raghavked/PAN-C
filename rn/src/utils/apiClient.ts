import { storage } from './storage';

/**
 * API base URL resolution:
 *
 * - When running in Expo Go via a tunnel, Metro proxies /api → localhost:3001
 *   automatically (see metro.config.js), so /api works for all native requests.
 *
 * - If you ever need to point directly at a remote server (e.g. production),
 *   set EXPO_PUBLIC_API_URL=https://your-server.com in rn/.env
 *   and the app will use that instead.
 *
 * - On web (Vite dev server), /api is proxied to localhost:3001 by vite.config.ts.
 */
const API_BASE: string =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL)
    ? (process.env.EXPO_PUBLIC_API_URL as string).replace(/\/$/, '')
    : '/api';

export async function apiRequest<T = unknown>(
  path: string,
  method: string = 'GET',
  body?: unknown,
  overrideToken?: string | null,
): Promise<T> {
  const token = overrideToken ?? storage.getItem('panc_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Resolve full URL: if API_BASE already contains /api, path should NOT start with /api
  const url = API_BASE === '/api'
    ? `${API_BASE}${path}`
    : `${API_BASE}/api${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `API ${method} ${path} failed: ${res.status}`);
  }

  return data as T;
}

export const api = {
  get:    <T = unknown>(path: string)              => apiRequest<T>(path, 'GET'),
  post:   <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, 'POST', body),
  put:    <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, 'PUT', body),
  patch:  <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, 'PATCH', body),
  delete: <T = unknown>(path: string)              => apiRequest<T>(path, 'DELETE'),
};
