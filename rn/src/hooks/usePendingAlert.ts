import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { apiRequest } from '../utils/apiClient';
import { useAuth } from '../context/AuthContext';

export interface PendingAlert {
  incidentId: string;
  triggeredBy: string;
  userName: string;
  locationDisplay: string;
  helpLink: string;
  docBundleLink: string | null;
  triggeredAt: string;
  status: 'active' | 'disarmed';
  read: boolean;
}

export function usePendingAlert() {
  const { token } = useAuth();
  const [pendingAlert, setPendingAlert] = useState<PendingAlert | null>(null);
  const [checked, setChecked] = useState(false);

  const check = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<{ pendingAlert: PendingAlert | null }>(
        '/panic/pending-alert', 'GET', undefined, token
      );
      setPendingAlert(data.pendingAlert || null);
    } catch {
      // silently ignore — non-critical
    } finally {
      setChecked(true);
    }
  }, [token]);

  const dismiss = useCallback(async (incidentId: string) => {
    if (!token) return;
    try {
      await apiRequest('/panic/pending-alert/dismiss', 'POST', { incidentId }, token);
      setPendingAlert(null);
    } catch {
      setPendingAlert(null);
    }
  }, [token]);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  return { pendingAlert, dismiss, checked };
}
