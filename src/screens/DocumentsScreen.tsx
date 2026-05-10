import React, { useEffect, useState, useCallback, useRef } from 'react';
import { documentsApi, type Document } from '../services/api';
import { colors } from '../theme/colors';

interface Props {
  onBack: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DOC_TYPES = [
  'Passport', 'Visa', 'Green Card', 'EAD Card', 'Birth Certificate',
  'Driver License', 'Social Security Card', 'Court Documents', 'Other',
];

const DOC_ICONS: Record<string, string> = {
  Passport: '🛂', Visa: '📋', 'Green Card': '💚', 'EAD Card': '🪪',
  'Birth Certificate': '📜', 'Driver License': '🚗',
  'Social Security Card': '🔒', 'Court Documents': '⚖️', Other: '📄',
};

const SHARE_EXPIRY_OPTIONS = [
  { label: '24 hours', hours: 24 },
  { label: '72 hours (3 days)', hours: 72 },
  { label: '7 days', hours: 168 },
  { label: '30 days', hours: 720 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isViewable(mimeType?: string) {
  if (!mimeType) return false;
  return mimeType === 'application/pdf' || mimeType.startsWith('image/');
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DocumentsScreen({ onBack }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload form state
  const [showUpload, setShowUpload] = useState(false);
  const [docType, setDocType] = useState('Passport');
  const [expiresAt, setExpiresAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewer state
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  // Share panel state
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [shareExpiryHours, setShareExpiryHours] = useState(72);
  const [shareResult, setShareResult] = useState<{ shareUrl: string; expiresAt: string } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Data loading ─────────────────────────────────────────────────────────────
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

  // ── Upload (multipart/form-data via XHR for progress) ────────────────────────
  const handleUpload = async () => {
    if (!file) { setError('Please select a file'); return; }
    setSaving(true);
    setError('');
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('panic_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', docType);
      if (expiresAt) formData.append('expiresAt', new Date(expiresAt).toISOString());

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/documents');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const body = JSON.parse(xhr.responseText);
              reject(new Error(body.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      setShowUpload(false);
      setFile(null);
      setExpiresAt('');
      setDocType('Passport');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (doc: Document) => {
    if (!window.confirm(`Delete "${doc.fileName}"? This cannot be undone.`)) return;
    try {
      await documentsApi.delete(doc._id!);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  // ── In-app viewer ─────────────────────────────────────────────────────────────
  const handleView = async (doc: Document) => {
    setViewerDoc(doc);
    setViewerLoading(true);
    setViewerUrl(null);
    try {
      const token = localStorage.getItem('panic_token');
      const res = await fetch(`/api/documents/${doc._id}/view`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Could not load document');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setViewerUrl(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load document');
      setViewerDoc(null);
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    setViewerDoc(null);
    setViewerUrl(null);
  };

  // ── Share link ────────────────────────────────────────────────────────────────
  const handleOpenShare = (doc: Document) => {
    setShareDoc(doc);
    setShareResult(null);
    setCopied(false);
  };

  const handleGenerateShare = async () => {
    if (!shareDoc) return;
    setSharing(true);
    try {
      const result = await documentsApi.share(shareDoc._id!, shareExpiryHours);
      setShareResult({ shareUrl: result.shareUrl, expiresAt: result.expiresAt });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Share failed');
    } finally {
      setSharing(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!shareDoc) return;
    if (!window.confirm('Revoke this share link? Anyone with the link will lose access.')) return;
    try {
      await documentsApi.revokeShare(shareDoc._id!);
      setShareDoc(null);
      setShareResult(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Revoke failed');
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={s.container}>

      {/* ── Header ── */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <h1 style={s.title}>📄 Documents</h1>
        <button style={s.addBtn} onClick={() => { setShowUpload(true); setError(''); }}>
          + Upload
        </button>
      </div>

      {error && !showUpload && <div style={s.errorBox}>{error} <button style={s.errDismiss} onClick={() => setError('')}>✕</button></div>}

      {/* ── Upload modal ── */}
      {showUpload && (
        <div style={s.overlay}>
          <div style={s.sheet}>
            <div style={s.sheetHeader}>
              <span style={s.sheetTitle}>Upload Document</span>
              <button style={s.closeBtn} onClick={() => { setShowUpload(false); setError(''); }}>✕</button>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.encryptNote}>
              🔐 Files are encrypted with AES-256-GCM before storage. Only you can access them.
            </div>

            <label style={s.label}>Document Type</label>
            <select style={s.select} value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_ICONS[t]} {t}</option>)}
            </select>

            <label style={s.label}>File <span style={{ color: colors.alertRed }}>*</span></label>
            <div
              style={{ ...s.dropZone, borderColor: file ? colors.alertRed : colors.border }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const dropped = e.dataTransfer.files[0];
                if (dropped) setFile(dropped);
              }}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                  <div style={{ fontWeight: 700, color: colors.textPrimary }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{formatBytes(file.size)}</div>
                  <button
                    style={s.changeFileBtn}
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                  >Change file</button>
                </div>
              ) : (
                <div style={{ color: colors.textMuted }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
                  <div style={{ fontWeight: 700, color: colors.textSecondary }}>Tap or drag to select</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>PDF, JPG, PNG, GIF, WEBP, DOC, DOCX · Max 20 MB</div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <label style={s.label}>Document Expiry Date <span style={{ color: colors.textMuted }}>(optional)</span></label>
            <input
              style={s.input}
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
            />

            {saving && uploadProgress > 0 && (
              <div style={s.progressWrap}>
                <div style={{ ...s.progressBar, width: `${uploadProgress}%` }} />
                <span style={s.progressLabel}>{uploadProgress}%</span>
              </div>
            )}

            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={() => { setShowUpload(false); setError(''); }}>Cancel</button>
              <button
                style={{ ...s.saveBtn, opacity: saving || !file ? 0.6 : 1 }}
                onClick={handleUpload}
                disabled={saving || !file}
              >
                {saving ? `Uploading… ${uploadProgress}%` : '🔐 Upload Securely'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── In-app viewer modal ── */}
      {viewerDoc && (
        <div style={s.overlay}>
          <div style={s.viewerSheet}>
            <div style={s.sheetHeader}>
              <div>
                <span style={s.viewerDocType}>{DOC_ICONS[viewerDoc.type] || '📄'} {viewerDoc.type}</span>
                <div style={s.viewerDocName}>{viewerDoc.fileName}</div>
              </div>
              <button style={s.closeBtn} onClick={closeViewer}>✕</button>
            </div>

            {viewerLoading && (
              <div style={s.viewerCenter}>
                <div style={s.spinner} />
                <div style={{ color: colors.textMuted, marginTop: 12 }}>Decrypting…</div>
              </div>
            )}

            {!viewerLoading && viewerUrl && viewerDoc.mimeType === 'application/pdf' && (
              <iframe
                src={viewerUrl}
                title={viewerDoc.fileName}
                style={s.pdfFrame}
              />
            )}

            {!viewerLoading && viewerUrl && viewerDoc.mimeType?.startsWith('image/') && (
              <div style={s.imgWrap}>
                <img src={viewerUrl} alt={viewerDoc.fileName} style={s.docImg} />
              </div>
            )}

            <div style={s.viewerActions}>
              <a
                href={viewerUrl || '#'}
                download={viewerDoc.fileName}
                style={{ ...s.dlBtn, pointerEvents: viewerUrl ? 'auto' : 'none', opacity: viewerUrl ? 1 : 0.5 }}
              >
                ⬇️ Download
              </a>
              <button style={s.shareFromViewerBtn} onClick={() => { closeViewer(); handleOpenShare(viewerDoc); }}>
                🔗 Share Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share panel modal ── */}
      {shareDoc && (
        <div style={s.overlay}>
          <div style={s.sheet}>
            <div style={s.sheetHeader}>
              <div>
                <span style={s.sheetTitle}>Share Document</span>
                <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{shareDoc.fileName}</div>
              </div>
              <button style={s.closeBtn} onClick={() => { setShareDoc(null); setShareResult(null); }}>✕</button>
            </div>

            {!shareResult ? (
              <>
                <div style={s.shareInfo}>
                  <p style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.5 }}>
                    Generate a private, time-limited link that anyone can use to view this document — no login required.
                    The link will be automatically included in panic alerts sent to contacts who have document access enabled.
                  </p>
                </div>

                <label style={s.label}>Link Expiry</label>
                <div style={s.expiryGrid}>
                  {SHARE_EXPIRY_OPTIONS.map(opt => (
                    <button
                      key={opt.hours}
                      style={{
                        ...s.expiryBtn,
                        background: shareExpiryHours === opt.hours ? colors.alertRed : colors.surface2,
                        color: shareExpiryHours === opt.hours ? '#fff' : colors.textSecondary,
                        border: `1px solid ${shareExpiryHours === opt.hours ? colors.alertRed : colors.border}`,
                      }}
                      onClick={() => setShareExpiryHours(opt.hours)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {shareDoc.isSharedWithContacts && shareDoc.shareableExpiresAt && (
                  <div style={s.existingShareNote}>
                    ⚠️ This document already has an active share link expiring{' '}
                    {new Date(shareDoc.shareableExpiresAt).toLocaleString()}.
                    Generating a new link will replace it.
                  </div>
                )}

                <div style={s.modalBtns}>
                  <button style={s.cancelBtn} onClick={() => setShareDoc(null)}>Cancel</button>
                  <button
                    style={{ ...s.saveBtn, opacity: sharing ? 0.6 : 1 }}
                    onClick={handleGenerateShare}
                    disabled={sharing}
                  >
                    {sharing ? 'Generating…' : '🔗 Generate Link'}
                  </button>
                </div>

                {shareDoc.isSharedWithContacts && (
                  <button style={s.revokeBtn} onClick={handleRevokeShare}>
                    🚫 Revoke Existing Link
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={s.shareLinkBox}>
                  <div style={s.shareLinkLabel}>🔗 Private Share Link</div>
                  <div style={s.shareLinkUrl}>{shareResult.shareUrl}</div>
                  <div style={s.shareLinkExpiry}>
                    Expires: {new Date(shareResult.expiresAt).toLocaleString()}
                  </div>
                </div>

                <div style={s.modalBtns}>
                  <button
                    style={{ ...s.saveBtn, background: copied ? colors.success : colors.alertRed }}
                    onClick={() => handleCopy(shareResult.shareUrl)}
                  >
                    {copied ? '✅ Copied!' : '📋 Copy Link'}
                  </button>
                </div>

                <button style={s.cancelBtn} onClick={() => { setShareDoc(null); setShareResult(null); }}>
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Document list ── */}
      <div style={s.list}>
        {loading && (
          <div style={s.centerMsg}>
            <div style={s.spinner} />
            <div style={{ color: colors.textMuted, marginTop: 12 }}>Loading documents…</div>
          </div>
        )}

        {!loading && documents.length === 0 && (
          <div style={s.emptyState}>
            <span style={{ fontSize: 56 }}>📄</span>
            <h2 style={s.emptyTitle}>No documents yet</h2>
            <p style={s.emptyHint}>
              Upload your important documents — passport, visa, green card, court papers.
              They're encrypted and only you can access them. During a panic alert, they can
              be shared as a private link with your emergency contacts.
            </p>
            <button style={s.addFirstBtn} onClick={() => setShowUpload(true)}>
              + Upload First Document
            </button>
          </div>
        )}

        {documents.map(doc => {
          const daysLeft = doc.expiresAt ? daysUntil(doc.expiresAt) : null;
          const isExpired = daysLeft !== null && daysLeft < 0;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && !isExpired;
          const hasActiveShare = doc.isSharedWithContacts &&
            doc.shareableExpiresAt &&
            new Date(doc.shareableExpiresAt) > new Date();

          return (
            <div
              key={doc._id}
              style={{
                ...s.docCard,
                borderColor: isExpired ? colors.alertRed : isExpiringSoon ? colors.warning : colors.border,
              }}
            >
              {/* Left: icon */}
              <div style={s.docIconWrap}>{DOC_ICONS[doc.type] || '📄'}</div>

              {/* Center: info */}
              <div style={s.docInfo}>
                <div style={s.docTypeLabel}>{doc.type}</div>
                <div style={s.docFileName}>{doc.fileName}</div>

                <div style={s.docMeta}>
                  {doc.fileSize ? formatBytes(doc.fileSize) : ''}
                  {doc.fileSize && doc.uploadedAt ? ' · ' : ''}
                  {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}
                </div>

                {doc.expiresAt && (
                  <div style={{
                    ...s.docExpiry,
                    color: isExpired ? colors.alertRed : isExpiringSoon ? colors.warning : colors.textMuted,
                  }}>
                    {isExpired
                      ? `⚠️ Expired ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) !== 1 ? 's' : ''} ago`
                      : isExpiringSoon
                        ? `⚠️ Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
                        : `Expires ${new Date(doc.expiresAt).toLocaleDateString()}`}
                  </div>
                )}

                {hasActiveShare && (
                  <div style={s.sharedBadge}>
                    🔗 Shared · expires {new Date(doc.shareableExpiresAt!).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Right: actions */}
              <div style={s.docActions}>
                {isViewable(doc.mimeType) && (
                  <button style={s.actionBtn} onClick={() => handleView(doc)} title="View">
                    👁️
                  </button>
                )}
                <button style={s.actionBtn} onClick={() => handleOpenShare(doc)} title="Share">
                  🔗
                </button>
                <button
                  style={{ ...s.actionBtn, ...s.deleteBtn }}
                  onClick={() => handleDelete(doc)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: colors.base,
    fontFamily: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif',
    paddingBottom: 80,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px', borderBottom: `1px solid ${colors.border}`,
    position: 'sticky', top: 0, background: colors.base, zIndex: 10,
  },
  backBtn: {
    background: 'transparent', border: 'none', color: colors.alertRed,
    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  title: { fontSize: 18, fontWeight: 700, color: colors.textPrimary, margin: 0 },
  addBtn: {
    background: colors.alertRed, border: 'none', borderRadius: 8,
    color: '#fff', fontSize: 14, fontWeight: 700, padding: '8px 14px',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  errorBox: {
    background: 'rgba(226,75,74,0.12)', border: `1px solid ${colors.alertRed}`,
    borderRadius: 8, padding: '10px 14px', color: colors.alertRed,
    fontSize: 14, margin: '8px 16px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
  },
  errDismiss: {
    background: 'transparent', border: 'none', color: colors.alertRed,
    cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, padding: '0 4px',
  },

  // Overlay + sheet
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
  },
  sheet: {
    background: colors.surface1, borderRadius: '20px 20px 0 0',
    padding: 24, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto',
  },
  sheetHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: 700, color: colors.textPrimary },
  closeBtn: {
    background: colors.surface2, border: 'none', borderRadius: '50%',
    width: 32, height: 32, color: colors.textSecondary, cursor: 'pointer',
    fontSize: 16, fontFamily: 'inherit', flexShrink: 0,
  },

  // Upload form
  encryptNote: {
    background: 'rgba(99,153,34,0.1)', border: '1px solid rgba(99,153,34,0.3)',
    borderRadius: 8, padding: '10px 14px', color: colors.success,
    fontSize: 13, marginBottom: 16, lineHeight: 1.4,
  },
  label: {
    display: 'block', fontSize: 12, fontWeight: 700, color: colors.textSecondary,
    marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  select: {
    background: colors.surface2, border: `1px solid ${colors.border}`,
    borderRadius: 8, padding: '12px 14px', color: colors.textPrimary,
    fontSize: 15, width: '100%', fontFamily: 'inherit', outline: 'none',
  },
  input: {
    background: colors.surface2, border: `1px solid ${colors.border}`,
    borderRadius: 8, padding: '12px 14px', color: colors.textPrimary,
    fontSize: 15, width: '100%', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  },
  dropZone: {
    background: colors.surface2, border: '2px dashed', borderRadius: 12,
    padding: '28px 20px', textAlign: 'center', cursor: 'pointer', marginTop: 6,
    color: colors.textSecondary, transition: 'border-color 0.2s',
  },
  changeFileBtn: {
    background: 'transparent', border: `1px solid ${colors.border}`,
    borderRadius: 6, color: colors.textMuted, fontSize: 12, padding: '4px 10px',
    cursor: 'pointer', marginTop: 8, fontFamily: 'inherit',
  },
  progressWrap: {
    background: colors.surface2, borderRadius: 8, height: 8,
    overflow: 'hidden', marginTop: 16, position: 'relative',
  },
  progressBar: {
    background: colors.alertRed, height: '100%', borderRadius: 8,
    transition: 'width 0.2s',
  },
  progressLabel: {
    position: 'absolute', right: 8, top: -18,
    fontSize: 11, color: colors.textMuted,
  },
  modalBtns: { display: 'flex', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, background: 'transparent', border: `2px solid ${colors.border}`,
    borderRadius: 8, color: colors.textSecondary, fontSize: 14, fontWeight: 700,
    padding: '12px', cursor: 'pointer', fontFamily: 'inherit',
  },
  saveBtn: {
    flex: 2, background: colors.alertRed, border: 'none', borderRadius: 8,
    color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s',
  },

  // Viewer
  viewerSheet: {
    background: colors.surface1, borderRadius: '20px 20px 0 0',
    width: '100%', maxWidth: 800, maxHeight: '96vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  viewerDocType: { fontSize: 12, fontWeight: 700, color: colors.alertRed, textTransform: 'uppercase', letterSpacing: '0.05em' },
  viewerDocName: { fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginTop: 2 },
  viewerCenter: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  pdfFrame: {
    flex: 1, border: 'none', width: '100%', minHeight: '70vh', background: '#111',
  },
  imgWrap: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#111', padding: 16, overflow: 'auto',
  },
  docImg: { maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 },
  viewerActions: {
    display: 'flex', gap: 12, padding: '12px 24px',
    borderTop: `1px solid ${colors.border}`, background: colors.surface1,
  },
  dlBtn: {
    flex: 1, background: colors.surface2, border: `1px solid ${colors.border}`,
    borderRadius: 8, color: colors.textPrimary, fontSize: 14, fontWeight: 700,
    padding: '10px', cursor: 'pointer', fontFamily: 'inherit',
    textAlign: 'center', textDecoration: 'none', display: 'block',
  },
  shareFromViewerBtn: {
    flex: 1, background: colors.alertRed, border: 'none', borderRadius: 8,
    color: '#fff', fontSize: 14, fontWeight: 700, padding: '10px',
    cursor: 'pointer', fontFamily: 'inherit',
  },

  // Share panel
  shareInfo: { marginBottom: 8 },
  expiryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 },
  expiryBtn: {
    borderRadius: 8, padding: '10px 8px', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
  },
  existingShareNote: {
    background: 'rgba(186,117,23,0.1)', border: '1px solid rgba(186,117,23,0.3)',
    borderRadius: 8, padding: '10px 14px', color: colors.warning,
    fontSize: 13, marginTop: 16, lineHeight: 1.4,
  },
  revokeBtn: {
    width: '100%', background: 'transparent', border: `1px solid ${colors.alertRed}`,
    borderRadius: 8, color: colors.alertRed, fontSize: 13, fontWeight: 700,
    padding: '10px', cursor: 'pointer', fontFamily: 'inherit', marginTop: 12,
  },
  shareLinkBox: {
    background: colors.surface2, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 16, marginBottom: 8,
  },
  shareLinkLabel: { fontSize: 12, fontWeight: 700, color: colors.alertRed, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  shareLinkUrl: { fontSize: 13, color: colors.textPrimary, wordBreak: 'break-all', lineHeight: 1.5 },
  shareLinkExpiry: { fontSize: 12, color: colors.textMuted, marginTop: 8 },

  // List
  list: { padding: '12px 16px' },
  centerMsg: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 24px',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '48px 24px', textAlign: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: '12px 0 8px' },
  emptyHint: { color: colors.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 24, maxWidth: 340 },
  addFirstBtn: {
    background: colors.alertRed, border: 'none', borderRadius: 8,
    color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 28px',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  docCard: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: colors.surface1, border: '1px solid', borderRadius: 14,
    padding: '14px', marginBottom: 10,
  },
  docIconWrap: { fontSize: 32, flexShrink: 0, lineHeight: 1 },
  docInfo: { flex: 1, minWidth: 0 },
  docTypeLabel: {
    fontSize: 11, fontWeight: 700, color: colors.alertRed,
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2,
  },
  docFileName: {
    fontSize: 15, fontWeight: 700, color: colors.textPrimary,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  docMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  docExpiry: { fontSize: 12, marginTop: 3 },
  sharedBadge: { fontSize: 11, color: colors.info, marginTop: 4 },
  docActions: { display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 },
  actionBtn: {
    background: colors.surface2, border: `1px solid ${colors.border}`,
    borderRadius: 6, padding: '7px 9px', cursor: 'pointer', fontSize: 15,
    fontFamily: 'inherit', lineHeight: 1,
  },
  deleteBtn: {
    background: 'rgba(226,75,74,0.1)',
    border: `1px solid ${colors.alertRed}`,
  },

  // Spinner
  spinner: {
    width: 32, height: 32, border: `3px solid ${colors.border}`,
    borderTopColor: colors.alertRed, borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

// Inject keyframe animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}
