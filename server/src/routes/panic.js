const express = require('express');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  const twilio = require('twilio');
  return twilio(accountSid, authToken);
}

async function generateElevenLabsAudio(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  if (!apiKey) return null;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });
    if (!response.ok) return null;
    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer).toString('base64');
  } catch {
    return null;
  }
}

// POST /api/panic/trigger
router.post('/trigger', requireAuth, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const db = getDB();

    const incidentId = `INC-${uuidv4().slice(0, 6).toUpperCase()}-${uuidv4().slice(0, 3).toUpperCase()}`;

    // Get user info
    const user = await db.collection('users').findOne({ email: req.userEmail });

    // Get contacts
    const contacts = await db.collection('contacts').find({ userEmail: req.userEmail }).toArray();

    // Generate ElevenLabs audio
    const audioBase64 = await generateElevenLabsAudio(
      `HELP! ICE AGENTS! HELP! LA MIGRA! This is an emergency alert from PAN!C. ${user.fullName} needs help. Incident ID: ${incidentId}`
    );

    // Send SMS via Twilio
    const twilioClient = getTwilioClient();
    const contactsNotified = [];
    const locationText = latitude && longitude
      ? `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      : 'Location unavailable';

    for (const contact of contacts) {
      if (contact.notifyVia?.sms && contact.phone) {
        const smsBody = `🚨 EMERGENCY ALERT from PAN!C\n${user.fullName} has triggered a panic alert.\n${locationText}\nIncident ID: ${incidentId}\nReply HELP for more info.`;
        let smsStatus = 'failed';
        try {
          if (twilioClient) {
            await twilioClient.messages.create({
              body: smsBody,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: contact.phone,
            });
            smsStatus = 'sent';
          }
        } catch (e) {
          console.error('Twilio SMS error:', e.message);
        }
        contactsNotified.push({
          contactId: contact._id,
          name: contact.name,
          notifiedAt: new Date(),
          method: 'sms',
          status: smsStatus,
        });
      }
    }

    // Create incident record
    const incident = {
      incidentId,
      userEmail: req.userEmail,
      triggeredAt: new Date(),
      location: { latitude: latitude || 0, longitude: longitude || 0, address: address || '' },
      contactsNotified,
      audioBase64: audioBase64 || null,
      status: 'active',
      disarmedAt: null,
      disarmedBy: null,
      createdAt: new Date(),
    };

    const result = await db.collection('incidents').insertOne(incident);

    // Update chatbot context
    await db.collection('chatbotConversations').updateOne(
      { userEmail: req.userEmail },
      { $set: { 'context.lastPanicAt': new Date(), 'context.checkInStatus': 'panic_active', updatedAt: new Date() } }
    );

    res.status(201).json({
      incidentId,
      _id: result.insertedId,
      contactsNotified,
      audioBase64,
      status: 'active',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/panic/disarm
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

    // Send all-clear SMS
    const user = await db.collection('users').findOne({ email: req.userEmail });
    const contacts = await db.collection('contacts').find({ userEmail: req.userEmail }).toArray();
    const twilioClient = getTwilioClient();

    for (const contact of contacts) {
      if (contact.notifyVia?.sms && contact.phone && twilioClient) {
        try {
          await twilioClient.messages.create({
            body: `✅ ALL CLEAR from PAN!C\n${user.fullName} is safe. Incident ${incidentId} has been resolved.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: contact.phone,
          });
        } catch (e) {
          console.error('Twilio all-clear SMS error:', e.message);
        }
      }
    }

    await db.collection('chatbotConversations').updateOne(
      { userEmail: req.userEmail },
      { $set: { 'context.checkInStatus': 'safe', updatedAt: now } }
    );

    res.json({ message: 'Incident disarmed. All-clear sent to contacts.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/incidents
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

// PUT /api/auth/settings/safephrase — Set safe phrase
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
