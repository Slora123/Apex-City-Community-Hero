import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getStats } from '../api';
import BottomNav from '../components/BottomNav';
import {
  Wrench,
  Shield,
  Trophy,
  Activity,
  Zap,
  X,
  Search
} from 'lucide-react';

export default function ImpactDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { missions } = useGame();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(data => setStats(data)).catch(() => {});
  }, []);

  const overview = stats?.overview || {};
  const impact = stats?.impact || {};
  const trend = stats?.monthlyTrend || [];
  const byCategory = stats?.byCategory || [];
  const dailyReports = stats?.dailyReports || [0,0,0,0,0,0,0];
  const topContributors = stats?.topContributors || [];
  const bySeverity = stats?.bySeverity || [];

  // Card 1: Total Reports (Bar Chart)
  const getBarData = () => {
    if (!byCategory.length) return [0,0,0,0,0,0].map((v,i) => ({ val: v, label: String.fromCharCode(65+i) }));
    return byCategory.slice(0, 6).map(c => ({ val: c.total || 0, label: (c.type || '').replace('_',' ').slice(0,3) }));
  };
  const maxBarVal = Math.max(...(byCategory.map(c => c.total || 0)), 5);
  const chartMax = Math.ceil(maxBarVal / 5) * 5;

  // Card 2: Assigned Heroes (Bar Chart)
  const dailyMax = Math.max(...dailyReports, 5);
  const dailyChartMax = Math.ceil(dailyMax / 5) * 5;

  // Card 3: Aslra Heroes (Top Contributors XP Spline)
  const contributorsXP = Array(7).fill(0);
  topContributors.slice(0, 7).forEach((u, idx) => {
    contributorsXP[idx] = u.xp || 0;
  });
  const maxXP = Math.max(...contributorsXP, 5000);
  const xpChartMax = Math.ceil(maxXP / 1000) * 1000;
  const xCoords = [36, 62, 88, 114, 146, 178, 210];
  const points = xCoords.map((x, idx) => {
    const xp = contributorsXP[idx];
    const y = 135 - (xp / xpChartMax) * 120;
    return { x, y };
  });
  const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  const areaPath = `M ${points[0].x} 135 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} 135 Z`;

  // Card 4: Aulos Haws (Monthly Trend Spline)
  const monthlyReported = Array(6).fill(0);
  const monthlyLabels = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  trend.slice(0, 6).forEach((t, idx) => {
    monthlyReported[idx] = t.reported || 0;
    if (t.month) {
      const date = new Date(t.month + '-02');
      const shortMonth = date.toLocaleString('en-US', { month: 'short' });
      monthlyLabels[idx] = shortMonth;
    }
  });
  const maxMonthly = Math.max(...monthlyReported, 5);
  const monthlyChartMax = Math.ceil(maxMonthly / 5) * 5;
  const xCoordsMonthly = [36, 70, 104, 138, 172, 210];
  const monthlyPoints = xCoordsMonthly.map((x, idx) => {
    const val = monthlyReported[idx];
    const y = 135 - (val / monthlyChartMax) * 120;
    return { x, y, fill: ['#2F80ED', '#27AE60', '#F2C94C', '#E08282', '#56CCF2', '#2F80ED'][idx] };
  });
  const monthlyLinePath = `M ${monthlyPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  const monthlyAreaPath = `M ${monthlyPoints[0].x} 135 L ${monthlyPoints.map(p => `${p.x} ${p.y}`).join(' L ')} L ${monthlyPoints[monthlyPoints.length - 1].x} 135 Z`;

  // Card 6: News Lousage Trend (Severity Breakdown Bar Chart)
  const lowCount = bySeverity.find(s => s.severity === 'low')?.count || 0;
  const medCount = bySeverity.find(s => s.severity === 'medium')?.count || 0;
  const highCount = (bySeverity.find(s => s.severity === 'high')?.count || 0) + (bySeverity.find(s => s.severity === 'critical')?.count || 0);
  const severityMax = Math.max(lowCount, medCount, highCount, 5);
  const severityChartMax = Math.ceil(severityMax / 5) * 5;

  return (
    <div className="impact-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=Cinzel:wght@700;900&display=swap');
        
        .medieval-font {
          font-family: 'MedievalSharp', serif;
        }
        .cinzel-font {
          font-family: 'Cinzel', serif;
        }

        /* Page wrapper with immersive ambient lighting */
        .impact-page-wrapper {
          min-height: 100vh;
          background-color: #1A100A;
          background-image: radial-gradient(circle, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%), url('/map_bg.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          box-sizing: border-box;
          padding: 24px 24px 110px 24px; /* Space at bottom for BottomNav */
          color: #F4E8C1;
          font-family: 'Inter', sans-serif;
        }

        /* Deep wood-paneled main window - now the primary screen container! */
        .wood-board {
          width: 100%;
          max-width: 1120px;
          background-color: #3C2A1E;
          background-image: url('/panel_bg.png');
          background-size: 100% 100%;
          border: 8px double #8B5E34;
          border-radius: 16px;
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          box-shadow: 
            inset 0 0 30px rgba(0, 0, 0, 0.8),
            0 15px 35px rgba(0, 0, 0, 0.6);
          box-sizing: border-box;
          position: relative;
          margin-top: 15px;
        }

        .wood-board-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-shrink: 0;
        }

        .wood-board-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: #F4E8C1;
          text-shadow: 1.5px 1.5px 0px #000;
          margin: 0;
          letter-spacing: 0.5px;
        }

        /* Parchment search pill matching 'Inforeviance' in screenshot */
        .search-pill {
          background: #EADCB9;
          border: 2px solid #5A4B3D;
          border-radius: 99px;
          color: #2D1B13;
          font-family: 'MedievalSharp', serif;
          font-weight: bold;
          font-size: 0.75rem;
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: inset 0 0 5px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .search-pill:hover {
          background: #FFF1CD;
          transform: translateY(-1px);
          box-shadow: inset 0 0 5px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.25);
        }

        /* 2x3 Grid layout for desktop, single column for mobile */
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          box-sizing: border-box;
          margin-bottom: 10px;
        }

        /* Parchment scroll paper cards */
        .parchment-card {
          background: #F4E8C1;
          background-image: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(139,94,52,0.04) 100%);
          border: 2.5px solid #5A4B3D;
          border-radius: 12px;
          color: #2D1B13;
          padding: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 
            inset 0 0 16px rgba(139,94,52,0.18),
            0 4px 8px rgba(0,0,0,0.3);
          box-sizing: border-box;
          position: relative;
          min-height: 250px;
          transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .parchment-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            inset 0 0 16px rgba(139,94,52,0.25),
            0 8px 16px rgba(0,0,0,0.4);
        }

        /* Hand-stitched inner borders */
        .parchment-card::before {
          content: '';
          position: absolute;
          inset: 4px;
          border: 1px dashed rgba(90, 75, 61, 0.35);
          border-radius: 8px;
          pointer-events: none;
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          border-bottom: 1.5px dashed rgba(90, 75, 61, 0.25);
          padding-bottom: 6px;
          z-index: 2;
          flex-shrink: 0;
        }

        .card-title {
          font-family: 'MedievalSharp', serif;
          font-weight: 900;
          font-size: 1.12rem;
          color: #2E2018;
          margin: 0;
          letter-spacing: 0.2px;
        }

        .card-icon-container {
          color: #8B5E34;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-body {
          flex: 1;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        /* Close Button Wax Seal */
        .close-wax-seal {
          position: absolute;
          top: -12px;
          right: -12px;
          background: #B53F3F;
          border: 2px solid #5A1F1F;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: #FFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 
            0 4px 8px rgba(0,0,0,0.4),
            inset 0 0 6px rgba(0,0,0,0.3);
          z-index: 20;
          transition: transform 0.2s ease, background-color 0.2s;
        }
        .close-wax-seal:hover {
          transform: scale(1.1) rotate(90deg);
          background-color: #C94F4F;
        }

        /* Mobile layout configurations (<= 900px) */
        @media (max-width: 900px) {
          .impact-page-wrapper {
            padding: 0;
            display: block;
            background-attachment: scroll;
          }
          .wood-board {
            margin: 0;
            border: none;
            border-radius: 0;
            padding: 20px 14px 100px 14px; /* Extra bottom padding for BottomNav */
            min-height: 100vh;
            box-shadow: none;
            margin-top: 0;
          }
          .wood-board-header {
            margin-bottom: 16px;
          }
          .wood-board-title {
            font-size: 1.25rem;
          }
          .dashboard-grid {
            grid-template-columns: 1fr; /* Single column stacking on mobile */
            gap: 16px;
          }
          .parchment-card {
            min-height: 240px; /* Ensure cards have ample height on mobile */
          }
          .close-wax-seal {
            top: 12px;
            right: 12px;
            position: fixed; /* Fixed relative to mobile screen */
          }
        }
      `}</style>

      {/* Main Wood Board Container */}
      <div className="wood-board">
        
        {/* Close Button Wax Seal */}
        <button
          onClick={() => navigate('/dashboard')}
          className="close-wax-seal"
          title="Return to City Dashboard"
          aria-label="Close"
        >
          <X size={16} strokeWidth={3} />
        </button>

        {/* Board Header (Title & Inforeviance Search Pill) */}
        <div className="wood-board-header">
          <h2 className="wood-board-title medieval-font">Professional community dashboard</h2>
          <div className="search-pill">
            <Search size={12} strokeWidth={2.5} />
            <span>Inforeviance</span>
          </div>
        </div>

        {/* 2x3 Grid of 6 SVG Graph Cards */}
        <div className="dashboard-grid">

          {/* CARD 1: TOTAL REPORTS (Cyan Bar Chart) */}
          <div className="parchment-card">
            <div className="card-header-row">
              <h3 className="card-title">Total Reports</h3>
              <div className="card-icon-container">
                <Wrench size={14} strokeWidth={2.5} />
              </div>
            </div>
            <div className="card-body">
              <svg viewBox="0 0 240 160" width="100%" height="100%">
                {[0, chartMax * 0.2, chartMax * 0.4, chartMax * 0.6, chartMax * 0.8, chartMax].map((val) => {
                  const y = 135 - (val * 120 / chartMax);
                  return (
                    <g key={val}>
                      <line x1="28" y1={y} x2="225" y2={y} stroke="#E3D5BA" strokeWidth="1" />
                      <text x="22" y={y + 3} fill="#5A4B3D" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="MedievalSharp">{Math.round(val)}</text>
                    </g>
                  );
                })}
                <line x1="28" y1="135" x2="225" y2="135" stroke="#5A4B3D" strokeWidth="2" />
                <line x1="28" y1="15" x2="28" y2="135" stroke="#5A4B3D" strokeWidth="2" />
                {getBarData().map((d, i) => {
                  const x = 38 + i * 31;
                  const barHeight = (d.val / chartMax) * 120;
                  const y = 135 - barHeight;
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width="18" height={barHeight} fill="#4CC9F0" stroke="#2D1B13" strokeWidth="1.5" rx="2" />
                      <text x={x + 9} y="147" fill="#5A4B3D" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">{d.label || String.fromCharCode(65+i)}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* CARD 2: ASSNED HEROES (Green Bar Chart) */}
          <div className="parchment-card">
            <div className="card-header-row">
              <h3 className="card-title">Assigned Heroes</h3>
              <div className="card-icon-container">
                <Shield size={14} strokeWidth={2.5} />
              </div>
            </div>
            <div className="card-body">
              <svg viewBox="0 0 240 160" width="100%" height="100%">
                {[0, dailyChartMax * 0.2, dailyChartMax * 0.4, dailyChartMax * 0.6, dailyChartMax * 0.8, dailyChartMax].map((val) => {
                  const y = 135 - (val * 120 / dailyChartMax);
                  return (
                    <g key={val}>
                      <line x1="28" y1={y} x2="225" y2={y} stroke="#E3D5BA" strokeWidth="1" />
                      <text x="22" y={y + 3} fill="#5A4B3D" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="MedievalSharp">{Math.round(val)}</text>
                    </g>
                  );
                })}
                <line x1="28" y1="135" x2="225" y2="135" stroke="#5A4B3D" strokeWidth="2" />
                <line x1="28" y1="15" x2="28" y2="135" stroke="#5A4B3D" strokeWidth="2" />
                {['Mo', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => {
                  const x = 38 + i * 31;
                  const val = dailyReports[i] || 0;
                  const barHeight = (val / dailyChartMax) * 120;
                  const y = 135 - barHeight;
                  return (
                    <g key={i}>
                      <rect 
                        x={x} 
                        y={y} 
                        width="18" 
                        height={barHeight} 
                        fill="#48BB78" 
                        stroke="#2D1B13" 
                        strokeWidth="1.5" 
                        rx="2" 
                      />
                      <text x={x + 9} y="147" fill="#5A4B3D" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">{label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* CARD 3: ASLRA HEROES (Spline Area Chart) */}
          <div className="parchment-card">
            <div className="card-header-row">
              <h3 className="card-title">Active Heroes</h3>
              <div className="card-icon-container">
                <Trophy size={14} strokeWidth={2.5} />
              </div>
            </div>
            <div className="card-body">
              <svg viewBox="0 0 240 160" width="100%" height="100%">
                <defs>
                  <linearGradient id="aslraGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#80E27E" stopOpacity="0.65"/>
                    <stop offset="50%" stopColor="#FFEB3B" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#F4E8C1" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {[0, xpChartMax * 0.2, xpChartMax * 0.4, xpChartMax * 0.6, xpChartMax * 0.8, xpChartMax].map((val) => {
                  const y = 135 - (val * 120 / xpChartMax);
                  return (
                    <g key={val}>
                      <line x1="28" y1={y} x2="225" y2={y} stroke="#E3D5BA" strokeWidth="1" />
                      <text x="22" y={y + 3} fill="#5A4B3D" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="MedievalSharp">{val >= 1000 ? (val / 1000) + 'k' : val}</text>
                    </g>
                  );
                })}
                <line x1="28" y1="135" x2="225" y2="135" stroke="#5A4B3D" strokeWidth="2" />
                <line x1="28" y1="15" x2="28" y2="135" stroke="#5A4B3D" strokeWidth="2" />
                {[1, 2, 3, 5, 8, 9, 10].map((num, idx) => (
                  <text key={num} x={xCoords[idx]} y="147" fill="#5A4B3D" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">{num}</text>
                ))}
                {contributorsXP.some(xp => xp > 0) && (
                  <>
                    <path d={areaPath} fill="url(#aslraGrad)" />
                    <path d={linePath} fill="none" stroke="#3D348B" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                )}
                {points.map((pt, idx) => (
                  <circle 
                    key={idx} 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4" 
                    fill={['#56CCF2', '#EB5757', '#F2994A', '#6FCF97', '#F2C94C', '#56CCF2', '#2D9CDB'][idx]} 
                    stroke="#3D348B" 
                    strokeWidth="1.5" 
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* CARD 4: AULOS HAWS (Spline Area Chart) */}
          <div className="parchment-card">
            <div className="card-header-row">
              <h3 className="card-title">Activity Hours</h3>
              <div className="card-icon-container">
                <Activity size={14} strokeWidth={2.5} />
              </div>
            </div>
            <div className="card-body">
              <svg viewBox="0 0 240 160" width="100%" height="100%">
                <defs>
                  <linearGradient id="aulosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4CC9F0" stopOpacity="0.65"/>
                    <stop offset="100%" stopColor="#F4E8C1" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {[0, monthlyChartMax * 0.25, monthlyChartMax * 0.5, monthlyChartMax * 0.75, monthlyChartMax].map((val) => {
                  const y = 135 - (val * 120 / monthlyChartMax);
                  return (
                    <g key={val}>
                      <line x1="28" y1={y} x2="225" y2={y} stroke="#E3D5BA" strokeWidth="1" />
                      <text x="22" y={y + 3} fill="#5A4B3D" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="MedievalSharp">{Math.round(val)}</text>
                    </g>
                  );
                })}
                <line x1="28" y1="135" x2="225" y2="135" stroke="#5A4B3D" strokeWidth="2" />
                <line x1="28" y1="15" x2="28" y2="135" stroke="#5A4B3D" strokeWidth="2" />
                {monthlyLabels.map((label, idx) => (
                  <text key={idx} x={xCoordsMonthly[idx]} y="147" fill="#5A4B3D" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">{label}</text>
                ))}
                {monthlyReported.some(r => r > 0) && (
                  <>
                    <path d={monthlyAreaPath} fill="url(#aulosGrad)" />
                    <path d={monthlyLinePath} fill="none" stroke="#8A3D8B" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                )}
                {monthlyPoints.map((pt, idx) => (
                  <circle 
                    key={idx} 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="3.5" 
                    fill={pt.fill} 
                    stroke="#8A3D8B" 
                    strokeWidth="1.2" 
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* CARD 5: REALM RESOLUTIONS (Radial Progress Gauge + Category Breakdown) */}
          <div className="parchment-card" style={{ justifyContent: 'flex-start' }}>
            <div className="card-header-row">
              <h3 className="card-title">Realm Resolutions</h3>
              <div className="card-icon-container">
                <Shield size={14} strokeWidth={2.5} />
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%', padding: '0 4px' }}>
              
              {/* Left Column: Radial Progress */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: '85px' }}>
                <div style={{ position: 'relative', width: '76px', height: '76px' }}>
                  <svg viewBox="0 0 100 100" width="76" height="76" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background Track */}
                    <circle cx="50" cy="50" r="42" stroke="#E3D5BA" strokeWidth="8" fill="none" />
                    {/* Active Progress */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      stroke="#2E6B2A" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeDasharray="263.89" 
                      strokeDashoffset={263.89 - (263.89 * Math.min(100, (overview.resolvedIssues || 0) * 10)) / 100}
                      strokeLinecap="round" 
                      style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                  </svg>
                  {/* Centered Shield Icon */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={22} color="#2E6B2A" fill="#E2F0D9" strokeWidth={2.5} />
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <span className="medieval-font" style={{ fontSize: '1.05rem', fontWeight: 900, color: '#2E6B2A', textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.6)' }}>
                    {overview.resolvedIssues || 0}/10
                  </span>
                  <div style={{ fontSize: '0.62rem', color: '#5A4B3D', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2px', marginTop: '1px' }}>
                    Weekly Goal
                  </div>
                </div>
              </div>

              {/* Right Column: Breakdown List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1.2, width: '100%' }}>
                {[
                  { label: 'Garbage', val: impact.wasteRemoved || 0, color: '#38A169' },
                  { label: 'Water Leak', val: impact.waterLeakagesFixed || 0, color: '#3182CE' },
                  { label: 'Streetlights', val: impact.streetlightsRestored || 0, color: '#D69E2E' },
                  { label: 'Infrastructure', val: impact.infrastructureResolved || 0, color: '#805AD5' }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      background: 'rgba(90, 75, 61, 0.05)', 
                      borderRadius: '6px', 
                      padding: '3px 8px', 
                      border: '1px solid rgba(90, 75, 61, 0.12)' 
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#5A4B3D', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="medieval-font" style={{ fontSize: '0.78rem', fontWeight: 'bold', color: item.color }}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* CARD 6: NEWS LOUSAGE TREND (Pill Counter Badge + Histogram) */}
          <div className="parchment-card">
            <div className="card-header-row">
              <h3 className="card-title">Severity Trend</h3>
              <div className="card-icon-container">
                <Trophy size={14} strokeWidth={2.5} />
              </div>
            </div>
            <div className="card-body" style={{ flexDirection: 'column' }}>
              <svg viewBox="0 0 240 140" width="100%" height="100%">
                {[0, severityChartMax * 0.25, severityChartMax * 0.5, severityChartMax * 0.75, severityChartMax].map((val) => {
                  const y = 120 - (val * 100 / severityChartMax);
                  return (
                    <g key={val}>
                      <line x1="28" y1={y} x2="225" y2={y} stroke="#E3D5BA" strokeWidth="1" />
                      <text x="22" y={y + 3} fill="#5A4B3D" fontSize="8.5" fontWeight="bold" textAnchor="end" fontFamily="MedievalSharp">{Math.round(val)}</text>
                    </g>
                  );
                })}
                <line x1="28" y1="120" x2="225" y2="120" stroke="#5A4B3D" strokeWidth="2" />
                <line x1="28" y1="10" x2="28" y2="120" stroke="#5A4B3D" strokeWidth="2" />
                {[
                  { label: 'Low', x: 44, val: lowCount, fill: '#4CC9F0' },
                  { label: 'Med', x: 108, val: medCount, fill: '#48BB78' },
                  { label: 'High', x: 172, val: highCount, fill: '#D4AF37' }
                ].map((d, i) => {
                  const barHeight = (d.val / severityChartMax) * 100;
                  const y = 120 - barHeight;
                  return (
                    <g key={i}>
                      <rect 
                        x={d.x} 
                        y={y} 
                        width="20" 
                        height={barHeight} 
                        fill={d.fill} 
                        stroke="#2D1B13" 
                        strokeWidth="2" 
                        rx="1.5" 
                      />
                      <text x={d.x + 10} y="132" fill="#5A4B3D" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">{d.label}</text>
                    </g>
                  );
                })}
                <g transform="translate(100, 20)">
                  <rect 
                    x="0" 
                    y="0" 
                    width="42" 
                    height="22" 
                    rx="11" 
                    fill="#A8E3F5" 
                    stroke="#2D9CDB" 
                    strokeWidth="2.5" 
                    style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.15))' }}
                  />
                  <text x="21" y="15" fill="#2D1B13" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">
                    {(overview.activeIssues || 0) + (overview.pendingIssues || 0)}
                  </text>
                  <text x="21" y="36" fill="#2D1B13" fontSize="10.5" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">Count</text>
                </g>
              </svg>
            </div>
          </div>

        </div>

        {/* Wood panel footer with real-time resolving rate */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.82rem',
          fontWeight: 800,
          borderTop: '2px solid #5C4033',
          paddingTop: '10px',
          color: '#F4E8C1',
          textShadow: '1px 1px 0px #000',
          fontFamily: "'MedievalSharp', serif",
          flexShrink: 0
        }}>
          <span>Active Alerts: {overview.pendingIssues ?? missions.filter(m => m.status !== 'completed').length}</span>
          <span style={{ color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Trophy size={14} strokeWidth={2} />
            <span>Resolved: {overview.resolvedIssues ?? 0} | Rate: {overview.resolutionRate ?? 0}%</span>
          </span>
        </div>

      </div>

      {/* Global Bottom Navigation Bar (Visible on all devices) */}
      <BottomNav />
    </div>
  );
}
