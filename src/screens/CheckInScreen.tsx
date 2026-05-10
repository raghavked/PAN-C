import React, { useEffect, useState, useCallback } from 'react';
import { checkinApi, type CheckInSettings, type CheckInHistory } from '../services/api';
import { colors } from '../theme/colors';

interface Props {
  onBack: () => void;
}

const INTERVAL_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: '8 hours', value: 480 },
];

export default function CheckInScreen({ onBack }: Props) {
  const [settings, setSettings] = useState<CheckInSettings | null>(null);
  const [history, setHistory] = useState<CheckInHistory[]>([]);
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [interval, setInterval2] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [status, hist] = await Promise.all([
        checkinApi.getStatus(),
        checkinApi.getHistory(10),
      ]);
      setSettings(status.settings);
      setMinutesRemaining(status.minutesRemaining);
      setIsOverdue(status.isOverdue);
      setInterval2(status.settings.intervalMinutes);
      setHistory(hist.history);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveInterval = async () => {
    setSaving(true);
    try {
      await checkinApi.updateSettings({ intervalMinutes: interval, isActive: true });
      await load();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleCheckIn = async () => {
    try {
      let location: { latitude: number; longitude: number } | undefined;
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            pos => { location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }; resolve(); },
            () => resolve(), { timeout: 3000 }
          );
        });
      }
      await checkinApi.checkIn(location);
      setCheckedIn(true);
      setTimeout(() => setCheckedIn(false), 3000);
      await load();
    } catch { /* ignore */ }
  };

  const handleSnooze = async (mins: number) => {
    try {
      await checkinApi.snooze(mins);
      await load();
    } catch { /* ignore */ }
  };

  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 style={styles.title}>⏰ Check-In Timer</h1>
        <div style={{ width: 60 }} />
      </div>

      {loading ? (
        <div style={styles.loadingText}>Loading...</div>
      ) : (
        <>
          {/* Status Card */}
          <div style={{ ...styles.statusCard, borderColor: isOverdue ? colors.alertRed : colors.border, background: isOverdue ? 'rgba(226,75,74,0.08)' : colors.surface1 }}>
            <div style={styles.statusIcon}>{isOverdue ? '⚠️' : checkedIn ? '✅' : '⏰'}</div>
            <div style={styles.statusInfo}>
              {checkedIn ? (
                <div style={{ ...styles.statusTitle, color: colors.success }}>Checked In! ✓</div>
              ) : isOverdue ? (
                <div style={{ ...styles.statusTitle, color: colors.alertRed }}>Check-In Overdue!</div>
              ) : (
                <div style={styles.statusTitle}>
                  {minutesRemaining !== null ? `${formatTime(minutesRemaining)} remaining` : 'Timer Active'}
                </div>
              )}
              <div style={styles.statusSub}>
                Every {settings ? formatTime(settings.intervalMinutes) : '—'}
              </div>
              {settings?.lastCheckedInAt && (
                <div style={styles.statusSub}>
                  Last check-in: {new Date(settings.lastCheckedInAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Check In Button */}
          <div style={styles.checkInSection}>
            <button style={styles.checkInBtn} onClick={handleCheckIn}>
              ✅ I'm Safe — Check In Now
            </button>
            <div style={styles.snoozeRow}>
              <span style={styles.snoozeLabel}>Snooze:</span>
              {[5, 10, 15, 30].map(m => (
                <button key={m} style={styles.snoozeBtn} onClick={() => handleSnooze(m)}>+{m}m</button>
              ))}
            </div>
          </div>

          {/* Interval Settings */}
          <div style={styles.settingsCard}>
            <div style={styles.settingsTitle}>Check-In Interval</div>
            <div style={styles.intervalGrid}>
              {INTERVAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  style={{ ...styles.intervalBtn, ...(interval === opt.value ? styles.intervalBtnActive : {}) }}
                  onClick={() => setInterval2(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button style={styles.saveBtn} onClick={handleSaveInterval} disabled={saving}>
              {saving ? 'Saving...' : 'Save Interval'}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={styles.historySection}>
              <div style={styles.historyTitle}>Recent Check-Ins</div>
              {history.map((h, i) => (
                <div key={i} style={styles.historyRow}>
                  <span style={{ color: h.status === 'on_time' ? colors.success : colors.warning }}>
                    {h.status === 'on_time' ? '✓' : '⚠'}
                  </span>
                  <span style={styles.historyTime}>{new Date(h.checkedInAt).toLocaleString()}</span>
                  <span style={{ ...styles.historyStatus, color: h.status === 'on_time' ? colors.success : colors.warning }}>
                    {h.status === 'on_time' ? 'On time' : 'Late'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: colors.base, fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif', paddingBottom: 80 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: `1px solid ${colors.border}`, position: 'sticky', top: 0, background: colors.base, zIndex: 10 },
  backBtn: { background: 'transparent', border: 'none', color: colors.alertRed, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  title: { fontSize: 18, fontWeight: 700, color: colors.textPrimary, margin: 0 },
  loadingText: { color: colors.textSecondary, textAlign: 'center', padding: 48 },
  statusCard: { margin: '16px', padding: '20px', borderRadius: 16, border: '1px solid', display: 'flex', alignItems: 'center', gap: 16 },
  statusIcon: { fontSize: 40 },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 20, fontWeight: 700, color: colors.textPrimary },
  statusSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  checkInSection: { padding: '0 16px 16px' },
  checkInBtn: { width: '100%', background: colors.success, border: 'none', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, padding: '16px', cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' },
  snoozeRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const },
  snoozeLabel: { fontSize: 13, color: colors.textMuted },
  snoozeBtn: { background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.textSecondary, fontSize: 13, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' },
  settingsCard: { margin: '0 16px 16px', background: colors.surface1, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 20 },
  settingsTitle: { fontSize: 14, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 },
  intervalGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 },
  intervalBtn: { background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.textSecondary, fontSize: 14, padding: '10px', cursor: 'pointer', fontFamily: 'inherit' },
  intervalBtnActive: { background: colors.alertRed, border: `1px solid ${colors.alertRed}`, color: '#fff', fontWeight: 700 },
  saveBtn: { width: '100%', background: colors.alertRed, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px', cursor: 'pointer', fontFamily: 'inherit' },
  historySection: { margin: '0 16px', background: colors.surface1, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 20 },
  historyTitle: { fontSize: 14, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 },
  historyRow: { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${colors.border}` },
  historyTime: { flex: 1, fontSize: 13, color: colors.textSecondary },
  historyStatus: { fontSize: 12, fontWeight: 700 },
};
