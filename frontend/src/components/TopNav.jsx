import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Shield, Trophy, Star, LogOut, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api';

export default function TopNav() {
  const { hero, volume, setVolume, isMuted, setIsMuted } = useGame();
  const navigate = useNavigate();
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '70px',
      backgroundColor: 'var(--panel-bg)',
      borderBottom: '4px solid var(--panel-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 1000,
      boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
    }}>
      <div
        ref={dropdownRef}
        style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', position: 'relative' }}
        onClick={() => setShowLogout(!showLogout)}
      >
        <img
          src={getAvatarUrl(hero.avatar)}
          alt="Avatar"
          style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid var(--accent-color)', objectFit: 'cover' }}
        />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{hero.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Shield size={14} color="var(--primary-color)" /> Lvl {hero.level}
          </div>
        </div>

        {showLogout && (
          <div
            style={{
              position: 'absolute',
              top: '60px',
              left: '0',
              backgroundColor: 'var(--panel-bg)',
              border: '2px solid var(--panel-border)',
              padding: '15px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              color: 'var(--text-color)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              zIndex: 2000,
              minWidth: '180px'
            }}
          >
            {/* Audio Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {isMuted ? <VolumeX size={14} color="var(--accent-color)" /> : <Volume2 size={14} color="var(--accent-color)" />}
                  {isMuted ? 'Muted' : 'Volume'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-color)',
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
                style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '4px 0' }} />

            <div
              onClick={(e) => {
                e.stopPropagation();
                logout();
                navigate('/login');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--accent-color)',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={18} color="var(--accent-color)" />
          <span style={{ fontWeight: 'bold' }}>{hero.xp} XP</span>
        </div>
        <div className="glass-panel" style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} color="#C0C0C0" />
          <span style={{ fontWeight: 'bold' }}>{hero.rank}</span>
        </div>
      </div>
    </div>
  );
}
