'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/init');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { analyseImage } = require('../services/aiAnalysis');
const { calculateReportReward, awardXP } = require('../services/rewards');
const notifications = require('../services/notifications');

/**
 * GET /api/issues
 * List all issues, optionally filter by status, type, lat/lng/radius
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, type, lat, lng, radius = 5000 } = req.query;

    let userCity = null;
    if (req.userId) {
      const userRes = await db.query('SELECT city FROM users WHERE id = $1', [req.userId]);
      if (userRes.rows.length > 0) {
        userCity = userRes.rows[0].city;
      }
    }

    let query = `
      SELECT i.*, u.name as reporter_name, u.avatar as reporter_avatar, u.city as reporter_city,
             (SELECT COUNT(*) FROM reports r WHERE r.issue_id = i.id) as report_count
      FROM issues i
      LEFT JOIN users u ON i.reporter_id = u.id
    `;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`i.status = $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`i.type = $${params.length}`);
    }
    if (userCity) {
      params.push(userCity);
      conditions.push(`(u.city = $${params.length} OR i.address ILIKE '%' || $${params.length} || '%')`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY i.created_at DESC';

    const issuesRes = await db.query(query, params);
    let issues = issuesRes.rows;

    // Client-side distance filter if lat/lng provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius) / 1000;

      issues = issues.filter(issue => {
        if (!issue.lat || !issue.lng) return true;
        const dist = haversineDistance(userLat, userLng, issue.lat, issue.lng);
        return dist <= radiusKm;
      });
    }

    const enriched = issues.map(issue => ({
      ...issue,
      aiAnalysis: issue.ai_analysis ? JSON.parse(issue.ai_analysis) : {},
      photoUrl: issue.photo_path ? `/uploads/${issue.photo_path}` : null,
      resolutionPhotoUrl: issue.resolution_photo ? `/uploads/${issue.resolution_photo}` : null
    }));

    res.json({ issues: enriched, total: enriched.length });
  } catch (err) {
    console.error('Get issues error:', err);
    res.status(500).json({ error: 'Could not fetch issues' });
  }
});

/**
 * GET /api/issues/:id
 * Single issue with full details
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const issueRes = await db.query(`
      SELECT i.*, u.name as reporter_name, u.city as reporter_city,
             (SELECT COUNT(*) FROM reports r WHERE r.issue_id = i.id) as report_count,
             (SELECT COUNT(*) FROM verifications v WHERE v.issue_id = i.id) as verification_count
      FROM issues i
      LEFT JOIN users u ON i.reporter_id = u.id
      WHERE i.id = $1
    `, [req.params.id]);
    
    const issue = issueRes.rows[0];

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Get all reporters (FIFO order)
    const reportersRes = await db.query(`
      SELECT r.report_order, r.points_awarded, r.created_at,
             u.name, u.avatar, u.level
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE r.issue_id = $1
      ORDER BY r.report_order ASC
    `, [req.params.id]);
    const reporters = reportersRes.rows;

    // Get related mission
    const missionRes = await db.query(`
      SELECT m.*, u.name as assignee_name
      FROM missions m
      LEFT JOIN users u ON m.assignee_id = u.id
      WHERE m.issue_id = $1
      LIMIT 1
    `, [req.params.id]);
    const mission = missionRes.rows[0];

    res.json({
      ...issue,
      aiAnalysis: issue.ai_analysis ? JSON.parse(issue.ai_analysis) : {},
      photoUrl: issue.photo_path ? `/uploads/${issue.photo_path}` : null,
      resolutionPhotoUrl: issue.resolution_photo ? `/uploads/${issue.resolution_photo}` : null,
      reporters,
      mission: mission || null
    });
  } catch (err) {
    console.error('Get issue error:', err);
    res.status(500).json({ error: 'Could not fetch issue' });
  }
});

/**
 * POST /api/issues
 * Submit a new issue report with optional photo
 * Handles FIFO logic — if same location/type already exists, adds as co-reporter
 */
router.post('/', requireAuth, (req, res) => {
  req.uploadSubDir = 'issues';
  upload.single('photo')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }

    try {
      const {
        title,
        type = 'other',
        lat,
        lng,
        address = '',
        description = '',
        severity,
        category,
        testing
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Run AI analysis if photo uploaded
      let aiAnalysis = {};
      let photoPath = '';
      if (req.file) {
        photoPath = `issues/${req.file.filename}`;
        try {
          aiAnalysis = await analyseImage(req.file.path);
          if (aiAnalysis.isValid === false) {
             // Delete the uploaded file if it's invalid
             fs.unlink(req.file.path, () => {});
             return res.status(400).json({ error: 'Image does not appear to contain a valid civic issue. Please upload a clear photo of the problem.' });
          }
        } catch (err) {
          console.warn('AI analysis failed:', err.message);
        }
      }

      // Determine effective severity and type from AI or user input
      const effectiveSeverity = (aiAnalysis.severity || severity || 'medium').toLowerCase();
      const effectiveType = aiAnalysis.category || type;
      const effectiveCategory = aiAnalysis.type || category || type;
      const effectivePriority = aiAnalysis.priority || 'Moderate';

      // Check if a very similar issue exists nearby (within ~200m) to merge
      const existingIssue = await findNearbyDuplicateIssue(lat, lng, effectiveType, 0.2);

      let issueId;
      let reportOrder;
      let isNew = false;

      if (existingIssue) {
        // Add as co-reporter to existing issue
        issueId = existingIssue.id;
        
        // Prevent the exact same user from reporting the same issue twice
        const dupCheck = await db.query('SELECT 1 FROM reports WHERE issue_id = $1 AND reporter_id = $2', [issueId, req.userId]);
        if (dupCheck.rows.length > 0) {
          return res.status(409).json({ error: 'You have already reported this anomaly at this location.' });
        }

        const countRes = await db.query('SELECT COUNT(*) as c FROM reports WHERE issue_id = $1', [issueId]);
        const existingReportCount = parseInt(countRes.rows[0].c, 10);
        reportOrder = existingReportCount + 1;

        // Update reporter count on issue
        await db.query('UPDATE issues SET reporter_count = reporter_count + 1 WHERE id = $1', [issueId]);

        // Confidence threshold logic: AI confidence increases with multiple reports
        const requiredReports = testing === 'true' ? 1 : 3;
        if (existingIssue.status === 'pending' && reportOrder >= requiredReports) {
          await db.query("UPDATE issues SET status = 'active' WHERE id = $1", [issueId]);
          await db.query("UPDATE missions SET status = 'Active' WHERE issue_id = $1", [issueId]);
        }
      } else {
        // Create new issue
        issueId = uuidv4();
        isNew = true;
        reportOrder = 1;
        const initialStatus = testing === 'true' ? 'active' : 'pending';

        await db.query(`
          INSERT INTO issues (id, title, type, category, severity, priority, lat, lng, address, status, reporter_id, reporter_count, photo_path, description, ai_analysis)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, $12, $13, $14)
        `, [
          issueId,
          title,
          effectiveType,
          effectiveCategory,
          effectiveSeverity,
          effectivePriority,
          lat ? parseFloat(lat) : 0,
          lng ? parseFloat(lng) : 0,
          address,
          initialStatus,
          req.userId,
          photoPath,
          description,
          JSON.stringify(aiAnalysis)
        ]);

        // Create a mission for this issue
        const missionId = uuidv4();
        const initialMissionStatus = testing === 'true' ? 'Active' : 'Pending Verification';
        await db.query(`
          INSERT INTO missions (id, issue_id, status) VALUES ($1, $2, $3)
        `, [missionId, issueId, initialMissionStatus]);
      }

      // Record the FIFO report entry
      const reportId = uuidv4();
      const reportPoints = calculateReportReward(reportOrder, effectiveSeverity);

      try {
        await db.query(`
          INSERT INTO reports (id, issue_id, reporter_id, report_order, points_awarded)
          VALUES ($1, $2, $3, $4, $5)
        `, [reportId, issueId, req.userId, reportOrder, reportPoints]);
      } catch (dupErr) {
        // User already reported this issue — still give them partial points but don't duplicate
        console.warn('User already reported this issue');
      }

      // Award XP to reporter
      const xpResult = await awardXP(db, req.userId, reportPoints, `Reported ${effectiveCategory}`, issueId);

      // Update user stats
      await db.query('UPDATE users SET total_reports = total_reports + 1 WHERE id = $1', [req.userId]);

      // Get the created/updated issue
      const issueRes = await db.query('SELECT * FROM issues WHERE id = $1', [issueId]);
      const issue = issueRes.rows[0];

      // Notify nearby users via Socket.io
      const reporterRes = await db.query('SELECT * FROM users WHERE id = $1', [req.userId]);
      const reporter = reporterRes.rows[0];
      
      if (isNew && issue.status === 'pending') {
        notifications.notifyConfirmIssue(issue);
      } else {
        notifications.notifyNewIssue(issue, reporter);
      }

      res.status(isNew ? 201 : 200).json({
        success: true,
        isNew,
        issue: {
          ...issue,
          aiAnalysis,
          photoUrl: photoPath ? `/uploads/${photoPath}` : null
        },
        reportOrder,
        pointsAwarded: reportPoints,
        userXP: xpResult,
        newBadges: xpResult.newBadges || []
      });
    } catch (err) {
      console.error('Create issue error:', err);
      res.status(500).json({ error: 'Could not create issue: ' + err.message });
    }
  });
});

/**
 * PATCH /api/issues/:id/status
 * Update issue status (for authority dashboard)
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'active', 'resolved', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Use: ${validStatuses.join(', ')}` });
    }

    const issueRes = await db.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    const issue = issueRes.rows[0];
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
    await db.query(`
      UPDATE issues SET status = $1, resolved_at = $2 WHERE id = $3
    `, [status, resolvedAt, req.params.id]);

    if (status === 'resolved') {
      const resolverRes = await db.query('SELECT * FROM users WHERE id = $1', [req.userId]);
      const resolver = resolverRes.rows[0];
      notifications.notifyIssueResolved(issue, resolver);
    }

    res.json({ success: true, status });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Could not update status' });
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findNearbyDuplicateIssue(lat, lng, type, radiusKm) {
  if (!lat || !lng) return null;
  const issuesRes = await db.query(`
    SELECT * FROM issues
    WHERE type = $1 AND status NOT IN ('resolved', 'closed')
    AND lat IS NOT NULL AND lng IS NOT NULL
  `, [type]);

  for (const issue of issuesRes.rows) {
    const dist = haversineDistance(parseFloat(lat), parseFloat(lng), issue.lat, issue.lng);
    if (dist <= radiusKm) {
      return issue;
    }
  }
  return null;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;
