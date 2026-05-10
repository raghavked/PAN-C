import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, SafeAreaView, ScrollView, Pressable, TextInput,
} from 'react-native';
import { colors, spacing, typography, radius } from '../theme';
import { usePanic } from '../hooks/usePanic';

const SAFE_PHRASE = 'I AM SAFE';

const STATUS_ITEMS = [
  { icon: '📱', label: 'Maria Garcia', sub: 'Emergency Contact 1', status: 'SMS Sent' },
  { icon: '📱', label: 'Carlos Lopez', sub: 'Emergency Contact 2', status: 'SMS Sent' },
  { icon: '📱', label: 'RAICES Hotline', sub: 'Legal Aid', status: 'SMS Sent' },
];

export const PanicActiveScreen: React.FC = () => {
  const { isActive, incidentId, contactsNotified, timer, checkIn, disarmPanic, rightsReminder } = usePanic();
  const [phrase, setPhrase] = useState('');
  const [disarmError, setDisarmError] = useState('');
  const [disarming, setDisarming] = useState(false);
  const flashAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) { flashAnim.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isActive]);

  const handleDisarm = async () => {
    if (phrase.toUpperCase().trim() !== SAFE_PHRASE) {
      setDisarmError(`Type "${SAFE_PHRASE}" to disarm.`);
      return;
    }
    setDisarming(true);
    await disarmPanic(phrase);
    setPhrase('');
    setDisarming(false);
  };

  const formatTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!isActive) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.topBar}>
          <Text style={s.appName}>PAN!C</Text>
        </View>
        <View style={s.standbyWrap}>
          <View style={s.standbyIcon}>
            <Text style={{ fontSize: 40 }}>🛡️</Text>
          </View>
          <Text style={s.standbyTitle}>NO ACTIVE ALERT</Text>
          <Text style={s.standbySub}>Press the panic button on the Home screen to activate an emergency alert.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.appName}>PAN!C</Text>
      </View>

      {/* Emergency Banner */}
      <Animated.View style={[s.emergencyBanner, { opacity: flashAnim }]}>
        <Text style={s.emergencyIcon}>⚠️</Text>
        <Text style={s.emergencyText}>EMERGENCY ACTIVE</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Timer + Audio Card */}
        <View style={s.timerCard}>
          <View style={s.timerLeft}>
            <View style={s.micCircle}>
              <Text style={s.micIcon}>🔴</Text>
            </View>
            <Text style={s.micLabel}>LIVE AUDIO</Text>
            <Text style={s.micSub}>Recording & Transmitting</Text>
          </View>
          <Text style={s.timerDisplay}>{formatTimer(timer)}</Text>
        </View>

        {/* Location placeholder */}
        <View style={s.locationCard}>
          <View style={s.locationHeader}>
            <Text style={s.locationIcon}>📍</Text>
            <Text style={s.locationLabel}>TRACKING ACTIVE</Text>
          </View>
          <View style={s.locationBody}>
            <Text style={s.coordinatesText}>Acquiring location…</Text>
            <Text style={s.locationAccuracy}>Incident: {incidentId}</Text>
          </View>
        </View>

        {/* Dispatch Status */}
        <View style={s.dispatchCard}>
          <View style={s.dispatchHeader}>
            <Text style={s.dispatchHeaderIcon}>📡</Text>
            <Text style={s.dispatchTitle}>DISPATCH STATUS</Text>
          </View>
          {STATUS_ITEMS.map((item, i) => (
            <View key={i} style={s.dispatchRow}>
              <View style={s.dispatchAvatar}>
                <Text>{item.icon}</Text>
              </View>
              <View style={s.dispatchInfo}>
                <Text style={s.dispatchName}>{item.label}</Text>
                <Text style={s.dispatchSub}>{item.sub}</Text>
              </View>
              <View style={s.notifiedBadge}>
                <Text style={s.notifiedText}>✓ {item.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Rights reminder */}
        {!!rightsReminder && (
          <View style={s.rightsCard}>
            <Text style={s.rightsTitle}>⚖️ YOUR RIGHTS</Text>
            <Text style={s.rightsText}>{rightsReminder}</Text>
          </View>
        )}

        {/* Check-In */}
        <Pressable
          style={({ pressed }) => [s.checkInBtn, pressed && s.checkInBtnPressed]}
          onPress={checkIn}
        >
          <Text style={s.checkInText}>✓ I'M SAFE — RESET TIMER</Text>
        </Pressable>

        {/* Disarm */}
        <View style={s.disarmCard}>
          <Text style={s.disarmTitle}>DISARM SYSTEM</Text>
          <Text style={s.disarmSub}>Enter your safe phrase to cancel the alert.</Text>
          <TextInput
            style={[s.disarmInput, !!disarmError && s.disarmInputError]}
            placeholder={`Type "${SAFE_PHRASE}"`}
            placeholderTextColor={colors.textMuted}
            value={phrase}
            onChangeText={(t) => { setPhrase(t); setDisarmError(''); }}
            autoCapitalize="characters"
          />
          {!!disarmError && <Text style={s.errorText}>{disarmError}</Text>}
          <Pressable
            style={({ pressed }) => [s.disarmBtn, pressed && s.disarmBtnPressed, disarming && s.disarmBtnLoading]}
            onPress={handleDisarm}
            disabled={disarming}
          >
            <Text style={s.disarmBtnText}>{disarming ? 'DISARMING…' : '🔓 DISARM SYSTEM'}</Text>
          </Pressable>
        </View>

      </ScrollView>
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
  standbyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  standbyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  standbyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', marginBottom: spacing.sm },
  standbySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emergencyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: spacing.sm,
  },
  emergencyIcon: { fontSize: 18 },
  emergencyText: {
    fontSize: 16, fontWeight: '800', color: colors.onPrimary,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  timerCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md,
  },
  timerLeft: { alignItems: 'flex-start' },
  micCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(248,91,88,0.15)', borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  micIcon: { fontSize: 20 },
  micLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase' },
  micSub: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  timerDisplay: {
    fontSize: 48, fontWeight: '800', color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  locationCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  locationIcon: { fontSize: 16 },
  locationLabel: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  locationBody: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surfaceElevated, borderRadius: radius.sm, padding: spacing.sm,
  },
  coordinatesText: { fontSize: 14, color: colors.textPrimary },
  locationAccuracy: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  dispatchCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  dispatchHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder, paddingBottom: spacing.sm,
  },
  dispatchHeaderIcon: { fontSize: 16 },
  dispatchTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  dispatchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surfaceContainer, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.surfaceBorder, padding: spacing.sm,
  },
  dispatchAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceHighest, alignItems: 'center', justifyContent: 'center',
  },
  dispatchInfo: { flex: 1 },
  dispatchName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  dispatchSub: { fontSize: 11, color: colors.textSecondary },
  notifiedBadge: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  notifiedText: { fontSize: 11, fontWeight: '700', color: colors.onPrimary, textTransform: 'uppercase' },
  rightsCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  rightsTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  rightsText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  checkInBtn: {
    backgroundColor: colors.surfaceContainer, borderWidth: 2, borderColor: colors.primary,
    borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  checkInBtnPressed: { backgroundColor: colors.surfaceElevated },
  checkInText: { fontSize: 14, fontWeight: '700', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  disarmCard: {
    backgroundColor: colors.surfaceHighest, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  disarmTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  disarmSub: { fontSize: 13, color: colors.textSecondary },
  disarmInput: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.sm, padding: spacing.sm, color: colors.textPrimary,
    fontSize: 16, textAlign: 'center', letterSpacing: 4,
  },
  disarmInputError: { borderColor: colors.primary, borderWidth: 2 },
  errorText: { fontSize: 12, color: colors.primary, textAlign: 'center' },
  disarmBtn: {
    backgroundColor: colors.surfaceContainer, borderWidth: 2, borderColor: colors.primary,
    borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  disarmBtnPressed: { backgroundColor: colors.primary },
  disarmBtnLoading: { opacity: 0.6 },
  disarmBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
});
