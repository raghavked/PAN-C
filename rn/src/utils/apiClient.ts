import { storage } from './storage';

const API_BASE = '/api';

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
