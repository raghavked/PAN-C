const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db');

// Helper: detect if a string looks like a MongoDB ObjectId hex (24 hex chars)
function isObjectIdHex(str) {
  return typeof str === 'string' && /^[0-9a-f]{24}$/i.test(str);
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRETS || process.env.JWT_SECRET);

    // JWT payload can have different shapes depending on which code issued it:
    //   { email, userId: ObjectIdHex }  — new format (our fix)
    //   { userId: emailString }         — old format (login route stores email in userId)
    //   { userId: ObjectIdHex }         — legacy format
    const db = getDB();
    let query;

    if (decoded.email) {
      // Preferred: explicit email field
      query = { email: decoded.email };
    } else if (decoded.userId && !isObjectIdHex(decoded.userId)) {
      // userId is an email string (old login route format)
      query = { email: decoded.userId };
    } else if (decoded.userId && isObjectIdHex(decoded.userId)) {
      // userId is a real ObjectId hex
      try {
        query = { _id: new ObjectId(decoded.userId) };
      } catch {
        return res.status(401).json({ error: 'Token invalid or expired' });
      }
    } else {
      return res.status(401).json({ error: 'Token invalid or expired' });
    }

    const user = await db.collection('users').findOne(
      query,
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.userEmail = user.email;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token invalid or expired' });
    }
    if (err.message === 'Database not connected') {
      return res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
    }
    next(err);
  }
}

module.exports = { requireAuth };
