require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

async function run() {
  const missionId = "7567e839-843f-4cc9-b536-a1b7c4e8f39a";
  
  // Get mission details
  const m = await pool.query("SELECT * FROM missions WHERE id = $1", [missionId]);
  const mission = m.rows[0];
  console.log("Mission status:", mission.status, "issue_id:", mission.issue_id, "assignee:", mission.assignee_id);
  
  // Get verifications
  const v = await pool.query("SELECT verdict FROM verifications WHERE mission_id = $1", [missionId]);
  console.log("Verifications:", v.rows.length, v.rows.map(r => r.verdict));
  
  // Force complete the mission
  console.log("\nForce-completing the stuck mission...");
  const r1 = await pool.query("UPDATE missions SET status = 'completed', completed_at = NOW() WHERE id = $1 RETURNING *", [missionId]);
  console.log("Mission updated:", r1.rows[0].status);
  
  const r2 = await pool.query("UPDATE issues SET status = 'resolved', resolved_at = NOW() WHERE id = $1 RETURNING id, status", [mission.issue_id]);
  console.log("Issue updated:", r2.rows[0]);
  
  // Award solver if there is one
  if (mission.assignee_id) {
    const pts = 75;
    await pool.query("UPDATE users SET xp = xp + $1, total_missions = total_missions + 1 WHERE id = $2", [pts, mission.assignee_id]);
    console.log("Awarded solver " + pts + " XP:", mission.assignee_id);
  }
  
  console.log("\nDone! Mission is now completed.");
  await pool.end();
}
run().catch(e => { console.error("ERROR:", e.message, e.stack); pool.end(); });
