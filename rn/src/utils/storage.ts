const isWeb = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const storage = {
  getItem: (key: string): string | null => {
    if (isWeb) return localStorage.getItem(key);
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (isWeb) localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (isWeb) localStorage.removeItem(key);
  },
};
