'use strict';

let io = null;

function init(socketIoInstance) {
  io = socketIoInstance;
}

/**
 * Emit a new issue notification to all connected users in the same city
 */
function notifyNewIssue(issue, reporter) {
  if (!io) return;
  io.emit('new_issue', {
    id: issue.id,
    title: issue.title,
    type: issue.type,
    category: issue.category,
    severity: issue.severity,
    lat: issue.lat,
    lng: issue.lng,
    address: issue.address,
    reporter: reporter ? reporter.name : 'Anonymous',
    city: reporter ? reporter.city : '',
    message: `📍 New ${issue.category} reported ${issue.address ? 'at ' + issue.address : 'nearby'}`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit issue confirmation request to nearby users (Step 2 of workflow)
 */
function notifyConfirmIssue(issue) {
  if (!io) {
    console.log(`[Push Notification Mock] Sending 'Confirm nearby issue' for issue ${issue.id}`);
    return;
  }
  
  // Real logic would filter sockets by geographic radius
  io.emit('confirm_issue_needed', {
    id: issue.id,
    title: issue.title,
    lat: issue.lat,
    lng: issue.lng,
    message: `🚨 Please confirm: A nearby "${issue.title}" was just reported! Visit the location and report it to verify.`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit issue resolved notification
 */
function notifyIssueResolved(issue, resolver) {
  if (!io) return;
  io.emit('issue_resolved', {
    id: issue.id,
    title: issue.title,
    type: issue.type,
    resolver: resolver ? resolver.name : 'A Hero',
    message: `✅ ${issue.title} has been resolved by ${resolver ? resolver.name : 'a Community Hero'}!`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit XP award notification to a specific user
 */
function notifyXPAwarded(userId, amount, reason) {
  if (!io) return;
  io.to(`user:${userId}`).emit('xp_awarded', {
    amount,
    reason,
    message: `🎉 +${amount} XP — ${reason}`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit achievement unlocked notification to a specific user
 */
function notifyAchievement(userId, badge) {
  if (!io) return;
  io.to(`user:${userId}`).emit('achievement_unlocked', {
    badge,
    message: `🏅 Achievement Unlocked: ${badge.name}`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit community verification request to nearby users
 */
function notifyVerificationNeeded(issue) {
  if (!io) return;
  io.emit('verification_needed', {
    issueId: issue.id,
    title: issue.title,
    address: issue.address,
    message: `👀 Help verify: "${issue.title}" — has it been resolved?`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit mission_activated when a pending issue reaches the reporter threshold
 * and its mission flips to Active. All connected clients should refresh their
 * missions list so the new quest card appears immediately.
 */
function notifyMissionActivated(issue, missionId) {
  if (!io) {
    console.log(`[Push Notification Mock] mission_activated for issue ${issue.id}`);
    return;
  }
  io.emit('mission_activated', {
    missionId,
    issueId: issue.id,
    title: issue.title,
    type: issue.type,
    severity: issue.severity,
    lat: issue.lat,
    lng: issue.lng,
    address: issue.address,
    reporterCount: issue.reporter_count,
    message: `⚔️ New Quest Unlocked: "${issue.title}" — enough reports confirmed, a mission is now active!`,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  init,
  notifyNewIssue,
  notifyConfirmIssue,
  notifyIssueResolved,
  notifyXPAwarded,
  notifyAchievement,
  notifyVerificationNeeded,
  notifyMissionActivated
};
