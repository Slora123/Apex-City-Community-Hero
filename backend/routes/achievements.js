'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/init');
const { requireAuth, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/achievements/:userId
 * Get all earned achievements for a user
 */
router.get('/:userId', optionalAuth, async (req, res) => {
  try {
    const achievementsRes = await db.query(`
      SELECT badge_type, badge_name, badge_description, earned_at
      FROM achievements
      WHERE user_id = $1
      ORDER BY earned_at DESC
    `, [req.params.userId]);
    const achievements = achievementsRes.rows;

    // All possible badges (for "locked" display on frontend)
    const allBadges = [
      { type: 'first_report', name: '🏅 First Report', description: 'Filed your first civic report!' },
      { type: 'first_mission', name: '🏅 First Resolution', description: 'Completed your first mission!' },
      { type: 'first_verification', name: '🏅 First Verification', description: 'Verified your first resolution!' },
      { type: 'waste_warrior', name: '🏅 Waste Warrior', description: 'Resolved 3 waste management issues!' },
      { type: 'road_guardian', name: '🏅 Road Guardian', description: 'Resolved 3 road / pothole issues!' },
      { type: 'water_protector', name: '🏅 Water Protector', description: 'Resolved 3 water leakage issues!' },
      { type: 'light_saver', name: '🏅 Light Saver', description: 'Restored 3 broken streetlights!' },
      { type: 'infrastructure_hero', name: '🏅 Infrastructure Hero', description: 'Resolved 3 infrastructure issues!' },
      { type: 'community_champion', name: '🏅 Community Champion', description: 'Reached Level 5!' }
    ];

    const earnedTypes = new Set(achievements.map(a => a.badge_type));
    const fullList = allBadges.map(badge => ({
      ...badge,
      earned: earnedTypes.has(badge.type),
      earnedAt: achievements.find(a => a.badge_type === badge.type)?.earned_at || null
    }));

    res.json({
      userId: req.params.userId,
      earned: achievements.length,
      total: allBadges.length,
      badges: fullList
    });
  } catch (err) {
    console.error('Get achievements error:', err);
    res.status(500).json({ error: 'Could not fetch achievements' });
  }
});

module.exports = router;
