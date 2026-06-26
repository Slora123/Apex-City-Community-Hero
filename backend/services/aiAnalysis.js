'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Gemini AI Analysis Service
 * Analyses civic issue images and returns structured data.
 * Falls back to a smart mock if no API key is configured.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Issue type detection keywords for mock analysis
const ISSUE_PATTERNS = {
  cracked_road: {
    type: 'Pothole / Road Damage',
    category: 'cracked_road',
    keywords: ['pothole', 'road', 'crack', 'asphalt', 'pavement', 'street']
  },
  water_leak: {
    type: 'Water Leakage',
    category: 'water_leak',
    keywords: ['water', 'pipe', 'leak', 'flood', 'drain', 'aqueduct']
  },
  broken_light: {
    type: 'Damaged Streetlight',
    category: 'broken_light',
    keywords: ['light', 'lamp', 'streetlight', 'lantern', 'bulb', 'dark']
  },
  waste: {
    type: 'Waste / Garbage Dump',
    category: 'waste',
    keywords: ['garbage', 'waste', 'trash', 'dump', 'litter', 'rubbish']
  },
  infrastructure: {
    type: 'Infrastructure Damage',
    category: 'infrastructure',
    keywords: ['bridge', 'railing', 'wall', 'building', 'structure', 'fence', 'sign']
  }
};

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_LABELS = {
  Low: 'Low Priority',
  Medium: 'Moderate',
  High: 'Urgent',
  Critical: 'Critical'
};

/**
 * Smart mock analysis — generates realistic results without calling an API
 * Uses filename, timestamp, and randomized-but-realistic data
 */
function mockAnalysis(imagePath) {
  const filename = (imagePath || '').toLowerCase();

  // Detect likely issue type from filename hints
  let detected = ISSUE_PATTERNS.cracked_road; // default
  for (const [key, pattern] of Object.entries(ISSUE_PATTERNS)) {
    if (pattern.keywords.some(kw => filename.includes(kw))) {
      detected = pattern;
      break;
    }
  }

  // Randomize within realistic ranges
  const severityIdx = Math.floor(Math.random() * 4);
  const severity = SEVERITY_LEVELS[severityIdx];
  const impactOptions = ['Residential Area', 'Heavy Traffic Zone', 'School Nearby', 'Commercial District', 'Park Area'];
  const impact = impactOptions[Math.floor(Math.random() * impactOptions.length)];
  const estimatedSizes = ['Small (< 0.5m)', 'Medium (0.5–2m)', 'Large (2–5m)', 'Major (> 5m)'];
  const estimatedSize = estimatedSizes[Math.floor(Math.random() * estimatedSizes.length)];
  const reportCount = Math.floor(Math.random() * 8) + 1;

  return {
    type: detected.type,
    category: detected.category,
    severity,
    priority: PRIORITY_LABELS[severity],
    impact,
    urgency: severity === 'Critical' ? 'Immediate Action Required' : severity === 'High' ? 'Action Within 24h' : severity === 'Medium' ? 'Action Within 72h' : 'Can Be Scheduled',
    estimatedSize,
    estimatedReports: reportCount,
    confidence: 0.87 + Math.random() * 0.12,
    aiProvider: 'mock',
    analysedAt: new Date().toISOString()
  };
}

/**
 * Real Gemini Vision analysis
 */
async function geminiAnalysis(imagePath) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Read the image file
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString('base64');
  const ext = path.extname(imagePath).toLowerCase().replace('.', '');
  const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const prompt = `You are an AI assistant for a civic reporting platform called Apex City (tagline/description: Community Hero).
Analyse this image of a reported civic issue and return ONLY a JSON object with these exact fields:

{
  "type": "<type of issue: Pothole, Water Leakage, Damaged Streetlight, Waste Dump, Infrastructure Damage, or Other>",
  "category": "<machine key: cracked_road | water_leak | broken_light | waste | infrastructure | other>",
  "severity": "<Low | Medium | High | Critical>",
  "priority": "<Low Priority | Moderate | Urgent | Critical>",
  "urgency": "<text description of how urgent>",
  "impact": "<describe who/what is impacted>",
  "estimatedSize": "<physical size estimate>",
  "confidence": <0.0 to 1.0>,
  "aiProvider": "gemini"
}

Be accurate and helpful. Only output the JSON, no other text.`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: base64Image
      }
    }
  ]);

  const text = result.response.text().trim();

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  parsed.analysedAt = new Date().toISOString();
  return parsed;
}

/**
 * Main analysis function — uses Gemini if key available, otherwise mock
 */
async function analyseImage(imagePath) {
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10) {
    try {
      console.log('🤖 Using Gemini AI for analysis...');
      return await geminiAnalysis(imagePath);
    } catch (err) {
      console.warn('⚠️  Gemini analysis failed, falling back to mock:', err.message);
      return mockAnalysis(imagePath);
    }
  } else {
    console.log('🎭 Using smart mock analysis (no Gemini key configured)');
    return mockAnalysis(imagePath);
  }
}

/**
 * Compare before/after images to determine resolution quality
 */
async function compareBeforeAfter(beforePath, afterPath, issueType) {
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10) {
    try {
      return await geminiCompare(beforePath, afterPath, issueType);
    } catch (err) {
      console.warn('⚠️  Gemini comparison failed, using mock:', err.message);
      return mockComparison(issueType);
    }
  }
  return mockComparison(issueType);
}

async function geminiCompare(beforePath, afterPath, issueType) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const toInlineData = (imgPath) => {
    const data = fs.readFileSync(imgPath).toString('base64');
    const ext = path.extname(imgPath).toLowerCase().replace('.', '');
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    return { inlineData: { mimeType, data } };
  };

  const prompt = `You are verifying if a civic issue has been resolved.
Issue type: ${issueType}

The FIRST image is the BEFORE (the problem), the SECOND image is the AFTER (the fix).
Compare them and return ONLY this JSON:

{
  "resolutionPercentage": <0 to 100 integer>,
  "verdict": "<Fully Resolved | Partially Resolved | Not Resolved>",
  "improvement": "<describe what changed>",
  "remainingIssues": "<describe any remaining problems, or 'None' if fully resolved>",
  "confidence": <0.0 to 1.0>
}`;

  const result = await model.generateContent([
    prompt,
    toInlineData(beforePath),
    toInlineData(afterPath)
  ]);

  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Cannot parse comparison response');
  return JSON.parse(jsonMatch[0]);
}

function mockComparison(issueType) {
  const resolutionPct = 60 + Math.floor(Math.random() * 40); // 60–99%
  const verdict = resolutionPct >= 90 ? 'Fully Resolved' : resolutionPct >= 60 ? 'Partially Resolved' : 'Not Resolved';
  return {
    resolutionPercentage: resolutionPct,
    verdict,
    improvement: `The ${issueType} area shows significant improvement after the intervention.`,
    remainingIssues: verdict === 'Fully Resolved' ? 'None' : 'Minor cleanup may still be needed.',
    confidence: 0.82 + Math.random() * 0.15,
    aiProvider: 'mock'
  };
}

module.exports = { analyseImage, compareBeforeAfter };
