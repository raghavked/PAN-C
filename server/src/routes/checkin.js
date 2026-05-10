const express = require('express');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/checkin/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const settings = await db.collection('checkInSettings').findOne({ userEmail: req.userEmail });
    if (!settings) return res.status(404).json({ error: 'Check-in settings not found' });

    const now = new Date();
    const minutesRemaining = settings.nextDueAt
      ? Math.max(0, Math.round((settings.nextDueAt - now) / 60000))
      : null;

    res.json({ settings, minutesRemaining, isOverdue: settings.nextDueAt && settings.nextDueAt < now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/checkin/settings
router.put('/settings', requireAuth, async (req, res) => {
  try {
    const { intervalMinutes, activeHours, reminders, isActive } = req.body;
    const db = getDB();
    const update = {};
    if (intervalMinutes !== undefined) {
      update.intervalMinutes = intervalMinutes;
      update.nextDueAt = new Date(Date.now() + intervalMinutes * 60 * 1000);
    }
    if (activeHours !== undefined) update.activeHours = activeHours;
    if (reminders !== undefined) update.reminders = reminders;
    if (isActive !== undefined) update.isActive = isActive;

    await db.collection('checkInSettings').updateOne(
      { userEmail: req.userEmail },
      { $set: update },
      { upsert: true }
    );
    res.json({ message: 'Check-in settings updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkin/checkin
router.post('/checkin', requireAuth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const db = getDB();

    const settings = await db.collection('checkInSettings').findOne({ userEmail: req.userEmail });
    const now = new Date();
    const isLate = settings?.nextDueAt && now > settings.nextDueAt;

    // Record history
    await db.collection('checkInHistory').insertOne({
      userEmail: req.userEmail,
      checkedInAt: now,
      status: isLate ? 'late' : 'on_time',
      location: { latitude: latitude || 0, longitude: longitude || 0 },
    });

    // Update next due time
    const intervalMinutes = settings?.intervalMinutes || 30;
    const nextDueAt = new Date(now.getTime() + intervalMinutes * 60 * 1000);

    await db.collection('checkInSettings').updateOne(
      { userEmail: req.userEmail },
      { $set: { lastCheckedInAt: now, nextDueAt, escalationLevel: 0 } }
    );

    // Update chatbot context
    await db.collection('chatbotConversations').updateOne(
      { userEmail: req.userEmail },
      { $set: { 'context.checkInStatus': 'checked_in', updatedAt: now } }
    );

    res.json({ message: 'Checked in successfully', nextDueAt, status: isLate ? 'late' : 'on_time' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkin/snooze
router.post('/snooze', requireAuth, async (req, res) => {
  try {
    const { minutes = 5 } = req.body;
    const db = getDB();
    const nextDueAt = new Date(Date.now() + minutes * 60 * 1000);
    await db.collection('checkInSettings').updateOne(
      { userEmail: req.userEmail },
      { $set: { nextDueAt } }
    );
    res.json({ message: `Snoozed ${minutes} minutes`, nextDueAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/checkin/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const limit = parseInt(req.query.limit) || 20;
    const history = await db.collection('checkInHistory')
      .find({ userEmail: req.userEmail })
      .sort({ checkedInAt: -1 })
      .limit(limit)
      .toArray();
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
