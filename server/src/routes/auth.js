const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({ error: 'email, password, fullName, and phone are required' });
    }

    const db = getDB();

    // Check if email exists
    const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate JWT tokens
    const token = jwt.sign({ userId: email.toLowerCase() }, process.env.JWT_SECRETS || process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ userId: email.toLowerCase() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

    // Create user
    const result = await db.collection('users').insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      phone,
      profilePhoto: null,
      defaultLocation: null,
      authToken: token,
      refreshToken,
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastLogin: new Date(),
      isActive: true, // Direct activation — NO email verification
      settings: {
        theme: 'dark',
        language: 'en',
        notifications: true,
      },
    });

    // Create default checkInSettings
    await db.collection('checkInSettings').insertOne({
      userEmail: email.toLowerCase(),
      intervalMinutes: 30,
      activeHours: { start: '09:00', end: '22:00' },
      reminders: [{ minutesBefore: 5 }, { minutesBefore: 1 }],
      nextDueAt: new Date(Date.now() + 30 * 60 * 1000),
      lastCheckedInAt: null,
      isActive: true,
      escalationLevel: 0,
      createdAt: new Date(),
    });

    // Create default appSettings
    await db.collection('appSettings').insertOne({
      userEmail: email.toLowerCase(),
      safePhrase: null,
      safePhraseLastSetAt: null,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create empty chatbot conversation
    await db.collection('chatbotConversations').insertOne({
      userEmail: email.toLowerCase(),
      messages: [],
      context: {
        documentsOnFile: [],
        emergencyContacts: [],
        checkInStatus: 'active',
        lastPanicAt: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      user: { _id: result.insertedId, email: email.toLowerCase(), fullName, phone },
      token,
      refreshToken,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const db = getDB();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate new tokens
    const token = jwt.sign({ userId: email.toLowerCase() }, process.env.JWT_SECRETS || process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ userId: email.toLowerCase() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { authToken: token, refreshToken, tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), lastLogin: new Date() } }
    );

    res.json({
      user: { _id: user._id, email: user.email, fullName: user.fullName, phone: user.phone, settings: user.settings },
      token,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    await db.collection('users').updateOne(
      { email: req.userEmail },
      { $set: { authToken: null, refreshToken: null } }
    );
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const db = getDB();
    const user = await db.collection('users').findOne({ email: decoded.userId });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const token = jwt.sign({ userId: user.email }, process.env.JWT_SECRETS || process.env.JWT_SECRET, { expiresIn: '7d' });
    const newRefreshToken = jwt.sign({ userId: user.email }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

    await db.collection('users').updateOne(
      { email: user.email },
      { $set: { authToken: token, refreshToken: newRefreshToken, tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
    );

    res.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const { password, authToken, refreshToken, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { fullName, phone, settings } = req.body;
    const db = getDB();
    const update = {};
    if (fullName) update.fullName = fullName;
    if (phone) update.phone = phone;
    if (settings) update.settings = { ...req.user.settings, ...settings };

    await db.collection('users').updateOne({ email: req.userEmail }, { $set: update });
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/safe-phrase — Set or update the panic disarm safe phrase
router.post('/safe-phrase', requireAuth, async (req, res) => {
  try {
    const { safePhrase } = req.body;
    if (!safePhrase || safePhrase.trim().length < 3) {
      return res.status(400).json({ error: 'safePhrase must be at least 3 characters' });
    }
    const db = getDB();
    const hashed = await bcrypt.hash(safePhrase.trim(), 10);
    await db.collection('appSettings').updateOne(
      { userEmail: req.userEmail },
      { $set: { safePhrase: hashed, safePhraseLastSetAt: new Date(), updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Safe phrase set' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/fcm-token — Register device FCM token for push notifications
router.post('/fcm-token', requireAuth, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ error: 'fcmToken is required' });

    const db = getDB();
    await db.collection('users').updateOne(
      { email: req.userEmail },
      { $set: { fcmToken, fcmTokenUpdatedAt: new Date() } }
    );

    console.log(`✅ FCM token registered for ${req.userEmail}`);
    res.json({ success: true, message: 'FCM token registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
