import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

/**
 * API base URL resolution — handles all three environments:
 *
 * 1. EXPO_PUBLIC_API_URL set (e.g. production remote server):
 *    Uses that URL directly. Example: https://myserver.com → calls https://myserver.com/api/...
 *
 * 2. Native device (Expo Go via tunnel) — no EXPO_PUBLIC_API_URL set:
 *    Expo sets Constants.expoConfig.hostUri to the tunnel hostname, e.g.
 *    "pm0-89w-anonymous-8081.exp.direct". We build:
 *    https://pm0-89w-anonymous-8081.exp.direct/api/...
 *    The Metro server at that URL has the /api proxy middleware → backend:3001.
 *
 * 3. Web (Vite dev server) — no EXPO_PUBLIC_API_URL set:
 *    Uses relative /api — Vite proxies it to localhost:3001.
 */
function resolveApiBase(): string {
  // Explicit override always wins
  const override = process.env?.EXPO_PUBLIC_API_URL;
  if (override) {
    return override.replace(/\/+$/, '');
  }

  // On native, derive from the Metro tunnel hostUri
  if (Platform.OS !== 'web') {
    const hostUri: string | undefined =
      (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
      (Constants.manifest2 as { extra?: { expoClient?: { hostUri?: string } } } | null)
        ?.extra?.expoClient?.hostUri ??
      (Constants.manifest as { hostUri?: string } | null)?.hostUri;

    if (hostUri) {
      // hostUri may include port, e.g. "pm0-89w-anonymous-8081.exp.direct"
      // or "192.168.1.5:8081" for LAN. Strip any trailing path.
      const host = hostUri.split('/')[0];
      // exp.direct tunnels use HTTPS; LAN addresses use HTTP
      const scheme = host.includes('exp.direct') ? 'https' : 'http';
      return `${scheme}://${host}`;
    }
  }

  // Web fallback — Vite proxy handles /api
  return '/api';
}

const API_BASE = resolveApiBase();

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

  // Build full URL:
  // - If API_BASE is "/api" (web), path is appended directly: /api/auth/login
  // - If API_BASE is a full URL (native/prod), append /api + path: https://host/api/auth/login
  const url = API_BASE.startsWith('/')
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
  get:    <T = unknown>(path: string)               => apiRequest<T>(path, 'GET'),
  post:   <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, 'POST', body),
  put:    <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, 'PUT', body),
  patch:  <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, 'PATCH', body),
  delete: <T = unknown>(path: string)               => apiRequest<T>(path, 'DELETE'),
};
