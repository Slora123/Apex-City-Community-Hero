'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'community_hero_dev_secret';

/**
 * Middleware: require a valid JWT in Authorization: Bearer <token>
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional auth — attaches userId if token present, but doesn't block if missing
 */
function optionalAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.userId = payload.userId;
      req.userEmail = payload.email;
    } catch (_) {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
}

/**
 * Sign a JWT for a user
 */
function signToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = { requireAuth, optionalAuth, signToken };
