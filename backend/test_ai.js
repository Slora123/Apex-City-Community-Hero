require('dotenv').config();
const { analyseImage, compareBeforeAfter } = require('../backend/services/aiAnalysis');

async function test() {
  console.log('Testing analyseImage mock fallback...');
  const res = await analyseImage(null, 'random.jpg', { lat: 0, lng: 0 }, { simulated: true });
  console.log(JSON.stringify(res, null, 2));
}

test().catch(console.error);
