import React, { useState, useEffect, CSSProperties } from 'react';
import { colors, spacingNum } from '../../theme';

interface PanicButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isActive?: boolean;
}

export const PanicButton: React.FC<PanicButtonProps> = ({
  onPress,
  disabled = false,
  isActive = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsPulsing(true);
    } else {
      setIsPulsing(false);
    }
  }, [isActive]);

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginTop: spacingNum.xxl,
    marginBottom: spacingNum.xxl,
    gap: spacingNum.lg,
  };

  const buttonWrapperStyle: CSSProperties = {
    position: 'relative',
    width: 200,
    height: 200,
  };

  const pulseRingStyle: CSSProperties = {
    position: 'absolute',
    inset: -12,
    borderRadius: '50%',
    border: `3px solid ${colors.primary}`,
    opacity: isPulsing ? 0.6 : 0,
    animation: isPulsing ? 'pulse-ring 1.5s ease-out infinite' : 'none',
    pointerEvents: 'none',
  };

  const buttonStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: disabled ? colors.surfaceContainerHigh : colors.primary,
    color: colors.onPrimary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingNum.md,
    transform: isPressed ? 'scale(1.08)' : 'scale(1)',
    transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease',
    boxShadow: isPressed
      ? `0 0 40px 12px rgba(226, 75, 74, 0.5)`
      : `0 4px 24px rgba(226, 75, 74, 0.35)`,
    opacity: disabled ? 0.5 : 1,
    outline: 'none',
    position: 'relative',
    zIndex: 1,
  };

  const iconStyle: CSSProperties = {
    fontSize: 56,
    lineHeight: 1,
    userSelect: 'none',
  };

  const labelStyle: CSSProperties = {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '1rem',
    fontWeight: '800',
    letterSpacing: '0.1em',
    color: colors.onPrimary,
    userSelect: 'none',
  };

  const subtitleStyle: CSSProperties = {
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    fontSize: '0.75rem',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    maxWidth: 180,
    userSelect: 'none',
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
      <div style={buttonWrapperStyle}>
        <div style={pulseRingStyle} />
        <button
          style={buttonStyle}
          onClick={onPress}
          disabled={disabled}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => { setIsPressed(false); }}
          onMouseLeave={() => setIsPressed(false)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => { setIsPressed(false); }}
          aria-label="Panic button - press to trigger emergency alert"
        >
          <span style={iconStyle}>🚨</span>
          <span style={labelStyle}>TAP NOW</span>
        </button>
      </div>
      <p style={subtitleStyle}>
        {isActive ? '⚠️ EMERGENCY ACTIVE — Contacts Notified' : 'Hold to trigger emergency alert'}
      </p>
    </div>
  );
};
