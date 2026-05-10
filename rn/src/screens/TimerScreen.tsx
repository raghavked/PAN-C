import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable, Animated,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { usePanic } from '../hooks/usePanic';

const PRESETS = [
  { label: '15 MIN', seconds: 15 * 60 },
  { label: '30 MIN', seconds: 30 * 60 },
  { label: '1 HR', seconds: 60 * 60 },
  { label: '2 HR', seconds: 2 * 60 * 60 },
];

export const TimerScreen: React.FC = () => {
  const { isActive, timer, checkIn } = usePanic();
  const [localSeconds, setLocalSeconds] = useState(30 * 60);
  const [running, setRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(1);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    if (localSeconds <= 0) {
      setRunning(false);
      return;
    }
    intervalRef.current = setInterval(() => {
      setLocalSeconds((s) => {
        if (s <= 1) { setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  useEffect(() => {
    if (running && localSeconds < 60) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [running, localSeconds]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const pct = localSeconds / PRESETS[selectedPreset].seconds;
  const isLow = localSeconds > 0 && localSeconds < 60;
  const isDone = localSeconds === 0;

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
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.appName}>PAN!C</Text>
      </View>

      <View style={s.content}>
        {/* Title */}
        <Text style={s.pageTitle}>SAFETY TIMER</Text>
        <Text style={s.pageSub}>
          Set a check-in countdown. If it reaches zero without check-in, contacts are alerted.
        </Text>

        {/* Timer Display */}
        <Animated.View style={[s.timerRing, { opacity: isLow ? pulseAnim : 1 }, isDone && s.timerRingDone]}>
          <View style={s.timerInner}>
            <Text style={[s.timerText, isLow && s.timerTextLow, isDone && s.timerTextDone]}>
              {isDone ? 'TIME\nUP' : formatTime(localSeconds)}
            </Text>
            {running && !isDone && (
              <Text style={s.timerStatus}>COUNTING DOWN</Text>
            )}
            {!running && !isDone && (
              <Text style={s.timerStatus}>PAUSED</Text>
            )}
          </View>
        </Animated.View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${Math.round(pct * 100)}%` as any }, isLow && s.progressFillLow]} />
        </View>

        {/* Preset Buttons */}
        <View style={s.presets}>
          {PRESETS.map((p, i) => (
            <Pressable
              key={p.label}
              style={({ pressed }) => [
                s.presetBtn,
                i === selectedPreset && s.presetBtnActive,
                pressed && s.presetBtnPressed,
              ]}
              onPress={() => handlePreset(i)}
            >
              <Text style={[s.presetText, i === selectedPreset && s.presetTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Control Buttons */}
        <View style={s.controls}>
          <Pressable
            style={({ pressed }) => [s.resetBtn, pressed && s.resetBtnPressed]}
            onPress={handleReset}
          >
            <Text style={s.resetBtnText}>↺ RESET</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.startBtn, pressed && s.startBtnPressed]}
            onPress={() => setRunning((r) => !r)}
          >
            <Text style={s.startBtnText}>{running ? '⏸ PAUSE' : '▶ START'}</Text>
          </Pressable>
        </View>

        {/* Check-in */}
        <Pressable
          style={({ pressed }) => [s.checkInBtn, pressed && s.checkInBtnPressed]}
          onPress={handleCheckIn}
        >
          <Text style={s.checkInText}>✓ I'M SAFE — RESET & RESTART</Text>
        </Pressable>

        {/* Panic timer status */}
        {isActive && (
          <View style={s.panicTimerCard}>
            <Text style={s.panicTimerLabel}>🚨 ACTIVE INCIDENT TIMER</Text>
            <Text style={s.panicTimerValue}>
              {String(Math.floor(timer / 60)).padStart(2,'0')}:{String(timer % 60).padStart(2,'0')}
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
    height: 56, justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  appName: { fontSize: 22, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  content: { flex: 1, padding: spacing.md, gap: spacing.md, alignItems: 'center' },
  pageTitle: {
    fontSize: 24, fontWeight: '800', color: colors.textPrimary,
    textTransform: 'uppercase', letterSpacing: 2, alignSelf: 'flex-start',
  },
  pageSub: {
    fontSize: 13, color: colors.textSecondary, lineHeight: 20,
    alignSelf: 'flex-start',
  },
  timerRing: {
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 4, borderColor: colors.primary,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
    marginVertical: spacing.md,
  },
  timerRingDone: { borderColor: colors.surfaceBorder },
  timerInner: { alignItems: 'center', gap: 4 },
  timerText: {
    fontSize: 48, fontWeight: '800', color: colors.textPrimary,
    textAlign: 'center', lineHeight: 56,
  },
  timerTextLow: { color: colors.primary },
  timerTextDone: { fontSize: 36, color: colors.textSecondary },
  timerStatus: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 2,
  },
  progressTrack: {
    width: '100%', height: 4,
    backgroundColor: colors.surfaceHighest, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: {
    height: 4, backgroundColor: colors.primary, borderRadius: 2,
  },
  progressFillLow: { backgroundColor: colors.primary },
  presets: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  presetBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm,
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  presetBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(248,91,88,0.1)' },
  presetBtnPressed: { backgroundColor: colors.surfaceElevated },
  presetText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  presetTextActive: { color: colors.primary },
  controls: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  resetBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  resetBtnPressed: { backgroundColor: colors.surfaceElevated },
  resetBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  startBtn: {
    flex: 2, paddingVertical: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  startBtnPressed: { opacity: 0.85 },
  startBtnText: { fontSize: 16, fontWeight: '800', color: colors.onPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  checkInBtn: {
    width: '100%', paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center',
  },
  checkInBtnPressed: { backgroundColor: colors.primary },
  checkInText: { fontSize: 14, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  panicTimerCard: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(248,91,88,0.1)', borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md,
  },
  panicTimerLabel: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  panicTimerValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
});
