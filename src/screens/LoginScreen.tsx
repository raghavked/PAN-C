import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

interface Props {
  onSignUp: () => void;
}

export default function LoginScreen({ onSignUp }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Email and password are required'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>PAN<span style={styles.exclaim}>!</span>C</div>
        <div style={styles.tagline}>Personal Alert Network · Interactive Crisis Communication</div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>Welcome back</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.label}>Email</label>
        <input style={styles.input} type="email" placeholder="you@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />

        <label style={styles.label}>Password</label>
        <div style={styles.passwordRow}>
          <input
            style={{ ...styles.input, flex: 1, marginBottom: 0 }}
            type={showPassword ? 'text' : 'password'}
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <button style={styles.primaryBtn} onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : '🔓 Log In'}
        </button>

        <div style={styles.divider} />

        <button style={styles.secondaryBtn} onClick={onSignUp}>
          New to PAN!C? Create account
        </button>
      </div>

      <p style={styles.footer}>
        Your data is encrypted and stored securely in MongoDB Atlas.
      </p>
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
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif',
  },
  header: { textAlign: 'center', marginBottom: 32 },
  logo: { fontSize: 56, fontWeight: 800, color: colors.textPrimary, letterSpacing: '-2px', lineHeight: 1 },
  exclaim: { color: colors.alertRed },
  tagline: { color: colors.textSecondary, fontSize: 13, marginTop: 8 },
  card: {
    background: colors.surface1,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
  },
  title: { fontSize: 24, fontWeight: 700, color: colors.textPrimary, margin: '0 0 20px 0' },
  errorBox: {
    background: 'rgba(226,75,74,0.15)',
    border: `1px solid ${colors.alertRed}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: colors.alertRed,
    fontSize: 14,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
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
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '14px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: 'inherit',
  },
  divider: { height: 1, background: colors.border, margin: '20px 0' },
  secondaryBtn: {
    background: 'transparent',
    color: colors.alertRed,
    border: `2px solid ${colors.alertRed}`,
    borderRadius: 8,
    padding: '12px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  footer: { color: colors.textMuted, fontSize: 12, marginTop: 24, textAlign: 'center', maxWidth: 300 },
};
