import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getLeaderboard, getAchievements } from '../api';
import { Trophy, Award, Lock, Unlock, Home, Map, CheckSquare, Scroll, X, Shield, Star, Activity, MapPin } from 'lucide-react';

/* ── CUSTOM MEDIEVAL BADGE SVG LOGOS ─────────────────────────── */

// 1. Initiate Scroll Badge (Unlocked at 0 XP)
const InitiateBadge = ({ locked }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: locked ? 'grayscale(100%) opacity(0.4)' : 'none', transition: 'all 0.3s ease' }}>
    <circle cx="50" cy="50" r="45" fill="#5C4033" stroke="#D4AF37" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="40" fill="#F4E8C1" />
    {/* Parchment Scroll */}
    <path d="M32,35 C32,30 42,30 42,35 L42,65 C42,70 32,70 32,65 Z" fill="#D2B48C" stroke="#4A3B32" strokeWidth="2.5" />
    <path d="M42,35 L68,35 C73,35 73,40 68,40 L42,40 Z" fill="#EEDC82" stroke="#4A3B32" strokeWidth="2" />
    <path d="M44,45 L62,45" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" />
    <path d="M44,52 L58,52" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" />
    <path d="M44,59 L65,59" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" />
    <path d="M32,65 L68,65 C73,65 73,70 68,70 L32,70 Z" fill="#D2B48C" stroke="#4A3B32" strokeWidth="2.5" />
    {/* Red Wax Seal */}
    <circle cx="55" cy="50" r="8" fill="#B53F3F" stroke="#7E2A2A" strokeWidth="1" />
    <path d="M53,56 L50,66 L55,63 L60,66 L57,56 Z" fill="#B53F3F" stroke="#7E2A2A" strokeWidth="1" />
  </svg>
);

// 2. Pathfinder Compass Badge (Unlocked at 500 XP)
const PathfinderBadge = ({ locked }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: locked ? 'grayscale(100%) opacity(0.4)' : 'none', transition: 'all 0.3s ease' }}>
    <circle cx="50" cy="50" r="45" fill="#2B3E50" stroke="#D4AF37" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="40" fill="#1A2530" />
    {/* Gold Compass Ring */}
    <circle cx="50" cy="50" r="28" fill="none" stroke="#D4AF37" strokeWidth="3.5" strokeDasharray="32,4" />
    {/* Compass Needle */}
    <polygon points="50,24 55,48 45,48" fill="#B53F3F" stroke="#7E2A2A" strokeWidth="1" />
    <polygon points="50,76 55,52 45,52" fill="#F4E8C1" stroke="#8B7E66" strokeWidth="1" />
    {/* Dial center */}
    <circle cx="50" cy="50" r="6" fill="#FFF" stroke="#222" strokeWidth="2" />
    <circle cx="50" cy="50" r="2" fill="#B53F3F" />
    {/* Compass directions (North star details) */}
    <polygon points="50,14 52,22 48,22" fill="#D4AF37" />
    <polygon points="50,86 52,78 48,78" fill="#D4AF37" />
    <polygon points="14,50 22,52 22,48" fill="#D4AF37" />
    <polygon points="86,50 78,52 78,48" fill="#D4AF37" />
  </svg>
);

// 3. Stone Warden Hammer Badge (Unlocked at 1000 XP)
const StoneWardenBadge = ({ locked }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: locked ? 'grayscale(100%) opacity(0.4)' : 'none', transition: 'all 0.3s ease' }}>
    <circle cx="50" cy="50" r="45" fill="#4E4F51" stroke="#D4AF37" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="40" fill="#353638" />
    {/* Shield */}
    <path d="M50,24 C64,24 70,29 70,46 C70,62 50,78 50,78 C50,78 30,62 30,46 C30,29 36,24 50,24 Z" fill="#7C4724" stroke="#D4AF37" strokeWidth="2.5" />
    <path d="M50,28 C61,28 66,32 66,46 C66,59 50,73 50,73 C50,73 34,59 34,46 C34,32 39,28 50,28 Z" fill="#5C3317" />
    {/* Crossed Hammers */}
    <g transform="translate(50, 46) rotate(45) translate(-50, -46)">
      <rect x="47" y="22" width="6" height="48" rx="2.5" fill="#A0522D" stroke="#222" strokeWidth="1.5" />
      <rect x="34" y="24" width="32" height="12" rx="2" fill="#C0C0C0" stroke="#222" strokeWidth="1.5" />
      <rect x="42" y="20" width="16" height="20" fill="#8F8F8F" stroke="#222" strokeWidth="1.5" />
    </g>
  </svg>
);

// 4. Aqueduct Hydrologist Badge (Unlocked at 2000 XP)
const AqueductBadge = ({ locked }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: locked ? 'grayscale(100%) opacity(0.4)' : 'none', transition: 'all 0.3s ease' }}>
    <circle cx="50" cy="50" r="45" fill="#1C4519" stroke="#D4AF37" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="40" fill="#113010" />
    {/* Stone Arch */}
    <path d="M26,74 L26,46 A24,24 0 0,1 74,46 L74,74 Z" fill="#7A8B99" stroke="#3A434C" strokeWidth="3.5" />
    <path d="M34,74 L34,46 A16,16 0 0,1 66,46 L66,74 Z" fill="#113010" stroke="#3A434C" strokeWidth="2.5" />
    {/* Water drop inside */}
    <path d="M50,36 C50,36 38,48 38,57 C38,64.5 43.5,70 50,70 C56.5,70 62,64.5 62,57 C62,48 50,36 50,36 Z" fill="#4CC9F0" stroke="#3D348B" strokeWidth="2" />
    {/* Sparkle */}
    <circle cx="45" cy="52" r="3" fill="#FFF" opacity="0.85" />
    <circle cx="55" cy="60" r="2" fill="#FFF" opacity="0.85" />
  </svg>
);

// 5. Grand Illuminator Badge (Unlocked at 3500 XP)
const IlluminatorBadge = ({ locked }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: locked ? 'grayscale(100%) opacity(0.4)' : 'none', transition: 'all 0.3s ease' }}>
    <circle cx="50" cy="50" r="45" fill="#4A3B32" stroke="#D4AF37" strokeWidth="3.5" />
    <circle cx="50" cy="50" r="40" fill="#2E241E" />
    {/* Light rays radial glow */}
    <circle cx="50" cy="50" r="22" fill="#FFD166" opacity="0.25" />
    <circle cx="50" cy="50" r="14" fill="#FFD166" opacity="0.45" />
    {/* Lantern housing */}
    <polygon points="38,36 62,36 65,66 35,66" fill="#2D2018" stroke="#D4AF37" strokeWidth="2.5" />
    <rect x="42" y="30" width="16" height="6" rx="1" fill="#D4AF37" stroke="#2D2018" strokeWidth="1.5" />
    {/* Glass inner with fire glow */}
    <polygon points="42,39 58,39 60,63 40,63" fill="#FFF" opacity="0.3" />
    <circle cx="50" cy="51" r="7" fill="#FFFBE6" />
    <circle cx="50" cy="51" r="3" fill="#FFD166" />
    {/* Rays */}
    <line x1="50" y1="24" x2="50" y2="14" stroke="#FFD166" strokeWidth="3" strokeLinecap="round" />
    <line x1="50" y1="76" x2="50" y2="86" stroke="#FFD166" strokeWidth="3" strokeLinecap="round" />
    <line x1="24" y1="50" x2="14" y2="50" stroke="#FFD166" strokeWidth="3" strokeLinecap="round" />
    <line x1="76" y1="50" x2="86" y2="50" stroke="#FFD166" strokeWidth="3" strokeLinecap="round" />
    <line x1="31" y1="31" x2="24" y2="24" stroke="#FFD166" strokeWidth="2" strokeLinecap="round" />
    <line x1="69" y1="31" x2="76" y2="24" stroke="#FFD166" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 6. Legendary Champion Badge (Unlocked at 5000 XP)
const ChampionBadge = ({ locked }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: locked ? 'grayscale(100%) opacity(0.4)' : 'none', transition: 'all 0.3s ease' }}>
    {/* Ray burst behind */}
    <g stroke="#D4AF37" strokeWidth="2.5" opacity="0.6">
      <line x1="50" y1="8" x2="50" y2="92" />
      <line x1="8" y1="50" x2="92" y2="50" />
      <line x1="20" y1="20" x2="80" y2="80" />
      <line x1="20" y1="80" x2="80" y2="20" />
    </g>
    <circle cx="50" cy="50" r="38" fill="#B53F3F" stroke="#D4AF37" strokeWidth="4" />
    {/* Crown */}
    <path d="M28,62 L28,40 L38,48 L50,33 L62,48 L72,40 L72,62 Z" fill="#D4AF37" stroke="#3E2723" strokeWidth="2" />
    <rect x="28" y="62" width="44" height="5" fill="#8B0000" stroke="#3E2723" strokeWidth="1.5" />
    {/* Little jewels */}
    <circle cx="28" cy="40" r="2.5" fill="#FFF" />
    <circle cx="38" cy="48" r="2" fill="#4CC9F0" />
    <circle cx="50" cy="33" r="2.5" fill="#FFF" />
    <circle cx="62" cy="48" r="2" fill="#4CC9F0" />
    <circle cx="72" cy="40" r="2.5" fill="#FFF" />
    {/* Central Ruby */}
    <polygon points="50,50 54,55 50,60 46,55" fill="#B53F3F" stroke="#D4AF37" strokeWidth="1" />
  </svg>
);

/* ── CONFIGURATIONS ─────────────────────────────────────────── */

const ACHIEVEMENTS = [
  {
    id: 'a1',
    title: 'Guild Initiate',
    description: 'Officially entered the ranks. The ledger of service lies open!',
    xpRequired: 0,
    Logo: InitiateBadge,
    reward: 'Guild Rank unlocked'
  },
  {
    id: 'a2',
    title: 'Apprentice Pathfinder',
    description: 'Gained familiarity with the map and traced initial anomalies.',
    xpRequired: 500,
    Logo: PathfinderBadge,
    reward: 'Pathfinder Compass badge'
  },
  {
    id: 'a3',
    title: 'Stone Warden',
    description: 'Outstanding civic diligence in reporting crumbling flagstones.',
    xpRequired: 1000,
    Logo: StoneWardenBadge,
    reward: 'Masonry Crest unlocked'
  },
  {
    id: 'a4',
    title: 'Aqueduct Hydrologist',
    description: 'Stood watch over local waters and mapped major aqueduct ruptures.',
    xpRequired: 2000,
    Logo: AqueductBadge,
    reward: 'Water Emblem unlocked'
  },
  {
    id: 'a5',
    title: 'Grand Illuminator',
    description: 'Dispelled the darkness by cataloging broken town lanterns.',
    xpRequired: 3500,
    Logo: IlluminatorBadge,
    reward: 'Sunlight Sigil unlocked'
  },
  {
    id: 'a6',
    title: 'Legendary Champion',
    description: 'Achieved ultimate prestige. A hero of the town archives!',
    xpRequired: 5000,
    Logo: ChampionBadge,
    reward: 'Guild Crown & Title'
  }
];

const BASE_LEADERBOARD = [
  { name: 'Galahad the Swift', level: 4, xp: 18500, avatar: '🛡️', rankName: 'Knight Warden' },
  { name: 'Warden Elara', level: 3, xp: 12200, avatar: '🏹', rankName: 'Master Ranger' },
  { name: 'Arthor Stone', level: 2, xp: 6400, avatar: '⚒️', rankName: 'Guild Artisan' },
  { name: 'Apprentice Cedric', level: 1, xp: 3200, avatar: '🕯️', rankName: 'Apprentice' },
  { name: 'Scribe Maeve', level: 1, xp: 1500, avatar: '📜', rankName: 'Novice Scribe' },
  { name: 'Page Bran', level: 1, xp: 450, avatar: '🍂', rankName: 'Page Apprentice' }
];

import BottomNav from '../components/BottomNav';

export default function Leaderboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hero } = useGame();

  const getAvatarUrl = (avatar) => {
    if (!avatar) return '/avtar1.png';
    if (avatar === 'male' || avatar === '/avtar1.png') return '/avtar1.png';
    if (avatar === 'female' || avatar === '/avtar2.png') return '/avtar2.png';
    return avatar;
  };

  const renderAvatar = (avatar) => {
    if (!avatar) return <span style={{ fontSize: '1.4rem', marginRight: '10px' }}>🧙</span>;
    if (avatar.length <= 2 && avatar !== 'male' && avatar !== 'female') {
      return <span style={{ fontSize: '1.4rem', marginRight: '10px' }}>{avatar}</span>;
    }
    return (
      <img
        src={getAvatarUrl(avatar)}
        alt="Avatar"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '1.5px solid #5A4B3D',
          marginRight: '10px',
          objectFit: 'cover'
        }}
      />
    );
  };

  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'achievements'
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [apiLeaderboard, setApiLeaderboard] = useState(null);
  const [apiAchievements, setApiAchievements] = useState(null);
  const [loadingLB, setLoadingLB] = useState(false);

  // Fetch real leaderboard from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoadingLB(true);
      try {
        const data = await getLeaderboard('national');
        if (data && data.leaderboard) {
          setApiLeaderboard(data.leaderboard.map(u => ({
            name: u.name,
            level: u.level,
            xp: u.xp,
            avatar: u.avatar || '🧙',
            rankName: u.rank || 'Guild Member',
            isCurrentUser: u.isCurrentUser || false,
            totalMissions: u.totalMissions || 0
          })));
        }
      } catch (err) {
        console.warn('Could not load leaderboard from backend:', err.message);
      } finally {
        setLoadingLB(false);
      }
    };
    fetchData();
  }, []);

  // Fetch achievements if user is logged in
  useEffect(() => {
    if (!hero.id) return;
    getAchievements(hero.id).then(data => {
      if (data && data.badges) setApiAchievements(data.badges);
    }).catch(() => {});
  }, [hero.id]);

  // Compile leaderboard — strictly use API data, fallback to empty array
  const sortedLeaderboard = apiLeaderboard || [];

  // Find user's position
  const heroRankIndex = sortedLeaderboard.findIndex(user => user.isCurrentUser);

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

        /* Wood panel dialog */
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

        /* Stone Header Pill */
        .stone-header {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: #7F7F7F;
          background-image: linear-gradient(135deg, #8A8A8A 0%, #5E5E5E 100%);
          border: 3px solid #3C3C3C;
          border-radius: 12px;
          padding: 10px 28px;
          color: #FFF;
          font-family: 'MedievalSharp', serif;
          font-size: 1.3rem;
          font-weight: 900;
          text-shadow: 2px 2px 0 #000;
          box-shadow: 0 5px 12px rgba(0,0,0,0.6);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Tab buttons */
        .tab-btn {
          flex: 1;
          background: #5C4033;
          border: 2px solid #3E2D24;
          color: #B3A387;
          font-family: 'MedievalSharp', serif;
          font-size: 1.1rem;
          font-weight: bold;
          padding: 10px 0;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
        }
        .tab-btn--active {
          background: #F4E8C1;
          color: #2D1B13;
          border-color: #5A4B3D;
          box-shadow: inset 0 0 10px rgba(139,94,52,0.3);
        }
        .tab-btn:first-child {
          border-radius: 8px 0 0 8px;
        }
        .tab-btn:last-child {
          border-radius: 0 8px 8px 0;
          border-left: none;
        }

        /* Parchment lists */
        .parchment-container {
          background: #F4E8C1;
          border: 3px solid #5A4B3D;
          border-radius: 12px;
          color: #2D1B13;
          padding: 16px 12px;
          box-shadow: inset 0 0 15px rgba(139,94,52,0.25), 0 4px 8px rgba(0,0,0,0.3);
          max-height: 440px;
          overflow-y: auto;
        }

        /* Leaderboard row styles */
        .leaderboard-row {
          display: flex;
          align-items: center;
          padding: 10px 8px;
          border-bottom: 1px dashed rgba(90, 75, 61, 0.25);
          transition: transform 0.2s;
        }
        .leaderboard-row:last-child {
          border-bottom: none;
        }
        .leaderboard-row--current {
          background: rgba(212, 175, 55, 0.15);
          border: 2px solid #D4AF37;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(212,175,55,0.25);
          transform: scale(1.01);
        }

        /* Medal/Rank bubbles */
        .rank-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.95rem;
          font-family: 'MedievalSharp', serif;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .rank-gold {
          background: #FFD166;
          color: #8A6400;
          border: 2px solid #D4AF37;
          box-shadow: 0 2px 4px rgba(212,175,55,0.4);
        }
        .rank-silver {
          background: #E6E6E6;
          color: #555;
          border: 2px solid #B0B0B0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }
        .rank-bronze {
          background: #EAA87A;
          color: #7A3B18;
          border: 2px solid #B06B43;
          box-shadow: 0 2px 4px rgba(176,107,67,0.3);
        }
        .rank-normal {
          color: #8B7E66;
          border: 1.5px solid #8B7E66;
          background: transparent;
        }

        /* Achievements grid card */
        .achievement-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 4px;
        }
        .achievement-card {
          aspect-ratio: 0.82;
          background: rgba(255,255,255,0.35);
          border: 2px solid #5A4B3D;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        }
        .achievement-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.18);
          background: rgba(255,255,255,0.5);
        }
        .achievement-card--locked {
          background: rgba(45, 27, 19, 0.05);
          border-color: rgba(90, 75, 61, 0.4);
        }
        .achievement-card--locked:hover {
          background: rgba(45, 27, 19, 0.08);
        }
        .lock-indicator {
          position: absolute;
          top: 4px;
          right: 4px;
          color: #B53F3F;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        /* Detail Modal Overlay */
        .badge-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 6, 4, 0.82);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .badge-modal {
          background: #F4E8C1;
          border: 6px double #8B5E34;
          border-radius: 14px;
          color: #2D1B13;
          padding: 28px 20px;
          max-width: 380px;
          width: 100%;
          text-align: center;
          box-shadow: 0 15px 40px rgba(0,0,0,0.85), inset 0 0 35px rgba(139,94,52,0.15);
          animation: modalAppear 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.2);
        }
        @keyframes modalAppear {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="wood-panel" style={{ marginTop: '24px' }}>
        {/* Stone header title */}
        <div className="stone-header">
          <Trophy size={20} strokeWidth={2.5} />
          <span className="medieval-font">Guild Records</span>
        </div>

        {/* Close Button top-right */}
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

        {/* Medieval Navigation Tabs */}
        <div style={{ display: 'flex', width: '100%', marginBottom: '18px', marginTop: '15px' }}>
          <button
            className={`tab-btn ${activeTab === 'leaderboard' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
          <button
            className={`tab-btn ${activeTab === 'achievements' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
        </div>

        {/* ── TAB 1: LEADERBOARD CONTENT ────────────────────────── */}
        {activeTab === 'leaderboard' && (
          <div className="parchment-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#5A4B3D', borderBottom: '2.5px solid #5A4B3D', paddingBottom: '6px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Rank & Guild Member</span>
              <span>Level / XP</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sortedLeaderboard.map((user, index) => {
                const rankNum = index + 1;
                let rankClass = 'rank-normal';
                if (rankNum === 1) rankClass = 'rank-gold';
                else if (rankNum === 2) rankClass = 'rank-silver';
                else if (rankNum === 3) rankClass = 'rank-bronze';

                return (
                  <div
                    key={user.name}
                    className={`leaderboard-row ${user.isCurrentUser ? 'leaderboard-row--current' : ''}`}
                  >
                    {/* Rank badge circle */}
                    <div className={`rank-badge ${rankClass}`}>
                      {rankNum}
                    </div>

                    {/* Avatar Graphic or Emoji */}
                    {renderAvatar(user.avatar)}

                    {/* Member Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.name}
                        </span>
                        {user.isCurrentUser && (
                          <span style={{ background: '#2E6B2A', color: '#FFF', fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', padding: '2px 5px', borderRadius: '4px', border: '1px solid #1C4519' }}>
                            You
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#5C4A38', fontWeight: 600, marginTop: '1px' }}>
                        {user.rankName}
                      </div>
                    </div>

                    {/* Level / XP stats */}
                    <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '8px' }}>
                      <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#2D1B13' }}>
                        Lvl {user.level}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#8B5E34', fontWeight: 800, marginTop: '1px' }}>
                        {user.xp.toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky summary card at the bottom of parchment if user is low down */}
            {heroRankIndex >= 3 && (
              <div style={{
                marginTop: '14px',
                background: '#EEDC82',
                border: '2px solid #8B5E34',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#3E2723',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={14} fill="#8B5E34" color="#8B5E34" />
                  <span>Ranked #{heroRankIndex + 1} overall in the Guild</span>
                </div>
                <span>Lvl {hero.level} / {hero.xp} XP</span>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: ACHIEVEMENTS GRID ─────────────────────────── */}
        {activeTab === 'achievements' && (
          <div className="parchment-container">
            <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#5A4B3D', borderBottom: '2.5px solid #5A4B3D', paddingBottom: '8px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Guild Badges & Crests
            </div>

            <div className="achievement-grid">
              {ACHIEVEMENTS.map(ach => {
                // Check from real API data if available, else fall back to XP threshold
                const apiMatch = apiAchievements?.find(a => a.type === ach.id.replace('a', 'badge_'));
                const isUnlocked = apiMatch ? apiMatch.earned : hero.xp >= ach.xpRequired;
                const LogoComponent = ach.Logo;

                return (
                  <div
                    key={ach.id}
                    className={`achievement-card ${!isUnlocked ? 'achievement-card--locked' : ''}`}
                    onClick={() => setSelectedBadge(ach)}
                  >
                    {/* Locked icon overlay */}
                    {!isUnlocked && (
                      <div className="lock-indicator">
                        <Lock size={11} strokeWidth={3} />
                      </div>
                    )}

                    {/* SVG Badge rendering */}
                    <div style={{ width: '56px', height: '56px', marginBottom: '8px' }}>
                      <LogoComponent locked={!isUnlocked} />
                    </div>

                    {/* Badge Title */}
                    <span style={{
                      fontSize: '0.73rem',
                      fontWeight: 900,
                      color: isUnlocked ? '#2D1B13' : '#7A6A58',
                      textAlign: 'center',
                      lineHeight: '1.2',
                      wordBreak: 'break-word',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {ach.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Helpful scroll description footer */}
            <div style={{
              marginTop: '16px',
              textAlign: 'center',
              fontSize: '0.78rem',
              color: '#5C4A38',
              fontStyle: 'italic',
              fontWeight: 600
            }}>
              Tap a crest to view credentials and required civic points.
            </div>
          </div>
        )}

        {/* Quick summary footer inside wood panel */}
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
          <span>Petitions Resolved: {sortedLeaderboard[heroRankIndex]?.totalMissions ?? hero.totalMissions ?? 0}</span>
          <span style={{ color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Award size={16} />
            <span>{hero.xp.toLocaleString()} Total XP</span>
          </span>
        </div>
      </div>

      {/* ── BADGE DETAIL MODAL ───────────────────────────────────── */}
      {selectedBadge && (
        <div className="badge-modal-overlay" onClick={() => setSelectedBadge(null)}>
          <div className="badge-modal" onClick={e => e.stopPropagation()}>
            <h3 className="medieval-font" style={{ fontSize: '1.45rem', fontWeight: 900, color: '#3E2723', marginBottom: '14px', textTransform: 'uppercase' }}>
              {selectedBadge.title}
            </h3>

            {/* Badge Large Display */}
            <div style={{ width: '110px', height: '110px', margin: '0 auto 16px auto', position: 'relative' }}>
              <selectedBadge.Logo locked={hero.xp < selectedBadge.xpRequired} />
              {hero.xp < selectedBadge.xpRequired && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.15)',
                  borderRadius: '50%'
                }}>
                  <div style={{ background: '#FFF', padding: '6px', borderRadius: '50%', border: '2px solid #B53F3F', display: 'flex', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
                    <Lock size={20} color="#B53F3F" strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.92rem', color: '#2D1B13', margin: '0 0 16px 0', lineHeight: '1.45', fontWeight: 600 }}>
              {selectedBadge.description}
            </p>

            {/* Requirements Box */}
            <div style={{
              background: 'rgba(46, 26, 10, 0.06)',
              border: '1.5px dashed #5C4033',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.82rem',
              color: '#3E2723',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 800 }}>
                <span>Requirement:</span>
                <span style={{ color: '#8B5E34' }}>{selectedBadge.xpRequired.toLocaleString()} XP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 800 }}>
                <span>Guild Status:</span>
                {hero.xp >= selectedBadge.xpRequired ? (
                  <span style={{ color: '#2E6B2A', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Unlock size={12} strokeWidth={3} /> Unlocked
                  </span>
                ) : (
                  <span style={{ color: '#B53F3F', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Lock size={12} strokeWidth={3} /> Locked (Needs {(selectedBadge.xpRequired - hero.xp).toLocaleString()} XP)
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Guild Reward:</span>
                <span style={{ fontStyle: 'italic', color: '#2E6B2A' }}>{selectedBadge.reward}</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedBadge(null)}
              style={{
                width: '100%',
                background: '#5C4033',
                border: '2.5px solid #3E2D24',
                color: '#F4E8C1',
                fontWeight: 'bold',
                padding: '12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                boxShadow: '0 3px 6px rgba(0,0,0,0.2)'
              }}
              className="medieval-font"
            >
              Close Record
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM NAVIGATION PILL ────────────────────────────────── */}
      <BottomNav />

    </div>
  );
}
