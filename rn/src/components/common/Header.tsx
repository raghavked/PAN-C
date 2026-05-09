import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

interface Props {
  title: string;
  onBack?: () => void;
  rightAction?: { label: string; onPress: () => void };
  danger?: boolean;
}

export const Header: React.FC<Props> = ({ title, onBack, rightAction, danger }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top + spacing.sm },
      danger && styles.danger,
    ]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.side} accessibilityLabel="Go back">
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        ) : <View style={styles.side} />}

        <Text style={[styles.title, danger && styles.dangerText]} numberOfLines={1}>
          {title}
        </Text>

        {rightAction ? (
          <Pressable onPress={rightAction.onPress} style={styles.side}>
            <Text style={styles.rightLabel}>{rightAction.label}</Text>
          </Pressable>
        ) : <View style={styles.side} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  danger: {
    backgroundColor: colors.primary,
    borderBottomColor: colors.primaryDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  side: { width: 60, alignItems: 'center' },
  title: { ...typography.h4, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  dangerText: { color: colors.white },
  backArrow: { fontSize: 22, color: colors.textPrimary },
  rightLabel: { ...typography.label, color: colors.primary },
});
