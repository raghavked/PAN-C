const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRETS || process.env.JWT_SECRET);

    // JWT payload contains { email, userId } — look up by email (most reliable)
    // Fall back to _id lookup if email is missing (legacy tokens)
    const db = getDB();
    let query;
    if (decoded.email) {
      query = { email: decoded.email };
    } else if (decoded.userId) {
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
