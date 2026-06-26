'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/init');
const { requireAuth, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/users/:id
 * Get a user's public profile and stats
 */
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Recent activity
    const recentReports = db.prepare(`
      SELECT i.id, i.title, i.type, i.category, i.severity, i.status, r.points_awarded, r.created_at
      FROM reports r
      JOIN issues i ON r.issue_id = i.id
      WHERE r.reporter_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5
    `).all(req.params.id);

    const recentMissions = db.prepare(`
      SELECT m.id, m.status, m.completed_at, i.title, i.type, i.severity
      FROM missions m
      JOIN issues i ON m.issue_id = i.id
      WHERE m.assignee_id = ?
      ORDER BY m.created_at DESC
      LIMIT 5
    `).all(req.params.id);

    const achievements = db.prepare(`
      SELECT badge_type, badge_name, badge_description, earned_at
      FROM achievements
      WHERE user_id = ?
      ORDER BY earned_at DESC
    `).all(req.params.id);

    // Area rank (position among users in same area)
    const areaRank = db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM users
      WHERE area = ? AND xp > ? AND id != ?
    `).get(user.area, user.xp, user.id);

    // City rank
    const cityRank = db.prepare(`
      SELECT COUNT(*) + 1 as rank FROM users
      WHERE city = ? AND xp > ? AND id != ?
    `).get(user.city, user.xp, user.id);

    res.json({
      id: user.id,
      name: user.name,
      email: req.userId === user.id ? user.email : undefined, // only show email to self
      city: user.city,
      area: user.area,
      avatar: user.avatar,
      level: user.level,
      xp: user.xp,
      rank: user.rank,
      totalReports: user.total_reports,
      totalMissions: user.total_missions,
      totalVerifications: user.total_verifications,
      areaRank: areaRank ? areaRank.rank : 1,
      cityRank: cityRank ? cityRank.rank : 1,
      recentReports,
      recentMissions,
      achievements,
      joinedAt: user.created_at
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Could not fetch user' });
  }
});

/**
 * PATCH /api/users/:id
 * Update user profile (name, city, area, avatar)
 */
router.patch('/:id', requireAuth, (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ error: 'Can only update your own profile' });
    }

    const { name, city, area, avatar } = req.body;
    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name.trim()); }
    if (city) { updates.push('city = ?'); params.push(city.trim()); }
    if (area) { updates.push('area = ?'); params.push(area.trim()); }
    if (avatar) { updates.push('avatar = ?'); params.push(avatar); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.json({
      id: user.id,
      name: user.name,
      city: user.city,
      area: user.area,
      avatar: user.avatar,
      level: user.level,
      xp: user.xp,
      rank: user.rank
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

module.exports = router;
