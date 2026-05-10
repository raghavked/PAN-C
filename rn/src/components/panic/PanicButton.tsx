import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, typography } from '../../theme';

interface Props {
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export const PanicButton: React.FC<Props> = ({ onPress, isActive, disabled }) => {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.6)).current;
  const opacity2 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isActive) {
      const anim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulse1, { toValue: 1.4, duration: 800, useNativeDriver: true }),
            Animated.timing(pulse1, { toValue: 1, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacity1, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity1, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(pulse2, { toValue: 1.7, duration: 800, useNativeDriver: true }),
            Animated.timing(pulse2, { toValue: 1, duration: 800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(opacity2, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity2, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          ]),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse1.setValue(1);
      pulse2.setValue(1);
      opacity1.setValue(0.6);
      opacity2.setValue(0.4);
    }
  }, [isActive]);

  return (
    <View style={styles.wrapper}>
      {isActive && (
        <>
          <Animated.View style={[
            styles.ring,
            { transform: [{ scale: pulse2 }], opacity: opacity2 },
          ]} />
          <Animated.View style={[
            styles.ring,
            { transform: [{ scale: pulse1 }], opacity: opacity1 },
          ]} />
        </>
      )}
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
        accessibilityLabel={isActive ? 'Panic button active' : 'Press to trigger panic alert'}
      >
        <Text style={styles.icon}>{isActive ? '🚨' : '🆘'}</Text>
        <Text style={styles.label}>{isActive ? 'ACTIVE' : 'PANIC'}</Text>
        <Text style={styles.sub}>{isActive ? 'Tap to disarm' : 'Hold for 2s'}</Text>
      </Pressable>
    </View>
  );
};

const SIZE = 200;

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
    backgroundColor: colors.panicRed,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    ...Platform.select({
      web: { boxShadow: '0 0 20px rgba(226,75,74,0.5)' } as object,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
    }),
  },
  active: {
    backgroundColor: colors.primaryDark,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  disabled: { opacity: 0.5 },
  icon: { fontSize: 36, marginBottom: 4 },
  label: { ...typography.h3, color: colors.white, letterSpacing: 2 },
  sub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
});
