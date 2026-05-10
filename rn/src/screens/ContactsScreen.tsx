import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

interface Contact {
  id: string;
  name: string;
  initials: string;
  relationship: string;
  permissionLevel: string;
  permissionDesc: string;
  hasSMS: boolean;
  hasLocation: boolean;
  isPrimary?: boolean;
}

const CONTACTS: Contact[] = [
  {
    id: '1', name: 'Sarah Jenkins', initials: 'SJ', relationship: 'Next of Kin',
    permissionLevel: 'Level 1', permissionDesc: 'Full Access & Override',
    hasSMS: true, hasLocation: true, isPrimary: true,
  },
  {
    id: '2', name: 'Michael Doe', initials: 'MD', relationship: 'Legal Counsel',
    permissionLevel: 'Level 2', permissionDesc: 'Notifications Only',
    hasSMS: true, hasLocation: false,
  },
  {
    id: '3', name: 'Alex Mercer', initials: 'AM', relationship: 'Emergency Proxy',
    permissionLevel: 'Level 1', permissionDesc: 'Full Access & Override',
    hasSMS: true, hasLocation: true, isPrimary: true,
  },
];

export const ContactsScreen: React.FC = () => (
  <SafeAreaView style={s.safe}>
    <View style={s.topBar}>
      <Text style={s.appName}>PAN!C</Text>
    </View>

    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>{'Emergency\nContacts'}</Text>
        <Text style={s.pageSub}>Manage authorized personnel and their operational permissions.</Text>
      </View>

      <Pressable style={({ pressed }) => [s.addBtn, pressed && s.addBtnPressed]}>
        <MaterialIcons name="add" size={18} color={colors.onPrimary} />
        <Text style={s.addBtnText}>ADD CONTACT</Text>
      </Pressable>

      {CONTACTS.map((c) => (
        <View key={c.id} style={[s.card, c.isPrimary && s.cardPrimary]}>
          {c.isPrimary && <View style={s.cardAccent} />}

          <View style={s.cardHeader}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{c.initials}</Text>
            </View>
            <View style={s.cardHeaderInfo}>
              <Text style={s.contactName}>{c.name}</Text>
              <Text style={s.contactRel}>{c.relationship.toUpperCase()}</Text>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.section}>
            <Text style={s.sectionLabel}>PERMISSION LEVEL</Text>
            <View style={s.permRow}>
              <MaterialIcons
                name={c.permissionLevel === 'Level 1' ? 'security' : 'notifications'}
                size={15}
                color={colors.primary}
              />
              <Text style={s.permText}>{c.permissionLevel} ({c.permissionDesc})</Text>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionLabel}>ACTIVE CHANNELS</Text>
            <View style={s.chips}>
              <View style={s.chipActive}>
                <MaterialIcons name="message" size={11} color={colors.primary} />
                <Text style={s.chipActiveText}>SMS ALERTS</Text>
              </View>
              {c.hasLocation ? (
                <View style={s.chipActive}>
                  <MaterialIcons name="location-on" size={11} color={colors.primary} />
                  <Text style={s.chipActiveText}>LIVE LOCATION</Text>
                </View>
              ) : (
                <View style={s.chipInactive}>
                  <MaterialIcons name="location-off" size={11} color={colors.textMuted} />
                  <Text style={s.chipInactiveText}>LOCATION</Text>
                </View>
              )}
            </View>
          </View>

          <Pressable style={({ pressed }) => [s.manageBtn, pressed && s.manageBtnPressed]}>
            <Text style={s.manageBtnText}>MANAGE ACCESS</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  </SafeAreaView>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    height: 52, justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  appName: { fontSize: 20, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },

  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },

  pageHeader: { gap: 6 },
  pageTitle: { fontSize: 34, fontWeight: '800', color: colors.textPrimary, lineHeight: 42 },
  pageSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, width: '100%',
  },
  addBtnPressed: { opacity: 0.85 },
  addBtnText: { fontSize: 13, fontWeight: '800', color: colors.onPrimary, textTransform: 'uppercase', letterSpacing: 1 },

  card: {
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, overflow: 'hidden',
  },
  cardPrimary: { borderColor: colors.outlineVariant },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 4 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.surfaceHighest, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  cardHeaderInfo: { flex: 1 },
  contactName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  contactRel: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },

  divider: { height: 1, backgroundColor: colors.surfaceBorder },

  section: { gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  permText: { fontSize: 13, color: colors.textPrimary },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipActive: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(248,91,88,0.1)', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary,
  },
  chipActiveText: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipInactive: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: colors.surfaceHighest, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.surfaceBorder, opacity: 0.5,
  },
  chipInactiveText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  manageBtn: {
    borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.sm,
    paddingVertical: 10, alignItems: 'center', marginTop: 4,
  },
  manageBtnPressed: { borderColor: colors.outline, backgroundColor: colors.surfaceElevated },
  manageBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
});
