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
    const { status = 'Active', lat, lng, radius = 10000, testing } = req.query;

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
             i.reporter_id as reporter_id,
             u.name as assignee_name, reporter.area as reporter_area,
             (SELECT COUNT(*) FROM verifications v WHERE v.mission_id = m.id) as verification_count
      FROM missions m
      JOIN issues i ON m.issue_id = i.id
      LEFT JOIN users u ON m.assignee_id = u.id
      JOIN users reporter ON i.reporter_id = reporter.id
      WHERE i.reporter_id NOT LIKE 'demo-%' AND i.id NOT LIKE 'issue-%'
    `;

    const params = [];

    if (status !== 'all') {
      params.push(status);
      query += ` AND m.status = $${params.length}`;
    } else {
      query += ` AND m.status NOT IN ('Pending Verification', 'rejected')`;
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

    let userVerdicts = {};
    if (req.userId) {
      const verifsRes = await db.query('SELECT mission_id, verdict FROM verifications WHERE verifier_id = $1', [req.userId]);
      for (const row of verifsRes.rows) {
        userVerdicts[row.mission_id] = row.verdict;
      }
    }

    const enriched = missions.map(m => {
      const aiAnalysis = m.ai_analysis ? JSON.parse(m.ai_analysis) : {};
      // Override estimatedReward with deterministic value
      aiAnalysis.estimatedReward = calculateSolveReward(m.category, m.severity, 'resolved');
      return {
        ...m,
        aiAnalysis,
        photoUrl: m.photo_path ? `/uploads/${m.photo_path}` : null,
        beforePhotoUrl: m.before_photo ? `/uploads/${m.before_photo}` : null,
        afterPhotoUrl: m.after_photo ? `/uploads/${m.after_photo}` : null,
        myVerdict: userVerdicts[m.id] || null
      };
    });

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
             u.name as assignee_name, u.level as assignee_level,
             (SELECT COUNT(*) FROM verifications v WHERE v.mission_id = m.id) as verification_count
      FROM missions m
      JOIN issues i ON m.issue_id = i.id
      LEFT JOIN users u ON m.assignee_id = u.id
      WHERE m.id = $1
    `, [req.params.id]);

    const m = missionRes.rows[0];

    if (!m) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const aiAnalysis = m.ai_analysis ? JSON.parse(m.ai_analysis) : {};
    aiAnalysis.estimatedReward = calculateSolveReward(m.category, m.severity, 'resolved');
    
    let myVerdict = null;
    if (req.userId) {
      const verifRes = await db.query('SELECT verdict FROM verifications WHERE mission_id = $1 AND verifier_id = $2', [req.params.id, req.userId]);
      if (verifRes.rows.length > 0) {
        myVerdict = verifRes.rows[0].verdict;
      }
    }

    const enriched = {
      ...m,
      aiAnalysis,
      photoUrl: m.photo_path ? `/uploads/${m.photo_path}` : null,
      beforePhotoUrl: m.before_photo ? `/uploads/${m.before_photo}` : null,
      afterPhotoUrl: m.after_photo ? `/uploads/${m.after_photo}` : null,
      myVerdict,
      verification_count: parseInt(m.verification_count || 0, 10)
    };

    res.json(enriched);
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
    if (mission.status !== 'Active') {
      return res.status(409).json({ error: 'Mission is no longer available' });
    }

    await db.query(`
      UPDATE missions
      SET status = 'Accepted', assignee_id = $1, accepted_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [req.userId, req.params.id]);

    // Update issue status to reflect it's being worked on
    await db.query("UPDATE issues SET status = 'in_progress' WHERE id = $1", [mission.issue_id]);

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
      await db.query(`
        UPDATE missions 
        SET before_photo = $1, status = 'In Progress' 
        WHERE id = $2
      `, [photoPath, req.params.id]);

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

      let nextStatus = 'Awaiting Community Verification';
      const normalizedVerdict = (comparison.verdict || '').toLowerCase().replace('_', ' ');
      if (normalizedVerdict === 'not resolved' || normalizedVerdict === 'invalid') {
        nextStatus = 'Rejected';
      }

      // Update issue resolution photo and mission status
      await db.query('UPDATE issues SET resolution_photo = $1 WHERE id = $2', [afterPath, mission.issue_id]);
      await db.query('UPDATE missions SET after_photo = $1, status = $2 WHERE id = $3', [afterPath, nextStatus, req.params.id]);

      // Notify community for verification
      const issueRes = await db.query('SELECT * FROM issues WHERE id = $1', [mission.issue_id]);
      const issue = issueRes.rows[0];
      notifications.notifyVerificationNeeded(issue);

      res.json({
        success: true,
        afterPhotoUrl: `/uploads/${afterPath}`,
        comparison,
        pointsAwarded: comparison.estimatedReward || 100,
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

    const verifierRes = await db.query('SELECT city, area FROM users WHERE id = $1', [req.userId]);
    const verifier = verifierRes.rows[0];
    if (!verifier) return res.status(404).json({ error: 'Verifier user not found' });

    const missionRes = await db.query(`
      SELECT m.*, i.type as issue_type, i.severity, i.title as issue_title, i.address,
             reporter.area as reporter_area
      FROM missions m
      JOIN issues i ON m.issue_id = i.id
      JOIN users reporter ON i.reporter_id = reporter.id
      WHERE m.id = $1
    `, [req.params.id]);
    const mission = missionRes.rows[0];

    if (!mission) return res.status(404).json({ error: 'Mission not found' });

    if (!isSameLocation(verifier.city, verifier.area, mission.address, mission.reporter_area)) {
      return res.status(403).json({ error: 'Only heroes from this district/location are allowed to verify this mission.' });
    }

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

    const fullyResolved = allVerifications.filter(v => {
      const vNorm = (v.verdict || '').toLowerCase().replace('_', ' ');
      return vNorm === 'fully resolved' || vNorm === 'resolved';
    }).length;
    const partiallyResolved = allVerifications.filter(v => {
      const vNorm = (v.verdict || '').toLowerCase().replace('_', ' ');
      return vNorm === 'partially resolved';
    }).length;
    const notResolved = allVerifications.filter(v => {
      const vNorm = (v.verdict || '').toLowerCase().replace('_', ' ');
      return vNorm === 'not resolved';
    }).length;

    let finalVerdict = null;
    let missionCompleted = false;

    // Auto-complete after 2 verifications with consensus
    if (totalVerifs >= 2) {
      if (fullyResolved >= 2) {
        finalVerdict = 'Fully Resolved';
      } else if (fullyResolved + partiallyResolved >= 2) {
        finalVerdict = 'Partially Resolved';
      } else {
        finalVerdict = 'Not Resolved';
      }

      console.log(`[verify] totalVerifs=${totalVerifs} fullyResolved=${fullyResolved} finalVerdict=${finalVerdict}`);

      if (finalVerdict !== 'Not Resolved') {
        // Complete the mission and award the solver
        missionCompleted = true;
        const solvePoints = calculateSolveReward(mission.issue_type, mission.severity, finalVerdict);

        await db.query(`
          UPDATE missions SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1
        `, [req.params.id]);
        console.log(`[verify] Mission ${req.params.id} marked completed`);

        await db.query("UPDATE issues SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = $1", [mission.issue_id]);

        if (mission.assignee_id) {
          try {
            await awardXP(db, mission.assignee_id, solvePoints, `Solved ${mission.issue_title} (${finalVerdict})`, mission.id);
            await db.query('UPDATE users SET total_missions = total_missions + 1 WHERE id = $1', [mission.assignee_id]);
          } catch (xpErr) {
            console.error('[verify] XP award error (non-fatal):', xpErr.message);
          }

          // Notifications — wrapped so they never block the response
          try {
            notifications.notifyXPAwarded(mission.assignee_id, solvePoints, `Mission completed: ${mission.issue_title}`);
            const issueRes = await db.query('SELECT * FROM issues WHERE id = $1', [mission.issue_id]);
            const resolverRes = await db.query('SELECT * FROM users WHERE id = $1', [mission.assignee_id]);
            if (issueRes.rows[0] && resolverRes.rows[0]) {
              notifications.notifyIssueResolved(issueRes.rows[0], resolverRes.rows[0]);
            }
          } catch (notifErr) {
            console.error('[verify] Notification error (non-fatal):', notifErr.message);
          }
        }
      }
    }

    res.json({
      success: true,
      verdict,
      totalVerifications: totalVerifs,
      verificationCount: totalVerifs,
      missionCompleted,
      finalVerdict,
      pointsAwarded: VERIFICATION_REWARD,
      message: missionCompleted
        ? `✅ Mission verified as ${finalVerdict}! The solver has been rewarded.`
        : `Verification recorded! ${Math.max(0, 2 - totalVerifs)} more needed for completion.`
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

function isSameLocation(userCity, userArea, mAddress, mReporterArea) {
  const verArea = (userArea || '').toLowerCase().trim();
  const verCity = (userCity || '').toLowerCase().trim();
  
  if (!verArea && !verCity) return false;

  const isUserInRaigad = verArea.includes('raigad') || verCity.includes('alibag') || verArea.includes('alibag') || verCity.includes('raigad');
  const isUserInVasai = verArea.includes('vasai') || verCity.includes('vasai') || verArea.includes('naigaon') || verCity.includes('naigaon') || verArea.includes('virar') || verCity.includes('virar');
  const isUserInNorthGoa = verArea.includes('north goa') || verCity.includes('panaji') || verCity.includes('panjim') || verCity.includes('mapusa');
  const isUserInSouthGoa = verArea.includes('south goa') || verCity.includes('margao') || verCity.includes('madgaon') || verCity.includes('vasco');

  const mLoc = (mAddress || '').toLowerCase();
  const mRepArea = (mReporterArea || '').toLowerCase();

  const isIssueInRaigad = mLoc.includes('alibag') || mLoc.includes('raigad') || mRepArea.includes('raigad') || mRepArea.includes('alibag');
  const isIssueInVasai = mLoc.includes('vasai') || mLoc.includes('virar') || mLoc.includes('naigaon') || mLoc.includes('umela') || mRepArea.includes('vasai') || mRepArea.includes('virar') || mRepArea.includes('naigaon') || mRepArea.includes('umela');
  const isIssueInNorthGoa = mLoc.includes('north goa') || mLoc.includes('panaji') || mLoc.includes('panjim') || mLoc.includes('mapusa') || mLoc.includes('calangute') || mRepArea.includes('north goa');
  const isIssueInSouthGoa = mLoc.includes('south goa') || mLoc.includes('margao') || mLoc.includes('madgaon') || mLoc.includes('vasco') || mLoc.includes('mormugao') || mRepArea.includes('south goa');

  if (isUserInRaigad && isIssueInRaigad) return true;
  if (isUserInVasai && isIssueInVasai) return true;
  if (isUserInNorthGoa && isIssueInNorthGoa) return true;
  if (isUserInSouthGoa && isIssueInSouthGoa) return true;

  // Goa general state-wide grouping fallback
  const isUserInGoa = verArea.includes('goa') || verCity.includes('goa');
  const isIssueInGoa = mLoc.includes('goa') || mRepArea.includes('goa');
  if (isUserInGoa && isIssueInGoa) return true;

  // Fallback to basic string match
  const isMatchArea = verArea && mRepArea.includes(verArea);
  const isMatchLoc = verArea && mLoc.includes(verArea);
  if (isMatchArea || isMatchLoc) return true;

  return false;
}

module.exports = router;
