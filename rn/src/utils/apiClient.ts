import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

/**
 * API base URL resolution — priority order:
 *
 * 1. EXPO_PUBLIC_API_URL env var (set in rn/.env) — highest priority, most reliable.
 *    Points directly at the backend server (not Metro), e.g.:
 *    "https://3001-xxxx.us2.manus.computer"
 *
 * 2. Native device via Expo Go tunnel (hostUri from Constants):
 *    Only used if EXPO_PUBLIC_API_URL is not set.
 *    NOTE: the ngrok tunnel points at Metro (8081), not the backend — so this
 *    path only works if Metro has an /api proxy middleware.
 *
 * 3. Web (Vite dev server):
 *    Uses relative /api — Vite proxies to localhost:3001
 */
function resolveApiBase(): string {
  // Priority 1: explicit env var — bypasses all tunnel/hostUri ambiguity
  const envApiUrl: string | undefined =
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.apiUrl ??
    (process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL;

  if (envApiUrl && envApiUrl.trim() !== '') {
    return envApiUrl.replace(/\/$/, ''); // strip trailing slash
  }

  if (Platform.OS !== 'web') {
    const hostUri: string | undefined =
      (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
      (Constants.manifest2 as { extra?: { expoClient?: { hostUri?: string } } } | null)
        ?.extra?.expoClient?.hostUri ??
      (Constants.manifest as { hostUri?: string } | null)?.hostUri;

    if (hostUri) {
      // Strip any path component, keep only host[:port]
      const host = hostUri.split('/')[0];
      // exp.direct or ngrok tunnel — use https
      if (host.includes('exp.direct') || host.includes('ngrok')) {
        return `https://${host}`;
      }
      // LAN — use http
      return `http://${host}`;
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
  // - If API_BASE is "/api" (web Vite), path is appended: /api/auth/login
  // - If API_BASE is a full URL (native), append /api + path: https://host/api/auth/login
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
