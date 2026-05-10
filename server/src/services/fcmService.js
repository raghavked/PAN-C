const admin = require('firebase-admin');

let firebaseInitialized = false;
let initFailed = false;

function initializeFirebase() {
  if (firebaseInitialized || initFailed || admin.apps.length) return;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!privateKey || !projectId || !clientEmail) {
    console.warn('⚠️  Firebase FCM not configured (missing env vars) — push notifications disabled');
    initFailed = true;
    return;
  }

  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: projectId,
      private_key: privateKey,
      client_email: clientEmail,
      client_id: '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Cloud Messaging initialized');
  } catch (err) {
    console.warn('⚠️  Firebase FCM initialization failed:', err.message);
    console.warn('   Push notifications will be disabled. Check FIREBASE_PRIVATE_KEY format.');
    initFailed = true;
  }
}

async function sendNotification(token, title, body, data = {}) {
  initializeFirebase();
  if (initFailed || !firebaseInitialized) {
    console.log(`[FCM stub] Would notify token ${token?.slice(0, 20)}...: "${title}"`);
    return { success: false, error: 'Firebase not initialized' };
  }
  try {
    await admin.messaging().send({
      notification: { title, body },
      data,
      token,
    });
    return { success: true };
  } catch (err) {
    console.error(`FCM send failed for token ${token?.slice(0, 20)}...:`, err.message);
    return { success: false, error: err.message };
  }
}

async function sendToMany(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return { sentCount: 0, failedCount: 0, failedTokens: [] };

  let sentCount = 0;
  let failedCount = 0;
  const failedTokens = [];

  for (const token of tokens) {
    const result = await sendNotification(token, title, body, data);
    if (result.success) { sentCount++; } else { failedCount++; failedTokens.push(token); }
  }

  return { sentCount, failedCount, failedTokens };
}

module.exports = { initializeFirebase, sendNotification, sendToMany };
