'use strict';

/**
 * Reward calculation service
 * Implements the FIFO reward system described in the spec
 */

// ── REPORTING REWARDS (FIFO) ──────────────────────────────────────────────
const REPORT_REWARDS = {
  first: { small: 10, medium: 15, major: 20 },
  additional: { small: 5, medium: 10, major: 15 }
};

// ── SOLVING REWARDS (by issue type & severity) ────────────────────────────
const SOLVE_REWARDS = {
  waste: { small: 50, medium: 75, major: 100 },
  cracked_road: { small: 100, medium: 150, major: 200 },
  water_leak: { small: 75, medium: 100, major: 150 },
  broken_light: { small: 50, medium: 75, major: 100 },
  infrastructure: { small: 100, medium: 175, major: 250 },
  other: { small: 25, medium: 50, major: 75 }
};

// ── VERIFICATION REWARD ───────────────────────────────────────────────────
const VERIFICATION_REWARD = 5;

// ── LEVEL THRESHOLDS ─────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [
  0,     // Level 1: 0–499
  500,   // Level 2: 500–1499
  1500,  // Level 3: 1500–2999
  3000,  // Level 4: 3000–5499
  5500,  // Level 5: 5500–8999
  9000,  // Level 6: 9000–13999
  14000, // Level 7: 14000–20999
  21000, // Level 8: 21000–29999
  30000, // Level 9: 30000–44999
  45000  // Level 10: 45000+
];

const RANK_TITLES = [
  'Novice Hero',
  'Street Guardian',
  'City Defender',
  'Community Champion',
  'District Protector',
  'Urban Sentinel',
  'City Elite',
  'Master Hero',
  'Grand Champion',
  'Legendary Hero'
];

/**
 * Determine the size tier for an issue based on severity
 */
function getSizeTier(severity) {
  if (!severity) return 'medium';
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'high') return 'major';
  if (s === 'medium' || s === 'moderate') return 'medium';
  return 'small';
}

/**
 * Calculate points for a new report (FIFO system)
 * @param {number} reportOrder - 1-indexed position (1 = first reporter)
 * @param {string} severity - issue severity
 * @returns {number} points to award
 */
function calculateReportReward(reportOrder, severity) {
  const tier = getSizeTier(severity);
  const table = reportOrder === 1 ? REPORT_REWARDS.first : REPORT_REWARDS.additional;
  return table[tier] || table.medium;
}

/**
 * Calculate points for solving/completing a mission
 * @param {string} issueType - type of issue (cracked_road, waste, etc.)
 * @param {string} severity - issue severity
 * @param {string} verdict - resolution verdict (Fully Resolved, Partially Resolved)
 * @returns {number} points to award
 */
function calculateSolveReward(issueType, severity, verdict) {
  const typeKey = issueType || 'other';
  const rewardTable = SOLVE_REWARDS[typeKey] || SOLVE_REWARDS.other;
  const tier = getSizeTier(severity);
  const baseReward = rewardTable[tier] || rewardTable.medium;

  // Normalize verdict for AI comparisons
  const v = (verdict || '').toLowerCase();

  // Partial resolution gets 50% of the reward
  if (v === 'partially resolved' || v === 'partially_resolved') {
    return Math.round(baseReward * 0.5);
  }
  // Full resolution gets 100%
  if (v === 'fully resolved' || v === 'resolved') {
    return baseReward;
  }
  // Not resolved — 0 points for solving
  return 0;
}

/**
 * Calculate level from total XP
 */
function calculateLevel(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, 10);
}

/**
 * Get rank title for a given level
 */
function getRankTitle(level) {
  return RANK_TITLES[Math.min(level - 1, RANK_TITLES.length - 1)];
}

/**
 * Check which achievements a user has newly earned
 */
async function checkAchievements(db, userId) {
  const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];
  if (!user) return [];

  const existingRes = await db.query('SELECT badge_type FROM achievements WHERE user_id = $1', [userId]);
  const existing = existingRes.rows.map(a => a.badge_type);
  const newBadges = [];

  const BADGE_RULES = [
    {
      type: 'first_report',
      name: '🏅 First Report',
      description: 'You filed your first civic report!',
      check: async () => user.total_reports >= 1
    },
    {
      type: 'first_mission',
      name: '🏅 First Resolution',
      description: 'You completed your first mission!',
      check: async () => user.total_missions >= 1
    },
    {
      type: 'first_verification',
      name: '🏅 First Verification',
      description: 'You verified your first resolution!',
      check: async () => user.total_verifications >= 1
    },
    {
      type: 'waste_warrior',
      name: '🏅 Waste Warrior',
      description: 'Resolved 3 waste management issues!',
      check: async () => {
        const res = await db.query("SELECT COUNT(*) as c FROM missions m JOIN issues i ON m.issue_id = i.id WHERE m.assignee_id = $1 AND i.type = 'waste' AND m.status = 'completed'", [userId]);
        const count = parseInt(res.rows[0].c, 10);
        return count >= 3;
      }
    },
    {
      type: 'road_guardian',
      name: '🏅 Road Guardian',
      description: 'Resolved 3 road/pothole issues!',
      check: async () => {
        const res = await db.query("SELECT COUNT(*) as c FROM missions m JOIN issues i ON m.issue_id = i.id WHERE m.assignee_id = $1 AND i.type = 'cracked_road' AND m.status = 'completed'", [userId]);
        const count = parseInt(res.rows[0].c, 10);
        return count >= 3;
      }
    },
    {
      type: 'water_protector',
      name: '🏅 Water Protector',
      description: 'Resolved 3 water leakage issues!',
      check: async () => {
        const res = await db.query("SELECT COUNT(*) as c FROM missions m JOIN issues i ON m.issue_id = i.id WHERE m.assignee_id = $1 AND i.type = 'water_leak' AND m.status = 'completed'", [userId]);
        const count = parseInt(res.rows[0].c, 10);
        return count >= 3;
      }
    },
    {
      type: 'light_saver',
      name: '🏅 Light Saver',
      description: 'Resolved 3 broken streetlight issues!',
      check: async () => {
        const res = await db.query("SELECT COUNT(*) as c FROM missions m JOIN issues i ON m.issue_id = i.id WHERE m.assignee_id = $1 AND i.type = 'broken_light' AND m.status = 'completed'", [userId]);
        const count = parseInt(res.rows[0].c, 10);
        return count >= 3;
      }
    },
    {
      type: 'infrastructure_hero',
      name: '🏅 Infrastructure Hero',
      description: 'Resolved 3 infrastructure issues!',
      check: async () => {
        const res = await db.query("SELECT COUNT(*) as c FROM missions m JOIN issues i ON m.issue_id = i.id WHERE m.assignee_id = $1 AND i.type = 'infrastructure' AND m.status = 'completed'", [userId]);
        const count = parseInt(res.rows[0].c, 10);
        return count >= 3;
      }
    },
    {
      type: 'community_champion',
      name: '🏅 Community Champion',
      description: 'Reached Level 5!',
      check: async () => user.level >= 5
    }
  ];

  const insertAchievement = `
    INSERT INTO achievements (id, user_id, badge_type, badge_name, badge_description)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT DO NOTHING
  `;

  for (const rule of BADGE_RULES) {
    if (!existing.includes(rule.type) && (await rule.check())) {
      const id = `ach-${userId}-${rule.type}-${Date.now()}`;
      await db.query(insertAchievement, [id, userId, rule.type, rule.name, rule.description]);
      newBadges.push({ type: rule.type, name: rule.name, description: rule.description });
    }
  }

  return newBadges;
}

/**
 * Award XP to a user and update their level/rank
 */
async function awardXP(db, userId, amount, reason, refId = '') {
  if (amount <= 0) return { xp: 0, level: 1, rank: 'Novice Hero' };

  // Log the transaction
  const txId = `xp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  await db.query(`
    INSERT INTO xp_transactions (id, user_id, amount, reason, ref_id)
    VALUES ($1, $2, $3, $4, $5)
  `, [txId, userId, amount, reason, refId || '']);

  // Update user XP
  await db.query(`
    UPDATE users SET xp = xp + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
  `, [amount, userId]);

  // Recalculate level and rank
  const userRes = await db.query('SELECT xp FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];
  const newLevel = calculateLevel(user.xp);
  const newRank = getRankTitle(newLevel);

  await db.query(`
    UPDATE users SET level = $1, rank = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3
  `, [newLevel, newRank, userId]);

  // Check for new achievements
  const newBadges = await checkAchievements(db, userId);

  return { xp: user.xp, level: newLevel, rank: newRank, newBadges };
}

module.exports = {
  calculateReportReward,
  calculateSolveReward,
  calculateLevel,
  getRankTitle,
  checkAchievements,
  awardXP,
  VERIFICATION_REWARD
};
