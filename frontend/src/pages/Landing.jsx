import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Store original background style properties
    const originalBgImage = document.body.style.backgroundImage;
    const originalBgColor = document.body.style.backgroundColor;

    // Apply clean dark background for landing map letterbox/pillarbox areas
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#18120c';

    return () => {
      // Restore global body background on navigate out
      document.body.style.backgroundImage = originalBgImage;
      document.body.style.backgroundColor = originalBgColor;
    };
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#18120c'
    }}>
      <style>{`
        .bg-cover-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-image: url('/landing.png');
          background-size: cover;
          background-position: center;
          box-shadow: 0 0 50px rgba(0,0,0,0.8);
        }
        @media (min-width: 769px) {
          @media (min-aspect-ratio: 16/9) {
            .bg-cover-container {
              width: 100vw;
              height: 56.25vw;
            }
          }
          
          @media (max-aspect-ratio: 16/9) {
            .bg-cover-container {
              width: 177.78vh;
              height: 100vh;
            }
          }
        }

        @media (max-width: 768px) {
          .bg-cover-container {
            background-image: url('/landing_mobile.png');
          }
          
          @media (min-aspect-ratio: 572/1024) {
            .bg-cover-container {
              width: 100vw;
              height: 179.02vw;
            }
          }
          
          @media (max-aspect-ratio: 572/1024) {
            .bg-cover-container {
              width: 55.86vh;
              height: 100vh;
            }
          }
        }
      `}</style>

      {/* Full-bleed responsive cover container keeping hotspots perfectly aligned */}
      <div className="bg-cover-container">
        {/* Logo in top-left */}
        <div style={{
          position: 'absolute',
          top: '4%',
          left: '4%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 20
        }}>
          <img
            src="/logo.png"
            alt="Apex City Logo"
            style={{
              height: 'min(7vw, 48px)',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))'
            }}
          />
          <span style={{
            fontFamily: "'MedievalSharp', serif",
            fontWeight: 'bold',
            fontSize: 'min(3.2vw, 22px)',
            color: '#F4E8C1',
            textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
            letterSpacing: '1px'
          }}>APEX CITY</span>
        </div>

        {/* Authority Dashboard Entry Plaque in top-right */}
        <button
          onClick={() => navigate('/authority')}
          style={{
            position: 'absolute',
            top: '4%',
            right: '4%',
            backgroundColor: 'rgba(60, 42, 33, 0.85)',
            border: '2px solid #8B5E34',
            borderRadius: '6px',
            padding: '6px 14px',
            color: '#F4E8C1',
            fontFamily: "'MedievalSharp', serif",
            fontWeight: 'bold',
            fontSize: 'min(2vw, 15px)',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(92, 64, 51, 0.95)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(60, 42, 33, 0.85)'}
        >
          <span>Authority</span>
        </button>

        {/* Hotspot overlay aligned perfectly with the START YOUR JOURNEY sign */}
        <button
          onClick={() => navigate('/login')}
          style={{
            position: 'absolute',
            left: '32%',
            width: '36%',
            bottom: '12%',
            height: '14%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
            zIndex: 10
          }}
          aria-label="Start Your Journey"
        />
      </div>
    </div>
  );
}
