import React, { CSSProperties } from 'react';
import { colors, spacingNum, typography } from '../../theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: { label: string; onPress: () => void };
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, rightAction }) => {
  const headerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacingNum.lg,
    paddingRight: spacingNum.lg,
    paddingTop: spacingNum.lg,
    paddingBottom: spacingNum.lg,
    backgroundColor: colors.surfaceLevel1,
    borderBottom: `1px solid ${colors.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const leftStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  };

  const titleStyle: CSSProperties = {
    ...typography.headlineMedium,
    flex: 2,
    textAlign: 'center',
    color: colors.onSurface,
  };

  const rightStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  };

  const backButtonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: colors.primary,
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    padding: '4px 8px',
    borderRadius: 4,
  };

  const actionButtonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: colors.primary,
    fontSize: '0.875rem',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    padding: '4px 8px',
    borderRadius: 4,
  };

  return (
    <header style={headerStyle}>
      <div style={leftStyle}>
        {onBack && (
          <button style={backButtonStyle} onClick={onBack}>
            ← Back
          </button>
        )}
      </div>
      <h1 style={titleStyle}>{title}</h1>
      <div style={rightStyle}>
        {rightAction && (
          <button style={actionButtonStyle} onClick={rightAction.onPress}>
            {rightAction.label}
          </button>
        )}
      </div>
    </header>
  );
};
