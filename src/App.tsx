import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { panicApi } from './services/api';
import { colors } from './theme/colors';

// Screens
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import ContactsScreen from './screens/ContactsScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import CheckInScreen from './screens/CheckInScreen';
import ChatScreen from './screens/ChatScreen';
import PanicActiveScreen from './screens/PanicActiveScreen';

type Screen = 'home' | 'contacts' | 'documents' | 'checkin' | 'chat' | 'panic';

// ─── Inner app (has auth context) ────────────────────────────────────────────
function AppInner() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [screen, setScreen] = useState<Screen>('home');
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [contactsNotified, setContactsNotified] = useState(0);

  // If panic was active when user refreshed, restore panic screen
  useEffect(() => {
    const saved = localStorage.getItem('panic_incident_id');
    if (saved) {
      setIncidentId(saved);
      setScreen('panic');
    }
  }, []);

  const handlePanic = async () => {
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
      const result = await panicApi.trigger(location);
      setIncidentId(result.incidentId);
      setContactsNotified(Array.isArray(result.contactsNotified) ? result.contactsNotified.length : 0);
      localStorage.setItem('panic_incident_id', result.incidentId);
      setScreen('panic');
    } catch (e) {
      // Even if API fails, show panic screen
      const fallbackId = `INC-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
      setIncidentId(fallbackId);
      localStorage.setItem('panic_incident_id', fallbackId);
      setScreen('panic');
    }
  };

  const handleDisarmed = () => {
    localStorage.removeItem('panic_incident_id');
    setIncidentId(null);
    setContactsNotified(0);
    setScreen('home');
  };

  if (isLoading) {
    return (
      <div style={styles.splash}>
        <div style={styles.splashLogo}>PAN<span style={{ color: colors.alertRed }}>!</span>C</div>
        <div style={styles.splashSub}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'login'
      ? <LoginScreen onSignUp={() => setAuthView('signup')} />
      : <SignUpScreen onComplete={() => setAuthView('login')} onLogin={() => setAuthView('login')} />;
  }

  // Panic screen — full screen, no nav
  if (screen === 'panic') {
    return (
      <div style={styles.app}>
        <PanicActiveScreen
          incidentId={incidentId}
          contactsNotified={contactsNotified}
          onDisarmed={handleDisarmed}
        />
      </div>
    );
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen onNavigate={(s) => setScreen(s as Screen)} onPanic={handlePanic} />;
      case 'contacts':
        return <ContactsScreen onBack={() => setScreen('home')} />;
      case 'documents':
        return <DocumentsScreen onBack={() => setScreen('home')} />;
      case 'checkin':
        return <CheckInScreen onBack={() => setScreen('home')} />;
      case 'chat':
        return <ChatScreen onBack={() => setScreen('home')} />;
      default:
        return <HomeScreen onNavigate={(s) => setScreen(s as Screen)} onPanic={handlePanic} />;
    }
  };

  return (
    <div style={styles.app}>
      {renderScreen()}
    </div>
  );
}

// ─── Root with provider ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    maxWidth: 480,
    margin: '0 auto',
    minHeight: '100dvh',
    background: colors.base,
    position: 'relative',
    boxShadow: '0 0 60px rgba(0,0,0,0.8)',
    fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif',
  },
  splash: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.base,
    fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif',
  },
  splashLogo: {
    fontSize: 48,
    fontWeight: 900,
    color: colors.textPrimary,
    letterSpacing: '-0.02em',
  },
  splashSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
  },
};
