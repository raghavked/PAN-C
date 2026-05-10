import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { contactsApi, documentsApi, checkinApi, panicApi, type CheckInSettings } from '../services/api';
import { colors } from '../theme/colors';

type Screen = 'home' | 'contacts' | 'documents' | 'checkin' | 'chat' | 'panic';

interface Props {
  onNavigate: (screen: Screen) => void;
  onPanic: () => void;
}

export default function HomeScreen({ onNavigate, onPanic }: Props) {
  const { user, logout } = useAuth();
  const [contactCount, setContactCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [checkin, setCheckin] = useState<{ settings: CheckInSettings; minutesRemaining: number; isOverdue: boolean } | null>(null);
  const [safePhrase, setSafePhrase] = useState('');
  const [safePhraseInput, setSafePhraseInput] = useState('');
  const [safePhraseEditing, setSafePhraseEditing] = useState(false);
  const [safePhraseStatus, setSafePhraseStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const loadData = useCallback(async () => {
    try {
      const [contacts, docs, ci] = await Promise.all([
        contactsApi.getAll(),
        documentsApi.getAll(),
        checkinApi.getStatus(),
      ]);
      setContactCount(contacts.contacts.length);
      setDocCount(docs.documents.length);
      setCheckin(ci);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const phrase = (user as Record<string, unknown>)?.safePhrase as string ?? '';
    setSafePhrase(phrase);
    setSafePhraseInput(phrase);
  }, [user]);

  const handleSaveSafePhrase = async () => {
    if (!safePhraseInput.trim() || safePhraseInput.length < 4) return;
    setSafePhraseStatus('saving');
    try {
      await panicApi.setSafePhrase(safePhraseInput.trim());
      setSafePhrase(safePhraseInput.trim());
      setSafePhraseEditing(false);
      setSafePhraseStatus('saved');
      setTimeout(() => setSafePhraseStatus('idle'), 2000);
    } catch {
      setSafePhraseStatus('error');
      setTimeout(() => setSafePhraseStatus('idle'), 2000);
    }
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
      const ci = await checkinApi.getStatus();
      setCheckin(ci);
    } catch { /* ignore */ }
  };

  const handleSnooze = async () => {
    try {
      await checkinApi.snooze(5);
      const ci = await checkinApi.getStatus();
      setCheckin(ci);
    } catch { /* ignore */ }
  };

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.welcomeText}>Welcome, {firstName} 👋</div>
          <div style={styles.appName}>PAN<span style={styles.exclaim}>!</span>C</div>
        </div>
        <button style={styles.settingsBtn} onClick={logout} title="Log out">⚙️</button>
      </div>

      {/* Check-In Banner */}
      {checkin && (
        <div style={{
          ...styles.checkinBanner,
          borderColor: checkin.isOverdue ? colors.alertRed : colors.border,
          background: checkin.isOverdue ? 'rgba(226,75,74,0.1)' : colors.surface1,
        }}>
          <div style={styles.checkinLeft}>
            <span style={{ fontSize: 20 }}>{checkin.isOverdue ? '⚠️' : '⏰'}</span>
            <div>
              <div style={{ ...styles.checkinTitle, color: checkin.isOverdue ? colors.alertRed : colors.textPrimaryPrimary }}>
                {checkin.isOverdue ? 'Check-In Overdue!' : `Check-In: ${checkin.minutesRemaining} min remaining`}
              </div>
              <div style={styles.checkinSub}>Every {checkin.settings.intervalMinutes} minutes</div>
            </div>
          </div>
          <div style={styles.checkinBtns}>
            <button style={styles.snoozeBtn} onClick={handleSnooze}>Snooze 5 min</button>
            <button style={styles.checkInNowBtn} onClick={handleCheckIn}>Check In Now</button>
          </div>
        </div>
      )}

      {/* PANIC Button */}
      <div style={styles.panicSection}>
        <button style={styles.panicButton} onClick={onPanic}>
          <span style={styles.panicIcon}>🚨</span>
          <span style={styles.panicText}>PAN!C</span>
          <span style={styles.panicIcon}>🚨</span>
        </button>
        <div style={styles.panicSubtext}>TAP IF YOU NEED HELP</div>
      </div>

      {/* Quick Nav Grid */}
      <div style={styles.quickNav}>
        {[
          { icon: '📞', label: 'Contacts', count: contactCount, screen: 'contacts' as Screen },
          { icon: '📄', label: 'Documents', count: docCount, screen: 'documents' as Screen },
          { icon: '⏰', label: 'Check-In', count: null, screen: 'checkin' as Screen },
          { icon: '💬', label: 'Chat with PAN!C', count: null, screen: 'chat' as Screen },
        ].map(item => (
          <button key={item.screen} style={styles.navCard} onClick={() => onNavigate(item.screen)}>
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
            {item.count !== null && (
              <span style={styles.navCount}>{item.count} added</span>
            )}
          </button>
        ))}
      </div>

      {/* Your Info */}
      <div style={styles.infoCard}>
        <div style={styles.infoTitle}>Your Info</div>
        <div style={styles.infoRow}>
          <span style={{ color: contactCount > 0 ? colors.success : colors.warning }}>
            {contactCount > 0 ? '✓' : '⚠'} {contactCount} Contact{contactCount !== 1 ? 's' : ''}
          </span>
          <span style={{ color: docCount > 0 ? colors.success : colors.warning }}>
            {docCount > 0 ? '✓' : '⚠'} {docCount} Document{docCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Safe Phrase */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: colors.textPrimarySecondary, marginBottom: 6 }}>
            SAFE PHRASE {safePhrase ? '✓' : '⚠ not set'}
          </div>
          {safePhraseEditing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                value={safePhraseInput}
                onChange={e => setSafePhraseInput(e.target.value)}
                placeholder="Min 4 characters"
                maxLength={30}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface2, color: colors.textPrimary, fontSize: 14 }}
              />
              <button onClick={handleSaveSafePhrase} disabled={safePhraseStatus === 'saving'}
                style={{ padding: '8px 14px', borderRadius: 8, background: colors.alertRed, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                {safePhraseStatus === 'saving' ? '...' : 'Save'}
              </button>
              <button onClick={() => { setSafePhraseEditing(false); setSafePhraseInput(safePhrase); }}
                style={{ padding: '8px 14px', borderRadius: 8, background: colors.surface2, color: colors.textPrimary, border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: safePhrase ? colors.success : colors.warning, fontSize: 14 }}>
                {safePhrase ? '••••••••' : 'Tap to set a safe phrase'}
              </span>
              <button onClick={() => setSafePhraseEditing(true)}
                style={{ fontSize: 12, color: colors.alertRed, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {safePhrase ? 'Change' : 'Set'}
              </button>
            </div>
          )}
          {safePhraseStatus === 'saved' && <div style={{ fontSize: 12, color: colors.success, marginTop: 4 }}>Saved!</div>}
          {safePhraseStatus === 'error' && <div style={{ fontSize: 12, color: colors.alertRed, marginTop: 4 }}>Failed to save</div>}
        </div>

        <button style={styles.editProfileBtn} onClick={() => onNavigate('contacts')}>
          Edit Profile →
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: colors.base,
    paddingBottom: 80,
    fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 16px 16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  welcomeText: { fontSize: 14, color: colors.textPrimarySecondary, marginBottom: 2 },
  appName: { fontSize: 28, fontWeight: 800, color: colors.textPrimaryPrimary, letterSpacing: '-1px' },
  exclaim: { color: colors.alertRed },
  settingsBtn: { background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4 },
  checkinBanner: {
    margin: '12px 16px',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  checkinLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  checkinTitle: { fontSize: 14, fontWeight: 700 },
  checkinSub: { fontSize: 12, color: colors.textPrimaryMuted },
  checkinBtns: { display: 'flex', gap: 8 },
  snoozeBtn: {
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    color: colors.textPrimarySecondary,
    fontSize: 12,
    padding: '6px 10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  checkInNowBtn: {
    background: colors.alertRed,
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    padding: '6px 10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  panicSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '28px 16px 20px',
  },
  panicButton: {
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: colors.alertRed,
    border: `4px solid ${colors.alertRedLight}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: `0 0 0 8px rgba(226,75,74,0.2), 0 0 0 16px rgba(226,75,74,0.1)`,
    gap: 4,
    fontFamily: 'inherit',
  },
  panicIcon: { fontSize: 28 },
  panicText: { fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1 },
  panicSubtext: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.textPrimarySecondary,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginTop: 12,
  },
  quickNav: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    padding: '0 16px',
    marginBottom: 16,
  },
  navCard: {
    background: colors.surface1,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    cursor: 'pointer',
    gap: 4,
    fontFamily: 'inherit',
  },
  navIcon: { fontSize: 24 },
  navLabel: { fontSize: 14, fontWeight: 700, color: colors.textPrimaryPrimary },
  navCount: {
    fontSize: 12,
    color: colors.textPrimaryMuted,
    background: colors.surface2,
    borderRadius: 20,
    padding: '2px 8px',
    marginTop: 2,
  },
  infoCard: {
    margin: '0 16px',
    background: colors.surface1,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.textPrimarySecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  infoRow: { display: 'flex', gap: 16, fontSize: 14, fontWeight: 600, marginBottom: 12 },
  editProfileBtn: {
    background: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    color: colors.textPrimarySecondary,
    fontSize: 13,
    padding: '6px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
