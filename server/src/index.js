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

let dbConnected = false;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Serve static public assets ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));


app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'PAN!C', version: '1.0.0', db: dbConnected ? 'connected' : 'disconnected' });


});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/panic', panicRoutes);
app.use('/api/chat', chatRoutes);

// ── GET /doc/:link — Public shareable document viewer page ───────────────────────
// Renders a branded HTML page that displays the document inline
app.get('/doc/:link', async (req, res) => {
  try {
    const { getDB } = require('./db');
    const db = getDB();
    const doc = await db.collection('documents').findOne({
      shareableLink: req.params.link,
      shareableExpiresAt: { $gt: new Date() },
    });
    if (!doc) {
      return res.status(404).send(buildDocViewerPage(null, null, null));
    }
    const crypto = require('crypto');
    const key = Buffer.from(process.env.DOCUMENT_ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(doc.encryptionIV.buffer || doc.encryptionIV));
    decipher.setAuthTag(Buffer.from(doc.encryptionAuthTag.buffer || doc.encryptionAuthTag));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(doc.fileData.buffer || doc.fileData)),
      decipher.final(),
    ]);
    const b64 = decrypted.toString('base64');
    res.send(buildDocViewerPage(doc, b64, req.params.link));
  } catch (err) {
    console.error('[PAN!C] /doc/:link error:', err.message);
    res.status(500).send(buildDocViewerPage(null, null, null, err.message));
  }
});

function buildDocViewerPage(doc, b64, link, errMsg) {
  const title = doc ? `${doc.type} — ${doc.fileName}` : 'Document Not Found';
  const expires = doc?.shareableExpiresAt
    ? new Date(doc.shareableExpiresAt).toLocaleString('en-US', { timeZoneName: 'short' })
    : '';

  let content;
  if (!doc || !b64) {
    content = `
      <div class="error-box">
        <div class="error-icon">🔒</div>
        <h2>Link Not Found or Expired</h2>
        <p>This document link has expired or is invalid. Please contact the person who shared it with you for a new link.</p>
        ${errMsg ? `<p class="err-detail">${errMsg}</p>` : ''}
      </div>`;
  } else if (doc.mimeType === 'application/pdf') {
    content = `
      <div class="doc-header">
        <span class="doc-badge">📄 PDF Document</span>
        <h2>${doc.type}: ${doc.fileName}</h2>
        <p class="expires">Link expires: ${expires}</p>
      </div>
      <div class="pdf-wrap">
        <iframe src="data:application/pdf;base64,${b64}" title="${doc.fileName}" class="pdf-frame"></iframe>
      </div>
      <div class="download-row">
        <a href="data:${doc.mimeType};base64,${b64}" download="${doc.fileName}" class="dl-btn">⬇️ Download ${doc.fileName}</a>
      </div>`;
  } else if (doc.mimeType.startsWith('image/')) {
    content = `
      <div class="doc-header">
        <span class="doc-badge">🖼️ Image</span>
        <h2>${doc.type}: ${doc.fileName}</h2>
        <p class="expires">Link expires: ${expires}</p>
      </div>
      <div class="img-wrap">
        <img src="data:${doc.mimeType};base64,${b64}" alt="${doc.fileName}" class="doc-img" />
      </div>
      <div class="download-row">
        <a href="data:${doc.mimeType};base64,${b64}" download="${doc.fileName}" class="dl-btn">⬇️ Download ${doc.fileName}</a>
      </div>`;
  } else {
    content = `
      <div class="doc-header">
        <span class="doc-badge">📄 Document</span>
        <h2>${doc.type}: ${doc.fileName}</h2>
        <p class="expires">Link expires: ${expires}</p>
      </div>
      <div class="download-row" style="margin-top:40px">
        <a href="data:${doc.mimeType};base64,${b64}" download="${doc.fileName}" class="dl-btn">⬇️ Download ${doc.fileName}</a>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PAN!C — ${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#000;color:#f0f0f0;font-family:'Atkinson Hyperlegible',sans-serif;min-height:100vh;display:flex;flex-direction:column}
    .topbar{background:#0a0a0a;border-bottom:1px solid #222;padding:12px 20px;display:flex;align-items:center;gap:12px}
    .topbar-logo{color:#E24B4A;font-size:22px;font-weight:700;letter-spacing:-0.5px}
    .topbar-sub{color:#888;font-size:13px}
    .main{flex:1;max-width:900px;margin:0 auto;width:100%;padding:24px 16px}
    .doc-header{margin-bottom:20px}
    .doc-badge{background:rgba(226,75,74,0.15);border:1px solid rgba(226,75,74,0.4);color:#E24B4A;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:.05em}
    .doc-header h2{font-size:22px;font-weight:700;color:#fff;margin-top:10px}
    .expires{font-size:13px;color:#666;margin-top:6px}
    .pdf-wrap{background:#111;border-radius:12px;overflow:hidden;border:1px solid #222}
    .pdf-frame{width:100%;height:80vh;border:none;display:block}
    .img-wrap{text-align:center;background:#111;border-radius:12px;padding:16px;border:1px solid #222}
    .doc-img{max-width:100%;max-height:80vh;border-radius:8px;object-fit:contain}
    .download-row{margin-top:16px;text-align:center}
    .dl-btn{display:inline-block;background:#E24B4A;color:#fff;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-family:inherit}
    .dl-btn:hover{background:#c73b3a}
    .error-box{text-align:center;padding:60px 20px}
    .error-icon{font-size:64px;margin-bottom:16px}
    .error-box h2{font-size:24px;font-weight:700;color:#E24B4A;margin-bottom:12px}
    .error-box p{color:#888;font-size:16px;max-width:400px;margin:0 auto}
    .err-detail{font-size:12px;color:#555;margin-top:12px}
    .footer{text-align:center;padding:20px;color:#444;font-size:12px;border-top:1px solid #111}
  </style>
</head>
<body>
  <div class="topbar">
    <span class="topbar-logo">🚨 PAN!C</span>
    <span class="topbar-sub">Shared Document</span>
  </div>
  <div class="main">${content}</div>
  <div class="footer">PAN!C — Personal Alert Network + Interactive Crisis Communication</div>
</body>
</html>`;
}

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


