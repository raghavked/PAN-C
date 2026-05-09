import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Card } from '../components/cards/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { PrimaryButton } from '../components/buttons/PrimaryButton';
import { colors, spacing, typography } from '../theme';

interface Document {
  id: string;
  name: string;
  type: string;
  expiresAt?: string;
  uploadedAt: string;
  icon: string;
}

const MOCK_DOCUMENTS: Document[] = [
  { id: '1', name: 'Passport', type: 'Identity', icon: '🛂', uploadedAt: '2024-01-15', expiresAt: '2034-01-15' },
  { id: '2', name: 'Work Authorization', type: 'Immigration', icon: '📋', uploadedAt: '2024-03-01', expiresAt: '2025-03-01' },
  { id: '3', name: 'Know Your Rights Card', type: 'Legal', icon: '⚖️', uploadedAt: '2024-06-10' },
];

const isExpiringSoon = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
};

const isExpired = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
};

export const DocumentsScreen: React.FC = () => (
  <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Document Vault</Text>
        <StatusBadge status="info" label={`${MOCK_DOCUMENTS.length} Stored`} />
      </View>
      <Text style={styles.subtitle}>
        Securely store your important documents. Accessible even offline.
      </Text>

      {MOCK_DOCUMENTS.map((doc) => {
        const expired = isExpired(doc.expiresAt);
        const expiring = isExpiringSoon(doc.expiresAt);
        return (
          <Card key={doc.id} style={styles.docCard}>
            <View style={styles.docHeader}>
              <Text style={styles.docIcon}>{doc.icon}</Text>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docType}>{doc.type}</Text>
              </View>
              {expired
                ? <StatusBadge status="active" label="Expired" />
                : expiring
                ? <StatusBadge status="warning" label="Expiring Soon" />
                : <StatusBadge status="safe" label="Valid" />
              }
            </View>
            <View style={styles.docMeta}>
              <Text style={styles.metaText}>Uploaded: {doc.uploadedAt}</Text>
              {doc.expiresAt && (
                <Text style={[styles.metaText, expired && styles.expiredText]}>
                  Expires: {doc.expiresAt}
                </Text>
              )}
            </View>
          </Card>
        );
      })}

      <PrimaryButton label="+ Upload Document" onPress={() => {}} fullWidth />

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>🔒 Encrypted Storage</Text>
        <Text style={styles.infoText}>
          Documents are encrypted and stored securely in MongoDB Atlas. They are only
          accessible to you and shared with emergency contacts only when you authorize it.
        </Text>
      </Card>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  docCard: { gap: spacing.sm },
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  docIcon: { fontSize: 28 },
  docInfo: { flex: 1 },
  docName: { ...typography.label, color: colors.textPrimary },
  docType: { ...typography.bodySm, color: colors.textSecondary },
  docMeta: { gap: 2 },
  metaText: { ...typography.caption, color: colors.textMuted },
  expiredText: { color: colors.danger },
  infoCard: { marginTop: spacing.sm },
  infoTitle: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs },
  infoText: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
});
