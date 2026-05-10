let Expo;
let expo;

function getExpoClient() {
  if (expo) return expo;
  try {
    const { Expo: ExpoSDK } = require('expo-server-sdk');
    Expo = ExpoSDK;
    expo = new ExpoSDK({
      accessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
    });
    console.log('✅ Expo Push SDK initialized');
    return expo;
  } catch (err) {
    console.warn('⚠️  expo-server-sdk not installed — Expo push disabled:', err.message);
    return null;
  }
}

async function sendExpoPushNotification(pushToken, title, body, data = {}) {
  const client = getExpoClient();
  if (!client) return { success: false, error: 'expo-server-sdk not available' };

  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`[Expo Push] Invalid token format: ${String(pushToken).slice(0, 30)}`);
    return { success: false, error: 'Invalid Expo push token' };
  }

  try {
    const chunks = client.chunkPushNotifications([{
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    }]);

    for (const chunk of chunks) {
      const tickets = await client.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error(`[Expo Push] Ticket error: ${ticket.message}`);
          return { success: false, error: ticket.message };
        }
        console.log(`[Expo Push] ✅ Sent ticket: ${ticket.id}`);
      }
    }
    return { success: true };
  } catch (err) {
    console.error('[Expo Push] Send failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendExpoPushNotifications(entries, title, body, data = {}) {
  const client = getExpoClient();
  const results = { sentCount: 0, failedCount: 0, failedTokens: [] };
  if (!client || !entries.length) return results;

  const validEntries = entries.filter(({ token }) => Expo.isExpoPushToken(token));

  const messages = validEntries.map(({ token }) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
  }));

  try {
    const chunks = client.chunkPushNotifications(messages);
    let idx = 0;
    for (const chunk of chunks) {
      const tickets = await client.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i++) {
        const token = validEntries[idx++]?.token;
        if (tickets[i].status === 'ok') {
          results.sentCount++;
        } else {
          results.failedCount++;
          if (token) results.failedTokens.push(token);
        }
      }
    }
  } catch (err) {
    console.error('[Expo Push] Bulk send failed:', err.message);
    results.failedCount = validEntries.length;
    results.failedTokens = validEntries.map(e => e.token);
  }

  return results;
}

module.exports = { sendExpoPushNotification, sendExpoPushNotifications };
