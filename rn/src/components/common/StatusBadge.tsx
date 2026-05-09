import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';

type Status = 'safe' | 'active' | 'warning' | 'info';

interface Props {
  status: Status;
  label: string;
}

const STATUS_COLORS: Record<Status, { bg: string; text: string; dot: string }> = {
  safe:    { bg: 'rgba(76,175,80,0.15)',  text: colors.successLight, dot: colors.success },
  active:  { bg: 'rgba(226,75,74,0.15)',  text: colors.dangerLight,  dot: colors.danger  },
  warning: { bg: 'rgba(255,152,0,0.15)',  text: colors.warningLight, dot: colors.warning },
  info:    { bg: 'rgba(33,150,243,0.15)', text: colors.infoLight,    dot: colors.info    },
};

export const StatusBadge: React.FC<Props> = ({ status, label }) => {
  const c = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: spacing.xs },
  text: { ...typography.labelSm },
});
