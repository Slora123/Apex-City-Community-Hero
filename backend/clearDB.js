const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function clear() {
  await pool.query('DELETE FROM xp_transactions');
  await pool.query('DELETE FROM achievements');
  await pool.query('DELETE FROM verifications');
  await pool.query('DELETE FROM missions');
  await pool.query('DELETE FROM reports');
  await pool.query('DELETE FROM issues');
  // keep users? Yes, or maybe just delete demo users
  await pool.query("DELETE FROM users WHERE id IN ('demo-authority-001', 'demo-hero-001')");
  console.log('Cleared mock data!');
  process.exit(0);
}
clear();
