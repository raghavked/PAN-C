import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

interface VaultDoc {
  id: string;
  name: string;
  icon: MIName;
  idHint?: string;
  expiresAt?: string;
  status: 'expiring' | 'valid' | 'notarized';
  statusLabel: string;
  extra?: string;
}

const DOCS: VaultDoc[] = [
  {
    id: '1', name: 'Primary Passport', icon: 'badge',
    idHint: 'ID: *******892', expiresAt: 'Oct 24, 2026',
    status: 'expiring', statusLabel: 'EXPIRING SOON',
  },
  {
    id: '2', name: 'Work Visa', icon: 'description',
    extra: 'Region: EU-Schengen', expiresAt: 'Jan 15, 2028',
    status: 'valid', statusLabel: 'READY TO SHARE',
  },
  {
    id: '3', name: 'Power of Attorney', icon: 'gavel',
    extra: 'Status: Notarized', expiresAt: undefined,
    status: 'notarized', statusLabel: 'READY TO SHARE',
  },
];

export const DocumentsScreen: React.FC = () => (
  <SafeAreaView style={s.safe}>
    <View style={s.topBar}>
      <Text style={s.appName}>PAN!C</Text>
    </View>

    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>VAULT</Text>
        <Text style={s.pageSub}>
          Secure encrypted storage for critical identity and legal documentation. Required for immediate deployment.
        </Text>
      </View>

      <Pressable style={({ pressed }) => [s.uploadBtn, pressed && s.uploadBtnPressed]}>
        <MaterialIcons name="upload-file" size={18} color={colors.onPrimary} />
        <Text style={s.uploadBtnText}>UPLOAD DOCUMENT</Text>
      </Pressable>

      {DOCS.map((doc) => (
        <View key={doc.id} style={[s.card, doc.status === 'expiring' && s.cardExpiring]}>
          {doc.status === 'expiring' && <View style={s.cardAccent} />}

          <View style={s.cardTop}>
            <View style={s.docIconWrap}>
              <MaterialIcons name={doc.icon} size={24} color={colors.textSecondary} />
            </View>
            <View style={[s.statusBadge, doc.status === 'expiring' ? s.badgeRed : s.badgeGray]}>
              {doc.status === 'expiring'
                ? <MaterialIcons name="warning" size={11} color={colors.onPrimary} />
                : <MaterialIcons name="check-circle" size={11} color={colors.textSecondary} />}
              <Text style={[s.statusBadgeText, doc.status === 'expiring' ? s.badgeRedText : s.badgeGrayText]}>
                {doc.statusLabel}
              </Text>
            </View>
          </View>

          <Text style={s.docName}>{doc.name.toUpperCase()}</Text>

          <View style={s.metaBlock}>
            {doc.idHint && (
              <View style={s.metaRow}>
                <MaterialIcons name="fingerprint" size={14} color={colors.textMuted} />
                <Text style={s.metaText}>{doc.idHint}</Text>
              </View>
            )}
            {doc.extra && (
              <View style={s.metaRow}>
                <MaterialIcons name="language" size={14} color={colors.textMuted} />
                <Text style={s.metaText}>{doc.extra}</Text>
              </View>
            )}
            {doc.expiresAt && (
              <View style={s.metaRow}>
                <MaterialIcons name="event" size={14} color={doc.status === 'expiring' ? colors.primary : colors.textMuted} />
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
        <MaterialIcons name="lock" size={16} color={colors.textMuted} />
        <Text style={s.encryptedText}>
          Documents are encrypted and stored securely. Shared with emergency contacts only when authorized.
        </Text>
      </View>
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
  pageTitle: { fontSize: 40, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, width: '100%',
  },
  uploadBtnPressed: { opacity: 0.85 },
  uploadBtnText: { fontSize: 13, fontWeight: '800', color: colors.onPrimary, textTransform: 'uppercase', letterSpacing: 1 },

  card: {
    backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: spacing.md, gap: 10, overflow: 'hidden',
  },
  cardExpiring: { borderColor: colors.outlineVariant },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 4 },
  docIconWrap: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5,
  },
  badgeRed: { backgroundColor: colors.primary },
  badgeGray: { backgroundColor: colors.surfaceHighest },
  statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeRedText: { color: colors.onPrimary },
  badgeGrayText: { color: colors.textSecondary },

  docName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },

  metaBlock: { gap: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, color: colors.textSecondary },
  metaRed: { color: colors.primary },

  divider: { height: 1, backgroundColor: colors.surfaceBorder },

  cardActions: { flexDirection: 'row', gap: spacing.sm },
  viewBtn: {
    flex: 1, borderWidth: 2, borderColor: colors.primary,
    borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center',
  },
  viewBtnPressed: { backgroundColor: colors.primary },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  updateBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center',
    backgroundColor: colors.surface,
  },
  updateBtnPressed: { borderColor: colors.outline },
  updateBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase' },

  encryptedNote: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  encryptedText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
});
