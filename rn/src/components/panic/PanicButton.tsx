import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '../../theme';

interface Props {
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const SIZE = 210;

export const PanicButton: React.FC<Props> = ({ onPress, isActive, disabled }) => {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.5)).current;
  const opacity2 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isActive) {
      const anim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulse1, { toValue: 1.35, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(pulse1, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
          ]),
          Animated.sequence([
            Animated.timing(opacity1, { toValue: 0, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(opacity1, { toValue: 0.5, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
          ]),
          Animated.sequence([
            Animated.delay(350),
            Animated.timing(pulse2, { toValue: 1.65, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(pulse2, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
          ]),
          Animated.sequence([
            Animated.delay(350),
            Animated.timing(opacity2, { toValue: 0, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(opacity2, { toValue: 0.3, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
          ]),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse1.setValue(1);
      pulse2.setValue(1);
      opacity1.setValue(0.5);
      opacity2.setValue(0.3);
    }
  }, [isActive]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.ring, { transform: [{ scale: pulse2 }], opacity: opacity2 }]} />
      <Animated.View style={[styles.ring, { transform: [{ scale: pulse1 }], opacity: opacity1 }]} />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          isActive && styles.active,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isActive ? 'Panic active — tap to view' : 'Press to trigger panic alert'}
      >
        <MaterialIcons
          name={isActive ? 'emergency' : 'warning'}
          size={44}
          color={isActive ? '#fff' : colors.onPrimary}
          style={{ marginBottom: 6 }}
        />
        <Text style={styles.label}>{isActive ? 'ACTIVE' : 'TAP NOW'}</Text>
        <Text style={styles.sub}>{isActive ? 'Emergency in progress' : 'Hold for 2s'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 0 32px rgba(248,91,88,0.55)' } as object,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 24,
      },
    }),
  },
  active: {
    backgroundColor: '#c0392b',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  disabled: { opacity: 0.5 },
  label: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.onPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sub: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(92,0,9,0.7)',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
