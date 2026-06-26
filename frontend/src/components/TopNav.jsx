import React from 'react';
import { useGame } from '../context/GameContext';
import { Shield, Trophy, Star } from 'lucide-react';

export default function TopNav() {
  const { hero } = useGame();

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <img 
          src={getAvatarUrl(hero.avatar)} 
          alt="Avatar" 
          style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid var(--accent-color)' }}
        />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{hero.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Shield size={14} color="var(--primary-color)" /> Lvl {hero.level}
          </div>
        </div>
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
