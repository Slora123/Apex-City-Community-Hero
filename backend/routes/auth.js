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

// ── Authority Dashboard Dynamic Endpoint ──────────────────────────────────────
router.post('/authority/unlock', async (req, res) => {
  try {
    const { email, passcode } = req.body;
    const cleanInput = passcode ? passcode.toString().trim() : '';
    const cleanEmail = email ? email.toString().trim().toLowerCase() : '';
    
    if (cleanInput.length === 0 || cleanEmail.length === 0) {
      return res.status(401).json({ success: false, error: 'Email and Passcode are required.' });
    }

    let codeRes;
    if (cleanEmail === 'test@gmail.com') {
      // Hackathon Bypass: 'test@gmail.com' can access any city if they have a valid code
      codeRes = await db.query('SELECT city FROM authority_codes WHERE passcode = $1', [cleanInput]);
    } else {
      // Strict Check: Email and Passcode must match exactly
      codeRes = await db.query('SELECT city FROM authority_codes WHERE passcode = $1 AND email = $2', [cleanInput, cleanEmail]);
    }
    
    if (codeRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'The gatekeeper frowns. Invalid email or passcode.' });
    }

    const locationName = codeRes.rows[0].city;

    // Fetch real issues for this location from the database
    const issuesRes = await db.query(
      "SELECT * FROM issues WHERE address ILIKE $1 OR city ILIKE $1 ORDER BY created_at DESC LIMIT 15",
      [`%${locationName}%`]
    );

    const realReports = issuesRes.rows.map(issue => {
      let conf = 85 + Math.floor(Math.random() * 14); // Simulated AI confidence score
      let authorityTarget = 'Public Works';
      const catLower = (issue.category || '').toLowerCase();
      const typeLower = (issue.type || '').toLowerCase();
      
      if (catLower.includes('water') || typeLower.includes('water')) authorityTarget = 'Water & Sanitation Dept';
      if (catLower.includes('road') || catLower.includes('pothole') || typeLower.includes('road')) authorityTarget = 'Department of Transportation';
      if (catLower.includes('trash') || catLower.includes('waste')) authorityTarget = 'Waste Management';

      return {
        title: issue.title,
        severity: issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1),
        confidence: conf,
        authority: authorityTarget
      };
    });

    const dynamicTelemetry = {
      reports: realReports,
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

    return res.json({ success: true, location: locationName, telemetry: dynamicTelemetry });
  } catch (err) {
    console.error('Authority unlock error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// ── Authority Registration Endpoint (For Super Admins) ──────────────────────
router.post('/authority/register', async (req, res) => {
  try {
    const { city, department, email } = req.body;
    if (!city || !email) {
      return res.status(400).json({ success: false, error: 'City and email are required.' });
    }

    const { v4: uuidv4 } = require('uuid');
    const cleanCity = city.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanDept = department ? department.trim() : 'Municipal Corporation';

    // Generate code: VAS-MC-48392
    const cityPrefix = cleanCity.substring(0, 3).toUpperCase();
    let deptPrefix = 'MC';
    const deptParts = cleanDept.split(' ');
    if (deptParts.length > 1) {
      deptPrefix = deptParts[0].charAt(0).toUpperCase() + deptParts[1].charAt(0).toUpperCase();
    } else if (cleanDept.length >= 2) {
      deptPrefix = cleanDept.substring(0, 2).toUpperCase();
    }
    const randNum = Math.floor(10000 + Math.random() * 90000); // 5 digits
    const generatedCode = `${cityPrefix}-${deptPrefix}-${randNum}`;
    
    // Add or update authority code
    await db.query(
      `INSERT INTO authority_codes (id, city, department, email, passcode) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email, city) DO UPDATE SET passcode = $5, department = $3`,
      [uuidv4(), cleanCity, cleanDept, cleanEmail, generatedCode]
    );

    return res.json({ success: true, message: `Successfully registered authority for ${cleanCity}.`, generatedCode });
  } catch (err) {
    console.error('Authority register error:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
