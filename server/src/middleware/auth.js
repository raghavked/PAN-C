const jwt = require('jsonwebtoken');
const { getDB } = require('../db');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify token is still valid in DB
    const db = getDB();
    const user = await db.collection('users').findOne(
      { email: decoded.userId },
      { projection: { password: 0 } }
    );

    if (!user || user.authToken !== token) {
      return res.status(401).json({ error: 'Token invalid or expired' });
    }

    req.user = user;
    req.userEmail = user.email;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token invalid or expired' });
    }
    next(err);
  }
}

module.exports = { requireAuth };
