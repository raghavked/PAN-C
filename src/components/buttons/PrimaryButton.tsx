import React, { CSSProperties } from 'react';
import { colors, typography, spacingNum } from '../../theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  style?: CSSProperties;
  size?: 'small' | 'medium' | 'large';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  disabled = false,
  isLoading = false,
  style,
  size = 'large',
}) => {
  const heights = { small: 40, medium: 48, large: 56 };
  const fontSizes = { small: '0.8125rem', medium: '0.875rem', large: '0.875rem' };

  const baseStyle: CSSProperties = {
    ...typography.labelLarge,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: heights[size],
    paddingLeft: spacingNum.lg,
    paddingRight: spacingNum.lg,
    borderRadius: 8,
    border: 'none',
    backgroundColor: disabled ? colors.surfaceContainerHigh : colors.primary,
    color: disabled ? colors.onSurface : colors.onPrimary,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    fontSize: fontSizes[size],
    fontWeight: '700',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    transition: 'opacity 0.15s ease, transform 0.1s ease',
    width: '100%',
    ...style,
  };

  return (
    <button
      style={baseStyle}
      onClick={onPress}
      disabled={disabled || isLoading}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      onMouseDown={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'; }}
      onMouseUp={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      {isLoading ? 'Loading...' : label.toUpperCase()}
    </button>
  );
};
