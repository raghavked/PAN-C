import React, { CSSProperties } from 'react';
import { PanicButton } from '../components/panic/PanicButton';
import { Card } from '../components/cards/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { colors, spacingNum, typography } from '../theme';

interface HomeScreenProps {
  onPanic: () => void;
  isPanicActive: boolean;
  onNavigate: (screen: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onPanic, isPanicActive, onNavigate }) => {
  const contentStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    paddingLeft: spacingNum.lg,
    paddingRight: spacingNum.lg,
    paddingTop: spacingNum.lg,
    paddingBottom: spacingNum.xxl,
  };

  const welcomeStyle: CSSProperties = {
    marginBottom: spacingNum.xxl,
  };

  const greetingStyle: CSSProperties = {
    ...typography.headlineMedium,
    color: colors.onSurface,
    marginBottom: spacingNum.xs,
  };

  const lastCheckInStyle: CSSProperties = {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  };

  const cardHeaderStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingNum.sm,
  };

  const cardTitleStyle: CSSProperties = {
    ...typography.headlineSmall,
    color: colors.onSurface,
  };

  const cardTextStyle: CSSProperties = {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
  };

  const alertBannerStyle: CSSProperties = {
    backgroundColor: colors.errorContainer,
    border: `1px solid ${colors.primary}`,
    borderRadius: 8,
    padding: spacingNum.lg,
    marginBottom: spacingNum.lg,
    display: 'flex',
    alignItems: 'center',
    gap: spacingNum.md,
  };

  return (
    <div style={contentStyle}>
      {isPanicActive && (
        <div style={alertBannerStyle}>
          <span style={{ fontSize: 24 }}>🚨</span>
          <div>
            <p style={{ ...typography.labelLarge, color: colors.error, marginBottom: 4 }}>
              EMERGENCY ACTIVE
            </p>
            <p style={{ ...typography.bodySmall, color: colors.onErrorContainer }}>
              Contacts have been notified. Tap the button below to disarm.
            </p>
          </div>
        </div>
      )}

      <div style={welcomeStyle}>
        <h2 style={greetingStyle}>Welcome, Alex</h2>
        <p style={lastCheckInStyle}>Last check-in: 2 hours ago</p>
      </div>

      <PanicButton onPress={onPanic} isActive={isPanicActive} />

      <Card onClick={() => onNavigate('map')}>
        <div style={cardHeaderStyle}>
          <span style={cardTitleStyle}>🗺️ Activity Heat Map</span>
          <StatusBadge label="2 Reports" status="active" />
        </div>
        <p style={cardTextStyle}>Recent ICE activity reported in your area</p>
      </Card>

      <Card onClick={() => onNavigate('documents')}>
        <div style={cardHeaderStyle}>
          <span style={cardTitleStyle}>📄 Documents</span>
          <StatusBadge label="3 Ready" status="success" />
        </div>
        <p style={cardTextStyle}>✓ Passport &nbsp;|&nbsp; ✓ Visa &nbsp;|&nbsp; ✓ ID</p>
      </Card>

      <Card onClick={() => onNavigate('contacts')}>
        <div style={cardHeaderStyle}>
          <span style={cardTitleStyle}>👥 Contacts</span>
          <StatusBadge label="4 Added" status="success" />
        </div>
        <p style={cardTextStyle}>🔔 Check-in timer: 30 minutes</p>
      </Card>

      <Card>
        <div style={cardHeaderStyle}>
          <span style={cardTitleStyle}>⚙️ Safe Phrase</span>
          <StatusBadge label="Set" status="success" />
        </div>
        <p style={cardTextStyle}>Your disarm phrase is configured and ready</p>
      </Card>
    </div>
  );
};
