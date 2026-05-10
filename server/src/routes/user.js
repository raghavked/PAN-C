const express = require('express');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/push-token', requireAuth, async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) return res.status(400).json({ error: 'pushToken required' });

    if (!pushToken.startsWith('ExponentPushToken[')) {
      return res.status(400).json({ error: 'Invalid format — expected ExponentPushToken[...]' });
    }

    const db = getDB();
    await db.collection('users').updateOne(
      { email: req.userEmail },
      { $set: { pushToken, pushTokenUpdatedAt: new Date() } }
    );

    console.log(`[Push] Token registered for ${req.userEmail}: ${pushToken.substring(0, 45)}...`);
    res.json({ success: true, message: 'Push token registered' });
  } catch (err) {
    console.error('[Push] Token registration error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
