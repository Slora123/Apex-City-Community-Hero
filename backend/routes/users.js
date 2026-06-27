'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/init');
const { requireAuth, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/users/:id
 * Get a user's public profile and stats
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Recent activity
    const recentReportsRes = await db.query(`
      SELECT i.id, i.title, i.type, i.category, i.severity, i.status, r.points_awarded, r.created_at
      FROM reports r
      JOIN issues i ON r.issue_id = i.id
      WHERE r.reporter_id = $1
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [req.params.id]);
    const recentReports = recentReportsRes.rows;

    const recentMissionsRes = await db.query(`
      SELECT m.id, m.status, m.completed_at, i.title, i.type, i.severity
      FROM missions m
      JOIN issues i ON m.issue_id = i.id
      WHERE m.assignee_id = $1
      ORDER BY m.created_at DESC
      LIMIT 5
    `, [req.params.id]);
    const recentMissions = recentMissionsRes.rows;

    const achievementsRes = await db.query(`
      SELECT badge_type, badge_name, badge_description, earned_at
      FROM achievements
      WHERE user_id = $1
      ORDER BY earned_at DESC
    `, [req.params.id]);
    const achievements = achievementsRes.rows;

    // Area rank (position among users in same area)
    const areaRankRes = await db.query(`
      SELECT COUNT(*) + 1 as rank FROM users
      WHERE area = $1 AND xp > $2 AND id != $3
    `, [user.area, user.xp, user.id]);
    const areaRank = areaRankRes.rows[0];

    // City rank
    const cityRankRes = await db.query(`
      SELECT COUNT(*) + 1 as rank FROM users
      WHERE city = $1 AND xp > $2 AND id != $3
    `, [user.city, user.xp, user.id]);
    const cityRank = cityRankRes.rows[0];

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
      areaRank: areaRank ? parseInt(areaRank.rank, 10) : 1,
      cityRank: cityRank ? parseInt(cityRank.rank, 10) : 1,
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
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ error: 'Can only update your own profile' });
    }

    const { name, city, area, avatar } = req.body;
    const updates = [];
    const params = [];

    if (name) { params.push(name.trim()); updates.push(`name = $${params.length}`); }
    if (city) { params.push(city.trim()); updates.push(`city = $${params.length}`); }
    if (area) { params.push(area.trim()); updates.push(`area = $${params.length}`); }
    if (avatar) { params.push(avatar); updates.push(`avatar = $${params.length}`); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}`, params);

    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const user = userRes.rows[0];
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
