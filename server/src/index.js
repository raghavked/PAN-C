require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const documentsRoutes = require('./routes/documents');
const checkinRoutes = require('./routes/checkin');
const panicRoutes = require('./routes/panic');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

let dbConnected = false;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'PAN!C', version: '1.0.0', db: dbConnected ? 'connected' : 'disconnected' });
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/panic', panicRoutes);
app.use('/api/chat', chatRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('[PAN!C Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server immediately — connect to MongoDB in background with retries
app.listen(PORT, () => {
  console.log(`🚨 PAN!C server running on port ${PORT}`);
  connectWithRetry();
});

async function connectWithRetry(attempt = 1, maxAttempts = 10) {
  try {
    await connectDB();
    dbConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    const isNetworkErr = err.message?.includes('SSL') || err.message?.includes('TLS') ||
      err.message?.includes('ECONNREFUSED') || err.message?.includes('network');
    if (attempt === 1) {
      console.error(`❌ MongoDB connection failed: ${err.message}`);
      if (isNetworkErr) {
        console.error('💡 TIP: Go to MongoDB Atlas → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)');
      }
    }
    if (attempt < maxAttempts) {
      const delay = Math.min(5000 * attempt, 30000);
      console.log(`   Retrying in ${delay / 1000}s... (attempt ${attempt}/${maxAttempts})`);
      setTimeout(() => connectWithRetry(attempt + 1, maxAttempts), delay);
    } else {
      console.error('   Max retries reached. Server running without database.');
    }
  }
}
