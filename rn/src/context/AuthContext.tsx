import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { apiRequest } from '../utils/apiClient';
import { storage, initStorage } from '../utils/storage';

async function registerFcmToken(authToken: string) {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    // Use Expo push token — works in Expo Go (anonymous) and standalone builds
    let pushToken: string | null = null;
    try {
      const Constants = (await import('expo-constants')).default;
      // For Expo Go without EAS registration, use experienceId (@anonymous/slug)
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const slug = Constants.expoConfig?.slug ?? 'pan-c';
      const owner = Constants.expoConfig?.owner ?? 'anonymous';
      const tokenOpts: Record<string, string> = projectId
        ? { projectId }
        : { experienceId: `@${owner}/${slug}` };
      const tokenData = await Notifications.getExpoPushTokenAsync(tokenOpts as any);
      pushToken = tokenData.data; // 'ExponentPushToken[...]'
    } catch {
      // Fallback to device push token for standalone builds
      try {
        const tokenData = await Notifications.getDevicePushTokenAsync();
        pushToken = tokenData?.data ?? null;
      } catch { /* ignore */ }
    }

    if (pushToken) {
      await apiRequest('/auth/fcm-token', 'POST', { fcmToken: pushToken }, authToken);
      console.log('[Auth] Push token registered:', pushToken.slice(0, 30) + '...');
    }
  } catch (e) {
    console.warn('[Auth] FCM token registration skipped:', (e as Error).message);
  }
}

const TOKEN_KEY = 'panc_auth_token';
const PHRASE_KEY = 'panc_safe_phrase';

export interface AuthUser {
  _id?: string;
  email: string;
  fullName: string;
  phone: string;
  settings?: Record<string, unknown>;
}

interface SignupPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  contact?: { name: string; phone: string; relationship: string };
  safePhrase?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  safePhrase: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [safePhrase, setSafePhraseState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-load secure storage into memory cache on native before reading tokens
    initStorage().then(() => {
    const stored = storage.getItem(TOKEN_KEY);
    const phrase = storage.getItem(PHRASE_KEY);
    if (phrase) setSafePhraseState(phrase);
    if (stored) {
      setToken(stored);
      apiRequest<{ user: AuthUser }>('/auth/me', 'GET', undefined, stored)
        .then(({ user }) => {
          setUser(user);
          // Re-register push token on every app open so stale/missing tokens are refreshed
          registerFcmToken(stored).catch(() => {});
        })
        .catch(() => {
          storage.removeItem(TOKEN_KEY);
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
    }); // end initStorage().then
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const data = await apiRequest<{ token: string; user: AuthUser }>(
      '/auth/login', 'POST', { email, password }
    );
    storage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    registerFcmToken(data.token).catch(() => {});
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    setError(null);
    const { email, password, fullName, phone, contact, safePhrase } = payload;

    const data = await apiRequest<{ token: string; user: AuthUser }>(
      '/auth/signup', 'POST', { email, password, fullName, phone }
    );
    storage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    registerFcmToken(data.token).catch(() => {});

    if (contact?.name) {
      await apiRequest('/contacts', 'POST', contact, data.token).catch(() => {});
    }

    if (safePhrase?.trim()) {
      storage.setItem(PHRASE_KEY, safePhrase.trim());
      setSafePhraseState(safePhrase.trim());
      await apiRequest('/auth/safe-phrase', 'POST', { safePhrase: safePhrase.trim() }, data.token).catch(() => {});
    }
  }, []);

  const logout = useCallback(() => {
    apiRequest('/auth/logout', 'POST').catch(() => {});
    storage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, token, safePhrase, isLoading, error, login, signup, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
