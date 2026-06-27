require('dotenv').config();
const { analyseImage, compareBeforeAfter } = require('../backend/services/aiAnalysis');

async function test() {
  console.log('Testing compareBeforeAfter mock fallback...');
  const res = await compareBeforeAfter(null, null, 'infrastructure', 'medium', { simulated: true });
  console.log(JSON.stringify(res, null, 2));
}

test().catch(console.error);
