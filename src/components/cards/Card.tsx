import React, { CSSProperties } from 'react';
import { colors, spacingNum } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onClick }) => {
  const cardStyle: CSSProperties = {
    backgroundColor: colors.surfaceLevel1,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: spacingNum.lg,
    marginBottom: spacingNum.md,
    cursor: onClick ? 'pointer' : 'default',
    transition: onClick ? 'background-color 0.15s ease' : undefined,
    ...style,
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.surfaceLevel2;
      }}
      onMouseLeave={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.backgroundColor = (style?.backgroundColor as string) || colors.surfaceLevel1;
      }}
    >
      {children}
    </div>
  );
};
