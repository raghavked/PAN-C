const express = require('express');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendToMany, initializeFirebase } = require('../services/fcmService');

const router = express.Router();

// Initialize Firebase on module load
initializeFirebase();

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

// ── POST /api/panic/trigger ───────────────────────────────────────────────────
router.post('/trigger', requireAuth, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const db = getDB();

    const incidentId = `INC-${uuidv4().slice(0, 6).toUpperCase()}-${uuidv4().slice(0, 3).toUpperCase()}`;
    const locationText = latitude && longitude
      ? `GPS: ${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`
      : 'Location unavailable';
    const addr = address || locationText;

    // Get user info
    const user = await db.collection('users').findOne({ email: req.userEmail });
    const userName = user?.fullName || user?.name || req.userEmail;

    // Get all contacts for this user
    const contacts = await db.collection('contacts')
      .find({ userEmail: req.userEmail })
      .toArray();

    // Separate contacts with FCM tokens (app installed) from those without
    const contactsWithTokens = contacts.filter(c => c.fcmToken);
    const fcmTokens = contactsWithTokens.map(c => c.fcmToken);

    console.log(`[PAN!C] Panic triggered by ${req.userEmail} — ${contacts.length} contacts, ${fcmTokens.length} with FCM tokens`);

    // Generate ElevenLabs audio alert
    const audioBase64 = await generateElevenLabsAudio(
      `HELP! ICE AGENTS! HELP! LA MIGRA! This is an emergency alert from PAN!C. ${userName} needs help. Incident ID: ${incidentId}`
    );

    // Send Firebase Cloud Messaging push notifications
    let sentCount = 0;
    let failedCount = 0;
    let failedTokens = [];

    if (fcmTokens.length > 0) {
      const fcmResult = await sendToMany(
        fcmTokens,
        `🚨 ${userName} NEEDS HELP!`,
        `Location: ${addr}`,
        {
          incidentId,
          userEmail: req.userEmail,
          userName,
          address: addr,
          latitude: String(latitude || ''),
          longitude: String(longitude || ''),
        }
      );
      sentCount = fcmResult.sentCount;
      failedCount = fcmResult.failedCount;
      failedTokens = fcmResult.failedTokens;
    }

    // Build contactsNotified array
    const contactsNotified = contacts.map(c => ({
      contactId: c._id,
      name: c.name,
      phone: c.phone || null,
      hasApp: !!c.fcmToken,
      notifiedAt: new Date(),
      method: c.fcmToken ? 'fcm_push' : 'no_app',
      status: c.fcmToken
        ? (failedTokens.includes(c.fcmToken) ? 'failed' : 'sent')
        : 'no_app',
    }));

    // Create incident record
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

    console.log(`[PAN!C] Incident ${incidentId}: FCM sent=${sentCount}, failed=${failedCount}`);

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
    const allClearTokens = contacts.filter(c => c.fcmToken).map(c => c.fcmToken);

    if (allClearTokens.length > 0) {
      await sendToMany(
        allClearTokens,
        `✅ ALL CLEAR — ${userName} is safe`,
        `Incident ${incidentId} has been resolved.`,
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
