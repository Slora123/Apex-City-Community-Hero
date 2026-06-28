'use strict';

const fs = require('fs');
const path = require('path');
const { calculateSolveReward } = require('./rewards');

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
  },
  traffic_signal: {
    type: 'Broken Traffic Signal',
    category: 'traffic_signal',
    keywords: ['traffic', 'signal', 'red light']
  },
  open_manhole: {
    type: 'Open Manhole',
    category: 'open_manhole',
    keywords: ['manhole', 'open', 'hole', 'sewer']
  },
  fallen_tree: {
    type: 'Fallen Tree',
    category: 'fallen_tree',
    keywords: ['tree', 'fallen', 'branch', 'leaves', 'wood']
  },
  blocked_drain: {
    type: 'Blocked Drain',
    category: 'blocked_drain',
    keywords: ['drain', 'blocked', 'clogged', 'sewage']
  },
  flooded_road: {
    type: 'Flooded Road',
    category: 'flooded_road',
    keywords: ['flood', 'water', 'road', 'submerged']
  },
  damaged_footpath: {
    type: 'Damaged Footpath',
    category: 'damaged_footpath',
    keywords: ['footpath', 'sidewalk', 'walkway', 'pedestrian']
  },
  illegal_waste_dumping: {
    type: 'Illegal Waste Dumping',
    category: 'illegal_waste_dumping',
    keywords: ['illegal', 'dumping', 'waste', 'garbage', 'trash']
  },
  broken_bus_stop: {
    type: 'Broken Bus Stop',
    category: 'broken_bus_stop',
    keywords: ['bus', 'stop', 'shelter', 'broken']
  },
  broken_bench: {
    type: 'Broken Bench',
    category: 'broken_bench',
    keywords: ['bench', 'seat', 'broken', 'park']
  },
  road_blockage: {
    type: 'Road Blockage',
    category: 'road_blockage',
    keywords: ['road', 'blockage', 'blocked', 'obstruction']
  }
};

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_LABELS = {
  Low: 'Low Priority',
  Medium: 'Moderate',
  High: 'Urgent',
  Critical: 'Critical'
};


function getRecommendedAuthority(category) {
  const mapping = {
    cracked_road: 'Road Maintenance Department',
    damaged_footpath: 'Road Maintenance Department',
    road_blockage: 'Traffic Police & Road Maintenance',
    water_leak: 'Water Supply Department',
    blocked_drain: 'Sewerage Department',
    open_manhole: 'Sewerage Department',
    flooded_road: 'Disaster Management & Sewerage',
    broken_light: 'Electricity Board',
    traffic_signal: 'Traffic Police Department',
    waste: 'Waste Management Department',
    illegal_waste_dumping: 'Waste Management Department',
    fallen_tree: 'Forest/Parks Department',
    infrastructure: 'Public Works Department',
    broken_bus_stop: 'Public Transport Department',
    broken_bench: 'Parks & Recreation Department'
  };
  return mapping[category] || 'Municipal Corporation';
}

function calculatePriority(severity, reports, impact) {
  if (severity === 'Critical') return 'Critical';
  if (severity === 'High') {
    if (reports >= 10 || impact.includes('Heavy Traffic') || impact.includes('School')) return 'Critical';
    return 'Urgent';
  }
  if (severity === 'Medium') {
    if (reports >= 10) return 'Urgent';
    return 'Moderate';
  }
  return 'Low Priority';
}

/**
 * Smart mock analysis — generates realistic results without calling an API
 * Uses filename, timestamp, and randomized-but-realistic data
 */
function mockAnalysis(imagePath, estimatedReports = null, contextData = {}) {
  const filename = (imagePath || '').toLowerCase();

  // Detect likely issue type from filename hints
  let detected = null;
  for (const [key, pattern] of Object.entries(ISSUE_PATTERNS)) {
    if (pattern.keywords.some(kw => filename.includes(kw))) {
      detected = pattern;
      break;
    }
  }

  if (!detected) {
    const issues = Object.values(ISSUE_PATTERNS);
    detected = issues[Math.floor(Math.random() * issues.length)];
  }

  // Randomize within realistic ranges
  const severityIdx = Math.floor(Math.random() * 4);
  const severity = SEVERITY_LEVELS[severityIdx];
  const impactOptions = ['Residential Area', 'Heavy Traffic Zone', 'School Nearby', 'Commercial District', 'Park Area'];
  const impact = contextData.address || impactOptions[Math.floor(Math.random() * impactOptions.length)];
  const estimatedSizes = ['Small (< 0.5m)', 'Medium (0.5–2m)', 'Large (2–5m)', 'Major (> 5m)'];
  const estimatedSize = estimatedSizes[Math.floor(Math.random() * estimatedSizes.length)];
  const reportCount = estimatedReports ?? (Math.floor(Math.random() * 8) + 1);
  const priority = calculatePriority(severity, reportCount, impact);
  
  const estimatedReward = calculateSolveReward(detected ? detected.category : 'other', severity, 'Fully Resolved');
  const recommendedAuthority = getRecommendedAuthority(detected ? detected.category : 'other');
  const isAuthority = severity === 'Critical' || severity === 'High';

  return {
    isValid: true,
    type: detected ? detected.type : null,
    category: detected ? detected.category : null,
    severity,
    priority,
    impact,
    urgency: severity === 'Critical' ? 'Immediate Action Required' : severity === 'High' ? 'Action Within 24h' : severity === 'Medium' ? 'Action Within 72h' : 'Can Be Scheduled',
    estimatedSize,
    estimatedReports: reportCount,
    confidence: Math.min(Number((0.87 + Math.random() * 0.12).toFixed(2)), 0.99),
    aiProvider: 'mock',
    model: 'mock',
    analysedAt: new Date().toISOString(),
    estimatedReward,
    recommendedAuthority,
    handler: isAuthority ? 'Authority' : (Math.random() > 0.8 ? 'Hybrid' : 'Community'),
    department: isAuthority ? recommendedAuthority : 'Local Community',
    communityCanHelp: !isAuthority,
    missionTitle: `Repair ${detected.type}`,
    missionDescription: `A ${severity.toLowerCase()} severity ${detected.type.toLowerCase()} was reported affecting ${impact.toLowerCase()}.`,
    estimatedTime: severity === 'Critical' ? '2-4 hours' : '1-2 days',
    citizenAdvice: severity === 'Critical' ? 'Stay clear of the area.' : 'Be cautious.',
    safetyLevel: severity === 'Critical' ? 'Danger' : 'Safe to approach with caution',
    requiresAuthority: severity === 'Critical' || severity === 'High',
    summary: `${severity} severity ${detected.type.toLowerCase()} affecting ${impact.toLowerCase()}.`
  };
}

/**
 * Real Gemini Vision analysis
 */
async function geminiAnalysis(imagePath, estimatedReports = null, contextData = {}) {
  let model;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch (err) {
    console.warn('⚠️  Could not initialize Gemini, using mock:', err.message);
    return mockAnalysis(imagePath, estimatedReports);
  }

  let imageData, base64Image, mimeType;
  try {
    // Read the image file
    imageData = fs.readFileSync(imagePath);
    base64Image = imageData.toString('base64');
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  } catch (err) {
    console.warn('⚠️  Could not read image file for analysis, using mock:', err.message);
    return mockAnalysis(imagePath, estimatedReports);
  }

  let contextStr = '';
  if (contextData.address || (contextData.lat && contextData.lng)) {
    contextStr = `\nContext Information for this issue:\n`;
    if (contextData.address) contextStr += `- Address/Location: ${contextData.address}\n`;
    if (contextData.lat && contextData.lng) contextStr += `- Coordinates: ${contextData.lat}, ${contextData.lng}\n`;
    contextStr += `Use this location data to accurately estimate the "impact" (e.g. if it's near a school, park, residential area, highway) and "severity".`;
  }

  // Two-step prompt: describe first, then classify freely — no forced category list
  const prompt = `You are an expert civic issue analyst for "Apex City – Community Hero", a platform where citizens report real civic problems.

STEP 1 – DESCRIBE WHAT YOU SEE:
Look carefully at this image. Describe exactly what is visible: objects, condition, location type, any damage, dirt, hazard or problem.

STEP 2 – CLASSIFY THE ISSUE:
Based only on what you actually see (not what you expect), determine:
- Is there a genuine civic issue here?
- What EXACTLY is the issue? Be specific (e.g. "Dirty Public Toilet", "Overflowing Garbage Bin", "Broken Playground Swing", "Stray Dogs", "Graffiti on Wall", "Burst Water Pipe", "Cracked Road", etc.)
- You are NOT limited to any predefined list. Create the most accurate category name.
- If the image is NOT a civic issue (selfie, pet photo, indoor scene, food, screenshot), set isValid to false.
${contextStr}

Return ONLY a raw JSON object. No markdown, no explanation. Exactly this structure:
{
  "isValid": <true if genuine civic issue; false if selfie/random photo/not a civic problem>,
  "sceneDescription": "<1-2 sentences: what you literally see in the image>",
  "type": "<The exact civic issue type — be specific, e.g. 'Dirty Public Toilet', 'Overflowing Garbage Bin', 'Cracked Footpath', 'Broken Playground Equipment', 'Stray Animals on Road', 'Graffiti on Public Wall'. Do NOT default to a wrong category.>",
  "category": "<snake_case machine key for the type above, e.g. dirty_public_toilet, overflowing_garbage, cracked_footpath, broken_playground, stray_animals, graffiti_wall>",
  "handler": "<Community | Authority | Hybrid> — 'Community' if citizens can resolve it (e.g. litter, minor cleaning, small puddle). 'Authority' if it requires government or heavy machinery (broken pipe, collapsed road). 'Hybrid' if both can act together.",
  "department": "<Specific government branch or 'Local Community' — e.g. 'Sanitation Department', 'Road Maintenance Department', 'Animal Control', 'Water Supply Department', 'Public Works Department', 'Local Community'>",
  "communityCanHelp": <true if citizens can safely help resolve this issue, false otherwise>,
  "severity": "<Low | Medium | High | Critical>",
  "priority": "<Low Priority | Moderate | Urgent | Critical>",
  "urgency": "<Concise text: how urgently does this need to be resolved?>",
  "impact": "<Who or what is affected — residents, children, traffic, hygiene, environment, etc.>",
  "estimatedSize": "<Physical scale estimate if applicable, e.g. 'Small area', 'Entire stall block', '~10m stretch', or 'N/A'>",
  "confidence": <float 0.0–0.99 — how confident you are in this classification>,
  "aiProvider": "gemini",
  "estimatedReward": <integer 50–350 — points based on severity and how hard it is to fix>,
  "recommendedAuthority": "<Same as department>",
  "summary": "<One sentence describing the issue clearly for display to the public>",
  "citizenAdvice": "<Short safety/hygiene advice for citizens near this issue>",
  "safetyLevel": "<Safe | Caution | Danger>"
}`;

  try {
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
      throw new Error('Could not parse AI response JSON');
    }

    let parsed = JSON.parse(jsonMatch[0]);
    parsed.analysedAt = new Date().toISOString();
    
    // Default isValid to true if not explicitly false
    if (parsed.isValid === undefined) {
      parsed.isValid = true;
    }
    
    // Clamp confidence
    if (parsed.confidence != null) {
      parsed.confidence = Math.min(Number(parsed.confidence.toFixed(2)), 0.99);
    }

    // ── NO hardcoded category whitelist ──────────────────────────────────────
    // We trust Gemini's dynamic classification. Only sanitize to snake_case if
    // the model returned something weird (spaces, uppercase, etc.).
    if (parsed.category) {
      parsed.category = parsed.category.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    } else {
      parsed.category = 'other';
    }

    if (!SEVERITY_LEVELS.includes(parsed.severity)) parsed.severity = 'Medium';
    
    const validPriorities = ['Low Priority', 'Moderate', 'Urgent', 'Critical'];
    if (!validPriorities.includes(parsed.priority)) {
      parsed.priority = calculatePriority(parsed.severity, parsed.estimatedReports || 1, parsed.impact || '');
    }
    
    // Use Gemini-provided authority/department — only fall back if missing
    if (!parsed.recommendedAuthority && parsed.department) {
      parsed.recommendedAuthority = parsed.department;
    } else if (!parsed.recommendedAuthority) {
      parsed.recommendedAuthority = getRecommendedAuthority(parsed.category);
    }
    
    // Handle dynamic fields
    parsed.estimatedReports = estimatedReports ?? (Math.floor(Math.random() * 8) + 1);
    parsed.estimatedReward = parsed.estimatedReward || calculateSolveReward(parsed.category, parsed.severity, 'Fully Resolved');
    parsed.model = 'gemini-1.5-flash';

    return parsed;
  } catch (err) {
    console.warn('⚠️  Gemini API call or JSON parsing failed, falling back to mock:', err.message);
    return mockAnalysis(imagePath, estimatedReports);
  }
}

/**
 * Main analysis function — uses Gemini if key available, otherwise mock
 */
async function analyseImage(imagePath, estimatedReports = null, contextData = {}) {
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10) {
    try {
      console.log('🤖 Using Gemini AI for analysis...');
      return await geminiAnalysis(imagePath, estimatedReports, contextData);
    } catch (err) {
      console.warn('⚠️  Gemini analysis failed, falling back to mock:', err.message);
      return mockAnalysis(imagePath, estimatedReports, contextData);
    }
  } else {
    console.log('⚠️  No Gemini API Key found. Using smart mock analysis.');
    return mockAnalysis(imagePath, estimatedReports, contextData);
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
  let model;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch (err) {
    console.warn('⚠️  Could not initialize Gemini for comparison, using mock:', err.message);
    return mockComparison(issueType);
  }

  const toInlineData = (imgPath) => {
    const data = fs.readFileSync(imgPath).toString('base64');
    const ext = path.extname(imgPath).toLowerCase().replace('.', '');
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    return { inlineData: { mimeType, data } };
  };

  let beforeData, afterData;
  try {
    beforeData = toInlineData(beforePath);
    afterData = toInlineData(afterPath);
  } catch (err) {
    console.warn('⚠️  Could not read comparison images, using mock:', err.message);
    return mockComparison(issueType);
  }

  const prompt = `You are verifying if a civic issue has been resolved.
Issue type: ${issueType}

The FIRST image is the BEFORE (the problem), the SECOND image is the AFTER (the fix).
Evaluate specifically:
- Has the pothole disappeared?
- Has the garbage been removed?
- Has the water leakage stopped?
- Has the damaged streetlight been repaired?
- Has infrastructure damage been repaired?

IGNORE camera angle, lighting, shadows, weather, zoom levels, people, vehicles, and image quality differences.
Focus strictly on whether the civic issue itself has been resolved.

CRITICAL: If the images are clearly fake, completely unrelated to each other, or do not show a real civic issue being repaired, you MUST return "Not Resolved" with a 0% resolution percentage.

Return ONLY this JSON:
{
  "resolutionPercentage": <0 to 100 integer>,
  "verdict": "<Fully Resolved | Partially Resolved | Not Resolved>",
  "improvement": "<describe what changed>",
  "remainingIssues": "<describe any remaining problems, or 'None' if fully resolved>",
  "confidence": <0.0 to 1.0>,
  "estimatedReward": <integer representing points awarded for this fix (e.g., 50-250)>,
  "summary": "<Short summary of the resolution for display>"
}

Do not include markdown tags like \`\`\`json, just return raw JSON.`;

  try {
    const result = await model.generateContent([
      prompt,
      beforeData,
      afterData
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Cannot parse comparison response JSON');
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.confidence != null) {
       parsed.confidence = Math.min(Number(parsed.confidence.toFixed(2)), 0.99);
    }
    return parsed;
  } catch (err) {
    console.warn('⚠️  Gemini comparison API call failed, using mock:', err.message);
    return mockComparison(issueType);
  }
}

function mockComparison(issueType, category, severity) {
  let mockVerdict = 'partially_resolved';
  if (Math.random() > 0.3) {
    mockVerdict = 'resolved';
  } else if (Math.random() < 0.1) {
    mockVerdict = 'not_resolved';
  }

  let mockPercentage = 50;
  if (mockVerdict === 'resolved') {
    mockPercentage = 80 + Math.floor(Math.random() * 20);
  } else if (mockVerdict === 'not_resolved') {
    mockPercentage = Math.floor(Math.random() * 20);
  } else {
    mockPercentage = 30 + Math.floor(Math.random() * 40);
  }

  const baseReward = calculateSolveReward(category, severity, mockVerdict);

  const mockResponse = {
    resolutionPercentage: mockPercentage,
    verdict: mockVerdict,
    improvement: `The ${issueType || 'reported issue'} shows ${mockPercentage}% improvement after the intervention.`,
    remainingIssues: mockVerdict === 'resolved' ? 'None' : 'Additional work is required to fully resolve the issue.',
    confidence: Math.min(Number((0.82 + Math.random() * 0.15).toFixed(2)), 0.99),
    aiProvider: 'mock',
    estimatedReward: baseReward,
    summary: `${mockVerdict.replace('_', ' ')} (${mockPercentage}%). ${mockVerdict === 'resolved' ? 'Great job resolving the issue.' : 'Issue is still pending complete resolution.'}`
  };
  return mockResponse;
}

module.exports = { analyseImage, compareBeforeAfter };
