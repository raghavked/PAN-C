import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<Props> = ({
  label, onPress, disabled, loading, fullWidth,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || loading}
    style={({ pressed }) => [
      styles.btn,
      fullWidth && styles.fullWidth,
      (disabled || loading) && styles.disabled,
      pressed && styles.pressed,
    ]}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    {loading
      ? <ActivityIndicator color={colors.white} />
      : <Text style={styles.label}>{label}</Text>
    }
  </Pressable>
);

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label: { ...typography.button, color: colors.white },
});
