import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { usePanic } from '../hooks/usePanic';

const PRESETS = [
  { label: '15 MIN', seconds: 15 * 60 },
  { label: '30 MIN', seconds: 30 * 60 },
  { label: '1 HR', seconds: 60 * 60 },
  { label: '2 HR', seconds: 2 * 60 * 60 },
];

export const TimerScreen: React.FC = () => {
  const { isActive, timer, checkIn, triggerPanic } = usePanic();
  const [localSeconds, setLocalSeconds] = useState(30 * 60);
  const [running, setRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(1);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (localSeconds <= 0) { setRunning(false); return; }
    intervalRef.current = setInterval(() => {
      setLocalSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  useEffect(() => {
    if (running && localSeconds < 60) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    pulseAnim.setValue(1);
  }, [running, localSeconds]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const pct = localSeconds / PRESETS[selectedPreset].seconds;
  const isLow = localSeconds > 0 && localSeconds < 60;
  const isDone = localSeconds === 0;

  // Auto-trigger panic when the safety timer expires and the user hasn't checked in
  const hasAutoTriggeredRef = useRef(false);
  useEffect(() => {
    if (isDone && running === false && !isActive && !hasAutoTriggeredRef.current) {
      // Timer expired naturally (not manually stopped) — trigger panic
      hasAutoTriggeredRef.current = true;
      triggerPanic().catch((e) => console.warn('[Timer] Auto-trigger failed:', e));
    }
    if (!isDone) {
      hasAutoTriggeredRef.current = false; // reset when timer is restarted
    }
  }, [isDone, running, isActive, triggerPanic]);

  const handlePreset = (idx: number) => {
    setSelectedPreset(idx);
    setLocalSeconds(PRESETS[idx].seconds);
    setRunning(false);
  };

  const handleReset = () => {
    setLocalSeconds(PRESETS[selectedPreset].seconds);
    setRunning(false);
  };

  const handleCheckIn = () => {
    checkIn();
    setLocalSeconds(PRESETS[selectedPreset].seconds);
    setRunning(true);
  };

  return (
    <SafeAreaView style={s.safe} edges={["top","left","right"]}>
      <View style={s.topBar}>
        <Text style={s.appName}>PAN!C</Text>
      </View>

      <View style={s.content}>
        <Text style={s.pageTitle}>SAFETY TIMER</Text>
        <Text style={s.pageSub}>
          Set a check-in countdown. If it reaches zero, your contacts are alerted.
        </Text>

        <Animated.View style={[s.timerRing, { opacity: isLow ? pulseAnim : 1 }, isDone && s.timerRingDone]}>
          <View style={s.timerInner}>
            <Text style={[s.timerText, isLow && s.timerTextLow, isDone && s.timerTextDone]}>
              {isDone ? 'TIME\nUP' : formatTime(localSeconds)}
            </Text>
            <Text style={s.timerStatus}>
              {isDone ? 'EXPIRED' : running ? 'COUNTING DOWN' : 'PAUSED'}
            </Text>
          </View>
        </Animated.View>

        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${Math.round(pct * 100)}%` as any }, isLow && s.progressLow]} />
        </View>

        <View style={s.presets}>
          {PRESETS.map((p, i) => (
            <Pressable
              key={p.label}
              style={({ pressed }) => [s.presetBtn, i === selectedPreset && s.presetActive, pressed && s.presetPressed]}
              onPress={() => handlePreset(i)}
            >
              <Text style={[s.presetText, i === selectedPreset && s.presetTextActive]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.controls}>
          <Pressable style={({ pressed }) => [s.resetBtn, pressed && s.resetPressed]} onPress={handleReset}>
            <MaterialIcons name="refresh" size={18} color={colors.textSecondary} />
            <Text style={s.resetBtnText}>RESET</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.startBtn, pressed && s.startPressed]}
            onPress={() => setRunning((r) => !r)}
          >
            <MaterialIcons name={running ? 'pause' : 'play-arrow'} size={22} color={colors.onPrimary} />
            <Text style={s.startBtnText}>{running ? 'PAUSE' : 'START'}</Text>
          </Pressable>
        </View>

        <Pressable style={({ pressed }) => [s.checkInBtn, pressed && s.checkInPressed]} onPress={handleCheckIn}>
          <MaterialIcons name="check-circle" size={18} color={colors.primary} />
          <Text style={s.checkInText}>I'M SAFE — RESET & RESTART</Text>
        </Pressable>

        {isActive && (
          <View style={s.panicCard}>
            <View style={s.panicCardLeft}>
              <MaterialIcons name="emergency" size={14} color={colors.primary} />
              <Text style={s.panicLabel}>ACTIVE INCIDENT TIMER</Text>
            </View>
            <Text style={s.panicValue}>
              {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    height: 52, justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  appName: { fontSize: 20, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },

  content: { flex: 1, padding: spacing.md, gap: spacing.md, alignItems: 'center' },

  pageTitle: {
    fontSize: 22, fontWeight: '800', color: colors.textPrimary,
    textTransform: 'uppercase', letterSpacing: 2, alignSelf: 'flex-start',
  },
  pageSub: {
    fontSize: 13, color: colors.textSecondary, lineHeight: 20, alignSelf: 'flex-start',
  },

  timerRing: {
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 3, borderColor: colors.primary,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  timerRingDone: { borderColor: colors.surfaceBorder },
  timerInner: { alignItems: 'center', gap: 4 },
  timerText: {
    fontSize: 46, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', lineHeight: 54,
  },
  timerTextLow: { color: colors.primary },
  timerTextDone: { fontSize: 34, color: colors.textSecondary },
  timerStatus: {
    fontSize: 10, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 2,
  },

  progressTrack: {
    width: '100%', height: 3,
    backgroundColor: colors.surfaceHighest, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.primary, borderRadius: 2 },
  progressLow: { backgroundColor: colors.primary },

  presets: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  presetBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.sm,
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  presetActive: { borderColor: colors.primary, backgroundColor: 'rgba(248,91,88,0.1)' },
  presetPressed: { backgroundColor: colors.surfaceElevated },
  presetText: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  presetTextActive: { color: colors.primary },

  controls: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  resetBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  resetPressed: { backgroundColor: colors.surfaceElevated },
  resetBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  startBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary,
  },
  startPressed: { opacity: 0.85 },
  startBtnText: { fontSize: 15, fontWeight: '800', color: colors.onPrimary, textTransform: 'uppercase', letterSpacing: 1 },

  checkInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    width: '100%', paddingVertical: 14, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.primary,
  },
  checkInPressed: { backgroundColor: 'rgba(248,91,88,0.1)' },
  checkInText: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },

  panicCard: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(248,91,88,0.08)', borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md,
  },
  panicCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  panicLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  panicValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
});
