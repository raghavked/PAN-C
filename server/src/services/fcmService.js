const admin = require('firebase-admin');

let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized || admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.warn('⚠️  Firebase credentials missing — FCM push notifications disabled');
    return;
  }

  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: projectId,
      private_key: privateKey.replace(/\\n/g, '\n'),
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
    console.warn('⚠️  Firebase init failed — FCM disabled:', err.message);
  }
}

/**
 * Send a push notification to a single FCM token.
 */
async function sendNotification(token, title, body, data = {}) {
  initializeFirebase();
  try {
    await admin.messaging().send({
      notification: { title, body },
      data,
      token,
    });
    return { success: true };
  } catch (err) {
    console.error(`❌ FCM send failed for token ${token.substring(0, 20)}...:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send a push notification to multiple FCM tokens.
 * Returns { sentCount, failedCount, failedTokens }.
 */
async function sendToMany(tokens, title, body, data = {}) {
  initializeFirebase();

  if (!tokens || tokens.length === 0) {
    return { sentCount: 0, failedCount: 0, failedTokens: [] };
  }

  let sentCount = 0;
  let failedCount = 0;
  const failedTokens = [];

  for (const token of tokens) {
    const result = await sendNotification(token, title, body, data);
    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
      failedTokens.push(token);
    }
  }

  return { sentCount, failedCount, failedTokens };
}

module.exports = { initializeFirebase, sendNotification, sendToMany };
