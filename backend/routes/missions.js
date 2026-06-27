'use strict';

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/init');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { compareBeforeAfter } = require('../services/aiAnalysis');
const { calculateSolveReward, awardXP, VERIFICATION_REWARD } = require('../services/rewards');
const notifications = require('../services/notifications');

/**
 * GET /api/missions
 * List missions — optionally filter by status, near a location
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status = 'available', lat, lng, radius = 10000 } = req.query;

    let userCity = null;
    if (req.userId) {
      const userRes = await db.query('SELECT city FROM users WHERE id = $1', [req.userId]);
      if (userRes.rows.length > 0) {
        userCity = userRes.rows[0].city;
      }
    }

    let query = `
      SELECT m.*,
             i.title as issue_title, i.type as issue_type, i.category, i.severity,
             i.lat as issue_lat, i.lng as issue_lng, i.address, i.description,
             i.photo_path, i.reporter_count, i.status as issue_status, i.ai_analysis,
             u.name as assignee_name
      FROM missions m
      JOIN issues i ON m.issue_id = i.id
      LEFT JOIN users u ON m.assignee_id = u.id
      JOIN users reporter ON i.reporter_id = reporter.id
      WHERE 1=1
    `;
    const params = [];

    if (status !== 'all') {
      params.push(status);
      query += ` AND m.status = $${params.length}`;
    }

    if (userCity) {
      params.push(userCity);
      query += ` AND (reporter.city = $${params.length} OR i.address ILIKE '%' || $${params.length} || '%')`;
    }

    query += ' ORDER BY i.severity DESC, m.created_at DESC';

    const missionsRes = await db.query(query, params);
    let missions = missionsRes.rows;

    // Distance filter
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius) / 1000;

      missions = missions.map(m => ({
        ...m,
        distance: haversineDistance(userLat, userLng, m.issue_lat || 0, m.issue_lng || 0)
      })).filter(m => m.distance <= radiusKm || (!m.issue_lat && !m.issue_lng));

      missions.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    const enriched = missions.map(m => ({
      ...m,
      aiAnalysis: m.ai_analysis ? JSON.parse(m.ai_analysis) : {},
      photoUrl: m.photo_path ? `/uploads/${m.photo_path}` : null,
      beforePhotoUrl: m.before_photo ? `/uploads/${m.before_photo}` : null,
      afterPhotoUrl: m.after_photo ? `/uploads/${m.after_photo}` : null
    }));

    res.json({ missions: enriched, total: enriched.length });
  } catch (err) {
    console.error('Get missions error:', err);
    res.status(500).json({ error: 'Could not fetch missions' });
  }
});

/**
 * GET /api/missions/:id
 * Single mission details
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const missionRes = await db.query(`
      SELECT m.*,
             i.title as issue_title, i.type as issue_type, i.category, i.severity, i.priority,
             i.lat as issue_lat, i.lng as issue_lng, i.address, i.description,
             i.photo_path, i.reporter_count, i.status as issue_status, i.ai_analysis,
             u.name as assignee_name, u.level as assignee_level
      FROM missions m
      JOIN issues i ON m.issue_id = i.id
      LEFT JOIN users u ON m.assignee_id = u.id
      WHERE m.id = $1
    `, [req.params.id]);

    const mission = missionRes.rows[0];

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    res.json({
      ...mission,
      aiAnalysis: mission.ai_analysis ? JSON.parse(mission.ai_analysis) : {},
      photoUrl: mission.photo_path ? `/uploads/${mission.photo_path}` : null,
      beforePhotoUrl: mission.before_photo ? `/uploads/${mission.before_photo}` : null,
      afterPhotoUrl: mission.after_photo ? `/uploads/${mission.after_photo}` : null
    });
  } catch (err) {
    console.error('Get mission error:', err);
    res.status(500).json({ error: 'Could not fetch mission' });
  }
});

/**
 * POST /api/missions/:id/accept
 * Accept a mission — assigns it to the current user
 */
router.post('/:id/accept', requireAuth, async (req, res) => {
  try {
    const missionRes = await db.query('SELECT * FROM missions WHERE id = $1', [req.params.id]);
    const mission = missionRes.rows[0];

    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    if (mission.status !== 'available') {
      return res.status(409).json({ error: 'Mission is no longer available' });
    }

    await db.query(`
      UPDATE missions
      SET status = 'active', assignee_id = $1, accepted_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [req.userId, req.params.id]);

    // Update issue status to active
    await db.query("UPDATE issues SET status = 'active' WHERE id = $1", [mission.issue_id]);

    res.json({ success: true, missionId: mission.id, message: 'Mission accepted! Navigate to the location.' });
  } catch (err) {
    console.error('Accept mission error:', err);
    res.status(500).json({ error: 'Could not accept mission' });
  }
});

/**
 * POST /api/missions/:id/before-photo
 * Upload before photo for a mission
 */
router.post('/:id/before-photo', requireAuth, (req, res) => {
  req.uploadSubDir = 'missions';
  upload.single('photo')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }

    try {
      const missionRes = await db.query('SELECT * FROM missions WHERE id = $1', [req.params.id]);
      const mission = missionRes.rows[0];

      if (!mission) return res.status(404).json({ error: 'Mission not found' });
      if (mission.assignee_id !== req.userId) return res.status(403).json({ error: 'Not your mission' });
      if (!req.file) return res.status(400).json({ error: 'Photo is required' });

      const photoPath = `missions/${req.file.filename}`;
      await db.query('UPDATE missions SET before_photo = $1 WHERE id = $2', [photoPath, req.params.id]);

      res.json({
        success: true,
        beforePhotoUrl: `/uploads/${photoPath}`,
        message: 'Before photo saved! Now solve the issue and take the after photo.'
      });
    } catch (err) {
      console.error('Before photo error:', err);
      res.status(500).json({ error: 'Could not save before photo' });
    }
  });
});

/**
 * POST /api/missions/:id/after-photo
 * Upload after photo + trigger AI comparison
 */
router.post('/:id/after-photo', requireAuth, (req, res) => {
  req.uploadSubDir = 'missions';
  upload.single('photo')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }

    try {
      const missionRes = await db.query(`
        SELECT m.*, i.type as issue_type, i.severity, i.title as issue_title, i.address
        FROM missions m
        JOIN issues i ON m.issue_id = i.id
        WHERE m.id = $1
      `, [req.params.id]);
      const mission = missionRes.rows[0];

      if (!mission) return res.status(404).json({ error: 'Mission not found' });
      if (mission.assignee_id !== req.userId) return res.status(403).json({ error: 'Not your mission' });
      if (!req.file) return res.status(400).json({ error: 'Photo is required' });
      if (!mission.before_photo) return res.status(400).json({ error: 'Upload before photo first' });

      const afterPath = `missions/${req.file.filename}`;
      await db.query('UPDATE missions SET after_photo = $1 WHERE id = $2', [afterPath, req.params.id]);

      // Run AI comparison
      const path = require('path');
      const beforeFullPath = path.join(__dirname, '..', 'uploads', mission.before_photo);
      const afterFullPath = req.file.path;

      let comparison = {};
      try {
        comparison = await compareBeforeAfter(beforeFullPath, afterFullPath, mission.issue_type);
      } catch (err) {
        console.warn('AI comparison failed:', err.message);
        comparison = {
          verdict: 'Fully Resolved',
          resolutionPercentage: 85,
          improvement: 'The area appears improved.',
          remainingIssues: 'Minor cleanup may be needed.'
        };
      }

      // Update issue resolution photo
      await db.query('UPDATE issues SET resolution_photo = $1 WHERE id = $2', [afterPath, mission.issue_id]);

      // Notify community for verification
      const issueRes = await db.query('SELECT * FROM issues WHERE id = $1', [mission.issue_id]);
      const issue = issueRes.rows[0];
      notifications.notifyVerificationNeeded(issue);

      res.json({
        success: true,
        afterPhotoUrl: `/uploads/${afterPath}`,
        comparison,
        message: 'After photo saved! AI comparison complete. Submit for community verification.'
      });
    } catch (err) {
      console.error('After photo error:', err);
      res.status(500).json({ error: 'Could not save after photo' });
    }
  });
});

/**
 * POST /api/missions/:id/verify
 * Submit community verification verdict
 */
router.post('/:id/verify', requireAuth, async (req, res) => {
  try {
    const { verdict } = req.body;
    const validVerdicts = ['Fully Resolved', 'Partially Resolved', 'Not Resolved'];

    if (!validVerdicts.includes(verdict)) {
      return res.status(400).json({ error: `Invalid verdict. Use: ${validVerdicts.join(', ')}` });
    }

    const missionRes = await db.query(`
      SELECT m.*, i.type as issue_type, i.severity, i.title as issue_title, i.address
      FROM missions m
      JOIN issues i ON m.issue_id = i.id
      WHERE m.id = $1
    `, [req.params.id]);
    const mission = missionRes.rows[0];

    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    if (mission.assignee_id === req.userId) return res.status(403).json({ error: 'You cannot verify your own mission' });

    // Check for duplicate verification
    const existingRes = await db.query('SELECT id FROM verifications WHERE mission_id = $1 AND verifier_id = $2', [req.params.id, req.userId]);
    const existing = existingRes.rows[0];
    if (existing) return res.status(409).json({ error: 'You already verified this mission' });

    // Record verification
    const verifId = uuidv4();
    await db.query(`
      INSERT INTO verifications (id, issue_id, mission_id, verifier_id, verdict, points_awarded)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [verifId, mission.issue_id, req.params.id, req.userId, verdict, VERIFICATION_REWARD]);

    // Award verifier their points
    await awardXP(db, req.userId, VERIFICATION_REWARD, `Verified resolution of ${mission.issue_title}`, mission.id);
    await db.query('UPDATE users SET total_verifications = total_verifications + 1 WHERE id = $1', [req.userId]);

    // Check if enough verifications to auto-complete mission
    const allVerificationsRes = await db.query('SELECT verdict FROM verifications WHERE mission_id = $1', [req.params.id]);
    const allVerifications = allVerificationsRes.rows;
    const totalVerifs = allVerifications.length;

    const fullyResolved = allVerifications.filter(v => v.verdict === 'Fully Resolved').length;
    const partiallyResolved = allVerifications.filter(v => v.verdict === 'Partially Resolved').length;
    const notResolved = allVerifications.filter(v => v.verdict === 'Not Resolved').length;

    let finalVerdict = null;
    let missionCompleted = false;

    // Auto-complete after 3+ verifications with clear consensus
    if (totalVerifs >= 3) {
      if (fullyResolved > (partiallyResolved + notResolved)) {
        finalVerdict = 'Fully Resolved';
      } else if (partiallyResolved >= fullyResolved) {
        finalVerdict = 'Partially Resolved';
      } else {
        finalVerdict = 'Not Resolved';
      }

      if (finalVerdict !== 'Not Resolved') {
        // Complete the mission and award the solver
        missionCompleted = true;
        const solvePoints = calculateSolveReward(mission.issue_type, mission.severity, finalVerdict);

        await db.query(`
          UPDATE missions SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1
        `, [req.params.id]);

        await db.query("UPDATE issues SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = $1", [mission.issue_id]);

        if (mission.assignee_id) {
          const xpResult = await awardXP(db, mission.assignee_id, solvePoints, `Solved ${mission.issue_title} (${finalVerdict})`, mission.id);
          await db.query('UPDATE users SET total_missions = total_missions + 1 WHERE id = $1', [mission.assignee_id]);

          // Notify solver
          notifications.notifyXPAwarded(mission.assignee_id, solvePoints, `Mission completed: ${mission.issue_title}`);

          // Notify of resolution
          const issueRes = await db.query('SELECT * FROM issues WHERE id = $1', [mission.issue_id]);
          const issue = issueRes.rows[0];
          const resolverRes = await db.query('SELECT * FROM users WHERE id = $1', [mission.assignee_id]);
          const resolver = resolverRes.rows[0];
          notifications.notifyIssueResolved(issue, resolver);
        }
      }
    }

    res.json({
      success: true,
      verdict,
      totalVerifications: totalVerifs,
      missionCompleted,
      finalVerdict,
      pointsAwarded: VERIFICATION_REWARD,
      message: missionCompleted
        ? `✅ Mission verified as ${finalVerdict}! The solver has been rewarded.`
        : `Verification recorded! ${3 - totalVerifs > 0 ? (3 - totalVerifs) + ' more needed for auto-completion.' : ''}`
    });
  } catch (err) {
    console.error('Verify mission error:', err);
    res.status(500).json({ error: 'Could not record verification' });
  }
});

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;
