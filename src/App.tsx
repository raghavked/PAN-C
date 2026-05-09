import React, { useState, CSSProperties } from 'react';
import { Header } from './components/common/Header';
import { TabBar } from './components/common/TabBar';
import { HomeScreen } from './screens/HomeScreen';
import { PanicActiveScreen } from './screens/PanicActiveScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { DocumentsScreen } from './screens/DocumentsScreen';
import { usePanic } from './hooks/usePanic';
import { colors } from './theme';

type Screen = 'home' | 'panic' | 'contacts' | 'documents' | 'map';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'map', label: 'Map', icon: '🗺️' },
  { key: 'documents', label: 'Docs', icon: '📄' },
  { key: 'contacts', label: 'Contacts', icon: '👥' },
];

const SCREEN_TITLES: Record<Screen, string> = {
  home: 'ICE Panic Button',
  panic: '🚨 Emergency Active',
  contacts: 'Emergency Contacts',
  documents: 'Document Vault',
  map: 'Activity Map',
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const { isActive, incidentId, triggerPanic, disarmPanic } = usePanic();

  const appStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    maxWidth: 480,
    margin: '0 auto',
    backgroundColor: colors.background,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 0 60px rgba(0,0,0,0.8)',
  };

  const mainStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const handlePanic = async () => {
    if (isActive) {
      setCurrentScreen('panic');
      return;
    }
    await triggerPanic();
    setCurrentScreen('panic');
  };

  const handleDisarm = async (phrase: string) => {
    const success = await disarmPanic(phrase);
    if (success) {
      setCurrentScreen('home');
    } else {
      alert('Incorrect safe phrase. Please try again.');
    }
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  const handleTabChange = (key: string) => {
    if (key === 'map') {
      setCurrentScreen('map');
    } else {
      setCurrentScreen(key as Screen);
    }
  };

  const activeTabKey = currentScreen === 'panic' ? 'home' : currentScreen;

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onPanic={handlePanic}
            isPanicActive={isActive}
            onNavigate={handleNavigate}
          />
        );
      case 'panic':
        return (
          <PanicActiveScreen
            incidentId={incidentId}
            onDisarm={handleDisarm}
          />
        );
      case 'contacts':
        return <ContactsScreen />;
      case 'documents':
        return <DocumentsScreen />;
      case 'map':
        return <MapPlaceholder />;
      default:
        return null;
    }
  };

  return (
    <div style={appStyle}>
      {currentScreen !== 'panic' && (
        <Header
          title={SCREEN_TITLES[currentScreen]}
          onBack={currentScreen !== 'home' ? () => setCurrentScreen('home') : undefined}
          rightAction={
            currentScreen === 'home'
              ? { label: '⚙️', onPress: () => console.log('Settings') }
              : undefined
          }
        />
      )}

      <main style={mainStyle}>
        {renderScreen()}
      </main>

      {currentScreen !== 'panic' && (
        <TabBar
          tabs={TABS}
          activeTab={activeTabKey}
          onTabChange={handleTabChange}
        />
      )}
    </div>
  );
}

// Map placeholder screen
const MapPlaceholder: React.FC = () => {
  const style: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
    color: colors.onSurfaceVariant,
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    textAlign: 'center',
  };

  return (
    <div style={style}>
      <span style={{ fontSize: 64 }}>🗺️</span>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: colors.onSurface }}>
        Activity Heat Map
      </h2>
      <p style={{ fontSize: '1rem', lineHeight: '1.5rem' }}>
        Real-time ICE activity reports from your community will appear here.
      </p>
      <p style={{ fontSize: '0.875rem', color: colors.primary }}>
        Coming in next sprint →
      </p>
    </div>
  );
};
