require("dotenv").config();
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const http = require("http");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

function postJSON(urlStr, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const u = new URL(urlStr);
    const opts = { hostname: u.hostname, port: u.port, path: u.pathname, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), ...(token ? { Authorization: "Bearer " + token } : {}) } };
    const req = http.request(opts, res => {
      let d=""; res.on("data",c=>d+=c); res.on("end",()=>{ try{resolve({status:res.statusCode,body:JSON.parse(d)})}catch{resolve({status:res.statusCode,body:d})} });
    });
    req.on("error", reject); req.write(body); req.end();
  });
}

function postFormWithToken(urlStr, form, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = { hostname: u.hostname, port: u.port, path: u.pathname, method: "POST",
      headers: { ...form.getHeaders(), Authorization: "Bearer " + token } };
    const req = http.request(opts, res => {
      let d=""; res.on("data",c=>d+=c); res.on("end",()=>{ try{resolve({status:res.statusCode,body:JSON.parse(d)})}catch{resolve({status:res.statusCode,body:d})} });
    });
    req.on("error", reject); form.pipe(req);
  });
}

const BASE = "http://localhost:3001";
const IMAGE_PATH = "d:\\temp\\SLORA2\\image.png";

async function run() {
  console.log("=== MISSION REPORTING E2E TEST ===\n");

  // Step 1: Login as Andy
  console.log("STEP 1: Login as Andy (shadowblex2@gmail.com)...");
  const lr = await postJSON(BASE + "/api/auth/login", { email: "shadowblex2@gmail.com", password: "test123" });
  if (lr.status !== 200) { console.log("  FAIL:", lr.body?.error || lr.body); return; }
  const token = lr.body.token;
  const userId = lr.body.user?.id;
  console.log("  OK - Token acquired. User ID:", userId);

  // Step 2: Clean up database for a repeatable, clean test run
  console.log("\nSTEP 2: Cleaning up existing 'Broken Bench Test' reports/missions...");
  // Find issues reported by this user with this title/pattern or near these coordinates
  const existingIssues = await pool.query("SELECT id FROM issues WHERE title = 'Broken Bench Test' OR title = 'Broken Bench - Test Report' OR (ABS(lat - 18.65237) < 0.001 AND ABS(lng - 72.87949) < 0.001)");


  for (const row of existingIssues.rows) {
    console.log(`  Deleting existing issue ${row.id} & its verifications, reports, missions...`);
    await pool.query("DELETE FROM verifications WHERE issue_id = $1", [row.id]);
    await pool.query("DELETE FROM reports WHERE issue_id = $1", [row.id]);
    await pool.query("DELETE FROM missions WHERE issue_id = $1", [row.id]);
    await pool.query("DELETE FROM issues WHERE id = $1", [row.id]);
  }
  console.log("  Database cleaned.");

  // Step 3: Check image
  console.log("\nSTEP 3: Image check...");
  if (!fs.existsSync(IMAGE_PATH)) { console.log("  FAIL: image not found at", IMAGE_PATH); return; }
  console.log("  OK -", IMAGE_PATH);

  // Step 4: Submit report
  console.log("\nSTEP 4: Submitting report with image...");
  const form = new FormData();
  form.append("title", "Broken Bench Test");
  form.append("type", "broken_bench");
  form.append("lat", "18.65237");
  form.append("lng", "72.87949");
  form.append("address", "Alibag, Raigad, Maharashtra");
  form.append("description", "Test report from automated test");
  form.append("photo", fs.createReadStream(IMAGE_PATH), { filename: "image.png", contentType: "image/png" });
  const rr = await postFormWithToken(BASE + "/api/issues", form, token);
  console.log("  HTTP Status:", rr.status);
  if (rr.status !== 200 && rr.status !== 201) { console.log("  FAIL:", rr.body?.error || rr.body); return; }
  const issue = rr.body.issue;
  console.log("  Issue ID:", issue?.id);
  console.log("  Issue Status:", issue?.status, issue?.status === "active" ? "✅ PASS" : "❌ FAIL (expected: active)");
  console.log("  isNew:", rr.body.isNew, "| Points awarded:", rr.body.pointsAwarded);
  console.log("  AI type:", issue?.aiAnalysis?.type || issue?.type);
  console.log("  AI confidence:", issue?.aiAnalysis?.confidence);

  // Step 5: Verify mission in DB
  console.log("\nSTEP 5: Checking DB for mission...");
  const mr = await pool.query("SELECT id, status FROM missions WHERE issue_id = $1", [issue.id]);
  if (mr.rows.length === 0) {
    console.log("  FAIL: ❌ No mission found for issue", issue.id);
  } else {
    const m = mr.rows[0];
    console.log("  Mission ID:", m.id);
    console.log("  Mission Status:", m.status, m.status === "Active" ? "✅ PASS" : "❌ FAIL (expected: Active)");
  }

  // Step 6: Verify it appears in missions list
  console.log("\nSTEP 6: Checking missions API...");
  const { status: mls, body: mlb } = await new Promise((res,rej)=>{
    const u = new URL(BASE + "/api/missions?status=all");
    const r = http.request({ hostname:u.hostname, port:u.port, path:u.pathname+u.search, method:"GET",
      headers:{ Authorization:"Bearer "+token }}, resp=>{
      let d=""; resp.on("data",c=>d+=c); resp.on("end",()=>{ try{res({status:resp.statusCode,body:JSON.parse(d)})}catch{res({status:resp.statusCode,body:d})} });
    }); r.on("error",rej); r.end();
  });
  if (mls !== 200) { console.log("  FAIL: missions list status", mls); }
  else {
    const missionsList = mlb.missions || [];
    const found = missionsList.find(m => m.issue_id === issue.id || m.issueId === issue.id);
    console.log("  Total active missions returned:", missionsList.length);
    console.log("  New mission visible in list:", found ? "✅ YES" : "❌ NOT FOUND (check issue_id mapping)");
    if (missionsList.length > 0) {
      const last = missionsList[0];
      console.log("  First mission in list:", last.id?.slice(0,8), "status="+last.status);
    }
  }

  await pool.end();
  console.log("\n=== TEST COMPLETE ===");
}

run().catch(e => { console.error("FATAL:", e.message); pool.end(); });
