'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/init');
const { optionalAuth } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to map DB issues to the five categories
function mapIssueType(dbType, dbCategory) {
  const text = ((dbType || '') + ' ' + (dbCategory || '')).toLowerCase();
  if (text.includes('pothole') || text.includes('road') || text.includes('crack') || text.includes('blockage') || text.includes('collapsed') || text.includes('traffic')) {
    return 'Pothole';
  }
  if (text.includes('water') || text.includes('leak') || text.includes('drain') || text.includes('pipe') || text.includes('sewer') || text.includes('flood') || text.includes('logging')) {
    return 'Water Leakage';
  }
  if (text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('dump') || text.includes('accumulation') || text.includes('unhygienic') || text.includes('urinal') || text.includes('unsanitary')) {
    return 'Garbage';
  }
  if (text.includes('light') || text.includes('wiring') || text.includes('electricity') || text.includes('pole') || text.includes('power') || text.includes('streetlight')) {
    return 'Streetlights';
  }
  return 'Infrastructure';
}

function getSeverityScore(sev) {
  const s = (sev || 'medium').toLowerCase();
  if (s === 'critical') return 5;
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  if (s === 'low') return 1;
  return 2;
}

// GET /api/heatmap
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { city } = req.query;

    let query = `
      SELECT i.*, 
             (SELECT COUNT(*) FROM reports r WHERE r.issue_id = i.id) as report_count
      FROM issues i
      LEFT JOIN users u ON i.reporter_id = u.id
      WHERE i.status != 'pending'
    `;
    const params = [];

    if (city) {
      params.push(`%${city.toLowerCase()}%`);
      query += ` AND (LOWER(i.address) LIKE $1 OR LOWER(u.city) LIKE $1)`;
    }

    const result = await db.query(query, params);
    
    const formatted = result.rows.map(issue => {
      const type = mapIssueType(issue.type, issue.category);
      const reports = Math.max(1, issue.reporter_count || parseInt(issue.report_count, 10) || 1);
      const severity = (issue.severity || 'Medium');
      let sevLabel = 'Medium';
      if (severity.toLowerCase() === 'high') sevLabel = 'High';
      else if (severity.toLowerCase() === 'critical') sevLabel = 'Critical';
      else if (severity.toLowerCase() === 'low') sevLabel = 'Low';

      return {
        lat: parseFloat(issue.lat) || 0,
        lng: parseFloat(issue.lng) || 0,
        type,
        severity: sevLabel,
        reports,
        created_at: issue.created_at
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Heatmap fetch error:', err);
    res.status(500).json({ error: 'Could not fetch heatmap data' });
  }
});

// GET /api/heatmap/insights
router.get('/insights', optionalAuth, async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ error: 'City query parameter is required' });
    }

    // Fetch verified issues for this city
    let query = `
      SELECT i.*, 
             (SELECT COUNT(*) FROM reports r WHERE r.issue_id = i.id) as report_count
      FROM issues i
      LEFT JOIN users u ON i.reporter_id = u.id
      WHERE i.status != 'pending'
      AND (LOWER(i.address) LIKE $1 OR LOWER(u.city) LIKE $1)
    `;
    const result = await db.query(query, [`%${city.toLowerCase()}%`]);

    const formattedIssues = result.rows.map(issue => ({
      title: issue.title,
      type: mapIssueType(issue.type, issue.category),
      address: issue.address,
      severity: issue.severity,
      reports: Math.max(1, issue.reporter_count || parseInt(issue.report_count, 10) || 1)
    }));

    if (formattedIssues.length === 0) {
      return res.json({
        insights: [
          `No active reports in ${city} at the moment. Keep up the clean work, Hero!`,
          `Sufficient data is required to run predictive analysis. Report local anomalies to seed the database.`
        ]
      });
    }

    // Try Gemini API if key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const issuesSummary = formattedIssues.map((issue, index) => 
          `${index + 1}. [${issue.type}] at ${issue.address} - Severity: ${issue.severity}, Reports: ${issue.reports}`
        ).join('\n');

        const prompt = `You are a professional urban planner and civic planning AI assistant.
Analyze these issues reported by citizens in the city of ${city}:
${issuesSummary}

Generate exactly 2 high-quality, professional, actionable predictive insights or recommendations for the city authorities (1-2 sentences each). Focus on patterns, hotspots, or areas of concern.
Example output format:
[
  "This ward has recurring pothole reports near Bypass Road. Road resurfacing is recommended to prevent vehicular damage.",
  "Garbage complaints are increasing near the railway station. Increase waste collection frequency to twice daily."
]

Make sure the output is a valid JSON array of strings only. Do not include any markdown format, markdown code block backticks (like \`\`\`json), or conversational text. Return only the raw JSON.`;

        const response = await model.generateContent(prompt);
        let text = response.response.text().trim();
        
        // Clean markdown code blocks if any
        if (text.startsWith('```')) {
          text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        }

        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return res.json({ insights: parsed });
          }
        } catch (jsonErr) {
          console.warn('Gemini response was not valid JSON, returning fallback parser:', jsonErr);
        }
      } catch (geminiErr) {
        console.warn('Gemini generative prediction failed, falling back:', geminiErr.message);
      }
    }

    // Fallback static-smart insights if Gemini is unavailable or fails
    const localInsights = generateLocalInsights(formattedIssues);
    res.json({ insights: localInsights });

  } catch (err) {
    console.error('Heatmap insights error:', err);
    res.status(500).json({ error: 'Could not generate heatmap insights' });
  }
});

function generateLocalInsights(issues) {
  const insights = [];
  const typeCounts = {};
  const locationCounts = {};
  
  issues.forEach(issue => {
    typeCounts[issue.type] = (typeCounts[issue.type] || 0) + 1;
    const loc = issue.address || 'Central District';
    const landmark = loc.split(',')[0] || 'Main Area';
    locationCounts[landmark] = (locationCounts[landmark] || 0) + 1;
  });

  // Find top issue type
  let topType = 'Pothole';
  let maxTypeCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxTypeCount) {
      maxTypeCount = count;
      topType = type;
    }
  }

  // Find top location
  let topLoc = 'Main Street';
  let maxLocCount = 0;
  for (const [loc, count] of Object.entries(locationCounts)) {
    if (count > maxLocCount) {
      maxLocCount = count;
      topLoc = loc;
    }
  }

  if (topType === 'Pothole') {
    insights.push(`This ward has recurring pothole reports near ${topLoc}. Road resurfacing is recommended.`);
  } else if (topType === 'Water Leakage') {
    insights.push(`Frequent water leakage reports near ${topLoc} suggest deteriorating underground pipeline network. Pressure testing recommended.`);
  } else if (topType === 'Garbage') {
    insights.push(`Garbage complaints are increasing near ${topLoc}. We recommend increasing waste collection frequency to twice daily in this sector.`);
  } else if (topType === 'Streetlights') {
    insights.push(`Multiple streetlights are reported broken near ${topLoc}. Exposure of electrical wiring represents a public hazard; immediate deployment of field electrical crew is advised.`);
  } else {
    insights.push(`A cluster of civic issues has been identified near ${topLoc}. Inter-departmental coordination is recommended to clean and repair the area.`);
  }

  // Add a second insight
  const secondaryIssues = issues.filter(i => i.type !== topType);
  if (secondaryIssues.length > 0) {
    const secType = secondaryIssues[0].type;
    const secLoc = secondaryIssues[0].address.split(',')[0] || 'Railway Station area';
    if (secType === 'Garbage') {
      insights.push(`Garbage complaints are increasing near ${secLoc}. Increase waste collection frequency.`);
    } else if (secType === 'Streetlights') {
      insights.push(`Dark spots identified near ${secLoc} due to faulty streetlights. Recommend installing solar LED streetlights.`);
    } else if (secType === 'Water Leakage') {
      insights.push(`Minor water logged spots near ${secLoc} require immediate drainage clearance before the monsoon.`);
    } else {
      insights.push(`Inspect civic infrastructure safety near ${secLoc} to address user reports.`);
    }
  } else {
    insights.push(`Overall report volume is rising near ${topLoc}. Regular sanitation drives should be scheduled weekly.`);
  }

  return insights;
}

module.exports = router;
