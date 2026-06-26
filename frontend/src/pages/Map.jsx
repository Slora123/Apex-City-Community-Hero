import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, CheckSquare, Trophy, Scroll, Activity, MapPin as MapPinIcon } from 'lucide-react';

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

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0604', fontFamily: 'Inter, sans-serif' }}>
      {/* 3D Toon City Map Iframe */}
      <iframe
        src="/map.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="Cobblestone — A Toon City Walk"
      />

      {/* Navigation Overlay */}
      <nav style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'rgba(20, 10, 5, 0.96)',
        border: '2px solid #7A4A22',
        borderRadius: 9999,
        padding: '8px 10px',
        zIndex: 20,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
      }}>
        {NAV_ITEMS.map(({ label, path, Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '8px 20px',
                border: 'none',
                borderRadius: 9999,
                background: active ? 'rgba(212, 175, 55, 0.18)' : 'transparent',
                color: active ? '#D4AF37' : '#7A6A58',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 600,
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
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
