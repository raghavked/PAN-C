import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../utils/apiClient';
import { colors, spacing, radius } from '../theme';

type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

interface VaultDoc {
  _id: string;
  type: string;
  fileName: string;
  mimeType?: string;
  expiresAt?: string;
  uploadedAt: string;
  shareableLink?: string;
}

const DOC_ICONS: Record<string, MIName> = {
  passport: 'badge',
  visa: 'description',
  id: 'credit-card',
  'power-of-attorney': 'gavel',
  'birth-certificate': 'verified',
  'work-permit': 'work',
  other: 'folder',
};

function getDocIcon(type: string): MIName {
  return DOC_ICONS[type?.toLowerCase()] ?? 'description';
}

function isExpiringSoon(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const DocumentsScreen: React.FC = () => {
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await api.get<{ documents: VaultDoc[] }>('/documents');
      setDocs(data.documents);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = (id: string, fileName: string) => {
    const confirmed = typeof window !== 'undefined' && window.confirm
      ? window.confirm(`Remove "${fileName}" from the vault?`)
      : true;
    if (!confirmed) return;
    api.delete(`/documents/${id}`)
      .then(() => setDocs((prev) => prev.filter((d) => d._id !== id)))
      .catch(() => {});
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.appName}>PAN!C</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>VAULT</Text>
          <Text style={s.pageSub}>
            Secure encrypted storage for critical identity and legal documentation.
          </Text>
        </View>

        <View style={s.uploadNote}>
          <MaterialIcons name="info-outline" size={15} color={colors.textSecondary} />
          <Text style={s.uploadNoteText}>
            Upload documents via the mobile app. Documents are encrypted with AES-256-GCM before storage.
          </Text>
        </View>

        {loading && (
          <View style={s.centerBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={s.centerText}>Loading vault...</Text>
          </View>
        )}

        {!loading && fetchError && (
          <View style={s.errorBox}>
            <MaterialIcons name="error-outline" size={18} color={colors.primary} />
            <Text style={s.errorText}>{fetchError}</Text>
            <Pressable onPress={fetchDocs} style={s.retryBtn}>
              <Text style={s.retryText}>RETRY</Text>
            </Pressable>
          </View>
        )}

        {!loading && !fetchError && docs.length === 0 && (
          <View style={s.emptyBox}>
            <MaterialIcons name="folder-off" size={40} color={colors.textMuted} />
            <Text style={s.emptyTitle}>Vault Empty</Text>
            <Text style={s.emptyDesc}>
              No documents stored yet. Upload your passport, visa, or legal documents to keep them secure and accessible.
            </Text>
          </View>
        )}

        {docs.map((doc) => {
          const expiring = isExpiringSoon(doc.expiresAt);
          return (
            <View key={doc._id} style={[s.card, expiring && s.cardExpiring]}>
              {expiring && <View style={s.cardAccent} />}

              <View style={s.cardTop}>
                <View style={s.docIconWrap}>
                  <MaterialIcons name={getDocIcon(doc.type)} size={24} color={colors.textSecondary} />
                </View>
                <View style={[s.statusBadge, expiring ? s.badgeRed : s.badgeGray]}>
                  {expiring
                    ? <MaterialIcons name="warning" size={11} color={colors.onPrimary} />
                    : <MaterialIcons name="check-circle" size={11} color={colors.textSecondary} />}
                  <Text style={[s.statusBadgeText, expiring ? s.badgeRedText : s.badgeGrayText]}>
                    {expiring ? 'EXPIRING SOON' : 'READY TO SHARE'}
                  </Text>
                </View>
              </View>

              <Text style={s.docName}>{doc.fileName.toUpperCase()}</Text>

              <View style={s.metaBlock}>
                <View style={s.metaRow}>
                  <MaterialIcons name="label" size={14} color={colors.textMuted} />
                  <Text style={s.metaText}>{doc.type.toUpperCase()}</Text>
                </View>
                <View style={s.metaRow}>
                  <MaterialIcons name="upload" size={14} color={colors.textMuted} />
                  <Text style={s.metaText}>Uploaded {formatDate(doc.uploadedAt)}</Text>
                </View>
                {doc.expiresAt && (
                  <View style={s.metaRow}>
                    <MaterialIcons name="event" size={14} color={expiring ? colors.primary : colors.textMuted} />
                    <Text style={[s.metaText, expiring && s.metaRed]}>
                      Expires {formatDate(doc.expiresAt)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={s.divider} />

              <View style={s.cardActions}>
                <Pressable style={({ pressed }) => [s.viewBtn, pressed && s.viewBtnPressed]}>
                  <Text style={s.viewBtnText}>VIEW</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [s.deleteDocBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleDelete(doc._id, doc.fileName)}
                >
                  <MaterialIcons name="delete-outline" size={16} color={colors.textMuted} />
                  <Text style={s.deleteDocBtnText}>REMOVE</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <View style={s.encryptedNote}>
          <MaterialIcons name="lock" size={16} color={colors.textMuted} />
          <Text style={s.encryptedText}>
            Documents are encrypted and stored securely. Shared with emergency contacts only when authorized.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 52, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder },
  appName: { fontSize: 20, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  pageHeader: { gap: 6 },
  pageTitle: { fontSize: 40, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  uploadNote: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: colors.surfaceContainer, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.surfaceBorder },
  uploadNoteText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  centerBox: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  centerText: { color: colors.textMuted, fontSize: 14 },
  errorBox: { alignItems: 'center', gap: 10, padding: spacing.lg, backgroundColor: 'rgba(248,91,88,0.1)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(248,91,88,0.3)' },
  errorText: { color: colors.primary, fontSize: 14, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  card: { backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.md, padding: spacing.md, gap: 10, overflow: 'hidden' },
  cardExpiring: { borderColor: colors.outlineVariant },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 4 },
  docIconWrap: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  badgeRed: { backgroundColor: colors.primary },
  badgeGray: { backgroundColor: colors.surfaceHighest },
  statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeRedText: { color: colors.onPrimary },
  badgeGrayText: { color: colors.textSecondary },
  docName: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  metaBlock: { gap: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, color: colors.textSecondary },
  metaRed: { color: colors.primary },
  divider: { height: 1, backgroundColor: colors.surfaceBorder },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  viewBtn: { flex: 1, borderWidth: 2, borderColor: colors.primary, borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  viewBtnPressed: { backgroundColor: colors.primary },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  deleteDocBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.sm },
  deleteDocBtnText: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  encryptedNote: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.surfaceBorder },
  encryptedText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
});
