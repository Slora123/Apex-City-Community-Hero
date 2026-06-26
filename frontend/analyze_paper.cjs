const fs = require('fs');
const { PNG } = require('pngjs');

const imgPath = './public/report.png';
const buffer = fs.readFileSync(imgPath);

new PNG().parse(buffer, (error, data) => {
  if (error) {
    console.error('Error parsing PNG:', error);
    return;
  }

  const width = data.width;
  const height = data.height;

  console.log(`Image dimensions: ${width}x${height}`);

  // Find the bounding box of all non-transparent pixels (alpha > 10)
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let nonTransCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const a = data.data[idx + 3];
      if (a > 10) {
        nonTransCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`Non-transparent pixels: ${nonTransCount}`);
  console.log(`Scroll Paper Pixel Bounds: X: [${minX}, ${maxX}], Y: [${minY}, ${maxY}]`);
  console.log(`Scroll Paper Percentages:`);
  console.log(`  Left margin: ${((minX / width) * 100).toFixed(2)}%`);
  console.log(`  Right margin: ${((1 - maxX / width) * 100).toFixed(2)}%`);
  console.log(`  Top margin: ${((minY / height) * 100).toFixed(2)}%`);
  console.log(`  Bottom margin: ${((1 - maxY / height) * 100).toFixed(2)}%`);
  console.log(`  Paper Width: ${(((maxX - minX) / width) * 100).toFixed(2)}%`);
  console.log(`  Paper Height: ${(((maxY - minY) / height) * 100).toFixed(2)}%`);
});
