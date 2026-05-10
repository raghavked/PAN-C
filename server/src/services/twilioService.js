const twilio = require('twilio');

let client = null;
let smsDisabled = false;

function getClient() {
  if (smsDisabled) return null;
  if (client) return client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('⚠️  Twilio SMS not configured (missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER) — SMS disabled');
    smsDisabled = true;
    return null;
  }

  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio SMS client initialized');
    return client;
  } catch (err) {
    console.warn('⚠️  Twilio init failed:', err.message);
    smsDisabled = true;
    return null;
  }
}

async function sendSms(to, body) {
  const c = getClient();
  if (!c) return { success: false, error: 'SMS not configured' };

  const from = process.env.TWILIO_FROM_NUMBER;
  try {
    const msg = await c.messages.create({ to, from, body });
    return { success: true, sid: msg.sid };
  } catch (err) {
    console.error(`[Twilio] SMS to ${to} failed:`, err.message);
    return { success: false, error: err.message };
  }
}

async function sendPanicSms(contacts, userName, incidentId, locationText, helpLink) {
  const results = [];
  const phonable = contacts.filter(c => c.phone);

  if (!phonable.length) {
    console.log('[Twilio] No contacts with phone numbers — skipping SMS');
    return { smsSent: 0, smsFailed: 0, results };
  }

  const body =
    `🚨 PAN!C ALERT — ${userName} needs help!\n` +
    `Incident: ${incidentId}\n` +
    `Location: ${locationText}\n` +
    `Next steps: ${helpLink}\n` +
    `Reply SAFE if they are with you and okay.`;

  let smsSent = 0;
  let smsFailed = 0;

  for (const contact of phonable) {
    const result = await sendSms(contact.phone, body);
    results.push({ contactId: contact._id, name: contact.name, phone: contact.phone, ...result });
    if (result.success) { smsSent++; } else { smsFailed++; }
  }

  console.log(`[Twilio] SMS blast: ${smsSent} sent, ${smsFailed} failed out of ${phonable.length} contacts with phones`);
  return { smsSent, smsFailed, results };
}

async function sendDisarmSms(contacts, userName, incidentId) {
  const results = [];
  const phonable = contacts.filter(c => c.phone);
  if (!phonable.length) return { smsSent: 0, smsFailed: 0, results };

  const body =
    `✅ ALL CLEAR — ${userName} is safe.\n` +
    `Incident ${incidentId} has been resolved. No further action needed.`;

  let smsSent = 0;
  let smsFailed = 0;
  for (const contact of phonable) {
    const result = await sendSms(contact.phone, body);
    results.push({ contactId: contact._id, name: contact.name, phone: contact.phone, ...result });
    if (result.success) { smsSent++; } else { smsFailed++; }
  }

  console.log(`[Twilio] All-clear SMS: ${smsSent} sent, ${smsFailed} failed`);
  return { smsSent, smsFailed, results };
}

module.exports = { sendSms, sendPanicSms, sendDisarmSms };
