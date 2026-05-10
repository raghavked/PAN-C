import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable,
  ActivityIndicator, Modal, TextInput, Alert, Linking, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';
import { api, apiRequest } from '../utils/apiClient';
import { storage } from '../utils/storage';
import { colors, spacing, radius } from '../theme';

type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

// ── Types ──────────────────────────────────────────────────────────────────────
interface VaultDoc {
  _id: string;
  type: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  expiresAt?: string;
  uploadedAt: string;
  shareableLink?: string;
  shareableExpiresAt?: string;
  isSharedWithContacts?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const DOC_TYPES = [
  'Passport', 'Visa', 'Green Card', 'EAD Card', 'Birth Certificate',
  'Driver License', 'Social Security Card', 'Court Documents', 'Other',
];

const DOC_ICONS: Record<string, MIName> = {
  Passport: 'badge', Visa: 'description', 'Green Card': 'verified',
  'EAD Card': 'credit-card', 'Birth Certificate': 'verified',
  'Driver License': 'directions-car', 'Social Security Card': 'lock',
  'Court Documents': 'gavel', Other: 'folder',
};

const SHARE_EXPIRY_OPTIONS = [
  { label: '24 hours', hours: 24 },
  { label: '72 hours', hours: 72 },
  { label: '7 days', hours: 168 },
  { label: '30 days', hours: 720 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr?: string) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isExpiringSoon(expiresAt?: string) {
  const d = daysUntil(expiresAt);
  return d !== null && d > 0 && d <= 30;
}

function isExpired(expiresAt?: string) {
  const d = daysUntil(expiresAt);
  return d !== null && d < 0;
}

// ── Component ──────────────────────────────────────────────────────────────────
export const DocumentsScreen: React.FC = () => {
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState('Passport');
  const [docTypeIndex, setDocTypeIndex] = useState(0);
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; mimeType: string; size?: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Share modal
  const [shareDoc, setShareDoc] = useState<VaultDoc | null>(null);
  const [shareExpiryHours, setShareExpiryHours] = useState(72);
  const [shareResult, setShareResult] = useState<{ shareUrl: string; expiresAt: string } | null>(null);
  const [sharing, setSharing] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────
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

  // ── Pick file ───────────────────────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      });
      setUploadError(null);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Could not pick file');
    }
  };

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) { setUploadError('Please select a file first'); return; }
    setUploading(true);
    setUploadError(null);
    try {
      // Read file as base64 and use the base64 upload endpoint (works on native)
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await apiRequest('/documents/base64', 'POST', {
        type: docType,
        fileName: selectedFile.name,
        fileDataBase64: base64,
        mimeType: selectedFile.mimeType,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });

      setShowUpload(false);
      setSelectedFile(null);
      setExpiresAt('');
      setDocType('Passport');
      setDocTypeIndex(0);
      await fetchDocs();
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = (doc: VaultDoc) => {
    Alert.alert(
      'Remove Document',
      `Remove "${doc.fileName}" from the vault? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/documents/${doc._id}`);
              setDocs((prev) => prev.filter((d) => d._id !== doc._id));
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Delete failed');
            }
          },
        },
      ]
    );
  };

  // ── View (open in browser / system viewer) ──────────────────────────────────
  const handleView = async (doc: VaultDoc) => {
    // Generate a fresh share link (24h) and open it in the system browser
    try {
      const data = await apiRequest<{ shareUrl: string }>(
        `/documents/${doc._id}/share`, 'POST', { expiresInHours: 24 }
      );
      if (data.shareUrl) {
        await Linking.openURL(data.shareUrl);
        await fetchDocs();
      }
    } catch {
      Alert.alert('Error', 'Could not open document. Make sure the server is running.');
    }
  };

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleGenerateShare = async () => {
    if (!shareDoc) return;
    setSharing(true);
    try {
      const data = await apiRequest<{ shareUrl: string; expiresAt: string }>(
        `/documents/${shareDoc._id}/share`, 'POST', { expiresInHours: shareExpiryHours }
      );
      setShareResult({ shareUrl: data.shareUrl, expiresAt: data.expiresAt });
      await fetchDocs();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Share failed');
    } finally {
      setSharing(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!shareDoc) return;
    Alert.alert(
      'Revoke Share Link',
      'Anyone with the current link will lose access. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/documents/${shareDoc._id}/share`);
              setShareDoc(null);
              setShareResult(null);
              await fetchDocs();
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Revoke failed');
            }
          },
        },
      ]
    );
  };

  const handleCopyLink = async (url: string) => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(url);
      Alert.alert('Copied!', 'Share link copied to clipboard.');
    } catch {
      // Fallback: just open it
      await Linking.openURL(url);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.appName}>PAN!C</Text>
        <Pressable style={s.uploadBtn} onPress={() => { setShowUpload(true); setUploadError(null); }}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={s.uploadBtnText}>UPLOAD</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>VAULT</Text>
          <Text style={s.pageSub}>
            Encrypted storage for identity and legal documents. AES-256-GCM protected.
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
              Upload your passport, visa, green card, or legal documents. They are encrypted and only accessible by you.
            </Text>
            <Pressable style={s.emptyUploadBtn} onPress={() => setShowUpload(true)}>
              <Text style={s.emptyUploadBtnText}>+ UPLOAD FIRST DOCUMENT</Text>
            </Pressable>
          </View>
        )}

        {docs.map((doc) => {
          const expiring = isExpiringSoon(doc.expiresAt);
          const expired = isExpired(doc.expiresAt);
          const dLeft = daysUntil(doc.expiresAt);
          const hasShare = doc.isSharedWithContacts &&
            doc.shareableExpiresAt && new Date(doc.shareableExpiresAt) > new Date();

          return (
            <View key={doc._id} style={[s.card, (expiring || expired) && s.cardExpiring]}>
              {(expiring || expired) && <View style={s.cardAccent} />}

              <View style={s.cardTop}>
                <View style={s.docIconWrap}>
                  <MaterialIcons name={DOC_ICONS[doc.type] ?? 'description'} size={24} color={colors.textSecondary} />
                </View>
                <View style={[s.statusBadge, (expiring || expired) ? s.badgeRed : s.badgeGray]}>
                  <MaterialIcons
                    name={(expiring || expired) ? 'warning' : 'check-circle'}
                    size={11}
                    color={(expiring || expired) ? '#fff' : colors.textSecondary}
                  />
                  <Text style={[s.statusBadgeText, (expiring || expired) ? s.badgeRedText : s.badgeGrayText]}>
                    {expired ? 'EXPIRED' : expiring ? 'EXPIRING SOON' : 'READY'}
                  </Text>
                </View>
              </View>

              <Text style={s.docName}>{doc.fileName.toUpperCase()}</Text>

              <View style={s.metaBlock}>
                <View style={s.metaRow}>
                  <MaterialIcons name="label" size={14} color={colors.textMuted} />
                  <Text style={s.metaText}>{doc.type.toUpperCase()}</Text>
                </View>
                {!!doc.fileSize && (
                  <View style={s.metaRow}>
                    <MaterialIcons name="storage" size={14} color={colors.textMuted} />
                    <Text style={s.metaText}>{formatBytes(doc.fileSize)}</Text>
                  </View>
                )}
                <View style={s.metaRow}>
                  <MaterialIcons name="upload" size={14} color={colors.textMuted} />
                  <Text style={s.metaText}>Uploaded {formatDate(doc.uploadedAt)}</Text>
                </View>
                {doc.expiresAt && (
                  <View style={s.metaRow}>
                    <MaterialIcons name="event" size={14} color={(expiring || expired) ? colors.primary : colors.textMuted} />
                    <Text style={[s.metaText, (expiring || expired) && s.metaRed]}>
                      {expired
                        ? `Expired ${Math.abs(dLeft!)} day${Math.abs(dLeft!) !== 1 ? 's' : ''} ago`
                        : expiring
                          ? `Expires in ${dLeft} day${dLeft !== 1 ? 's' : ''}`
                          : `Expires ${formatDate(doc.expiresAt)}`}
                    </Text>
                  </View>
                )}
                {hasShare && (
                  <View style={s.metaRow}>
                    <MaterialIcons name="link" size={14} color="#378ADD" />
                    <Text style={[s.metaText, { color: '#378ADD' }]}>
                      Shared · expires {formatDate(doc.shareableExpiresAt)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={s.divider} />

              <View style={s.cardActions}>
                <Pressable
                  style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleView(doc)}
                >
                  <MaterialIcons name="open-in-browser" size={16} color={colors.primary} />
                  <Text style={s.actionBtnText}>VIEW</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => { setShareDoc(doc); setShareResult(null); }}
                >
                  <MaterialIcons name="link" size={16} color={colors.primary} />
                  <Text style={s.actionBtnText}>SHARE</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [s.deleteDocBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleDelete(doc)}
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
            Documents are AES-256-GCM encrypted. Shared with emergency contacts only when authorized.
          </Text>
        </View>
      </ScrollView>

      {/* ── Upload Modal ── */}
      <Modal visible={showUpload} animationType="slide" transparent onRequestClose={() => setShowUpload(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Upload Document</Text>
              <Pressable onPress={() => setShowUpload(false)}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={s.encryptBanner}>
              <MaterialIcons name="lock" size={14} color="#639922" />
              <Text style={s.encryptBannerText}>
                Files are encrypted with AES-256-GCM before storage.
              </Text>
            </View>

            {uploadError && (
              <View style={s.uploadErrorBox}>
                <Text style={s.uploadErrorText}>{uploadError}</Text>
              </View>
            )}

            <Text style={s.fieldLabel}>DOCUMENT TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {DOC_TYPES.map((t, i) => (
                  <Pressable
                    key={t}
                    style={[s.typeChip, docTypeIndex === i && s.typeChipActive]}
                    onPress={() => { setDocType(t); setDocTypeIndex(i); }}
                  >
                    <Text style={[s.typeChipText, docTypeIndex === i && s.typeChipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={s.fieldLabel}>FILE</Text>
            <Pressable style={s.filePicker} onPress={handlePickFile}>
              {selectedFile ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="check-circle" size={32} color="#639922" />
                  <Text style={{ color: colors.textPrimary, fontWeight: '700', textAlign: 'center' }}>
                    {selectedFile.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {formatBytes(selectedFile.size)} · Tap to change
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="upload-file" size={36} color={colors.textMuted} />
                  <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>TAP TO SELECT FILE</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>PDF, JPG, PNG, DOC · Max 20 MB</Text>
                </View>
              )}
            </Pressable>

            <Text style={s.fieldLabel}>DOCUMENT EXPIRY DATE (OPTIONAL)</Text>
            <TextInput
              style={s.textInput}
              value={expiresAt}
              onChangeText={setExpiresAt}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />

            <View style={s.modalBtns}>
              <Pressable style={s.cancelBtn} onPress={() => setShowUpload(false)}>
                <Text style={s.cancelBtnText}>CANCEL</Text>
              </Pressable>
              <Pressable
                style={[s.saveBtn, (!selectedFile || uploading) && { opacity: 0.5 }]}
                onPress={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveBtnText}>🔐 UPLOAD SECURELY</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Share Modal ── */}
      <Modal visible={!!shareDoc} animationType="slide" transparent onRequestClose={() => { setShareDoc(null); setShareResult(null); }}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Share Document</Text>
                {shareDoc && <Text style={s.modalSub}>{shareDoc.fileName}</Text>}
              </View>
              <Pressable onPress={() => { setShareDoc(null); setShareResult(null); }}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {!shareResult ? (
              <>
                <Text style={s.shareInfo}>
                  Generate a private, time-limited link anyone can use to view this document — no login required. Also included in panic alerts for contacts with document access.
                </Text>

                <Text style={s.fieldLabel}>LINK EXPIRY</Text>
                <View style={s.expiryGrid}>
                  {SHARE_EXPIRY_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.hours}
                      style={[s.expiryBtn, shareExpiryHours === opt.hours && s.expiryBtnActive]}
                      onPress={() => setShareExpiryHours(opt.hours)}
                    >
                      <Text style={[s.expiryBtnText, shareExpiryHours === opt.hours && s.expiryBtnTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {shareDoc?.isSharedWithContacts && (
                  <View style={s.existingShareNote}>
                    <MaterialIcons name="warning" size={14} color="#BA7517" />
                    <Text style={s.existingShareNoteText}>
                      Active link exists (expires {formatDate(shareDoc.shareableExpiresAt)}). Generating a new link will replace it.
                    </Text>
                  </View>
                )}

                <View style={s.modalBtns}>
                  <Pressable style={s.cancelBtn} onPress={() => setShareDoc(null)}>
                    <Text style={s.cancelBtnText}>CANCEL</Text>
                  </Pressable>
                  <Pressable
                    style={[s.saveBtn, sharing && { opacity: 0.5 }]}
                    onPress={handleGenerateShare}
                    disabled={sharing}
                  >
                    {sharing
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.saveBtnText}>🔗 GENERATE LINK</Text>}
                  </Pressable>
                </View>

                {shareDoc?.isSharedWithContacts && (
                  <Pressable style={s.revokeBtn} onPress={handleRevokeShare}>
                    <Text style={s.revokeBtnText}>🚫 REVOKE EXISTING LINK</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <View style={s.shareLinkBox}>
                  <Text style={s.shareLinkLabel}>🔗 PRIVATE SHARE LINK</Text>
                  <Text style={s.shareLinkUrl} selectable>{shareResult.shareUrl}</Text>
                  <Text style={s.shareLinkExpiry}>
                    Expires: {new Date(shareResult.expiresAt).toLocaleString()}
                  </Text>
                </View>

                <View style={s.modalBtns}>
                  <Pressable style={s.saveBtn} onPress={() => handleCopyLink(shareResult.shareUrl)}>
                    <Text style={s.saveBtnText}>📋 COPY LINK</Text>
                  </Pressable>
                </View>
                <Pressable style={s.cancelBtn} onPress={() => { setShareDoc(null); setShareResult(null); }}>
                  <Text style={s.cancelBtnText}>DONE</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
  },
  appName: { fontSize: 20, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  uploadBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  pageHeader: { gap: 6 },
  pageTitle: { fontSize: 40, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  centerBox: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  centerText: { color: colors.textMuted, fontSize: 14 },
  errorBox: { alignItems: 'center', gap: 10, padding: spacing.lg, backgroundColor: 'rgba(248,91,88,0.1)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(248,91,88,0.3)' },
  errorText: { color: colors.primary, fontSize: 14, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  emptyUploadBtn: { marginTop: 8, backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 20, paddingVertical: 12 },
  emptyUploadBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  card: { backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.md, padding: spacing.md, gap: 10, overflow: 'hidden' },
  cardExpiring: { borderColor: colors.primary },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 4 },
  docIconWrap: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  badgeRed: { backgroundColor: colors.primary },
  badgeGray: { backgroundColor: colors.surfaceHighest },
  statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeRedText: { color: '#fff' },
  badgeGrayText: { color: colors.textSecondary },
  docName: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  metaBlock: { gap: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, color: colors.textSecondary },
  metaRed: { color: colors.primary },
  divider: { height: 1, backgroundColor: colors.surfaceBorder },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, paddingVertical: 9 },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  deleteDocBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.sm },
  deleteDocBtnText: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  encryptedNote: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.surfaceBorder },
  encryptedText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.surfaceContainer, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  modalSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  encryptBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(99,153,34,0.1)', borderWidth: 1, borderColor: 'rgba(99,153,34,0.3)', borderRadius: radius.sm, padding: 10, marginBottom: 16 },
  encryptBannerText: { flex: 1, fontSize: 12, color: '#639922', lineHeight: 18 },
  uploadErrorBox: { backgroundColor: 'rgba(248,91,88,0.1)', borderWidth: 1, borderColor: 'rgba(248,91,88,0.3)', borderRadius: radius.sm, padding: 10, marginBottom: 12 },
  uploadErrorText: { color: colors.primary, fontSize: 13 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surfaceElevated },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  typeChipTextActive: { color: '#fff' },
  filePicker: { backgroundColor: colors.surfaceElevated, borderWidth: 2, borderColor: colors.surfaceBorder, borderStyle: 'dashed', borderRadius: radius.md, padding: 28, alignItems: 'center', marginBottom: 16 },
  textInput: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.sm, padding: 12, color: colors.textPrimary, fontSize: 15, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 2, borderColor: colors.surfaceBorder, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  saveBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 13, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },

  // Share modal
  shareInfo: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  expiryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  expiryBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surfaceElevated },
  expiryBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  expiryBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  expiryBtnTextActive: { color: '#fff' },
  existingShareNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(186,117,23,0.1)', borderWidth: 1, borderColor: 'rgba(186,117,23,0.3)', borderRadius: radius.sm, padding: 10, marginBottom: 12 },
  existingShareNoteText: { flex: 1, fontSize: 12, color: '#BA7517', lineHeight: 18 },
  revokeBtn: { marginTop: 12, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  revokeBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  shareLinkBox: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.md, padding: 16, marginBottom: 16 },
  shareLinkLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  shareLinkUrl: { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  shareLinkExpiry: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
});
