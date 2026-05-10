import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable,
} from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface Contact {
  id: string;
  name: string;
  initials: string;
  relationship: string;
  phone: string;
  permissionLevel: string;
  permissionDesc: string;
  hasSMS: boolean;
  hasLocation: boolean;
  isPrimary?: boolean;
}

const CONTACTS: Contact[] = [
  {
    id: '1', name: 'Maria Garcia', initials: 'MG', relationship: 'Sister',
    phone: '+1 (555) 123-4567', permissionLevel: 'Level 1',
    permissionDesc: 'Full Access & Override', hasSMS: true, hasLocation: true, isPrimary: true,
  },
  {
    id: '2', name: 'Carlos Lopez', initials: 'CL', relationship: 'Friend',
    phone: '+1 (555) 987-6543', permissionLevel: 'Level 2',
    permissionDesc: 'Notifications Only', hasSMS: true, hasLocation: false,
  },
  {
    id: '3', name: 'Ana Rodriguez', initials: 'AR', relationship: 'Neighbor',
    phone: '+1 (555) 456-7890', permissionLevel: 'Level 1',
    permissionDesc: 'Full Access & Override', hasSMS: true, hasLocation: true, isPrimary: true,
  },
  {
    id: '4', name: 'RAICES Hotline', initials: 'RL', relationship: 'Legal Aid',
    phone: '+1 (888) 587-7777', permissionLevel: 'Level 1',
    permissionDesc: 'Full Access & Override', hasSMS: true, hasLocation: false, isPrimary: true,
  },
];

export const ContactsScreen: React.FC = () => (
  <SafeAreaView style={s.safe}>
    {/* Top Bar */}
    <View style={s.topBar}>
      <Text style={s.appName}>PAN!C</Text>
    </View>

    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Page Header */}
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>Emergency{'\n'}Contacts</Text>
          <Text style={s.pageSub}>Authorized personnel and their permissions.</Text>
        </View>
        <Pressable style={({ pressed }) => [s.addBtn, pressed && s.addBtnPressed]}>
          <Text style={s.addBtnText}>+ ADD CONTACT</Text>
        </Pressable>
      </View>

      {/* Contact Cards */}
      {CONTACTS.map((c) => (
        <View key={c.id} style={s.card}>
          {c.isPrimary && <View style={s.cardAccent} />}
          {/* Card Header */}
          <View style={s.cardHeader}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{c.initials}</Text>
            </View>
            <View>
              <Text style={s.contactName}>{c.name}</Text>
              <Text style={s.contactRel}>{c.relationship.toUpperCase()}</Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* Permission */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>PERMISSION LEVEL</Text>
            <View style={s.permissionRow}>
              <Text style={s.permIcon}>{c.permissionLevel === 'Level 1' ? '🔐' : '⚖️'}</Text>
              <Text style={s.permText}>{c.permissionLevel} ({c.permissionDesc})</Text>
            </View>
          </View>

          {/* Channels */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>ACTIVE CHANNELS</Text>
            <View style={s.chips}>
              <View style={[s.chip, s.chipActive]}>
                <Text style={s.chipActiveText}>📱 SMS ALERTS</Text>
              </View>
              {c.hasLocation ? (
                <View style={[s.chip, s.chipActive]}>
                  <Text style={s.chipActiveText}>📍 LIVE LOCATION</Text>
                </View>
              ) : (
                <View style={[s.chip, s.chipInactive]}>
                  <Text style={s.chipInactiveText}>📍 LOCATION OFF</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action */}
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
    height: 56, justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  appName: { fontSize: 22, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  pageHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  pageTitle: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, lineHeight: 40 },
  pageSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  addBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    alignSelf: 'flex-end',
  },
  addBtnPressed: { opacity: 0.8 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: colors.onPrimary, textTransform: 'uppercase' },
  card: {
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, overflow: 'hidden',
  },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.surfaceHighest, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  contactName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  contactRel: { fontSize: 11, fontWeight: '700', color: colors.primarySoft, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.surfaceBorder },
  section: { gap: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.primarySoft, letterSpacing: 1, textTransform: 'uppercase' },
  permissionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  permIcon: { fontSize: 16 },
  permText: { fontSize: 14, color: colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.sm, borderWidth: 1,
  },
  chipActive: { backgroundColor: 'rgba(248,91,88,0.1)', borderColor: colors.primary },
  chipActiveText: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  chipInactive: { backgroundColor: colors.surfaceHighest, borderColor: colors.surfaceBorder, opacity: 0.5 },
  chipInactiveText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  manageBtn: {
    borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.sm,
    paddingVertical: spacing.sm, alignItems: 'center', marginTop: 4,
  },
  manageBtnPressed: { borderColor: colors.primary },
  manageBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
});
