'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/init');
const { optionalAuth } = require('../middleware/auth');

/**
 * GET /api/leaderboard
 * Returns ranked users by XP
 * Query params:
 *   scope: area | city | state | national (default: national)
 *   area: filter by area name
 *   city: filter by city name
 *   limit: max results (default 50)
 *   userId: highlight a specific user's position
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const { scope = 'national', area, city, limit = 50 } = req.query;
    const maxLimit = Math.min(parseInt(limit) || 50, 200);

    let query = `
      SELECT id, name, city, area, avatar, level, xp, rank,
             total_reports, total_missions, total_verifications
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (scope === 'area' && area) {
      query += ' AND area = ?';
      params.push(area);
    } else if (scope === 'city' && city) {
      query += ' AND city = ?';
      params.push(city);
    } else if (scope === 'area' && req.userId) {
      // Use the logged-in user's area
      const user = db.prepare('SELECT area FROM users WHERE id = ?').get(req.userId);
      if (user && user.area) {
        query += ' AND area = ?';
        params.push(user.area);
      }
    } else if (scope === 'city' && req.userId) {
      // Use the logged-in user's city
      const user = db.prepare('SELECT city FROM users WHERE id = ?').get(req.userId);
      if (user && user.city) {
        query += ' AND city = ?';
        params.push(user.city);
      }
    }

    query += ' ORDER BY xp DESC, total_missions DESC LIMIT ?';
    params.push(maxLimit);

    const users = db.prepare(query).all(...params);

    // Add rank position
    const ranked = users.map((user, index) => ({
      position: index + 1,
      id: user.id,
      name: user.name,
      city: user.city,
      area: user.area,
      avatar: user.avatar,
      level: user.level,
      xp: user.xp,
      rank: user.rank,
      totalReports: user.total_reports,
      totalMissions: user.total_missions,
      totalVerifications: user.total_verifications,
      isCurrentUser: req.userId ? user.id === req.userId : false
    }));

    // Find current user's position if not in the top list
    let currentUserPosition = null;
    if (req.userId) {
      const inList = ranked.find(u => u.id === req.userId);
      if (!inList) {
        // Count how many users have more XP
        const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
        if (currentUser) {
          let countQuery = 'SELECT COUNT(*) + 1 as position FROM users WHERE xp > ? AND 1=1';
          const countParams = [currentUser.xp];

          if (scope === 'area' && currentUser.area) {
            countQuery += ' AND area = ?';
            countParams.push(currentUser.area);
          } else if (scope === 'city' && currentUser.city) {
            countQuery += ' AND city = ?';
            countParams.push(currentUser.city);
          }

          const posResult = db.prepare(countQuery).get(...countParams);
          currentUserPosition = {
            position: posResult ? posResult.position : null,
            ...currentUser,
            isCurrentUser: true
          };
        }
      }
    }

    res.json({
      scope,
      leaderboard: ranked,
      total: ranked.length,
      currentUserPosition // null if user is already in the list
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Could not fetch leaderboard' });
  }
});

module.exports = router;
