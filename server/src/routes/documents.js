const express = require('express');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function getEncryptionKey() {
  const key = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!key) throw new Error('DOCUMENT_ENCRYPTION_KEY not set');
  return Buffer.from(key, 'hex');
}

function encryptDocument(fileBuffer) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encryptedData: encrypted, iv, authTag };
}

function decryptDocument(encryptedData, iv, authTag) {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv.buffer || iv));
  decipher.setAuthTag(Buffer.from(authTag.buffer || authTag));
  return Buffer.concat([decipher.update(Buffer.from(encryptedData.buffer || encryptedData)), decipher.final()]);
}

// GET /api/documents
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const docs = await db.collection('documents')
      .find({ userEmail: req.userEmail }, {
        projection: { fileData: 0, encryptionIV: 0, encryptionAuthTag: 0 }
      })
      .sort({ uploadedAt: -1 })
      .toArray();
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents — Upload document (base64 encoded)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, fileName, fileDataBase64, mimeType, expiresAt } = req.body;
    if (!type || !fileName || !fileDataBase64) {
      return res.status(400).json({ error: 'type, fileName, and fileDataBase64 are required' });
    }

    const fileBuffer = Buffer.from(fileDataBase64, 'base64');
    const { encryptedData, iv, authTag } = encryptDocument(fileBuffer);

    const db = getDB();
    const doc = {
      userEmail: req.userEmail,
      type,
      fileName,
      fileData: encryptedData,
      encryptionIV: iv,
      encryptionAuthTag: authTag,
      uploadedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isSharedWithContacts: false,
      shareableLink: null,
      shareableExpiresAt: null,
      fileSize: fileBuffer.length,
      mimeType: mimeType || 'application/octet-stream',
    };

    const result = await db.collection('documents').insertOne(doc);

    // Update chatbot context
    await updateChatbotDocContext(db, req.userEmail);

    const { fileData, encryptionIV, encryptionAuthTag, ...safeDoc } = doc;
    res.status(201).json({ document: { ...safeDoc, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id/download — Download decrypted document
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const doc = await db.collection('documents').findOne({
      _id: new ObjectId(req.params.id),
      userEmail: req.userEmail,
    });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const decrypted = decryptDocument(doc.fileData, doc.encryptionIV, doc.encryptionAuthTag);
    res.set('Content-Type', doc.mimeType);
    res.set('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    res.send(decrypted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/documents/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const { type, fileName, expiresAt, isSharedWithContacts } = req.body;
    const update = {};
    if (type !== undefined) update.type = type;
    if (fileName !== undefined) update.fileName = fileName;
    if (expiresAt !== undefined) update.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isSharedWithContacts !== undefined) update.isSharedWithContacts = isSharedWithContacts;

    const result = await db.collection('documents').updateOne(
      { _id: new ObjectId(req.params.id), userEmail: req.userEmail },
      { $set: update }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Document not found' });
    res.json({ message: 'Document updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('documents').deleteOne(
      { _id: new ObjectId(req.params.id), userEmail: req.userEmail }
    );
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Document not found' });
    await updateChatbotDocContext(db, req.userEmail);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents/:id/share — Generate 24-hour share link
router.post('/:id/share', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const shareableLink = crypto.randomBytes(32).toString('hex');
    const shareableExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await db.collection('documents').updateOne(
      { _id: new ObjectId(req.params.id), userEmail: req.userEmail },
      { $set: { shareableLink, shareableExpiresAt, isSharedWithContacts: true } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Document not found' });

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${shareableLink}`;
    res.json({ shareableLink, shareUrl, expiresAt: shareableExpiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/share/:link — Public access via share link
router.get('/share/:link', async (req, res) => {
  try {
    const db = getDB();
    const doc = await db.collection('documents').findOne({
      shareableLink: req.params.link,
      shareableExpiresAt: { $gt: new Date() },
    });
    if (!doc) return res.status(404).json({ error: 'Share link not found or expired' });

    const decrypted = decryptDocument(doc.fileData, doc.encryptionIV, doc.encryptionAuthTag);
    res.set('Content-Type', doc.mimeType);
    res.set('Content-Disposition', `inline; filename="${doc.fileName}"`);
    res.send(decrypted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function updateChatbotDocContext(db, userEmail) {
  const docs = await db.collection('documents')
    .find({ userEmail }, { projection: { type: 1, fileName: 1, expiresAt: 1 } })
    .toArray();
  const names = docs.map(d => `${d.type}: ${d.fileName}${d.expiresAt ? ` (expires ${d.expiresAt.toLocaleDateString()})` : ''}`);
  await db.collection('chatbotConversations').updateOne(
    { userEmail },
    { $set: { 'context.documentsOnFile': names, updatedAt: new Date() } }
  );
}

module.exports = router;
