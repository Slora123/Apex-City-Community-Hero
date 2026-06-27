'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// ── Initialize DB (runs schema + seed if needed) ─────────────────────────
const db = require('./db/init');

// ── Notification service ─────────────────────────────────────────────────
const notifications = require('./services/notifications');

// ── Express App ──────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000', '*'],
    methods: ['GET', 'POST']
  }
});

// Init notification service with socket.io instance
notifications.init(io);

// ── Socket.io Connection Handler ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Allow client to join a personal room for targeted notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined personal room`);
  });

  // Allow client to join a city room for local notifications
  socket.on('join_city_room', (city) => {
    if (city) {
      socket.join(`city:${city.toLowerCase()}`);
      console.log(`🏙️  Joined city room: ${city}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const issueCountRes = await db.query('SELECT COUNT(*) as c FROM issues');
    const issueCount = issueCountRes.rows[0];
    const userCountRes = await db.query('SELECT COUNT(*) as c FROM users');
    const userCount = userCountRes.rows[0];
    res.json({
      status: 'ok',
      message: '🦸 Apex City - Community Hero Backend is running!',
      version: '1.0.0',
      database: {
        issues: issueCount ? parseInt(issueCount.c, 10) : 0,
        users: userCount ? parseInt(userCount.c, 10) : 0
      },
      aiProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'mock',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/users', require('./routes/users'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/achievements', require('./routes/achievements'));

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ── Error Handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(55));
  console.log('  🏙️   APEX CITY - COMMUNITY HERO — Backend Server');
  console.log('='.repeat(55));
  console.log(`  🚀  Running at:    http://localhost:${PORT}`);
  console.log(`  📊  Health check:  http://localhost:${PORT}/api/health`);
  console.log(`  🤖  AI Provider:   ${process.env.GEMINI_API_KEY ? '✅ Gemini Vision' : '🎭 Smart Mock'}`);
  console.log(`  🗄️   Database:      ${process.env.DATABASE_URL ? 'PostgreSQL' : 'Unknown'}`);
  console.log('='.repeat(55) + '\n');
});

module.exports = { app, server, io };
