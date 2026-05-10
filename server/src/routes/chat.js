const express = require('express');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const BACKBOARD_KEY = process.env.VITE_BACKBOARD_API_KEY;
const BACKBOARD_ASSISTANT = process.env.VITE_BACKBOARD_ASSISTANT_ID;
const BACKBOARD_BASE = 'https://app.backboard.io/api';

async function searchMemories(query) {
  if (!BACKBOARD_KEY || !BACKBOARD_ASSISTANT) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BACKBOARD_BASE}/assistants/${BACKBOARD_ASSISTANT}/memories/search`, {
      method: 'POST',
      headers: { 'X-API-Key': BACKBOARD_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 5 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return data.memories ?? [];
  } catch { return []; }
}

function saveMemory(content, metadata) {
  if (!BACKBOARD_KEY || !BACKBOARD_ASSISTANT) return;
  fetch(`${BACKBOARD_BASE}/assistants/${BACKBOARD_ASSISTANT}/memories`, {
    method: 'POST',
    headers: { 'X-API-Key': BACKBOARD_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, metadata }),
  }).catch(() => {});
}

async function callGemini(messages, context, userMessage, memories = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return `I'm PAN!C, your emergency assistant. ${getDefaultRightsResponse(userMessage)}`;
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });

    const memoryBlock = memories.length > 0
      ? `\nLong-term memory (from past sessions):\n${memories.map(m => `- ${m.content}`).join('\n')}`
      : '';

    const systemPrompt = `You are PAN!C, an AI assistant for an emergency alert app used by immigrants and vulnerable communities facing ICE enforcement. Your role is to:
1. Explain legal rights clearly and calmly (right to remain silent, right to a lawyer, do not open the door without a warrant)
2. Help users understand their documents on file
3. Guide them through emergency procedures
4. Be supportive and non-judgmental

User context:
- Documents on file: ${context.documentsOnFile?.join(', ') || 'none'}
- Emergency contacts: ${context.emergencyContacts?.join(', ') || 'none'}
- Check-in status: ${context.checkInStatus || 'unknown'}
- Last panic event: ${context.lastPanicAt ? new Date(context.lastPanicAt).toLocaleDateString() : 'none'}${memoryBlock}

Always respond in the language the user writes in. Be concise and clear. In emergencies, prioritize actionable steps.`;

    const history = messages.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [{ role: 'user', parts: [{ text: systemPrompt }] }, { role: 'model', parts: [{ text: 'Understood. I am PAN!C, ready to help.' }] }, ...history],
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (err) {
    console.error('Gemini error:', err.message);
    return getDefaultRightsResponse(userMessage);
  }
}

function getDefaultRightsResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('right') || lower.includes('derecho')) {
    return 'Your rights: 1) You have the right to remain silent. 2) You have the right to a lawyer. 3) Do not open the door without a warrant. 4) Say "I do not consent to a search." 5) Do not sign anything without a lawyer.';
  }
  if (lower.includes('ice') || lower.includes('migra')) {
    return 'If ICE is at your door: Do not open it. Ask to see a warrant signed by a judge. You have the right to remain silent. Call your lawyer immediately. Trigger the PAN!C button to alert your contacts.';
  }
  return 'I am PAN!C, your emergency assistant. I can help you understand your legal rights, your documents, and emergency procedures. What do you need help with?';
}

// POST /api/chat/message
router.post('/message', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const db = getDB();

    // Get or create conversation
    let conversation = await db.collection('chatbotConversations').findOne({ userEmail: req.userEmail });
    if (!conversation) {
      await db.collection('chatbotConversations').insertOne({
        userEmail: req.userEmail,
        messages: [],
        context: { documentsOnFile: [], emergencyContacts: [], checkInStatus: 'active', lastPanicAt: null },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      conversation = { messages: [], context: {} };
    }

    const userMsg = { role: 'user', content: message, timestamp: new Date() };

    // Pull relevant long-term memories from Backboard, then call Gemini
    const memories = await searchMemories(message);
    const aiText = await callGemini(conversation.messages, conversation.context, message, memories);
    const assistantMsg = { role: 'assistant', content: aiText, timestamp: new Date() };

    // Persist this exchange as a memory for future sessions (non-blocking)
    saveMemory(
      `User asked: "${message}" | Assistant said: "${aiText.substring(0, 300)}"`,
      { source: 'chat', userEmail: req.userEmail }
    );

    // Save to MongoDB
    await db.collection('chatbotConversations').updateOne(
      { userEmail: req.userEmail },
      {
        $push: { messages: { $each: [userMsg, assistantMsg] } },
        $set: { updatedAt: new Date() },
      }
    );

    res.json({ message: assistantMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const conversation = await db.collection('chatbotConversations').findOne({ userEmail: req.userEmail });
    if (!conversation) return res.json({ messages: [] });

    const limit = parseInt(req.query.limit) || 50;
    const messages = conversation.messages.slice(-limit);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/history
router.delete('/history', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    await db.collection('chatbotConversations').updateOne(
      { userEmail: req.userEmail },
      { $set: { messages: [], updatedAt: new Date() } }
    );
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
