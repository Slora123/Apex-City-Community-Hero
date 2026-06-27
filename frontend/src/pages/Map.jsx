import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, CheckSquare, Trophy, Scroll, Activity, MapPin as MapPinIcon } from 'lucide-react';
import { useGame } from '../context/GameContext';

/* ─────────────────────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Home',    path: '/dashboard',  Icon: Home },
  { label: 'Map',     path: '/map',        Icon: Map },
  { label: 'Mission', path: '/missions',   Icon: CheckSquare },
  { label: 'Report',  path: '/report',     Icon: Scroll },
  { label: 'Impact',  path: '/impact',     Icon: Activity },
  { label: 'Heatmap', path: '/heatmap',    Icon: MapPinIcon },
  { label: 'Leaderboard', path: '/leaderboard', Icon: Trophy },
];

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hero } = useGame();

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'OPEN_ISSUE') {
        navigate('/missions', { state: { openIssueId: event.data.issueId } });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const avatarUrl = hero?.avatar || 'male';
  const iframeSrc = `/map.html?avatar=${encodeURIComponent(avatarUrl)}`;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', background: '#0A0604', fontFamily: 'Inter, sans-serif' }}>
      {/* 3D Toon City Map Iframe */}
      <iframe
        src={iframeSrc}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="Cobblestone — A Toon City Walk"
      />

      {/* Navigation Overlay */}
      <nav className="home-bottom-nav" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, path, Icon }) => {
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
