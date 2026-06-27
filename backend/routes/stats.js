'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/init');

/**
 * GET /api/stats
 * Aggregate impact statistics for the Impact Dashboard and Authority Dashboard
 */
router.get('/', async (req, res) => {
  try {
    // Total issues breakdown
    const totalIssuesRes = await db.query('SELECT COUNT(*) as c FROM issues');
    const totalIssues = totalIssuesRes.rows[0];
    
    const resolvedIssuesRes = await db.query("SELECT COUNT(*) as c FROM issues WHERE status = 'resolved'");
    const resolvedIssues = resolvedIssuesRes.rows[0];
    
    const pendingIssuesRes = await db.query("SELECT COUNT(*) as c FROM issues WHERE status = 'pending'");
    const pendingIssues = pendingIssuesRes.rows[0];
    
    const activeIssuesRes = await db.query("SELECT COUNT(*) as c FROM issues WHERE status = 'active'");
    const activeIssues = activeIssuesRes.rows[0];

    // Active heroes (users with at least 1 report or mission in last 30 days)
    const activeHeroesRes = await db.query(`
      SELECT COUNT(DISTINCT u.id) as c
      FROM users u
      WHERE u.total_reports > 0 OR u.total_missions > 0
    `);
    const activeHeroes = activeHeroesRes.rows[0];

    // Category breakdown
    const byCategoryRes = await db.query(`
      SELECT type, COUNT(*) as total,
             SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
             SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM issues
      GROUP BY type
    `);
    const byCategory = byCategoryRes.rows;

    // Severity breakdown
    const bySeverityRes = await db.query(`
      SELECT severity, COUNT(*) as count
      FROM issues
      GROUP BY severity
      ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
    `);
    const bySeverity = bySeverityRes.rows;

    // Monthly trend (last 6 months)
    const monthlyTrendRes = await db.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as reported,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM issues
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `);
    const monthlyTrend = monthlyTrendRes.rows;

    // Top contributors
    const topContributorsRes = await db.query(`
      SELECT id, name, city, area, avatar, level, xp, rank,
             total_reports, total_missions, total_verifications
      FROM users
      ORDER BY xp DESC
      LIMIT 10
    `);
    const topContributors = topContributorsRes.rows;

    // XP distributed total
    const totalXpDistributedRes = await db.query('SELECT SUM(amount) as total FROM xp_transactions');
    const totalXpDistributed = totalXpDistributedRes.rows[0];

    // Total verifications
    const totalVerificationsRes = await db.query('SELECT COUNT(*) as c FROM verifications');
    const totalVerifications = totalVerificationsRes.rows[0];

    // Cities active (from users who have reported)
    const citiesActiveRes = await db.query(
      "SELECT COUNT(DISTINCT city) as c FROM users WHERE city IS NOT NULL AND city != ''"
    );
    const citiesActive = citiesActiveRes.rows[0];

    // Issues by specific type for Impact Dashboard
    const wasteResolvedRes = await db.query("SELECT COUNT(*) as c FROM issues WHERE type = 'waste' AND status = 'resolved'");
    const wasteResolved = wasteResolvedRes.rows[0];
    const waterResolvedRes = await db.query("SELECT COUNT(*) as c FROM issues WHERE type = 'water_leak' AND status = 'resolved'");
    const waterResolved = waterResolvedRes.rows[0];
    const potholeReportedRes = await db.query("SELECT COUNT(*) as c FROM issues WHERE type = 'cracked_road'");
    const potholeReported = potholeReportedRes.rows[0];
    const lightsRestoredRes = await db.query("SELECT COUNT(*) as c FROM issues WHERE type = 'broken_light' AND status = 'resolved'");
    const lightsRestored = lightsRestoredRes.rows[0];
    const infraResolvedRes = await db.query("SELECT COUNT(*) as c FROM issues WHERE type = 'infrastructure' AND status = 'resolved'");
    const infraResolved = infraResolvedRes.rows[0];

    // Recent activity (last 10 resolved issues)
    const recentActivityRes = await db.query(`
      SELECT i.id, i.title, i.type, i.category, i.severity, i.status,
             i.address, i.resolved_at, u.name as reporter_name
      FROM issues i
      LEFT JOIN users u ON i.reporter_id = u.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);
    const recentActivity = recentActivityRes.rows;

    // Daily reports grouped by day of week (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6)
    const dailyCounts = Array(7).fill(0);
    const dailyStatsRes = await db.query(`
      SELECT 
        EXTRACT(DOW FROM created_at) as day,
        COUNT(*) as count
      FROM issues
      GROUP BY day
    `);
    const dailyStats = dailyStatsRes.rows;
    
    dailyStats.forEach(row => {
      // PostgreSQL EXTRACT(DOW) returns 0 for Sunday, 1 for Monday, etc.
      // SQLite strftime('%w') also returns 0 for Sunday.
      // The original code did: `let idx = row.day === 0 ? 6 : row.day - 1;`
      let dayInt = parseInt(row.day, 10);
      let idx = dayInt === 0 ? 6 : dayInt - 1;
      if (idx >= 0 && idx < 7) {
        dailyCounts[idx] = parseInt(row.count, 10);
      }
    });

    res.json({
      overview: {
        totalIssues: totalIssues ? parseInt(totalIssues.c, 10) : 0,
        resolvedIssues: resolvedIssues ? parseInt(resolvedIssues.c, 10) : 0,
        pendingIssues: pendingIssues ? parseInt(pendingIssues.c, 10) : 0,
        activeIssues: activeIssues ? parseInt(activeIssues.c, 10) : 0,
        activeHeroes: activeHeroes ? parseInt(activeHeroes.c, 10) : 0,
        totalVerifications: totalVerifications ? parseInt(totalVerifications.c, 10) : 0,
        totalXpDistributed: totalXpDistributed ? parseInt(totalXpDistributed.total || 0, 10) : 0,
        citiesActive: citiesActive ? parseInt(citiesActive.c, 10) : 0,
        resolutionRate: totalIssues && parseInt(totalIssues.c, 10) > 0
          ? Math.round((parseInt(resolvedIssues.c, 10) / parseInt(totalIssues.c, 10)) * 100)
          : 0
      },
      impact: {
        wasteRemoved: wasteResolved ? parseInt(wasteResolved.c, 10) : 0,
        waterLeakagesFixed: waterResolved ? parseInt(waterResolved.c, 10) : 0,
        potholesReported: potholeReported ? parseInt(potholeReported.c, 10) : 0,
        streetlightsRestored: lightsRestored ? parseInt(lightsRestored.c, 10) : 0,
        infrastructureResolved: infraResolved ? parseInt(infraResolved.c, 10) : 0
      },
      byCategory: byCategory.map(c => ({
        type: c.type,
        total: parseInt(c.total, 10),
        resolved: parseInt(c.resolved, 10),
        pending: parseInt(c.pending, 10)
      })),
      bySeverity: bySeverity.map(s => ({
        severity: s.severity,
        count: parseInt(s.count, 10)
      })),
      monthlyTrend: monthlyTrend.map(m => ({
        month: m.month,
        reported: parseInt(m.reported, 10),
        resolved: parseInt(m.resolved, 10)
      })),
      dailyReports: dailyCounts,
      topContributors: topContributors.map((u, i) => ({
        position: i + 1,
        id: u.id,
        name: u.name,
        city: u.city,
        avatar: u.avatar,
        level: u.level,
        xp: u.xp,
        rank: u.rank,
        totalReports: u.total_reports,
        totalMissions: u.total_missions
      })),
      recentActivity
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Could not fetch statistics' });
  }
});

module.exports = router;
