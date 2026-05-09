import React, { CSSProperties } from 'react';
import { colors, typography, spacingNum } from '../../theme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: CSSProperties;
  size?: 'small' | 'medium' | 'large';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  label,
  onPress,
  disabled = false,
  style,
  size = 'large',
}) => {
  const heights = { small: 40, medium: 48, large: 56 };

  const baseStyle: CSSProperties = {
    ...typography.labelLarge,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: heights[size],
    paddingLeft: spacingNum.lg,
    paddingRight: spacingNum.lg,
    borderRadius: 8,
    border: `2px solid ${disabled ? colors.border : colors.primary}`,
    backgroundColor: 'transparent',
    color: disabled ? colors.onSurface : colors.primary,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '700',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    transition: 'opacity 0.15s ease',
    width: '100%',
    ...style,
  };

  return (
    <button
      style={baseStyle}
      onClick={onPress}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = '0.8'; }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
    >
      {label.toUpperCase()}
    </button>
  );
};
