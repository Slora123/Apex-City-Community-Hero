'use strict';

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/init');
const { signToken } = require('../middleware/auth');
const { awardXP, calculateLevel, getRankTitle } = require('../services/rewards');

/**
 * POST /api/auth/login
 * Mock login — accepts name, email, city, area, avatar
 * Creates the user if they don't exist, returns JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { name, email, password = '', city = '', area = '', avatar = 'male', loginMethod = 'email' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailLower = email.toLowerCase().trim();
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [emailLower]);
    let user = userRes.rows[0];

    if (loginMethod === 'google') {
      // Google Login — Passwordless
      if (!user) {
        // Create new user for Google
        const id = uuidv4();
        await db.query(`
          INSERT INTO users (id, name, email, city, area, avatar, level, xp, rank, password)
          VALUES ($1, $2, $3, $4, $5, $6, 1, 0, 'Novice Hero', '')
        `, [id, name ? name.trim() : 'Google Hero', emailLower, city.trim(), area.trim(), avatar]);

        const newUserRes = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        user = newUserRes.rows[0];
      } else {
        // Existing user — update profile (preserve custom name and avatar)
        await db.query(`
          UPDATE users SET name = $1, city = $2, area = $3, avatar = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [user.name || (name ? name.trim() : 'Google Hero'), city.trim() || user.city, area.trim() || user.area, user.avatar || (avatar || 'male'), user.id]);

        const updatedUserRes = await db.query('SELECT * FROM users WHERE id = $1', [user.id]);
        user = updatedUserRes.rows[0];
      }
    } else {
      // Email Login
      if (!user) {
        // Sign Up (new user)
        if (!name) {
          return res.status(400).json({ error: 'Name is required to register a new account' });
        }
        if (!password) {
          return res.status(400).json({ error: 'Password is required to register' });
        }

        const id = uuidv4();
        await db.query(`
          INSERT INTO users (id, name, email, password, city, area, avatar, level, xp, rank)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0, 'Novice Hero')
        `, [id, name.trim(), emailLower, password, city.trim(), area.trim(), avatar]);

        const newUserRes = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        user = newUserRes.rows[0];
      } else {
        // Sign In (existing user) — verify password
        if (user.password && password !== user.password) {
          return res.status(401).json({ error: 'Incorrect password for this email account' });
        }

        // Set password if user was previously registered via Google
        if (!user.password && password) {
          await db.query('UPDATE users SET password = $1 WHERE id = $2', [password, user.id]);
        }

        // Update profile (preserve custom name and avatar)
        await db.query(`
          UPDATE users SET name = $1, city = $2, area = $3, avatar = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [user.name || (name ? name.trim() : 'Hero'), city.trim() || user.city, area.trim() || user.area, user.avatar || (avatar || 'male'), user.id]);

        const updatedUserRes = await db.query('SELECT * FROM users WHERE id = $1', [user.id]);
        user = updatedUserRes.rows[0];
      }
    }

    const token = signToken(user.id, user.email);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        area: user.area,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        rank: user.rank,
        totalReports: user.total_reports,
        totalMissions: user.total_missions,
        totalVerifications: user.total_verifications
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Returns the current user's profile (requires auth)
 */
router.get('/me', require('../middleware/auth').requireAuth, async (req, res) => {
  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent XP transactions
    const recentXPRes = await db.query(`
      SELECT amount, reason, created_at
      FROM xp_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [req.userId]);
    const recentXP = recentXPRes.rows;

    // Get achievement count
    const countRes = await db.query('SELECT COUNT(*) as c FROM achievements WHERE user_id = $1', [req.userId]);
    const achievementCount = parseInt(countRes.rows[0].c, 10);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city,
      area: user.area,
      avatar: user.avatar,
      level: user.level,
      xp: user.xp,
      rank: user.rank,
      totalReports: user.total_reports,
      totalMissions: user.total_missions,
      totalVerifications: user.total_verifications,
      achievementCount: achievementCount || 0,
      recentXP
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Could not fetch user profile' });
  }
});

module.exports = router;
