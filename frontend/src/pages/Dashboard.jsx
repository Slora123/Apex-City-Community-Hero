import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Home, Map, CheckSquare, User, Shield, Scroll, Activity, MapPin, Volume2, VolumeX } from 'lucide-react';

import BottomNav from '../components/BottomNav';

/* ── Issue colours / statuses pulled from missions context ─── */
function getIssueColor(status) {
  if (status === 'solved')   return '#48BB78'; // green
  if (status === 'pending')  return '#ECC94B'; // yellow
  return '#E53E3E';                            // red  (available / new)
}
function getIssueLabel(status) {
  if (status === 'solved')   return 'Resolved';
  if (status === 'pending')  return 'Under Verification';
  return 'Pending';
}

export default function Dashboard() {
  const { hero, missions, volume, setVolume, isMuted, setIsMuted } = useGame();
  const navigate   = useNavigate();
  const location   = useLocation();

  const xpPercent = Math.min(100, Math.round((hero.xp / 5000) * 100));

  const [showLogout, setShowLogout] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showLogout) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLogout(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLogout]);

  const getAvatarUrl = (avatar) => {
    if (!avatar) return '/avtar1.png';
    if (avatar === 'male' || avatar === '/avtar1.png') return '/avtar1.png';
    if (avatar === 'female' || avatar === '/avtar2.png') return '/avtar2.png';
    return avatar;
  };

  return (
    <div className="home-screen">

      {/* ════════════════════════════════════════════════
          TOP STATS CONTAINER (Three separate tabs)
      ════════════════════════════════════════════════ */}
      <div className="home-stats-container">
        {/* User Profile Header */}
        <div 
          ref={dropdownRef}
          onClick={() => setShowLogout(!showLogout)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '6px',
            paddingLeft: '4px',
            userSelect: 'none',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <img
            src={getAvatarUrl(hero.avatar)}
            alt="Hero Avatar"
            style={{
              height: '32px',
              width: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #8B5E34',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
            }}
          />
          <span style={{
            fontFamily: "'MedievalSharp', serif",
            fontWeight: '900',
            fontSize: '1.05rem',
            color: '#F4E8C1',
            textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
            letterSpacing: '0.5px'
          }}>{hero.name || 'Hero'}</span>

          {showLogout && (
            <div 
              style={{
                position: 'absolute',
                top: '40px',
                left: '0',
                backgroundColor: 'var(--panel-bg, #2D1B13)',
                border: '2px solid var(--panel-border, #8B5E34)',
                padding: '15px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                color: '#FFF',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                zIndex: 2000,
                minWidth: '180px'
              }}
            >
              {/* Audio Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', color: '#F4E8C1' }}>
                    {isMuted ? <VolumeX size={14} color="#F4E8C1" /> : <Volume2 size={14} color="#F4E8C1" />}
                    {isMuted ? 'Muted' : 'Volume'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#F4E8C1',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      fontFamily: "'MedievalSharp', serif",
                    }}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  style={{ width: '100%', accentColor: '#F4E8C1', cursor: 'pointer' }}
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border, #8B5E34)', margin: '4px 0' }} />

              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  import('../api').then(({ logout }) => {
                    logout();
                    navigate('/login');
                  });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--accent-color, #F4E8C1)',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Hero Level (Top Bar) */}
        <div className="home-stats-card home-stats-card--level">
          <div className="home-level-badge">
            <span className="home-level-num">{hero.level}</span>
          </div>
          <div className="home-level-info">
            <div className="home-stats-label">
              Hero Level&nbsp;
              <span className="home-xp-note">({hero.xp.toLocaleString()} XP)</span>
            </div>
            <div className="home-xp-track">
              <div className="home-xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Bottom Row: Points (Left) and Rank (Right) */}
        <div className="home-stats-row">

          {/* Tab 2: Hero Points (Left) */}
          <div className="home-stats-card home-stats-card--sub">
            <div className="home-stat-icon home-stat-icon--blue">
              <Shield size={16} color="#63B3ED" strokeWidth={2} />
            </div>
            <div>
              <div className="home-stats-label">Hero Points</div>
              <div className="home-stats-value">{hero.xp.toLocaleString()} XP</div>
            </div>
          </div>

          {/* Tab 3: Community Rank (Right) */}
          <div className="home-stats-card home-stats-card--sub">
            <div className="home-stat-icon home-stat-icon--gold">
              <Trophy size={16} color="#ECC94B" strokeWidth={2} />
            </div>
            <div>
              <div className="home-stats-label">Community Rank</div>
              <div className="home-stats-value">{hero.rank}</div>
            </div>
          </div>

        </div>

      </div>{/* /home-stats-container */}


      {/* ════════════════════════════════════════════════
          ISSUES LEGEND  (top-right floating panel)
      ════════════════════════════════════════════════ */}
      <div className="home-issues-panel">
        <div className="home-issues-title">ISSUES</div>
        {missions.length === 0 ? (
          <div className="home-no-issues">No issues yet</div>
        ) : (
          missions.map(m => (
            <div key={m.id} className="home-issue-row">
              <span
                className="home-issue-dot"
                style={{ background: getIssueColor(m.status) }}
              />
              <div>
                <div className="home-issue-status">{getIssueLabel(m.status)}</div>
                <div className="home-issue-name">{m.title}</div>
              </div>
            </div>
          ))
        )}
      </div>


      {/* ════════════════════════════════════════════════
          BOTTOM NAV  (centered pill at bottom)
      ════════════════════════════════════════════════ */}
      {/* Global Bottom Navigation Bar */}
      <BottomNav />

    </div>
  );
}
