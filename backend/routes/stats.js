'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/init');

/**
 * GET /api/stats
 * Aggregate impact statistics for the Impact Dashboard and Authority Dashboard
 */
router.get('/', (req, res) => {
  try {
    // Total issues breakdown
    const totalIssues = db.prepare('SELECT COUNT(*) as c FROM issues').get();
    const resolvedIssues = db.prepare("SELECT COUNT(*) as c FROM issues WHERE status = 'resolved'").get();
    const pendingIssues = db.prepare("SELECT COUNT(*) as c FROM issues WHERE status = 'pending'").get();
    const activeIssues = db.prepare("SELECT COUNT(*) as c FROM issues WHERE status = 'active'").get();

    // Active heroes (users with at least 1 report or mission in last 30 days)
    const activeHeroes = db.prepare(`
      SELECT COUNT(DISTINCT u.id) as c
      FROM users u
      WHERE u.total_reports > 0 OR u.total_missions > 0
    `).get();

    // Category breakdown
    const byCategory = db.prepare(`
      SELECT type, COUNT(*) as total,
             SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
             SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM issues
      GROUP BY type
    `).all();

    // Severity breakdown
    const bySeverity = db.prepare(`
      SELECT severity, COUNT(*) as count
      FROM issues
      GROUP BY severity
      ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
    `).all();

    // Monthly trend (last 6 months)
    const monthlyTrend = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as reported,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM issues
      WHERE created_at >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `).all();

    // Top contributors
    const topContributors = db.prepare(`
      SELECT id, name, city, area, avatar, level, xp, rank,
             total_reports, total_missions, total_verifications
      FROM users
      ORDER BY xp DESC
      LIMIT 10
    `).all();

    // XP distributed total
    const totalXpDistributed = db.prepare('SELECT SUM(amount) as total FROM xp_transactions').get();

    // Total verifications
    const totalVerifications = db.prepare('SELECT COUNT(*) as c FROM verifications').get();

    // Cities active (from users who have reported)
    const citiesActive = db.prepare(
      "SELECT COUNT(DISTINCT city) as c FROM users WHERE city IS NOT NULL AND city != ''"
    ).get();

    // Issues by specific type for Impact Dashboard
    const wasteResolved = db.prepare("SELECT COUNT(*) as c FROM issues WHERE type = 'waste' AND status = 'resolved'").get();
    const waterResolved = db.prepare("SELECT COUNT(*) as c FROM issues WHERE type = 'water_leak' AND status = 'resolved'").get();
    const potholeReported = db.prepare("SELECT COUNT(*) as c FROM issues WHERE type = 'cracked_road'").get();
    const lightsRestored = db.prepare("SELECT COUNT(*) as c FROM issues WHERE type = 'broken_light' AND status = 'resolved'").get();
    const infraResolved = db.prepare("SELECT COUNT(*) as c FROM issues WHERE type = 'infrastructure' AND status = 'resolved'").get();

    // Recent activity (last 10 resolved issues)
    const recentActivity = db.prepare(`
      SELECT i.id, i.title, i.type, i.category, i.severity, i.status,
             i.address, i.resolved_at, u.name as reporter_name
      FROM issues i
      LEFT JOIN users u ON i.reporter_id = u.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `).all();

    // Daily reports grouped by day of week (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6)
    const dailyCounts = Array(7).fill(0);
    const dailyStats = db.prepare(`
      SELECT 
        CAST(strftime('%w', created_at) AS INTEGER) as day,
        COUNT(*) as count
      FROM issues
      GROUP BY day
    `).all();
    dailyStats.forEach(row => {
      let idx = row.day === 0 ? 6 : row.day - 1;
      if (idx >= 0 && idx < 7) {
        dailyCounts[idx] = row.count;
      }
    });

    res.json({
      overview: {
        totalIssues: totalIssues ? totalIssues.c : 0,
        resolvedIssues: resolvedIssues ? resolvedIssues.c : 0,
        pendingIssues: pendingIssues ? pendingIssues.c : 0,
        activeIssues: activeIssues ? activeIssues.c : 0,
        activeHeroes: activeHeroes ? activeHeroes.c : 0,
        totalVerifications: totalVerifications ? totalVerifications.c : 0,
        totalXpDistributed: totalXpDistributed ? (totalXpDistributed.total || 0) : 0,
        citiesActive: citiesActive ? citiesActive.c : 0,
        resolutionRate: totalIssues && totalIssues.c > 0
          ? Math.round((resolvedIssues.c / totalIssues.c) * 100)
          : 0
      },
      impact: {
        wasteRemoved: wasteResolved ? wasteResolved.c : 0,
        waterLeakagesFixed: waterResolved ? waterResolved.c : 0,
        potholesReported: potholeReported ? potholeReported.c : 0,
        streetlightsRestored: lightsRestored ? lightsRestored.c : 0,
        infrastructureResolved: infraResolved ? infraResolved.c : 0
      },
      byCategory,
      bySeverity,
      monthlyTrend,
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
