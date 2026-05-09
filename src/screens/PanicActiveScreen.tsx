import React, { useEffect, useState, useRef, CSSProperties } from 'react';
import { Card } from '../components/cards/Card';
import { PrimaryButton } from '../components/buttons/PrimaryButton';
import { TextInput } from '../components/inputs/TextInput';
import { colors, spacingNum, typography } from '../theme';

interface PanicActiveScreenProps {
  incidentId: string;
  onDisarm: (phrase: string) => void;
}

export const PanicActiveScreen: React.FC<PanicActiveScreenProps> = ({
  incidentId,
  onDisarm,
}) => {
  const [safePhrase, setSafePhrase] = useState('');
  const [timer, setTimer] = useState(135);
  const [flashOn, setFlashOn] = useState(true);
  const [waveHeights] = useState(() => Array.from({ length: 12 }, () => 10 + Math.random() * 30));
  const animRef = useRef<number | null>(null);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Flash animation for header
  useEffect(() => {
    const flashInterval = setInterval(() => {
      setFlashOn((v) => !v);
    }, 600);
    return () => clearInterval(flashInterval);
  }, []);

  // Waveform animation
  useEffect(() => {
    const bars = document.querySelectorAll('.wave-bar');
    let frame = 0;
    const animate = () => {
      bars.forEach((bar, i) => {
        const height = 8 + Math.abs(Math.sin((frame / 10 + i * 0.8))) * 28;
        (bar as HTMLElement).style.height = `${height}px`;
      });
      frame++;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  const headerStyle: CSSProperties = {
    padding: spacingNum.lg,
    backgroundColor: flashOn ? colors.primary : colors.errorContainer,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacingNum.xs,
    transition: 'background-color 0.3s ease',
  };

  const headerTextStyle: CSSProperties = {
    ...typography.headlineMedium,
    color: colors.onPrimary,
    textAlign: 'center',
  };

  const headerSubStyle: CSSProperties = {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
  };

  const contentStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    paddingLeft: spacingNum.lg,
    paddingRight: spacingNum.lg,
    paddingTop: spacingNum.lg,
    paddingBottom: spacingNum.xxl,
  };

  const audioCardStyle: CSSProperties = {
    backgroundColor: colors.surfaceLevel2,
    border: `2px solid ${colors.primary}`,
    borderRadius: 12,
    padding: spacingNum.lg,
    marginBottom: spacingNum.md,
  };

  const waveformStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 50,
    marginTop: spacingNum.md,
  };

  const timerDisplayStyle: CSSProperties = {
    ...typography.displayLarge,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacingNum.lg,
    marginBottom: spacingNum.lg,
    fontVariantNumeric: 'tabular-nums',
  };

  const labelStyle: CSSProperties = {
    ...typography.labelLarge,
    color: colors.onSurface,
    marginBottom: spacingNum.sm,
    display: 'block',
  };

  const contactItemStyle: CSSProperties = {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    paddingTop: spacingNum.xs,
    paddingBottom: spacingNum.xs,
  };

  return (
    <>
      <div style={headerStyle}>
        <p style={headerTextStyle}>🚨 EMERGENCY ACTIVE 🚨</p>
        <p style={headerSubStyle}>Contacts Notified ✓ &nbsp;|&nbsp; Audio Playing ✓</p>
      </div>

      <div style={contentStyle}>
        {/* Audio Status */}
        <div style={audioCardStyle}>
          <p style={{ ...typography.labelLarge, color: colors.onSurface, marginBottom: spacingNum.xs }}>
            🔊 AUDIO PLAYING
          </p>
          <p style={{ ...typography.bodyMedium, color: colors.primary, fontWeight: '700' }}>
            "HELP — ICE / MIGRA"
          </p>
          <div style={waveformStyle}>
            {waveHeights.map((_, i) => (
              <div
                key={i}
                className="wave-bar"
                style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.primary,
                  borderRadius: 2,
                  transition: 'height 0.1s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Incident ID */}
        <Card>
          <span style={labelStyle}>Incident ID</span>
          <p style={{ ...typography.bodyMedium, color: colors.onSurface, fontFamily: 'monospace' }}>
            {incidentId || 'INC-AB1234-XYZ'}
          </p>
        </Card>

        {/* Contacts Notified */}
        <Card>
          <span style={labelStyle}>✓ Contacts Notified</span>
          <p style={contactItemStyle}>• Mom — SMS sent ✓</p>
          <p style={contactItemStyle}>• Brother — Email sent ✓</p>
          <p style={contactItemStyle}>• Lawyer — SMS + Email ✓</p>
          <p style={contactItemStyle}>• Emergency Hotline — Notified ✓</p>
        </Card>

        {/* Timer */}
        <Card style={{ textAlign: 'center' }}>
          <span style={{ ...labelStyle, textAlign: 'center' }}>⏱️ Check-in Due In:</span>
          <p style={timerDisplayStyle}>
            {`${minutes}:${seconds.toString().padStart(2, '0')}`}
          </p>
          <PrimaryButton
            label="Check In Now — I'm Safe"
            onPress={() => console.log('Check in')}
            size="medium"
          />
        </Card>

        {/* Safe Phrase Disarm */}
        <Card>
          <span style={labelStyle}>🔐 Enter Safe Phrase to Disarm:</span>
          <TextInput
            placeholder="Enter your safe phrase"
            value={safePhrase}
            onChangeText={setSafePhrase}
            secureTextEntry
            maxLength={20}
          />
          <div style={{ marginTop: spacingNum.lg }}>
            <PrimaryButton
              label="Disarm Emergency"
              onPress={() => onDisarm(safePhrase)}
            />
          </div>
          <p style={{ ...typography.bodySmall, color: colors.onSurfaceVariant, marginTop: spacingNum.sm, textAlign: 'center' }}>
            Use your pre-configured safe phrase to cancel this alert
          </p>
        </Card>
      </div>
    </>
  );
};
