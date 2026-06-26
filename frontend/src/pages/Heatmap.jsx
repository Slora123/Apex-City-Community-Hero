import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import {
  Shield,
  Activity,
  MapPin,
  Home,
  Map as MapIcon,
  CheckSquare,
  Scroll,
  Trophy,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';

const NAV_ITEMS = [
  { Icon: Home,         label: 'Home',        path: '/dashboard' },
  { Icon: MapIcon,      label: 'Map',         path: '/map' },
  { Icon: CheckSquare,  label: 'Mission',     path: '/missions' },
  { Icon: Scroll,       label: 'Report',      path: '/report' },
  { Icon: Activity,     label: 'Impact',      path: '/impact' },
  { Icon: MapPin,       label: 'Heatmap',     path: '/heatmap' },
  { Icon: Trophy,       label: 'Leaderboard', path: '/leaderboard' },
];

export default function Heatmap() {
  const navigate = useNavigate();
  const location = useLocation();
  const { missions } = useGame();

  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const getDistrictMissions = (districtName) => {
    return missions.filter(m => m.location === districtName);
  };

  const getDistrictStatus = (districtName) => {
    const distMissions = getDistrictMissions(districtName);
    if (distMissions.length === 0) return 'clear';
    if (distMissions.some(m => m.status === 'pending')) return 'pending';
    if (distMissions.some(m => m.status === 'available')) return 'warning';
    return 'resolved';
  };

  const totalResolved = missions.filter(m => m.status === 'completed').length;
  const totalActive = missions.filter(m => m.status === 'available' || m.status === 'pending').length;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#2D1B13',
      backgroundImage: "url('/map_bg.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: '24px 16px 110px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontFamily: "'Inter', sans-serif",
      color: '#F4E8C1',
      boxSizing: 'border-box'
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap');
        
        .medieval-font {
          font-family: 'MedievalSharp', serif;
        }

        .wood-panel {
          background-color: #3e2723;
          background-image: url('/panel_bg.png');
          background-size: 100% 100%;
          border: 6px double #8B5E34;
          border-radius: 16px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.85);
          padding: 28px 20px 24px 20px;
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .stone-header {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: #7F7F7F;
          background-image: linear-gradient(135deg, #8A8A8A 0%, #5E5E5E 100%);
          border: 3px solid #3C3C3C;
          border-radius: 12px;
          padding: 10px 24px;
          color: #FFF;
          font-family: 'MedievalSharp', serif;
          font-size: 1.25rem;
          font-weight: 900;
          text-shadow: 2px 2px 0 #000;
          box-shadow: 0 5px 12px rgba(0,0,0,0.6);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 10;
        }

        .tab-btn {
          flex: 1;
          background: #5C4033;
          border: 2px solid #3E2D24;
          color: #B3A387;
          font-family: 'MedievalSharp', serif;
          font-size: 0.88rem;
          font-weight: bold;
          padding: 10px 0;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .tab-btn--active {
          background: #F4E8C1;
          color: #2D1B13;
          border-color: #5A4B3D;
          box-shadow: inset 0 0 10px rgba(139,94,52,0.3);
        }
        .tab-btn:first-child { border-radius: 8px 0 0 8px; }
        .tab-btn:nth-child(2) { border-left: none; border-right: none; }
        .tab-btn:last-child { border-radius: 0 8px 8px 0; }

        .parchment-container {
          background: #F4E8C1;
          border: 3px solid #5A4B3D;
          border-radius: 12px;
          color: #2D1B13;
          padding: 16px 12px;
          box-shadow: inset 0 0 15px rgba(139,94,52,0.25), 0 4px 8px rgba(0,0,0,0.3);
          max-height: 450px;
          overflow-y: auto;
        }

        @keyframes pulse-red {
          0% { r: 6; opacity: 0.8; }
          50% { r: 16; opacity: 0.4; }
          100% { r: 24; opacity: 0; }
        }
        @keyframes pulse-yellow {
          0% { r: 6; opacity: 0.8; }
          50% { r: 14; opacity: 0.4; }
          100% { r: 20; opacity: 0; }
        }
        .heatmap-pulse-red { animation: pulse-red 2s infinite ease-out; }
        .heatmap-pulse-yellow { animation: pulse-yellow 2s infinite ease-out; }
      `}</style>

      <div className="wood-panel" style={{ marginTop: '24px' }}>
        
        <div className="stone-header">
          <MapPin size={18} strokeWidth={2.5} />
          <span className="medieval-font">District Heatmap</span>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: '#C4A484',
            cursor: 'pointer',
            outline: 'none',
            zIndex: 10
          }}
        >
          <X size={26} />
        </button>



        <div className="parchment-container" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#5A4B3D', borderBottom: '2.5px solid #5A4B3D', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Interactive Anomaly Densities
          </div>

          {/* HEATMAP SCHEMA INTERACTIVE SVG */}
          <div style={{ background: '#EEDC82', border: '3.5px double #8B5E34', borderRadius: '10px', padding: '6px', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.15)', position: 'relative' }}>
            
            <svg viewBox="0 0 400 300" width="100%">
              <rect x="180" y="20" width="40" height="260" fill="#E6D3B3" />
              <rect x="40" y="130" width="320" height="40" fill="#E6D3B3" />
              
              <path d="M0,240 C100,240 150,180 200,180 C250,180 300,260 400,260 L400,285 L0,285 Z" fill="#4CC9F0" opacity="0.45" />
              <text x="80" y="270" fill="#2B4E6B" fontSize="9" fontWeight="bold" fontStyle="italic" opacity="0.6">Glistening Stream</text>

              {/* Districts */}
              <rect x="170" y="120" width="60" height="60" rx="6" fill="#D2B48C" stroke="#8B7E66" strokeWidth="2.5" />
              <text x="200" y="154" fill="#3E2723" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="'MedievalSharp', serif">Market</text>

              <circle cx="90" cy="80" r="28" fill="#B2C9A8" stroke="#8B7E66" strokeWidth="2" />
              <text x="90" y="83" fill="#3E2723" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="'MedievalSharp', serif">Fountain</text>

              <rect x="270" y="190" width="55" height="42" rx="4" fill="#C0A98F" stroke="#8B7E66" strokeWidth="2" />
              <text x="297" y="214" fill="#3E2723" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="'MedievalSharp', serif">Blacksmith</text>

              <polygon points="290,90 330,90 310,60" fill="#9C512A" stroke="#8B7E66" strokeWidth="2" />
              <rect x="290" y="90" width="40" height="25" fill="#C0A98F" stroke="#8B7E66" strokeWidth="2" />
              <text x="310" y="105" fill="#3E2723" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="'MedievalSharp', serif">Guild Hall</text>

              {/* Heatspots */}
              {['warning', 'pending'].includes(getDistrictStatus('Market Square')) && (
                <g onClick={() => setSelectedDistrict('Market Square')} style={{ cursor: 'pointer' }}>
                  <circle cx="200" cy="150" r="18" fill="#B53F3F" opacity="0.3" className="heatmap-pulse-red" />
                  <circle cx="200" cy="150" r="8" fill="#B53F3F" stroke="#FFF" strokeWidth="1.5" />
                </g>
              )}
 
              {['warning', 'pending'].includes(getDistrictStatus('Fountain Plaza')) && (
                <g onClick={() => setSelectedDistrict('Fountain Plaza')} style={{ cursor: 'pointer' }}>
                  <circle cx="90" cy="80" r="14" fill="#ECC94B" opacity="0.3" className="heatmap-pulse-yellow" />
                  <circle cx="90" cy="80" r="8" fill="#ECC94B" stroke="#FFF" strokeWidth="1.5" />
                </g>
              )}
 
              {['warning', 'pending'].includes(getDistrictStatus('Blacksmith Lane')) && (
                <g onClick={() => setSelectedDistrict('Blacksmith Lane')} style={{ cursor: 'pointer' }}>
                  <circle cx="297" cy="210" r="18" fill="#B53F3F" opacity="0.3" className="heatmap-pulse-red" />
                  <circle cx="297" cy="210" r="8" fill="#B53F3F" stroke="#FFF" strokeWidth="1.5" />
                </g>
              )}

              {/* Inspect Buttons */}
              <g onClick={() => setSelectedDistrict('Market Square')} style={{ cursor: 'pointer' }}>
                <rect x="175" y="115" width="50" height="12" rx="3" fill="#2E2018" opacity="0.8" />
                <text x="200" y="124" fill="#FFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">Inspect</text>
              </g>
              <g onClick={() => setSelectedDistrict('Fountain Plaza')} style={{ cursor: 'pointer' }}>
                <rect x="65" y="45" width="50" height="12" rx="3" fill="#2E2018" opacity="0.8" />
                <text x="90" y="54" fill="#FFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">Inspect</text>
              </g>
              <g onClick={() => setSelectedDistrict('Blacksmith Lane')} style={{ cursor: 'pointer' }}>
                <rect x="272" y="172" width="50" height="12" rx="3" fill="#2E2018" opacity="0.8" />
                <text x="297" y="181" fill="#FFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">Inspect</text>
              </g>
            </svg>
          </div>

          {/* District details */}
          {selectedDistrict ? (
            <div style={{
              background: '#EEDC82',
              border: '2.5px solid #8B5E34',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              color: '#2D1B13'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px dashed rgba(90,75,61,0.3)', paddingBottom: '6px', marginBottom: '8px' }}>
                <span className="medieval-font" style={{ fontWeight: 900, fontSize: '1.05rem' }}>
                  {selectedDistrict} District
                </span>
                <button
                  onClick={() => setSelectedDistrict(null)}
                  style={{ background: 'transparent', border: 'none', color: '#5C4033', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getDistrictMissions(selectedDistrict).length === 0 ? (
                  <span style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#5C4A38' }}>
                    No active anomalies cataloged in this district!
                  </span>
                ) : (
                  getDistrictMissions(selectedDistrict).map(m => {
                    let badgeColor = '#E53E3E';
                    let statusText = 'Active Anomaly';
                    if (m.status === 'pending') {
                      badgeColor = '#ECC94B';
                      statusText = 'Pending Verify';
                    } else if (m.status === 'completed') {
                      badgeColor = '#48BB78';
                      statusText = 'Resolved';
                    }

                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'rgba(255,255,255,0.4)', borderRadius: '6px', padding: '6px 8px', border: '1px solid rgba(139,94,52,0.25)' }}>
                        <span style={{ fontWeight: 800 }}>{m.title}</span>
                        <span style={{
                          background: badgeColor,
                          color: badgeColor === '#ECC94B' ? '#5C4033' : '#FFF',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          {statusText}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {getDistrictMissions(selectedDistrict).some(m => m.status === 'pending') && (
                <button
                  onClick={() => navigate('/authority')}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    background: '#2E6B2A',
                    color: '#FFF',
                    border: '1.5px solid #1C4519',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Inspect Pending Verifications</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#5C4A38', fontStyle: 'italic', fontWeight: 600 }}>
              Tap any glowing hotspot or label to inspect active anomalies.
            </div>
          )}
        </div>

        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          fontWeight: 700,
          borderTop: '2.5px solid #5C4033',
          paddingTop: '12px'
        }}>
          <span>Active Alerts: {totalActive}</span>
          <span style={{ color: '#ECC94B', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={16} />
            <span>Resolving Rate: {missions.length > 0 ? Math.round((totalResolved / missions.length) * 100) : 0}%</span>
          </span>
        </div>
      </div>

      <nav className="home-bottom-nav" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map(({ Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={label}
              id={`nav-${label.toLowerCase()}`}
              onClick={() => navigate(path)}
              className={`home-nav-btn${active ? ' home-nav-btn--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
