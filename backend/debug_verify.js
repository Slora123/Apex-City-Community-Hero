require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

async function run() {
  try {
    console.log("=== AWAITING MISSIONS ===");
    const m = await pool.query("SELECT id, status, before_photo, after_photo FROM missions WHERE status = 'Awaiting Community Verification'");
    console.log("Count:", m.rows.length);
    m.rows.forEach(r => console.log(" " + r.id + " before=" + r.before_photo + " after=" + r.after_photo));

    console.log("\n=== ALL RECENT VERIFICATIONS (last 2hrs) ===");
    const v = await pool.query("SELECT v.mission_id, v.verdict, v.created_at, u.name, u.city, u.area FROM verifications v JOIN users u ON v.verifier_id = u.id WHERE v.created_at > NOW() - INTERVAL '2 hours' ORDER BY v.created_at DESC");
    console.log("Count:", v.rows.length);
    v.rows.forEach(r => console.log(" mission=" + r.mission_id.slice(0,8) + ".. verdict=" + r.verdict + " by=" + r.name + " city=" + r.city + " area=" + r.area));

    console.log("\n=== MISSIONS WITH VERIFICATIONS BUT NOT COMPLETED ===");
    const s = await pool.query("SELECT m.id, m.status, COUNT(v.id) as cnt FROM missions m LEFT JOIN verifications v ON v.mission_id = m.id WHERE m.status NOT IN ('completed','Pending Verification') GROUP BY m.id, m.status HAVING COUNT(v.id) >= 1 ORDER BY cnt DESC");
    s.rows.forEach(r => console.log(" " + r.id.slice(0,8) + " status=" + r.status + " verifs=" + r.cnt));

    console.log("\n=== ALL USERS ===");
    const u = await pool.query("SELECT name, city, area FROM users ORDER BY name LIMIT 20");
    u.rows.forEach(r => console.log(" " + r.name + ": city=" + r.city + " area=" + r.area));

    console.log("\n=== MISSIONS TABLE STATUS COUNTS ===");
    const sc = await pool.query("SELECT status, COUNT(*) as cnt FROM missions GROUP BY status ORDER BY cnt DESC");
    sc.rows.forEach(r => console.log(" " + r.status + ": " + r.cnt));
  } finally {
    await pool.end();
  }
}
run().catch(e => { console.error("ERROR:", e.message); pool.end(); });
