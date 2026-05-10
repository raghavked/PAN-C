import React, { useEffect, useState, useCallback } from 'react';
import { contactsApi, type Contact } from '../services/api';
import { colors } from '../theme/colors';

interface Props {
  onBack: () => void;
}

const RELATIONSHIPS = ['Family', 'Friend', 'Lawyer', 'Doctor', 'Neighbor', 'Other'];

const emptyContact = (): Omit<Contact, '_id' | 'userEmail' | 'createdAt' | 'lastNotified'> => ({
  name: '',
  phone: '',
  email: '',
  relationship: 'Family',
  notifyVia: { sms: true, email: false, push: false },
  canSeeDocuments: true,
  canSeeLocation: true,
  isPrimary: false,
});

export default function ContactsScreen({ onBack }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyContact());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { contacts: c } = await contactsApi.getAll();
      setContacts(c);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(emptyContact());
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (c: Contact) => {
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      relationship: c.relationship,
      notifyVia: c.notifyVia,
      canSeeDocuments: c.canSeeDocuments,
      canSeeLocation: c.canSeeLocation,
      isPrimary: c.isPrimary,
    });
    setEditingId(c._id!);
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) { setError('Name and phone are required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await contactsApi.update(editingId, form);
      } else {
        await contactsApi.create(form);
      }
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this contact?')) return;
    try {
      await contactsApi.delete(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 style={styles.title}>📞 Contacts</h1>
        <button style={styles.addBtn} onClick={openAdd}>+ Add</button>
      </div>

      {error && !showForm && <div style={styles.errorBox}>{error}</div>}

      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>{editingId ? 'Edit Contact' : 'Add Contact'}</span>
              <button style={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            {error && <div style={styles.errorBox}>{error}</div>}

            <label style={styles.label}>Name *</label>
            <input style={styles.input} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />

            <label style={styles.label}>Phone *</label>
            <input style={styles.input} type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (___) ___-____" />

            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />

            <label style={styles.label}>Relationship</label>
            <select style={styles.input} value={form.relationship}
              onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <div style={styles.checkboxRow}>
              {[
                { label: 'Notify via SMS', key: 'sms', val: form.notifyVia.sms, onChange: (v: boolean) => setForm(f => ({ ...f, notifyVia: { ...f.notifyVia, sms: v } })) },
                { label: 'Notify via Email', key: 'email', val: form.notifyVia.email, onChange: (v: boolean) => setForm(f => ({ ...f, notifyVia: { ...f.notifyVia, email: v } })) },
                { label: 'Can see documents', key: 'docs', val: form.canSeeDocuments, onChange: (v: boolean) => setForm(f => ({ ...f, canSeeDocuments: v })) },
                { label: 'Primary contact', key: 'primary', val: form.isPrimary, onChange: (v: boolean) => setForm(f => ({ ...f, isPrimary: v })) },
              ].map(item => (
                <label key={item.key} style={styles.checkLabel}>
                  <input type="checkbox" checked={item.val} onChange={e => item.onChange(e.target.checked)} />
                  {item.label}
                </label>
              ))}
            </div>

            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.list}>
        {loading && <div style={styles.emptyText}>Loading...</div>}
        {!loading && contacts.length === 0 && (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 48 }}>📞</span>
            <p style={styles.emptyText}>No contacts yet.</p>
            <p style={styles.emptyHint}>Add contacts who will be notified when you press PAN!C.</p>
            <button style={styles.addFirstBtn} onClick={openAdd}>+ Add First Contact</button>
          </div>
        )}
        {contacts.map(c => (
          <div key={c._id} style={styles.contactCard}>
            <div style={styles.contactAvatar}>{c.name.charAt(0).toUpperCase()}</div>
            <div style={styles.contactInfo}>
              <div style={styles.contactName}>
                {c.name}
                {c.isPrimary && <span style={styles.primaryBadge}>PRIMARY</span>}
              </div>
              <div style={styles.contactDetail}>{c.phone}</div>
              {c.email && <div style={styles.contactDetail}>{c.email}</div>}
              <div style={styles.contactMeta}>
                <span style={styles.metaBadge}>{c.relationship}</span>
                {c.notifyVia.sms && <span style={styles.metaBadge}>SMS</span>}
                {c.notifyVia.email && <span style={styles.metaBadge}>Email</span>}
              </div>
            </div>
            <div style={styles.contactActions}>
              <button style={styles.editBtn} onClick={() => openEdit(c)}>✏️</button>
              <button style={styles.deleteBtn} onClick={() => handleDelete(c._id!)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: colors.base, fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif', paddingBottom: 80 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: `1px solid ${colors.border}`, position: 'sticky', top: 0, background: colors.base, zIndex: 10 },
  backBtn: { background: 'transparent', border: 'none', color: colors.alertRed, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  title: { fontSize: 18, fontWeight: 700, color: colors.textPrimary, margin: 0 },
  addBtn: { background: colors.alertRed, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit' },
  errorBox: { background: 'rgba(226,75,74,0.15)', border: `1px solid ${colors.alertRed}`, borderRadius: 8, padding: '10px 14px', color: colors.alertRed, fontSize: 14, margin: '8px 16px' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
  modalCard: { background: colors.surface1, borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: colors.textPrimary },
  closeBtn: { background: colors.surface2, border: 'none', borderRadius: '50%', width: 32, height: 32, color: colors.textSecondary, cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '12px 14px', color: colors.textPrimary, fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  checkboxRow: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 10, color: colors.textSecondary, fontSize: 14, cursor: 'pointer' },
  modalBtns: { display: 'flex', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, background: 'transparent', border: `2px solid ${colors.border}`, borderRadius: 8, color: colors.textSecondary, fontSize: 14, fontWeight: 700, padding: '12px', cursor: 'pointer', fontFamily: 'inherit' },
  saveBtn: { flex: 2, background: colors.alertRed, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px', cursor: 'pointer', fontFamily: 'inherit' },
  list: { padding: '12px 16px' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16, margin: '8px 0' },
  emptyHint: { color: colors.textMuted, fontSize: 14, marginBottom: 20 },
  addFirstBtn: { background: colors.alertRed, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', cursor: 'pointer', fontFamily: 'inherit' },
  contactCard: { display: 'flex', alignItems: 'flex-start', gap: 12, background: colors.surface1, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px', marginBottom: 10 },
  contactAvatar: { width: 44, height: 44, borderRadius: '50%', background: colors.alertRed, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  primaryBadge: { background: colors.alertRed, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' },
  contactDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  contactMeta: { display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  metaBadge: { background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 11, color: colors.textMuted, padding: '2px 6px' },
  contactActions: { display: 'flex', flexDirection: 'column', gap: 6 },
  editBtn: { background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' },
  deleteBtn: { background: 'rgba(226,75,74,0.1)', border: `1px solid ${colors.alertRed}`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' },
};
