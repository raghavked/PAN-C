import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PanicButton } from '../components/panic/PanicButton';
import { colors, spacing, typography, radius } from '../theme';
import { usePanic } from '../hooks/usePanic';

const ACTIVITY = [
  { icon: '📍', label: 'Location Updated', sub: 'Coordinates synced successfully.', time: '10:42 AM' },
  { icon: '⚖️', label: 'Rights Accessed', sub: "Document 'Stop & ID' viewed.", time: 'YESTERDAY' },
  { icon: '⏱', label: 'Timer Cancelled', sub: 'Safety check-in dismissed.', time: 'OCT 12' },
];

export const HomeScreen: React.FC = () => {
  const { isActive, contactsNotified, incidentId, triggerPanic } = usePanic();
  const navigation = useNavigation<any>();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) { pulseAnim.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isActive]);

  return (
    <SafeAreaView style={s.safe}>
      {/* Top App Bar */}
      <View style={s.topBar}>
        <View style={s.avatarBtn}>
          <Text style={s.avatarText}>A</Text>
        </View>
        <Text style={s.appName}>PAN!C</Text>
        <Pressable style={s.settingsBtn}>
          <Text style={s.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Status Card */}
        <View style={s.statusCard}>
          <View style={s.statusLeft}>
            <Text style={s.statusIcon}>🛡️</Text>
            <Text style={s.statusLabel}>{isActive ? 'ALERT ACTIVE' : 'PROTECTED'}</Text>
          </View>
          <View style={s.statusBadge}>
            <Text style={s.statusBadgeText}>{isActive ? 'ACTIVE' : 'READY'}</Text>
          </View>
        </View>

        {/* Panic Button */}
        <View style={s.panicWrap}>
          <PanicButton onPress={() => { triggerPanic().then(() => navigation.navigate('Alert')); }} isActive={isActive} />
          {isActive && (
            <Text style={s.incidentHint}>Incident {incidentId} · {contactsNotified} contacts notified</Text>
          )}
        </View>

        {/* 2×2 Grid */}
        <View style={s.grid}>
          {[
            { icon: '⏱', label: 'TIMER', tab: 'Timer' },
            { icon: '📄', label: 'DOCUMENTS', tab: 'Rights' },
            { icon: '👥', label: 'CONTACTS', tab: 'Contacts' },
            { icon: '⚖️', label: 'RIGHTS', tab: 'Rights' },
          ].map((item) => (
            <Pressable
              key={item.tab + item.label}
              style={({ pressed }) => [s.gridTile, pressed && s.gridTilePressed]}
              onPress={() => navigation.navigate(item.tab)}
            >
              <Text style={s.gridIcon}>{item.icon}</Text>
              <Text style={s.gridLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={s.sectionTitle}>RECENT ACTIVITY</Text>
        {ACTIVITY.map((a, i) => (
          <View key={i} style={s.activityRow}>
            <View style={s.activityIcon}>
              <Text>{a.icon}</Text>
            </View>
            <View style={s.activityInfo}>
              <Text style={s.activityLabel}>{a.label.toUpperCase()}</Text>
              <Text style={s.activitySub}>{a.sub}</Text>
            </View>
            <Text style={s.activityTime}>{a.time}</Text>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, height: 56,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
    backgroundColor: colors.background,
  },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...typography.label, color: colors.textPrimary },
  appName: {
    fontSize: 22, fontWeight: '800', color: colors.primary,
    letterSpacing: -0.5, textTransform: 'uppercase',
  },
  settingsBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 20 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 100, gap: spacing.md },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusIcon: { fontSize: 20 },
  statusLabel: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase' },
  statusBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: colors.surfaceHighest, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  statusBadgeText: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  panicWrap: { alignItems: 'center', paddingVertical: spacing.xl },
  incidentHint: {
    ...typography.bodySm, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridTile: {
    width: '48%', backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md,
    minHeight: 100, justifyContent: 'space-between',
  },
  gridTilePressed: { backgroundColor: colors.surfaceElevated },
  gridIcon: { fontSize: 24, marginBottom: spacing.sm },
  gridLabel: {
    fontSize: 18, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: colors.textPrimary,
    letterSpacing: 1, textTransform: 'uppercase',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
    paddingBottom: spacing.sm, marginTop: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md,
  },
  activityIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceHighest, alignItems: 'center', justifyContent: 'center',
  },
  activityInfo: { flex: 1 },
  activityLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase' },
  activitySub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  activityTime: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' },
});
