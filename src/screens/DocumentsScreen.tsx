import React, { useEffect, useState, useCallback, useRef } from 'react';
import { documentsApi, type Document } from '../services/api';
import { colors } from '../theme/colors';

interface Props {
  onBack: () => void;
}

const DOC_TYPES = ['Passport', 'Visa', 'Green Card', 'EAD Card', 'Birth Certificate', 'Driver License', 'Social Security Card', 'Court Documents', 'Other'];

const DOC_ICONS: Record<string, string> = {
  Passport: '🛂', Visa: '📋', 'Green Card': '💚', 'EAD Card': '🪪',
  'Birth Certificate': '📜', 'Driver License': '🚗', 'Social Security Card': '🔒',
  'Court Documents': '⚖️', Other: '📄',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function DocumentsScreen({ onBack }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [docType, setDocType] = useState('Passport');
  const [expiresAt, setExpiresAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [shareInfo, setShareInfo] = useState<{ shareUrl: string; expiresAt: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { documents: d } = await documentsApi.getAll();
      setDocuments(d);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async () => {
    if (!file) { setError('Please select a file'); return; }
    setSaving(true);
    setError('');
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await documentsApi.upload({
        type: docType, fileName: file.name, fileDataBase64: base64,
        mimeType: file.type || 'application/octet-stream', expiresAt: expiresAt || undefined,
      });
      setShowForm(false);
      setFile(null);
      setExpiresAt('');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try { await documentsApi.delete(id); await load(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Delete failed'); }
  };

  const handleShare = async (id: string) => {
    try {
      const result = await documentsApi.share(id);
      setShareInfo({ shareUrl: result.shareUrl, expiresAt: result.expiresAt });
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Share failed'); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 style={styles.title}>📄 Documents</h1>
        <button style={styles.addBtn} onClick={() => { setShowForm(true); setError(''); }}>+ Upload</button>
      </div>

      {error && !showForm && <div style={styles.errorBox}>{error}</div>}

      {shareInfo && (
        <div style={styles.shareToast}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>🔗 Share Link Created</div>
          <div style={{ fontSize: 12, wordBreak: 'break-all', color: colors.textSecondary, marginBottom: 8 }}>{shareInfo.shareUrl}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Expires: {new Date(shareInfo.expiresAt).toLocaleString()}</div>
          <button style={styles.copyBtn} onClick={() => { navigator.clipboard.writeText(shareInfo.shareUrl); setShareInfo(null); }}>
            Copy & Close
          </button>
        </div>
      )}

      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Upload Document</span>
              <button style={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            {error && <div style={styles.errorBox}>{error}</div>}
            <div style={styles.encryptNote}>🔐 Encrypted with AES-256-GCM before storage.</div>

            <label style={styles.label}>Document Type</label>
            <select style={styles.input} value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label style={styles.label}>File *</label>
            <div style={styles.filePickerArea} onClick={() => fileInputRef.current?.click()}>
              {file ? (
                <div><div style={{ fontWeight: 700, color: colors.textPrimary }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{formatBytes(file.size)}</div></div>
              ) : (
                <div style={{ color: colors.textMuted }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                  <div>Tap to select a file</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>PDF, JPG, PNG supported</div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>

            <label style={styles.label}>Expiry Date (optional)</label>
            <input style={styles.input} type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />

            <div style={styles.modalBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleUpload} disabled={saving || !file}>
                {saving ? 'Encrypting & Uploading...' : '🔐 Upload Securely'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.list}>
        {loading && <div style={styles.emptyText}>Loading...</div>}
        {!loading && documents.length === 0 && (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 48 }}>📄</span>
            <p style={styles.emptyText}>No documents yet.</p>
            <p style={styles.emptyHint}>Upload your important documents. They're encrypted and only you can access them.</p>
            <button style={styles.addFirstBtn} onClick={() => setShowForm(true)}>+ Upload First Document</button>
          </div>
        )}
        {documents.map(doc => {
          const daysLeft = doc.expiresAt ? daysUntil(doc.expiresAt) : null;
          const isExpired = daysLeft !== null && daysLeft < 0;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && !isExpired;
          return (
            <div key={doc._id} style={{ ...styles.docCard, borderColor: isExpired ? colors.alertRed : isExpiringSoon ? colors.warning : colors.border }}>
              <div style={styles.docIcon}>{DOC_ICONS[doc.type] || '📄'}</div>
              <div style={styles.docInfo}>
                <div style={styles.docType}>{doc.type}</div>
                <div style={styles.docName}>{doc.fileName}</div>
                {doc.fileSize && <div style={styles.docMeta}>{formatBytes(doc.fileSize)}</div>}
                {doc.expiresAt && (
                  <div style={{ ...styles.docMeta, color: isExpired ? colors.alertRed : isExpiringSoon ? colors.warning : colors.textMuted }}>
                    {isExpired ? `⚠️ Expired ${Math.abs(daysLeft!)} days ago` : isExpiringSoon ? `⚠️ Expires in ${daysLeft} days` : `Expires: ${new Date(doc.expiresAt).toLocaleDateString()}`}
                  </div>
                )}
                {doc.isSharedWithContacts && <div style={styles.sharedBadge}>🔗 Shared</div>}
              </div>
              <div style={styles.docActions}>
                <button style={styles.shareDocBtn} onClick={() => handleShare(doc._id!)} title="Share">🔗</button>
                <button style={styles.deleteDocBtn} onClick={() => handleDelete(doc._id!)} title="Delete">🗑️</button>
              </div>
            </div>
          );
        })}
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
  shareToast: { margin: '8px 16px', background: colors.surface1, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 },
  copyBtn: { background: colors.alertRed, border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 14px', cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
  modalCard: { background: colors.surface1, borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: colors.textPrimary },
  closeBtn: { background: colors.surface2, border: 'none', borderRadius: '50%', width: 32, height: 32, color: colors.textSecondary, cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' },
  encryptNote: { background: 'rgba(99,153,34,0.1)', border: '1px solid rgba(99,153,34,0.3)', borderRadius: 8, padding: '10px 14px', color: colors.success, fontSize: 13, marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '12px 14px', color: colors.textPrimary, fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  filePickerArea: { background: colors.surface2, border: `2px dashed ${colors.border}`, borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', marginTop: 6, color: colors.textSecondary },
  modalBtns: { display: 'flex', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, background: 'transparent', border: `2px solid ${colors.border}`, borderRadius: 8, color: colors.textSecondary, fontSize: 14, fontWeight: 700, padding: '12px', cursor: 'pointer', fontFamily: 'inherit' },
  saveBtn: { flex: 2, background: colors.alertRed, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px', cursor: 'pointer', fontFamily: 'inherit' },
  list: { padding: '12px 16px' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', textAlign: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16, margin: '8px 0' },
  emptyHint: { color: colors.textMuted, fontSize: 14, marginBottom: 20 },
  addFirstBtn: { background: colors.alertRed, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', cursor: 'pointer', fontFamily: 'inherit' },
  docCard: { display: 'flex', alignItems: 'flex-start', gap: 12, background: colors.surface1, border: '1px solid', borderRadius: 12, padding: '14px', marginBottom: 10 },
  docIcon: { fontSize: 32, flexShrink: 0 },
  docInfo: { flex: 1 },
  docType: { fontSize: 12, fontWeight: 700, color: colors.alertRed, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 },
  docName: { fontSize: 15, fontWeight: 700, color: colors.textPrimary },
  docMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sharedBadge: { fontSize: 11, color: colors.info, marginTop: 4 },
  docActions: { display: 'flex', flexDirection: 'column', gap: 6 },
  shareDocBtn: { background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' },
  deleteDocBtn: { background: 'rgba(226,75,74,0.1)', border: `1px solid ${colors.alertRed}`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' },
};
