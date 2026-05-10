import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable,
  TextInput, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { api } from '../utils/apiClient';
import { colors, spacing, radius } from '../theme';

interface Contact {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary?: boolean;
}

const RELATIONSHIPS = ['Family', 'Spouse/Partner', 'Parent', 'Sibling', 'Friend', 'Lawyer', 'Legal Aid', 'Other'];

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getPermLabel(c: Contact): string {
  if (c.isPrimary) return 'PRIMARY — Full Access';
  if (c.relationship === 'Lawyer' || c.relationship === 'Legal Aid') return 'Legal Counsel — Notifications Only';
  return 'Trusted Contact';
}

export const ContactsScreen: React.FC = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await api.get<{ contacts: Contact[] }>('/contacts');
      setContacts(data.contacts);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setRelationship('Family'); setFormError(null);
  };

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) { setFormError('Name and phone are required.'); return; }
    setSaving(true);
    try {
      await api.post('/contacts', { name: name.trim(), phone: phone.trim(), email: email.trim(), relationship });
      resetForm();
      setShowModal(false);
      await fetchContacts();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, contactName: string) => {
    const confirmed = typeof window !== 'undefined' && window.confirm
      ? window.confirm(`Remove ${contactName} from your emergency contacts?`)
      : true;
    if (!confirmed) return;
    api.delete(`/contacts/${id}`)
      .then(() => setContacts((prev) => prev.filter((c) => c._id !== id)))
      .catch((e: unknown) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete'));
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.appName}>PAN!C</Text>
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: tabBarHeight + 16 }]} showsVerticalScrollIndicator={false}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>{'Emergency\nContacts'}</Text>
          <Text style={s.pageSub}>Manage authorized personnel and their notification permissions.</Text>
        </View>

        <Pressable
          style={({ pressed }) => [s.addBtn, pressed && s.addBtnPressed]}
          onPress={() => { resetForm(); setShowModal(true); }}
        >
          <MaterialIcons name="add" size={18} color={colors.onPrimary} />
          <Text style={s.addBtnText}>ADD CONTACT</Text>
        </Pressable>

        {loading && (
          <View style={s.centerBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={s.centerText}>Loading contacts...</Text>
          </View>
        )}

        {!loading && fetchError && (
          <View style={s.errorBox}>
            <MaterialIcons name="error-outline" size={18} color={colors.primary} />
            <Text style={s.errorText}>{fetchError}</Text>
            <Pressable onPress={fetchContacts} style={s.retryBtn}>
              <Text style={s.retryText}>RETRY</Text>
            </Pressable>
          </View>
        )}

        {!loading && !fetchError && contacts.length === 0 && (
          <View style={s.emptyBox}>
            <MaterialIcons name="group-off" size={40} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No Contacts Yet</Text>
            <Text style={s.emptyDesc}>
              Add emergency contacts who will be notified when you trigger the panic button.
            </Text>
          </View>
        )}

        {contacts.map((c) => (
          <View key={c._id} style={[s.card, c.isPrimary && s.cardPrimary]}>
            {c.isPrimary && <View style={s.cardAccent} />}
            <View style={s.cardHeader}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{getInitials(c.name)}</Text>
              </View>
              <View style={s.cardHeaderInfo}>
                <Text style={s.contactName}>{c.name}</Text>
                <Text style={s.contactRel}>{c.relationship.toUpperCase()}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [s.deleteBtn, pressed && { opacity: 0.6 }]}
                onPress={() => handleDelete(c._id, c.name)}
              >
                <MaterialIcons name="delete-outline" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={s.divider} />

            <View style={s.section}>
              <Text style={s.sectionLabel}>PERMISSION</Text>
              <View style={s.permRow}>
                <MaterialIcons name="security" size={15} color={colors.primary} />
                <Text style={s.permText}>{getPermLabel(c)}</Text>
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.sectionLabel}>ACTIVE CHANNELS</Text>
              <View style={s.chips}>
                <View style={s.chipActive}>
                  <MaterialIcons name="message" size={11} color={colors.primary} />
                  <Text style={s.chipActiveText}>SMS ALERTS</Text>
                </View>
                {c.phone ? (
                  <View style={s.chipActive}>
                    <MaterialIcons name="phone" size={11} color={colors.primary} />
                    <Text style={s.chipActiveText}>{c.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={s.modalOverlay}>
          <View style={[s.modalCard, { marginBottom: Platform.OS === 'ios' ? 0 : 20 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>ADD CONTACT</Text>
              <Pressable onPress={() => setShowModal(false)} style={s.modalClose}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>FULL NAME *</Text>
              <TextInput style={s.inputField} placeholder="Maria Garcia" placeholderTextColor={colors.textMuted}
                value={name} onChangeText={setName} autoCapitalize="words" />
            </View>
            <View style={s.field}>
              <Text style={s.fieldLabel}>PHONE *</Text>
              <TextInput style={s.inputField} placeholder="+1 555 000 0000" placeholderTextColor={colors.textMuted}
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
            <View style={s.field}>
              <Text style={s.fieldLabel}>EMAIL (OPTIONAL)</Text>
              <TextInput style={s.inputField} placeholder="maria@example.com" placeholderTextColor={colors.textMuted}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={s.field}>
              <Text style={s.fieldLabel}>RELATIONSHIP</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
                  {RELATIONSHIPS.map((rel) => (
                    <Pressable key={rel} style={[s.relChip, relationship === rel && s.relChipActive]}
                      onPress={() => setRelationship(rel)}>
                      <Text style={[s.relChipText, relationship === rel && s.relChipTextActive]}>{rel}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {formError ? (
              <View style={s.formError}>
                <MaterialIcons name="error-outline" size={14} color={colors.primary} />
                <Text style={s.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={colors.onPrimary} size="small" />
                : <Text style={s.saveBtnText}>SAVE CONTACT</Text>}
            </Pressable>
          </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 52, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder },
  appName: { fontSize: 20, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  pageHeader: { gap: 6 },
  pageTitle: { fontSize: 34, fontWeight: '800', color: colors.textPrimary, lineHeight: 42 },
  pageSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14 },
  addBtnPressed: { opacity: 0.85 },
  addBtnText: { fontSize: 13, fontWeight: '800', color: colors.onPrimary, textTransform: 'uppercase', letterSpacing: 1 },
  centerBox: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  centerText: { color: colors.textMuted, fontSize: 14 },
  errorBox: { alignItems: 'center', gap: 10, padding: spacing.lg, backgroundColor: 'rgba(248,91,88,0.1)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(248,91,88,0.3)' },
  errorText: { color: colors.primary, fontSize: 14, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  card: { backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, overflow: 'hidden' },
  cardPrimary: { borderColor: colors.outlineVariant },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceHighest, borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  cardHeaderInfo: { flex: 1 },
  contactName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  contactRel: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  deleteBtn: { padding: 6 },
  divider: { height: 1, backgroundColor: colors.surfaceBorder },
  section: { gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  permText: { fontSize: 13, color: colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipActive: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(248,91,88,0.1)', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  chipActiveText: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surfaceContainer, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, gap: spacing.md, paddingBottom: 40, borderTopWidth: 1, borderColor: colors.surfaceBorder },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: 2 },
  modalClose: { padding: 4 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  inputField: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.surfaceBorder, borderRadius: radius.md, paddingHorizontal: 14, height: 48, color: colors.textPrimary, fontSize: 15 },
  relChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surfaceElevated },
  relChipActive: { backgroundColor: 'rgba(248,91,88,0.15)', borderColor: colors.primary },
  relChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  relChipTextActive: { color: colors.primary, fontWeight: '700' },
  formError: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(248,91,88,0.12)', borderRadius: radius.sm, padding: 10, borderWidth: 1, borderColor: 'rgba(248,91,88,0.3)' },
  formErrorText: { color: colors.primary, fontSize: 13, flex: 1 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.md, height: 50, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: colors.onPrimary, letterSpacing: 2, textTransform: 'uppercase' },
});
