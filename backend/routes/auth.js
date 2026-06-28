'use strict';

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/init');
const { signToken } = require('../middleware/auth');
const { awardXP, calculateLevel, getRankTitle } = require('../services/rewards');

/**
 * POST /api/auth/login
 * Mock login — accepts name, email, city, area, avatar
 * Creates the user if they don't exist, returns JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { name, email, password = '', city = '', area = '', avatar = 'male', loginMethod = 'email' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailLower = email.toLowerCase().trim();
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [emailLower]);
    let user = userRes.rows[0];

    if (loginMethod === 'google') {
      // Google Login — Passwordless
      if (!user) {
        // DO NOT create new user immediately if they haven't provided city/area
        if (!city || !area) {
          return res.json({
            requiresRegistration: true,
            email: emailLower,
            name: name ? name.trim() : 'Google Hero'
          });
        }
        
        // Create new user for Google if city/area are provided
        const id = uuidv4();
        await db.query(`
          INSERT INTO users (id, name, email, city, area, avatar, level, xp, rank, password)
          VALUES ($1, $2, $3, $4, $5, $6, 1, 0, 'Novice Hero', '')
        `, [id, name ? name.trim() : 'Google Hero', emailLower, city.trim(), area.trim(), avatar]);

        const newUserRes = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        user = newUserRes.rows[0];
      } else {
        // Existing user — update profile (preserve custom name and avatar)
        await db.query(`
          UPDATE users SET name = $1, city = $2, area = $3, avatar = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [user.name || (name ? name.trim() : 'Google Hero'), city.trim() || user.city, area.trim() || user.area, user.avatar || (avatar || 'male'), user.id]);

        const updatedUserRes = await db.query('SELECT * FROM users WHERE id = $1', [user.id]);
        user = updatedUserRes.rows[0];
      }
    } else {
      // Email Login
      if (!user) {
        // Sign Up (new user)
        if (!name) {
          return res.status(400).json({ error: 'Name is required to register a new account' });
        }
        if (!password) {
          return res.status(400).json({ error: 'Password is required to register' });
        }

        const id = uuidv4();
        await db.query(`
          INSERT INTO users (id, name, email, password, city, area, avatar, level, xp, rank)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0, 'Novice Hero')
        `, [id, name.trim(), emailLower, password, city.trim(), area.trim(), avatar]);

        const newUserRes = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        user = newUserRes.rows[0];
      } else {
        // Sign In (existing user) — verify password
        if (user.password && password !== user.password) {
          return res.status(401).json({ error: 'Incorrect password for this email account' });
        }

        // Set password if user was previously registered via Google
        if (!user.password && password) {
          await db.query('UPDATE users SET password = $1 WHERE id = $2', [password, user.id]);
        }

        // Update profile (preserve custom name and avatar)
        await db.query(`
          UPDATE users SET name = $1, city = $2, area = $3, avatar = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [user.name || (name ? name.trim() : 'Hero'), city.trim() || user.city, area.trim() || user.area, user.avatar || (avatar || 'male'), user.id]);

        const updatedUserRes = await db.query('SELECT * FROM users WHERE id = $1', [user.id]);
        user = updatedUserRes.rows[0];
      }
    }

    const token = signToken(user.id, user.email);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        area: user.area,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        rank: user.rank,
        totalReports: user.total_reports,
        totalMissions: user.total_missions,
        totalVerifications: user.total_verifications
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Returns the current user's profile (requires auth)
 */
router.get('/me', require('../middleware/auth').requireAuth, async (req, res) => {
  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent XP transactions
    const recentXPRes = await db.query(`
      SELECT amount, reason, created_at
      FROM xp_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [req.userId]);
    const recentXP = recentXPRes.rows;

    // Get achievement count
    const countRes = await db.query('SELECT COUNT(*) as c FROM achievements WHERE user_id = $1', [req.userId]);
    const achievementCount = parseInt(countRes.rows[0].c, 10);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city,
      area: user.area,
      avatar: user.avatar,
      level: user.level,
      xp: user.xp,
      rank: user.rank,
      totalReports: user.total_reports,
      totalMissions: user.total_missions,
      totalVerifications: user.total_verifications,
      achievementCount: achievementCount || 0,
      recentXP
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Could not fetch user profile' });
  }
});

// ── Authority Dashboard Mock Endpoint ──────────────────────────────────────
router.post('/authority/unlock', (req, res) => {
  const { passcode } = req.body;
  const codeVasai = '1070';
  const codeVirar = '1072';
  const codeNalasopara = '1073';
  
  const locationData = {
    Vasai: {
      reports: [
        { title: 'Grant St Potholes', severity: 'Critical', confidence: 99, authority: 'Department of Transportation' },
        { title: 'Aqueduct Pipeline Burst', severity: 'High', confidence: 95, authority: 'Water & Sanitation Dept' },
        { title: 'Market Square Lighting', severity: 'Medium', confidence: 85, authority: 'Public Works' },
        { title: 'Watchtower Debris', severity: 'Medium', confidence: 88, authority: 'Waste Management' },
        { title: 'Merchant Road Sinkhole', severity: 'High', confidence: 92, authority: 'Department of Transportation' },
        { title: 'Vault Gate Malfunction', severity: 'Medium', confidence: 82, authority: 'Public Works' }
      ],
      scalarHotspot: { r: 4.5, c: 6.5 },
      senthianTop: [90, 105, 98, 112, 106, 128],
      senthianBottom: [62, 38, 42, 44, 58, 40],
      affiliateHotspot: { r: 3.5, c: 10 },
      contributorBars: [
        { label: 'Mon', val: 45 },
        { label: 'Tue', val: 75 },
        { label: 'Wed', val: 55 },
        { label: 'Thu', val: 90 },
        { label: 'Fri', val: 120 },
        { label: 'Sat', val: 140 }
      ]
    },
    Virar: {
      reports: [
        { title: 'Grant Highway Crack', severity: 'High', confidence: 94, authority: 'Department of Transportation' },
        { title: 'Roadway Drain Block', severity: 'Medium', confidence: 86, authority: 'Water & Sanitation Dept' },
        { title: 'Guest House Overflow', severity: 'High', confidence: 91, authority: 'Waste Management' },
        { title: 'Guard Post Power Loss', severity: 'Critical', confidence: 98, authority: 'Public Works' },
        { title: 'Market Waste Pile', severity: 'Medium', confidence: 89, authority: 'Waste Management' },
        { title: 'Chest Alley Flooding', severity: 'High', confidence: 93, authority: 'Water & Sanitation Dept' }
      ],
      scalarHotspot: { r: 2.5, c: 3.5 },
      senthianTop: [110, 85, 95, 80, 115, 90],
      senthianBottom: [45, 52, 30, 48, 35, 55],
      affiliateHotspot: { r: 2.5, c: 7 },
      contributorBars: [
        { label: 'Mon', val: 30 },
        { label: 'Tue', val: 50 },
        { label: 'Wed', val: 80 },
        { label: 'Thu', val: 65 },
        { label: 'Fri', val: 95 },
        { label: 'Sat', val: 110 }
      ]
    },
    Nalasopara: {
      reports: [
        { title: 'Grant Avenue Blockage', severity: 'Critical', confidence: 97, authority: 'Department of Transportation' },
        { title: 'Lantern Row Outage', severity: 'Medium', confidence: 84, authority: 'Public Works' },
        { title: 'Guest Lane Pothole', severity: 'High', confidence: 90, authority: 'Department of Transportation' },
        { title: 'Patrol Route Sinkhole', severity: 'High', confidence: 92, authority: 'Department of Transportation' },
        { title: 'Gate Perimeter Breach', severity: 'Medium', confidence: 81, authority: 'Public Works' },
        { title: 'Keep Wall Structural', severity: 'Critical', confidence: 96, authority: 'Public Infrastructure' }
      ],
      scalarHotspot: { r: 5.5, c: 7.5 },
      senthianTop: [80, 95, 120, 100, 125, 110],
      senthianBottom: [50, 40, 55, 30, 42, 48],
      affiliateHotspot: { r: 4.5, c: 13 },
      contributorBars: [
        { label: 'Mon', val: 60 },
        { label: 'Tue', val: 40 },
        { label: 'Wed', val: 70 },
        { label: 'Thu', val: 85 },
        { label: 'Fri', val: 130 },
        { label: 'Sat', val: 100 }
      ]
    }
  };
  
  const cleanInput = passcode ? passcode.toString().trim() : '';
  
  if (cleanInput === codeVasai) {
    return res.json({ success: true, location: 'Vasai', telemetry: locationData.Vasai });
  } else if (cleanInput === codeVirar) {
    return res.json({ success: true, location: 'Virar', telemetry: locationData.Virar });
  } else if (cleanInput === codeNalasopara) {
    return res.json({ success: true, location: 'Nalasopara', telemetry: locationData.Nalasopara });
  } else if (cleanInput.length > 2) {
    // Dynamic city generation for any other passcode!
    const dynamicTelemetry = {
      reports: [
        { title: `${cleanInput} Central Blockage`, severity: 'Critical', confidence: 96, authority: 'Department of Transportation' },
        { title: `${cleanInput} Plaza Lighting`, severity: 'Medium', confidence: 88, authority: 'Public Works' },
        { title: `${cleanInput} Water Main Leak`, severity: 'High', confidence: 92, authority: 'Water & Sanitation Dept' },
        { title: 'Local Park Debris', severity: 'Low', confidence: 75, authority: 'Waste Management' },
        { title: 'Subway Entrance Flooded', severity: 'High', confidence: 95, authority: 'Public Infrastructure' }
      ],
      scalarHotspot: { r: Math.floor(Math.random() * 8) + 1, c: Math.floor(Math.random() * 8) + 1 },
      senthianTop: Array.from({length: 6}, () => Math.floor(Math.random() * 60) + 80),
      senthianBottom: Array.from({length: 6}, () => Math.floor(Math.random() * 40) + 30),
      affiliateHotspot: { r: Math.floor(Math.random() * 6) + 2, c: Math.floor(Math.random() * 10) + 2 },
      contributorBars: [
        { label: 'Mon', val: Math.floor(Math.random() * 100) + 20 },
        { label: 'Tue', val: Math.floor(Math.random() * 100) + 20 },
        { label: 'Wed', val: Math.floor(Math.random() * 100) + 20 },
        { label: 'Thu', val: Math.floor(Math.random() * 100) + 20 },
        { label: 'Fri', val: Math.floor(Math.random() * 100) + 20 },
        { label: 'Sat', val: Math.floor(Math.random() * 100) + 20 }
      ]
    };
    // Capitalize the first letter for display
    const formattedLocation = cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1);
    return res.json({ success: true, location: formattedLocation, telemetry: dynamicTelemetry });
  } else {
    return res.status(401).json({ success: false, error: 'The gatekeeper frowns. That passcode is unrecognized in our archives.' });
  }
});

module.exports = router;
