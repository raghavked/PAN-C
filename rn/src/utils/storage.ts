/**
 * Cross-platform storage utility.
 * - Web: uses localStorage (synchronous)
 * - Native (iOS/Android): uses expo-secure-store (async, but we expose a sync-style API
 *   by caching values in memory after the first async load)
 *
 * For auth tokens we pre-load all known keys at startup via `initStorage()`.
 * All other callers can use the sync API safely after init.
 */
import { Platform } from 'react-native';

const KNOWN_KEYS = ['panc_auth_token', 'panc_safe_phrase'];

// In-memory cache for native
const cache: Record<string, string | null> = {};

let SecureStore: typeof import('expo-secure-store') | null = null;

async function getSecureStore() {
  if (SecureStore) return SecureStore;
  try {
    SecureStore = await import('expo-secure-store');
  } catch {
    SecureStore = null;
  }
  return SecureStore;
}

/**
 * Call once at app startup (in AuthProvider useEffect) to pre-load all
 * known keys into the in-memory cache so sync reads work immediately.
 */
export async function initStorage(): Promise<void> {
  if (Platform.OS === 'web') return;
  const store = await getSecureStore();
  if (!store) return;
  await Promise.all(
    KNOWN_KEYS.map(async (key) => {
      try {
        const val = await store.getItemAsync(key);
        cache[key] = val ?? null;
      } catch {
        cache[key] = null;
      }
    })
  );
}

export const storage = {
  /** Synchronous read — returns cached value on native, localStorage on web */
  getItem(key: string): string | null {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    return key in cache ? cache[key] : null;
  },

  /** Synchronous write — updates cache immediately, persists async on native */
  setItem(key: string, value: string): void {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return;
    }
    cache[key] = value;
    getSecureStore().then((store) => {
      store?.setItemAsync(key, value).catch(() => {});
    });
  },

  /** Synchronous remove — clears cache immediately, removes async on native */
  removeItem(key: string): void {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    cache[key] = null;
    getSecureStore().then((store) => {
      store?.deleteItemAsync(key).catch(() => {});
    });
  },
};
