const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/contacts
router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const contacts = await db.collection('contacts')
      .find({ userEmail: req.userEmail })
      .sort({ isPrimary: -1, createdAt: 1 })
      .toArray();
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, phone, email, relationship, notifyVia, canSeeDocuments, canSeeLocation, isPrimary } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const db = getDB();

    // If setting as primary, unset others
    if (isPrimary) {
      await db.collection('contacts').updateMany(
        { userEmail: req.userEmail, isPrimary: true },
        { $set: { isPrimary: false } }
      );
    }

    const contact = {
      userEmail: req.userEmail,
      name,
      phone: phone || '',
      email: email || '',
      relationship: relationship || 'Other',
      notifyVia: notifyVia || { sms: true, email: false, push: false },
      canSeeDocuments: canSeeDocuments !== undefined ? canSeeDocuments : true,
      canSeeLocation: canSeeLocation !== undefined ? canSeeLocation : true,
      isPrimary: isPrimary || false,
      createdAt: new Date(),
      lastNotified: null,
    };

    const result = await db.collection('contacts').insertOne(contact);

    // Update chatbot context
    await updateChatbotContactContext(db, req.userEmail);

    res.status(201).json({ contact: { ...contact, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contacts/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const { name, phone, email, relationship, notifyVia, canSeeDocuments, canSeeLocation, isPrimary } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (email !== undefined) update.email = email;
    if (relationship !== undefined) update.relationship = relationship;
    if (notifyVia !== undefined) update.notifyVia = notifyVia;
    if (canSeeDocuments !== undefined) update.canSeeDocuments = canSeeDocuments;
    if (canSeeLocation !== undefined) update.canSeeLocation = canSeeLocation;
    if (isPrimary !== undefined) {
      update.isPrimary = isPrimary;
      if (isPrimary) {
        await db.collection('contacts').updateMany(
          { userEmail: req.userEmail, isPrimary: true, _id: { $ne: new ObjectId(req.params.id) } },
          { $set: { isPrimary: false } }
        );
      }
    }

    const result = await db.collection('contacts').updateOne(
      { _id: new ObjectId(req.params.id), userEmail: req.userEmail },
      { $set: update }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Contact not found' });

    await updateChatbotContactContext(db, req.userEmail);
    res.json({ message: 'Contact updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('contacts').deleteOne(
      { _id: new ObjectId(req.params.id), userEmail: req.userEmail }
    );
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Contact not found' });

    await updateChatbotContactContext(db, req.userEmail);
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function updateChatbotContactContext(db, userEmail) {
  const contacts = await db.collection('contacts').find({ userEmail }).toArray();
  const names = contacts.map(c => `${c.name} (${c.relationship})`);
  await db.collection('chatbotConversations').updateOne(
    { userEmail },
    { $set: { 'context.emergencyContacts': names, updatedAt: new Date() } }
  );
}

module.exports = router;
