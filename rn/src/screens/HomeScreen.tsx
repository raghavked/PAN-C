import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { PanicButton } from '../components/panic/PanicButton';
import { colors, spacing, radius } from '../theme';
import { usePanic } from '../hooks/usePanic';

type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

interface ActivityItem {
  icon: MIName;
  label: string;
  sub: string;
  time: string;
}

const ACTIVITY: ActivityItem[] = [
  { icon: 'location-on', label: 'Location Updated', sub: 'Coordinates synced successfully.', time: '10:42 AM' },
  { icon: 'gavel', label: 'Rights Accessed', sub: "Document 'Stop & ID' viewed.", time: 'YESTERDAY' },
  { icon: 'timer-off', label: 'Timer Cancelled', sub: 'Safety check-in dismissed.', time: 'OCT 12' },
];

interface GridTile {
  icon: MIName;
  label: string;
  tab: string;
}

const GRID: GridTile[] = [
  { icon: 'timer', label: 'TIMER', tab: 'Timer' },
  { icon: 'description', label: 'DOCUMENTS', tab: 'Documents' },
  { icon: 'group', label: 'CONTACTS', tab: 'Contacts' },
  { icon: 'gavel', label: 'RIGHTS', tab: 'Rights' },
];

export const HomeScreen: React.FC = () => {
  const { isActive, contactsNotified, incidentId, triggerPanic } = usePanic();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <View style={s.avatarBtn}>
          <MaterialIcons name="person" size={18} color={colors.textSecondary} />
        </View>
        <Text style={s.appName}>PAN!C</Text>
        <Pressable style={s.settingsBtn}>
          <MaterialIcons name="settings" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.statusCard}>
          <View style={s.statusLeft}>
            <MaterialIcons name="security" size={20} color={isActive ? colors.primary : colors.textPrimary} />
            <Text style={s.statusLabel}>{isActive ? 'ALERT ACTIVE' : 'PROTECTED'}</Text>
          </View>
          <View style={[s.statusBadge, isActive && s.statusBadgeActive]}>
            <Text style={[s.statusBadgeText, isActive && s.statusBadgeTextActive]}>
              {isActive ? 'ACTIVE' : 'READY'}
            </Text>
          </View>
        </View>

        <View style={s.panicWrap}>
          <PanicButton
            onPress={() => { triggerPanic().then(() => navigation.navigate('Home')); }}
            isActive={isActive}
          />
          {isActive && (
            <Text style={s.incidentHint}>
              {incidentId} · {contactsNotified} contacts notified
            </Text>
          )}
        </View>

        <View style={s.grid}>
          {GRID.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [s.gridTile, pressed && s.gridTilePressed]}
              onPress={() => navigation.navigate(item.tab)}
            >
              <MaterialIcons name={item.icon} size={26} color={colors.textSecondary} />
              <Text style={s.gridLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.sectionTitle}>RECENT ACTIVITY</Text>

        {ACTIVITY.map((a, i) => (
          <View key={i} style={s.activityRow}>
            <View style={s.activityIcon}>
              <MaterialIcons name={a.icon} size={18} color={colors.textSecondary} />
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
    paddingHorizontal: spacing.md, height: 52,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  avatarBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  appName: {
    fontSize: 20, fontWeight: '800', color: colors.primary,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  settingsBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 100, gap: spacing.md },

  statusCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBadge: {
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: colors.surfaceHighest, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  statusBadgeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusBadgeText: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  statusBadgeTextActive: { color: colors.onPrimary },

  panicWrap: { alignItems: 'center', paddingVertical: spacing.lg },
  incidentHint: {
    fontSize: 12, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sm,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridTile: {
    width: '48.5%', backgroundColor: colors.surfaceContainer,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md,
    minHeight: 96, justifyContent: 'space-between',
  },
  gridTilePressed: { backgroundColor: colors.surfaceElevated, borderColor: colors.outline },
  gridLabel: {
    fontSize: 15, fontWeight: '700', color: colors.textPrimary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm,
  },

  sectionTitle: {
    fontSize: 20, fontWeight: '800', color: colors.textPrimary,
    letterSpacing: 1, textTransform: 'uppercase',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
    marginTop: spacing.xs,
  },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md,
  },
  activityIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  activityInfo: { flex: 1 },
  activityLabel: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  activitySub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  activityTime: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' },
});
