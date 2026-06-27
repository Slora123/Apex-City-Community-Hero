const { analyseImage } = require('./backend/services/aiAnalysis');

async function run() {
  const res = await analyseImage('./fake.jpg', 3);
  console.log(JSON.stringify(res, null, 2));
}

run();
