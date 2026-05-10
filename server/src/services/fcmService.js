const admin = require('firebase-admin');
let firebaseInitialized = false;
let initFailed = false;

function initializeFirebase() {
  if (firebaseInitialized || initFailed || admin.apps.length) return;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  if (!privateKey || !projectId || !clientEmail) {
    console.warn('⚠️  Firebase FCM not configured — push via Firebase disabled (Expo push still works)');
    initFailed = true;
    return;
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: 'service_account',
        project_id: projectId,
        private_key: privateKey,
        client_email: clientEmail,
        client_id: '',
        auth_uri:  'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
      }),
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Cloud Messaging initialized');
  } catch (err) {
    console.warn('⚠️  Firebase FCM initialization failed:', err.message);
    initFailed = true;
  }
}

// ── Expo Push Notification service ───────────────────────────────────────────
// Works in Expo Go (anonymous) and standalone builds without Firebase Admin.
async function sendViaExpoPush(token, title, body, data = {}) {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Accept':         'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to:        token,
        title,
        body,
        data,
        sound:     'default',
        priority:  'high',
        channelId: 'panic-alerts',
      }),
    });
    const json   = await res.json();
    const result = Array.isArray(json.data) ? json.data[0] : json.data;
    if (result?.status === 'ok') {
      console.log(`[Expo Push] ✅ Sent to ${token.slice(0, 30)}...`);
      return { success: true };
    }
    console.error('[Expo Push] Error:', JSON.stringify(result));
    return { success: false, error: result?.message || 'Expo push failed' };
  } catch (err) {
    console.error('[Expo Push] Network error:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Firebase FCM (for standalone builds with native FCM tokens) ───────────────
async function sendViaFirebase(token, title, body, data = {}) {
  initializeFirebase();
  if (initFailed || !firebaseInitialized) {
    console.log(`[FCM stub] Would notify ${token?.slice(0, 20)}...: "${title}"`);
    return { success: false, error: 'Firebase not initialized' };
  }
  try {
    await admin.messaging().send({ notification: { title, body }, data, token });
    return { success: true };
  } catch (err) {
    console.error(`[Firebase FCM] Send failed for ${token?.slice(0, 20)}...:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── Unified sendNotification — auto-detects token type ───────────────────────
async function sendNotification(token, title, body, data = {}) {
  if (!token) return { success: false, error: 'No token' };
  // Expo push tokens always start with "ExponentPushToken["
  if (token.startsWith('ExponentPushToken[')) {
    return sendViaExpoPush(token, title, body, data);
  }
  // Native FCM/APNs tokens → use Firebase Admin
  return sendViaFirebase(token, title, body, data);
}

async function sendToMany(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return { sentCount: 0, failedCount: 0, failedTokens: [] };
  let sentCount = 0, failedCount = 0;
  const failedTokens = [];
  for (const token of tokens) {
    const result = await sendNotification(token, title, body, data);
    if (result.success) { sentCount++; } else { failedCount++; failedTokens.push(token); }
  }
  return { sentCount, failedCount, failedTokens };
}

module.exports = { initializeFirebase, sendNotification, sendToMany };
