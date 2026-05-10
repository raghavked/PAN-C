require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./db');

const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const documentsRoutes = require('./routes/documents');
const checkinRoutes = require('./routes/checkin');
const panicRoutes = require('./routes/panic');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;
let mongoConnected = false;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve the emergency help HTML page at /help
app.use('/help', express.static(path.join(__dirname, '../public')));
app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/help.html'));
});

// Health check (must be before 404 handler)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'PAN!C', version: '1.0.0', mongo: mongoConnected ? 'connected' : 'reconnecting' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/panic', panicRoutes);
app.use('/api/chat', chatRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[PAN!C Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start — server boots immediately; MongoDB connection retried in background
app.listen(PORT, () => {
  console.log(`🚨 PAN!C server running on port ${PORT}`);
});

async function connectWithRetry(attempt = 1) {
  try {
    await connectDB();
    mongoConnected = true;
  } catch (err) {
    const wait = Math.min(attempt * 5000, 30000);
    console.error(`⚠️  MongoDB connection attempt ${attempt} failed: ${err.message}`);
    console.log(`🔄 Retrying in ${wait / 1000}s...`);
    setTimeout(() => connectWithRetry(attempt + 1), wait);
  }
}

connectWithRetry();
