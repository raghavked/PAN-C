import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { contactsApi, panicApi } from '../services/api';
import { fcmService } from '../services/fcmService';
import { colors } from '../theme/colors';

interface Props {
  onComplete: () => void;
  onLogin: () => void;
}

type Step = 1 | 2 | 3 | 4;

export default function SignUpScreen({ onComplete, onLogin }: Props) {
  const { signup } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 — Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 — Add Contact
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRelationship, setContactRelationship] = useState('Family');

  // Step 3 — Upload Document (skip for now, handled in Documents screen)

  // Step 4 — Safe Phrase
  const [safePhrase, setSafePhrase] = useState('');
  const [safePhraseConfirm, setSafePhraseConfirm] = useState('');

  const stepLabels = ['Create Account', 'Add Contact', 'Upload Documents', 'Safe Phrase'];

  const handleStep1 = async () => {
    if (!email || !password || !fullName || !phone) {
      setError('All fields are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signup({ email, password, fullName, phone });
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (contactName && contactPhone) {
      setLoading(true);
      try {
        await contactsApi.create({
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
          relationship: contactRelationship,
          notifyVia: { sms: true, email: !!contactEmail, push: false },
          canSeeDocuments: true,
          canSeeLocation: true,
          isPrimary: true,
        });
      } catch (e) {
        // Non-blocking — user can add contacts later
        console.warn('Contact creation failed:', e);
      } finally {
        setLoading(false);
      }
    }
    setStep(3);
  };

  const handleStep3 = () => {
    // Document upload is optional during onboarding
    setStep(4);
  };

  const handleStep4 = async () => {
    if (!safePhrase) {
      setError('Safe phrase is required');
      return;
    }
    if (safePhrase !== safePhraseConfirm) {
      setError('Safe phrases do not match');
      return;
    }
    if (safePhrase.length < 4) {
      setError('Safe phrase must be at least 4 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await panicApi.setSafePhrase(safePhrase);
      // Register device for push notifications (non-blocking)
      fcmService.setupPushNotifications().catch(() => {});
      onComplete();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to set safe phrase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>PAN<span style={styles.logoExclaim}>!</span>C</div>
        <div style={styles.tagline}>Personal Alert Network · Interactive Crisis Communication</div>
      </div>

      {/* Step indicator */}
      <div style={styles.stepRow}>
        {stepLabels.map((label, i) => (
          <div key={i} style={styles.stepItem}>
            <div style={{
              ...styles.stepDot,
              background: i + 1 <= step ? colors.alertRed : colors.surface2,
              border: `2px solid ${i + 1 === step ? colors.alertRed : colors.border}`,
            }}>
              {i + 1 < step ? '✓' : i + 1}
            </div>
            <div style={{ ...styles.stepLabel, color: i + 1 === step ? colors.textPrimary : colors.textMuted }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={styles.card}>
        <div style={styles.stepHeader}>
          <span style={styles.stepTitle}>{stepLabels[step - 1]}</span>
          <span style={styles.stepCount}>{step} of 4</span>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Step 1 */}
        {step === 1 && (
          <div style={styles.fields}>
            <label style={styles.label}>Email *</label>
            <input style={styles.input} type="email" placeholder="you@email.com" value={email}
              onChange={e => setEmail(e.target.value)} />

            <label style={styles.label}>Password *</label>
            <div style={styles.passwordRow}>
              <input style={{ ...styles.input, flex: 1, marginBottom: 0 }}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)} />
              <button style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <label style={styles.label}>Full Name *</label>
            <input style={styles.input} type="text" placeholder="Your full name" value={fullName}
              onChange={e => setFullName(e.target.value)} />

            <label style={styles.label}>Phone *</label>
            <input style={styles.input} type="tel" placeholder="+1 (___) ___-____" value={phone}
              onChange={e => setPhone(e.target.value)} />

            <button style={styles.primaryBtn} onClick={handleStep1} disabled={loading}>
              {loading ? 'Creating account...' : 'Next →'}
            </button>
            <button style={styles.linkBtn} onClick={onLogin}>Already have an account? Log in</button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={styles.fields}>
            <p style={styles.hint}>Add your first emergency contact. They'll be notified when you press PAN!C.</p>

            <label style={styles.label}>Name *</label>
            <input style={styles.input} type="text" placeholder="Contact name" value={contactName}
              onChange={e => setContactName(e.target.value)} />

            <label style={styles.label}>Phone *</label>
            <input style={styles.input} type="tel" placeholder="+1 (___) ___-____" value={contactPhone}
              onChange={e => setContactPhone(e.target.value)} />

            <label style={styles.label}>Email (optional)</label>
            <input style={styles.input} type="email" placeholder="contact@email.com" value={contactEmail}
              onChange={e => setContactEmail(e.target.value)} />

            <label style={styles.label}>Relationship</label>
            <select style={styles.input} value={contactRelationship}
              onChange={e => setContactRelationship(e.target.value)}>
              {['Family', 'Friend', 'Lawyer', 'Doctor', 'Neighbor', 'Other'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <button style={styles.primaryBtn} onClick={handleStep2} disabled={loading}>
              {loading ? 'Saving...' : 'Next →'}
            </button>
            <button style={styles.secondaryBtn} onClick={() => setStep(3)}>Skip for now</button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={styles.fields}>
            <p style={styles.hint}>Upload important documents (passport, visa, ID). They're encrypted and stored securely. You can do this later from the Documents screen.</p>
            <div style={styles.skipBox}>
              <span style={{ fontSize: 32 }}>📄</span>
              <p style={{ color: colors.textSecondary, margin: '8px 0' }}>Document upload available in the Documents section after setup.</p>
            </div>
            <button style={styles.primaryBtn} onClick={handleStep3}>Next →</button>
            <button style={styles.secondaryBtn} onClick={handleStep3}>Skip for now</button>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div style={styles.fields}>
            <p style={styles.hint}>Set a secret phrase to disarm the panic alert. Only you should know this.</p>

            <label style={styles.label}>Safe Phrase *</label>
            <input style={styles.input} type="password" placeholder="Your secret phrase"
              value={safePhrase} onChange={e => setSafePhrase(e.target.value)} />

            <label style={styles.label}>Confirm Safe Phrase *</label>
            <input style={styles.input} type="password" placeholder="Repeat your phrase"
              value={safePhraseConfirm} onChange={e => setSafePhraseConfirm(e.target.value)} />

            <button style={styles.primaryBtn} onClick={handleStep4} disabled={loading}>
              {loading ? 'Setting up...' : '🚨 Launch PAN!C'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: colors.base,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px',
    fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif',
  },
  header: { textAlign: 'center', marginBottom: 24 },
  logo: {
    fontSize: 48,
    fontWeight: 800,
    color: colors.textPrimary,
    letterSpacing: '-2px',
    lineHeight: 1,
  },
  logoExclaim: { color: colors.alertRed },
  tagline: { color: colors.textSecondary, fontSize: 13, marginTop: 6 },
  stepRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 420,
    justifyContent: 'space-between',
  },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepLabel: { fontSize: 10, fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' },
  card: {
    background: colors.surface1,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
  },
  stepHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  stepTitle: { fontSize: 20, fontWeight: 700, color: colors.textPrimary },
  stepCount: { fontSize: 13, color: colors.textMuted },
  errorBox: {
    background: 'rgba(226,75,74,0.15)',
    border: `1px solid ${colors.alertRed}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: colors.alertRed,
    fontSize: 14,
    marginBottom: 16,
  },
  fields: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, fontWeight: 700, color: colors.textSecondary, marginBottom: 4, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: '12px 14px',
    color: colors.textPrimary,
    fontSize: 16,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: 4,
    fontFamily: 'inherit',
  },
  passwordRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 },
  eyeBtn: {
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: '12px',
    cursor: 'pointer',
    fontSize: 16,
    flexShrink: 0,
  },
  primaryBtn: {
    background: colors.alertRed,
    color: colors.textPrimary,
    border: 'none',
    borderRadius: 8,
    padding: '14px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'inherit',
  },
  secondaryBtn: {
    background: 'transparent',
    color: colors.alertRed,
    border: `2px solid ${colors.alertRed}`,
    borderRadius: 8,
    padding: '12px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
    fontFamily: 'inherit',
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: colors.textSecondary,
    fontSize: 14,
    cursor: 'pointer',
    marginTop: 12,
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
  hint: { color: colors.textSecondary, fontSize: 14, lineHeight: 1.5, marginBottom: 8 },
  skipBox: {
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
};
