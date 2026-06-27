'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon
});

// Utility wrapper to match some of the old synchronous feel
const db = {
  query: (text, params) => pool.query(text, params),
  pool
};

async function initDB() {
  try {
    console.log('⏳ Connecting to PostgreSQL (Neon)...');
    
    // Run schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema to create tables
    await pool.query(schema);
    console.log('✅ Schema initialized');

    // Add password column to users if it doesn't exist (handled by CREATE TABLE IF NOT EXISTS now, but let's be safe)
    try {
      await pool.query("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''");
    } catch (e) {
      // Column already exists, ignore
    }

    // Check if we need to seed
    const res = await pool.query('SELECT COUNT(*) as c FROM issues');
    const issueCount = parseInt(res.rows[0].c, 10);
    
    if (issueCount === 0) {
      await seedDemoData();
    }
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

async function seedDemoData() {
  const { v4: uuidv4 } = require('uuid');

  // Create a demo authority user
  const authorityId = 'demo-authority-001';
  const heroId = 'demo-hero-001';

  const insertUser = `
    INSERT INTO users (id, name, email, city, area, avatar, level, xp, rank, total_reports, total_missions)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id) DO NOTHING
  `;

  await pool.query(insertUser, [authorityId, 'City Authority', 'authority@cityhero.ai', 'Demo City', 'Central', 'male', 5, 2450, 'City Guardian', 8, 3]);
  await pool.query(insertUser, [heroId, 'Demo Hero', 'hero@cityhero.ai', 'Demo City', 'North District', 'female', 3, 850, 'Rising Hero', 5, 2]);

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

  const insertIssue = `
    INSERT INTO issues (id, title, type, category, severity, priority, lat, lng, address, status, reporter_id, reporter_count, description, ai_analysis)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (id) DO NOTHING
  `;

  const insertMission = `
    INSERT INTO missions (id, issue_id, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING
  `;

  for (const issue of demoIssues) {
    await pool.query(insertIssue, [
      issue.id, issue.title, issue.type, issue.category, issue.severity, issue.priority,
      issue.lat, issue.lng, issue.address, issue.status, issue.reporter_id, issue.reporter_count,
      issue.description, issue.ai_analysis
    ]);
    if (issue.status !== 'resolved') {
      await pool.query(insertMission, [`mission-${issue.id}`, issue.id, 'available']);
    }
  }

  console.log('✅ Demo data seeded successfully');
}

// Initialize database connection
initDB();

module.exports = db;

