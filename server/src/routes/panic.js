const express = require('express');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument } = require('pdf-lib');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendNotification, sendToMany } = require('../services/fcmService');
const { sendPanicSms, sendDisarmSms } = require('../services/twilioService');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEncryptionKey() {
  const key = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!key) throw new Error('DOCUMENT_ENCRYPTION_KEY not set');
  return Buffer.from(key, 'hex');
}

function decryptDocument(encryptedData, iv, authTag) {
  const key = getEncryptionKey();
  const decipher = require('crypto').createDecipheriv(
    'aes-256-gcm', key, Buffer.from(iv.buffer || iv)
  );
  decipher.setAuthTag(Buffer.from(authTag.buffer || authTag));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedData.buffer || encryptedData)),
    decipher.final(),
  ]);
}

async function generateElevenLabsAudio(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  if (!apiKey) return null;
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!response.ok) return null;
    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer).toString('base64');
  } catch {
    return null;
  }
}

/**
 * Combine all of a user's documents into a single PDF bundle.
 * Non-PDF files are wrapped in a simple PDF page with a note.
 * Returns a Buffer of the merged PDF.
 */
async function buildDocumentBundle(db, userEmail) {
  const docs = await db.collection('documents')
    .find({ userEmail })
    .sort({ uploadedAt: -1 })
    .toArray();

  if (!docs.length) return null;

  const mergedPdf = await PDFDocument.create();

  // Cover page
  const coverPage = mergedPdf.addPage([612, 792]);
  const { rgb } = require('pdf-lib');
  coverPage.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: rgb(0.051, 0.051, 0.051) });
  coverPage.drawText('PAN!C — EMERGENCY DOCUMENT BUNDLE', {
    x: 60, y: 700, size: 18, color: rgb(0.886, 0.294, 0.290),
  });
  coverPage.drawText(`User: ${userEmail}`, { x: 60, y: 660, size: 12, color: rgb(0.96, 0.96, 0.96) });
  coverPage.drawText(`Generated: ${new Date().toUTCString()}`, { x: 60, y: 640, size: 12, color: rgb(0.96, 0.96, 0.96) });
  coverPage.drawText(`Documents included: ${docs.length}`, { x: 60, y: 620, size: 12, color: rgb(0.96, 0.96, 0.96) });

  let yPos = 580;
  for (const doc of docs) {
    coverPage.drawText(`• ${doc.type}: ${doc.fileName}`, {
      x: 80, y: yPos, size: 11, color: rgb(0.96, 0.96, 0.96),
    });
    yPos -= 20;
    if (yPos < 60) break;
  }

  // Append each document
  for (const doc of docs) {
    try {
      const decrypted = decryptDocument(doc.fileData, doc.encryptionIV, doc.encryptionAuthTag);
      const mime = doc.mimeType || '';

      if (mime === 'application/pdf') {
        // Embed actual PDF pages
        const srcPdf = await PDFDocument.load(decrypted, { ignoreEncryption: true });
        const pageIndices = srcPdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(srcPdf, pageIndices);
        copiedPages.forEach(p => mergedPdf.addPage(p));
      } else {
        // Non-PDF: add a placeholder page with file info
        const placeholderPage = mergedPdf.addPage([612, 792]);
        placeholderPage.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: rgb(0.051, 0.051, 0.051) });
        placeholderPage.drawText(`Document: ${doc.fileName}`, {
          x: 60, y: 700, size: 16, color: rgb(0.886, 0.294, 0.290),
        });
        placeholderPage.drawText(`Type: ${doc.type}`, { x: 60, y: 670, size: 12, color: rgb(0.96, 0.96, 0.96) });
        placeholderPage.drawText(`File format: ${mime || 'unknown'} (not embeddable in PDF)`, {
          x: 60, y: 650, size: 11, color: rgb(0.6, 0.6, 0.6),
        });
        placeholderPage.drawText(`Uploaded: ${doc.uploadedAt?.toUTCString() || 'unknown'}`, {
          x: 60, y: 630, size: 11, color: rgb(0.6, 0.6, 0.6),
        });
        placeholderPage.drawText('This file type cannot be embedded. Please request the original file separately.', {
          x: 60, y: 590, size: 10, color: rgb(0.6, 0.6, 0.6),
        });
      }
    } catch (e) {
      // If a single doc fails, add an error page and continue
      const errPage = mergedPdf.addPage([612, 792]);
      errPage.drawText(`Could not include: ${doc.fileName}`, { x: 60, y: 700, size: 14 });
    }
  }

  return Buffer.from(await mergedPdf.save());
}

/**
 * Store a document bundle in MongoDB with a private token and 72-hour expiry.
 * Returns the shareable URL.
 */
async function createDocumentBundleLink(db, userEmail, pdfBuffer, incidentId, baseUrl) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  await db.collection('documentBundles').insertOne({
    token,
    userEmail,
    incidentId,
    pdfData: pdfBuffer,
    createdAt: new Date(),
    expiresAt,
    downloadCount: 0,
  });

  return `${baseUrl}/api/panic/bundle/${token}`;
}

// ── GET /api/panic/bundle/:token — Public PDF bundle download ─────────────────
router.get('/bundle/:token', async (req, res) => {
  try {
    const db = getDB();
    const bundle = await db.collection('documentBundles').findOne({
      token: req.params.token,
      expiresAt: { $gt: new Date() },
    });

    if (!bundle) {
      return res.status(404).send(`
        <html><body style="background:#0D0D0D;color:#F5F5F5;font-family:sans-serif;padding:40px;text-align:center">
          <h2 style="color:#E24B4A">Link Expired or Not Found</h2>
          <p>This document bundle link has expired (72-hour limit) or is invalid.</p>
        </body></html>
      `);
    }

    // Increment download count
    await db.collection('documentBundles').updateOne(
      { token: req.params.token },
      { $inc: { downloadCount: 1 } }
    );

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="PANIC_Emergency_Documents_${bundle.incidentId}.pdf"`);
    res.send(bundle.pdfData.buffer ? Buffer.from(bundle.pdfData.buffer) : bundle.pdfData);
  } catch (err) {
    res.status(500).send('Error retrieving documents');
  }
});

// ── POST /api/panic/trigger ───────────────────────────────────────────────────
router.post('/trigger', requireAuth, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const db = getDB();

    const incidentId = `INC-${uuidv4().slice(0, 6).toUpperCase()}-${uuidv4().slice(0, 3).toUpperCase()}`;
    const locationText = latitude && longitude
      ? `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`
      : 'Location unavailable';
    const addr = address || locationText;

    // ── Get user info from MongoDB ────────────────────────────────────────────
    const user = await db.collection('users').findOne({ email: req.userEmail });
    // Use the exact fullName the user entered during signup — never fall back to email
    const userName = user?.fullName || user?.name || 'Unknown User';
    const userPhone = user?.phone || null;

    // ── Get all contacts for this user ────────────────────────────────────────
    const contacts = await db.collection('contacts')
      .find({ userEmail: req.userEmail })
      .sort({ isPrimary: -1, createdAt: 1 })
      .toArray();

    // Cross-reference contact email/phone with registered FCM tokens in users collection
    const contactEmails = contacts.filter(c => c.email).map(c => c.email.toLowerCase());
    const contactPhones = contacts.filter(c => c.phone).map(c => c.phone);
    const lookupConditions = [
      ...(contactEmails.length ? [{ email: { $in: contactEmails } }] : []),
      ...(contactPhones.length ? [{ phone: { $in: contactPhones } }] : []),
    ];
    const userTokenMap = {};
    if (lookupConditions.length) {
      const registeredUsers = await db.collection('users').find(
        { $or: lookupConditions, fcmToken: { $exists: true, $ne: null } },
        { projection: { email: 1, phone: 1, fcmToken: 1 } }
      ).toArray();
      registeredUsers.forEach(u => {
        if (u.fcmToken) {
          if (u.email) userTokenMap[u.email.toLowerCase()] = u.fcmToken;
          if (u.phone) userTokenMap[u.phone] = u.fcmToken;
        }
      });
    }

    // Resolve each contact's FCM token: user-registered token takes priority over contact-stored token
    const resolvedContacts = contacts.map(c => ({
      ...c,
      resolvedFcmToken:
        (c.email && userTokenMap[c.email.toLowerCase()]) ||
        (c.phone && userTokenMap[c.phone]) ||
        c.fcmToken || null,
    }));

    const contactsWithPush = resolvedContacts.filter(c => c.resolvedFcmToken);
    const fcmTokens = contactsWithPush.map(c => c.resolvedFcmToken);

    console.log(
      `[PAN!C] Panic triggered by ${userName} (${req.userEmail}) — ` +
      `${contacts.length} contacts total, ${fcmTokens.length} with FCM push tokens resolved`
    );

    // ── Build the base URL for links ──────────────────────────────────────────
    const baseUrl = process.env.API_BASE_URL ||
      `${req.protocol}://${req.get('host')}`;

    // ── Build the Help Page link (populated with real incident data) ──────────
    const incidentTime = new Date();
    const helpParams = new URLSearchParams({
      name: userName,
      id: incidentId,
      time: incidentTime.toISOString(),
      ...(latitude  && { lat:  String(Number(latitude).toFixed(6))  }),
      ...(longitude && { lng: String(Number(longitude).toFixed(6)) }),
      ...(address   && { address }),
    });
    const helpLink = `${baseUrl}/help?${helpParams.toString()}`;

    // ── Build the Document Bundle PDF link ───────────────────────────────────
    // Only generate if the user actually has documents uploaded
    let docBundleLink = null;
    try {
      const docCount = await db.collection('documents').countDocuments({ userEmail: req.userEmail });
      if (docCount > 0) {
        const pdfBuffer = await buildDocumentBundle(db, req.userEmail);
        if (pdfBuffer) {
          docBundleLink = await createDocumentBundleLink(
            db, req.userEmail, pdfBuffer, incidentId, baseUrl
          );
          console.log(`[PAN!C] Document bundle (${docCount} docs) created for ${incidentId}`);
        }
      } else {
        console.log(`[PAN!C] No documents on file for ${req.userEmail} — skipping bundle`);
      }
    } catch (pdfErr) {
      console.error('[PAN!C] Document bundle error (non-fatal):', pdfErr.message);
    }

    // ── Generate ElevenLabs audio alert ──────────────────────────────────────
    const audioBase64 = await generateElevenLabsAudio(
      `HELP! ICE AGENTS! HELP! LA MIGRA! This is an emergency alert from PAN!C. ` +
      `${userName} needs help immediately. Incident ID: ${incidentId}`
    );

    // ── Build FCM notification — exact message as specified ───────────────────
    // Title: PAN!C — EMERGENCY ALERT — [User's Full Name]
    // Body:  [Name] pushed their button that law enforcement authorities are
    //        putting them in a dangerous situation. Location: lat, lng.
    //        Please access next steps here: [helpLink]
    //        [, and their documents they wanted to share to you here: [docLink]]
    const notifTitle = `🚨 PAN!C — EMERGENCY ALERT — ${userName}`;

    // Format location as human-readable coordinates or address
    const locationDisplay = address
      ? address
      : (latitude && longitude
          ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
          : 'Location unavailable');

    const notifBody = docBundleLink
      ? `${userName} pushed their button that law enforcement authorities are putting them in a dangerous situation. Location: ${locationDisplay}. Please access next steps here: ${helpLink}, and their documents they wanted to share to you here: ${docBundleLink}`
      : `${userName} pushed their button that law enforcement authorities are putting them in a dangerous situation. Location: ${locationDisplay}. Please access next steps here: ${helpLink}`;

    // ── Send FCM push notifications — per-contact, respecting canSeeDocuments ──
    // Each contact gets a personalized message:
    //   - contacts with canSeeDocuments: false  → message without doc bundle link
    //   - all others                            → message with doc bundle link (if any)
    let sentCount = 0;
    let failedCount = 0;
    let failedTokens = [];

    for (const contact of contactsWithPush) {
      // Determine whether this contact should see the document bundle link
      const showDocs = docBundleLink && (contact.canSeeDocuments !== false);

      const contactBody = showDocs
        ? `${userName} pushed their button that law enforcement authorities are putting them in a dangerous situation. Location: ${locationDisplay}. Please access next steps here: ${helpLink}, and their documents they wanted to share to you here: ${docBundleLink}`
        : `${userName} pushed their button that law enforcement authorities are putting them in a dangerous situation. Location: ${locationDisplay}. Please access next steps here: ${helpLink}`;

      const result = await sendNotification(
        contact.resolvedFcmToken,
        notifTitle,
        contactBody,
        {
          incidentId,
          userEmail:     req.userEmail,
          userName,
          userPhone:     userPhone || '',
          address:       locationDisplay,
          latitude:      String(latitude  || ''),
          longitude:     String(longitude || ''),
          helpLink,
          docBundleLink: showDocs ? docBundleLink : '',
          triggeredAt:   incidentTime.toISOString(),
        }
      );

      if (result.success) {
        sentCount++;
        console.log(`[PAN!C] FCM sent to ${contact.name} (canSeeDocuments=${contact.canSeeDocuments !== false})`);
      } else {
        failedCount++;
        failedTokens.push(contact.resolvedFcmToken);
        console.warn(`[PAN!C] FCM failed for ${contact.name}: ${result.error}`);
      }
    }

    // ── Build contactsNotified array ──────────────────────────────────────────
    const contactsNotified = resolvedContacts.map(c => {
      const pushEnabled = !!c.resolvedFcmToken;
      let status;
      if (!c.resolvedFcmToken) {
        status = 'no_app';
      } else if (failedTokens.includes(c.resolvedFcmToken)) {
        status = 'failed';
      } else {
        status = 'sent';
      }
      return {
        contactId:       c._id,
        name:            c.name,
        phone:           c.phone || null,
        hasApp:          pushEnabled,
        pushEnabled,
        canSeeDocuments: c.canSeeDocuments !== false,
        notifiedAt:      new Date(),
        method:          pushEnabled ? 'fcm_push' : 'no_app',
        status,
      };
    });

    // ── Create incident record ────────────────────────────────────────────────
    const incident = {
      incidentId,
      userEmail: req.userEmail,
      triggeredAt: new Date(),
      location: {
        latitude: latitude || null,
        longitude: longitude || null,
        address: addr,
      },
      contactsNotified,
      audioBase64: audioBase64 || null,
      status: 'active',
      sentCount,
      failedCount,
      helpLink,
      docBundleLink,
      disarmedAt: null,
      disarmedBy: null,
      createdAt: new Date(),
    };

    const result = await db.collection('incidents').insertOne(incident);

    // Update chatbot context
    await db.collection('chatbotConversations').updateOne(
      { userEmail: req.userEmail },
      {
        $set: {
          'context.lastPanicAt': new Date(),
          'context.checkInStatus': 'panic_active',
          updatedAt: new Date(),
        },
      }
    );

    console.log(`[PAN!C] Incident ${incidentId}: FCM sent=${sentCount}, failed=${failedCount}, helpLink=${helpLink}, docBundle=${!!docBundleLink}`);

    res.status(201).json({
      incidentId,
      _id: result.insertedId,
      contactsNotified,
      audioBase64,
      status: 'active',
      sentCount,
      failedCount,
      totalContacts: contacts.length,
      contactsWithoutApp: contacts.length - fcmTokens.length,
      helpLink,
      docBundleLink,
      message: `🚨 Alert sent to ${sentCount} contact${sentCount !== 1 ? 's' : ''} via push notification`,
    });
  } catch (err) {
    console.error('[PAN!C] Panic trigger error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/panic/disarm ────────────────────────────────────────────────────
router.post('/disarm', requireAuth, async (req, res) => {
  try {
    const { incidentId, safePhrase } = req.body;
    if (!incidentId || !safePhrase) {
      return res.status(400).json({ error: 'incidentId and safePhrase are required' });
    }

    const db = getDB();

    // Verify safe phrase
    const appSettings = await db.collection('appSettings').findOne({ userEmail: req.userEmail });
    if (!appSettings?.safePhrase) {
      return res.status(400).json({ error: 'No safe phrase set. Please set one in settings.' });
    }

    const valid = await bcrypt.compare(safePhrase, appSettings.safePhrase);
    if (!valid) return res.status(401).json({ error: 'Incorrect safe phrase' });

    const now = new Date();
    await db.collection('incidents').updateOne(
      { incidentId, userEmail: req.userEmail },
      { $set: { status: 'disarmed', disarmedAt: now, disarmedBy: 'user_safe_phrase' } }
    );

    // Send all-clear FCM push to contacts with the app
    const user = await db.collection('users').findOne({ email: req.userEmail });
    const userName = user?.fullName || user?.name || req.userEmail;
    const contacts = await db.collection('contacts')
      .find({ userEmail: req.userEmail })
      .toArray();

    // Cross-reference contact email/phone with registered FCM tokens in users collection
    const disarmEmails = contacts.filter(c => c.email).map(c => c.email.toLowerCase());
    const disarmPhones = contacts.filter(c => c.phone).map(c => c.phone);
    const disarmConditions = [
      ...(disarmEmails.length ? [{ email: { $in: disarmEmails } }] : []),
      ...(disarmPhones.length ? [{ phone: { $in: disarmPhones } }] : []),
    ];
    const disarmTokenMap = {};
    if (disarmConditions.length) {
      const disarmUsers = await db.collection('users').find(
        { $or: disarmConditions, fcmToken: { $exists: true, $ne: null } },
        { projection: { email: 1, phone: 1, fcmToken: 1 } }
      ).toArray();
      disarmUsers.forEach(u => {
        if (u.fcmToken) {
          if (u.email) disarmTokenMap[u.email.toLowerCase()] = u.fcmToken;
          if (u.phone) disarmTokenMap[u.phone] = u.fcmToken;
        }
      });
    }
    const allClearTokens = [...new Set(contacts.map(c =>
      (c.email && disarmTokenMap[c.email.toLowerCase()]) ||
      (c.phone && disarmTokenMap[c.phone]) ||
      c.fcmToken || null
    ).filter(Boolean))];

    if (allClearTokens.length > 0) {
      await sendToMany(
        allClearTokens,
        `✅ ALL CLEAR — ${userName} is safe`,
        `Incident ${incidentId} has been resolved. No further action needed.`,
        { incidentId, status: 'disarmed' }
      );
    }

    await db.collection('chatbotConversations').updateOne(
      { userEmail: req.userEmail },
      { $set: { 'context.checkInStatus': 'safe', updatedAt: now } }
    );

    res.json({ message: 'Incident disarmed. All-clear push notification sent to contacts.' });
  } catch (err) {
    console.error('[PAN!C] Panic disarm error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/panic/incidents ──────────────────────────────────────────────────
router.get('/incidents', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const incidents = await db.collection('incidents')
      .find({ userEmail: req.userEmail }, { projection: { audioBase64: 0 } })
      .sort({ triggeredAt: -1 })
      .limit(20)
      .toArray();
    res.json({ incidents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/panic/active ─────────────────────────────────────────────────────
router.get('/active', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const active = await db.collection('incidents').findOne(
      { userEmail: req.userEmail, status: 'active' },
      { sort: { triggeredAt: -1 }, projection: { audioBase64: 0 } }
    );
    res.json({ incident: active || null, hasActive: !!active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/panic/safephrase ────────────────────────────────────────────────
router.post('/safephrase', requireAuth, async (req, res) => {
  try {
    const { safePhrase } = req.body;
    if (!safePhrase || safePhrase.length < 4) {
      return res.status(400).json({ error: 'Safe phrase must be at least 4 characters' });
    }
    const db = getDB();
    const hashed = await bcrypt.hash(safePhrase, 10);
    await db.collection('appSettings').updateOne(
      { userEmail: req.userEmail },
      { $set: { safePhrase: hashed, safePhraseLastSetAt: new Date(), updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ message: 'Safe phrase set successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
