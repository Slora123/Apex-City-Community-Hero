-- Apex City - Community Hero Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT '',
  city TEXT DEFAULT '',
  area TEXT DEFAULT '',
  avatar TEXT DEFAULT 'male',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Novice Hero',
  total_reports INTEGER DEFAULT 0,
  total_missions INTEGER DEFAULT 0,
  total_verifications INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  category TEXT DEFAULT '',
  severity TEXT DEFAULT 'medium',
  priority TEXT DEFAULT 'moderate',
  lat REAL DEFAULT 0,
  lng REAL DEFAULT 0,
  address TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  reporter_id TEXT NOT NULL,
  reporter_count INTEGER DEFAULT 1,
  photo_path TEXT DEFAULT '',
  description TEXT DEFAULT '',
  ai_analysis TEXT DEFAULT '{}',
  resolution_photo TEXT DEFAULT '',
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id)
);

-- Reports table (FIFO tracking — who reported what and in what order)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  report_order INTEGER DEFAULT 1,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  UNIQUE(issue_id, reporter_id)
);

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  assignee_id TEXT,
  status TEXT DEFAULT 'available',
  before_photo TEXT DEFAULT '',
  after_photo TEXT DEFAULT '',
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(id),
  FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- Verifications table
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  mission_id TEXT,
  verifier_id TEXT NOT NULL,
  verdict TEXT DEFAULT 'resolved',
  points_awarded INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(id),
  FOREIGN KEY (verifier_id) REFERENCES users(id)
);

-- Achievements / Badges table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT DEFAULT '',
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, badge_type)
);

-- XP Transactions log (for audit trail)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  ref_id TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_reporter ON issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_issue ON reports(issue_id);
CREATE INDEX IF NOT EXISTS idx_missions_issue ON missions(issue_id);
CREATE INDEX IF NOT EXISTS idx_missions_assignee ON missions(assignee_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_verifications_issue ON verifications(issue_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_user ON xp_transactions(user_id);
