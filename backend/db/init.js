'use strict';

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './db/community_hero.db';

// Ensure the db directory exists
const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.resolve(DB_PATH));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Migration: add password column to users if it doesn't exist
try {
  db.prepare("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''").run();
} catch (e) {
  // Column already exists, ignore
}

// Seed some demo issues if the DB is empty (disabled for production)
// const issueCount = db.prepare('SELECT COUNT(*) as c FROM issues').get();
// if (issueCount.c === 0) {
//   seedDemoData(db);
// }

function seedDemoData(db) {
  const { v4: uuidv4 } = require ? (() => { try { return require('uuid'); } catch { return { v4: () => Math.random().toString(36).substr(2, 9) }; } })() : { v4: () => Math.random().toString(36).substr(2, 9) };

  // Create a demo authority user
  const authorityId = 'demo-authority-001';
  const heroId = 'demo-hero-001';

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, city, area, avatar, level, xp, rank, total_reports, total_missions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(authorityId, 'City Authority', 'authority@cityhero.ai', 'Demo City', 'Central', 'male', 5, 2450, 'City Guardian', 8, 3);
  insertUser.run(heroId, 'Demo Hero', 'hero@cityhero.ai', 'Demo City', 'North District', 'female', 3, 850, 'Rising Hero', 5, 2);

  const demoIssues = [
    {
      id: 'issue-001',
      title: 'Large Pothole on Main Street',
      type: 'cracked_road',
      category: 'Pothole',
      severity: 'high',
      priority: 'critical',
      lat: 28.6139,
      lng: 77.2090,
      address: 'Main Street, Central District',
      status: 'pending',
      reporter_id: heroId,
      reporter_count: 3,
      description: 'A large pothole spanning the entire left lane. Causing traffic disruption.',
      ai_analysis: JSON.stringify({ type: 'Pothole', severity: 'High', urgency: 'Critical', impact: 'Heavy Traffic Area', priority: 'Critical', estimatedSize: '2m diameter' })
    },
    {
      id: 'issue-002',
      title: 'Water Pipe Burst Near Park',
      type: 'water_leak',
      category: 'Water Leakage',
      severity: 'high',
      priority: 'urgent',
      lat: 28.6200,
      lng: 77.2150,
      address: 'Park Avenue, Green Zone',
      status: 'active',
      reporter_id: heroId,
      reporter_count: 2,
      description: 'Water leaking from a main supply pipe near the public park.',
      ai_analysis: JSON.stringify({ type: 'Water Leakage', severity: 'High', urgency: 'Urgent', impact: 'Residential Area + Park', priority: 'Urgent', estimatedSize: 'Major pipe burst' })
    },
    {
      id: 'issue-003',
      title: 'Broken Streetlight on Elm Road',
      type: 'broken_light',
      category: 'Damaged Streetlight',
      severity: 'medium',
      priority: 'moderate',
      lat: 28.6089,
      lng: 77.2050,
      address: 'Elm Road, South District',
      status: 'pending',
      reporter_id: authorityId,
      reporter_count: 1,
      description: 'Streetlight out of order creating safety hazard at night.',
      ai_analysis: JSON.stringify({ type: 'Broken Streetlight', severity: 'Medium', urgency: 'Moderate', impact: 'Night Safety Risk', priority: 'Moderate', estimatedSize: '1 light unit' })
    },
    {
      id: 'issue-004',
      title: 'Illegal Garbage Dump on Bridge Road',
      type: 'waste',
      category: 'Waste Management',
      severity: 'medium',
      priority: 'moderate',
      lat: 28.6250,
      lng: 77.2200,
      address: 'Bridge Road, East Side',
      status: 'resolved',
      reporter_id: heroId,
      reporter_count: 5,
      description: 'Large amount of illegal dumping blocking the footpath.',
      ai_analysis: JSON.stringify({ type: 'Waste Dump', severity: 'Medium', urgency: 'Moderate', impact: 'Public Footpath Blocked', priority: 'Moderate', estimatedSize: 'Large pile ~5m²' })
    },
    {
      id: 'issue-005',
      title: 'Damaged Footbridge Railing',
      type: 'infrastructure',
      category: 'Infrastructure Damage',
      severity: 'high',
      priority: 'urgent',
      lat: 28.6175,
      lng: 77.2100,
      address: 'River Bridge, West End',
      status: 'pending',
      reporter_id: heroId,
      reporter_count: 2,
      description: 'Railing on the pedestrian footbridge is broken and poses safety risk.',
      ai_analysis: JSON.stringify({ type: 'Infrastructure Damage', severity: 'High', urgency: 'Urgent', impact: 'Public Safety Risk', priority: 'Urgent', estimatedSize: '3m of railing' })
    }
  ];

  const insertIssue = db.prepare(`
    INSERT OR IGNORE INTO issues (id, title, type, category, severity, priority, lat, lng, address, status, reporter_id, reporter_count, description, ai_analysis)
    VALUES (@id, @title, @type, @category, @severity, @priority, @lat, @lng, @address, @status, @reporter_id, @reporter_count, @description, @ai_analysis)
  `);

  const insertMission = db.prepare(`
    INSERT OR IGNORE INTO missions (id, issue_id, status)
    VALUES (?, ?, ?)
  `);

  demoIssues.forEach(issue => {
    insertIssue.run(issue);
    if (issue.status !== 'resolved') {
      insertMission.run(`mission-${issue.id}`, issue.id, 'available');
    }
  });

  console.log('✅ Demo data seeded successfully');
}

module.exports = db;
