import React, { CSSProperties } from 'react';
import { colors, spacingNum } from '../../theme';

interface StatusBadgeProps {
  label: string;
  status: 'active' | 'pending' | 'success' | 'error';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, status }) => {
  const statusColors: Record<string, string> = {
    active: colors.primary,
    pending: colors.pending,
    success: colors.success,
    error: colors.errorContainer,
  };

  const statusTextColors: Record<string, string> = {
    active: colors.onPrimary,
    pending: colors.onSurface,
    success: '#FFFFFF',
    error: colors.error,
  };

  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    paddingLeft: spacingNum.sm,
    paddingRight: spacingNum.sm,
    paddingTop: spacingNum.xs,
    paddingBottom: spacingNum.xs,
    borderRadius: 4,
    backgroundColor: statusColors[status],
    color: statusTextColors[status],
    fontSize: '0.75rem',
    fontWeight: '600',
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    whiteSpace: 'nowrap',
  };

  return <span style={badgeStyle}>{label}</span>;
};
