import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import {
  Wrench,
  Shield,
  Trophy,
  Activity,
  Zap,
  X,
  Search,
  Lock
} from 'lucide-react';

export default function AuthorityDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Access state
  const [passcode, setPasscode] = useState('');
  const [unlockedLocation, setUnlockedLocation] = useState(null);
  const [activeData, setActiveData] = useState(null); // Loaded dynamically from backend API!
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Passcode verification logic via secure POST fetch request to backend API
  const handleVerifyPasscode = async () => {
    const cleanInput = passcode.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter a passcode.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/authority/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ passcode: cleanInput })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUnlockedLocation(data.location);
        setActiveData(data.telemetry);
      } else {
        setErrorMsg(data.error || 'The gatekeeper frowns. That passcode is unrecognized.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the gatekeeper server. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Heatmap 1 Cells calculation for Card 2 (Scalar Traybing - 10x10 grid)
  const renderScalarGrid = () => {
    if (!activeData) return null;
    const rows = 10;
    const cols = 10;
    const cells = [];
    const { r: centerR, c: centerC } = activeData.scalarHotspot;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = Math.sqrt(Math.pow(r - centerR, 2) + Math.pow(c - centerC, 2));
        let fill = '#7BE099'; // Green (default)
        if (dist < 1.4) {
          fill = '#C93F3F'; // Red (hotspot peak)
        } else if (dist < 2.3) {
          fill = '#EB5757'; // Orange-Red
        } else if (dist < 3.6) {
          fill = '#F2994A'; // Orange
        } else if (dist < 4.8) {
          fill = '#F2C94C'; // Yellow
        } else if (dist < 5.8) {
          fill = '#DCE67B'; // Yellow-Green
        }

        cells.push(
          <rect
            key={`scalar-${r}-${c}`}
            x={c * 15.5 + 30}
            y={r * 11 + 12}
            width="14.5"
            height="10"
            fill={fill}
            stroke="#2D1B13"
            strokeWidth="0.8"
          />
        );
      }
    }
    return cells;
  };

  // Heatmap 2 Cells calculation for Card 4 (AFFILIATTE ANALYSIES - 20x8 grid)
  const renderAffiliateGrid = () => {
    if (!activeData) return null;
    const rows = 8;
    const cols = 20;
    const cells = [];
    const { r: centerR, c: centerC } = activeData.affiliateHotspot;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Stretched horizontally
        const dist = Math.sqrt(Math.pow(r - centerR, 2) + Math.pow((c - centerC) * 0.52, 2));
        let fill = '#7BE099'; // Green (default)
        if (dist < 1.2) {
          fill = '#C93F3F'; // Red
        } else if (dist < 2.0) {
          fill = '#EB5757'; // Orange-Red
        } else if (dist < 3.5) {
          fill = '#F2994A'; // Orange
        } else if (dist < 5.0) {
          fill = '#F2C94C'; // Yellow
        } else if (dist < 6.5) {
          fill = '#DCE67B'; // Yellow-Green
        }

        cells.push(
          <rect
            key={`affiliate-${r}-${c}`}
            x={c * 9.2 + 34}
            y={r * 11 + 10}
            width="8.2"
            height="10"
            fill={fill}
            stroke="#2D1B13"
            strokeWidth="0.8"
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className="authority-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=Cinzel:wght@700;900&display=swap');
        
        .medieval-font {
          font-family: 'MedievalSharp', serif;
        }
        .cinzel-font {
          font-family: 'Cinzel', serif;
        }

        /* Page wrapper with immersive ambient lighting */
        .authority-page-wrapper {
          min-height: 100vh;
          background-color: #1A100A;
          background-image: radial-gradient(circle, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%), url('/map_bg.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
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

        .wide-card {
          grid-column: span 2;
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
          box-sizing: border-box;
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

        /* Card 1: View Reports Table Styles */
        .reports-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.72rem;
          color: #2D1B13;
          margin-top: 2px;
        }
        .reports-table th {
          background: #E1CE9F;
          color: #2D1B13;
          font-family: 'MedievalSharp', serif;
          font-weight: bold;
          text-align: left;
          padding: 4px 6px;
          border: 1.5px solid #5A4B3D;
        }
        .reports-table td {
          padding: 4px 6px;
          border: 1px solid rgba(90, 75, 61, 0.25);
          font-weight: 600;
        }
        .reports-table tr:nth-child(even) {
          background: rgba(90, 75, 61, 0.04);
        }
        .table-highlight {
          color: #B53F3F;
          font-weight: bold;
        }

        /* Card 1: Quick Action Button */
        .quick-action-btn {
          margin: 6px auto 0 auto;
          background: #E1CE9F;
          border: 2px solid #5A4B3D;
          border-radius: 99px;
          color: #2D1B13;
          font-family: 'MedievalSharp', serif;
          font-weight: bold;
          font-size: 0.72rem;
          padding: 4px 14px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
        }
        .quick-action-btn:hover {
          background: #FFF1CD;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        /* Mobile layout configurations (<= 900px) */
        @media (max-width: 900px) {
          .authority-page-wrapper {
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
          .wide-card {
            grid-column: span 1;
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

      {!unlockedLocation ? (
        /* PASSCODE GATE ENTRANCE PANEL */
        <div className="wood-board" style={{ maxWidth: '480px', padding: '32px 24px', margin: '40px auto 110px auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
            
            {/* Lock Circle Icon */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '3px solid #D4AF37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)'
            }}>
              <Lock size={26} color="#D4AF37" strokeWidth={2.5} />
            </div>

            <h2 className="wood-board-title medieval-font" style={{ fontSize: '1.35rem' }}>
              Authority Registry Gate
            </h2>
            
            <p style={{ fontSize: '0.84rem', color: '#B3A387', fontWeight: 600, lineHeight: 1.5 }}>
              Enter the municipal passcode of your district to access secure records and telemetry dashboards.
            </p>

            {/* Input Field Container */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setErrorMsg('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPasscode()}
                disabled={isLoading}
                placeholder="Enter Passcode"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#F4E8C1',
                  border: '2px solid #5A4B3D',
                  borderRadius: '8px',
                  color: '#2D1B13',
                  fontFamily: "'MedievalSharp', serif",
                  fontSize: '1.05rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  outline: 'none',
                  boxShadow: 'inset 0 0 5px rgba(0,0,0,0.18)'
                }}
              />
              {errorMsg && (
                <span style={{ color: '#B53F3F', fontSize: '0.78rem', fontWeight: 700, fontStyle: 'italic', marginTop: '2px' }}>
                  {errorMsg}
                </span>
              )}
            </div>

            {/* Unlock Button */}
            <button
              onClick={handleVerifyPasscode}
              disabled={isLoading}
              className="quick-action-btn"
              style={{
                width: '100%',
                padding: '12px 0',
                fontSize: '0.85rem',
                marginTop: '10px',
                background: '#5D8A46',
                border: '3px solid #2B4522',
                color: '#F4E8C1',
                boxShadow: '0 4px 0 #2B4522',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Unlocking Console...' : 'Unlock Console'}
            </button>
            
            {/* Return Link */}
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#B3A387',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              Return to Landing
            </button>
          </div>
        </div>
      ) : (
        /* UNLOCKED MUNICIPAL DASHBOARD PANEL */
        <div className="wood-board">
          
          {/* Close Button Wax Seal */}
          <button
            onClick={() => {
              setUnlockedLocation(null); // Lock it back when leaving
              setActiveData(null);
              setPasscode('');
              navigate('/');
            }}
            className="close-wax-seal"
            title="Lock and Return to Landing Page"
            aria-label="Close"
          >
            <X size={16} strokeWidth={3} />
          </button>

          {/* Board Header (Title showing District Sector & Inforeviance Search Pill) */}
          <div className="wood-board-header">
            <h2 className="wood-board-title medieval-font">Amplerify Dashboard - {unlockedLocation} Sector</h2>
            <div className="search-pill">
              <Search size={12} strokeWidth={2.5} />
              <span>Inforeviance</span>
            </div>
          </div>

          {/* 2x3 Grid of 5 SVG Graph Cards */}
          <div className="dashboard-grid">

            {/* CARD 1: VIEW REPORTS (Table Customised for district) */}
            <div className="parchment-card">
              <div className="card-header-row">
                <h3 className="card-title">View Reports</h3>
              </div>
              <div className="card-body" style={{ flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Event Barant</th>
                      <th>Finance</th>
                      <th>Resevent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeData.reports.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.label}</td>
                        <td className={row.finance.includes('%') ? 'table-highlight' : ''}>{row.finance}</td>
                        <td>{row.resevent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <button className="quick-action-btn">
                  Quick Action &rarr;
                </button>
              </div>
            </div>

            {/* CARD 2: SCALAR TRAYBING (10x10 Heatmap customized by location) */}
            <div className="parchment-card">
              <div className="card-header-row">
                <h3 className="card-title">Scalar Traybing</h3>
              </div>
              <div className="card-body" style={{ flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#5C4A38', alignSelf: 'flex-start', marginBottom: '2px' }}>View dresure</span>
                
                <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0 }}>
                  <svg viewBox="0 0 210 145" width="100%" height="100%">
                    {/* Grid Cells */}
                    {renderScalarGrid()}

                    {/* X-axis ticks */}
                    {[
                      { val: '1', x: 37 },
                      { val: '2', x: 53 },
                      { val: '4', x: 84 },
                      { val: '5', x: 99 },
                      { val: '6', x: 115 },
                      { val: '7', x: 130 },
                      { val: '8', x: 146 },
                      { val: '10', x: 177 }
                    ].map((tick) => (
                      <text key={tick.val} x={tick.x} y="132" fill="#5A4B3D" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">{tick.val}</text>
                    ))}

                    {/* Axis Labels */}
                    <text x="105" y="142" fill="#5A4B3D" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">Interface</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* CARD 3: SENTHIAN SEDTING (Double Spline Area Chart customized by location) */}
            <div className="parchment-card">
              <div className="card-header-row">
                <h3 className="card-title">Senthian Sedting</h3>
              </div>
              <div className="card-body">
                <svg viewBox="0 0 220 145" width="100%" height="100%">
                  <defs>
                    <linearGradient id="topLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2D9CDB" stopOpacity="0.45"/>
                      <stop offset="100%" stopColor="#2D9CDB" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="bottomLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#27AE60" stopOpacity="0.35"/>
                      <stop offset="100%" stopColor="#27AE60" stopOpacity="0"/>
                    </linearGradient>
                  </defs>

                  {/* Y-ticks */}
                  {[0, 20, 60, 90, 100, 300].map((val) => {
                    let y = 115;
                    if (val === 20) y = 98;
                    else if (val === 60) y = 78;
                    else if (val === 90) y = 58;
                    else if (val === 100) y = 38;
                    else if (val === 300) y = 15;

                    return (
                      <g key={val}>
                        <line x1="28" y1={y} x2="205" y2={y} stroke="#E3D5BA" strokeWidth="1" />
                        <text x="22" y={y + 3} fill="#5A4B3D" fontSize="8" fontWeight="bold" textAnchor="end" fontFamily="MedievalSharp">{val}</text>
                      </g>
                    );
                  })}
                  <line x1="28" y1="115" x2="205" y2="115" stroke="#5A4B3D" strokeWidth="1.5" />
                  <line x1="28" y1="10" x2="28" y2="115" stroke="#5A4B3D" strokeWidth="1.5" />

                  {/* X-ticks */}
                  {[
                    { label: 'Jul', x: 38 },
                    { label: 'Ueen', x: 71 },
                    { label: 'Sub', x: 104 },
                    { label: 'Jul', x: 137 },
                    { label: 'Erand', x: 170 },
                    { label: 'Just', x: 203 }
                  ].map((tick, idx) => (
                    <text key={idx} x={tick.x} y="126" fill="#5A4B3D" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">{tick.label}</text>
                  ))}

                  {/* Top Spline Curve Area Fill */}
                  <path
                    d={`M 38 115 L 38 ${115 - (activeData.senthianTop[0] * 95 / 300)} 
                       C 55 ${115 - (activeData.senthianTop[1] * 95 / 300)}, 55 ${115 - (activeData.senthianTop[2] * 95 / 300)}, 71 ${115 - (activeData.senthianTop[2] * 95 / 300)} 
                       C 87 ${115 - (activeData.senthianTop[2] * 95 / 300)}, 87 ${115 - (activeData.senthianTop[3] * 95 / 300)}, 104 ${115 - (activeData.senthianTop[3] * 95 / 300)} 
                       C 121 ${115 - (activeData.senthianTop[3] * 95 / 300)}, 121 ${115 - (activeData.senthianTop[4] * 95 / 300)}, 137 ${115 - (activeData.senthianTop[4] * 95 / 300)} 
                       C 154 ${115 - (activeData.senthianTop[4] * 95 / 300)}, 154 ${115 - (activeData.senthianTop[5] * 95 / 300)}, 170 ${115 - (activeData.senthianTop[5] * 95 / 300)} 
                       C 187 ${115 - (activeData.senthianTop[5] * 95 / 300)}, 187 ${115 - (activeData.senthianTop[5] * 1.1 * 95 / 300)}, 203 ${115 - (activeData.senthianTop[5] * 1.1 * 95 / 300)} L 203 115 Z`}
                    fill="url(#topLineGrad)"
                  />
                  {/* Top Spline Line */}
                  <path
                    d={`M 38 ${115 - (activeData.senthianTop[0] * 95 / 300)} 
                       C 55 ${115 - (activeData.senthianTop[1] * 95 / 300)}, 55 ${115 - (activeData.senthianTop[2] * 95 / 300)}, 71 ${115 - (activeData.senthianTop[2] * 95 / 300)} 
                       C 87 ${115 - (activeData.senthianTop[2] * 95 / 300)}, 87 ${115 - (activeData.senthianTop[3] * 95 / 300)}, 104 ${115 - (activeData.senthianTop[3] * 95 / 300)} 
                       C 121 ${115 - (activeData.senthianTop[3] * 95 / 300)}, 121 ${115 - (activeData.senthianTop[4] * 95 / 300)}, 137 ${115 - (activeData.senthianTop[4] * 95 / 300)} 
                       C 154 ${115 - (activeData.senthianTop[4] * 95 / 300)}, 154 ${115 - (activeData.senthianTop[5] * 95 / 300)}, 170 ${115 - (activeData.senthianTop[5] * 95 / 300)} 
                       C 187 ${115 - (activeData.senthianTop[5] * 95 / 300)}, 187 ${115 - (activeData.senthianTop[5] * 1.1 * 95 / 300)}, 203 ${115 - (activeData.senthianTop[5] * 1.1 * 95 / 300)}`}
                    fill="none"
                    stroke="#2D9CDB"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Bottom Spline Curve Area Fill */}
                  <path
                    d={`M 38 115 L 38 ${115 - (activeData.senthianBottom[0] * 95 / 300)} 
                       C 55 ${115 - (activeData.senthianBottom[1] * 95 / 300)}, 55 ${115 - (activeData.senthianBottom[2] * 95 / 300)}, 71 ${115 - (activeData.senthianBottom[2] * 95 / 300)} 
                       C 87 ${115 - (activeData.senthianBottom[2] * 95 / 300)}, 87 ${115 - (activeData.senthianBottom[3] * 95 / 300)}, 104 ${115 - (activeData.senthianBottom[3] * 95 / 300)} 
                       C 121 ${115 - (activeData.senthianBottom[3] * 95 / 300)}, 121 ${115 - (activeData.senthianBottom[4] * 95 / 300)}, 137 ${115 - (activeData.senthianBottom[4] * 95 / 300)} 
                       C 154 ${115 - (activeData.senthianBottom[4] * 95 / 300)}, 154 ${115 - (activeData.senthianBottom[5] * 95 / 300)}, 170 ${115 - (activeData.senthianBottom[5] * 95 / 300)} 
                       C 187 ${115 - (activeData.senthianBottom[5] * 95 / 300)}, 187 ${115 - (activeData.senthianBottom[5] * 0.9 * 95 / 300)}, 203 ${115 - (activeData.senthianBottom[5] * 0.9 * 95 / 300)} L 203 115 Z`}
                    fill="url(#bottomLineGrad)"
                  />
                  {/* Bottom Spline Line */}
                  <path
                    d={`M 38 ${115 - (activeData.senthianBottom[0] * 95 / 300)} 
                       C 55 ${115 - (activeData.senthianBottom[1] * 95 / 300)}, 55 ${115 - (activeData.senthianBottom[2] * 95 / 300)}, 71 ${115 - (activeData.senthianBottom[2] * 95 / 300)} 
                       C 87 ${115 - (activeData.senthianBottom[2] * 95 / 300)}, 87 ${115 - (activeData.senthianBottom[3] * 95 / 300)}, 104 ${115 - (activeData.senthianBottom[3] * 95 / 300)} 
                       C 121 ${115 - (activeData.senthianBottom[3] * 95 / 300)}, 121 ${115 - (activeData.senthianBottom[4] * 95 / 300)}, 137 ${115 - (activeData.senthianBottom[4] * 95 / 300)} 
                       C 154 ${115 - (activeData.senthianBottom[4] * 95 / 300)}, 154 ${115 - (activeData.senthianBottom[5] * 95 / 300)}, 170 ${115 - (activeData.senthianBottom[5] * 95 / 300)} 
                       C 187 ${115 - (activeData.senthianBottom[5] * 95 / 300)}, 187 ${115 - (activeData.senthianBottom[5] * 0.9 * 95 / 300)}, 203 ${115 - (activeData.senthianBottom[5] * 0.9 * 95 / 300)}`}
                    fill="none"
                    stroke="#27AE60"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Bottom text legend label */}
                  <text x="116" y="140" fill="#5A4B3D" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">Demand Cycle :</text>
                </svg>
              </div>
            </div>

            {/* CARD 4: AFFILIATTE ANALYSIES (Wide heatmap customized by location) */}
            <div className="parchment-card wide-card">
              <div className="card-header-row">
                <h3 className="card-title">AFFILIATTE ANALYSIES</h3>
              </div>
              <div className="card-body">
                <svg viewBox="0 0 250 145" width="100%" height="100%">
                  <defs>
                    <linearGradient id="legendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C93F3F"/>
                      <stop offset="35%" stopColor="#F2994A"/>
                      <stop offset="70%" stopColor="#F2C94C"/>
                      <stop offset="100%" stopColor="#7BE099"/>
                    </linearGradient>
                  </defs>

                  {/* Left Y Labels */}
                  {[
                    { val: '100 Cost', y: 15 },
                    { val: '75', y: 38 },
                    { val: '50 Second', y: 61 },
                    { val: '25 Values', y: 84 }
                  ].map((label) => (
                    <text key={label.val} x="30" y={label.y + 3} fill="#5A4B3D" fontSize="7" fontWeight="bold" textAnchor="end" fontFamily="MedievalSharp">{label.val}</text>
                  ))}

                  {/* Heatmap cells */}
                  {renderAffiliateGrid()}

                  {/* X Labels */}
                  {[
                    { val: '1', x: 38 },
                    { val: '2', x: 48 },
                    { val: '3', x: 57 },
                    { val: '4', x: 66 },
                    { val: '5', x: 75 },
                    { val: '6', x: 85 },
                    { val: '7', x: 94 },
                    { val: '10', x: 112 },
                    { val: '15', x: 130 },
                    { val: '20', x: 149 },
                    { val: '25', x: 167 },
                    { val: '30', x: 186 },
                    { val: '40', x: 204 },
                    { val: '40', x: 213 }
                  ].map((tick, idx) => (
                    <text key={idx} x={tick.x} y="112" fill="#5A4B3D" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">{tick.val}</text>
                  ))}

                  {/* Axis bottom label */}
                  <text x="126" y="125" fill="#5A4B3D" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">Values</text>

                  {/* Legend Color Bar */}
                  <rect x="232" y="10" width="8" height="88" fill="url(#legendGrad)" stroke="#2D1B13" strokeWidth="0.8" />
                  <line x1="240" y1="10" x2="243" y2="10" stroke="#5A4B3D" strokeWidth="1" />
                  <line x1="240" y1="54" x2="243" y2="54" stroke="#5A4B3D" strokeWidth="1" />
                  <line x1="240" y1="98" x2="243" y2="98" stroke="#5A4B3D" strokeWidth="1" />
                </svg>
              </div>
            </div>

            {/* CARD 5: COMMUNITY CONTRIBUTOR ANALYTICS (Bar Chart customized by location) */}
            <div className="parchment-card">
              <div className="card-header-row">
                <h3 className="card-title">Community Contributor Analytics</h3>
              </div>
              <div className="card-body">
                <svg viewBox="0 0 220 145" width="100%" height="100%">
                  {/* Horizontal gridlines & Y labels */}
                  {[0, 45, 90, 120, 150].map((val) => {
                    const y = 115 - (val * 95 / 150);
                    return (
                      <g key={val}>
                        <line x1="28" y1={y} x2="205" y2={y} stroke="#E3D5BA" strokeWidth="1" />
                        <text x="22" y={y + 3} fill="#5A4B3D" fontSize="8" fontWeight="bold" textAnchor="end" fontFamily="MedievalSharp">{val}</text>
                      </g>
                    );
                  })}
                  <line x1="28" y1="115" x2="205" y2="115" stroke="#5A4B3D" strokeWidth="1.5" />
                  <line x1="28" y1="10" x2="28" y2="115" stroke="#5A4B3D" strokeWidth="1.5" />

                  {/* Cyan bars matching customized data heights */}
                  {activeData.contributorBars.map((d, i) => {
                    const barHeight = d.val * 95 / 150;
                    const y = 115 - barHeight;
                    const barX = 38 + i * 29;
                    return (
                      <g key={i}>
                        <rect 
                          x={barX} 
                          y={y} 
                          width="14" 
                          height={barHeight} 
                          fill="#4CC9F0" 
                          stroke="#2D1B13" 
                          strokeWidth="1.8" 
                          rx="1" 
                        />
                        <text x={barX + 7} y="127" fill="#5A4B3D" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="MedievalSharp">{d.label}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Global Bottom Navigation Bar (Visible on all devices) */}
      <BottomNav />
    </div>
  );
}
