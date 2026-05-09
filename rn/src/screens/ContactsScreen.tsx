import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable,
} from 'react-native';
import { Card } from '../components/cards/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { PrimaryButton } from '../components/buttons/PrimaryButton';
import { colors, spacing, typography, radius } from '../theme';

interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  priority: number;
  notifyViaSMS: boolean;
  notifyViaEmail: boolean;
}

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Maria Garcia', relationship: 'Sister', phone: '+1 (555) 123-4567', email: 'maria@example.com', priority: 1, notifyViaSMS: true, notifyViaEmail: true },
  { id: '2', name: 'Carlos Lopez', relationship: 'Friend', phone: '+1 (555) 987-6543', email: 'carlos@example.com', priority: 2, notifyViaSMS: true, notifyViaEmail: false },
  { id: '3', name: 'Ana Rodriguez', relationship: 'Neighbor', phone: '+1 (555) 456-7890', email: 'ana@example.com', priority: 3, notifyViaSMS: true, notifyViaEmail: true },
  { id: '4', name: 'RAICES Hotline', relationship: 'Legal Aid', phone: '+1 (888) 587-7777', email: 'legal@raices.org', priority: 4, notifyViaSMS: true, notifyViaEmail: true },
];

export const ContactsScreen: React.FC = () => {
  const [contacts] = useState<Contact[]>(MOCK_CONTACTS);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Emergency Contacts</Text>
          <StatusBadge status="safe" label={`${contacts.length} Ready`} />
        </View>
        <Text style={styles.subtitle}>
          These contacts will receive an SMS when you press the panic button.
        </Text>

        {contacts.map((contact) => (
          <Card key={contact.id} style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{contact.name[0]}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRel}>{contact.relationship}</Text>
              </View>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>#{contact.priority}</Text>
              </View>
            </View>

            <View style={styles.contactDetails}>
              <Text style={styles.detailText}>📱 {contact.phone}</Text>
              <Text style={styles.detailText}>✉️ {contact.email}</Text>
            </View>

            <View style={styles.notifyRow}>
              <View style={[styles.notifyChip, contact.notifyViaSMS && styles.notifyActive]}>
                <Text style={styles.notifyChipText}>SMS</Text>
              </View>
              <View style={[styles.notifyChip, contact.notifyViaEmail && styles.notifyActive]}>
                <Text style={styles.notifyChipText}>Email</Text>
              </View>
            </View>
          </Card>
        ))}

        <PrimaryButton label="+ Add Contact" onPress={() => {}} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  contactCard: { gap: spacing.sm },
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...typography.h4, color: colors.white },
  contactInfo: { flex: 1 },
  contactName: { ...typography.label, color: colors.textPrimary },
  contactRel: { ...typography.bodySm, color: colors.textSecondary },
  priorityBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  priorityText: { ...typography.labelSm, color: colors.textSecondary },
  contactDetails: { gap: 4 },
  detailText: { ...typography.body, color: colors.textSecondary },
  notifyRow: { flexDirection: 'row', gap: spacing.sm },
  notifyChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  notifyActive: { borderColor: colors.primary, backgroundColor: 'rgba(226,75,74,0.1)' },
  notifyChipText: { ...typography.caption, color: colors.textSecondary },
});
