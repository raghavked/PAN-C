import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, SafeAreaView, ScrollView, Pressable, TextInput, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { colors, spacing, radius } from '../theme';
import { usePanic } from '../hooks/usePanic';


export const PanicActiveScreen: React.FC = () => {
  const { isActive, incidentId, contactsNotified, timer, checkIn, disarmPanic, rightsReminder } = usePanic();
  const tabBarHeight = useBottomTabBarHeight();
  const [phrase, setPhrase] = useState('');
  const [disarmError, setDisarmError] = useState('');
  const [disarming, setDisarming] = useState(false);
  const flashAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) { flashAnim.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.55, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(flashAnim, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isActive]);

  const handleDisarm = async () => {
    if (!phrase.trim()) {
      setDisarmError('Please enter your safe phrase.');
      return;
    }
    setDisarming(true);
    const success = await disarmPanic(phrase.trim());
    if (!success) {
      setDisarmError('Incorrect safe phrase. Try again.');
    }
    setPhrase('');
    setDisarming(false);
  };

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!isActive) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.topBar}>
          <Text style={s.appName}>PAN!C</Text>
        </View>
        <View style={s.standbyWrap}>
          <View style={s.standbyCircle}>
            <MaterialIcons name="security" size={40} color={colors.textMuted} />
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

      <Animated.View style={[s.emergencyBanner, { opacity: flashAnim }]}>
        <MaterialIcons name="warning" size={18} color={colors.onPrimary} />
        <Text style={s.emergencyText}>EMERGENCY ACTIVE</Text>
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: tabBarHeight + 24 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={s.audioCard}>
          <View style={s.audioLeft}>
            <View style={s.micCircle}>
              <MaterialIcons name="mic" size={24} color={colors.primary} />
            </View>
            <Text style={s.audioTitle}>Live Audio</Text>
            <Text style={s.audioSub}>RECORDING & TRANSMITTING</Text>
          </View>
          <Text style={s.timerDisplay}>{formatTimer(timer)}</Text>
        </View>

        <View style={s.locationCard}>
          <View style={s.locationHeader}>
            <MaterialIcons name="my-location" size={14} color={colors.primary} />
            <Text style={s.locationLabel}>TRACKING ACTIVE</Text>
          </View>
          <View style={s.locationMap}>
            <View style={s.locationDot} />
          </View>
          <View style={s.locationFooter}>
            <Text style={s.coordText}>Acquiring location…</Text>
            <Text style={s.accuracyText}>± 5 METERS</Text>
          </View>
        </View>

        <View style={s.dispatchCard}>
          <View style={s.dispatchHeader}>
            <MaterialIcons name="sensors" size={18} color={colors.textPrimary} />
            <Text style={s.dispatchTitle}>DISPATCH STATUS</Text>
          </View>
          <View style={s.dispatchRow}>
            <View style={s.dispatchAvatar}>
              <MaterialIcons name="group" size={18} color={colors.textSecondary} />
            </View>
            <View style={s.dispatchInfo}>
              <Text style={s.dispatchName}>Emergency Contacts</Text>
              <Text style={s.dispatchSub}>
                {contactsNotified > 0
                  ? `${contactsNotified} contact${contactsNotified !== 1 ? 's' : ''} reached via push notification`
                  : 'No contacts with app installed'}
              </Text>
              <View style={[s.statusBadge, contactsNotified > 0 ? s.badgeSent : s.badgePending]}>
                {contactsNotified > 0 && <MaterialIcons name="check-circle" size={11} color={colors.primary} />}
                <Text style={[s.statusBadgeText, contactsNotified > 0 ? s.badgeSentText : s.badgePendingText]}>
                  {contactsNotified > 0 ? 'NOTIFIED' : 'NO APP'}
                </Text>
              </View>
            </View>
          </View>
          <View style={s.dispatchRow}>
            <View style={s.dispatchAvatar}>
              <MaterialIcons name="article" size={18} color={colors.textSecondary} />
            </View>
            <View style={s.dispatchInfo}>
              <Text style={s.dispatchName}>Incident Record</Text>
              <Text style={s.dispatchSub}>{incidentId || 'Generating…'}</Text>
              <View style={[s.statusBadge, incidentId && incidentId !== 'TRIGGERING...' ? s.badgeSent : s.badgePending]}>
                {incidentId && incidentId !== 'TRIGGERING...' && <MaterialIcons name="check-circle" size={11} color={colors.primary} />}
                <Text style={[s.statusBadgeText, incidentId && incidentId !== 'TRIGGERING...' ? s.badgeSentText : s.badgePendingText]}>
                  {incidentId && incidentId !== 'TRIGGERING...' ? 'LOGGED' : 'PENDING'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {!!rightsReminder && (
          <View style={s.rightsCard}>
            <View style={s.rightsHeader}>
              <MaterialIcons name="gavel" size={16} color={colors.primary} />
              <Text style={s.rightsTitle}>YOUR RIGHTS</Text>
            </View>
            <Text style={s.rightsText}>{rightsReminder}</Text>
          </View>
        )}

        <View style={s.disarmCard}>
          <Text style={s.disarmHint}>ENTER SAFE PHRASE TO CANCEL ALERT</Text>
          <View style={s.pinDots}>
            {Array.from({ length: Math.min(phrase.length || 1, 12) }).map((_, i) => (
              <View key={i} style={[s.pinDot, i < phrase.length && s.pinDotFilled]} />
            ))}
          </View>
          <TextInput
            style={[s.disarmInput, !!disarmError && s.disarmInputError]}
            placeholder="Type your safe phrase"
            placeholderTextColor={colors.textMuted}
            value={phrase}
            onChangeText={(t) => { setPhrase(t); setDisarmError(''); }}
            autoCapitalize="none"
          />
          {!!disarmError && <Text style={s.errorText}>{disarmError}</Text>}
          <Pressable
            style={({ pressed }) => [s.disarmBtn, pressed && s.disarmBtnPressed, disarming && s.disarmBtnLoading]}
            onPress={handleDisarm}
            disabled={disarming}
          >
            <MaterialIcons name="lock-open" size={18} color={colors.onPrimary} />
            <Text style={s.disarmBtnText}>{disarming ? 'DISARMING…' : 'DISARM SYSTEM'}</Text>
          </Pressable>
        </View>

      </ScrollView>
      </KeyboardAvoidingView>
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

  standbyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  standbyCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  standbyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', marginBottom: spacing.sm },
  standbySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  emergencyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: 10,
  },
  emergencyText: {
    fontSize: 15, fontWeight: '800', color: colors.onPrimary,
    letterSpacing: 2, textTransform: 'uppercase',
  },

  content: { padding: spacing.md, gap: spacing.md },

  audioCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md,
  },
  audioLeft: { alignItems: 'flex-start', gap: 4 },
  micCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(248,91,88,0.12)', borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  audioTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 6 },
  audioSub: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  timerDisplay: { fontSize: 44, fontWeight: '800', color: colors.textPrimary, fontVariant: ['tabular-nums'] },

  locationCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, overflow: 'hidden',
  },
  locationHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainer,
  },
  locationLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  locationMap: {
    height: 64, backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  locationDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2, borderColor: 'rgba(248,91,88,0.3)',
    shadowColor: colors.primary, shadowOpacity: 0.8, shadowRadius: 6,
  },
  locationFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  coordText: { fontSize: 13, color: colors.textPrimary },
  accuracyText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },

  dispatchCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  dispatchHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  dispatchTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  dispatchRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.surfaceContainer, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.surfaceBorder, padding: spacing.sm,
  },
  dispatchAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceHighest, alignItems: 'center', justifyContent: 'center',
  },
  dispatchInfo: { flex: 1, gap: 2 },
  dispatchName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  dispatchSub: { fontSize: 11, color: colors.textSecondary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginTop: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, borderWidth: 1,
  },
  badgeSent: { borderColor: colors.primary, backgroundColor: 'rgba(248,91,88,0.1)' },
  badgePending: { borderColor: colors.surfaceBorder, backgroundColor: colors.surfaceHighest },
  statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeSentText: { color: colors.primary },
  badgePendingText: { color: colors.textMuted },

  rightsCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  rightsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rightsTitle: { fontSize: 12, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  rightsText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

  disarmCard: {
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, alignItems: 'center',
  },
  disarmHint: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  pinDots: { flexDirection: 'row', gap: 12, marginVertical: 4 },
  pinDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.surfaceHighest, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  pinDotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  disarmInput: {
    width: '100%', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.sm, padding: spacing.sm, color: colors.textPrimary,
    fontSize: 15, textAlign: 'center', letterSpacing: 3,
  },
  disarmInputError: { borderColor: colors.primary, borderWidth: 2 },
  errorText: { fontSize: 12, color: colors.primary, textAlign: 'center' },
  disarmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    width: '100%', backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 14, marginTop: 4,
  },
  disarmBtnPressed: { opacity: 0.85 },
  disarmBtnLoading: { opacity: 0.6 },
  disarmBtnText: { fontSize: 15, fontWeight: '800', color: colors.onPrimary, letterSpacing: 1, textTransform: 'uppercase' },
});
