import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { colors, spacing, radius } from '../theme';

interface VaultDoc {
  id: string;
  name: string;
  icon: string;
  idHint?: string;
  expiresAt?: string;
  status: 'expiring' | 'valid' | 'notarized';
  statusLabel: string;
  extra?: string;
}

const DOCS: VaultDoc[] = [
  {
    id: '1', name: 'Primary Passport', icon: '🛂',
    idHint: 'ID: *******892', expiresAt: 'Oct 24, 2026',
    status: 'expiring', statusLabel: '⚠ EXPIRING SOON',
  },
  {
    id: '2', name: 'Work Authorization', icon: '📋',
    extra: 'Category: Work Visa', expiresAt: 'Jan 15, 2028',
    status: 'valid', statusLabel: '✓ READY TO SHARE',
  },
  {
    id: '3', name: 'Power of Attorney', icon: '⚖️',
    extra: 'Status: Notarized', expiresAt: undefined,
    status: 'notarized', statusLabel: '✓ READY TO SHARE',
  },
];

export const DocumentsScreen: React.FC = () => (
  <SafeAreaView style={s.safe}>
    <View style={s.topBar}>
      <Text style={s.appName}>PAN!C</Text>
    </View>

    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Page Header */}
      <View style={s.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.pageTitle}>VAULT</Text>
          <Text style={s.pageSub}>Secure encrypted storage for critical identity and legal documentation.</Text>
        </View>
        <Pressable style={({ pressed }) => [s.uploadBtn, pressed && s.uploadBtnPressed]}>
          <Text style={s.uploadBtnText}>⬆ UPLOAD</Text>
        </Pressable>
      </View>

      {/* Document Cards */}
      {DOCS.map((doc) => (
        <View key={doc.id} style={s.card}>
          {doc.status === 'expiring' && <View style={s.cardAccent} />}
          <View style={s.cardTop}>
            <View style={s.docIconWrap}>
              <Text style={s.docIcon}>{doc.icon}</Text>
            </View>
            <View style={[s.statusBadge, doc.status === 'expiring' ? s.badgeRed : s.badgeGray]}>
              <Text style={[s.statusBadgeText, doc.status === 'expiring' ? s.badgeRedText : s.badgeGrayText]}>
                {doc.statusLabel}
              </Text>
            </View>
          </View>

          <View style={s.cardBody}>
            <Text style={s.docName}>{doc.name.toUpperCase()}</Text>
            {doc.idHint && (
              <View style={s.metaRow}>
                <Text style={s.metaIcon}>🔍</Text>
                <Text style={s.metaText}>{doc.idHint}</Text>
              </View>
            )}
            {doc.extra && (
              <View style={s.metaRow}>
                <Text style={s.metaIcon}>🌐</Text>
                <Text style={s.metaText}>{doc.extra}</Text>
              </View>
            )}
            {doc.expiresAt && (
              <View style={s.metaRow}>
                <Text style={s.metaIcon}>📅</Text>
                <Text style={[s.metaText, doc.status === 'expiring' && s.metaRed]}>
                  Exp: {doc.expiresAt}
                </Text>
              </View>
            )}
          </View>

          <View style={s.divider} />

          <View style={s.cardActions}>
            <Pressable style={({ pressed }) => [s.viewBtn, pressed && s.viewBtnPressed]}>
              <Text style={s.viewBtnText}>VIEW</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [s.updateBtn, pressed && s.updateBtnPressed]}>
              <Text style={s.updateBtnText}>UPDATE</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={s.encryptedNote}>
        <Text style={s.encryptedIcon}>🔒</Text>
        <Text style={s.encryptedText}>
          Documents are encrypted and stored securely. Shared with emergency contacts only when you authorize it.
        </Text>
      </View>
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
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.sm },
  pageTitle: { fontSize: 40, fontWeight: '800', color: colors.textPrimary, lineHeight: 48 },
  pageSub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 4, maxWidth: 240 },
  uploadBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    alignSelf: 'flex-start', marginTop: 8,
  },
  uploadBtnPressed: { opacity: 0.8 },
  uploadBtnText: { fontSize: 12, fontWeight: '700', color: colors.onPrimary, textTransform: 'uppercase' },
  card: {
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: spacing.md, overflow: 'hidden',
  },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.primary },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 },
  docIconWrap: {
    width: 48, height: 48, borderRadius: radius.sm,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  docIcon: { fontSize: 24 },
  statusBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  badgeRed: { backgroundColor: colors.primary },
  badgeGray: { backgroundColor: colors.surfaceHighest },
  statusBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeRedText: { color: colors.onPrimary },
  badgeGrayText: { color: colors.textPrimary },
  cardBody: { gap: 6 },
  docName: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaIcon: { fontSize: 14 },
  metaText: { fontSize: 14, color: colors.textSecondary },
  metaRed: { color: colors.primary },
  divider: { height: 1, backgroundColor: colors.surfaceBorder },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  viewBtn: {
    flex: 1, borderWidth: 2, borderColor: colors.primary,
    borderRadius: radius.sm, paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  viewBtnPressed: { backgroundColor: colors.primary },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  updateBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.sm, paddingVertical: spacing.sm,
    alignItems: 'center', backgroundColor: colors.surface,
  },
  updateBtnPressed: { borderColor: colors.outline },
  updateBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase' },
  encryptedNote: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  encryptedIcon: { fontSize: 18 },
  encryptedText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
