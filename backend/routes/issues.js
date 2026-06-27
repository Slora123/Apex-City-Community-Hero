'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
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
router.get('/', optionalAuth, (req, res) => {
  try {
    const { status, type, lat, lng, radius = 5000 } = req.query;

    let query = `
      SELECT i.*, u.name as reporter_name, u.avatar as reporter_avatar,
             (SELECT COUNT(*) FROM reports r WHERE r.issue_id = i.id) as report_count
      FROM issues i
      LEFT JOIN users u ON i.reporter_id = u.id
    `;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('i.status = ?');
      params.push(status);
    }
    if (type) {
      conditions.push('i.type = ?');
      params.push(type);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY i.created_at DESC';

    let issues = db.prepare(query).all(...params);

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
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const issue = db.prepare(`
      SELECT i.*, u.name as reporter_name, u.city as reporter_city,
             (SELECT COUNT(*) FROM reports r WHERE r.issue_id = i.id) as report_count,
             (SELECT COUNT(*) FROM verifications v WHERE v.issue_id = i.id) as verification_count
      FROM issues i
      LEFT JOIN users u ON i.reporter_id = u.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Get all reporters (FIFO order)
    const reporters = db.prepare(`
      SELECT r.report_order, r.points_awarded, r.created_at,
             u.name, u.avatar, u.level
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE r.issue_id = ?
      ORDER BY r.report_order ASC
    `).all(req.params.id);

    // Get related mission
    const mission = db.prepare(`
      SELECT m.*, u.name as assignee_name
      FROM missions m
      LEFT JOIN users u ON m.assignee_id = u.id
      WHERE m.issue_id = ?
      LIMIT 1
    `).get(req.params.id);

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
        category
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
      const existingIssue = findNearbyDuplicateIssue(lat, lng, effectiveType, 0.2);

      let issueId;
      let reportOrder;
      let isNew = false;

      if (existingIssue) {
        // Add as co-reporter to existing issue
        issueId = existingIssue.id;
        const existingReportCount = db.prepare('SELECT COUNT(*) as c FROM reports WHERE issue_id = ?').get(issueId);
        reportOrder = (existingReportCount ? existingReportCount.c : 0) + 1;

        // Update reporter count on issue
        db.prepare('UPDATE issues SET reporter_count = reporter_count + 1 WHERE id = ?').run(issueId);

        // Confidence threshold logic: AI confidence increases with multiple reports
        if (existingIssue.status === 'pending' && reportOrder >= 2) {
          db.prepare("UPDATE issues SET status = 'active' WHERE id = ?").run(issueId);
        }
      } else {
        // Create new issue
        issueId = uuidv4();
        isNew = true;
        reportOrder = 1;

        db.prepare(`
          INSERT INTO issues (id, title, type, category, severity, priority, lat, lng, address, status, reporter_id, reporter_count, photo_path, description, ai_analysis)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 1, ?, ?, ?)
        `).run(
          issueId,
          title,
          effectiveType,
          effectiveCategory,
          effectiveSeverity,
          effectivePriority,
          lat ? parseFloat(lat) : 0,
          lng ? parseFloat(lng) : 0,
          address,
          req.userId,
          photoPath,
          description,
          JSON.stringify(aiAnalysis)
        );

        // Create a mission for this issue
        const missionId = uuidv4();
        db.prepare(`
          INSERT INTO missions (id, issue_id, status) VALUES (?, ?, 'available')
        `).run(missionId, issueId);
      }

      // Record the FIFO report entry
      const reportId = uuidv4();
      const reportPoints = calculateReportReward(reportOrder, effectiveSeverity);

      try {
        db.prepare(`
          INSERT INTO reports (id, issue_id, reporter_id, report_order, points_awarded)
          VALUES (?, ?, ?, ?, ?)
        `).run(reportId, issueId, req.userId, reportOrder, reportPoints);
      } catch (dupErr) {
        // User already reported this issue — still give them partial points but don't duplicate
        console.warn('User already reported this issue');
      }

      // Award XP to reporter
      const xpResult = awardXP(db, req.userId, reportPoints, `Reported ${effectiveCategory}`, issueId);

      // Update user stats
      db.prepare('UPDATE users SET total_reports = total_reports + 1 WHERE id = ?').run(req.userId);

      // Get the created/updated issue
      const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);

      // Notify nearby users via Socket.io
      const reporter = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
      notifications.notifyNewIssue(issue, reporter);

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
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'active', 'resolved', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Use: ${validStatuses.join(', ')}` });
    }

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
    db.prepare(`
      UPDATE issues SET status = ?, resolved_at = ? WHERE id = ?
    `).run(status, resolvedAt, req.params.id);

    if (status === 'resolved') {
      const resolver = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
      notifications.notifyIssueResolved(issue, resolver);
    }

    res.json({ success: true, status });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Could not update status' });
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function findNearbyDuplicateIssue(lat, lng, type, radiusKm) {
  if (!lat || !lng) return null;
  const issues = db.prepare(`
    SELECT * FROM issues
    WHERE type = ? AND status NOT IN ('resolved', 'closed')
    AND lat IS NOT NULL AND lng IS NOT NULL
  `).all(type);

  for (const issue of issues) {
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
