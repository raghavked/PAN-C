import React, { useState, useEffect } from 'react';
import { panicApi } from '../services/api';
import { colors } from '../theme/colors';

interface Props {
  incidentId: string | null;
  contactsNotified: number;
  onDisarmed: () => void;
}

const RIGHTS = [
  'You have the RIGHT TO REMAIN SILENT.',
  'You do NOT have to open the door without a warrant signed by a judge.',
  'You have the RIGHT TO A LAWYER. Ask for one immediately.',
  'Do NOT sign any documents without a lawyer present.',
  'Say: "I do not consent to a search."',
  'You have the right to make a phone call.',
];

export default function PanicActiveScreen({ incidentId, contactsNotified, onDisarmed }: Props) {
  const [safePhrase, setSafePhrase] = useState('');
  const [disarming, setDisarming] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [showDisarm, setShowDisarm] = useState(false);
  const [rightIndex, setRightIndex] = useState(0);
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setRightIndex(i => (i + 1) % RIGHTS.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setFlash(f => !f), 800);
    return () => clearInterval(t);
  }, []);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleDisarm = async () => {
    if (!safePhrase) { setError('Enter your safe phrase to disarm'); return; }
    if (!incidentId) { setError('No active incident found'); return; }
    setDisarming(true);
    setError('');
    try {
      await panicApi.disarm(incidentId, safePhrase);
      onDisarmed();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Incorrect safe phrase');
    } finally {
      setDisarming(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ ...styles.emergencyHeader, background: flash ? colors.alertRed : colors.alertRedDark }}>
        <div style={styles.emergencyTitle}>🚨 EMERGENCY ACTIVE 🚨</div>
        <div style={styles.emergencyId}>Incident: {incidentId || 'Generating...'}</div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <div style={styles.statValue}>{formatElapsed(elapsed)}</div>
          <div style={styles.statLabel}>Elapsed</div>
        </div>
        <div style={styles.statBox}>
          <div style={{ ...styles.statValue, color: contactsNotified > 0 ? colors.success : colors.warning }}>
            {contactsNotified}
          </div>
          <div style={styles.statLabel}>Contacts Notified</div>
        </div>
      </div>

      <div style={styles.waveformRow}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            width: 6,
            borderRadius: 3,
            background: colors.alertRed,
            height: `${20 + Math.sin((elapsed + i) * 0.8) * 15}px`,
            transition: 'height 0.3s',
          }} />
        ))}
      </div>
      <div style={styles.waveLabel}>HELP — ICE / MIGRA — HELP</div>

      <div style={styles.rightsCard}>
        <div style={styles.rightsTitle}>YOUR RIGHTS</div>
        <div style={styles.rightsText}>{RIGHTS[rightIndex]}</div>
        <div style={styles.rightsDots}>
          {RIGHTS.map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === rightIndex ? colors.alertRed : colors.border }} />
          ))}
        </div>
      </div>

      {!showDisarm ? (
        <button style={styles.showDisarmBtn} onClick={() => setShowDisarm(true)}>
          🔓 I am safe — Disarm Alert
        </button>
      ) : (
        <div style={styles.disarmCard}>
          <div style={styles.disarmTitle}>Enter Safe Phrase to Disarm</div>
          {error && <div style={styles.errorBox}>{error}</div>}
          <input
            style={styles.input}
            type="password"
            placeholder="Your secret safe phrase"
            value={safePhrase}
            onChange={e => setSafePhrase(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDisarm()}
            autoFocus
          />
          <div style={styles.disarmBtns}>
            <button style={styles.cancelBtn} onClick={() => { setShowDisarm(false); setSafePhrase(''); setError(''); }}>
              Cancel
            </button>
            <button style={styles.disarmBtn} onClick={handleDisarm} disabled={disarming}>
              {disarming ? 'Disarming...' : '✅ Disarm & Send All-Clear'}
            </button>
          </div>
        </div>
      )}

      <div style={styles.emergencyNumbers}>
        <div style={styles.emergencyNumbersTitle}>Emergency Resources</div>
        <a href="tel:18885877777" style={styles.emergencyLink}>📞 RAICES Legal: 1-888-587-7777</a>
        <a href="tel:18002273222" style={styles.emergencyLink}>📞 ACLU: 1-800-227-3222</a>
        <a href="tel:911" style={styles.emergencyLink}>🚨 Emergency: 911</a>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: colors.base, fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif', paddingBottom: 40 },
  emergencyHeader: { padding: '20px 16px', textAlign: 'center', transition: 'background 0.3s' },
  emergencyTitle: { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '0.05em' },
  emergencyId: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsRow: { display: 'flex', padding: '16px', gap: 12 },
  statBox: { flex: 1, background: colors.surface1, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px', textAlign: 'center' },
  statValue: { fontSize: 28, fontWeight: 800, color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' },
  waveformRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 16px', height: 60 },
  waveLabel: { textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.alertRed, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 },
  rightsCard: { margin: '0 16px 16px', background: colors.surface1, border: `2px solid ${colors.alertRed}`, borderRadius: 16, padding: '20px', minHeight: 120 },
  rightsTitle: { fontSize: 11, fontWeight: 700, color: colors.alertRed, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 },
  rightsText: { fontSize: 16, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.5, minHeight: 50 },
  rightsDots: { display: 'flex', gap: 6, marginTop: 12, justifyContent: 'center' },
  showDisarmBtn: { margin: '0 16px 16px', width: 'calc(100% - 32px)', background: 'transparent', border: `2px solid ${colors.success}`, borderRadius: 12, color: colors.success, fontSize: 16, fontWeight: 700, padding: '16px', cursor: 'pointer', fontFamily: 'inherit' },
  disarmCard: { margin: '0 16px 16px', background: colors.surface1, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 20 },
  disarmTitle: { fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginBottom: 16 },
  errorBox: { background: 'rgba(226,75,74,0.15)', border: `1px solid ${colors.alertRed}`, borderRadius: 8, padding: '10px 14px', color: colors.alertRed, fontSize: 14, marginBottom: 12 },
  input: { background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '12px 14px', color: colors.textPrimary, fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 16 },
  disarmBtns: { display: 'flex', gap: 12 },
  cancelBtn: { flex: 1, background: 'transparent', border: `2px solid ${colors.border}`, borderRadius: 8, color: colors.textSecondary, fontSize: 14, fontWeight: 700, padding: '12px', cursor: 'pointer', fontFamily: 'inherit' },
  disarmBtn: { flex: 2, background: colors.success, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px', cursor: 'pointer', fontFamily: 'inherit' },
  emergencyNumbers: { margin: '0 16px', background: colors.surface1, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 20 },
  emergencyNumbersTitle: { fontSize: 12, fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 },
  emergencyLink: { display: 'block', color: colors.info, fontSize: 14, textDecoration: 'none', padding: '6px 0', borderBottom: `1px solid ${colors.border}` },
};
