import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { User } from 'lucide-react';
import { updateUser } from '../api';

export default function AvatarCreation() {
  const navigate = useNavigate();
  const { setHero, hero, refreshHero } = useGame();

  const [selectedType, setSelectedType] = useState('male');
  const [heroName, setHeroName] = useState('Hero');
  const [customFileUrl, setCustomFileUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleCustomClick = () => setSelectedType('custom');

  const handleUploadClick = (e) => {
    e.stopPropagation();
    setSelectedType('custom');
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomFileUrl(event.target.result);
        setSelectedType('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!heroName.trim()) { alert('Please enter a Hero name!'); return; }

    let finalAvatarUrl = '';
    if (selectedType === 'male') finalAvatarUrl = '/avtar1.png';
    else if (selectedType === 'female') finalAvatarUrl = '/avtar2.png';
    else {
      if (!customFileUrl) { alert('Please upload a custom photo or select an existing avatar.'); return; }
      finalAvatarUrl = customFileUrl;
    }

    try {
      if (hero && hero.id) {
        await updateUser(hero.id, { name: heroName.trim(), avatar: finalAvatarUrl });
        await refreshHero();
      } else {
        setHero((prev) => ({ ...prev, name: heroName.trim(), avatar: finalAvatarUrl }));
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save avatar on backend:', err);
      setHero((prev) => ({ ...prev, name: heroName.trim(), avatar: finalAvatarUrl }));
      navigate('/dashboard');
    }
  };

  /* ─── column position helper ───────────────────────────────────
     All values are percentages of the parchment image width/height,
     so they scale perfectly on every screen size automatically.   */
  const getColumnStyle = (left) => ({
    position: 'absolute',
    left,
    top: '34%',
    width: '21%',
    height: '26%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 10,
    gap: '4%',           // gap relative to column width
    touchAction: 'manipulation',
  });

  const getImageContainerStyle = (type) => ({
    width: '100%',
    aspectRatio: '1/1',
    borderRadius: '10px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    border: `3px solid ${selectedType === type ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
    boxShadow: selectedType === type
      ? '0 0 20px 5px rgba(212,175,55,0.5)'
      : '0 6px 12px rgba(0,0,0,0.6)',
    transition: 'all 0.3s ease',
    flexShrink: 0,
    overflow: 'hidden',
  });

  const getAvatarImageStyle = (type) => {
    const base = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.3s ease, object-position 0.3s ease',
    };
    if (type === 'male') {
      return {
        ...base,
        objectPosition: 'center 5%',
        transform: 'scale(1.05) translate(2%, 1.5%)',
      };
    }
    if (type === 'female') {
      return {
        ...base,
        objectPosition: 'center 15%',
        transform: 'scale(1.08) translate(-4%, -4%)',
      };
    }
    return base;
  };

  return (
    /* CSS class handles responsive padding + centering via @media */
    <div className="avatar-page">
      <div className="avatar-card-outer">

        {/* ── Parchment panel ──────────────────────────────────── */}
        <div style={{ position: 'relative', width: '100%' }}>

          {/* Background image: sets the card's natural height via aspect ratio */}
          <img
            src="/avtar_bg.png"
            alt="Hero Creation Panel"
            style={{ width: '100%', display: 'block' }}
          />

          {/* ── Male ─────────────────────────────────────────── */}
          <div style={getColumnStyle('15%')} onClick={() => setSelectedType('male')}>
            <div style={getImageContainerStyle('male')}>
              <img src="/avtar1.png" alt="Male Avatar" style={getAvatarImageStyle('male')} />
            </div>
            <span className="avatar-label">Male</span>
          </div>

          {/* ── Female ───────────────────────────────────────── */}
          <div style={getColumnStyle('41.5%')} onClick={() => setSelectedType('female')}>
            <div style={getImageContainerStyle('female')}>
              <img src="/avtar2.png" alt="Female Avatar" style={getAvatarImageStyle('female')} />
            </div>
            <span className="avatar-label">Female</span>
          </div>

          {/* ── Custom ───────────────────────────────────────── */}
          <div style={getColumnStyle('68%')} onClick={handleCustomClick}>
            <div
              style={{
                ...getImageContainerStyle('custom'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: customFileUrl ? 'transparent' : 'rgba(0,0,0,0.4)',
                borderStyle: customFileUrl ? 'solid' : (selectedType === 'custom' ? 'solid' : 'dashed'),
              }}
              onClick={handleUploadClick}
              title="Tap to upload a photo"
            >
              {customFileUrl
                ? <img src={customFileUrl} alt="Custom Preview" style={getAvatarImageStyle('custom')} />
                : <User size={28} color="rgba(255,255,255,0.5)" />
              }
            </div>
            <span className="avatar-label">Custom</span>
          </div>

          {/* ── Hero Name pill form ───────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              top: '63.5%',
              width: '54%',
              display: 'flex',
              alignItems: 'center',
              background: '#2b1a11',
              border: '2px solid #1a0f0a',
              borderRadius: '9999px',
              /* Padding uses clamp so it breathes on desktop but is tight on mobile */
              padding: 'clamp(2px, 0.5vw, 4px) clamp(2px, 0.5vw, 4px) clamp(2px, 0.5vw, 4px) clamp(10px, 3vw, 22px)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 3px 6px rgba(0,0,0,0.5)',
              zIndex: 20,
              boxSizing: 'border-box',
            }}
          >
            {/* Label + input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
              <span className="hero-name-label">HERO:</span>
              <input
                type="text"
                value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                placeholder="Hero"
                maxLength={15}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
                spellCheck="false"
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontFamily: "'MedievalSharp', serif",
                  /* ≥16px is mandatory on iOS to prevent the auto-zoom bug */
                  fontSize: '16px',
                  width: '100%',
                  minWidth: 0,
                  padding: '2px 0',
                  touchAction: 'manipulation',
                }}
              />
            </div>

            {/* Quill icon */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: '#c9a063', opacity: 0.8, flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a5.13 5.13 0 0 0-3.64 1.51L5 14.83a3.1 3.1 0 0 0-.71.95L3.06 19a1 1 0 0 0 .1.9A1 1 0 0 0 4 20h.09l3.22-1.23a3 3 0 0 0 .95-.71l10.32-10.32A5.13 5.13 0 0 0 19 3zm-2.23 4.6L16.4 7.23l1.41-1.41 1.41 1.41zM5.56 17.06a1 1 0 0 1 .32-.24L15 7.64l1.36 1.36-9.18 9.18a1 1 0 0 1-.24.32l-1.92.73z" />
              </svg>
            </div>

            {/* Enter button */}
            <button
              type="submit"
              style={{
                background: '#489a5f',
                border: 'none',
                borderRadius: '9999px',
                color: '#ffffff',
                fontFamily: "'MedievalSharp', serif",
                /* 16px to stay consistent; the pill container controls visual scale */
                fontSize: '16px',
                padding: 'clamp(5px, 1.2vw, 9px) clamp(8px, 2vw, 16px)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                touchAction: 'manipulation',
                minHeight: '34px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#52a86b'; e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#489a5f'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Enter
            </button>
          </form>

        </div>{/* end parchment panel */}

        {/* Hidden file picker */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

      </div>
    </div>
  );
}
