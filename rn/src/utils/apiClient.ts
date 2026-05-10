import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

function buildApiBase(): string {
  if (Platform.OS === 'web') {
    // Web: relative path — Metro middleware proxies /api/* → backend on port 3001
    return '/api';
  }

  // Native (phone): we need an absolute URL.
  //
  // Primary: use Replit's own stable proxy domain (REPLIT_EXPO_DEV_DOMAIN injected
  // via app.config.js extra). This domain is stable Replit infrastructure and does
  // NOT rely on Expo's external tunnel service (exp.direct), which is flaky.
  // The Metro server at that domain has a /api/* middleware → backend on port 3001.
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  const replitDomain = extra?.replitExpoDomain;
  if (replitDomain) {
    return `https://${replitDomain}/api`;
  }

  // Fallback: derive from Constants.linkingUri (the Expo tunnel URL).
  // e.g. "exp://pm0-89w-anonymous-5000.exp.direct" → "https://pm0-89w-anonymous-5000.exp.direct/api"
  // This is less reliable because it goes through Expo's external tunnel service.
  const linkingUri: string | undefined = (Constants as any).linkingUri;
  if (linkingUri) {
    const withoutScheme = linkingUri.replace(/^exp?o?:\/\//, '');
    const hostAndPort = withoutScheme.split('/')[0];
    const isIp = /^\d{1,3}\.\d{1,3}/.test(hostAndPort);
    const scheme = isIp ? 'http' : 'https';
    return `${scheme}://${hostAndPort}/api`;
  }

  // Fallback: check manifest hostUri (older Expo Go versions)
  const hostUri: string | undefined =
    (Constants as any).manifest?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const isIp = /^\d{1,3}\.\d{1,3}/.test(hostUri);
    const scheme = isIp ? 'http' : 'https';
    const host = hostUri.split(':')[0];
    const port = isIp ? `:${hostUri.split(':')[1] || 5000}` : '';
    return `${scheme}://${host}${port}/api`;
  }

  return '/api';
}

const API_BASE = buildApiBase();

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

  const res = await fetch(`${API_BASE}${path}`, {
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
  get: <T = unknown>(path: string) => apiRequest<T>(path, 'GET'),
  post: <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, 'POST', body),
  put: <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, 'PUT', body),
  patch: <T = unknown>(path: string, body: unknown) => apiRequest<T>(path, 'PATCH', body),
  delete: <T = unknown>(path: string) => apiRequest<T>(path, 'DELETE'),
};
