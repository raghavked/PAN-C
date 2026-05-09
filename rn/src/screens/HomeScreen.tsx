import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { PanicButton } from '../components/panic/PanicButton';
import { Card } from '../components/cards/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { colors, spacing, typography } from '../theme';
import { usePanic } from '../hooks/usePanic';

export const HomeScreen: React.FC = () => {
  const { isActive, contactsNotified, incidentId, triggerPanic } = usePanic();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>PAN-C</Text>
          <StatusBadge status={isActive ? 'active' : 'safe'} label={isActive ? 'ALERT ACTIVE' : 'SAFE'} />
        </View>

        {/* Panic Button */}
        <View style={styles.panicSection}>
          <PanicButton onPress={triggerPanic} isActive={isActive} />
          <Text style={styles.panicHint}>
            {isActive
              ? `Incident ${incidentId} — ${contactsNotified} contacts notified`
              : 'Press to send emergency alert to your contacts'}
          </Text>
        </View>

        {/* Status Cards */}
        <View style={styles.cards}>
          <Card style={styles.cardRow}>
            <Text style={styles.cardIcon}>👥</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Emergency Contacts</Text>
              <Text style={styles.cardSub}>4 contacts ready</Text>
            </View>
            <StatusBadge status="safe" label="Ready" />
          </Card>

          <Card style={styles.cardRow}>
            <Text style={styles.cardIcon}>📄</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Documents</Text>
              <Text style={styles.cardSub}>3 documents stored</Text>
            </View>
            <StatusBadge status="warning" label="1 Expiring" />
          </Card>

          <Card style={styles.cardRow}>
            <Text style={styles.cardIcon}>⚖️</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Know Your Rights</Text>
              <Text style={styles.cardSub}>AI-powered guidance</Text>
            </View>
            <StatusBadge status="info" label="Ready" />
          </Card>
        </View>

        {/* Rights Reminder */}
        <Card style={styles.rightsCard}>
          <Text style={styles.rightsTitle}>🛡️ Your Rights</Text>
          <Text style={styles.rightsText}>
            You have the right to remain silent. You do not have to answer questions about
            immigration status. You have the right to speak with a lawyer. Do not sign any
            documents without legal counsel.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appName: { ...typography.h2, color: colors.primary },
  panicSection: { alignItems: 'center', marginBottom: spacing.xl },
  panicHint: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 280,
  },
  cards: { gap: spacing.sm, marginBottom: spacing.md },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardIcon: { fontSize: 24 },
  cardText: { flex: 1 },
  cardTitle: { ...typography.label, color: colors.textPrimary },
  cardSub: { ...typography.bodySm, color: colors.textSecondary },
  rightsCard: { marginTop: spacing.sm },
  rightsTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  rightsText: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
});
